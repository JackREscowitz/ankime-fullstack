// src/scripts/syncAnilist.mjs

// NOTE: The AniList API has a rate limit of 90 requests per minute, but it is currently
// in a degraded state and is limited to 30 requests per minute.

import '../envConfig.mjs';
import mongoose from 'mongoose';
import { connectDB } from '../models/db.mjs';
import { AniTitle } from '../models/aniTitle.mjs';

const REQUESTS_PER_MIN = 30;
const REQUEST_INTERVAL_MS = Math.ceil(60000 / REQUESTS_PER_MIN);

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

await connectDB();

console.log("Starting AniList sync...");

let page = 1;
const PER_PAGE = 50;
let hasNextPage = true;
let totalCount = 0;

const query = `
  query ($page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        hasNextPage
      }
      media {
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

const variables = { perPage: PER_PAGE };
const url = "https://graphql.anilist.co";
const options = {
  method: "POST",
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

while (hasNextPage) {
  variables.page = page;
  options.body = JSON.stringify({ query, variables });

  try {
    const response = await fetch(url, options);
    const json = await response.json();

    if (json.errors) {
      if (json.errors.some(e => e.status === 429)) {
        console.warn("API rate limit hit, waiting before retrying...");
        await sleep(60000);
        continue; // Wait one minute and retry
      }
      throw new Error("AniList API error: " + JSON.stringify(json.errors));
    }

    // Format of json:
    // {
    //   "data": {
    //     "Page": {
    //       "pageInfo": {
    //         "hasNextPage": Boolean
    //       },
    //       "media": [
    //         {
    //           "id": Int,
    //           "title" {
    //             "english": String,
    //             "romaji": String,
    //             "native": String,
    //           }
    //           "type": MediaType ("ANIME" or "MANGA"),
    //           "isAdult": Boolean
    //         }
    //       ]
    //     }
    //   }
    // }

    const media = json.data.Page.media;
    const safeMedia = media.filter(m => !m.isAdult);
    const ops = safeMedia.map((m) => ({
      updateOne: {
        filter: { anilist_id: m.id },
        update: {
          $set: {
            title: m.title.english || m.title.romaji || m.title.native,
            native_title: m.title.native,
            type: m.type,
            updated_at: new Date()
          }
        },
        upsert: true
      }
    }));

    await AniTitle.bulkWrite(ops, { ordered: false });
    totalCount += safeMedia.length;
    console.log(`Synced ${totalCount} items so far (page ${page})`);

    hasNextPage = json.data.Page.pageInfo.hasNextPage;
    page++;

    await sleep(REQUEST_INTERVAL_MS);

  } catch (err) {
    console.error(`Error on page ${page}): ` + err.message);
    break;
  } 
}

console.log("Finished Anilist sync.");
await mongoose.disconnect();