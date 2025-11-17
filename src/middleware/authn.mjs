// src/middleware/authn.mjs
// All middleware related to authentication

export function ensureAuthn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/user/login');
}

export function redirectIfAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return res.redirect('/');
  next();
}