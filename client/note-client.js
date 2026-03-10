// Determine API base URL in this order:
// 1) runtime override: `window.API_BASE_URL`
// 2) meta tag in HTML: <meta name="api-base-url" content="..." />
// 3) if the page is served by a dev server (eg. Live Server on :5500) fall back to localhost:3000
// 4) finally use window.location.origin
const _meta = document.querySelector('meta[name="api-base-url"]');
const BASE_URL = window.API_BASE_URL ||
  (_meta && _meta.getAttribute('content')) ||
  (window.location.origin && window.location.origin.includes(':5500') ? 'http://localhost:3000' : window.location.origin) ||
  'http://localhost:3000';

let authToken = localStorage.getItem('authToken');
let currentUsername = localStorage.getItem('username');

function getAuthHeaders() {
  return authToken ? { 'Authorization': `Bearer ${authToken}`, 'content-type': 'application/json' } : { 'content-type': 'application/json' };
}

async function register(userData) {
  const response = await fetch(`${BASE_URL}/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(userData),
  });
  return response;
}

async function login(userData) {
  const response = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(userData),
  });
  return response;
}

async function addNote(noteData) {
  const response = await fetch(`${BASE_URL}/notes`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(noteData),
  });
  return response;
}

async function updateNote(noteData) {
  const response = await fetch(`${BASE_URL}/notes`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(noteData),
  });
  return response;
}

async function deleteNote(noteId) {
  const response = await fetch(`${BASE_URL}/notes/${noteId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return response;
}

async function getNoteById(noteId) {
  const response = await fetch(`${BASE_URL}/notes/${noteId}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) return null;
  try {
    return await response.json();
  } catch (e) {
    return null;
  }
}

async function getNotes(q) {
  let url = `${BASE_URL}/notes`;
  console.log('++++++++++++++++++++ url: ', url);

  if (q) {
    url += `/?q=${q}`;
  }
  const response = await fetch(url, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) return [];
  try {
    return await response.json();
  } catch (e) {
    return [];
  }
}

async function getHealth() {
  try {
    console.log('++++++++++++++++++++ BASE_URL: ', BASE_URL);
    const res = await fetch(`${BASE_URL}/health`);
    if (!res.ok) return { status: 'unavailable' };
    return await res.json();
  } catch (e) {
    return { status: 'unavailable' };
  }
}
