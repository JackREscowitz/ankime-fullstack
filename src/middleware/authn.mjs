// src/middleware/authn.mjs
// All middleware related to authentication

export function ensureAuthnPages(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/user/login');
}

export function ensureAuthnApi(req, res, next) {
  if (req.isAuthenticated()) return next();
  const err = new Error("Authentication required.");
  err.status = 401;
  next(err);
}

export function redirectIfAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return res.redirect('/');
  next();
}