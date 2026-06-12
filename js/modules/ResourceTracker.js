/* =============================================================================
   RESOURCE TRACKER.JS — Resource Progress Management Module
   ============================================================================= */

let resourceSearchQuery = '';
let resourceFilterCategory = 'all';
let resourceSortBy = 'newest';


/* =============================================================================
   RENDER
   ============================================================================= */

function renderResourceTracker(storage) {
  const resources = storage.getAll('resources');
  const totalResources = resources.length;
  const completedCount = resources.filter(r => r.completedUnits >= r.totalUnits && r.totalUnits > 0).length;
  
  return `
    <div class="page-header">
      <div class="page-header-left">
        <h2>Resource Tracker</h2>
        <p>Track progress across your learning materials.</p>
      </div>
      <div class="page-header-right">
        <span class="total-count">${completedCount}/${totalResources} completed</span>
        <button class="btn btn-primary" id="add-resource-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Resource
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
          <input type="text" class="search-input" id="resource-search" 
                 placeholder="Search resources..." value="${escapeHTML(resourceSearchQuery)}">
        </div>
        
        <div class="filter-group">
          <select class="sort-select" id="resource-filter-category">
            <option value="all">All Categories</option>
            ${RESOURCE_CATEGORIES.map(cat => `
              <option value="${cat}" ${resourceFilterCategory === cat ? 'selected' : ''}>${cat}</option>
            `).join('')}
          </select>
          
          <select class="sort-select" id="resource-sort">
            <option value="newest" ${resourceSortBy === 'newest' ? 'selected' : ''}>Newest</option>
            <option value="oldest" ${resourceSortBy === 'oldest' ? 'selected' : ''}>Oldest</option>
            <option value="progress" ${resourceSortBy === 'progress' ? 'selected' : ''}>Progress</option>
            <option value="name" ${resourceSortBy === 'name' ? 'selected' : ''}>Name</option>
          </select>
        </div>
      </div>
      
      <!-- Resource Cards Grid -->
      <div id="resource-list-container">
        ${renderResourceList(storage)}
      </div>
    </div>
  `;
}


function renderResourceList(storage) {
  let items = storage.getAll('resources');
  
  if (resourceSearchQuery) {
    const query = resourceSearchQuery.toLowerCase();
    items = items.filter(item =>
      item.name.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query) ||
      item.unitType.toLowerCase().includes(query)
    );
  }
  
  if (resourceFilterCategory !== 'all') {
    items = items.filter(item => item.category === resourceFilterCategory);
  }
  
  items = sortResourceItems(items, resourceSortBy);
  
  if (items.length === 0) {
    if (resourceSearchQuery || resourceFilterCategory !== 'all') {
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
        <div class="empty-state-icon">📚</div>
        <h3>No Resources Yet</h3>
        <p>Add your textbooks, workbooks, and other learning materials to track progress.</p>
        <button class="btn btn-primary" onclick="showResourceForm()">Add Your First Resource</button>
      </div>
    `;
  }
  
  const cardsHTML = items.map(item => {
    const percentage = calculatePercentage(item.completedUnits, item.totalUnits);
    const isCompleted = percentage >= 100;
    
    return `
      <div class="resource-card card ${isCompleted ? 'resource-completed' : ''}" data-id="${item.id}">
        <div class="resource-card-header">
          <div class="resource-card-info">
            <h4 class="resource-card-name">${escapeHTML(item.name)}</h4>
            <span class="badge badge-category">${escapeHTML(item.category)}</span>
          </div>
          <div class="data-list-item-actions">
            <button class="btn-icon resource-edit-btn" data-id="${item.id}" title="Edit">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button class="btn-icon resource-delete-btn" data-id="${item.id}" title="Delete">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          </div>
        </div>
        
        <div class="resource-card-progress">
          <div class="resource-progress-stats">
            <span class="resource-progress-count">
              ${item.completedUnits} / ${item.totalUnits} ${escapeHTML(item.unitType)}
            </span>
            <span class="resource-progress-pct">${percentage}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-bar-fill ${isCompleted ? 'completed' : ''}" 
                 style="width: ${percentage}%"></div>
          </div>
        </div>
        
        <div class="resource-card-footer">
          <span class="resource-card-date">${isCompleted ? '✅ Completed' : `Updated ${formatDate(item.lastModified || item.dateAdded)}`}</span>
          <button class="btn btn-sm btn-secondary resource-update-btn" data-id="${item.id}" 
                  ${isCompleted ? 'disabled' : ''}>
            ${isCompleted ? 'Done!' : 'Update Progress'}
          </button>
        </div>
      </div>
    `;
  }).join('');
  
  return `<div class="resource-grid">${cardsHTML}</div>`;
}


/* =============================================================================
   INIT
   ============================================================================= */

function initResourceTracker(storage) {
  document.getElementById('add-resource-btn')?.addEventListener('click', () => showResourceForm());
  
  const searchInput = document.getElementById('resource-search');
  if (searchInput) {
    searchInput.addEventListener('input', debounce((e) => {
      resourceSearchQuery = e.target.value;
      refreshResourceList();
    }, 300));
  }
  
  document.getElementById('resource-filter-category')?.addEventListener('change', (e) => {
    resourceFilterCategory = e.target.value;
    refreshResourceList();
  });
  
  document.getElementById('resource-sort')?.addEventListener('change', (e) => {
    resourceSortBy = e.target.value;
    refreshResourceList();
  });
  
  document.getElementById('resource-list-container')?.addEventListener('click', (e) => {
    const editBtn = e.target.closest('.resource-edit-btn');
    if (editBtn) {
      const id = editBtn.dataset.id;
      const item = storage.getById('resources', id);
      if (item) showResourceForm(item);
      return;
    }
    
    const deleteBtn = e.target.closest('.resource-delete-btn');
    if (deleteBtn) {
      const id = deleteBtn.dataset.id;
      const item = storage.getById('resources', id);
      if (item) {
        showConfirmDialog(
          'Delete Resource',
          `Are you sure you want to delete "${item.name}"?`,
          () => {
            storage.delete('resources', id);
            storage.logActivity('resource_deleted', `Deleted resource: ${item.name}`);
            showToast('Resource deleted', 'success');
            refreshResourceList();
            updateResourceCount();
          }
        );
      }
      return;
    }
    
    const updateBtn = e.target.closest('.resource-update-btn');
    if (updateBtn && !updateBtn.disabled) {
      const id = updateBtn.dataset.id;
      const item = storage.getById('resources', id);
      if (item) showProgressUpdateForm(item);
    }
  });
}


/* =============================================================================
   FORMS
   ============================================================================= */

function showResourceForm(existingItem = null) {
  const isEdit = existingItem !== null;
  const title = isEdit ? 'Edit Resource' : 'Add Resource';
  
  const bodyHTML = `
    <form id="resource-form" novalidate>
      <div class="form-group">
        <label class="form-label" for="resource-name">
          Resource Name <span class="required">*</span>
        </label>
        <input type="text" class="form-input" id="resource-name" 
               placeholder="e.g., Minna no Nihongo N5" 
               value="${isEdit ? escapeHTML(existingItem.name) : ''}">
        <span class="form-error" id="resource-name-error"></span>
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="resource-category">
            Category <span class="required">*</span>
          </label>
          <select class="form-select" id="resource-category">
            <option value="" disabled ${!isEdit ? 'selected' : ''}>Select category</option>
            ${RESOURCE_CATEGORIES.map(cat => `
              <option value="${cat}" ${isEdit && existingItem.category === cat ? 'selected' : ''}>${cat}</option>
            `).join('')}
          </select>
          <span class="form-error" id="resource-category-error"></span>
        </div>
        
        <div class="form-group">
          <label class="form-label" for="resource-unit-type">
            Unit Type <span class="required">*</span>
          </label>
          <input type="text" class="form-input" id="resource-unit-type" 
                 placeholder="e.g., Lessons, Chapters"
                 value="${isEdit ? escapeHTML(existingItem.unitType) : ''}"
                 list="unit-type-suggestions">
          <datalist id="unit-type-suggestions">
            ${COMMON_UNIT_TYPES.map(type => `<option value="${type}">`).join('')}
          </datalist>
          <span class="form-hint">What does each unit represent?</span>
          <span class="form-error" id="resource-unit-error"></span>
        </div>
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="resource-total">
            Total Units <span class="required">*</span>
          </label>
          <input type="number" class="form-input" id="resource-total" 
                 placeholder="e.g., 25" min="1" max="10000"
                 value="${isEdit ? existingItem.totalUnits : ''}">
          <span class="form-error" id="resource-total-error"></span>
        </div>
        
        <div class="form-group">
          <label class="form-label" for="resource-completed">
            Completed Units
          </label>
          <input type="number" class="form-input" id="resource-completed" 
                 placeholder="0" min="0"
                 value="${isEdit ? existingItem.completedUnits : '0'}">
          <span class="form-error" id="resource-completed-error"></span>
        </div>
      </div>
    </form>
  `;
  
  const footerHTML = `
    <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
    <button class="btn btn-primary" id="resource-save-btn">${isEdit ? 'Save Changes' : 'Add Resource'}</button>
  `;
  
  openModal(title, bodyHTML, { footerHTML });
  
  setTimeout(() => {
    document.getElementById('resource-name')?.focus();
    
    document.getElementById('resource-save-btn')?.addEventListener('click', () => {
      saveResource(isEdit ? existingItem.id : null);
    });
    
    document.getElementById('resource-form')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveResource(isEdit ? existingItem.id : null);
      }
    });
  }, 50);
}


function showProgressUpdateForm(resource) {
  const percentage = calculatePercentage(resource.completedUnits, resource.totalUnits);
  
  const bodyHTML = `
    <div style="text-align: center; margin-bottom: var(--space-4);">
      <h4 style="margin-bottom: var(--space-2);">${escapeHTML(resource.name)}</h4>
      <p style="color: var(--text-secondary); font-size: var(--text-sm);">
        Currently: ${resource.completedUnits} / ${resource.totalUnits} ${escapeHTML(resource.unitType)} (${percentage}%)
      </p>
    </div>
    
    <div class="progress-bar progress-bar-lg" style="margin-bottom: var(--space-6);">
      <div class="progress-bar-fill" style="width: ${percentage}%"></div>
    </div>
    
    <div class="form-group">
      <label class="form-label" for="progress-value">
        Completed ${escapeHTML(resource.unitType)}
      </label>
      <input type="number" class="form-input" id="progress-value" 
             value="${resource.completedUnits}" min="0" max="${resource.totalUnits}"
             style="font-size: var(--text-xl); text-align: center; font-weight: var(--font-bold);">
      <span class="form-hint">Max: ${resource.totalUnits}</span>
    </div>
  `;
  
  const footerHTML = `
    <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
    <button class="btn btn-primary" id="progress-save-btn">Update Progress</button>
  `;
  
  openModal('Update Progress', bodyHTML, { footerHTML });
  
  setTimeout(() => {
    const input = document.getElementById('progress-value');
    input?.focus();
    input?.select();
    
    document.getElementById('progress-save-btn')?.addEventListener('click', () => {
      const newCompleted = parseInt(document.getElementById('progress-value')?.value, 10);
      
      if (isNaN(newCompleted) || newCompleted < 0) {
        showToast('Please enter a valid number.', 'error');
        return;
      }
      if (newCompleted > resource.totalUnits) {
        showToast(`Cannot exceed total of ${resource.totalUnits}.`, 'error');
        return;
      }
      
      storage.update('resources', resource.id, { completedUnits: newCompleted });
      storage.logActivity('resource_updated', `Updated ${resource.name}: ${newCompleted}/${resource.totalUnits} ${resource.unitType}`);
      
      if (newCompleted >= resource.totalUnits) {
        showToast(`🎉 Congratulations! You completed ${resource.name}!`, 'success');
      } else {
        showToast('Progress updated!', 'success');
      }
      
      closeModal();
      refreshResourceList();
      updateResourceCount();
    });
    
    // Enter key
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        document.getElementById('progress-save-btn')?.click();
      }
    });
  }, 50);
}


function saveResource(editId = null) {
  const name = sanitizeInput(document.getElementById('resource-name')?.value || '');
  const category = document.getElementById('resource-category')?.value || '';
  const unitType = sanitizeInput(document.getElementById('resource-unit-type')?.value || '');
  const totalUnits = document.getElementById('resource-total')?.value || '';
  const completedUnits = document.getElementById('resource-completed')?.value || '0';
  
  const validation = validateResource({ name, category, unitType, totalUnits, completedUnits });
  
  ['name', 'category', 'unit', 'total', 'completed'].forEach(field => {
    const errEl = document.getElementById(`resource-${field}-error`);
    if (errEl) errEl.textContent = '';
  });
  document.querySelectorAll('.form-input, .form-select').forEach(el => el.classList.remove('error'));
  
  if (!validation.valid) {
    validation.errors.forEach(error => {
      if (error.includes('name') || error.includes('Resource name')) {
        document.getElementById('resource-name-error').textContent = error;
        document.getElementById('resource-name')?.classList.add('error');
      } else if (error.includes('category')) {
        document.getElementById('resource-category-error').textContent = error;
        document.getElementById('resource-category')?.classList.add('error');
      } else if (error.includes('unit type') || error.includes('Progress unit')) {
        document.getElementById('resource-unit-error').textContent = error;
        document.getElementById('resource-unit-type')?.classList.add('error');
      } else if (error.includes('Total')) {
        document.getElementById('resource-total-error').textContent = error;
        document.getElementById('resource-total')?.classList.add('error');
      } else if (error.includes('Completed')) {
        document.getElementById('resource-completed-error').textContent = error;
        document.getElementById('resource-completed')?.classList.add('error');
      }
    });
    return;
  }
  
  const data = {
    name,
    category,
    unitType,
    totalUnits: parseInt(totalUnits, 10),
    completedUnits: parseInt(completedUnits, 10)
  };
  
  if (editId) {
    storage.update('resources', editId, data);
    storage.logActivity('resource_updated', `Updated resource: ${name}`);
    showToast('Resource updated!', 'success');
  } else {
    storage.create('resources', data);
    storage.logActivity('resource_added', `Added resource: ${name}`);
    showToast('Resource added!', 'success');
  }
  
  closeModal();
  refreshResourceList();
  updateResourceCount();
}

/* =============================================================================
   HELPERS
   ============================================================================= */

function refreshResourceList() {
  const container = document.getElementById('resource-list-container');
  if (container) {
    container.innerHTML = renderResourceList(storage);
  }
}

function updateResourceCount() {
  const resources = storage.getAll('resources');
  const completed = resources.filter(r => r.completedUnits >= r.totalUnits && r.totalUnits > 0).length;
  const countEl = document.querySelector('.page-header-right .total-count');
  if (countEl) {
    countEl.textContent = `${completed}/${resources.length} completed`;
  }
}

function sortResourceItems(items, sortBy) {
  const sorted = [...items];
  
  switch (sortBy) {
    case 'newest':
      sorted.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
      break;
    case 'oldest':
      sorted.sort((a, b) => new Date(a.dateAdded) - new Date(b.dateAdded));
      break;
    case 'progress':
      sorted.sort((a, b) => {
        const pctA = calculatePercentage(a.completedUnits, a.totalUnits);
        const pctB = calculatePercentage(b.completedUnits, b.totalUnits);
        return pctB - pctA;
      });
      break;
    case 'name':
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;
  }
  
  return sorted;
}
