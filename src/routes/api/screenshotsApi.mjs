// src/routes/api/screenshotsApi.mjs

/**
 * /screenshots routes
 *
 * All routes require authentication (ensureAuthn).
 *
 * These routes now use MongoDB aggregation ($lookup) to attach AniTitle
 * information based on the numeric `anilist_id` field. We do NOT use
 * Mongoose populate() for this field, since Screenshot.anilist_id is a Number,
 * not an ObjectId reference.
 *
 * ---------------------------------------------------------------------------
 *
 * GET /screenshots
 *   - Description:
 *       Returns all screenshots belonging to the authenticated user,
 *       with the AniTitle (ani) joined via $lookup on anilist_id.
 *
 *   - Params: none
 *   - Query: none
 *   - Body: none
 *
 *   - Response:
 *       {
 *         success: true,
 *         screenshots: [
 *           {
 *             _id: ObjectId,
 *             anilist_id: Number,
 *             sentence: String,
 *             translation: String,
 *             imageUrl: String,
 *             creator: ObjectId,
 *             ani: {                    // Joined from AniTitle
 *               anilist_id: Number,
 *               title: String,
 *               native_title: String,
 *               type: "ANIME" | "MANGA"
 *             },
 *             createdAt: Date,
 *             updatedAt: Date
 *           },
 *           ...
 *         ]
 *       }
 *
 * POST /screenshots
 *   - Description:
 *       Upload a screenshot (image file + metadata), create a Screenshot
 *       document, and automatically create a UserCard for it. The returned
 *       Screenshot includes full AniTitle information joined via $lookup.
 *
 *   - Auth: required
 *   - Body (multipart/form-data):
 *       - image        (file, required)
 *       - anilist_id   (string/number, required)
 *       - sentence     (string, required)
 *       - translation  (string, optional)
 *
 *   - Side effects:
 *       - Creates Screenshot
 *       - Attaches AniTitle via aggregation
 *       - Creates UserCard pointing to the Screenshot
 *
 *   - Response:
 *       {
 *         success: true,
 *         screenshot: {
 *           _id: ObjectId,
 *           anilist_id: Number,
 *           sentence: String,
 *           translation: String,
 *           imageUrl: String,
 *           creator: ObjectId,
 *           ani: { ... AniTitle fields ... }
 *         }
 *       }
 *
 * GET /screenshots/:id
 *   - Description:
 *       Fetch a single screenshot with AniTitle joined via $lookup.
 *
 *   - Auth: required, must own screenshot
 *   - Params:
 *       - id (Screenshot _id)
 *
 *   - Response:
 *       {
 *         success: true,
 *         screenshot: {
 *           _id: ObjectId,
 *           anilist_id: Number,
 *           sentence: String,
 *           translation: String,
 *           imageUrl: String,
 *           creator: ObjectId,
 *           ani: { ... AniTitle fields ... }
 *         }
 *       }
 *
 * PATCH /screenshots/:id
 *   - Description:
 *       Update a screenshot's metadata.
 *
 *   - Auth: required, must own screenshot
 *   - Params:
 *       - id (Screenshot _id)
 *   - Body (JSON):
 *       - Any updatable screenshot fields (sentence, translation)
 *
 *   - Response:
 *       { success: true, updated: Screenshot }
 *
 * DELETE /screenshots/:id
 *   - Description:
 *       Delete a screenshot, its associated vocab entries, and its user card.
 *
 *   - Auth: required, must own screenshot
 *   - Params:
 *       - id (Screenshot _id)
 *
 *   - Response:
 *       { success: true }
 *
 */

import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { Screenshot, UserCard, VocabEntry } from '../../models/db.mjs';
import { ensureAuthn } from '../../middleware/authn.mjs';
import { verifyScreenshotOwnership } from '../../middleware/authz.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, '../../public/uploads');

const MAX_SCREENSHOT_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

const router = express.Router();

const upload = multer({
  dest: uploadsDir,
  limits: {
    fileSize: MAX_SCREENSHOT_FILE_SIZE
  },
  fileFilter: (req, file, cb) => { // Calls 'cb' if file should be accepted
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Only image files are allowed."));
    }
    cb(null, true);
  }
});

router.get('/', ensureAuthn, async (req, res, next) => {
  console.log("GET /api/screenshots");
  try {
    const pipeline = [
      { $match: { creator: req.user._id } },

      {
        $lookup: {
          from: "anititles",
          localField: "anilist_id",
          foreignField: "anilist_id",
          as: "ani"
        }
      },
      { $unwind: "$ani" }
    ];
    const screenshots = await Screenshot.aggregate(pipeline);

    console.log(`Found ${screenshots.length} screenshots for user ${req.user._id}`);
    res.json({ success: true, screenshots });
  } catch (err) {
    next(err);
  }
});

// TODO: verify file type using file-type with s3 (not local uploads)
router.post('/', ensureAuthn, upload.single('image'), async (req, res, next) => {
  console.log("POST /api/screenshots")
  console.log("req.body:\n", req.body);
  console.log("req.file:\n", req.file);
  try {
    const { anilist_id, sentence, translation } = req.body;

    if (!req.file) {
      const err = new Error("Image upload failed, no file received.");
      err.status = 400;
      return next(err);
    }

    const screenshot = await Screenshot.create({
      anilist_id: Number(anilist_id), // Required conversion since HTML form values always Strings
      sentence,
      translation: translation,
      imageUrl: `/uploads/${req.file.filename}`, // TODO: change for s3 implementation
      creator: req.user._id
    });

    // Get the corresponding AniTitle
    const pipeline = [
      { $match: { _id: screenshot._id } },

      {
        $lookup: {
          from: "anititles",
          localField: "anilist_id",
          foreignField: "anilist_id",
          as: "ani"
        }
      },
      { $unwind: "$ani" }
    ];
    const screenshotWithAni = (await Screenshot.aggregate(pipeline))[0];

    // Each screenshot automatically gets a UserCard
    await UserCard.create({
      user: req.user._id,
      screenshot: screenshot._id
    });

    console.log("Created Screenshot:", screenshotWithAni);
    res.json({ success: true, screenshot: screenshotWithAni });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', ensureAuthn, async (req, res, next) => {
  console.log("GET /api/screenshots/:id");
  try {
    await verifyScreenshotOwnership(req.params.id, req.user._id);

    const pipeline = [
      { $match: { _id: req.params.id } },

      {
        $lookup: {
          from: "anititles",
          localField: "anilist_id",
          foreignField: "anilist_id",
          as: "ani"
        }
      },
      { $unwind: "$ani" }
    ];

    const screenshot = (await Screenshot.aggregate(pipeline))[0];
    console.log("Got Screenshot:", screenshot);

    res.json({ success: true, screenshot });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', ensureAuthn, async (req, res, next) => {
  console.log("PATCH /api/screenshots/:id");
  try {
    await verifyScreenshotOwnership(req.params.id, req.user._id);
    const updated = await Screenshot.findByIdAndUpdate(req.params.id, req.body, { new: true });
    
    console.log("Updated Screenshot:", updated);
    res.json({ success: true, updated });
  } catch (err) {
    next(err);
  }
});

// TODO: also delete image file from uploads (or s3)
router.delete('/:id', ensureAuthn, async (req, res, next) => {
  console.log("DELETE /api/screenshots/:id");

  try {
    const screenshotId = req.params.id;
    await verifyScreenshotOwnership(screenshotId, req.user._id);

    await VocabEntry.deleteMany({ screenshot: screenshotId });

    await UserCard.deleteOne({ screenshot: screenshotId });

    await Screenshot.deleteOne({ _id: screenshotId });

    console.log("Deleted Screenshot ID:", screenshotId);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;