// src/routes/api/aniTitlesApi.mjs

import express from 'express';
import { AniTitle } from '../../models/aniTitle.mjs';

const router = express.Router();


router.get('/:anilist_id', async (req, res, next) => {
  console.log(`GET /api/anititles/${req.params.anilist_id}`);
  try {
    const id = Number(req.params.anilist_id);
    if (Number.isNaN(id)) {
      const err = new Error("Invalid anilist_id");
      err.status = 400;
      throw err;
    }

    const aniTitle = await AniTitle.findOne({ anilist_id: id });
    if (!aniTitle) {
      const err = new Error("AniTitle not found.");
      err.status = 404;
      throw err;
    }

    console.log("Got AniTitle:\n", aniTitle);
    res.json({ success: true, aniTitle });
  } catch (err) {
    next(err);
  }
});

export default router;
