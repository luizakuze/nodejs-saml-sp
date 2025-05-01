// ───────────────────────────────────────────────────────────────
// file: config/config.js
// ───────────────────────────────────────────────────────────────
const os = require('os');
const assert = require('assert');
const fileCache = require('file-system-cache').default;

assert.ok(process.env.SAML_ISSUER, 'Environment variable SAML_ISSUER is required');
assert.ok(process.env.SAML_METADATA, 'Environment variable SAML_METADATA is required');

const hostname = process.env.HOSTNAME || os.hostname();
const port = process.env.PORT || 8000;
const host = `${hostname}:${port}`;

module.exports = {
  development: {
    app: {
      name: 'Passport‑SAML Node SP',
      hostname,
      host,
      port
    },
    passport: {
      strategy: 'saml',
      saml: {
        path: '/login/callback',
        callbackUrl: `https://${host}/login/callback`,
        logoutCallbackUrl: `https://${host}/logout`,
        issuer: process.env.SAML_ISSUER,
        metadata: {
          url: process.env.SAML_METADATA,
          timeout: process.env.SAML_METADATA_TIMEOUT || 1500,
          backupStore: fileCache({
            basePath: process.env.SAML_METADATA_CACHE_DIR || os.tmpdir(),
            ns: process.env.SAML_ISSUER
          })
        }
      }
    }
  }
};
