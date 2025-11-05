// passportConfig.mjs

import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { User } from './models/db.mjs';

// Use static authenticate method of model in LocalStrategy
// Will run this strategy when passport.authenticate('local') is called
passport.use(new LocalStrategy(User.authenticate()));

// Use static serialize and deserialize of model for passport session support
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());