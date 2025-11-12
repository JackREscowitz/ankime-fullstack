// src/public/js/pages/upload.js

import { POS_LABELS } from '../main.js';

const uploadScreenshotFormContainer = document.getElementById('upload-screenshot-form-container');
const uploadScreenshotForm = document.getElementById('upload-screenshot-form');
const uploadResult = document.getElementById('upload-result');
const uploadVocabFormContainer = document.getElementById('upload-vocab-form-container');
const uploadVocabForm = document.getElementById('upload-vocab-form');

uploadScreenshotForm.addEventListener('submit', async (evt) => {
  evt.preventDefault();
  const formData = new FormData(uploadScreenshotForm);

  try {
    const response = await fetch('/my-cards/upload-screenshot', {
      method: 'POST',
      body: formData
    });
    const result = await response.json();

    uploadResult.innerHTML = '';
    
    if (result.success) {
      const newTitleParagraph = createElement('p', result.title);
      uploadResult.appendChild(newTitleParagraph);

      const newSentenceParagraph = createElement('p', result.sentence);
      uploadResult.appendChild(newSentenceParagraph);

      const newTranslationParagraph = createElement('p', result.translation);
      uploadResult.appendChild(newTranslationParagraph);

      const newScreenshot = createElement('img', null, { src: result.imageUrl });
      uploadResult.appendChild(newScreenshot);

      // Store screenshot ID for later vocab linking
      uploadVocabForm.dataset.screenshotId = result.screenshotId;

      uploadVocabFormContainer.style.display = 'block';
      uploadScreenshotFormContainer.style.display = 'none';

    } else {
      const errorParagraph = createElement('p', result.message);
      uploadResult.appendChild(errorParagraph);
    }
  } catch (err) {
    const errorParagraph = createElement('p', "Upload failed. Try again.");
    uploadResult.appendChild(errorParagraph);
  }
});

uploadVocabForm.addEventListener('submit', async (evt) => {
  evt.preventDefault();
  const formData = new FormData(uploadVocabForm);
  formData.append('screenshotId', uploadVocabForm.dataset.screenshotId);
  try {
    const response = await fetch('/my-cards/upload-vocab', {
      method: 'POST',
      body: formData
    });
    const result = await response.json();
    // TODO: Handle result of submitting new vocab entry,
    // Preferred not to have alerts in final version
    if (result.success) {
      const vocabItem = makeVocabItem(result.vocab, POS_LABELS, handleVocabDelete);
      uploadResult.appendChild(vocabItem);
      uploadVocabForm.reset();
    } else {
      alert(`Error: ${result.message}`);
    }
  } catch (err) {
    console.error(err);
    alert("Failed to add vocabulary.");
  }
});

function createElement(tag, text, attrs = {}) {
  const ele = document.createElement(tag);
  if (text) ele.textContent = text;
  for (const [k, v] of Object.entries(attrs)) {
    ele.setAttribute(k, v);
  }
  return ele;
}

function makeVocabItem(vocab, POS_LABELS, onDelete) {
  const container = document.createElement('div');
  // TODO: css additions

  const fields = [
    ['Word', vocab.word],
    ['Reading', vocab.reading || '—'],
    ['Meaning', vocab.meaning],
    ['Part of Speech', POS_LABELS[vocab.partOfSpeech]],
    ['Notes', vocab.notes || '—']
  ];

  for (const [label, value] of fields) {
    const p = createElement('p', `${label}: ${value}`);
    container.appendChild(p);
  }

  const deleteBtn = createElement('button', 'Delete');
  deleteBtn.addEventListener('click', () => onDelete(vocab._id, container));
  container.appendChild(deleteBtn);

  return container;
}

async function handleVocabDelete(vocabId, container) {
  if (!confirm("Delete this vocab entry?")) return;
  try {
    const res = await fetch(`/my-cards/delete-vocab/${vocabId}`, { method: 'DELETE' });
    const result = await res.json();
    if (result.success) {
      container.remove();
    } else {
      alert(`Error: ${result.message}`);
    }
  } catch (err) {
    console.error(err);
    alert("Failed to delete vocabulary entry.");
  }
}