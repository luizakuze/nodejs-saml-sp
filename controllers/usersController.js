/**
 * @file controllers/usersController.js
 *
 * Controlador responsável por renderizar a página da área protegida (/users),
 * exibindo os dados do usuário autenticado extraídos do perfil SAML.
 */

const path = require('path');

/**
 * Mapeamento de URIs SAML (NameIdentifier) para nomes amigáveis de atributos.
 * Isso facilita a leitura e o uso no template da view.
 */
const samlUriMap = {
  'urn:oid:0.9.2342.19200300.100.1.1':      'uid',
  'urn:oid:0.9.2342.19200300.100.1.3':      'mail',
  'urn:oid:2.5.4.42':                       'givenName',
  'urn:oid:2.5.4.4':                        'sn',
  'urn:oid:1.3.6.1.4.1.5923.1.1.1.6':       'eduPersonPrincipalName'
};

/**
 * Renderiza a página de usuário autenticado.
 * Requer sessão autenticada com atributos SAML presentes em `req.user`.
 *
 * @param {import('express').Request} req - Objeto da requisição HTTP
 * @param {import('express').Response} res - Objeto da resposta HTTP
 */
exports.index = (req, res) => {
  if (!req.isAuthenticated()) return res.redirect('/');

  const rawClaims = req.user; // perfil SAML vindo do passport
  const friendly = {};

  // Converte URIs SAML para chaves mais legíveis
  Object.keys(rawClaims).forEach(key => {
    if (samlUriMap[key]) {
      friendly[samlUriMap[key]] = rawClaims[key];
    }
  });

  // Renderiza a view com os dados processados
  res.render('users', {
    username:   friendly.eduPersonPrincipalName,
    email:      friendly.mail,
    firstName:  friendly.givenName,
    lastName:   friendly.sn
  });
};
