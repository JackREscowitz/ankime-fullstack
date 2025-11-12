// src/middleware/authn.mjs
// All middleware related to authentication

export function ensureAuthn(req, res, next) {
  if (req.isAuthenticated()) return next();
  // Store where user was trying to navigate to in order to redirect them back later
  req.session.returnTo = req.originalUrl;
  res.redirect('/user/login');
}

export function redirectIfAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return res.redirect('/');
  next();
}