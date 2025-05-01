/**
 * @file controllers/metadataController.js
 * 
 * Gera dinamicamente o metadata SAML 2.0 do provedor de serviço (SP), 
 * aplicando extensões como UIInfo, organização e contato técnico,
 * com base nas variáveis de ambiente.
 * 
 * Esse metadata é utilizado por IdPs da federação para reconhecer o SP.
 */

const fs = require('fs/promises');
const path = require('path');
const decorate = require('../config/metadataDecorator');
const { generateServiceProviderMetadata } = require('@node-saml/node-saml');

// Informações dinâmicas do SP baseadas no ambiente
const HOSTNAME = process.env.HOSTNAME || 'localhost';
const PORT = process.env.PORT || '8000';
const BASE_URL = process.env.BASE_URL || `https://${HOSTNAME}:${PORT}`;
const ENTITY_ID = `${BASE_URL}/saml2/metadata/`;
const CALLBACK_URL = `${BASE_URL}/login/callback`;
const DISCOVERY_URL = `${BASE_URL}/login/disco`;

/**
 * Controlador responsável por responder com o metadata SAML XML do SP.
 * 
 * - Lê o certificado público do SP (PEM)
 * - Gera o metadata base com `@node-saml/node-saml`
 * - Aplica decorações com informações de UI, organização e contato técnico
 * - Retorna o XML com `Content-Type: application/xml`
 * 
 * @param {import('express').Request} req - Objeto da requisição HTTP
 * @param {import('express').Response} res - Objeto da resposta HTTP
 */
module.exports = async (req, res) => {
  try {
    const certRaw = await fs.readFile(path.join(__dirname, '../certs/sp-public-cert.pem'), 'utf8');
    const certBase64 = certRaw.replace(/-----BEGIN CERTIFICATE-----|-----END CERTIFICATE-----|\s+/g, '');

    const baseMetadata = generateServiceProviderMetadata({
      entityID: ENTITY_ID,
      callbackUrl: CALLBACK_URL,
      cert: certBase64
    });

    const finalMetadata = await decorate(baseMetadata, {
      uiInfo: {
        displayName: process.env.UI_DISPLAY_NAME,
        description: process.env.UI_DESCRIPTION,
        infoUrl: process.env.UI_INFO_URL,
        privacyUrl: process.env.UI_PRIVACY_URL
      },
      discoveryUrl: DISCOVERY_URL,
      org: {
        name: process.env.ORG_NAME,
        displayName: process.env.ORG_DISPLAY_NAME,
        url: process.env.ORG_URL
      },
      techContact: {
        company: process.env.TECH_COMPANY,
        givenName: process.env.TECH_GIVEN_NAME,
        surName: process.env.TECH_SURNAME,
        email: process.env.TECH_EMAIL
      },
      certBase64,
      entityID: ENTITY_ID
    });

    res.type('application/xml').send(finalMetadata);
  } catch (err) {
    console.error('Erro ao gerar metadata:', err);
    res.status(500).send('Erro ao gerar metadata');
  }
};
