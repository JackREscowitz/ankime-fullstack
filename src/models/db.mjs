// db.mjs

import mongoose from "mongoose";
import passportLocalMongoose from 'passport-local-mongoose';

mongoose.connect(process.env.DSN);

// Users
const userSchema = new mongoose.Schema({});

userSchema.plugin(passportLocalMongoose);

// Screenshots
const screenshotSchema = new mongoose.Schema({
  title: { type: String, required: true },
  sentence: { type: String, required: true },
  translation: String,
  imageUrl: { type: String, required: true },
  public: { type: Boolean, default: false },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

// Vocab Entry
// Points to a Screenshot
const vocabSchema = new mongoose.Schema({
  screenshot: { type: mongoose.Schema.Types.ObjectId, ref: "Screenshot", required: true },
  word: { type: String, required: true },
  reading: { type: String, required: true },
  meaning: { type: String, required: true },
  partOfSpeech: { type: String, required: true },
  notes: String
});

// User Cards - screenshots in a user's deck
// Points to a Screenshot, contains data related to reviewing
// When a user uploads a new Screenshot, a User Card points to that screenshot
// When a user posts the Screenshot, a duplicate screenshot is created, with its
// public field set to true. No new User Card is created however, so the deck
// has no duplicates
// When a user adds a public Screenshot to their deck, a duplicate Screenshot is
// created with its public field set to false. A new User Card is created that
// points to this new Screenshot.
const userCardSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  screenshot: { type: mongoose.Schema.Types.ObjectId, ref: "Screenshot", required: true },

  // Review State
  isInReview: { type: Boolean, default: false },
  interval: { type: Number, default: null },
  repetitions: { type: Number, default: 0 },
  easeFactor: { type: Number, default: 2.5 },
  nextReview: { type: Date, default: null }
}, { timestamps: true });

export const User = mongoose.model("User", userSchema);
export const Screenshot = mongoose.model("Screenshot", screenshotSchema);
export const VocabEntry = mongoose.model("VocabEntry", vocabSchema);
export const UserCard = mongoose.model("UserCard", userCardSchema);