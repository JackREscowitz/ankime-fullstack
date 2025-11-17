// src/public/js/main.js

export const POS_LABELS = {
  'noun': "Noun/名詞",
  'verb': "Verb/動詞",
  'i-adjective': "I-Adjective/形容詞",
  'na-adjective': "Na-Adjective/形容動詞",
  'adverb': "Adverb/副詞",
  'pronoun': "Pronoun/代名詞",
  'particle': "Particle/助詞",
  'conjunction': "Conjunction/接続詞",
  'interjection': "Interjection/感動詞",
  'auxiliary-verb': "Auxiliary Verb/助動詞",
  'prenominal': "Prenominal/連体詞",
  'prefix': "Prefix/接頭辞",
  'suffix': "Suffix/接尾辞",
  'other': "Other/その他"
};

export function createElement(tag, text, attrs = {}) {
  const ele = document.createElement(tag);
  if (text) ele.textContent = text;
  for (const [k, v] of Object.entries(attrs)) {
    ele.setAttribute(k, v);
  }
  return ele;
}

// TODO: implement editing, don't have time now for it
// handleAdd(screenshot, vocabEntries, cardDiv, addBtn)
// handleDelete(screenshot, vocabEntries, cardDiv, deleteBtn)
// handlePublicToggle(screenshot, cardDiv, publicToggleBtn)
export function createCard(screenshot, vocabEntries, ani, handleAdd, handleDelete, handlePublicToggle) {
  const cardDiv = createElement('div');
  const screenshotDiv = createScreenshot(screenshot, ani, null);
  cardDiv.appendChild(screenshotDiv);
  vocabEntries.forEach(entry => {
    const vocabDiv = createVocabItem(entry, POS_LABELS, null);
    cardDiv.appendChild(vocabDiv);
  });
  if (handleAdd) {
    const addBtn = createElement('button', 'Add to My Cards');
    addBtn.addEventListener('click', () => 
      handleAdd(screenshot, vocabEntries, cardDiv, addBtn));
    cardDiv.appendChild(addBtn);  }

  if (handleDelete) {
    const deleteBtn = createElement('button', 'Delete Card');
    deleteBtn.addEventListener('click', () => 
      handleDelete(screenshot, cardDiv, deleteBtn));
    cardDiv.appendChild(deleteBtn);
  }

  if (handlePublicToggle) {
    const publicToggleBtn = createElement('button', `${screenshot.public ? "Remove from Public" : "Make Public"}`);
    publicToggleBtn.addEventListener('click', () => 
      handlePublicToggle(screenshot, cardDiv, publicToggleBtn));
    cardDiv.appendChild(publicToggleBtn);
  }
  return cardDiv;
}

export function createScreenshot(screenshot, ani, onDelete) {
  const container = createElement('div', null, { id: "screenshot-container" });

  const titleText = ani
    ? `${ani.title} (${ani.native_title || ''})`
    : '';

  const newTitleParagraph = createElement('p', titleText);
  container.appendChild(newTitleParagraph);

  const newSentenceParagraph = createElement('p', `Sentence: ${screenshot.sentence}`);
  container.appendChild(newSentenceParagraph);

  if (screenshot.translation) {
    const newTranslationParagraph = createElement('p', `Translation: ${screenshot.translation}`);
    container.appendChild(newTranslationParagraph);
  }

  const newImage = createElement('img', null, { src: screenshot.imageUrl });
  container.appendChild(newImage);

  if (onDelete) {
    const deleteBtn = createElement('button', 'Delete Screenshot');
    deleteBtn.addEventListener('click', () => onDelete(screenshot, container, deleteBtn));
    container.appendChild(deleteBtn);
  }

  return container;
}

// onDelete(vocab, container)
export function createVocabItem(vocab, POS_LABELS, onDelete) {
  const container = createElement('div', null, { class: "vocab-container" });
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

  if (onDelete) {
    const deleteBtn = createElement('button', 'Delete Vocab Entry');
    deleteBtn.addEventListener('click', () => onDelete(vocab, container, deleteBtn));
    container.appendChild(deleteBtn);
  }

  return container;
}