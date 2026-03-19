let addQuill, editQuill;

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
  if (addQuill) addQuill.setText('');
  document.getElementById('addColor').value = '#ffffff';
  document.getElementById('addError').innerHTML = '';
}

function saveNewNote() {
  const titleStr = document.getElementById('addTitle').value.trim();
  const contentStr = addQuill ? addQuill.root.innerHTML.trim() : '';
  const plainText = addQuill ? addQuill.getText().trim() : '';
  
  if (!titleStr) {
    document.getElementById('addError').innerHTML = 'Title is required';
    return;
  }
  if (!plainText || plainText === '') {
    document.getElementById('addError').innerHTML = 'Content is required';
    return;
  }
  if (titleStr.length > 200) {
    document.getElementById('addError').innerHTML = 'Title must be less than 200 characters';
    return;
  }
  if (contentStr.length > 1000000) {
    document.getElementById('addError').innerHTML = 'Content must be less than 1,000,000 characters';
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
  document.addEventListener('DOMContentLoaded', () => {
    // Initialize Quill editors
    const quillOptions = {
      theme: 'snow',
      modules: {
        toolbar: [
          ['bold', 'italic', 'underline', 'strike'],
          ['blockquote', 'code-block'],
          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
          ['link', 'image']
        ]
      }
    };
    
    if (document.getElementById('addEditor')) {
      addQuill = new Quill('#addEditor', quillOptions);
    }
    if (document.getElementById('editEditor')) {
      editQuill = new Quill('#editEditor', quillOptions);
    }

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

    // Share Modal listeners
    const saveShareBtn = document.getElementById('saveShareBtn');
    if (saveShareBtn) saveShareBtn.addEventListener('click', saveShare);

    const cancelShareBtn = document.getElementById('cancelShareBtn');
    if (cancelShareBtn) cancelShareBtn.addEventListener('click', () => {
      document.getElementById('shareNoteModal').style.display = 'none';
    });

    const publicToggle = document.getElementById('publicToggle');
    if (publicToggle) publicToggle.addEventListener('change', togglePublicAction);

    const copyLinkBtn = document.getElementById('copyLinkBtn');
    if (copyLinkBtn) copyLinkBtn.addEventListener('click', copyLink);

    const emptyAddBtn = document.getElementById('emptyAddBtn');
    if (emptyAddBtn) emptyAddBtn.addEventListener('click', openAddModal);

    // New Password Reset Listeners
    const openForgotBtn = document.getElementById('openForgotModal');
    if (openForgotBtn) openForgotBtn.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('loginModal').style.display = 'none';
      openForgotModal();
    });

    const forgotSubmitBtn = document.getElementById('forgotSubmitBtn');
    if (forgotSubmitBtn) forgotSubmitBtn.addEventListener('click', submitForgot);

    const resetSubmitBtn = document.getElementById('resetSubmitBtn');
    if (resetSubmitBtn) resetSubmitBtn.addEventListener('click', submitReset);

    const closeForgot = document.getElementById('closeForgot');
    if (closeForgot) closeForgot.onclick = () => document.getElementById('forgotPasswordModal').style.display = 'none';

    const closeReset = document.getElementById('closeReset');
    if (closeReset) closeReset.onclick = () => document.getElementById('resetPasswordModal').style.display = 'none';

    // Password Visibility Toggle Logic
    document.querySelectorAll('.toggle-password').forEach(icon => {
      icon.addEventListener('click', function() {
        const targetId = this.getAttribute('data-target');
        const input = document.getElementById(targetId);
        if (input.type === 'password') {
          input.type = 'text';
          this.classList.remove('fa-eye');
          this.classList.add('fa-eye-slash');
        } else {
          input.type = 'password';
          this.classList.remove('fa-eye-slash');
          this.classList.add('fa-eye');
        }
      });
    });

    // Check for reset token in URL
    const urlParams = new URLSearchParams(window.location.search);
    const resetToken = urlParams.get('token');
    if (resetToken) {
      openResetModal(resetToken);
    }
  });
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
    if (editQuill) {
      editQuill.root.innerHTML = data.content;
    }
    document.getElementById('editColor').value = data.color || '#ffffff';
  });
}

function saveEditNote() {
  const modal = document.getElementById('editNoteModal');
  const noteId = modal.getAttribute('noteid');
  const titleStr = document.getElementById('editTitle').value.trim();
  const contentStr = editQuill ? editQuill.root.innerHTML.trim() : '';
  const plainText = editQuill ? editQuill.getText().trim() : '';

  if (!titleStr) {
    document.getElementById('editError').innerHTML = 'Title is required';
    return;
  }
  if (!plainText || plainText === '') {
    document.getElementById('editError').innerHTML = 'Content is required';
    return;
  }
  if (titleStr.length > 200) {
    document.getElementById('editError').innerHTML = 'Title must be less than 200 characters';
    return;
  }
  if (contentStr.length > 1000000) {
    document.getElementById('editError').innerHTML = 'Content must be less than 1,000,000 characters';
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

function openShareModal(noteId) {
  const modal = document.getElementById('shareNoteModal');
  modal.setAttribute('noteid', noteId);
  modal.style.display = 'block';

  document.getElementById('shareUsername').value = '';
  document.getElementById('sharePermission').value = 'read';
  document.getElementById('shareError').innerHTML = '';
  document.getElementById('publicToggle').checked = false;
  document.getElementById('publicLinkContainer').style.display = 'none';
  document.getElementById('sharedUsersList').innerHTML = '<li style="color: #888;">Loading...</li>';

  const closeShare = document.getElementById('closeShare');
  closeShare.onclick = () => { modal.style.display = 'none'; };

  updateSharedUsersList(noteId);

  window.AppAPI.getNoteById(noteId).then(note => {
    if (note) {
      document.getElementById('publicToggle').checked = note.isPublic || false;
      if (note.isPublic) {
        showPublicLink(noteId);
      }
    }
  });
}

function saveShare() {
  const modal = document.getElementById('shareNoteModal');
  const noteId = modal.getAttribute('noteid');
  const username = document.getElementById('shareUsername').value.trim();
  const permission = document.getElementById('sharePermission').value;

  if (!username) {
    document.getElementById('shareError').innerHTML = 'Username is required';
    return;
  }

  window.AppAPI.shareNote(noteId, username, permission).then(res => {
    if (res.ok) {
      showToast(`Note shared with ${username}`);
      document.getElementById('shareUsername').value = '';
      updateSharedUsersList(noteId);
    } else {
      res.text().then(err => {
        document.getElementById('shareError').innerHTML = err;
      });
    }
  }).catch(err => {
    document.getElementById('shareError').innerHTML = 'Sharing failed';
  });
}

function updateSharedUsersList(noteId) {
  const list = document.getElementById('sharedUsersList');
  window.AppAPI.getNoteById(noteId).then(note => {
    list.innerHTML = '';
    if (!note.sharedWith || note.sharedWith.length === 0) {
      list.innerHTML = '<li style="color: #888; font-style: italic;">Not shared with anyone yet.</li>';
      return;
    }

    note.sharedWith.forEach(user => {
      const li = document.createElement('li');
      li.style.display = 'flex';
      li.style.justifyContent = 'space-between';
      li.style.alignItems = 'center';
      li.style.padding = '8px 0';
      li.style.borderBottom = '1px solid #f9f9f9';

      const info = document.createElement('div');
      info.style.flex = '1';
      
      const nameSpan = document.createElement('strong');
      nameSpan.textContent = user.username;
      
      const permSelect = document.createElement('select');
      permSelect.style.marginLeft = '10px';
      permSelect.style.fontSize = '12px';
      permSelect.style.padding = '2px';
      permSelect.style.border = '1px solid #ddd';
      permSelect.style.borderRadius = '4px';
      
      const readOpt = document.createElement('option');
      readOpt.value = 'read';
      readOpt.textContent = 'Read Only';
      readOpt.selected = user.permission === 'read';
      
      const editOpt = document.createElement('option');
      editOpt.value = 'edit';
      editOpt.textContent = 'Can Edit';
      editOpt.selected = user.permission === 'edit';
      
      permSelect.appendChild(readOpt);
      permSelect.appendChild(editOpt);
      
      permSelect.onchange = () => {
          window.AppAPI.shareNote(noteId, user.username, permSelect.value).then(res => {
              if (res.ok) {
                  showToast(`Permission updated for ${user.username}`);
              }
          });
      };

      info.appendChild(nameSpan);
      info.appendChild(permSelect);
      
      const revokeBtn = document.createElement('button');
      revokeBtn.innerHTML = '<i class="fa-solid fa-user-minus"></i>';
      revokeBtn.className = 'action-button';
      revokeBtn.style.padding = '4px 8px';
      revokeBtn.style.margin = '0';
      revokeBtn.style.backgroundColor = '#f44336';
      revokeBtn.onclick = () => {
        if (confirm(`Revoke access for ${user.username}?`)) {
          window.AppAPI.revokeShare(noteId, user.username).then(res => {
            if (res.ok) {
              showToast(`Access revoked for ${user.username}`);
              updateSharedUsersList(noteId);
            }
          });
        }
      };

      li.appendChild(info);
      li.appendChild(revokeBtn);
      list.appendChild(li);
    });
  });
}

function togglePublicAction() {
  const modal = document.getElementById('shareNoteModal');
  const noteId = modal.getAttribute('noteid');
  const isPublic = document.getElementById('publicToggle').checked;

  window.AppAPI.togglePublic(noteId, isPublic).then(res => {
    if (res.ok) {
      if (isPublic) {
        showPublicLink(noteId);
        showToast('Public link enabled');
      } else {
        document.getElementById('publicLinkContainer').style.display = 'none';
        showToast('Public link disabled');
      }
    }
  });
}

function showPublicLink(noteId) {
  const container = document.getElementById('publicLinkContainer');
  const input = document.getElementById('publicLinkInput');
  container.style.display = 'block';
  // Generate a URL relative to the current page's path
  const currentUrl = window.location.href.split('?')[0].split('#')[0];
  const baseUrl = currentUrl.substring(0, currentUrl.lastIndexOf('/') + 1);
  input.value = `${baseUrl}public-view.html?id=${noteId}`;
}

function copyLink() {
  const input = document.getElementById('publicLinkInput');
  input.select();
  document.execCommand('copy');
  showToast('Link copied to clipboard');
}

function showAuthBanner() {
  document.getElementById('auth-banner').style.display = 'flex';
}

function hideAuthBanner() {
  document.getElementById('auth-banner').style.display = 'none';
}

function showConfirmModal(message, onConfirm) {
  const modal = document.getElementById('confirmModal');
  const messageEl = document.getElementById('confirmMessage');
  const yesBtn = document.getElementById('confirmYesBtn');
  const noBtn = document.getElementById('confirmNoBtn');
  const closeBtn = document.getElementById('closeConfirm');

  messageEl.textContent = message;
  modal.style.display = 'block';

  const closeModal = () => {
    modal.style.display = 'none';
  };

  yesBtn.onclick = () => {
    closeModal();
    if (onConfirm) onConfirm();
  };

  noBtn.onclick = closeModal;
  closeBtn.onclick = closeModal;

  // Close when clicking outside
  window.onclick = (event) => {
    if (event.target == modal) {
      closeModal();
    }
  };
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
        // Decode token to get username and id
        const payload = JSON.parse(atob(data.token.split('.')[1]));
        window.AppAPI.setCurrentUsername(payload.username);
        window.AppAPI.setCurrentUserId(payload.id);
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
  const username = document.getElementById('registerUsername').value.trim();
  const email = document.getElementById('registerEmail').value.trim();
  const password = document.getElementById('registerPassword').value;
  
  if (!username || !email || !password || password.length < 6) {
    document.getElementById('registerError').innerHTML = 'All fields required, password at least 6 characters';
    return;
  }
  
  window.AppAPI.register({ username, email, password }).then(response => {
    if (response.ok) {
      document.getElementById('registerModal').style.display = 'none';
      showToast('Registered successfully. Please login.');
    } else {
      response.text().then(error => document.getElementById('registerError').innerHTML = error);
    }
  }).catch(error => document.getElementById('registerError').innerHTML = 'Network error');
}

function openForgotModal() {
  const modal = document.getElementById('forgotPasswordModal');
  modal.style.display = 'block';
  document.getElementById('forgotEmail').value = '';
  document.getElementById('forgotError').innerHTML = '';
}

function submitForgot() {
  const email = document.getElementById('forgotEmail').value.trim();
  if (!email) {
    document.getElementById('forgotError').innerHTML = 'Email is required';
    return;
  }
  
  window.AppAPI.forgotPassword(email).then(response => {
    if (response.ok) {
      document.getElementById('forgotPasswordModal').style.display = 'none';
      showToast('Reset link sent! Check your email (or server console).');
    } else {
      response.text().then(error => document.getElementById('forgotError').innerHTML = error);
    }
  }).catch(err => {
    document.getElementById('forgotError').innerHTML = 'Network error';
  });
}

function openResetModal(token) {
  const modal = document.getElementById('resetPasswordModal');
  modal.setAttribute('token', token);
  modal.style.display = 'block';
  document.getElementById('resetPassword').value = '';
  document.getElementById('resetError').innerHTML = '';
}

function submitReset() {
  const modal = document.getElementById('resetPasswordModal');
  const token = modal.getAttribute('token');
  const password = document.getElementById('resetPassword').value;

  if (!password || password.length < 6) {
    document.getElementById('resetError').innerHTML = 'Password must be at least 6 characters';
    return;
  }

  window.AppAPI.resetPassword(token, password).then(response => {
    if (response.ok) {
      modal.style.display = 'none';
      // Clear token from URL without refreshing
      window.history.replaceState({}, document.title, window.location.pathname);
      showToast('Password updated! You can now login.');
      openLoginModal();
    } else {
      response.text().then(error => document.getElementById('resetError').innerHTML = error);
    }
  }).catch(err => {
    document.getElementById('resetError').innerHTML = 'Network error';
  });
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
