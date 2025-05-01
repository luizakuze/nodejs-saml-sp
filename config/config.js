/**
 * @file config/config.js
 * 
 * Configuração da aplicação e do Passport-SAML baseada em variáveis de ambiente.
 * @module config
 */

require('dotenv').config(); // garante carregamento do .env

const os = require('os');
const fileCache = require('file-system-cache').default;
const assert = require('assert');

// valida variável obrigatória
assert.ok(process.env.SAML_METADATA, 'Environment variable SAML_METADATA is required');

// leitura com fallback seguro
const HOSTNAME = process.env.HOSTNAME || 'localhost';
const PORT = process.env.PORT || '8000';

// monta dinamicamente a URL base e o entityID (issuer)
const BASE_URL = `https://${HOSTNAME}:${PORT}`;
const SAML_ISSUER = `${BASE_URL}/saml2/metadata/`;


module.exports = {
  development: {
    app: {
      name: 'Passport‑SAML Node SP',
      hostname: HOSTNAME,
      host: `${HOSTNAME}:${PORT}`,
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
          url: process.env.SAML_METADATA,
          timeout: process.env.SAML_METADATA_TIMEOUT || 1500,
          backupStore: fileCache({
            basePath: process.env.SAML_METADATA_CACHE_DIR || os.tmpdir(),
            ns: SAML_ISSUER
          })
        }
      }
    }
  }
};
