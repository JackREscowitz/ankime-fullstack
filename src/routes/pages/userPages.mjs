// src/routes/page/userPages.mjs
// All page routes related to user registration and login

import express from 'express';
import { redirectIfAuthenticated, ensureAuthnPages } from '../../middleware/authn.mjs';

const router = express.Router();

router.get('/register', redirectIfAuthenticated, (req, res) => {
  res.render('register');
});

router.get('/login', redirectIfAuthenticated, (req, res) => {
  res.render('login');
});

router.get('/logout', ensureAuthnPages, (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    res.redirect('/user/login');
  });
});

export default router;