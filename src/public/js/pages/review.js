// src/public/js/pages/review.js

import { createElement, createScreenshot, createVocabItem, POS_LABELS } from "../main.js";

const reviewContainer = document.getElementById('review-container');

let cards = [];

async function loadDueCards() {
  const response = await fetch('/api/review/due');
  const data = await response.json();
  cards = data.results;
  showNextCard();
}

function showNextCard() {
  if (cards.length === 0) {
    reviewContainer.innerHTML = '<p>No cards due for review.</p>';
    return;
  }

  const card = cards[0];
  reviewContainer.innerHTML = '';

  const cardDiv = createElement('div', null, {
    class: "bg-white rounded-xl shadow-lg p-6 space-y-4 max-w-xl mx-auto"
  });


  // Front of card
  const { translation, ...screenshotWithoutTranslation } = card.screenshot;
  const screenshotDiv = createScreenshot(screenshotWithoutTranslation, card.ani);
  cardDiv.appendChild(screenshotDiv);

  const revealBtn = createElement('button', "Reveal", {
    class: "w-full px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition"
  });

  cardDiv.appendChild(revealBtn);

  // Back of card
  const backDiv = createElement('div', null, {
    class: "space-y-4"
  });
  const translationParagraph = createElement('p', `Translation: ${card.screenshot.translation}`, {
    class: "text-slate-700"
  });
  backDiv.appendChild(translationParagraph);

  card.vocab.forEach(entry => {
    const vocabDiv = createVocabItem(entry, POS_LABELS, null);
    backDiv.appendChild(vocabDiv);
  });

  const ratings = ["Again", "Hard", "Good", "Easy"];

  for (let i = 0; i < 4; i++) {
    const ratingBtn = createElement('button', ratings[i], {
      "data-rating": i,
      class: "px-4 py-2 rounded-lg font-medium shadow border border-slate-200 hover:bg-slate-100 transition"
    });
    backDiv.appendChild(ratingBtn);
  }

  cardDiv.appendChild(backDiv);

  revealBtn.addEventListener('click', () => {
    backDiv.style.display = "block";
    revealBtn.style.display = "none";
  });

  // Functionality for rating buttons
  Array.from(backDiv.querySelectorAll("[data-rating]")).forEach(btn => {
    btn.addEventListener('click', () => {
      submitRating(card._id, Number(btn.dataset.rating));
    });
  });

  reviewContainer.appendChild(cardDiv);
}

async function submitRating(cardId, rating) {
  await fetch(`/api/review/${cardId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rating })
  });

  cards.shift();
  showNextCard();
}

loadDueCards();