// src/routes/myCards.mjs
// All routes related to cards that the user owns

import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import multer from 'multer';
import { Screenshot, VocabEntry, UserCard } from '../models/db.mjs';
import { ensureAuthn } from '../middleware/authn.mjs';
import { verifyScreenshotOwnership, verifyVocabOwnership } from '../middleware/authz.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, '../public/uploads');

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

router.get('/', ensureAuthn, (req, res) => {
  res.render('my-cards');
});

router.get('/upload', ensureAuthn, (req, res) => {
  res.render('upload');
});

// TODO: verifying file type using file-type with s3 (not local uploads)
router.post('/upload-screenshot', ensureAuthn, upload.single('image'), async (req, res) => {
  try {
    const { title, sentence, translation } = req.body;

    if (!title || !sentence || !req.file) {
      const err = new Error("Missing required fields.");
      err.status = 400;
      return next(err);
    }

    const newScreenshot = new Screenshot({
      title,
      sentence,
      translation,
      imageUrl: `/uploads/${req.file.filename}`, // TODO: change for s3 implementation
      creator: req.user._id
    });

    await newScreenshot.save();

    const newUserCard = new UserCard({
      user: req.user._id,
      screenshot: newScreenshot._id
      // TODO: Other fields receive default values, change?
    })

    await newUserCard.save();

    res.json({
      success: true,
      imageUrl: `/uploads/${req.file.filename}`,
      title: newScreenshot.title,
      sentence: newScreenshot.sentence,
      translation: newScreenshot.translation,
      screenshotId: newScreenshot._id
    });
  } catch (err) {
    next(err);
  }
});

router.post('/upload-vocab', ensureAuthn, upload.none(), async (req, res) => {
  try {
    const { screenshotId, word, reading, meaning, partOfSpeech, notes } = req.body;
    
    if (!word || !meaning || !partOfSpeech) {
      const err = new Error("Missing required fields.");
      err.status = 400;
      return next(err);
    }
    
    await verifyScreenshotOwnership(screenshotId, req.user._id);

    const newVocab = new VocabEntry({
      screenshot: screenshotId,
      word,
      reading,
      meaning,
      partOfSpeech,
      notes
    });
    await newVocab.save();

    res.json({ success: true, vocab: newVocab });
  } catch (err) {
    next(err);
  }
})

router.delete('/delete-vocab/:id', ensureAuthn, async (req, res) => {
  try {
    await verifyVocabOwnership(req.params.id, req.user._id);
    await VocabEntry.deleteOne({ _id: req.params.id });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
})

// TODO: implement browsing

// TODO: implement review page
router.get('/review', ensureAuthn, (req, res) => {
  res.render('review');
});

export default router;