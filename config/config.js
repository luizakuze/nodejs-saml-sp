/**
 * @file config/config.js
 * 
 * Configuração da aplicação e do Passport-SAML baseada em variáveis de ambiente.
 * @module config
 */

require('dotenv').config(); // garante carregamento do .env

const os = require('os');
const fileCache = require('file-system-cache').default;

// leitura com fallback seguro
const FQDN = process.env.FQDN || 'localhost';
const PORT = process.env.PORT || '8000';

// monta dinamicamente a URL base e o entityID (issuer)
const BASE_URL = `https://${FQDN}:${PORT}`;
const SAML_ISSUER = `${BASE_URL}/saml2/metadata/`;

// URL do metadata da federação SAML (IdPs disponíveis)
const SAML_METADATA_URL = 'https://ds.cafeexpresso.rnp.br/metadata/ds-metadata.xml';

module.exports = {
  development: {
    app: {
      name: 'Passport‑SAML Node SP',
      FQDN: FQDN,
      host: `${FQDN}:${PORT}`,
      port: PORT
    },
    passport: {
      strategy: 'saml',
      saml: {
        path: '/login/callback',
        callbackUrl: `${BASE_URL}/login/callback`,
        logoutCallbackUrl: `${BASE_URL}/logout`,
        issuer: SAML_ISSUER,
        metadata: {
          url: SAML_METADATA_URL,
          timeout: 1500,
          backupStore: fileCache({
            basePath: process.env.SAML_METADATA_CACHE_DIR || os.tmpdir(),
            ns: SAML_ISSUER
          })
        }
      }
    }
  }
};
