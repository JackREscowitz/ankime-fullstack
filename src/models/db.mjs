// src/models/db.mjs
// User, Screenshot, VocabEntry, UserCard

import mongoose from "mongoose";
import passportLocalMongoose from 'passport-local-mongoose';

// To be used in main app and scripts that update the DB
export async function connectDB() {
  if (mongoose.connection.readyState === 1) return;
  try {
    await mongoose.connect(process.env.DSN);
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("Could not connect to MongoDB:", err);
  }
}

// Users
const userSchema = new mongoose.Schema({});

userSchema.plugin(passportLocalMongoose);

// Screenshots
const screenshotSchema = new mongoose.Schema({
  // title: { type: String, required: true },
  // Each screenshot now points to unique AniTitle ID instead of String title
  // This should help with title input field dropdown
  anilist_id: { type: Number, required: true }, 
  sentence: { type: String, required: true },
  translation: String,
  imageUrl: { type: String, required: true }, // Full S3 URL
  s3Key: { type: String, required: true },    // Unique identifier within S3
  public: { type: Boolean, default: false },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

// Vocab Entry
// Points to a Screenshot
const vocabSchema = new mongoose.Schema({
  screenshot: { type: mongoose.Schema.Types.ObjectId, ref: "Screenshot", required: true },
  word: { type: String, required: true },
  reading: { type: String },
  meaning: { type: String, required: true },
  partOfSpeech: {
    type: String,
    enum: ['noun',                  // 名詞
           'verb',                  // 動詞
           'i-adjective',           // 形容詞
           'na-adjective',          // 形容動詞
           'adverb',                // 副詞
           'pronoun',               // 代名詞
           'particle',              // 助詞
           'conjunction',           // 接続詞
           'interjection',          // 感動詞
           'auxiliary-verb',        // 助動詞
           'prenominal',            // 連体詞
           'prefix',                // 接頭辞
           'suffix',                // 接尾辞
           'other',                 // その他
          ],
    default: 'other'
  },
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
  isInReview: { type: Boolean, default: true }, // Is it in the review rotation at all
  interval: { type: Number, default: 0 },       // How many days until next review
  repetitions: { type: Number, default: 0 },    // Successful review in a row
  easeFactor: { type: Number, default: 2.5 },   // SM-2 algorithm variable
  nextReview: { type: Date, default: () => new Date() }
}, { timestamps: true });

export const User = mongoose.model("User", userSchema);
export const Screenshot = mongoose.model("Screenshot", screenshotSchema);
export const VocabEntry = mongoose.model("VocabEntry", vocabSchema);
export const UserCard = mongoose.model("UserCard", userCardSchema);