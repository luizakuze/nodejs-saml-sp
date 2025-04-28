const { parseStringPromise, Builder } = require('xml2js');

module.exports = async function decorate(xml, { uiInfo, discoveryUrl, org, techContact }) {
  const doc = await parseStringPromise(xml);
  const spsso = doc.EntityDescriptor.SPSSODescriptor[0];

  /* a) Garantir NameIDFormat */
  if (!spsso.NameIDFormat) {
    spsso.NameIDFormat = ['urn:oasis:names:tc:SAML:2.0:nameid-format:persistent'];
  }

  /* b) Garantir Extensions (não apagar o que já tiver) */
  if (!spsso.Extensions) {
    spsso.Extensions = [{}];
  }
  const extensions = spsso.Extensions[0];

  /* c) UIInfo */
  extensions['mdui:UIInfo'] = [{
    '$': { 'xmlns:mdui': 'urn:oasis:names:tc:SAML:metadata:ui' },  // <=== adiciona aqui!
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
  }];


  /* d) DiscoveryResponse */
  extensions['DiscoveryResponse'] = [{
    '$': {
      xmlns: 'urn:oasis:names:tc:SAML:profiles:SSO:idp-discovery-protocol',
      Binding: 'urn:oasis:names:tc:SAML:profiles:SSO:idp-discovery-protocol',
      Location: discoveryUrl,
      isDefault: 'true',
      index: '0'
    }
  }];

  /* e) Organization */
  doc.EntityDescriptor.Organization = [{
    'OrganizationName': [{
      _: org.name,
      '$': { 'xml:lang': 'pt-br' }
    }],
    'OrganizationDisplayName': [{
      _: org.displayName,
      '$': { 'xml:lang': 'pt-br' }
    }],
    'OrganizationURL': [{
      _: org.url,
      '$': { 'xml:lang': 'pt-br' }
    }]
  }];

  /* f) ContactPerson */
  doc.EntityDescriptor.ContactPerson = [{
    '$': { contactType: 'technical' },
    'Company': [techContact.company],
    'GivenName': [techContact.givenName],
    'SurName': [techContact.surName],
    'EmailAddress': [techContact.email]
  }];

  /* g) Retornar XML construído */
  return new Builder({ headless: false }).buildObject(doc);
};
