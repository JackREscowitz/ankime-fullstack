import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: String,
  hash: String,
  uploads: [{ type: mongoose.Schema.Types.ObjectId, ref: "Screenshot" }]
});

const screenshotSchema = new mongoose.Schema({
  animeTitle: String,
  episode: Number,
  sentence: String,
  translation: String,
  imageUrl: String,
  uploader: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now }
});

const vocabSchema = new mongoose.Schema({
  screenshotId: { type: mongoose.Schema.Types.ObjectId, ref: "Screenshot" },
  word: String,
  reading: String,
  meaning: String,
  partOfSpeech: String,
  notes: String
});

export const User = mongoose.model("User", userSchema);
export const Screenshot = mongoose.model("Screenshot", screenshotSchema);
export const VocabEntry = mongoose.model("VocabEntry", vocabSchema);
