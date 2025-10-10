function ensureOrderAuth(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) return next();
  const returnTo = encodeURIComponent(req.originalUrl);
  return res.redirect(`/login?returnTo=${returnTo}`);
}

module.exports = ensureOrderAuth;