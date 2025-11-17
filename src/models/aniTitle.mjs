// src/models/aniTitle.mjs

import mongoose from 'mongoose';

const aniTitleSchema = new mongoose.Schema({
  anilist_id: { type: Number, unique: true },
  title: { type: String, required: true },
  native_title: String,
  type: { type: String, enum: ["ANIME", "MANGA"], required: true },
  updated_at: { type: Date, default: Date.now },
}, { versionKey: false });

export const AniTitle = mongoose.model("AniTitle", aniTitleSchema);