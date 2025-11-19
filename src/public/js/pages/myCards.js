// src/public/js/pages/myCards.js

import { createCard, showConfirm, showToast } from '../main.js';

const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const cardsContainer = document.getElementById('cards-container');
const searchMessageDiv = document.getElementById('search-message');

let loadingTimeoutId = null;

async function search() {
  const query = searchInput.value.trim();

  if (loadingTimeoutId !== null) {
    clearTimeout(loadingTimeoutId);
    loadingTimeoutId = null;
  }

  try {
    loadingTimeoutId = setTimeout(() => {
      searchMessageDiv.innerHTML = `
        <p class="animate-pulse">Loading...</p>
      `;
    }, 500);

    const response = await fetch(`/api/search/my-cards?q=${encodeURIComponent(query)}`);
    const data = await response.json();
    
    clearTimeout(loadingTimeoutId);
    loadingTimeoutId = null;
    searchMessageDiv.innerHTML = '';

    if (!data.success) throw new Error(data.message);

    if (data.results.length === 0) {
      cardsContainer.innerHTML = '';
      searchMessageDiv.innerHTML = `<p>No cards found.<p>`;
      return;
    }

    cardsContainer.innerHTML = '';
    data.results.forEach(result => {
      const card = createCard(result.shot, result.vocab, result.ani, { handleDelete, handlePublicToggle });
      cardsContainer.appendChild(card);
    });

  } catch (err) {
    console.error(err);
    if (loadingTimeoutId !== null) {
      clearTimeout(loadingTimeoutId);
      loadingTimeoutId = null;
    }

    searchMessageDiv.innerHTML = "";
    showToast(`Search failed: ${err.message}`, "error");
  }
}

searchForm.addEventListener('submit', (evt) => {
  evt.preventDefault();
  search();
})

search();

async function handleDelete(screenshot, cardDiv, deleteBtn) {
  const ok = await showConfirm("Delete this card? This cannot be undone.");
  if (!ok) return;

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
    showToast(`Delete failed: ${err.message}`, "error");
    deleteBtn.disabled = false;
  }
}

// TODO: cardDiv argument for potential css changes
async function handlePublicToggle(screenshot, cardDiv, publicToggleBtn) {
  let ok;
  if (screenshot.public) {
    ok = await showConfirm("Remove this card from the public collection?");
  } else {
    ok = await showConfirm("Make this card public? Users will be able to save their own copy to their decks.");
  }
  if (!ok) return;

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
    showToast(`Failed to update public status: ${err.message}`, "error");
  } finally {
    publicToggleBtn.disabled = false;
  }
}