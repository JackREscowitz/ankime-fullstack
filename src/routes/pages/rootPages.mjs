// src/routes/pages/rootPages.mjs
// Root page routes

import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
  res.render('home');
})

router.get('/about', (req, res) => {
  res.render('about');
})

export default router;