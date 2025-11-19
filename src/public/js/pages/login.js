// src/public/js/pages/login.js

import { createElement } from "../main.js";

const loginForm = document.getElementById('login-form');
const errorDiv = document.getElementById('error-container');

loginForm.addEventListener('submit', async (evt) => {
  evt.preventDefault();
  const formData = new FormData(loginForm);
  const username = formData.get('username');
  const password = formData.get('password');

  errorDiv.innerHTML = '';

  try {
    const response = await fetch('/api/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const result = await response.json();
    
    if (result.success) {
      window.location.replace('/');
    } else {
      const errorMessage = createElement('p', result.message, {
        class: "text-sm text-rose-600 font-medium mt-2"
      });
      errorDiv.appendChild(errorMessage);
    }
  } catch (err) {
    console.error(err);
    const errorMessage = createElement('p', "Login failed. Try again.", {
      class: "text-sm text-rose-600 font-medium mt-2"
    });
    errorDiv.appendChild(errorMessage);
  }
});