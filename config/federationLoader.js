const axios = require('axios');
const metadata = require('passport-saml-metadata');
const { DOMParser, XMLSerializer } = require('@xmldom/xmldom');
const xpath = require('xpath');
const cron = require('node-cron');
const fs = require('fs/promises');
const path = require('path');
const os = require('os');

const FED_URL = process.env.FED_METADATA_URL || 'https://ds.cafeexpresso.rnp.br/metadata/ds-metadata.xml';
const CACHE_DIR = process.env.FED_METADATA_CACHE_DIR || path.join(os.tmpdir(), 'fed-cache');
const CACHE_XML = path.join(CACHE_DIR, 'ds-metadata.xml');

// ⚠️ Leitura do certificado e chave privada do SP
let spCert, spKey;
(async () => {
  try {
    spCert = await fs.readFile('./certs/sp-public-cert.pem', 'utf-8');
    spKey  = await fs.readFile('./certs/sp-private-key.pem', 'utf-8');
  } catch (e) {
    console.error('Erro ao carregar chave/cert do SP:', e.message);
    process.exit(1);
  }
})();

let idpIndex = Object.create(null);

async function refreshMetadata() {
  await fs.mkdir(CACHE_DIR, { recursive: true });

  let xml;
  try {
    const resp = await axios.get(FED_URL, { timeout: 5000 });
    xml = resp.data;
    await fs.writeFile(CACHE_XML, xml);
    console.log('☁  Metadata da federação baixado');
  } catch (err) {
    if (await fileExists(CACHE_XML)) {
      xml = await fs.readFile(CACHE_XML, 'utf-8');
      console.warn('⚠️  Usando metadata do cache (download falhou).');
    } else {
      throw new Error(`Impossível baixar nem ler cache: ${err.message}`);
    }
  }

  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const select = xpath.useNamespaces({ md: 'urn:oasis:names:tc:SAML:2.0:metadata', ds: 'http://www.w3.org/2000/09/xmldsig#' });
  const nodes = select('//md:EntityDescriptor[md:IDPSSODescriptor]', doc);

  idpIndex = Object.fromEntries(
    nodes
      .map(node => {
        const idpXml = new XMLSerializer().serializeToString(node);
        const reader = new metadata.MetadataReader(idpXml);
        const cfg = metadata.toPassportConfig(reader, { multipleCerts: true });

        let certs = [].concat(
          cfg.cert ?? [],
          cfg.certs ?? [],
          cfg.certificate ?? [],
          cfg.certificates ?? []
        ).filter(Boolean);

        if (certs.length === 0) {
          const certNodes = select('.//ds:X509Certificate', node);
          certs = certNodes.map(certNode => certNode.textContent);
          console.warn(`⚠️  ${reader.entityId} – certificados extraídos manualmente:`, certs.length);
        }

        const normalizedCerts = certs.map(c =>
          typeof c === 'string' ? c.replace(/\s+/g, '') : c
        );

        if (normalizedCerts.length === 0) {
          console.warn(`⚠️  IdP ${reader.entityId} sem certificado – ignorado`);
          return null;
        }

        return [reader.entityId, {
          entryPoint: cfg.entryPoint,
          logoutUrl: cfg.logoutUrl,
          idpCert: normalizedCerts.length === 1 ? normalizedCerts[0] : normalizedCerts,

          issuer: process.env.SAML_ISSUER,
          callbackUrl: `${process.env.BASE_URL}/login/callback`,
          identifierFormat: 'urn:oasis:names:tc:SAML:2.0:nameid-format:persistent',

          wantAssertionsSigned: true,
          authnRequestBinding: 'HTTP-Redirect', // <-- ALTERADO AQUI
          signRequest: true,                // <-- MANTIDO

          // SP config necessário para assinatura
          cert: spCert,
          privateKey: spKey,
          // <-- chave para descriptografar Assertions encriptadas
          decryptionPvk: spKey,
        }];
      })
      .filter(Boolean)
  );

  console.log(`✅  ${Object.keys(idpIndex).length} IdPs carregados`);
}

function fileExists(f) {
  return fs.stat(f).then(() => true).catch(() => false);
}

(async () => {
  await refreshMetadata();
  cron.schedule('0 */6 * * *', refreshMetadata);
})();

module.exports = {
  getConfig(entityID) {
    const cfg = idpIndex[entityID];
    if (!cfg) throw new Error(`IdP ${entityID} não encontrado no metadata`);
    return cfg;
  },
  listIdps() {
    return Object.keys(idpIndex);
  }
};
