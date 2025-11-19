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
// btnFunctions = {
//   handleAddToMyCards: function,
//   handleDelete: function,
//   handlePublicToggle: function
// }
// handleAddToMyCards(screenshot, cardDiv, addBtn)
// handleDelete(screenshot, vocabEntries, cardDiv, deleteBtn)
// handlePublicToggle(screenshot, cardDiv, publicToggleBtn)
export function createCard(screenshot, vocabEntries, ani, btnFunctions) {
  btnFunctions = btnFunctions || {};

  const cardDiv = createElement('div', null, {
    class: `
      fade-in bg-white rounded-xl shadow-lg 
      p-6 space-y-4 
      max-w-2xl w-full
    `
  });

  const screenshotDiv = createScreenshot(screenshot, ani, null);
  const buttonRow = createElement('div', null, {
    class: "flex flex-wrap gap-2"
  });

  cardDiv.appendChild(screenshotDiv);

  // Scrollable vocab entry container
  const vocabScroll = createElement('div', null, {
    class: "max-h-64 overflow-y-auto space-y-3 pr-1"
  })

  vocabEntries.forEach(entry => {
    vocabScroll.appendChild(createVocabItem(entry, POS_LABELS, null));
  });
  cardDiv.appendChild(vocabScroll);

  cardDiv.appendChild(buttonRow);
  
  if (btnFunctions.handleAddToMyCards) {
    const addBtn = createElement('button', 'Add to My Cards', {
      class: "px-3 py-2 bg-indigo-600 text-white rounded-xl shadow hover:bg-indigo-700 transition"
    });
    addBtn.addEventListener('click', () => 
      btnFunctions.handleAddToMyCards(screenshot, cardDiv, addBtn));
    buttonRow.appendChild(addBtn);  }

  if (btnFunctions.handleDelete) {
    const deleteBtn = createElement('button', 'Delete Card', {
      class: "px-3 py-2 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition"
    });
    deleteBtn.addEventListener('click', () => 
      btnFunctions.handleDelete(screenshot, cardDiv, deleteBtn));
    buttonRow.appendChild(deleteBtn);
  }

  if (btnFunctions.handlePublicToggle) {
    const publicToggleBtn = createElement('button', `${screenshot.public ? "Make Private" : "Make Public"}`, {
      class: "px-3 py-2 bg-slate-200 text-slate-800 rounded-xl hover:bg-slate-300 transition"
    });
    publicToggleBtn.addEventListener('click', () => 
      btnFunctions.handlePublicToggle(screenshot, cardDiv, publicToggleBtn));
    buttonRow.appendChild(publicToggleBtn);
  }
  return cardDiv;
}

export function createScreenshot(screenshot, ani, onDelete) {
  const container = createElement("div", null, {
    class: "space-y-2"
  });

  const titleText = ani
    ? `${ani.title} (${ani.native_title || ''})`
    : '';

  const newTitleParagraph = createElement('p', titleText, {
    class: "font-semibold text-slate-800"
  });
  container.appendChild(newTitleParagraph);

  const newSentenceParagraph = createElement('p', `Sentence: ${screenshot.sentence}`, {
    class: "text-slate-700"
  });
  container.appendChild(newSentenceParagraph);

  if (screenshot.translation) {
    const newTranslationParagraph = createElement('p', `Translation: ${screenshot.translation}`, {
      class: "text-slate-700"
    });
    container.appendChild(newTranslationParagraph);
  }

  const newImage = createElement("img", null, {
    src: screenshot.imageUrl,
    class: "rounded-lg shadow mx-auto"
  });
  container.appendChild(newImage);

  if (onDelete) {
    const deleteBtn = createElement('button', 'Delete Screenshot', {
      class: "px-3 py-2 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition"
    });
    deleteBtn.addEventListener('click', () => onDelete(screenshot, container, deleteBtn));
    container.appendChild(deleteBtn);
  }

  return container;
}

// onDelete(vocab, container)
export function createVocabItem(vocab, POS_LABELS, onDelete) {
  const container = createElement('div', null, {
    class: "w-full bg-white border border-slate-200 rounded-lg p-3 space-y-1"
  });

  const fields = [
    ['Word', vocab.word],
    ['Reading', vocab.reading || '—'],
    ['Meaning', vocab.meaning],
    ['Part of Speech', POS_LABELS[vocab.partOfSpeech]],
    ['Notes', vocab.notes || '—']
  ];

  for (const [label, value] of fields) {
    const p = createElement('p', `${label}: ${value}`, {
      class: "text-sm text-slate-700"
    });
    container.appendChild(p);
  }

  if (onDelete) {
    const deleteBtn = createElement('button', 'Delete Vocab Entry', {
      class: "px-3 py-2 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition"
    });
    deleteBtn.addEventListener('click', () => onDelete(vocab, container, deleteBtn));
    container.appendChild(deleteBtn);
  }

  return container;
}

let toastRoot = null;

export function showToast(message, type = "info") {
  if (!toastRoot) {
    toastRoot = createElement('div', null, {
      class: "fixed inset-x-0 bottom-4 flex justify-center pointer-events-none z-50"
    });
    document.body.appendChild(toastRoot);
  }

  const typeClasses = {
    info: "bg-slate-900 text-white",
    success: "bg-emerald-600 text-white",
    error: "bg-rose-600 text-white",
    warning: "bg-amber-500 text-white"
  };

  const toast = createElement("div", message, {
    class: `
      pointer-events-auto px-4 py-2 rounded-xl shadow-lg text-sm
      ${typeClasses[type] || typeClasses.info}
    `.trim()
  });

  toastRoot.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("opacity-0", "translate-y-1", "transition");
    setTimeout(() => {
      toast.remove();
      if (!toastRoot.hasChildNodes()) {
        toastRoot.remove();
        toastRoot = null;
      }
    }, 200);
  }, 2500);
}

// returns a Promise<boolean>
export function showConfirm(message, confirmText = "Okay", cancelText = "Cancel") {
  return new Promise((resolve) => {

    const overlay = createElement('div', null, {
      class: "fixed inset-0 bg-black/40 z-50 flex items-center justify-center"
    });

    const dialog = createElement('div', null, {
      class: "bg-white rounded-xl shadow-xl max-w-sm w-full mx-4 p-6 space-y-4"
    });

    const textParagraph = createElement("p", message, {
      class: "text-slate-800"
    });

    const buttonRow = createElement("div", null, {
      class: "flex justify-end gap-3 mt-4"
    });

    const cancelBtn = createElement("button", cancelText, {
      class: "px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 transition"
    });

    const confirmBtn = createElement("button", confirmText, {
      class: "px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
    });

    buttonRow.appendChild(cancelBtn);
    buttonRow.appendChild(confirmBtn);

    dialog.appendChild(textParagraph);
    dialog.appendChild(buttonRow);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    const cleanup = (value) => {
      resolve(value);          // true or false
      overlay.remove();        // remove the modal
      document.removeEventListener("keydown", onKeyDown);
    };

    const onKeyDown = (evt) => {
      if (evt.key === "Escape") {
        cleanup(false);
      }
      if (evt.key === "Enter") {
        cleanup(true);
      }
    };

    cancelBtn.addEventListener("click", () => cleanup(false));
    confirmBtn.addEventListener("click", () => cleanup(true));

    // Clicking outside the dialog cancels
    overlay.addEventListener("click", (evt) => {
      if (evt.target === overlay) cleanup(false);
    });

    document.addEventListener("keydown", onKeyDown);
  })
}