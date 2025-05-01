/**
 * @file config/passport.js
 * 
 * Configura a estratégia SAML do Passport utilizando `MultiSamlStrategy`,
 * permitindo suporte a múltiplos IdPs com seleção dinâmica via query ou sessão.
 * 
 * A estratégia SAML é configurada com callbacks para autenticação e logout.
 * 
 * @module passport-config
 */

const { MultiSamlStrategy } = require('@node-saml/passport-saml');
const federation = require('./federationLoader');

/**
 * Aplica a estratégia SAML no Passport usando MultiSamlStrategy.
 * 
 * @param {import('passport').PassportStatic} passport - Instância do Passport.
 */
module.exports = (passport) => {
  passport.use(new MultiSamlStrategy(
    {
      passReqToCallback: true,

      /**
       * Callback para selecionar dinamicamente a configuração do IdP com base no `entityID`.
       * 
       * @param {import('express').Request} req - Requisição HTTP.
       * @param {Function} done - Callback que recebe (err, config).
       */
      getSamlOptions: (req, done) => {
        try {
          const entityID = req.query.idp || req.session.idpEntityID;
          //console.log('🔎 IDP selecionado:', entityID);
          const config = federation.getConfig(entityID);
          //console.log('🔧 Config gerada:', config);
          return done(null, config);
        } catch (err) {
          return done(err);
        }
      }
    },

    /**
     * Callback de verificação ao autenticar via SAML.
     * 
     * @param {import('express').Request} req - Requisição original.
     * @param {object} profile - Perfil retornado pelo IdP.
     * @param {Function} done - Callback de conclusão.
     */
    (req, profile, done) => {
      done(null, { email: profile.email, ...profile });
    },

    /**
     * Callback de verificação para Single Logout (SLO).
     * 
     * @param {import('express').Request} req - Requisição original.
     * @param {object} profile - Perfil com o `nameID` do usuário.
     * @param {Function} done - Callback de conclusão.
     */
    (req, profile, done) => {
      done(null, { nameID: profile.nameID });
    }
  ));

  /**
   * Serializa o usuário para a sessão.
   * 
   * @param {object} user - Objeto do usuário.
   * @param {Function} done - Callback.
   */
  passport.serializeUser((user, done) => done(null, user));

  /**
   * Desserializa o usuário da sessão.
   * 
   * @param {object} obj - Objeto armazenado na sessão.
   * @param {Function} done - Callback.
   */
  passport.deserializeUser((obj, done) => done(null, obj));
};
