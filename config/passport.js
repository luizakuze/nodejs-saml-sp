const metadata = require('passport-saml-metadata');
const SamlStrategy = require('passport-saml').Strategy;
const fs = require('fs'); // Melhor já importar no topo

module.exports = function (app, passport, config) {
  metadata.fetch(config.passport.saml.metadata)
    .then(function (reader) {
      const strategyConfig = metadata.toPassportConfig(reader);

      strategyConfig.callbackUrl = config.passport.saml.callbackUrl;
      strategyConfig.logoutCallbackUrl = config.passport.saml.logoutCallbackUrl;
      strategyConfig.issuer = config.passport.saml.issuer;
      strategyConfig.identifierFormat = 'urn:oasis:names:tc:SAML:2.0:nameid-format:persistent';
      strategyConfig.wantAssertionsSigned = true;
      strategyConfig.wantAuthnResponseSigned = true;
      strategyConfig.authnRequestBinding = 'HTTP-POST';
      strategyConfig.forceAuthn = false;
      strategyConfig.acceptUnsolicitedResponses = false;
      strategyConfig.authnRequestsSigned = true;

      // 💥 Garante que o cert está presente
      const spPublicCert = fs.readFileSync('./certs/sp-public-cert.pem', 'utf-8');

      strategyConfig.cert = strategyConfig.cert || spPublicCert;
      strategyConfig.privateKey = fs.readFileSync('./certs/sp-private-key.pem', 'utf-8');
      strategyConfig.decryptionPvk = strategyConfig.privateKey;

      passport.use('saml', new SamlStrategy(strategyConfig, function (profile, done) {
        profile = metadata.claimsToCamelCase(profile, reader.claimSchema);
        return done(null, profile);
      }));

      passport.serializeUser(function (user, done) {
        done(null, user);
      });

      passport.deserializeUser(function (user, done) {
        done(null, user);
      });
    })
    .catch((err) => {
      console.error('Error loading SAML metadata', err);
      process.exit(1);
    });
};
