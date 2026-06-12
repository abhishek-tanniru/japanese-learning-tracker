/* =============================================================================
   VOCAB TRACKER.JS — Vocabulary Management Module
   ============================================================================= */

let vocabSearchQuery = '';
let vocabFilterLevel = 'all';
let vocabSortBy = 'newest';
let vocabCurrentPage = 1;
const VOCAB_PER_PAGE = 20;


/* =============================================================================
   RENDER
   ============================================================================= */

function renderVocabTracker(storage) {
  const totalCount = storage.count('vocabulary');
  
  return `
    <div class="page-header">
      <div class="page-header-left">
        <h2>Vocabulary Tracker</h2>
        <p>Track and manage your Japanese vocabulary.</p>
      </div>
      <div class="page-header-right">
        <span class="total-count">${formatNumber(totalCount)} words</span>
        <button class="btn btn-primary" id="add-vocab-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Word
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
          <input type="text" class="search-input" id="vocab-search" 
                 placeholder="Search vocabulary..." value="${escapeHTML(vocabSearchQuery)}">
        </div>
        
        <div class="filter-group">
          <select class="sort-select" id="vocab-filter-level">
            <option value="all" ${vocabFilterLevel === 'all' ? 'selected' : ''}>All Levels</option>
            <option value="N5" ${vocabFilterLevel === 'N5' ? 'selected' : ''}>N5</option>
            <option value="N4" ${vocabFilterLevel === 'N4' ? 'selected' : ''}>N4</option>
            <option value="N3" ${vocabFilterLevel === 'N3' ? 'selected' : ''}>N3</option>
            <option value="N2" ${vocabFilterLevel === 'N2' ? 'selected' : ''}>N2</option>
            <option value="N1" ${vocabFilterLevel === 'N1' ? 'selected' : ''}>N1</option>
          </select>
          
          <select class="sort-select" id="vocab-sort">
            <option value="newest" ${vocabSortBy === 'newest' ? 'selected' : ''}>Newest First</option>
            <option value="oldest" ${vocabSortBy === 'oldest' ? 'selected' : ''}>Oldest First</option>
            <option value="a-z" ${vocabSortBy === 'a-z' ? 'selected' : ''}>A → Z</option>
            <option value="z-a" ${vocabSortBy === 'z-a' ? 'selected' : ''}>Z → A</option>
          </select>
        </div>
      </div>
      
      <!-- Vocabulary List Container -->
      <div id="vocab-list-container">
        ${renderVocabList(storage)}
      </div>
    </div>
  `;
}


function renderVocabList(storage) {
  let items = storage.getAll('vocabulary');
  
  if (vocabSearchQuery) {
    const query = vocabSearchQuery.toLowerCase();
    items = items.filter(item => 
      item.japanese.toLowerCase().includes(query) ||
      item.english.toLowerCase().includes(query)
    );
  }
  
  if (vocabFilterLevel !== 'all') {
    items = items.filter(item => item.jlptLevel === vocabFilterLevel);
  }
  
  items = sortItems(items, vocabSortBy);
  
  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / VOCAB_PER_PAGE);
  
  if (vocabCurrentPage > totalPages) vocabCurrentPage = Math.max(1, totalPages);
  
  const startIndex = (vocabCurrentPage - 1) * VOCAB_PER_PAGE;
  const pageItems = items.slice(startIndex, startIndex + VOCAB_PER_PAGE);
  
  if (totalItems === 0) {
    if (vocabSearchQuery || vocabFilterLevel !== 'all') {
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
        <div class="empty-state-icon">📝</div>
        <h3>No Vocabulary Yet</h3>
        <p>Start building your vocabulary by adding your first Japanese word!</p>
        <button class="btn btn-primary" onclick="showVocabForm()">Add Your First Word</button>
      </div>
    `;
  }
  
  const listHTML = pageItems.map(item => `
    <div class="data-list-item tracker-item" data-id="${item.id}">
      <div class="tracker-item-main">
        <div class="tracker-item-word japanese-text">${escapeHTML(item.japanese)}</div>
        <div class="tracker-item-meaning">${escapeHTML(item.english)}</div>
      </div>
      <div class="tracker-item-meta">
        <span class="badge badge-${item.jlptLevel.toLowerCase()}">${item.jlptLevel}</span>
        <span class="tracker-item-date">${formatDate(item.dateAdded)}</span>
      </div>
      <div class="data-list-item-actions">
        <button class="btn-icon vocab-edit-btn" data-id="${item.id}" title="Edit">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button class="btn-icon vocab-delete-btn" data-id="${item.id}" title="Delete">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      </div>
    </div>
  `).join('');
  
  // Pagination
  const paginationHTML = totalPages > 1 ? renderPagination(vocabCurrentPage, totalPages, 'vocab') : '';
  
  return `
    <div class="data-list">${listHTML}</div>
    ${paginationHTML}
    <div style="text-align: center; margin-top: var(--space-3);">
      <span class="pagination-info">Showing ${startIndex + 1}-${Math.min(startIndex + VOCAB_PER_PAGE, totalItems)} of ${totalItems}</span>
    </div>
  `;
}


/* =============================================================================
   INIT
   ============================================================================= */

function initVocabTracker(storage) {
  document.getElementById('add-vocab-btn')?.addEventListener('click', () => showVocabForm());
  
  const searchInput = document.getElementById('vocab-search');
  if (searchInput) {
    searchInput.addEventListener('input', debounce((e) => {
      vocabSearchQuery = e.target.value;
      vocabCurrentPage = 1;
      refreshVocabList();
    }, 300));
  }
  
  document.getElementById('vocab-filter-level')?.addEventListener('change', (e) => {
    vocabFilterLevel = e.target.value;
    vocabCurrentPage = 1;
    refreshVocabList();
  });
  
  document.getElementById('vocab-sort')?.addEventListener('change', (e) => {
    vocabSortBy = e.target.value;
    vocabCurrentPage = 1;
    refreshVocabList();
  });
  
  document.getElementById('vocab-list-container')?.addEventListener('click', (e) => {
    const editBtn = e.target.closest('.vocab-edit-btn');
    if (editBtn) {
      const id = editBtn.dataset.id;
      const item = storage.getById('vocabulary', id);
      if (item) showVocabForm(item);
      return;
    }
    
    const deleteBtn = e.target.closest('.vocab-delete-btn');
    if (deleteBtn) {
      const id = deleteBtn.dataset.id;
      const item = storage.getById('vocabulary', id);
      if (item) {
        showConfirmDialog(
          'Delete Vocabulary',
          `Are you sure you want to delete "${item.japanese}"?`,
          () => {
            storage.delete('vocabulary', id);
            storage.logActivity('vocab_deleted', `Deleted vocabulary: ${item.japanese}`);
            showToast('Vocabulary deleted', 'success');
            refreshVocabList();
            updateVocabCount();
          }
        );
      }
      return;
    }
    
    const pageBtn = e.target.closest('.pagination-btn[data-page]');
    if (pageBtn) {
      const page = parseInt(pageBtn.dataset.page, 10);
      if (!isNaN(page)) {
        vocabCurrentPage = page;
        refreshVocabList();
      }
    }
  });
}


/* =============================================================================
   FORM
   ============================================================================= */

function showVocabForm(existingItem = null) {
  const isEdit = existingItem !== null;
  const title = isEdit ? 'Edit Vocabulary' : 'Add Vocabulary';
  
  const bodyHTML = `
    <form id="vocab-form" novalidate>
      <div class="form-group">
        <label class="form-label" for="vocab-japanese">
          Japanese Word <span class="required">*</span>
        </label>
        <input type="text" class="form-input japanese-text" id="vocab-japanese" 
               placeholder="e.g., 食べる" value="${isEdit ? escapeHTML(existingItem.japanese) : ''}" required>
        <span class="form-error" id="vocab-japanese-error"></span>
      </div>
      
      <div class="form-group">
        <label class="form-label" for="vocab-english">
          English Meaning <span class="required">*</span>
        </label>
        <input type="text" class="form-input" id="vocab-english" 
               placeholder="e.g., to eat" value="${isEdit ? escapeHTML(existingItem.english) : ''}" required>
        <span class="form-error" id="vocab-english-error"></span>
      </div>
      
      <div class="form-group">
        <label class="form-label" for="vocab-jlpt">
          JLPT Level <span class="required">*</span>
        </label>
        <select class="form-select" id="vocab-jlpt">
          <option value="" disabled ${!isEdit ? 'selected' : ''}>Select level</option>
          ${JLPT_LEVELS.map(level => `
            <option value="${level}" ${isEdit && existingItem.jlptLevel === level ? 'selected' : ''}>${level}</option>
          `).join('')}
        </select>
        <span class="form-error" id="vocab-jlpt-error"></span>
      </div>
    </form>
  `;
  
  const footerHTML = `
    <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
    <button class="btn btn-primary" id="vocab-save-btn">${isEdit ? 'Save Changes' : 'Add Word'}</button>
  `;
  
  openModal(title, bodyHTML, { footerHTML });
  
  // Focus the first input
  setTimeout(() => {
    document.getElementById('vocab-japanese')?.focus();
    
    // Save button handler
    document.getElementById('vocab-save-btn')?.addEventListener('click', () => {
      saveVocab(isEdit ? existingItem.id : null);
    });
    
    // Submit on Enter key
    document.getElementById('vocab-form')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveVocab(isEdit ? existingItem.id : null);
      }
    });
  }, 50);
}


/**
 * Saves a vocabulary entry (create or update).
 * @param {string|null} editId - If editing, the ID of the item. Null for new items.
 */
function saveVocab(editId = null) {
  const japanese = sanitizeInput(document.getElementById('vocab-japanese')?.value || '');
  const english = sanitizeInput(document.getElementById('vocab-english')?.value || '');
  const jlptLevel = document.getElementById('vocab-jlpt')?.value || '';
  
  const validation = validateVocab({ japanese, english, jlptLevel });
  
  document.getElementById('vocab-japanese-error').textContent = '';
  document.getElementById('vocab-english-error').textContent = '';
  document.getElementById('vocab-jlpt-error').textContent = '';
  document.querySelectorAll('.form-input, .form-select').forEach(el => el.classList.remove('error'));
  
  if (!validation.valid) {
    validation.errors.forEach(error => {
      if (error.includes('Japanese')) {
        document.getElementById('vocab-japanese-error').textContent = error;
        document.getElementById('vocab-japanese')?.classList.add('error');
      } else if (error.includes('English')) {
        document.getElementById('vocab-english-error').textContent = error;
        document.getElementById('vocab-english')?.classList.add('error');
      } else if (error.includes('JLPT')) {
        document.getElementById('vocab-jlpt-error').textContent = error;
        document.getElementById('vocab-jlpt')?.classList.add('error');
      }
    });
    return;
  }
  
  if (storage.isDuplicateVocab(japanese, editId)) {
    document.getElementById('vocab-japanese-error').textContent = 'This word already exists in your vocabulary.';
    document.getElementById('vocab-japanese')?.classList.add('error');
    return;
  }
  
  if (editId) {
    storage.update('vocabulary', editId, { japanese, english, jlptLevel });
    storage.logActivity('vocab_edited', `Edited vocabulary: ${japanese}`);
    showToast('Vocabulary updated!', 'success');
  } else {
    storage.create('vocabulary', { japanese, english, jlptLevel });
    storage.logActivity('vocab_added', `Added vocabulary: ${japanese} (${english})`);
    showToast('Word added to vocabulary!', 'success');
  }
  
  closeModal();
  refreshVocabList();
  updateVocabCount();
}


/* =============================================================================
   HELPERS
   ============================================================================= */

function refreshVocabList() {
  const container = document.getElementById('vocab-list-container');
  if (container) {
    container.innerHTML = renderVocabList(storage);
  }
}

function updateVocabCount() {
  const countEl = document.querySelector('.page-header-right .total-count');
  if (countEl) {
    countEl.textContent = `${formatNumber(storage.count('vocabulary'))} words`;
  }
}

function sortItems(items, sortBy) {
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

function renderPagination(currentPage, totalPages, prefix) {
  let buttons = '';
  
  buttons += `
    <button class="pagination-btn" data-page="${currentPage - 1}" 
            ${currentPage <= 1 ? 'disabled' : ''}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="15 18 9 12 15 6"/>
      </svg>
    </button>
  `;
  
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, startPage + 4);
  
  if (startPage > 1) {
    buttons += `<button class="pagination-btn" data-page="1">1</button>`;
    if (startPage > 2) buttons += `<span class="pagination-info">...</span>`;
  }
  
  for (let i = startPage; i <= endPage; i++) {
    buttons += `
      <button class="pagination-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>
    `;
  }
  
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) buttons += `<span class="pagination-info">...</span>`;
    buttons += `<button class="pagination-btn" data-page="${totalPages}">${totalPages}</button>`;
  }
  
  buttons += `
    <button class="pagination-btn" data-page="${currentPage + 1}" 
            ${currentPage >= totalPages ? 'disabled' : ''}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    </button>
  `;
  
  return `<div class="pagination">${buttons}</div>`;
}
