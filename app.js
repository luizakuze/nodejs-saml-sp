/**
 * @file app.js
 * 
 * Inicializa a aplicação Express com suporte a autenticação SAML e HTTPS.
 * Carrega variáveis de ambiente, configura middlewares, sessões, Passport
 * e inicia o servidor HTTPS com certificado real (se definido) ou autoassinado.
 */

require('dotenv').config(); // Carrega variáveis do .env

const express = require('express');
const https = require('https');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');
const passport = require('passport');

const { app: cfg } = require('./config/config').development;
const ssl = require('./ssl');

const app = express();

/**
 * Define a pasta de views e o mecanismo de template (Pug).
 */
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

/**
 * Aplica middlewares globais para logging, cookies, parsing e sessão.
 */
app.use(morgan('combined'));
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));

/**
 * Configura a sessão com a chave secreta vinda do .env.
 */
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

/**
 * Inicializa e configura o Passport com estratégia SAML dinâmica.
 */
require('./config/passport')(passport);
app.use(passport.initialize());
app.use(passport.session());

/**
 * Registra as rotas da aplicação.
 */
app.use('/', require('./config/routes'));

/**
 * Inicia o servidor HTTPS com certificados carregados ou gerados dinamicamente.
 */
ssl().then(cert =>
  https.createServer(cert, app).listen(cfg.port, () => {
    console.log(`🌐 Servidor rodando em: https://${cfg.host}`);
  })
);
