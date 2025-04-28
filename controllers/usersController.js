// controllers/usersController.js
const path = require('path');

// Mapeamento de URIs SAML → nomes amigáveis
const samlUriMap = {
  'urn:oid:0.9.2342.19200300.100.1.1':      'uid',
  'urn:oid:0.9.2342.19200300.100.1.3':      'mail',
  'urn:oid:2.5.4.42':                       'givenName',
  'urn:oid:2.5.4.4':                        'sn',
  'urn:oid:1.3.6.1.4.1.5923.1.1.1.6':       'eduPersonPrincipalName'
};

exports.index = (req, res) => {
  if (!req.isAuthenticated()) return res.redirect('/');

  const rawClaims = req.user;                 // perfil vindo do passport
  const friendly = {};

  Object.keys(rawClaims).forEach(key => {
    if (samlUriMap[key]) friendly[samlUriMap[key]] = rawClaims[key];
  });

  // passa os valores via template engine ou substitui no HTML
  res.render('users', {
    username:   friendly.eduPersonPrincipalName,
    email:      friendly.mail,
    firstName:  friendly.givenName,
    lastName:   friendly.sn
  });
};
