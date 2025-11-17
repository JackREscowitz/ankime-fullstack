// src/public/js/pages/upload.js

import { createElement, createScreenshot, createVocabItem, POS_LABELS } from '../main.js';

const uploadScreenshotFormContainer = document.getElementById('upload-screenshot-form-container');
const uploadScreenshotForm = document.getElementById('upload-screenshot-form');
const uploadResult = document.getElementById('upload-result');
const uploadVocabFormContainer = document.getElementById('upload-vocab-form-container');
const uploadVocabForm = document.getElementById('upload-vocab-form');
const titleSearch = document.getElementById('title-search');
const titleResultsDropdown = document.getElementById('title-results');
const hiddenAnilistId = document.getElementById('anilist-id');

let timeout = null;
let controller = null;

titleSearch.addEventListener('input', () => {
  const query = titleSearch.value.trim();
  titleResultsDropdown.innerHTML = '';
  hiddenAnilistId.value = '';
  
  // Only fetch when the user pauses typing for 250ms
  clearTimeout(timeout);
  timeout = setTimeout(async () => {
    if (!query) return;

    // AbortController object used to abort fetch requests
    // when the user is typing quickly
    if (controller) controller.abort();
    controller = new AbortController();

    try {
      const response = await fetch(`/api/search/anititles?q=${encodeURIComponent(query)}`, {
        signal: controller.signal
      });
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Search failed.");
      }
      const results = data.results;
      titleResultsDropdown.innerHTML = '';
      
      results.forEach(item => {
      const div = createElement(
        'div', 
        `${item.title.trim()} ${item.native_title.trim() || ''} (${item.type === "ANIME" ? "Anime" : "Manga"})`,
        {} // TODO: css additions
      );
      // User selects a title from dropdown
      div.addEventListener('click', () => {
        titleSearch.value = item.title;
        hiddenAnilistId.value = item.anilist_id;
        titleResultsDropdown.innerHTML = '';
      });
      titleResultsDropdown.appendChild(div);
    });
    } catch (err) {
      console.error(err);
      return null;
    }
  }, 250);
});

uploadScreenshotForm.addEventListener('submit', async (evt) => {
  evt.preventDefault();

  if (!hiddenAnilistId.value) {
    uploadResult.innerHTML = '';
    uploadResult.appendChild(
      createElement('p', "Please select a title from the dropdown.")
    );
    return;
  }

  const formData = new FormData(uploadScreenshotForm);

  try {
    const response = await fetch('/api/screenshots', {
      method: 'POST',
      body: formData
    });
    const result = await response.json();

    uploadResult.innerHTML = '';
    
    if (result.success) {
      const screenshot = result.screenshot;
      const ani = screenshot.ani;

      const screenshotContainer = createScreenshot(screenshot, ani, handleScreenshotDelete);
      uploadResult.appendChild(screenshotContainer);

      // Store screenshot ID for later vocab linking
      uploadVocabForm.dataset.screenshotId = screenshot._id;

      uploadVocabFormContainer.style.display = 'block';
      uploadScreenshotFormContainer.style.display = 'none';

    } else {
      const errorParagraph = createElement('p', result.message);
      uploadResult.appendChild(errorParagraph);
    }
  } catch (err) {
    console.error(err);
    const errorParagraph = createElement('p', "Upload failed. Try again.");
    uploadResult.appendChild(errorParagraph);
  }
});

uploadVocabForm.addEventListener('submit', async (evt) => {
  evt.preventDefault();
  const formData = new FormData(uploadVocabForm);
  formData.append('screenshotId', uploadVocabForm.dataset.screenshotId);
  try {
    const response = await fetch('/api/vocab', {
      method: 'POST',
      body: formData
    });
    const result = await response.json();
    // TODO: Preferred not to have alerts in final version
    if (result.success) {
      const vocabContainer = createVocabItem(result.vocab, POS_LABELS, handleVocabDelete);
      uploadResult.appendChild(vocabContainer);
      uploadVocabForm.reset();
    } else {
      throw new Error(result.message);
    }
  } catch (err) {
    console.error(err);
    alert("Failed to add vocabulary.");
  }
});

async function handleScreenshotDelete(screenshot, container, deleteBtn) {
  if (!confirm("Delete this screenshot and all associated vocabulary entries?")) return;

  deleteBtn.disabled = true;

  const screenshotId = screenshot._id;
  try {
    const response = await fetch(`/api/screenshots/${screenshotId}`, { method: 'DELETE' });
    const result = await response.json();
    if (result.success) {
      container.remove();
      uploadVocabFormContainer.style.display = 'none';
      uploadScreenshotFormContainer.style.display = 'block';
      uploadVocabForm.reset();
      uploadResult.innerHTML = '';
    } else {
      throw new Error(result.message);
    }
  } catch (err) {
    console.error(err);
    alert("Failed to delete screenshot.");
    deleteBtn.disabled = false;
  }
}

async function handleVocabDelete(vocab, container, deleteBtn) {
  if (!confirm("Delete this vocab entry?")) return;

  deleteBtn.disabled = true;

  const vocabId = vocab._id;
  try {
    const response = await fetch(`/api/vocab/${vocabId}`, { method: 'DELETE' });
    const result = await response.json();
    if (result.success) {
      container.remove();
    } else {
      throw new Error(result.message);
    }
  } catch (err) {
    console.error(err);
    alert("Failed to delete vocabulary entry.");
    deleteBtn.disabled = false;
  }
}