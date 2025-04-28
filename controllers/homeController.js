// controllers/homeController.js
const path = require('path');

/**
 * GET /
 * Exibe a página inicial com botão "Entrar"
 */
exports.indexGet = (_req, res) => {
  res.render('home');          // busca app/views/home.pug
};

/**
 * POST /
 * Dispara o fluxo SAML (passport.authenticate)
 */
exports.indexPost = (passportStrategy) =>
  (req, res, next) => passportStrategy(req, res, next);
