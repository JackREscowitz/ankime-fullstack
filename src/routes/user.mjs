// user.mjs
// All routes related to user registration and login

import express from 'express';
import passport from 'passport';
import { User } from '../models/db.mjs';
import { redirectIfAuthenticated } from '../middleware/auth.mjs';

const router = express.Router();

router.get('/register', redirectIfAuthenticated, (req, res) => {
  res.render('register');
});

router.post('/register', async (req, res, next) => {
  try {
    const user = await User.register(
      new User({ username: req.body.username }),
      req.body.password
    );
    // Initiate login session for user
    req.logIn(user, err => {
      if (err) return next(err);
      return res.redirect('/');
    });
  } catch (err) {
    return res.render('register', { message: "Invalid registration information." });
  }
});

router.get('/login', redirectIfAuthenticated, (req, res) => {
  res.render('login');
});

router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.render('login', { message: info?.message || "Bad credentials." });
    req.logIn(user, (err) => {
      if (err) return next(err);
      // Redirect back to protected URL user tried to visit
      const dest = req.session.returnTo || '/';
      delete req.session.returnTo;
      return res.redirect(dest);
    });
  })(req, res, next);
});

router.get('/logout', (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    res.redirect('/user/login');
  });
});

export default router;