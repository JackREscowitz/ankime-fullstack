// src/public/js/pages/myCards.js

import { createCard } from '../main.js';

const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const cardsContainer = document.getElementById('cards-container');

async function search() {
  try {
    const query = searchInput.value.trim();
    const response = await fetch(`/api/search/my-cards?q=${encodeURIComponent(query)}`);
    const data = await response.json();
    cardsContainer.innerHTML = '';

    if (data.success) {
      data.results.forEach(result => {
        const card = createCard(result.shot, result.vocab, result.ani, null, handleCardDelete, handlePublicToggle);
        cardsContainer.appendChild(card);
      });
    } else {
      throw new Error(result.message);
    }
  } catch (err) {
    console.error(err);
    alert("Failed to perform search.");
  }
}

searchForm.addEventListener('submit', (evt) => {
  evt.preventDefault();
  search();
})

// Initial load
search();

async function handleCardDelete(screenshot, cardDiv, deleteBtn) {
  if (!confirm("Are you sure you want to delete this card? This action cannot be undone.")) return;

  deleteBtn.disabled = true;

  try {
    const response = await fetch(`/api/screenshots/${screenshot._id}`, { method: 'DELETE' });
    const result = await response.json();
    if (result.success) {
      cardDiv.remove();
    } else {
      throw new Error(result.message);
    }
  } catch (err) {
    console.error(err);
    alert("Failed to delete card.");
    deleteBtn.disabled = false;
  }
}

// TODO: cardDiv argument for potential css changes
async function handlePublicToggle(screenshot, cardDiv, publicToggleBtn) {
  const newPublicState = !screenshot.public;

  screenshot.public = newPublicState;
  publicToggleBtn.textContent = newPublicState ? "Remove from Public" : "Make Public";

  publicToggleBtn.disabled = true;

  try {
    const response = await fetch(`/api/screenshots/${screenshot._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ public: newPublicState })
    });

    const result = await response.json();
    if (!result.success) throw new Error(result.message);

  } catch (err) {
    console.error(err);
    // Reverse updates in case of error
    screenshot.public = !newPublicState;
    publicToggleBtn.textContent = screenshot.public ? "Remove from Public" : "Make Public";
    alert("Failed to update public status.");
  } finally {
    publicToggleBtn.disabled = false;
  }
}