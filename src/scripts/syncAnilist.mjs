// src/scripts/syncAnilist.mjs

import '../envConfig.mjs';
import mongoose from 'mongoose';
import { connectDB } from '../models/db.mjs';
import { AniTitle } from '../models/aniTitle.mjs';

await connectDB();

console.log("Starting AniList sync...");

let page = 1;
let hasNextPage = true;
let totalCount = 0;

const query = `
  query ($page: Int) {
    Page(page: $page, perPage: 50) {
      pageInfo {
        hasNextPage
      }
      media(type_in: [ANIME, MANGA]) {
        id
        title {
          english
          romaji
          native
        }
        type
        isAdult
      }
    }
  }
`;

const variables = { page };

const url = "https://graphql.anilist.co";
const options = {
  method: "POST",
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  body: JSON.stringify({ query, variables })
};

const response = await fetch("https://graphql.anilist.co");
const json = await response.json();

// TODO: handle the data