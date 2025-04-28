const metadata = require('passport-saml-metadata');
const { Strategy: SamlStrategy } = require('@node-saml/passport-saml');

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

      passport.use('saml', new SamlStrategy(strategyConfig, function (profile, done) {
        profile = metadata.claimsToCamelCase(profile, reader.claimSchema);
        return done(null, profile);
      }));

      passport.serializeUser(function(user, done) {
        done(null, user);
      });

      passport.deserializeUser(function(user, done) {
        done(null, user);
      });
    })
    .catch((err) => {
      console.error('Error loading SAML metadata', err);
      process.exit(1);
    });
};
