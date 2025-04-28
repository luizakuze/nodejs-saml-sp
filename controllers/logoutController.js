exports.index = (req, res, next) => {
    req.logout(err => (err ? next(err) : res.redirect('/')));
  };
  