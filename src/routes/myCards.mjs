// myCards.mjs
// All routes related to cards that the user owns

import express from 'express';
import multer from 'multer';
import { Screenshot } from '../models/db.mjs';
import { ensureAuth } from '../middleware/auth.mjs';

const router = express.Router();
const upload = multer({ dest: '../public/uploads/' });

router.get('/', ensureAuth, (req, res) => {
  res.render('my-cards', { page: 'my-cards'});
});

// TODO: create upload screenshot functionality
router.get('/upload', ensureAuth, (req, res) => {
  res.render('upload', { page: 'upload' });
});

router.post('/upload-screenshot', ensureAuth, upload.single('image'), async (req, res) => {
  try {
    const newScreenshot = new Screenshot({
      title: req.body.title,
      sentence: req.body.sentence,
      translation: req.body.translation,
      imageUrl: req.file.path,
      creator: req.user._id
    });
    await newScreenshot.save();
    // TODO: Send back that it uploaded successfully
  } catch (err) {
    // TODO: Send back error information
  }
});

// TODO: implement browsing

// TODO: implement review page
router.get('/review', ensureAuth, (req, res) => {
  res.render('review');
});

export default router;