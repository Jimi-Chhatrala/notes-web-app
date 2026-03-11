function openAddModal() {
  if (!window.AppAPI.getAuthToken()) {
    showAuthBanner();
    return;
  }
  const modal = document.getElementById('addNoteModal');
  modal.style.display = 'block';

  const closeSpan = document.getElementById('closeAdd');
  const cancelButton = document.getElementById('cancelAddNoteBtn');

  clearAddModal();
  // closeAdd (x)
  // cancelAddNoteBtn (Cancel)

  closeSpan.onclick = () => {
    modal.style.display = 'none';
  };
  cancelButton.onclick = () => {
    modal.style.display = 'none';
  };
}

function clearAddModal() {
  document.getElementById('addTitle').value = '';
  document.getElementById('addCategory').value = '';
  document.getElementById('addContent').value = '';
  document.getElementById('addColor').value = '#ffffff';
  document.getElementById('addError').innerHTML = '';
}

function saveNewNote() {
  const titleStr = document.getElementById('addTitle').value.trim();
  const contentStr = document.getElementById('addContent').value.trim();
  if (!titleStr) {
    document.getElementById('addError').innerHTML = 'Title is required';
    return;
  }
  if (!contentStr) {
    document.getElementById('addError').innerHTML = 'Content is required';
    return;
  }
  if (titleStr.length > 200) {
    document.getElementById('addError').innerHTML = 'Title must be less than 200 characters';
    return;
  }
  if (contentStr.length > 5000) {
    document.getElementById('addError').innerHTML = 'Content must be less than 5000 characters';
    return;
  }
  const categoryStr = document.getElementById('addCategory').value.trim() || 'General';
  const colorStr = document.getElementById('addColor').value || '#ffffff';
  const noteData = { title: titleStr, content: contentStr, category: categoryStr, color: colorStr };
  window.AppAPI.addNote(noteData)
    .then((response) => {
      if (response.ok) {
        const modal = document.getElementById('addNoteModal');
        modal.style.display = 'none';
        response.json().then(json => {
          if (json && json._id) {
            updateNotesTable(json._id);
          } else {
            updateNotesTable();
          }
        });
      } else {
        response.text().then((error) => {
          document.getElementById('addError').innerHTML = error;
        });
      }
    })
    .catch((error) => {
      document.getElementById('addError').innerHTML = 'Network error: ' + error.message;
    });
}

function openEditModal(noteId) {
  const modal = document.getElementById('editNoteModal');
  const closeSpan = document.getElementById('closeEdit');
  const cancelButton = document.getElementById('cancelEditNoteBtn');

  clearAddModal();

  modal.style.display = 'block';

  closeSpan.onclick = () => {
    modal.style.display = 'none';
  };

  cancelButton.onclick = () => {
    modal.style.display = 'none';
  };

  loadNoteData(noteId);
}

// Wire up global event listeners (buttons) when scripts are loaded
try {
  const addBtn = document.getElementById('addBtn');
  if (addBtn) addBtn.addEventListener('click', openAddModal);

  const searchBtn = document.getElementById('searchBtn');
  if (searchBtn) searchBtn.addEventListener('click', () => {
    // searchNotes is defined in note-handler.js
    if (typeof searchNotes === 'function') searchNotes();
  });

  const saveAddBtn = document.getElementById('saveAddNoteBtn');
  if (saveAddBtn) saveAddBtn.addEventListener('click', saveNewNote);

  const cancelAddBtn = document.getElementById('cancelAddNoteBtn');
  if (cancelAddBtn) cancelAddBtn.addEventListener('click', () => {
    const modal = document.getElementById('addNoteModal');
    if (modal) modal.style.display = 'none';
  });

  const saveEditBtn = document.getElementById('saveEditNoteBtn');
  if (saveEditBtn) saveEditBtn.addEventListener('click', saveEditNote);

  const cancelEditBtn = document.getElementById('cancelEditNoteBtn');
  if (cancelEditBtn) cancelEditBtn.addEventListener('click', () => {
    const modal = document.getElementById('editNoteModal');
    if (modal) modal.style.display = 'none';
  });

  const loginBtn = document.getElementById('loginBtn');
  if (loginBtn) loginBtn.addEventListener('click', openLoginModal);

  const loginSubmitBtn = document.getElementById('loginSubmitBtn');
  if (loginSubmitBtn) loginSubmitBtn.addEventListener('click', submitLogin);

  const registerSubmitBtn = document.getElementById('registerSubmitBtn');
  if (registerSubmitBtn) registerSubmitBtn.addEventListener('click', submitRegister);

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', logout);
} catch (e) {
  // ignore when DOM not ready or in test environments
}

function loadNoteData(noteId) {
  const modal = document.getElementById('editNoteModal');
  const noteIdAttribute = document.createAttribute('noteid');
  noteIdAttribute.value = noteId;
  modal.setAttributeNode(noteIdAttribute);
  window.AppAPI.getNoteById(noteId).then((data) => {
    document.getElementById('editTitle').value = data.title;
    document.getElementById('editCategory').value = data.category || 'General';
    document.getElementById('editContent').value = data.content;
    document.getElementById('editColor').value = data.color || '#ffffff';
  });
}

function saveEditNote() {
  const modal = document.getElementById('editNoteModal');
  const noteId = modal.getAttribute('noteid');
  const titleStr = document.getElementById('editTitle').value.trim();
  const contentStr = document.getElementById('editContent').value.trim();
  if (!titleStr) {
    document.getElementById('editError').innerHTML = 'Title is required';
    return;
  }
  if (!contentStr) {
    document.getElementById('editError').innerHTML = 'Content is required';
    return;
  }
  if (titleStr.length > 200) {
    document.getElementById('editError').innerHTML = 'Title must be less than 200 characters';
    return;
  }
  if (contentStr.length > 5000) {
    document.getElementById('editError').innerHTML = 'Content must be less than 5000 characters';
    return;
  }
  const categoryStr = document.getElementById('editCategory').value.trim() || 'General';
  const colorStr = document.getElementById('editColor').value || '#ffffff';
  const noteData = { _id: noteId, title: titleStr, content: contentStr, category: categoryStr, color: colorStr };
  window.AppAPI.updateNote(noteData)
    .then((response) => {
      if (response.ok) {
        const modal = document.getElementById('editNoteModal');
        modal.style.display = 'none';
        document.getElementById('searchInput').value = '';
        updateNotesTable(noteId);
      } else {
        response.text().then((error) => {
          document.getElementById('editError').innerHTML = error;
        });
      }
    })
    .catch((error) => {
      document.getElementById('editError').innerHTML = 'Network error: ' + error.message;
    });
}

function showAuthBanner() {
  document.getElementById('auth-banner').style.display = 'flex';
}

function hideAuthBanner() {
  document.getElementById('auth-banner').style.display = 'none';
}

function openLoginModal() {
  const modal = document.getElementById('loginModal');
  modal.style.display = 'block';
  document.getElementById('loginUsername').value = '';
  document.getElementById('loginPassword').value = '';
  document.getElementById('loginError').innerHTML = '';
  document.getElementById('closeLogin').onclick = () => modal.style.display = 'none';
  document.getElementById('showRegister').onclick = () => {
    modal.style.display = 'none';
    openRegisterModal();
  };
}

function openRegisterModal() {
  const modal = document.getElementById('registerModal');
  modal.style.display = 'block';
  document.getElementById('registerUsername').value = '';
  document.getElementById('registerPassword').value = '';
  document.getElementById('registerError').innerHTML = '';
  document.getElementById('closeRegister').onclick = () => modal.style.display = 'none';
  document.getElementById('showLogin').onclick = () => {
    modal.style.display = 'none';
    openLoginModal();
  };
}

function submitLogin() {
  const username = document.getElementById('loginUsername').value;
  const password = document.getElementById('loginPassword').value;
  if (!username || !password) {
    document.getElementById('loginError').innerHTML = 'Username and password required';
    return;
  }
  window.AppAPI.login({ username, password }).then(response => {
    if (response.ok) {
      response.json().then(data => {
        window.AppAPI.setAuthToken(data.token);
        // Decode token to get username (without verification, for display only)
        const payload = JSON.parse(atob(data.token.split('.')[1]));
        window.AppAPI.setCurrentUsername(payload.username);
        document.getElementById('loginModal').style.display = 'none';
        hideAuthBanner();
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) logoutBtn.style.display = 'inline-block';
        updateUserDisplay();
        updateNotesTable();
        showToast('Logged in successfully');
      });
    } else {
      response.text().then(error => document.getElementById('loginError').innerHTML = error);
    }
  }).catch(error => document.getElementById('loginError').innerHTML = 'Network error');
}

function submitRegister() {
  const username = document.getElementById('registerUsername').value;
  const password = document.getElementById('registerPassword').value;
  if (!username || password.length < 6) {
    document.getElementById('registerError').innerHTML = 'Username required, password at least 6 characters';
    return;
  }
  window.AppAPI.register({ username, password }).then(response => {
    if (response.ok) {
      document.getElementById('registerModal').style.display = 'none';
      showToast('Registered successfully. Please login.');
      // Do not open login modal automatically, let user click Login button
    } else {
      response.text().then(error => document.getElementById('registerError').innerHTML = error);
    }
  }).catch(error => document.getElementById('registerError').innerHTML = 'Network error');
}

function logout() {
  window.AppAPI.clearAuth();
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.style.display = 'none';
  updateUserDisplay();
  showAuthBanner();
  updateNotesTable();
  showToast('Logged out successfully');
}

function updateUserDisplay() {
  const userDisplay = document.getElementById('userDisplay');
  if (userDisplay) {
    const currentUsername = window.AppAPI.getCurrentUsername();
    userDisplay.textContent = currentUsername ? `Logged in as ${currentUsername}` : '';
  }
}
