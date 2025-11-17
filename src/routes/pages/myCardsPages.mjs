// src/routes/pages/myCards.mjs
// All page routes related to cards that the user owns

import express from 'express';
import { ensureAuthn } from '../../middleware/authn.mjs';

const router = express.Router();

router.get('/', ensureAuthn, (req, res) => {
  res.render('my-cards');
});

router.get('/upload', ensureAuthn, (req, res) => {
  res.render('upload');
});

// TODO: implement review page
router.get('/review', ensureAuthn, (req, res) => {
  res.render('review');
});

export default router;