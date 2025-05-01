
// config/passport.js
const { MultiSamlStrategy } = require('@node-saml/passport-saml');
const federation = require('./federationLoader');

module.exports = (passport) => {
  passport.use(new MultiSamlStrategy(
    {
      passReqToCallback: true,
      /* escolhe o IdP olhando query ou sessão */
      getSamlOptions: (req, done) => {
        try {
          const entityID = req.query.idp || req.session.idpEntityID;
          console.log('🔎 IDP selecionado:', entityID);
          const config = federation.getConfig(entityID);
          console.log('🔧 Config gerada:', config);
          return done(null, config);
        } catch (err) {
          return done(err);
        }
      }
    },
    /* verify (login) */
    (req, profile, done) => {
      done(null, { email: profile.email, ...profile });
    },
    /* verify (single logout) */
    (req, profile, done) => {
      done(null, { nameID: profile.nameID });
    }
  ));

  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((obj, done) => done(null, obj));
};
