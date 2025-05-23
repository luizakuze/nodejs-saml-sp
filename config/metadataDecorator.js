/**
 * @file config/metadataDecorator.js
 * 
 * Função que modifica e enriquece um metadata XML SAML do provedor de serviço (SP).,
 * adicionando informações visuais, endpoints, certificados e contatos conforme
 * exigido pela federação CAFe Expresso.
 * 
 * Retorna um novo XML SAML pronto para ser servido em `/saml2/metadata`.
 * 
 * @requires xml2js
 */

/**
 * Formata e insere no metadata XML as informações do SP (como certificado, UIInfo e logout).
 * 
 * @returns {Promise<string>} - Metadata SAML decorado como string XML.
 */

const { parseStringPromise, Builder } = require('xml2js');

module.exports = async function decorate(xml, {
  uiInfo,
  discoveryUrl,
  org,
  techContact,
  certBase64,
  entityID
}) {
  const doc = await parseStringPromise(xml);
  const entityDescriptor = doc.EntityDescriptor;

  // Atualiza atributos principais
  entityDescriptor.$.entityID = entityID;
  entityDescriptor.$.ID = entityID.replace(/[^\w]/g, '_');
  entityDescriptor.$.cacheDuration = 'PT1H';
  entityDescriptor.$['xmlns:saml2'] = 'urn:oasis:names:tc:SAML:2.0:assertion';

  // Formata o certificado em blocos de 64 colunas
  const formattedCert = certBase64.replace(/(.{64})/g, '$1\n');
  const baseUrl = entityID.replace(/\/saml2\/metadata\/?$/, '');

  // Define o SPSSODescriptor (serviços oferecidos pelo SP)
  const spsso = {
    $: {
      AuthnRequestsSigned: 'true',
      WantAssertionsSigned: 'true',
      protocolSupportEnumeration: 'urn:oasis:names:tc:SAML:2.0:protocol'
    },
    Extensions: [{
      'mdui:UIInfo': [{
        '$': { 'xmlns:mdui': 'urn:oasis:names:tc:SAML:metadata:ui' },
        'mdui:DisplayName': [{
          _: uiInfo.displayName,
          '$': { 'xml:lang': 'en' }
        }],
        'mdui:Description': [{
          _: uiInfo.description,
          '$': { 'xml:lang': 'en' }
        }],
        'mdui:InformationURL': [{
          _: uiInfo.infoUrl,
          '$': { 'xml:lang': 'en' }
        }],
        'mdui:PrivacyStatementURL': [{
          _: uiInfo.privacyUrl,
          '$': { 'xml:lang': 'en' }
        }]
      }],
      'DiscoveryResponse': [{
        '$': {
          xmlns: 'urn:oasis:names:tc:SAML:profiles:SSO:idp-discovery-protocol',
          Binding: 'urn:oasis:names:tc:SAML:profiles:SSO:idp-discovery-protocol',
          Location: discoveryUrl,
          isDefault: 'true',
          index: '0'
        }
      }]
    }],
    KeyDescriptor: [
      {
        $: { use: 'signing' },
        'ds:KeyInfo': [{
          'ds:X509Data': [{
            'ds:X509Certificate': [formattedCert]
          }]
        }]
      },
      {
        $: { use: 'encryption' },
        'ds:KeyInfo': [{
          'ds:X509Data': [{
            'ds:X509Certificate': [formattedCert]
          }]
        }],
        EncryptionMethod: [
          { $: { Algorithm: 'http://www.w3.org/2009/xmlenc11#aes256-gcm' } },
          { $: { Algorithm: 'http://www.w3.org/2009/xmlenc11#aes128-gcm' } },
          { $: { Algorithm: 'http://www.w3.org/2001/04/xmlenc#aes256-cbc' } },
          { $: { Algorithm: 'http://www.w3.org/2001/04/xmlenc#aes128-cbc' } }
        ]
      }
    ],
    SingleLogoutService: [
      {
        $: {
          Binding: 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect',
          Location: baseUrl + '/logout'
        }
      },
      {
        $: {
          Binding: 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST',
          Location: baseUrl + '/logout/post'
        }
      }
    ],
    NameIDFormat: ['urn:oasis:names:tc:SAML:2.0:nameid-format:persistent'],
    AssertionConsumerService: [
      {
        $: {
          index: '0',
          isDefault: 'true',
          Binding: 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST',
          Location: baseUrl + '/login/callback'
        }
      },
      {
        $: {
          index: '1',
          isDefault: 'false',
          Binding: 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Artifact',
          Location: baseUrl + '/login/callback'
        }
      }
    ]
  };

  // Substitui o SPSSODescriptor existente
  entityDescriptor.SPSSODescriptor[0] = spsso;

  // Organização
  entityDescriptor.Organization = [{
    OrganizationName: [{
      _: org.name,
      $: { 'xml:lang': 'pt-br' }
    }],
    OrganizationDisplayName: [{
      _: org.displayName,
      $: { 'xml:lang': 'pt-br' }
    }],
    OrganizationURL: [{
      _: org.url,
      $: { 'xml:lang': 'pt-br' }
    }]
  }];

  // Contato técnico
  entityDescriptor.ContactPerson = [{
    $: { contactType: 'technical' },
    Company: [techContact.company],
    GivenName: [techContact.givenName],
    SurName: [techContact.surName],
    EmailAddress: [techContact.email]
  }];

  return new Builder({ headless: false }).buildObject(doc);
};
