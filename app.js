require('dotenv').config();
const os = require('os');
const https = require('https');
const path = require('path');
const express = require('express');
const passport = require('passport');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const session = require('express-session');
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
/* ─── Metadata SAML (/saml2/metadata) ─────────────────────────────── */
app.get('/saml2/metadata', async (req, res) => {
  const fs   = require('fs');
  const deco = require('./config/metadataDecorator');

  const saml = passport._strategy('saml');

  const cert = fs.readFileSync('./certs/sp-public-cert.pem', 'utf-8');
  let xml    = saml.generateServiceProviderMetadata(cert, cert);

  xml = await deco(xml, {
    uiInfo: {
      displayName: 'SP NODE JS',
      description: 'Provedor de serviços Node JS',
      infoUrl:     'http://sp.information.url/',
      privacyUrl:  'http://sp.privacy.url/'
    },
    discoveryUrl: `${config.app.host.startsWith('http') ? config.app.host : 'https://' + config.app.host}/login/disco`,
    org: {
      name:        'GIdLab',
      displayName: 'GIdLab',
      url:         'http://gidlab.rnp.br/'
    },
    techContact: {
      company:   'RNP',
      givenName: 'GIdLab',
      surName:   'Equipe',
      email:     'gidlab@rnp.br'
    }
  });

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
