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
