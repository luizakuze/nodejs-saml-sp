/**
 * @file config/federationLoader.js
 *
 * Processa o metadado da federação SAML.
 * Constrói dinamicamente a configuração dos provedores de identidade (IdPs) a partir do metadata XML.
 *
 */

require('dotenv').config();

const axios = require('axios');
const metadata = require('passport-saml-metadata');
const { DOMParser, XMLSerializer } = require('@xmldom/xmldom');
const xpath = require('xpath');
const cron = require('node-cron');
const fs = require('fs/promises');
const path = require('path');
const os = require('os');

// URLs e caminhos de cache derivados do .env
const FED_URL = process.env.SAML_METADATA;
const FQDN = process.env.FQDN || 'localhost';
const PORT = process.env.PORT || '8000';
const BASE_URL = `https://${FQDN}:${PORT}`;
const SAML_ISSUER = `${BASE_URL}/saml2/metadata/`;

const CACHE_DIR = path.join(os.tmpdir(), 'fed-cache');
const CACHE_XML = path.join(CACHE_DIR, 'ds-metadata.xml');

// Certificados do provedor de serviço (SP) para assinatura e encriptação
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

// Armazena as configurações dos IdPs indexadas por entityID
let idpIndex = Object.create(null);

/**
 * Atualiza o metadata da federação, parseia o XML e extrai as configurações de cada IdP.
 * Os resultados são armazenados em memória e acessíveis via getConfig().
 */
async function refreshMetadata() {
  await fs.mkdir(CACHE_DIR, { recursive: true });

  let xml;
  try {
    const resp = await axios.get(FED_URL, { timeout: 5000 });
    xml = resp.data;
    await fs.writeFile(CACHE_XML, xml);
  } catch (err) {
    if (await fileExists(CACHE_XML)) {
      xml = await fs.readFile(CACHE_XML, 'utf-8');
    } else {
      throw new Error(`Impossível baixar nem ler cache: ${err.message}`);
    }
  }

  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const select = xpath.useNamespaces({
    md: 'urn:oasis:names:tc:SAML:2.0:metadata',
    ds: 'http://www.w3.org/2000/09/xmldsig#'
  });
  const nodes = select('//md:EntityDescriptor[md:IDPSSODescriptor]', doc);

  idpIndex = Object.fromEntries(
    nodes
      .map(node => {
        const idpXml = new XMLSerializer().serializeToString(node);
        const reader = new metadata.MetadataReader(idpXml);
        const cfg = metadata.toPassportConfig(reader, { multipleCerts: true });

        let certs = [].concat(cfg.cert, cfg.certs, cfg.certificate, cfg.certificates).filter(Boolean);

        if (certs.length === 0) {
          const certNodes = select('.//ds:X509Certificate', node);
          certs = certNodes.map(certNode => certNode.textContent);
        }

        const normalizedCerts = certs.map(c => typeof c === 'string' ? c.replace(/\s+/g, '') : c);

        if (normalizedCerts.length === 0) return null;

        return [reader.entityId, {
          entryPoint: cfg.entryPoint,
          logoutUrl: cfg.logoutUrl,
          idpCert: normalizedCerts.length === 1 ? normalizedCerts[0] : normalizedCerts,
          issuer: SAML_ISSUER,
          callbackUrl: `${BASE_URL}/login/callback`,
          identifierFormat: 'urn:oasis:names:tc:SAML:2.0:nameid-format:persistent',
          wantAssertionsSigned: true,
          authnRequestBinding: 'HTTP-Redirect',
          signRequest: true,
          cert: spCert,
          privateKey: spKey,
          decryptionPvk: spKey
        }];
      })
      .filter(Boolean)
  );
}

/**
 * Verifica se um arquivo existe no sistema de arquivos.
 * @param {string} f Caminho completo do arquivo
 * @returns {Promise<boolean>} Verdadeiro se o arquivo existe
 */
function fileExists(f) {
  return fs.stat(f).then(() => true).catch(() => false);
}

// Inicializa o metadado ao iniciar o app e agenda atualização periódica a cada 6 horas
(async () => {
  await refreshMetadata();
  cron.schedule('0 */6 * * *', refreshMetadata);
})();

/**
 * Retorna a configuração de um IdP a partir do seu entityID.
 * @param {string} entityID O identificador único do IdP
 * @returns {object} Objeto de configuração compatível com passport-saml
 * @throws Se o IdP não for encontrado no índice carregado
 */
function getConfig(entityID) {
  const cfg = idpIndex[entityID];
  if (!cfg) throw new Error(`IdP ${entityID} não encontrado no metadata`);
  return cfg;
}

/**
 * Lista todos os entityIDs disponíveis na federação carregada.
 * @returns {string[]} Lista de entityIDs dos IdPs disponíveis
 */
function listIdps() {
  return Object.keys(idpIndex);
}

module.exports = {
  getConfig,
  listIdps
};
