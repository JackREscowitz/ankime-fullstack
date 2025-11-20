// src/routes/api/usersApi.mjs

import express from 'express';
import passport from 'passport';
import { authLimiter } from '../../middleware/rateLimit.mjs';
import { User } from '../../models/db.mjs';

const router = express.Router();

// TODO: add minimum password security in the future
router.post('/register', authLimiter, async (req, res, next) => {
  console.log("POST /api/users/register");
  console.log("req.body:\n", req.body);
  try {
    const user = await User.register(
      new User({ username: req.body.username }),
      req.body.password
    );
    // Initiate login session for user
    req.logIn(user, err => {
      if (err) return next(err);

      console.log("Registered user:\n", user);
      return res.json({ success: true, user: { username: user.username }});
    });
  } catch (err) {
    next(err);
  }
});

router.post('/login', authLimiter, (req, res, next) => {
  console.log("POST /api/users/login");
  console.log("req.body:\n", req.body);
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      err = new Error(info?.message || "Bad credentials.");
      err.status = 401;
      return next(err);
    }
    req.logIn(user, (err) => {
      if (err) return next(err);

      console.log("Logged in user:\n", user);
      res.json({ success: true, user: { username: user.username } });
    });
  })(req, res, next);
});

export default router;