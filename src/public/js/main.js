// main.js

document.addEventListener('DOMContentLoaded', async () => {
  const page = document.body.dataset.page;
  if (!page) return;

  try {
    const initPage = await import (`/js/pages/${page}.js`);
    initPage(); // Must provide default function export in the module
  } catch (err) {
    console.warn(`No module found for page "${page}"`, err);
  }
});