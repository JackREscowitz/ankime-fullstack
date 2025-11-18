// src/public/js/pages/home.js

import { createElement, createCard } from "../main.js";

const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const cardsContainer = document.getElementById('cards-container');
const loggedIn = document.body.dataset.loggedIn === "true";

async function search() {
  try {
    const query = searchInput.value.trim();
    const response = await fetch(`/api/search/?q=${encodeURIComponent(query)}`);
    const data = await response.json();
    cardsContainer.innerHTML = '';

    if (data.success) {
      data.results.forEach(result => {

        const card = createCard(
          result,
          result.vocab,
          result.ani,
          { handleAddToMyCards: loggedIn ? addHandler : null }
        );
        card.appendChild(createElement('p', `Posted by ${result.creator.username}`));
        cardsContainer.appendChild(card);
      });
    } else {
      throw new Error(result.message);
    }
  } catch (err) {
    console.error(err);
    alert(`Failed to perform search: ${err.message}`);
  }
}

searchForm.addEventListener('submit', (evt) => {
  evt.preventDefault();
  search();
})

// Initial load
search();

async function addHandler(screenshot, cardDiv, addBtn) {
  // TODO: create new duplicate screenshot and a new UserCard to go along with it
  if (!confirm("Add this card to your deck?")) return;

  addBtn.disabled = true;

  try {
    const response = await fetch(`/api/screenshots/clone/${screenshot._id}`, { method: 'POST' });
    const result = await response.json();
    if (result.success) {
      addBtn.textContent = "Added!";
      alert("Added to your deck!");
    } else {
      throw new Error(result.message);
    }
  } catch (err) {
    console.error(err);
    alert(`Failed to add card to your deck: ${err.message}`);

    addBtn.disabled = false;
  }

}