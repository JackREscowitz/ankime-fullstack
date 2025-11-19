// src/routes/api/reviewApi.mjs

import express from 'express';
import { UserCard } from '../../models/db.mjs';
import { ensureAuthnApi } from '../../middleware/authn.mjs';
import { verifyUserCardOwnership } from '../../middleware/authz.mjs';
import { applySM2 } from '../../utils/srs.mjs';

const router = express.Router();

router.patch('/:cardId', ensureAuthnApi, async (req, res, next) => {
  try {
    const { rating } = req.body;
    if (![0, 1, 2, 3].includes(rating)) {
      const err = new Error("Invalid rating");
      err.status = 400;
      throw err;
    }

    await verifyUserCardOwnership(req.params.cardId, req.user._id);

    // We have to load the document into memory in order to use applySM2
    const card = await UserCard.findById(req.params.cardId);

    const updates = applySM2(card, rating);

    card.isInReview = true;
    card.interval = updates.interval;
    card.repetitions = updates.repetitions;
    card.easeFactor = updates.easeFactor;
    card.nextReview = updates.nextReview;

    await card.save();

    res.json({ success: true, card });
  } catch (err) {
    next(err);
  }
})

// results = [
//   {
//     UserCard,
//     screenshot: Screenshot,
//     ani: AniTitle,
//     vocab: [VocabEntry]
//   }
// ]
router.get('/due', ensureAuthnApi, async (req, res, next) => {
  try {

    const pipeline = [
      {
        $match: {
          user: req.user._id,
          isInReview: true,
          nextReview: { $lte: new Date() }
        }
      },

      // Join Screenshot
      {
        $lookup: {
          from: "screenshots",
          localField: "screenshot",
          foreignField: "_id",
          as: "screenshot"
        }
      },
      { $unwind: "$screenshot" },

      // Join AniTitle for the screenshot
      {
        $lookup: {
          from: "anititles",
          localField: "screenshot.anilist_id",
          foreignField: "anilist_id",
          as: "ani"
        }
      },
      { $unwind: "$ani" },

      // Join vocab entries associated with the screenshot
      {
        $lookup: {
          from: "vocabentries",
          localField: "screenshot._id",
          foreignField: "screenshot",
          as: "vocab"
        }
      },

      { $sort: { nextReview: 1 } }
    ];

    const cards = await UserCard.aggregate(pipeline);
    res.json({ success: true, results: cards });
  } catch (err) {
    next(err);
  }
});

router.get('/due/count', ensureAuthnApi, async (req, res, next) => {
  try {
    const now = new Date();
    
    const count = await UserCard.countDocuments({
      user: req.user._id,
      isInReview: true,
      nextReview: { $lte: now }
    });

    res.json({ success: true, count });
  } catch (err) {
    next(err);
  }
});

export default router;