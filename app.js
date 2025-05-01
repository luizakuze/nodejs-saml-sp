// app.js
require('dotenv').config();          // ← carrega o .env


const express = require('express');
const https = require('https');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');
const passport = require('passport');          // ①  agora temos a instância

const { app: cfg } = require('./config/config').development;                // apenas variáveis simples
const ssl = require('./ssl');

const app = express();

/* ─── view engine & middlewares ───────────────── */
app.set('views', path.join(__dirname, 'views'));  // views/ (deixe fora de config/)
app.set('view engine', 'pug');
app.use(morgan('combined'));
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'change-me',
  resave: false,
  saveUninitialized: false
}));

/* ─── Passport ─────────────────────────────────── */
require('./config/passport')(passport);             // ② passa a instância
app.use(passport.initialize());
app.use(passport.session());

/* ─── Rotas ─────────────────────────────────────── */
app.use('/', require('./config/routes'));           // ③ monta o router

/* ─── HTTPS ─────────────────────────────────────── */
ssl().then(cert =>
  https.createServer(cert, app).listen(cfg.port, () =>
    +   console.log(`https://${cfg.host}`)
  )
);
