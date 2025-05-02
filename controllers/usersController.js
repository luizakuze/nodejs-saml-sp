/**
 * @file controllers/usersController.js
 *
 * Controlador responsável por renderizar a página da área protegida (/users),
 * exibindo os dados do usuário autenticado extraídos do perfil SAML.
 */

const path = require('path');
const samlUriMap = require('../config/samlAttributeMap');

/**
 * Renderiza a página de usuário autenticado.
 * Requer sessão autenticada com atributos SAML presentes em `req.user`.
 *
 * @param {import('express').Request} req - Objeto da requisição HTTP
 * @param {import('express').Response} res - Objeto da resposta HTTP
 */
exports.index = (req, res) => {
  if (!req.isAuthenticated()) return res.redirect('/');

  const rawClaims = req.user;
  const friendly = {};

  Object.keys(rawClaims).forEach(key => {
    if (samlUriMap[key]) {
      friendly[samlUriMap[key]] = rawClaims[key];
    }
  });

  res.render('users', {
    username:   friendly.eduPersonPrincipalName,
    email:      friendly.mail,
    firstName:  friendly.givenName,
    lastName:   friendly.sn
  });
};
