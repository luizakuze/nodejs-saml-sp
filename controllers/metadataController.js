const fs = require('fs/promises');
const path = require('path');
const decorate = require('../config/metadataDecorator');
const { generateServiceProviderMetadata } = require('@node-saml/node-saml');

module.exports = async (req, res) => {
  try {
    const certRaw = await fs.readFile(path.join(__dirname, '../certs/sp-public-cert.pem'), 'utf8');
    const certBase64 = certRaw.replace(/-----BEGIN CERTIFICATE-----|-----END CERTIFICATE-----|\s+/g, '');

    const baseMetadata = generateServiceProviderMetadata({
      entityID: 'https://sp-node:8000/saml2/metadata/',
      callbackUrl: 'https://sp-node:8000/login/callback',
      cert: certBase64
    });

    const finalMetadata = await decorate(baseMetadata, {
      uiInfo: {
        displayName: 'SP NODE JS',
        description: 'Provedor de servicos Node JS',
        infoUrl: 'http://sp.information.url/',
        privacyUrl: 'http://sp.privacy.url/'
      },
      discoveryUrl: 'https://sp-node:8000/login/disco',
      org: {
        name: 'GIdLab',
        displayName: 'GIdLab',
        url: 'http://gidlab.rnp.br/'
      },
      techContact: {
        company: 'RNP',
        givenName: 'GIdLab',
        surName: 'Equipe',
        email: 'gidlab@rnp.br'
      },
      certBase64,
      entityID: 'https://sp-node:8000/saml2/metadata/'
    });

    res.type('application/xml').send(finalMetadata);
  } catch (err) {
    console.error('Erro ao gerar metadata:', err);
    res.status(500).send('Erro ao gerar metadata');
  }
};
