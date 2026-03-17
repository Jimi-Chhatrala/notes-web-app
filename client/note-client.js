(function() {
  const _meta = document.querySelector('meta[name="api-base-url"]');
  const BASE_URL = window.API_BASE_URL ||
    (_meta && _meta.getAttribute('content')) ||
    (window.location.origin && window.location.origin.includes(':5500') ? 'http://localhost:3000' : window.location.origin) ||
    'http://localhost:3000';

  let authToken = localStorage.getItem('authToken');
  let currentUsername = localStorage.getItem('username');
  let currentUserId = localStorage.getItem('userId');

  // Fallback: If userId is missing but we have a token, decode it
  if (!currentUserId && authToken) {
      try {
          const payload = JSON.parse(atob(authToken.split('.')[1]));
          currentUserId = payload.id;
          localStorage.setItem('userId', currentUserId);
      } catch (e) {
          console.error('Failed to decode token for userId:', e);
      }
  }

  // Export functions/state via a namespace
  window.AppAPI = window.AppAPI || {};
  window.AppAPI.getAuthToken = () => authToken;
  window.AppAPI.setAuthToken = (token) => { authToken = token; localStorage.setItem('authToken', token); };
  window.AppAPI.getCurrentUsername = () => currentUsername;
  window.AppAPI.setCurrentUsername = (username) => { currentUsername = username; localStorage.setItem('username', username); };
  window.AppAPI.clearAuth = () => { 
    authToken = null; currentUsername = null; currentUserId = null;
    localStorage.removeItem('authToken'); localStorage.removeItem('username'); localStorage.removeItem('userId');
  };
  window.AppAPI.getCurrentUserId = () => currentUserId;
  window.AppAPI.setCurrentUserId = (id) => { currentUserId = id; localStorage.setItem('userId', id); };

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

  async function getSharedNotes(limit = 10, offset = 0) {
    let url = `${BASE_URL}/notes/shared?`;
    if (limit !== undefined) url += `limit=${limit}&`;
    if (offset !== undefined) url += `offset=${offset}&`;
    const response = await fetch(url, { headers: getAuthHeaders() });
    if (!response.ok) return [];
    try { return await response.json(); } catch (e) { return []; }
  }
  window.AppAPI.getSharedNotes = getSharedNotes;

  async function shareNote(noteId, username, permission) {
    const response = await fetch(`${BASE_URL}/notes/${noteId}/share`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ username, permission })
    });
    return response;
  }
  window.AppAPI.shareNote = shareNote;

  async function revokeShare(noteId, username) {
    const response = await fetch(`${BASE_URL}/notes/${noteId}/share/${username}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return response;
  }
  window.AppAPI.revokeShare = revokeShare;

  async function togglePublic(noteId, isPublic) {
    const response = await fetch(`${BASE_URL}/notes/${noteId}/public`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ isPublic })
    });
    return response;
  }
  window.AppAPI.togglePublic = togglePublic;

  async function getPublicNote(noteId) {
    const response = await fetch(`${BASE_URL}/notes/public/${noteId}`);
    if (!response.ok) return null;
    try { return await response.json(); } catch (e) { return null; }
  }
  window.AppAPI.getPublicNote = getPublicNote;
})();
