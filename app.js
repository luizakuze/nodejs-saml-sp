require('dotenv').config();

const os = require('os');
const https = require('https');
const path = require('path');
const express = require('express');
const passport = require('passport');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const { metadata } = require('passport-saml-metadata');   // ← destructuring
const getSsl = require('./ssl');

const env = process.env.NODE_ENV || 'development';
const config = require('./config/config')[env];

const app = express();

/* ─── Express & view engine ────────────────────────────────────────── */
app.set('port', config.app.port);
app.set('hostname', config.app.hostname);
app.set('views', path.join(__dirname, 'app/views'));
app.set('view engine', 'pug');

app.use(morgan('combined'));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'change-me-in-production',
  resave: false,              // ← boas-práticas
  saveUninitialized: false    // ← boas-práticas
}));

/* ─── Passport configuration ───────────────────────────────────────── */
require('./config/passport')(app, passport, config);
app.use(passport.initialize());
app.use(passport.session());

/* ─── Static files ─────────────────────────────────────────────────── */
app.use(express.static(path.join(__dirname, 'public')));

/* ─── Metadata route (/metadata) ───────────────────────────────────── */
/* 1. Monte o objeto exatamente no formato esperado:                    */
const metadataConfig = {
  issuer: config.passport.saml.issuer,           // obrigatório
  callbackUrl: config.passport.saml.callbackUrl,      // obrigatório
  logoutCallbackUrl: config.passport.saml.logoutCallbackUrl // opcional
};

console.log('MetadataConfig:', metadataConfig);

/* 2. Registre a rota. A função metadata(...) devolve um middleware
      Express; basta fazer app.use ou metadata(config)(app):            */
app.use('/saml2/metadata', metadata(metadataConfig));

/* ─── Application routes ───────────────────────────────────────────── */
require('./config/routes')(app, config, passport);

/* ─── HTTPS server ─────────────────────────────────────────────────── */
getSsl().then((cert) => {
  https.createServer(cert, app).listen(app.get('port'), () => {
    console.log(
          `Accepting requests at https://${app.get('hostname')}:${app.get('port')}`
        );
  });
});
