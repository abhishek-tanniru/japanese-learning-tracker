/* =============================================================================
   HELPERS.JS — Utility Functions
   ============================================================================= */

function generateId(prefix = 'item') {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${random}`;
}


/* =============================================================================
   Date Formatting
   ============================================================================= */

function formatDate(date, options = {}) {
  if (!date) return 'N/A';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj.getTime())) return 'Invalid Date';
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  };
  
  return dateObj.toLocaleDateString('en-US', defaultOptions);
}

function formatRelativeTime(date) {
  if (!date) return 'N/A';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj.getTime())) return 'Invalid Date';
  
  const now = new Date();
  const diffInSeconds = Math.floor((now - dateObj) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  }
  
  return formatDate(dateObj);
}

function getTodayDateString() {
  return new Date().toISOString().split('T')[0];
}

function getYesterdayDateString() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
}


/* =============================================================================
   Debounce
   ============================================================================= */

function debounce(func, delay = 300) {
  let timeoutId;
  
  return function (...args) {
    clearTimeout(timeoutId);
    
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}


/* =============================================================================
   Toast Notifications
   ============================================================================= */

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  
  const icons = {
    success: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4 12 14.01l-3-3"/></svg>`,
    error: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
    warning: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    info: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`
  };
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span class="toast-message">${escapeHTML(message)}</span>
    <button class="toast-close" onclick="this.closest('.toast').remove()">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
  `;
  
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('toast-leaving');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}


/* =============================================================================
   Modal Management
   ============================================================================= */

function openModal(title, bodyHTML, options = {}) {
  const backdrop = document.getElementById('modal-backdrop');
  if (!backdrop) return;
  
  const { footerHTML = '', onClose = null } = options;
  
  backdrop.innerHTML = `
    <div class="modal-container slide-up">
      <div class="modal-header">
        <h3>${escapeHTML(title)}</h3>
        <button class="modal-close" id="modal-close-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div class="modal-body">${bodyHTML}</div>
      ${footerHTML ? `<div class="modal-footer">${footerHTML}</div>` : ''}
    </div>
  `;
  
  backdrop.classList.add('active');
  
  const closeModal = () => {
    backdrop.classList.remove('active');
    if (onClose) onClose();
  };
  
  document.getElementById('modal-close-btn').addEventListener('click', closeModal);
  
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeModal();
  });
  
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);
}

function closeModal() {
  const backdrop = document.getElementById('modal-backdrop');
  if (backdrop) {
    backdrop.classList.remove('active');
  }
}


/* =============================================================================
   HTML Escaping (XSS Prevention)
   ============================================================================= */

function escapeHTML(str) {
  if (typeof str !== 'string') return '';
  
  const escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  
  return str.replace(/[&<>"']/g, (char) => escapeMap[char]);
}

/* =============================================================================
   Number Formatting
   ============================================================================= */

function formatNumber(num) {
  if (typeof num !== 'number' || isNaN(num)) return '0';
  return num.toLocaleString('en-US');
}

function calculatePercentage(value, total) {
  if (!total || total === 0) return 0;
  return Math.round((value / total) * 100);
}


/* =============================================================================
   Confirmation Dialog
   ============================================================================= */

function showConfirmDialog(title, message, onConfirm, confirmText = 'Delete') {
  const bodyHTML = `
    <div class="confirm-dialog">
      <p>${escapeHTML(message)}</p>
      <div class="confirm-dialog-actions">
        <button class="btn btn-secondary" id="confirm-cancel-btn">Cancel</button>
        <button class="btn btn-danger" id="confirm-action-btn">${escapeHTML(confirmText)}</button>
      </div>
    </div>
  `;
  
  openModal(title, bodyHTML);
  
  setTimeout(() => {
    document.getElementById('confirm-cancel-btn')?.addEventListener('click', closeModal);
    document.getElementById('confirm-action-btn')?.addEventListener('click', () => {
      closeModal();
      onConfirm();
    });
  }, 0);
}
