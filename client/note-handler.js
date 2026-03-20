let currentCategory = 'all';
let isRefreshPending = false;
let currentOffset = 0;
const PAGE_SIZE = 10;
let hasMoreNotes = true;
let isFetchingPage = false;

function updateNotesTable(noteId, q, category = currentCategory, append = false) {
  const table = document.getElementById('notes-table');
  const tbody = table.querySelector('tbody');
  currentCategory = category;

  // If a single noteId is provided and no q filter or category filter, update/insert that row only
  if (noteId && !q && category === 'all') {
    window.AppAPI.getNoteById(noteId).then((note) => {
      if (!note) return;
      updateOrInsertRow(table, note);
      const row = document.getElementById(noteId);
      if (row) row.style.animation = 'new-row 5s';
    }).catch(() => {
      // fallback to full refresh on error
      fullRefresh();
    });
    return;
  }

  // Otherwise do full refresh or append (search or scroll)
  function fullRefresh() {
    if (isRefreshPending || isFetchingPage) return;

    if (!append) {
      isRefreshPending = true;
      currentOffset = 0;
      hasMoreNotes = true;
      if (tbody) tbody.innerHTML = '';
    } else {
      if (!hasMoreNotes) return;
      isFetchingPage = true;
    }

    const categoryParam = category === 'all' ? null : category;
    
    let fetchPromise;
    if (category === 'shared') {
      fetchPromise = window.AppAPI.getSharedNotes(PAGE_SIZE, currentOffset);
    } else {
      fetchPromise = window.AppAPI.getNotes(q, categoryParam, PAGE_SIZE, currentOffset);
    }

    fetchPromise.then((data) => {
      if (data.length < PAGE_SIZE) {
        hasMoreNotes = false;
      }
      data.forEach((note) => {
        appendRowToTable(table, note);
      });
      currentOffset += data.length;

      // Show/hide empty state based on total rows
      const totalRows = tbody.querySelectorAll('tr').length;
      if (totalRows === 0 && !q && category === 'all') { // Only show empty state if no search/filter and no notes
        table.style.display = 'none';
        document.getElementById('empty-state').style.display = 'flex';
      } else {
        table.style.display = 'table';
        document.getElementById('empty-state').style.display = 'none';
      }

    }).catch(err => {
      console.error('Refresh failed:', err);
    }).finally(() => {
      isRefreshPending = false;
      isFetchingPage = false;
      const paginationSpinner = document.getElementById('pagination-loading');
      if (paginationSpinner) paginationSpinner.style.display = 'none';

      if (noteId) {
        const row = document.getElementById(noteId);
        if (row) row.style.animation = 'new-row 5s';
      }
      updateCategoriesList();
      
      // Check if more notes are needed immediately (e.g., if screen isn't full)
      if (hasMoreNotes) {
        // Small delay to ensure DOM has updated
        setTimeout(checkSentinelVisibility, 100);
      }
    });
  }

  fullRefresh();
}

function checkSentinelVisibility() {
  const sentinel = document.getElementById('scroll-sentinel');
  if (!sentinel) return;
  
  const rect = sentinel.getBoundingClientRect();
  const isVisible = rect.top >= 0 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight);
  
  if (isVisible && hasMoreNotes && !isFetchingPage && !isRefreshPending) {
     updateNotesTable(undefined, document.getElementById('searchInput').value, currentCategory, true);
  }
}

function updateCategoriesList() {
  const categoryList = document.getElementById('categoryList');
  if (!categoryList) return;

  window.AppAPI.getCategories().then((categories) => {
    // Keep fixed items but clear others
    const allItem = categoryList.querySelector('[data-category="all"]');
    const sharedItem = categoryList.querySelector('[data-category="shared"]');
    categoryList.innerHTML = '';
    if (allItem) categoryList.appendChild(allItem);
    if (sharedItem) categoryList.appendChild(sharedItem);

    categories.sort().forEach(cat => {
      // Don't duplicate 'all' or 'shared' if they happen to be in the categories list
      if (cat === 'all' || cat === 'shared') return;
      
      const li = document.createElement('li');
      li.className = 'category-item';
      if (currentCategory === cat) li.classList.add('active');
      li.setAttribute('data-category', cat);
      li.textContent = cat;
      categoryList.appendChild(li);
    });
  });
}

function searchNotes() {
  const q = document.getElementById('searchInput').value;
  // Search always resets pagination
  updateNotesTable(undefined, q, currentCategory, false);
}


// Auto-retry configuration (can be overridden via meta tags or window globals)
const _metaRetryInitial = document.querySelector('meta[name="api-retry-initial-ms"]');
const _metaRetryMax = document.querySelector('meta[name="api-retry-max-ms"]');
const _metaRetryEnabled = document.querySelector('meta[name="api-retry-enabled"]');
const retryConfig = {
  enabled: (typeof window.API_RETRY_ENABLED !== 'undefined') ? Boolean(window.API_RETRY_ENABLED) : (_metaRetryEnabled ? _metaRetryEnabled.getAttribute('content') === 'true' : true),
  initialDelay: (typeof window.API_RETRY_INITIAL_MS !== 'undefined') ? Number(window.API_RETRY_INITIAL_MS) : (_metaRetryInitial ? Number(_metaRetryInitial.getAttribute('content')) : 3000),
  maxDelay: (typeof window.API_RETRY_MAX_MS !== 'undefined') ? Number(window.API_RETRY_MAX_MS) : (_metaRetryMax ? Number(_metaRetryMax.getAttribute('content')) : 60000),
};

// Auto-retry state
let autoRetryTimer = null;
let autoRetryDelay = retryConfig.initialDelay;
let autoRetryMaxDelay = retryConfig.maxDelay;
let autoRetryAttempt = 0;

function startAutoRetry() {
  if (!retryConfig.enabled) return;
  if (autoRetryTimer) return; // already running
  autoRetryAttempt = 0;
  autoRetryDelay = retryConfig.initialDelay;
  function attempt() {
    autoRetryAttempt += 1;
    // update banner with attempt count
    updateStatusBanner({ status: 'unavailable' }, autoRetryAttempt);
    window.AppAPI.getHealth().then((info) => {
      if (info && info.status === 'ok') {
        stopAutoRetry();
        updateStatusBanner(info);
        updateNotesTable();
        showToast('Reconnected to backend');
      } else {
        autoRetryDelay = Math.min(autoRetryDelay * 2, autoRetryMaxDelay);
        autoRetryTimer = setTimeout(attempt, autoRetryDelay);
      }
    }).catch(() => {
      autoRetryDelay = Math.min(autoRetryDelay * 2, autoRetryMaxDelay);
      autoRetryTimer = setTimeout(attempt, autoRetryDelay);
    });
  }
  // schedule first attempt after small delay
  autoRetryTimer = setTimeout(attempt, autoRetryDelay);
}

function stopAutoRetry() {
  if (autoRetryTimer) {
    clearTimeout(autoRetryTimer);
    autoRetryTimer = null;
  }
  autoRetryAttempt = 0;
  autoRetryDelay = retryConfig.initialDelay;
}

// Toast helper
function showToast(message, timeout = 3500) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.style.display = 'block';
  toast.style.opacity = '1';
  setTimeout(() => {
    toast.style.transition = 'opacity 0.6s ease';
    toast.style.opacity = '0';
    setTimeout(() => { toast.style.display = 'none'; toast.style.transition = ''; }, 600);
  }, timeout);
}

function timeSince(dateString) {
  const date = new Date(dateString);
  const seconds = Math.floor((new Date() - date) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + ' years ago';
  
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + ' months ago';
  
  interval = seconds / 86400;
  if (interval > 1) {
    const days = Math.floor(interval);
    if (days === 1) return 'Yesterday';
    return days + ' days ago';
  }
  
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + ' hours ago';
  
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + ' mins ago';

  if (seconds < 30) return 'Just now';
  return Math.floor(seconds) + ' secs ago';
}

function downloadNoteAsTxt(id) {
  window.AppAPI.getNoteById(id).then(note => {
    if (!note) return;
    const tempDiv = document.createElement('div');
    // content is HTML, convert to plain text
    tempDiv.innerHTML = note.content;
    const plainText = tempDiv.innerText || tempDiv.textContent;
    
    const blob = new Blob([plainText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // Sanitize filename
    const filename = (note.title || 'note').replace(/[/\\?%*:|"<>]/g, '-') + '.txt';
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
}

// Helpers to insert/update rows safely (avoid innerHTML for user content)
function appendRowToTable(table, note) {
  const tbody = table.querySelector('tbody') || table;
  const row = tbody.insertRow(-1);
  row.id = note._id;
  
  if (note.color && note.color !== '#ffffff') {
    row.style.borderLeft = `5px solid ${note.color}`;
  } else {
    row.style.borderLeft = 'none';
  }
  const cell0 = row.insertCell(0);
  const cell1 = row.insertCell(1);
  const cell2 = row.insertCell(2);
  const cell3 = row.insertCell(3);
  const cell4 = row.insertCell(4);
  const cell5 = row.insertCell(5);
  
  // Render pin button based on isPinned property
  const pinStyle = note.isPinned ? 'color: #e6b800; opacity: 1;' : 'color: #555; opacity: 0.5;';
  cell0.innerHTML = `<a class="pin-btn" data-note-id="${note._id}" style="cursor: pointer; ${pinStyle}"><i class="fa-solid fa-thumbtack" style="font-size: 20px;"></i></a>`;

  cell1.textContent = note.title;
  cell2.textContent = note.category || 'General';
  // Note: Content is now Rich HTML from Quill, sanitize before rendering
  const cleanHtml = typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(note.content) : note.content;
  cell3.innerHTML = cleanHtml;
  cell4.textContent = timeSince(note.updatedAt);

  const currentUserId = window.AppAPI.getCurrentUserId();
  const isOwner = String(note.userId) === String(currentUserId);
  
  // Download button is available for everyone who can see the note
  const downloadHtml = `<a class="download-btn" data-note-id="${note._id}" title="Download as .txt" style="cursor: pointer; color: #607d8b; margin-right: 15px;"><i class="fa-solid fa-file-arrow-down" style="font-size: 20px;"></i></a>`;

  let actionsHtml = downloadHtml;
  if (isOwner) {
    actionsHtml += `<a class="share-btn" data-note-id="${note._id}" style="cursor: pointer; color: #4caf50; margin-right: 15px;"><i class="fa-solid fa-share-nodes" style="font-size: 20px;"></i></a>
                    <a class="edit-btn" data-note-id="${note._id}" style="cursor: pointer; color: #008cba; margin-right: 15px;"><i class="fa-solid fa-pen-to-square" style="font-size: 20px;"></i></a>
                    <a class="delete-btn" data-note-id="${note._id}" style="cursor: pointer; color: #cc0000;"><i class="fa-solid fa-trash" style="font-size: 20px;"></i></a>`;
  } else {
    // Shared note
    const sharedEntry = note.sharedWith.find(s => String(s.userId) === String(currentUserId));
    if (sharedEntry && sharedEntry.permission === 'edit') {
       actionsHtml += `<a class="edit-btn" data-note-id="${note._id}" style="cursor: pointer; color: #008cba; margin-right: 15px;"><i class="fa-solid fa-pen-to-square" style="font-size: 20px;"></i></a>`;
    }
    cell2.innerHTML += ` <span style="font-size: 10px; background: #eee; padding: 2px 5px; border-radius: 4px; color: #666;">Shared</span>`;
  }
  cell5.innerHTML = actionsHtml;
}

function updateOrInsertRow(table, note) {
  const existing = document.getElementById(note._id);
  // Only update if it's still in the current category filter
  if (currentCategory !== 'all' && note.category !== currentCategory) {
    if (existing) existing.parentNode.removeChild(existing);
    updateCategoriesList();
    return;
  }

  if (existing) {
    if (note.color && note.color !== '#ffffff') {
      existing.style.borderLeft = `5px solid ${note.color}`;
    } else {
      existing.style.borderLeft = 'none';
    }
    const pinStyle = note.isPinned ? 'color: #e6b800; opacity: 1;' : 'color: #555; opacity: 0.5;';
    existing.cells[0].innerHTML = `<a class="pin-btn" data-note-id="${note._id}" style="cursor: pointer; ${pinStyle}"><i class="fa-solid fa-thumbtack" style="font-size: 20px;"></i></a>`;
    existing.cells[1].textContent = note.title;
    existing.cells[2].textContent = note.category || 'General';
    // Note: Content is now Rich HTML from Quill, sanitize before rendering
    const cleanHtml = typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(note.content) : note.content;
    existing.cells[3].innerHTML = cleanHtml;
    existing.cells[4].textContent = timeSince(note.updatedAt);
    
    const currentUserId = window.AppAPI.getCurrentUserId();
    const isOwner = String(note.userId) === String(currentUserId);

    // update action cell attributes
    const pin = existing.querySelector('.pin-btn');
    const download = existing.querySelector('.download-btn');
    const share = existing.querySelector('.share-btn');
    const edit = existing.querySelector('.edit-btn');
    const del = existing.querySelector('.delete-btn');
    if (pin) pin.setAttribute('data-note-id', note._id);
    if (download) download.setAttribute('data-note-id', note._id);
    if (share) share.setAttribute('data-note-id', note._id);
    if (edit) edit.setAttribute('data-note-id', note._id);
    if (del) del.setAttribute('data-note-id', note._id);
    updateCategoriesList();
  } else {
    appendRowToTable(table, note);
    updateCategoriesList();
  }
}

// Health polling: show banner if backend unavailable
function updateStatusBanner(info, attempt = 0) {
  const banner = document.getElementById('status-banner');
  const message = document.getElementById('status-message');
  const reconnectBtn = document.getElementById('reconnectBtn');
  if (!banner || !message) return;
  if (info && info.status === 'ok') {
    banner.style.display = 'none';
    banner.classList.remove('unavailable');
    if (reconnectBtn) reconnectBtn.innerHTML = 'Reconnect';
  } else {
    banner.style.display = 'flex';
    banner.classList.add('unavailable');
    if (attempt && attempt > 0) {
      message.textContent = `Backend unavailable — retrying (attempt ${attempt})`;
      if (reconnectBtn) reconnectBtn.innerHTML = '<span class="spinner"></span> Reconnecting';
    } else {
      message.textContent = 'Backend unavailable — click "Reconnect" to try again';
      if (reconnectBtn) reconnectBtn.innerHTML = 'Reconnect';
    }
  }
}

// Poll /health every 8 seconds
// Initialize UI wiring once DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const authToken = window.AppAPI.getAuthToken();
  if (!authToken) {
    showAuthBanner();
    return;
  }
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.style.display = 'inline-block';
  updateUserDisplay();

  // Event delegation for category sidebar
  const categoryList = document.getElementById('categoryList');
  if (categoryList) {
    categoryList.addEventListener('click', (ev) => {
      const item = ev.target.closest('.category-item');
      if (item) {
        // Toggle active class
        categoryList.querySelectorAll('.category-item').forEach(li => li.classList.remove('active'));
        item.classList.add('active');

        const cat = item.getAttribute('data-category');
        updateNotesTable(undefined, document.getElementById('searchInput').value, cat, false);
      }
    });
  }  // Event delegation for edit/delete buttons
  const notesTable = document.getElementById('notes-table');
  if (notesTable) {
    notesTable.addEventListener('click', (ev) => {
      // Find the closest ancestor an element that has a data-note-id attribute
      let target = ev.target;
      while (target && target !== notesTable && !target.getAttribute('data-note-id')) {
        target = target.parentNode;
      }
      if (!target || target === notesTable) return;

      const id = target.getAttribute('data-note-id');

      if (target.classList.contains('edit-btn')) {
        ev.preventDefault();
        openEditModal(id);
        return;
      }

      if (target.classList.contains('share-btn')) {
        ev.preventDefault();
        openShareModal(id);
        return;
      }
      
      if (target.classList.contains('delete-btn')) {
        ev.preventDefault();
        showConfirmModal('Are you sure you want to delete this note?', () => {
          window.AppAPI.deleteNote(id).then(() => {
            const row = document.getElementById(id);
            if (row) row.parentNode.removeChild(row);
            updateCategoriesList();
          }).catch(() => {
            updateNotesTable();
          });
        });
        return;
      }
      
      if (target.classList.contains('download-btn')) {
        ev.preventDefault();
        downloadNoteAsTxt(id);
        return;
      }

      if (target.classList.contains('pin-btn')) {
        ev.preventDefault();
        window.AppAPI.getNoteById(id).then((note) => {
          if (note) {
            note.isPinned = !note.isPinned;
            window.AppAPI.updateNote(note).then(() => {
              // Full refresh to ensure correct sorting from backend
              updateNotesTable();
            });
          }
        });
        return;
      }
    });
  }

  // Health polling and reconnect handling
  if (typeof window.AppAPI.getHealth === 'function') {
    // Track last health to avoid unnecessary full refreshes
    let lastHealthOk = false;

    function checkHealthAndMaybeLoad() {
      window.AppAPI.getHealth().then((info) => {
        const ok = info && info.status === 'ok';
        if (ok) {
          stopAutoRetry();
          updateStatusBanner(info);
          if (!lastHealthOk) updateNotesTable();
        } else {
          // start auto retry loop if not already running
          startAutoRetry();
        }
        lastHealthOk = ok;
      });
    }

    checkHealthAndMaybeLoad();
    setInterval(checkHealthAndMaybeLoad, 8000);

    // Reconnect button
    const reconnectBtn = document.getElementById('reconnectBtn');
    if (reconnectBtn) {
      reconnectBtn.addEventListener('click', () => {
        // stop auto-retry attempts while user initiates manual reconnect
        stopAutoRetry();
        // show spinner
        reconnectBtn.innerHTML = '<span class="spinner"></span> Trying...';
        window.AppAPI.getHealth().then((info) => {
          updateStatusBanner(info);
          if (info && info.status === 'ok') {
            updateNotesTable();
          } else {
            // start auto-retry since manual attempt failed
            startAutoRetry();
          }
        }).finally(() => {
          // ensure button text is reset when health resolves (updateStatusBanner will also reset when ok)
          if (reconnectBtn && reconnectBtn.innerHTML.indexOf('spinner') !== -1) reconnectBtn.innerHTML = 'Reconnect';
        });
      });
    }
  } else {
    // If no health endpoint available, still load notes once
    updateNotesTable();
  }

  // Infinite scroll logic
  const sentinel = document.getElementById('scroll-sentinel');
  const paginationSpinner = document.getElementById('pagination-loading');
  
  if (sentinel) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && hasMoreNotes && !isFetchingPage && !isRefreshPending) {
          if (paginationSpinner) paginationSpinner.style.display = 'inline-block';
          updateNotesTable(undefined, document.getElementById('searchInput').value, currentCategory, true);
        } else if (!entry.isIntersecting || !hasMoreNotes) {
          if (paginationSpinner) paginationSpinner.style.display = 'none';
        }
      });
    }, {
      rootMargin: '100px', // Trigger slightly before the user reaches the bottom
      threshold: 0.1
    });

    observer.observe(sentinel);
  }
});