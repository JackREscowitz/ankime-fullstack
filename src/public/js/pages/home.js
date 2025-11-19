// src/public/js/pages/home.js

import { createElement, createCard, showToast, showConfirm } from "../main.js";

const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const cardsContainer = document.getElementById('cards-container');
const searchMessageDiv = document.getElementById('search-message');
const loggedIn = document.body.dataset.loggedIn === "true";

let loadingTimeoutId = null;

async function search() {
  const query = searchInput.value.trim();

  if (loadingTimeoutId !== null) {
    clearTimeout(loadingTimeoutId);
    loadingTimeoutId = null;
  }

  if (query === '') { 
    searchMessageDiv.innerHTML = '';
    cardsContainer.innerHTML = '';
    return;
  }

  try {
    // Only show loading message after 300ms
    loadingTimeoutId = setTimeout(() => {
      searchMessageDiv.innerHTML = `
        <p class="animate-pulse">Loading...</p>
      `;
    }, 500);

    const response = await fetch(`/api/search/?q=${encodeURIComponent(query)}`);
    const data = await response.json();

    clearTimeout(loadingTimeoutId);
    loadingTimeoutId = null;
    searchMessageDiv.innerHTML = '';

    if (!data.success) throw new Error(data.message);

    if (data.results.length === 0) {
      cardsContainer.innerHTML = '';
      searchMessageDiv.innerHTML = `
        <p>No results found.</p>
      `;
      return;
    }

    // There are results
    searchMessageDiv.innerHTML = '';
    cardsContainer.innerHTML = '';

    data.results.forEach(result => {

      const card = createCard(
        result,
        result.vocab,
        result.ani,
        { handleAddToMyCards: loggedIn ? addHandler : null }
      );

      card.appendChild(
        createElement("p", `Posted by ${result.creator.username}`, {
          class: "text-xs text-slate-500 italic"
        })
      );
      cardsContainer.appendChild(card);
    });
    
  } catch (err) {
    console.error(err);
    if (loadingTimeoutId !== null) {
      clearTimeout(loadingTimeoutId);
      loadingTimeoutId = null;
    }
    searchMessageDiv.innerHTML = '';
    showToast(`Search failed: ${err.message}`, "error");
  }
}

searchForm.addEventListener('submit', (evt) => {
  evt.preventDefault();
  search();
})


async function addHandler(screenshot, cardDiv, addBtn) {
  const ok = await showConfirm("Add this card to your deck?");
  if (!ok) return;

  addBtn.disabled = true;

  try {
    const response = await fetch(`/api/screenshots/clone/${screenshot._id}`, { method: 'POST' });
    const result = await response.json();
    if (result.success) {
      addBtn.textContent = "Added!";
      showToast("Added to your deck!", "success");
    } else {
      throw new Error(result.message);
    }
  } catch (err) {
    console.error(err);
    showToast(`Failed to add card: ${err.message}`, "error");

    addBtn.disabled = false;
  }

}