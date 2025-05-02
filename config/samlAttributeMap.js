/**
 * @file config/samlAttributeMap.js
 * 
 * Mapeia URIs SAML para nomes amigáveis utilizados na aplicação.
 */

module.exports = {
    'urn:oid:0.9.2342.19200300.100.1.1':      'uid',
    'urn:oid:0.9.2342.19200300.100.1.3':      'mail',
    'urn:oid:2.5.4.42':                       'givenName',
    'urn:oid:2.5.4.4':                        'sn',
    'urn:oid:1.3.6.1.4.1.5923.1.1.1.6':       'eduPersonPrincipalName'
  };
  