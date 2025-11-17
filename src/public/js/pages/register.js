// src/public/js/pages/login.js

import { createElement } from "../main.js";

const registerForm = document.getElementById('register-form');
const errorDiv = document.getElementById('error-container');

registerForm.addEventListener('submit', async (evt) => {
  evt.preventDefault();
  const formData = new FormData(registerForm);
  const username = formData.get('username');
  const password = formData.get('password');

  errorDiv.innerHTML = '';

  try {
    const response = await fetch('/api/users/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const result = await response.json();
    
    if (result.success) {
      window.location.replace('/');
    } else {
      const errorMessage = createElement('p', result.message);
      errorDiv.appendChild(errorMessage);
    }
  } catch (err) {
    console.error(err);
    const errorMessage = createElement('p', "Registering failed. Try again.");
    errorDiv.appendChild(errorMessage);
  }
});