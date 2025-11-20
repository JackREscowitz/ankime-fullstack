// src/public/js/pages/upload.js

import { createElement, createScreenshot, createVocabItem, POS_LABELS, showToast, showConfirm } from '../main.js';

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
let currentWrapper = null;

titleSearch.addEventListener('input', () => {
  const query = titleSearch.value.trim();
  titleResultsDropdown.innerHTML = '';
  titleResultsDropdown.classList.add("hidden");
  titleResultsDropdown.classList.remove("border", "border-slate-200", "shadow-lg");
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

      if (!data.success) throw new Error(data.message || "Search failed.");

      const results = data.results;
      titleResultsDropdown.innerHTML = '';

      if (!results.length) {
        titleResultsDropdown.classList.add("hidden");
        titleResultsDropdown.classList.remove("border", "border-slate-200", "shadow-lg");
        return;
      }

      titleResultsDropdown.classList.remove("hidden");
      titleResultsDropdown.classList.add("border", "border-slate-200", "shadow-lg");
      
      results.forEach(item => {
        const text = `${item.title.trim()} ${item.native_title.trim() || ''} (${item.type === "ANIME" ? "Anime" : "Manga"})`;
        const div = createElement('div', text, {
          class: "px-3 py-2 hover:bg-slate-100 cursor-pointer text-slate-800"
        });

        // User selects a title from dropdown
        div.addEventListener('click', () => {
          titleSearch.value = item.title;
          hiddenAnilistId.value = item.anilist_id;
          titleResultsDropdown.innerHTML = '';
          titleResultsDropdown.classList.add("hidden");
          titleResultsDropdown.classList.remove("border", "border-slate-200", "shadow-lg");
        });

        titleResultsDropdown.appendChild(div);
      });
    } catch (err) {
      console.error(err);
      titleResultsDropdown.classList.add("hidden");
      titleResultsDropdown.classList.remove("border", "border-slate-200", "shadow-lg");
      return null;
    }
  }, 250);
});

uploadScreenshotForm.addEventListener('submit', async (evt) => {
  evt.preventDefault();

  if (!hiddenAnilistId.value) {
    uploadResult.innerHTML = '';
    uploadResult.appendChild(
      createElement('p', "Please select a title from the dropdown.", {
        class: "mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2" 
      })
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

      const wrapper = createElement('div', null, {
        class: "bg-white rounded-xl shadow-lg p-6 space-y-4 max-w-xl mx-auto mt-6"
      });
      currentWrapper = wrapper;

      const screenshotContainer = createScreenshot(screenshot, ani, handleScreenshotDelete);
      wrapper.appendChild(screenshotContainer);
      uploadResult.appendChild(wrapper);

      // Store screenshot ID for later vocab linking
      uploadVocabForm.dataset.screenshotId = screenshot._id;

      uploadVocabFormContainer.style.display = 'block';
      uploadScreenshotFormContainer.style.display = 'none';

    } else {
      const errorParagraph = createElement('p', result.message, {
        class: "mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2"
      });
      uploadResult.appendChild(errorParagraph);
    }
  } catch (err) {
    console.error(err);
    const errorParagraph = createElement('p', "Upload failed. Try again.", {
      class: "mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2"
    });
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
    if (result.success) {

      let vocabScroll = document.getElementById('upload-vocab-scroll');
      if (!vocabScroll) {
        vocabScroll = createElement('div', null, {
          id: "upload-vocab-scroll",
          class: "max-h-64 overflow-y-auto space-y-3 px-4 py-4 mt-4 bg-slate-50 rounded-xl shadow-inner"
        });

        currentWrapper.appendChild(vocabScroll);
      }

      const vocabContainer = createVocabItem(result.vocab, POS_LABELS, handleVocabDelete);
      vocabScroll.appendChild(vocabContainer);
      uploadVocabForm.reset();
    } else {
      throw new Error(result.message);
    }
  } catch (err) {
    console.error(err);
    showToast(`Failed to add vocab: ${err.message}`, "error");
  }
});

async function handleScreenshotDelete(screenshot, container, deleteBtn) {
  const ok = await showConfirm("Delete screenshot and all vocabulary?");
  if (!ok) return;

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
    showToast(`Delete failed: ${err.message}`, "error");
    deleteBtn.disabled = false;
  }
}

async function handleVocabDelete(vocab, container, deleteBtn) {
  const ok = await showConfirm("Delete this vocab entry?");
  if (!ok) return;

  deleteBtn.disabled = true;

  const vocabId = vocab._id;
  try {
    const response = await fetch(`/api/vocab/${vocabId}`, { method: 'DELETE' });
    const result = await response.json();
    if (result.success) {
      container.remove();

      // Remove scroll container if empty
      const vocabScroll = document.getElementById("upload-vocab-scroll");
      if (vocabScroll && vocabScroll.children.length === 0) {
        vocabScroll.remove();
      }

    } else {
      throw new Error(result.message);
    }
  } catch (err) {
    console.error(err);
    showToast(`Delete failed: ${err.message}`, "error");
    deleteBtn.disabled = false;
  }
}