// config/routes.js
const express   = require('express');
const router    = express.Router();
const passport  = require('passport');

const usersCtl  = require('../controllers/usersController');
const homeCtl   = require('../controllers/homeController');
const logoutCtl = require('../controllers/logoutController');

/* -------------------------------------------------------------
 * BASE_URL: usado para o retorno do Discovery Service
 * ------------------------------------------------------------- */
const BASE_URL =
  process.env.BASE_URL ||
  `https://${process.env.HOSTNAME || 'localhost'}:${process.env.PORT || 8000}`;

/* -------------------------------------------------------------
 * Página inicial
 * ------------------------------------------------------------- */
router.get('/', homeCtl.indexGet);

/* -------------------------------------------------------------
 * Discovery Service (WAYF) da RNP
 *  • Se NÃO houver ?idp=  → redireciona para o DS
 *  • Se houver  ?idp=     → grava IdP e dispara AuthnRequest
 * ------------------------------------------------------------- */
router.get('/login/disco', (req, res, next) => {
  /* — retorno do WAYF? — */
  if (req.query.idp) {
    req.session.idpEntityID = req.query.idp;        // guarda escolha
    return passport.authenticate('saml')(req, res, next);
  }

  /* — primeira visita: manda para o WAYF — */
  const dsURL       = 'https://ds.cafeexpresso.rnp.br/WAYF.php';
  const returnURL   = encodeURIComponent(`${BASE_URL}/login/disco`);
  const spEntityID  = encodeURIComponent(process.env.SAML_ISSUER);

  res.redirect(
    `${dsURL}?entityID=${spEntityID}` +
    `&return=${returnURL}&returnIDParam=idp`
  );
});

/* -------------------------------------------------------------
 * Assertion Consumer Service
 * ------------------------------------------------------------- */
router.post(
  '/login/callback',
  passport.authenticate('saml', { failureRedirect: '/' }),
  usersCtl.index
);

/* -------------------------------------------------------------
 * Logout
 * ------------------------------------------------------------- */
router.get('/logout', logoutCtl.index);

/* -------------------------------------------------------------
 * Área protegida
 * ------------------------------------------------------------- */
router.get(
  '/users',
  (req, res, next) => (req.isAuthenticated() ? next() : res.redirect('/')),
  usersCtl.index
);

module.exports = router;
