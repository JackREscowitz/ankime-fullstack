// src/utils/srs.mjs

export function applySM2(card, rating) {
  // Rating: 0 = Again, 1 = Hard, 2 = Good, 3 = Easy
  let { repetitions, interval, easeFactor } = card;

  if (rating === 0) { // Total failure (Again)
    repetitions = 0;
    interval = 1;
  }
  else { // Successful review
    repetitions += 1;

    if (repetitions === 1) {
      interval = 1;
    } else if (repetitions === 2) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
  }

  // Update easeFactor using SuperMemo 2 formula
  easeFactor = easeFactor + (0.1 - (3 - rating) * (0.08 + (3 - rating) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3;

  const nextReview = new Date(Date.now() + interval * 24 * 60 * 60 * 1000);

  return { repetitions, interval, easeFactor, nextReview };
}