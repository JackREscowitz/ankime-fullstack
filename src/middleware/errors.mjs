// src/middleware/errors.mjs

import multer from 'multer';

export function notFound(req, res, next) {
  const err = new Error(`Not Found: ${req.originalUrl}`);
  err.status = 404;
  next(err);
}

// TODO: Can set err.message before calling next(err) in each route
export function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;

  if (err instanceof multer.MulterError || err.message?.includes("Only image files")) {
    return res.status(400).json({ success: false, message: err.message });
  }
  if (err.name === "ValidationError") {
    return res.status(400).json({ success: false, message: err.message });
  }
  if (status === 401 || status === 403) { // Because of redirectIfAuthenticated
  // should not ever have status 401 but include in case
    return res.status(status).json({ success: false, message: err.message || "Unauthorized" });
  }
  if (status === 404) { // notFound
    return res.status(404).json({ success: false, message: err.message });
  }

  // Generic fallback
  console.error("Unhandled error:", err);
  res.status(status).json({
    success: false,
    message: status === 500 ? "Internal server error." : err.message || "Unexpected error." 
  });
}