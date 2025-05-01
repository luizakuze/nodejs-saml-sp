const metadata = require('passport-saml-metadata');
const cache    = new Map();

async function load(idp) {
  if (!cache.has(idp.id)) {
    const reader   = await metadata.fetch(idp.metadataUrl);
    const cfg      = metadata.toPassportConfig(reader);
    cache.set(idp.id, cfg);
  }
  return cache.get(idp.id);
}
module.exports = load;
