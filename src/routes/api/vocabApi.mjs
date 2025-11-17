// src/routes/api/vocabApi.mjs

/**
 * /vocab routes
 *
 * All routes require authentication (ensureAuthn).
 *
 * POST /vocab
 *   - Auth: required
 *   - Body (JSON or urlencoded):
 *       - screenshotId   (Screenshot _id, required; must belong to user)
 *       - word         (string, required)
 *       - reading      (string, optional)
 *       - meaning      (string, required)
 *       - partOfSpeech (string, required; one of enum values)
 *       - notes        (string, optional)
 *   - Response: { success: true, vocab: VocabEntry }
 *
 * PATCH /vocab/:id
 *   - Auth: required, must own vocab entry
 *   - Params:
 *       - id (VocabEntry _id)
 *   - Body (JSON):
 *       - Any subset of vocab fields to update
 *   - Response: { success: true, vocab: VocabEntry }
 *
 * DELETE /vocab/:id
 *   - Auth: required, must own vocab entry
 *   - Params:
 *       - id (VocabEntry _id)
 *   - Body: none
 *   - Response: { success: true }
 */

import express from 'express';
import multer from 'multer';
import { VocabEntry } from '../../models/db.mjs';
import { ensureAuthn } from '../../middleware/authn.mjs';
import { verifyScreenshotOwnership, verifyVocabOwnership } from '../../middleware/authz.mjs';

const router = express.Router();
const upload = multer();

router.post('/', ensureAuthn, upload.none(), async (req, res, next) => {
  console.log("POST /api/vocab");
  console.log("req.body:\n", req.body);
  const { word, reading, meaning, partOfSpeech, notes, screenshotId } = req.body;
  try {
    await verifyScreenshotOwnership(screenshotId, req.user._id);
    const vocab = await VocabEntry.create({
      screenshot: screenshotId,
      word,
      reading,
      meaning,
      partOfSpeech,
      notes
    });

    console.log("Created VocabEntry:", vocab);
    res.json({ success: true, vocab });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', ensureAuthn, upload.none(), async (req, res, next) => {
  console.log("PATCH /api/vocab/:id");
  try {
    await verifyVocabOwnership(req.params.id, req.user._id);
    const vocab = await VocabEntry.findByIdAndUpdate(req.params.id, req.body, { new: true });

    console.log("Updated VocabEntry:", vocab);
    res.json({ success: true, vocab });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', ensureAuthn, async (req, res, next) => {
  console.log("DELETE /api/vocab/:id");
  try {
    await verifyVocabOwnership(req.params.id, req.user._id);
    await VocabEntry.deleteOne({ _id: req.params.id });

    console.log("Deleted VocabEntry ID:", req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
