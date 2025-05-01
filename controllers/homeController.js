/**
 * GET /
 * Exibe a página inicial com botão "Entrar"
 */
exports.indexGet = (_req, res) => {
  res.render('home'); // carrega home.pug
};
