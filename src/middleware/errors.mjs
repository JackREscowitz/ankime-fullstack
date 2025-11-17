// src/middleware/errors.mjs
// All back-end errors lead to here, front-end errors use console.error()
// Response: { success: false, message: err.message }

import multer from 'multer';

export function notFound(req, res, next) {
  const err = new Error(`Not Found: ${req.originalUrl}`);
  err.status = 404;
  next(err);
}

export function errorHandler(err, req, res, next) {
  if (err.name === "MissingUsernameError" || err.name === "MissingPasswordError") {
    err.status = err.status || 400;
    err.publicMessage = err.publicMessage || "Username and password are required.";
  } else if (err.name === "UserExistsError" || err.code === 11000) {
    err.status = err.status || 409;
    err.publicMessage = err.publicMessage || "Username already taken.";
  } else if (err.name === "ValidationError") { // Violates Mongoose schema
    err.status = err.status || 400;
    err.publicMessage = err.publicMessage || "Invalid data provided.";
  } else if (err instanceof multer.MulterError) {
    err.status = err.status || 400;
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        err.publicMessage = err.publicMessage || "File too large.";
        break;
      case 'LIMIT_FILE_COUNT':
        err.publicMessage = err.publicMessage || "Too many files uploaded.";
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        err.publicMessage = err.publicMessage || "Unexpected file upload.";
        break;
      default:
        err.publicMessage = err.publicMessage || "File upload error.";
    }
  }

  // If status hasn't been assigned yet, code is generic server error
  const status = err.status || err.statusCode || 500;
  const message = status >= 500 ? "Internal server error." : err.publicMessage || err.message || "Unexpected error.";
  if (status >= 500) console.error(err); // Only log server errors

  res.status(status).json({
    success: false,
    message
  });
}