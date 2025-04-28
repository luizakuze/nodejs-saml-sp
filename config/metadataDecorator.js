const { parseStringPromise, Builder } = require('xml2js');

module.exports = async function decorate(xml, { uiInfo, discoveryUrl, org, techContact }) {
  const doc   = await parseStringPromise(xml);
  const spsso = doc.EntityDescriptor.SPSSODescriptor[0];

  /* a) UIInfo + DiscoveryResponse */
  spsso.Extensions = [{
    'mdui:UIInfo': [{
      'mdui:DisplayName':          [{ _ : uiInfo.displayName,    '$': { 'xml:lang':'en' }}],
      'mdui:Description':          [{ _ : uiInfo.description,    '$': { 'xml:lang':'en' }}],
      'mdui:InformationURL':       [{ _ : uiInfo.infoUrl,        '$': { 'xml:lang':'en' }}],
      'mdui:PrivacyStatementURL':  [{ _ : uiInfo.privacyUrl,     '$': { 'xml:lang':'en' }}]
    }],
    'DiscoveryResponse': [{
      '$': {
        xmlns:   'urn:oasis:names:tc:SAML:profiles:SSO:idp-discovery-protocol',
        Binding: 'urn:oasis:names:tc:SAML:profiles:SSO:idp-discovery-protocol',
        Location: discoveryUrl,
        isDefault:'true',
        index:    '0'
      }
    }]
  }];

  /* b) Organization */
  doc.EntityDescriptor.Organization = [{
    'OrganizationName':        [{ _ : org.name,        '$': { 'xml:lang':'pt-br' }}],
    'OrganizationDisplayName': [{ _ : org.displayName, '$': { 'xml:lang':'pt-br' }}],
    'OrganizationURL':         [{ _ : org.url,         '$': { 'xml:lang':'pt-br' }}]
  }];

  /* c) ContactPerson */
  doc.EntityDescriptor.ContactPerson = [{
    '$': { contactType:'technical' },
    'Company':      [ techContact.company ],
    'GivenName':    [ techContact.givenName ],
    'SurName':      [ techContact.surName ],
    'EmailAddress': [ techContact.email ]
  }];

  /* KeyDescriptor: já vem de generateServiceProviderMetadata */

  return new Builder({ headless:false }).buildObject(doc);
};
