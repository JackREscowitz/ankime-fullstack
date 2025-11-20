// src/routes/api/screenshotsApi.mjs

import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import multerS3 from 'multer-s3';
import path from 'path';
import { fileURLToPath } from 'url';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Screenshot, UserCard, VocabEntry } from '../../models/db.mjs';
import { ensureAuthnApi } from '../../middleware/authn.mjs';
import { verifyScreenshotOwnership } from '../../middleware/authz.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Local storage version (replaced with S3)
// const uploadsDir = path.join(__dirname, '../../public/uploads');

// Configure S3 client
const s3 = new S3Client({
  region: process.env.AWS_REGION,
})

const MAX_SCREENSHOT_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

const router = express.Router();

// const upload = multer({
//   dest: uploadsDir,
//   limits: {
//     fileSize: MAX_SCREENSHOT_FILE_SIZE
//   },
//   fileFilter: (req, file, cb) => { // Calls 'cb' if file should be accepted
//     const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
//     if (!allowed.includes(file.mimetype)) {
//       return cb(new Error("Only image files are allowed."));
//     }
//     cb(null, true);
//   }
// });

// Adds req.file with location (full HTTPS URL) and key (S3 Key) properties
const upload = multer({
  storage: multerS3({
    s3,
    bucket: process.env.S3_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      // Unique file name per user
      const ext = path.extname(file.originalname) || '';
      const random = Math.round(Math.random() * 1e9);
      const filename = `${Date.now()}-${random}${ext}`;
      const key = `screenshots/${req.user._id}/${filename}`;
      cb(null, key);
    }
  }),
  limits: {
    fileSize: MAX_SCREENSHOT_FILE_SIZE
  },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Only image files are allowed."));
    }
    cb(null, true);
  }
});

router.get('/', ensureAuthnApi, async (req, res, next) => {
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

router.post('/', ensureAuthnApi, upload.single('image'), async (req, res, next) => {
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
      imageUrl: req.file.location,
      s3Key: req.file.key,
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

router.post('/clone/:id', ensureAuthnApi, async (req, res, next) => {
  console.log("POST /api/screenshots/clone/:id");
  try {

    // Clone screenshot with same metadata and reused image
    const originalScreenshot = await Screenshot.findById(req.params.id);
    if (!originalScreenshot) {
      const err = new Error("Failed to clone screenshot, original screenshot not found.");
      err.status = 404;
      return next(err);
    }

    // Cannot clone your own screenshot
    if (originalScreenshot.creator.equals(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: "This card already belongs to you."
      })
    }

    const cloneScreenshot = await Screenshot.create({
      anilist_id: originalScreenshot.anilist_id,
      sentence: originalScreenshot.sentence,
      translation: originalScreenshot.translation,
      imageUrl: originalScreenshot.imageUrl,
      s3Key: originalScreenshot.s3Key,
      creator: req.user._id
    });

    // Clone vocab entries
    const originalVocab = await VocabEntry.find({ screenshot: originalScreenshot._id });
    if (originalVocab.length > 0) {
      const cloneVocab = originalVocab.map(v => ({
        word: v.word,
        reading: v.reading,
        meaning: v.meaning,
        partOfSpeech: v.partOfSpeech,
        screenshot: cloneScreenshot._id,
        user: req.user._id
      }));

      await VocabEntry.insertMany(cloneVocab);
    }

    // Each screenshot automatically gets a UserCard
    await UserCard.create({
      user: req.user._id,
      screenshot: cloneScreenshot._id
    });

    // Get the corresponding AniTitle
    const pipeline = [
      { $match: { _id: cloneScreenshot._id } },

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

    const cloneWithAni = (await Screenshot.aggregate(pipeline))[0];

    console.log("Cloned Screenshot:", cloneWithAni);
    res.json({ success: true, screenshot: cloneWithAni });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', ensureAuthnApi, async (req, res, next) => {
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

router.patch('/:id', ensureAuthnApi, async (req, res, next) => {
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

router.delete('/:id', ensureAuthnApi, async (req, res, next) => {
  console.log("DELETE /api/screenshots/:id");

  try {
    const screenshotId = req.params.id;
    await verifyScreenshotOwnership(screenshotId, req.user._id);

    const screenshot = await Screenshot.findById(screenshotId);
    const imageUrl = screenshot.imageUrl;
    const s3Key = screenshot.s3Key;

    await VocabEntry.deleteMany({ screenshot: screenshotId });
    await UserCard.deleteOne({ screenshot: screenshotId });
    await Screenshot.deleteOne({ _id: screenshotId });

    // If there are no screenshots that still use this same iamge, delete the S3 object
    const count = await Screenshot.countDocuments({ imageUrl });
    if (count === 0 && s3Key) {
      try {
        // const filePath = path.join(__dirname, '../../public', imageUrl);
        // await fs.unlink(filePath);
        // console.log("Deleted unused image:", filePath);

        await s3.send(new DeleteObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME,
          Key: s3Key
        }));
        console.log("Deleted unused S3 image:", s3Key);
      } catch (err) {
        console.error("Non-fatal error: Failed to delete S3 object", err);
      }
    } else {
      console.log(`Image still used by ${count} screenshots, not deleting S3 object.`);
    }

    console.log("Deleted Screenshot ID:", screenshotId);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;