require('dotenv').config();
const os           = require('os');
const https        = require('https');
const path         = require('path');
const express      = require('express');
const passport     = require('passport');
const morgan       = require('morgan');
const cookieParser = require('cookie-parser');
const session      = require('express-session');
const getSsl       = require('./ssl');

const env    = process.env.NODE_ENV || 'development';
const config = require('./config/config')[env];

const app = express();

/* ─── Express & view engine ────────────────────────────────────────── */
app.set('port',     config.app.port);
app.set('hostname', config.app.hostname);
app.set('views',    path.join(__dirname, 'app/views'));
app.set('view engine', 'pug');

app.use(morgan('combined'));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'change-me-in-production',
  resave: false,
  saveUninitialized: false
}));

/* ─── Passport ─────────────────────────────────────────────────────── */
require('./config/passport')(app, passport, config);
app.use(passport.initialize());
app.use(passport.session());

/* ─── Arquivos estáticos ───────────────────────────────────────────── */
app.use(express.static(path.join(__dirname, 'public')));

/* ─── Metadata SAML (/saml2/metadata) ──────────────────────────────── */
app.get('/saml2/metadata', (req, res) => {
  // A estratégia já foi registrada em ./config/passport.js
  const saml = passport._strategy('saml');

  // Lê seu certificado público para assinar o metadata.
  // (ou deixe vazio se não quiser <ds:Signature>)
  const fs = require('fs');
  const pubCert = fs.readFileSync('./certs/sp-public-cert.pem', 'utf-8');

  const xml = saml.generateServiceProviderMetadata(pubCert, pubCert);
  res.type('application/samlmetadata+xml').send(xml);
});

/* ─── Rotas da aplicação ───────────────────────────────────────────── */
require('./config/routes')(app, config, passport);

/* ─── HTTPS ────────────────────────────────────────────────────────── */
getSsl().then(cert =>
  https.createServer(cert, app).listen(app.get('port'), () =>
    console.log(`Accepting requests at https://${app.get('hostname')}:${app.get('port')}`)
  )
);
