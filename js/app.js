/* =============================================================================
   APP.JS — Application Entry Point & Router
   ============================================================================= */

const storage = new StorageService();


/* =============================================================================
   PAGE DEFINITIONS
   ============================================================================= */
const pages = {
  dashboard:  { title: 'Dashboard',        render: renderDashboard,     init: initDashboard },
  vocabulary: { title: 'Vocabulary',        render: renderVocabTracker,  init: initVocabTracker },
  kanji:      { title: 'Kanji',             render: renderKanjiTracker,  init: initKanjiTracker },
  resources:  { title: 'Resources',         render: renderResourceTracker, init: initResourceTracker },
  jlpt:       { title: 'JLPT Progress',     render: renderJLPTProgress,  init: initJLPTProgress },
  analytics:  { title: 'Analytics',         render: renderAnalytics,     init: initAnalytics },
  settings:   { title: 'Settings',          render: renderSettings,      init: initSettings }
};


/* =============================================================================
   ROUTER
   ============================================================================= */

/**
 * Gets the current page name from the URL hash.
 * @returns {string} The current page name
 */
function getCurrentPage() {
  const hash = window.location.hash.substring(1);
  return pages[hash] ? hash : 'dashboard';
}


/**
 * Navigates to a specific page.
 * @param {string} pageName - The page to navigate to (optional, reads from hash if not provided)
 */
function navigateTo(pageName) {
  const page = pageName || getCurrentPage();
  const pageConfig = pages[page];
  
  if (!pageConfig) {
    console.error(`Unknown page: ${page}`);
    return;
  }
  
  const content = document.getElementById('app-content');
  if (!content) return;
  
  content.innerHTML = pageConfig.render(storage);
  
  setTimeout(() => {
    if (pageConfig.init) {
      pageConfig.init(storage);
    }
  }, 0);
  
  document.title = `${pageConfig.title} | Japanese Learning Tracker`;
  updateSidebarActive(page);
  closeMobileSidebar();
  
  const mainContent = document.getElementById('main-content');
  if (mainContent) mainContent.scrollTop = 0;
}


/**
 * Updates the active state of sidebar navigation items.
 * @param {string} currentPage - The current page name
 */
function updateSidebarActive(currentPage) {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  
  const activeItem = document.getElementById(`nav-${currentPage}`);
  if (activeItem) {
    activeItem.classList.add('active');
  }
}


/* =============================================================================
   DARK MODE
   ============================================================================= */

function initDarkMode() {
  const savedTheme = storage.getSetting('theme', 'light');
  document.documentElement.setAttribute('data-theme', savedTheme);
  
  const toggleSwitch = document.getElementById('toggle-switch');
  if (toggleSwitch && savedTheme === 'dark') {
    toggleSwitch.classList.add('active');
  }
  
  updateThemeIcon(savedTheme);
}


/**
 * Toggles between light and dark mode.
 */
function toggleDarkMode() {
  const html = document.documentElement;
  const currentTheme = html.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  html.setAttribute('data-theme', newTheme);
  
  const toggleSwitch = document.getElementById('toggle-switch');
  if (toggleSwitch) {
    toggleSwitch.classList.toggle('active');
  }
  
  storage.setSetting('theme', newTheme);
  updateThemeIcon(newTheme);
}


/**
 * Updates the theme toggle icon (sun/moon).
 * @param {string} theme - The current theme ('light' or 'dark')
 */
function updateThemeIcon(theme) {
  const iconEl = document.getElementById('theme-icon');
  if (!iconEl) return;
  
  if (theme === 'dark') {
    iconEl.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/>
        <line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/>
        <line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
      </svg>
    `;
  } else {
    iconEl.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
      </svg>
    `;
  }
}


/* =============================================================================
   MOBILE SIDEBAR
   ============================================================================= */

function toggleMobileSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  
  sidebar.classList.toggle('mobile-open');
  overlay.classList.toggle('active');
}

function closeMobileSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  
  if (sidebar) sidebar.classList.remove('mobile-open');
  if (overlay) overlay.classList.remove('active');
}


/* =============================================================================
   SEED DEFAULT DATA
   ============================================================================= */

function seedDefaultData() {
  if (!storage.isFirstRun()) return;
  
  DEFAULT_RESOURCES.forEach(resource => {
    storage.create('resources', resource);
  });
  
  const defaultLevels = [
    { level: 'N5', status: 'locked', dateStarted: null, dateCompleted: null },
    { level: 'N4', status: 'locked', dateStarted: null, dateCompleted: null },
    { level: 'N3', status: 'locked', dateStarted: null, dateCompleted: null },
    { level: 'N2', status: 'locked', dateStarted: null, dateCompleted: null },
    { level: 'N1', status: 'locked', dateStarted: null, dateCompleted: null }
  ];
  storage._save('jlptLevels', defaultLevels);
  
  storage.markInitialized();
}


/* =============================================================================
   APPLICATION INITIALIZATION
   ============================================================================= */

document.addEventListener('DOMContentLoaded', () => {
  seedDefaultData();
  initDarkMode();
  
  document.getElementById('theme-toggle')?.addEventListener('click', toggleDarkMode);
  document.getElementById('mobile-menu-btn')?.addEventListener('click', toggleMobileSidebar);
  document.getElementById('sidebar-overlay')?.addEventListener('click', closeMobileSidebar);
  
  window.addEventListener('hashchange', () => {
    navigateTo(getCurrentPage());
  });
  
  if (!window.location.hash) {
    window.location.hash = '#dashboard';
  } else {
    navigateTo(getCurrentPage());
  }
});
