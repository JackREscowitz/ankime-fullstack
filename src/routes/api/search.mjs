// src/routes/api/search.mjs

import express from 'express';
import mongoose from 'mongoose';
import { AniTitle } from '../../models/aniTitle.mjs';
import { UserCard, Screenshot } from '../../models/db.mjs';
import { ensureAuthnApi } from '../../middleware/authn.mjs';


const router = express.Router();

// results = [
//   {
//     Screenshot,
//     creator: {
//       _id: ObjectId,
//       username: String
//     },
//     ani: AniTitle,
//     vocab: [VocabEntry]
//   }
// ]
router.get('/', async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.json({ success: true, results: [] });

    const searchRegex = new RegExp(q, 'i');

    const pipeline = [
      // Only show public screenshots
      { $match: { public: true } },

      // Join the User who made and posted the screenshot in field creator
      {
        $lookup: {
          from: "users",
          localField: "creator",
          foreignField: "_id",
          as: "creator",
          // Only include the username field from the joined user document
          pipeline: [
            { $project: { username: 1 } }
          ]
        }
      },
      { $unwind: "$creator" },

      // Join the AniTitle that screenshot points to in field ani
      {
        $lookup: {
          from: "anititles",
          localField: "anilist_id",
          foreignField: "anilist_id",
          as: "ani"
        }
      },
      { $unwind: "$ani" },

      // Join VocabEntry that points to screenshot in field vocab
      {
        $lookup: {
          from: "vocabentries",
          localField: "_id",
          foreignField: "screenshot",
          as: "vocab"
        }
      }
    ];

    // Search filter
    if (q) {
      pipeline.push({
        $match: {
          $or: [
            { "vocab.word":       { $regex: searchRegex } },
            { "vocab.reading":    { $regex: searchRegex } },
            { "vocab.meaning":    { $regex: searchRegex } },
            { "vocab.notes":      { $regex: searchRegex } },
            { "ani.title":        { $regex: searchRegex } },
            { "ani.native_title": { $regex: searchRegex } },
            { "creator.username": { $regex: searchRegex } }
          ]
        }
      })
    }

    pipeline.push({ $sort: { createdAt: -1 } });

    const results = await Screenshot.aggregate(pipeline);
    res.json({ success: true, results });

  } catch (err) {
    next(err);
  }
});

router.get('/my-cards', ensureAuthnApi, async (req, res, next) => {
  try {
    const userId = req.user._id;
    const q = (req.query.q || '').trim();

    const searchRegex = q ? new RegExp(q, 'i') : null; // Case-insensitive

    const pipeline = [
      // Restrict to this user
      { $match: { user: userId } },

      // Join Screenshot attached to this UserCard in field shot
      {
        $lookup: {
          from: "screenshots",
          localField: "screenshot",
          foreignField: "_id",
          as: "shot"
        }
      },
      { $unwind: "$shot" },

      // Join the AniTitle that shot points to in field ani
      {
        $lookup: {
          from: "anititles",
          localField: "shot.anilist_id",
          foreignField: "anilist_id",
          as: "ani"
        }
      },
      { $unwind: "$ani" },

      // Join VocabEntry that points to shot in field vocab
      {
        $lookup: {
          from: "vocabentries",
          localField: "shot._id",
          foreignField: "screenshot",
          as: "vocab"
        }
      }
    ];

    // Search filter
    if (q) {
      pipeline.push({
        $match: {
          $or: [
            { "vocab.word":       { $regex: searchRegex } },
            { "vocab.reading":    { $regex: searchRegex } },
            { "vocab.meaning":    { $regex: searchRegex } },
            { "vocab.notes":      { $regex: searchRegex } },
            { "ani.title":        { $regex: searchRegex } },
            { "ani.native_title": { $regex: searchRegex } }
          ]
        }
      })
    }

    pipeline.push({ $sort: { createdAt: -1 } });

    // If no search query, limit to 6 newest cards
    if (!q) {
      pipeline.push({ $limit: 6 });
    }

    const results = await UserCard.aggregate(pipeline);
    res.json({ success: true, results });

  } catch (err) {
    next(err);
  }
});

router.get('/anititles', async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.json({ success: true, results: [] });

    const regex = new RegExp(q, 'i');

    const results = await AniTitle.find({
      $or: [
        { title: regex },
        { native_title: regex }
      ]
    })
    .sort({ title: 1 })
    .limit(10);

    res.json({ success: true, results });
  } catch (err) {
    next(err);
  }
});

export default router;