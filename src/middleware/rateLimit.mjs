// src/middleware/rateLimit.mjs

import rateLimit from "express-rate-limit";

// API rate limiter: up to 300 requests per IP per 15 minutes
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false
});

// Stricter limiter for auth routes (login/register):
// Up to 20 requests per IP per 10 minutes
export const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: "Too many attempts, please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false
});