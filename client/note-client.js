(function() {
  const _meta = document.querySelector('meta[name="api-base-url"]');
  const BASE_URL = window.API_BASE_URL ||
    (_meta && _meta.getAttribute('content')) ||
    (window.location.origin && window.location.origin.includes(':5500') ? 'http://localhost:3000' : window.location.origin) ||
    'http://localhost:3000';

  let authToken = localStorage.getItem('authToken');
  let currentUsername = localStorage.getItem('username');

  // Export functions/state via a namespace
  window.AppAPI = window.AppAPI || {};
  window.AppAPI.getAuthToken = () => authToken;
  window.AppAPI.setAuthToken = (token) => { authToken = token; localStorage.setItem('authToken', token); };
  window.AppAPI.getCurrentUsername = () => currentUsername;
  window.AppAPI.setCurrentUsername = (username) => { currentUsername = username; localStorage.setItem('username', username); };
  window.AppAPI.clearAuth = () => { 
    authToken = null; currentUsername = null; 
    localStorage.removeItem('authToken'); localStorage.removeItem('username'); 
  };

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
  window.AppAPI.register = register;

  async function login(userData) {
    const response = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return response;
  }
  window.AppAPI.login = login;

  async function addNote(noteData) {
    const response = await fetch(`${BASE_URL}/notes`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(noteData),
    });
    return response;
  }
  window.AppAPI.addNote = addNote;

  async function updateNote(noteData) {
    const response = await fetch(`${BASE_URL}/notes`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(noteData),
    });
    return response;
  }
  window.AppAPI.updateNote = updateNote;

  async function deleteNote(noteId) {
    const response = await fetch(`${BASE_URL}/notes/${noteId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return response;
  }
  window.AppAPI.deleteNote = deleteNote;

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
  window.AppAPI.getNoteById = getNoteById;

  async function getNotes(q, category, limit, offset) {
    let url = `${BASE_URL}/notes?`;
    if (q) url += `q=${encodeURIComponent(q)}&`;
    if (category && category !== 'all') url += `category=${encodeURIComponent(category)}&`;
    if (limit !== undefined) url += `limit=${limit}&`;
    if (offset !== undefined) url += `offset=${offset}&`;
    const response = await fetch(url, { headers: getAuthHeaders() });
    if (!response.ok) return [];
    try { return await response.json(); } catch (e) { return []; }
  }
  window.AppAPI.getNotes = getNotes;

  async function getCategories() {
    const response = await fetch(`${BASE_URL}/categories`, { headers: getAuthHeaders() });
    if (!response.ok) return [];
    try {
      return await response.json();
    } catch (e) {
      return [];
    }
  }
  window.AppAPI.getCategories = getCategories;

  async function getHealth() {
    try {
      const res = await fetch(`${BASE_URL}/health`);
      if (!res.ok) return { status: 'unavailable' };
      return await res.json();
    } catch (e) {
      return { status: 'unavailable' };
    }
  }
  window.AppAPI.getHealth = getHealth;
})();
