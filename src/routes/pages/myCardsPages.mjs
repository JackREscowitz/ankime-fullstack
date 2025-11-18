// src/routes/pages/myCards.mjs
// All page routes related to cards that the user owns

import express from 'express';
import { ensureAuthnPages } from '../../middleware/authn.mjs';

const router = express.Router();

router.get('/', ensureAuthnPages, (req, res) => {
  res.render('my-cards');
});

router.get('/upload', ensureAuthnPages, (req, res) => {
  res.render('upload');
});

router.get('/review', ensureAuthnPages, (req, res) => {
  res.render('review');
});

export default router;