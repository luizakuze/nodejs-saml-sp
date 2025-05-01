/**
 * @file Gera ou carrega um par de certificados SSL/TLS para o servidor HTTPS.
 * 
 * Se as variáveis de ambiente `SSL_KEY` e `SSL_CERT` estiverem definidas,
 * o módulo carrega os certificados a partir dos caminhos especificados.
 * Caso contrário, ele gera dinamicamente um certificado autoassinado
 * (válido por 1 dia) para uso em ambientes de desenvolvimento.
 * 
 * Este módulo é utilizado para configurar o HTTPS com `https.createServer(...)`.
 * 
 * @module ssl
 * 
 * @requires pem-promise Para gerar certificados autoassinados
 * @requires fs Para leitura de arquivos locais
 * 
 * @returns {Promise<{key: Buffer, cert: Buffer}>} Objeto contendo a chave privada e o certificado público
 *  
 */

const pem = require('pem-promise');
const fs = require('fs');

module.exports = () => {
  if (process.env.SSL_KEY && process.env.SSL_CERT) {
    return Promise.resolve({
      key: fs.readFileSync(process.env.SSL_KEY),
      cert: fs.readFileSync(process.env.SSL_CERT)
    });
  } else {
    return pem.createCertificate({ days: 1, selfSigned: true })
      .then((keys) => ({ key: keys.serviceKey, cert: keys.certificate }));
  }
};
