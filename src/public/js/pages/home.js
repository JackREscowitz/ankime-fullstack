// src/public/js/pages/home.js

import { createElement, createCard } from "../main.js";

const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const cardsContainer = document.getElementById('cards-container');

async function search() {
  try {
    const query = searchInput.value.trim();
    const response = await fetch(`/api/search/?q=${encodeURIComponent(query)}`);
    const data = await response.json();
    cardsContainer.innerHTML = '';

    if (data.success) {
      data.results.forEach(result => {
        const card = createCard(result, result.vocab, result.ani, handleAdd, null, null);
        card.appendChild(createElement('p', `Posted by ${result.creator.username}`));
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

function handleAdd() {
  // TODO: create new UserCard and duplicate screenshot
}