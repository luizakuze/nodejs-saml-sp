const os = require('os');
const assert = require('assert');
const fileCache = require('file-system-cache').default;

assert.ok(process.env.SAML_ISSUER, 'Environment variable SAML_ISSUER is required');
assert.ok(process.env.SAML_METADATA, 'Environment variable SAML_METADATA is required');

const hostname = process.env.HOSTNAME || os.hostname();
const port = process.env.PORT || 8000;
const host = hostname + (port != 443 ? ':' + port : '');

module.exports = {
  development: {
    app: {
      name: 'Passport SAML strategy example',
      hostname: hostname,
      host: host,
      port: port
    },
    passport: {
      strategy: 'saml',
      saml: {
        path: '/login/callback',
        callbackUrl: `http://${host}/login/callback`,
        logoutCallbackUrl: `http://${host}/logout`,
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
