/**
 * @file config/routes.js
 *
 * Define as rotas principais da aplicação, incluindo:
 * - Página inicial
 * - Autenticação via Discovery Service (WAYF)
 * - Callback do SAML
 * - Logout
 * - Área protegida para usuários autenticados
 * - Exposição dos metadados SAML do SP
 */

const express = require('express');
const router = express.Router();
const passport = require('passport');

const usersCtl = require('../controllers/usersController');
const homeCtl = require('../controllers/homeController');
const logoutCtl = require('../controllers/logoutController');
const metadataCtl = require('../controllers/metadataController');

const BASE_URL =
  process.env.BASE_URL ||
  `https://${process.env.FQDN}:${process.env.PORT}`;

const DS_URL = process.env.DISCOVERY_SERVICE_URL || 'https://ds.cafeexpresso.rnp.br/WAYF.php';

/**
 * Rota inicial da aplicação.
 */
router.get('/', homeCtl.indexGet);

/**
 * Rota de login com Discovery Service (WAYF da RNP).
 * Se `?idp` estiver presente, armazena o entityID na sessão e inicia autenticação.
 * Caso contrário, redireciona para o WAYF.
 */
router.get('/login/disco', (req, res, next) => {
  if (req.query.idp) {
    req.session.idpEntityID = req.query.idp;
    return passport.authenticate('saml')(req, res, next);
  }

  const returnURL = encodeURIComponent(`${BASE_URL}/login/disco`);
  const spEntityID = encodeURIComponent(`${BASE_URL}/saml2/metadata/`);

  res.redirect(
    `${DS_URL}?entityID=${spEntityID}` +
    `&return=${returnURL}&returnIDParam=idp`
  );
});

/**
 * Callback SAML após autenticação do IdP.
 * Redireciona para a rota protegida se bem-sucedido, ou volta à página inicial em caso de falha.
 */
router.post(
  '/login/callback',
  passport.authenticate('saml', { failureRedirect: '/' }),
  usersCtl.index
);

/**
 * Rota de logout, destrói a sessão local e inicia logout com o IdP.
 */
router.get('/logout', logoutCtl.index);

/**
 * Rota protegida: acessível apenas para usuários autenticados.
 */
router.get(
  '/users',
  (req, res, next) => (req.isAuthenticated() ? next() : res.redirect('/')),
  usersCtl.index
);

/**
 * Rota que expõe os metadados do SP em formato XML.
 */
router.get('/saml2/metadata', metadataCtl);

module.exports = router;
