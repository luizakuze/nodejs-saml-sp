/**
 * @file controllers/homeController.js
 *
 * Controlador da página inicial da aplicação.
 */
 
// GET 
exports.indexGet = (_req, res) => {
  res.render('home'); // carrega home.pug
};
