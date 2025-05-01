const { parseStringPromise, Builder } = require('xml2js');

module.exports = async function decorate(xml, { uiInfo, discoveryUrl, org, techContact }) {
  const doc = await parseStringPromise(xml);
  const entityDescriptor = doc.EntityDescriptor;
  const spsso = entityDescriptor.SPSSODescriptor[0];

  /** a) Ajustar atributos do EntityDescriptor */
  entityDescriptor.$['xmlns:saml2'] = 'urn:oasis:names:tc:SAML:2.0:assertion';
  entityDescriptor.$['cacheDuration'] = 'PT1H';

  /** b) Ajustar atributos do SPSSODescriptor */
  spsso.$['AuthnRequestsSigned'] = 'true';
  spsso.$['WantAssertionsSigned'] = 'true';
  spsso.$['protocolSupportEnumeration'] = 'urn:oasis:names:tc:SAML:2.0:protocol';

  /** c) Criar Extensions */
  const extensions = {
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
  };

  /** d) Ajustar SingleLogoutService */
  let singleLogoutServices = [];
  if (spsso.SingleLogoutService) {
    spsso.SingleLogoutService.forEach(sls => {
      sls.$.Binding = 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect';
      singleLogoutServices.push(sls);
    });
  }

  /** e) Ajustar NameIDFormat */
  const nameIDFormat = ['urn:oasis:names:tc:SAML:2.0:nameid-format:persistent'];

  /** f) Ajustar AssertionConsumerService */
  const acsList = [];
  if (spsso.AssertionConsumerService) {
    const baseAcs = spsso.AssertionConsumerService[0];
    baseAcs.$.index = '0';
    baseAcs.$.isDefault = 'true';
    acsList.push(baseAcs);

    acsList.push({
      $: {
        Binding: 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Artifact',
        Location: baseAcs.$.Location,
        index: '1',
        isDefault: 'false'
      }
    });
  }

  /** g) Rearranjar SPSSODescriptor na ordem correta */
  const keyDescriptors = spsso.KeyDescriptor || [];

  // Zera tudo para inserir na ordem
  delete spsso.Extensions;
  delete spsso.KeyDescriptor;
  delete spsso.SingleLogoutService;
  delete spsso.NameIDFormat;
  delete spsso.AssertionConsumerService;

  // Insere na ordem correta
  spsso.Extensions = [extensions];
  spsso.KeyDescriptor = keyDescriptors;
  if (singleLogoutServices.length > 0) {
    spsso.SingleLogoutService = singleLogoutServices;
  }
  spsso.NameIDFormat = nameIDFormat;
  spsso.AssertionConsumerService = acsList;

  /** h) Organization */
  entityDescriptor.Organization = [{
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

  /** i) ContactPerson */
  entityDescriptor.ContactPerson = [{
    '$': { contactType: 'technical' },
    'Company': [techContact.company],
    'GivenName': [techContact.givenName],
    'SurName': [techContact.surName],
    'EmailAddress': [techContact.email]
  }];

  /** j) Retornar XML formatado */
  return new Builder({ headless: false }).buildObject(doc);
};
