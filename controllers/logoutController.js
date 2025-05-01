exports.index = (req, res, next) => {
  req.logout( err => {
    if (err)  return next(err);      // local session encerrou

    /* opcional: iniciar LogoutRequest no IdP seleccionado */
    const saml = req._passport.instance._strategy('saml');
    return saml.logout(req, function(err, requestUrl){
      if (err || !requestUrl) return res.redirect('/');
      res.redirect(requestUrl);      // redireciona para o IdP
    });
  });
};
