// errors.mjs

export function notFound(req, res, next) {
  const err = new Error(`Not Found: ${req.originalUrl}`);
  err.status = 404;
  next(err);
}

export function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  // TODO: finish this middleware
}