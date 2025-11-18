// src/middleware/authz.mjs
// All middleware related to authorization

import mongoose from 'mongoose';
import { Screenshot, VocabEntry, UserCard } from '../models/db.mjs';

export async function verifyScreenshotOwnership(screenshotId, userId) {
  if (!mongoose.isValidObjectId(screenshotId)) {
    const err = new Error("Invalid screenshot id.");
    err.status = 400;
    throw err;
  }
  const screenshot = await Screenshot.findById(screenshotId).lean();
  if (!screenshot) {
    const err = new Error("Screenshot not found.");
    err.status = 404;
    throw err;
  }
  if (String(screenshot.creator) !== String(userId)) {
    const err = new Error("Not authorized to modify this screenshot.");
    err.status = 403;
    throw err;
  }
  return screenshot;
}

export async function verifyVocabOwnership(vocabId, userId) {
  if (!mongoose.isValidObjectId(vocabId)) {
    const err = new Error('Invalid vocab id');
    err.status = 400;
    throw err;
  }
  const vocab = await VocabEntry.findById(vocabId).populate('screenshot', 'creator').lean();
  if (!vocab) {
    const err = new Error('Vocab entry not found.');
    err.status = 404;
    throw err;
  }
  if (String(vocab.screenshot?.creator) !== String(userId)) {
    const err = new Error('Not authorized to modify this vocab entry.');
    err.status = 403;
    throw err;
  }
  return vocab;
}

export async function verifyUserCardOwnership(userCardId, userId) {
  if (!mongoose.isValidObjectId(userCardId)) {
    const err = new Error('Invalid user card id');
    err.status = 400;
    throw err;
  }
  const userCard = await UserCard.findById(userCardId).lean();
  if (!userCard) {
    const err = new Error('User card not found.');
    err.status = 404;
    throw err;
  }
  if (String(userCard.user) !== String(userId)) {
    const err = new Error('Not authorized to modify this user card.');
    err.status = 403;
    throw err;
  }
  return userCard;
}