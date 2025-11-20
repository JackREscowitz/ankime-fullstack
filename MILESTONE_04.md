Milestone 04 - Final Project Documentation
===

NetID
---
jre6172

Name
---
Jack Escowitz

Repository Link
---
https://github.com/nyu-csci-ua-0467-001-002-fall-2025/final-project-JackREscowitz

URL for deployed site 
---
https://final-project-jackrescowitz.onrender.com

URL for form 1 (from previous milestone) 
---
https://final-project-jackrescowitz.onrender.com/user/login

URL for form 2 (for current milestone)
---
https://final-project-jackrescowitz.onrender.com/my-cards

URL for form 3 (from previous milestone) 
---
https://final-project-jackrescowitz.onrender.com/my-cards/upload

First link to github line number(s) for constructor, HOF, etc.
---
https://github.com/nyu-csci-ua-0467-001-002-fall-2025/final-project-JackREscowitz/blob/5134e63166d5a682325ef6647230110b973cc0cd/src/public/js/main.js#L38

Second link to github line number(s) for constructor, HOF, etc.
---
https://github.com/nyu-csci-ua-0467-001-002-fall-2025/final-project-JackREscowitz/blob/5134e63166d5a682325ef6647230110b973cc0cd/src/public/js/main.js#L96

Short description for links above
---
`createCard` is a higher order function that takes the `btnFunctions` as an argument, 
which contains potentially three different functions, each, if they are provided, 
act as the functions for three potential buttons attached to a card.  
`createScreenshot` is a higher order function that takes the `onDelete` function as an 
argument, which if provided, acts as the function for a button that deletes a Screenshot.

Link to github line number(s) for schemas (db.js or models folder)
---
https://github.com/nyu-csci-ua-0467-001-002-fall-2025/final-project-JackREscowitz/tree/5134e63166d5a682325ef6647230110b973cc0cd/src/models

Description of research topics above with points
---
- **TailwindCSS + PostCSS** (2 points): for styling and responsive anime-themed UI.
- **multer + multer-S3** (2 points): for screenshot upload.
- **AWS S3 + AWS SDK S3 Client** (3 points): For image hosting in the cloud.
- **AniList API** (2 points): For fetching up to date list of anime/manga.
- **express-rate-limit** (1 point): For limiting requests to prevent abuse.

Links to github line number(s) for research topics described above (one link per line)
---
- [TailwindCSS + PostCSS](https://github.com/nyu-csci-ua-0467-001-002-fall-2025/final-project-JackREscowitz/blob/5134e63166d5a682325ef6647230110b973cc0cd/src/public/css/tailwind.css#L1)
- [multer + multer-S3](https://github.com/nyu-csci-ua-0467-001-002-fall-2025/final-project-JackREscowitz/blob/5134e63166d5a682325ef6647230110b973cc0cd/src/routes/api/screenshotsApi.mjs#L43-L68)
- [AWS S3 + AWS SDK S3 Client](https://github.com/nyu-csci-ua-0467-001-002-fall-2025/final-project-JackREscowitz/blob/5134e63166d5a682325ef6647230110b973cc0cd/src/routes/api/screenshotsApi.mjs#L285-L288)
- [AniList API](https://github.com/nyu-csci-ua-0467-001-002-fall-2025/final-project-JackREscowitz/blob/5134e63166d5a682325ef6647230110b973cc0cd/src/scripts/syncAnilist.mjs#L1-L128)
- [express-rate-limit](https://github.com/nyu-csci-ua-0467-001-002-fall-2025/final-project-JackREscowitz/blob/5134e63166d5a682325ef6647230110b973cc0cd/src/middleware/rateLimit.mjs#L1-L24)

Attributions
---
- src/scripts/syncAnilist.mjs: Query code based off of [Anilist API Docs](https://docs.anilist.co/guide/graphql/pagination).
- src/utils/srs.mjs: SM-2 algorithm code based off of [Supermemo method](https://www.supermemo.com/en/blog/application-of-a-computer-to-improve-the-results-obtained-in-working-with-the-supermemo-method).