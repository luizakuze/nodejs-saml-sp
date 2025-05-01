const { MultiSamlStrategy } = require('@node-saml/passport-saml');
const federation            = require('./federationLoader');

module.exports = (passport) => {
  passport.use(new MultiSamlStrategy(
    {
      passReqToCallback : true,
      /* escolhe o IdP olhando query ou sessão ----------------- */
      getSamlOptions    : (req, done) => {
        try {
          const entityID = req.query.idp || req.session.idpEntityID;
          return done(null, federation.getConfig(entityID));
        } catch (err) {
          return done(err);
        }
      }
    },
    /* ---------------- verify (login) ------------------------- */
    (req, profile, done) => {
      /* TODO: procure usuário no seu DB – abaixo é só mock */
      done(null, { email: profile.email, ...profile });
    },
    /* --------------- verify (single logout) ------------------ */
    (req, profile, done) => {
      /* idem – match pelo NameID recebido no LogoutRequest      */
      done(null, { nameID: profile.nameID });
    }
  ));

  passport.serializeUser((user, done)   => done(null, user));
  passport.deserializeUser((obj, done) => done(null, obj));
};
