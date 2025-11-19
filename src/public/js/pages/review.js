// src/public/js/pages/review.js

import { createElement, createScreenshot, createVocabItem, POS_LABELS, showToast } from "../main.js";

const reviewContainer = document.getElementById('review-container');
const reviewMessage = document.getElementById('review-message');
const dueCount = document.getElementById('due-count');

let loadingTimeoutId = null;
let cards = [];
let currentBackDiv = null;
let currentRevealBtn = null;
let currentRatingButtons = null;

async function loadDueCards() {
  if (loadingTimeoutId !== null) {
    clearTimeout(loadingTimeoutId);
    loadingTimeoutId = null;
  }

  loadingTimeoutId = setTimeout(() => {
    reviewMessage.innerHTML = `<p class="animate-pulse">Loading...</p>`;
  }, 500);

  try {
    const response = await fetch('/api/review/due');
    const data = await response.json();

    clearTimeout(loadingTimeoutId);
    loadingTimeoutId = null;
    reviewMessage.innerHTML = '';

    if (!data.success) throw new Error(data.message);

    cards = data.results;

    // This shows if the user clicks on review despite there being no cards
    if (cards.length === 0) {
      dueCount.textContent = '';
      reviewMessage.innerHTML = `<p class="text-slate-500">No cards due for review!</p>`;
      reviewContainer.innerHTML = '';
      return;
    }

    dueCount.textContent = `${cards.length} card${cards.length === 1 ? '' : 's'} due`;

    showNextCard();
  } catch (err) {
    console.error(err);

    if (loadingTimeoutId !== null) {
      clearTimeout(loadingTimeoutId);
      loadingTimeoutId = null;
    }

    dueCount.textContent = '';
    reviewMessage.innerHTML = `<p class="text-rose-600">Failed to load cards.</p>`;
  }
}

function showNextCard() {
  reviewContainer.innerHTML = '';

  // This shows if the user has no cards left after a rating
  if (cards.length === 0) {
    reviewMessage.innerHTML = `<p class="text-slate-500">Review complete!</p>`;
    dueCount.textContent = '';
    return;
  }

  reviewMessage.innerHTML = '';
  const card = cards[0];

  const cardDiv = createElement("div", null, {
    class: `
      fade-in bg-white rounded-xl shadow-lg
      p-6 space-y-4 max-w-xl mx-auto
    `
  });

  // Front of card
  const { translation, ...shotWithoutTranslation } = card.screenshot;
  const screenshotDiv = createScreenshot(shotWithoutTranslation, card.ani);
  cardDiv.appendChild(screenshotDiv);

  // Reveal Button
  const revealBtn = createElement("button", "Reveal", {
    class: "w-full px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition"
  });
  cardDiv.appendChild(revealBtn);
  currentRevealBtn = revealBtn;

  // Back of card
  const backDiv = createElement("div", null, {
    class: "space-y-4 hidden"
  });
  currentBackDiv = backDiv;

  const translationParagraph = createElement('p', `Translation: ${translation}`, {
    class: "text-slate-700"
  });
  backDiv.appendChild(translationParagraph);

  const vocabScroll = createElement("div", null, {
    class: "max-h-64 overflow-y-auto space-y-3 pr-1"
  });

  card.vocab.forEach(entry => {
    vocabScroll.appendChild(createVocabItem(entry, POS_LABELS, null));
  });

  backDiv.appendChild(vocabScroll);

  const ratings = ["Again", "Hard", "Good", "Easy"];
  const ratingStyles = [
    "bg-rose-500 text-white hover:bg-rose-600",
    "bg-amber-500 text-white hover:bg-amber-600",
    "bg-indigo-600 text-white hover:bg-indigo-700",
    "bg-emerald-600 text-white hover:bg-emerald-700"
  ];

  const ratingRow = createElement('div', null, {
    class: "grid grid-cols-2 gap-3"
  });
  currentRatingButtons = [];

  for (let i = 0; i < 4; i++) {
    const ratingBtn = createElement('button', ratings[i], {
      "data-rating": i,
      class: `px-4 py-2 rounded-lg shadow font-medium transition ${ratingStyles[i]}`
    });
    
    ratingBtn.addEventListener('click', () => 
      submitRating(card._id, i, ratingBtn)
    );
    currentRatingButtons.push(ratingBtn);
    ratingRow.appendChild(ratingBtn);
  }

  backDiv.appendChild(ratingRow);
  cardDiv.appendChild(backDiv);

  revealBtn.addEventListener('click', () => {
    revealBtn.classList.add("hidden");
    backDiv.classList.remove("hidden");
  });

  reviewContainer.appendChild(cardDiv);
}

async function submitRating(cardId, rating, btn) {
  btn.disabled = true;

  try {
    const response = await fetch(`/api/review/${cardId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating })
    });

    const data = await response.json();
    if (!data.success) throw new Error(data.message);

    showToast("Rating saved!", "success");

    cards.shift();
    dueCount.textContent = `${cards.length} card${cards.length === 1 ? "" : "s"} due`;

    showNextCard();

  } catch (err) {
    console.error(err);
    showToast(`Rating failed: ${err.message}`, "error");
    btn.disabled = false;
  }
}

document.addEventListener('keydown', (evt) => {
  if (cards.length === 0) return;

  // 1-4 for Ratings
  if (evt.key >= '1' && evt.key <= '4') {
    const index = Number(evt.key) - 1;
    const btn = currentRatingButtons[index];
    if (btn) btn.click();
    return;
  }

  // Space for Reveal
  if (evt.key === ' ' || evt.code === "Space") {
    evt.preventDefault(); // Prevents scroll

    // If the reveal button is not hidden, allow action
    if (currentRevealBtn && !currentRevealBtn.classList.contains("hidden")) {
      currentRevealBtn.click();
    }
  }
});

loadDueCards();