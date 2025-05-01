/**
 * @file controllers/logoutController.js
 *
 * Controlador responsável por realizar logout.
 */

// GET /logout 
exports.index = (req, res, next) => {
  req.logout(err => {
    if (err) return next(err); // erro ao encerrar sessão local

    const saml = req._passport.instance._strategy('saml');
    return saml.logout(req, function(err, requestUrl) {
      if (err || !requestUrl) return res.redirect('/');
      res.redirect(requestUrl); // redireciona para o IdP (logout federado)
    });
  });
};
