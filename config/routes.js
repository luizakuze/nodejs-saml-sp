// config/routes.js
const express = require('express');
const router  = express.Router();

const home    = require('../controllers/homeController');
const users   = require('../controllers/usersController');
const logoutC = require('../controllers/logoutController');

module.exports = (app, config, passport) => {
  /* Página inicial */
  router.get('/',  home.indexGet);
  router.post('/', home.indexPost(
    passport.authenticate(config.passport.strategy)
  ));

  /* Área protegida */
  router.get('/users', users.index);

  /* Logout */
  router.get('/logout', logoutC.index);

  /* Registra todas as rotas no app */
  app.use(router);
};
