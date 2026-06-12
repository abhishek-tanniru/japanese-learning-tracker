/* =============================================================================
   KANJI TRACKER.JS — Kanji Management Module
   ============================================================================= */

let kanjiSearchQuery = '';
let kanjiFilterLevel = 'all';
let kanjiSortBy = 'newest';
let kanjiCurrentPage = 1;
const KANJI_PER_PAGE = 20;


/* =============================================================================
   RENDER
   ============================================================================= */

function renderKanjiTracker(storage) {
  const totalCount = storage.count('kanji');
  
  return `
    <div class="page-header">
      <div class="page-header-left">
        <h2>Kanji Tracker</h2>
        <p>Track and manage your kanji learning progress.</p>
      </div>
      <div class="page-header-right">
        <span class="total-count">${formatNumber(totalCount)} kanji</span>
        <button class="btn btn-primary" id="add-kanji-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Kanji
        </button>
      </div>
    </div>
    
    <div class="page-content fade-in">
      <!-- Search & Filter Bar -->
      <div class="search-filter-bar">
        <div class="search-input-wrapper">
          <span class="search-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </span>
          <input type="text" class="search-input" id="kanji-search" 
                 placeholder="Search kanji..." value="${escapeHTML(kanjiSearchQuery)}">
        </div>
        
        <div class="filter-group">
          <select class="sort-select" id="kanji-filter-level">
            <option value="all" ${kanjiFilterLevel === 'all' ? 'selected' : ''}>All Levels</option>
            <option value="N5" ${kanjiFilterLevel === 'N5' ? 'selected' : ''}>N5</option>
            <option value="N4" ${kanjiFilterLevel === 'N4' ? 'selected' : ''}>N4</option>
            <option value="N3" ${kanjiFilterLevel === 'N3' ? 'selected' : ''}>N3</option>
            <option value="N2" ${kanjiFilterLevel === 'N2' ? 'selected' : ''}>N2</option>
            <option value="N1" ${kanjiFilterLevel === 'N1' ? 'selected' : ''}>N1</option>
          </select>
          
          <select class="sort-select" id="kanji-sort">
            <option value="newest" ${kanjiSortBy === 'newest' ? 'selected' : ''}>Newest First</option>
            <option value="oldest" ${kanjiSortBy === 'oldest' ? 'selected' : ''}>Oldest First</option>
            <option value="a-z" ${kanjiSortBy === 'a-z' ? 'selected' : ''}>A → Z</option>
            <option value="z-a" ${kanjiSortBy === 'z-a' ? 'selected' : ''}>Z → A</option>
          </select>
        </div>
      </div>
      
      <!-- Kanji List Container -->
      <div id="kanji-list-container">
        ${renderKanjiList(storage)}
      </div>
    </div>
  `;
}


function renderKanjiList(storage) {
  let items = storage.getAll('kanji');
  
  if (kanjiSearchQuery) {
    const query = kanjiSearchQuery.toLowerCase();
    items = items.filter(item =>
      item.character.toLowerCase().includes(query) ||
      item.english.toLowerCase().includes(query)
    );
  }
  
  if (kanjiFilterLevel !== 'all') {
    items = items.filter(item => item.jlptLevel === kanjiFilterLevel);
  }
  
  items = sortKanjiItems(items, kanjiSortBy);
  
  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / KANJI_PER_PAGE);
  if (kanjiCurrentPage > totalPages) kanjiCurrentPage = Math.max(1, totalPages);
  
  const startIndex = (kanjiCurrentPage - 1) * KANJI_PER_PAGE;
  const pageItems = items.slice(startIndex, startIndex + KANJI_PER_PAGE);
  
  if (totalItems === 0) {
    if (kanjiSearchQuery || kanjiFilterLevel !== 'all') {
      return `
        <div class="empty-state">
          <div class="empty-state-icon">🔍</div>
          <h3>No Results Found</h3>
          <p>Try adjusting your search or filters.</p>
        </div>
      `;
    }
    return `
      <div class="empty-state">
        <div class="empty-state-icon">🈴</div>
        <h3>No Kanji Yet</h3>
        <p>Start learning kanji by adding your first character!</p>
        <button class="btn btn-primary" onclick="showKanjiForm()">Add Your First Kanji</button>
      </div>
    `;
  }
  
  const listHTML = pageItems.map(item => `
    <div class="data-list-item tracker-item kanji-item" data-id="${item.id}">
      <div class="kanji-character japanese-text">${escapeHTML(item.character)}</div>
      <div class="tracker-item-main">
        <div class="tracker-item-meaning">${escapeHTML(item.english)}</div>
      </div>
      <div class="tracker-item-meta">
        <span class="badge badge-${item.jlptLevel.toLowerCase()}">${item.jlptLevel}</span>
        <span class="tracker-item-date">${formatDate(item.dateAdded)}</span>
      </div>
      <div class="data-list-item-actions">
        <button class="btn-icon kanji-edit-btn" data-id="${item.id}" title="Edit">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button class="btn-icon kanji-delete-btn" data-id="${item.id}" title="Delete">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      </div>
    </div>
  `).join('');
  
  const paginationHTML = totalPages > 1 ? renderPagination(kanjiCurrentPage, totalPages, 'kanji') : '';
  
  return `
    <div class="data-list">${listHTML}</div>
    ${paginationHTML}
    <div style="text-align: center; margin-top: var(--space-3);">
      <span class="pagination-info">Showing ${startIndex + 1}-${Math.min(startIndex + KANJI_PER_PAGE, totalItems)} of ${totalItems}</span>
    </div>
  `;
}


/* =============================================================================
   INIT
   ============================================================================= */

function initKanjiTracker(storage) {
  document.getElementById('add-kanji-btn')?.addEventListener('click', () => showKanjiForm());
  
  const searchInput = document.getElementById('kanji-search');
  if (searchInput) {
    searchInput.addEventListener('input', debounce((e) => {
      kanjiSearchQuery = e.target.value;
      kanjiCurrentPage = 1;
      refreshKanjiList();
    }, 300));
  }
  
  document.getElementById('kanji-filter-level')?.addEventListener('change', (e) => {
    kanjiFilterLevel = e.target.value;
    kanjiCurrentPage = 1;
    refreshKanjiList();
  });
  
  document.getElementById('kanji-sort')?.addEventListener('change', (e) => {
    kanjiSortBy = e.target.value;
    kanjiCurrentPage = 1;
    refreshKanjiList();
  });
  
  document.getElementById('kanji-list-container')?.addEventListener('click', (e) => {
    const editBtn = e.target.closest('.kanji-edit-btn');
    if (editBtn) {
      const id = editBtn.dataset.id;
      const item = storage.getById('kanji', id);
      if (item) showKanjiForm(item);
      return;
    }
    
    const deleteBtn = e.target.closest('.kanji-delete-btn');
    if (deleteBtn) {
      const id = deleteBtn.dataset.id;
      const item = storage.getById('kanji', id);
      if (item) {
        showConfirmDialog(
          'Delete Kanji',
          `Are you sure you want to delete "${item.character}"?`,
          () => {
            storage.delete('kanji', id);
            storage.logActivity('kanji_deleted', `Deleted kanji: ${item.character}`);
            showToast('Kanji deleted', 'success');
            refreshKanjiList();
            updateKanjiCount();
          }
        );
      }
      return;
    }
    
    const pageBtn = e.target.closest('.pagination-btn[data-page]');
    if (pageBtn) {
      const page = parseInt(pageBtn.dataset.page, 10);
      if (!isNaN(page)) {
        kanjiCurrentPage = page;
        refreshKanjiList();
      }
    }
  });
}


/* =============================================================================
   FORM
   ============================================================================= */

function showKanjiForm(existingItem = null) {
  const isEdit = existingItem !== null;
  const title = isEdit ? 'Edit Kanji' : 'Add Kanji';
  
  const bodyHTML = `
    <form id="kanji-form" novalidate>
      <div class="form-group">
        <label class="form-label" for="kanji-character">
          Kanji Character <span class="required">*</span>
        </label>
        <input type="text" class="form-input kanji-input japanese-text" id="kanji-character" 
               placeholder="e.g., 食" value="${isEdit ? escapeHTML(existingItem.character) : ''}" required>
        <span class="form-hint">Enter a single kanji character</span>
        <span class="form-error" id="kanji-character-error"></span>
      </div>
      
      <div class="form-group">
        <label class="form-label" for="kanji-english">
          English Meaning <span class="required">*</span>
        </label>
        <input type="text" class="form-input" id="kanji-english" 
               placeholder="e.g., eat, food" value="${isEdit ? escapeHTML(existingItem.english) : ''}" required>
        <span class="form-error" id="kanji-english-error"></span>
      </div>
      
      <div class="form-group">
        <label class="form-label" for="kanji-jlpt">
          JLPT Level <span class="required">*</span>
        </label>
        <select class="form-select" id="kanji-jlpt">
          <option value="" disabled ${!isEdit ? 'selected' : ''}>Select level</option>
          ${JLPT_LEVELS.map(level => `
            <option value="${level}" ${isEdit && existingItem.jlptLevel === level ? 'selected' : ''}>${level}</option>
          `).join('')}
        </select>
        <span class="form-error" id="kanji-jlpt-error"></span>
      </div>
    </form>
  `;
  
  const footerHTML = `
    <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
    <button class="btn btn-primary" id="kanji-save-btn">${isEdit ? 'Save Changes' : 'Add Kanji'}</button>
  `;
  
  openModal(title, bodyHTML, { footerHTML });
  
  setTimeout(() => {
    document.getElementById('kanji-character')?.focus();
    
    document.getElementById('kanji-save-btn')?.addEventListener('click', () => {
      saveKanji(isEdit ? existingItem.id : null);
    });
    
    document.getElementById('kanji-form')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveKanji(isEdit ? existingItem.id : null);
      }
    });
  }, 50);
}


/**
 * Saves a kanji entry (create or update).
 * @param {string|null} editId - If editing, the item ID. Null for new items.
 */
function saveKanji(editId = null) {
  const character = sanitizeInput(document.getElementById('kanji-character')?.value || '');
  const english = sanitizeInput(document.getElementById('kanji-english')?.value || '');
  const jlptLevel = document.getElementById('kanji-jlpt')?.value || '';
  
  const validation = validateKanji({ character, english, jlptLevel });
  
  document.getElementById('kanji-character-error').textContent = '';
  document.getElementById('kanji-english-error').textContent = '';
  document.getElementById('kanji-jlpt-error').textContent = '';
  document.querySelectorAll('.form-input, .form-select').forEach(el => el.classList.remove('error'));
  
  if (!validation.valid) {
    validation.errors.forEach(error => {
      if (error.includes('character') || error.includes('Kanji character') || error.includes('kanji')) {
        document.getElementById('kanji-character-error').textContent = error;
        document.getElementById('kanji-character')?.classList.add('error');
      } else if (error.includes('English')) {
        document.getElementById('kanji-english-error').textContent = error;
        document.getElementById('kanji-english')?.classList.add('error');
      } else if (error.includes('JLPT')) {
        document.getElementById('kanji-jlpt-error').textContent = error;
        document.getElementById('kanji-jlpt')?.classList.add('error');
      }
    });
    return;
  }
  
  if (storage.isDuplicateKanji(character, editId)) {
    document.getElementById('kanji-character-error').textContent = 'This kanji already exists in your collection.';
    document.getElementById('kanji-character')?.classList.add('error');
    return;
  }
  
  if (editId) {
    storage.update('kanji', editId, { character, english, jlptLevel });
    storage.logActivity('kanji_edited', `Edited kanji: ${character}`);
    showToast('Kanji updated!', 'success');
  } else {
    storage.create('kanji', { character, english, jlptLevel });
    storage.logActivity('kanji_added', `Added kanji: ${character} (${english})`);
    showToast('Kanji added!', 'success');
  }
  
  closeModal();
  refreshKanjiList();
  updateKanjiCount();
}


/* =============================================================================
   HELPERS
   ============================================================================= */

function refreshKanjiList() {
  const container = document.getElementById('kanji-list-container');
  if (container) {
    container.innerHTML = renderKanjiList(storage);
  }
}

function updateKanjiCount() {
  const countEl = document.querySelector('.page-header-right .total-count');
  if (countEl) {
    countEl.textContent = `${formatNumber(storage.count('kanji'))} kanji`;
  }
}

function sortKanjiItems(items, sortBy) {
  const sorted = [...items];
  
  switch (sortBy) {
    case 'newest':
      sorted.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
      break;
    case 'oldest':
      sorted.sort((a, b) => new Date(a.dateAdded) - new Date(b.dateAdded));
      break;
    case 'a-z':
      sorted.sort((a, b) => (a.english || '').localeCompare(b.english || ''));
      break;
    case 'z-a':
      sorted.sort((a, b) => (b.english || '').localeCompare(a.english || ''));
      break;
  }
  
  return sorted;
}
