/* =============================================================================
   SETTINGS.JS — Data Management & Settings Module
   ============================================================================= */

function renderSettings(storage) {
  // Calculate storage usage
  const storageInfo = getStorageUsage();
  
  return `
    <div class="page-header">
      <div class="page-header-left">
        <h2>Settings</h2>
        <p>Manage your data and application preferences.</p>
      </div>
    </div>
    
    <div class="page-content fade-in">
      
      <!-- Data Overview -->
      <section class="section">
        <div class="section-header">
          <h3>📊 Data Overview</h3>
        </div>
        <div class="card">
          <div class="card-body">
            <div class="settings-data-overview">
              ${renderDataOverview(storage)}
            </div>
          </div>
        </div>
      </section>
      
      <!-- Export Data -->
      <section class="section">
        <div class="section-header">
          <h3>📤 Export Data</h3>
        </div>
        <div class="card">
          <div class="card-body">
            <p style="margin-bottom: var(--space-4); color: var(--text-secondary);">
              Download all your data as a JSON file. You can use this as a backup or to transfer your data to another device.
            </p>
            <button class="btn btn-primary" id="export-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Export All Data
            </button>
          </div>
        </div>
      </section>
      
      <!-- Import Data -->
      <section class="section">
        <div class="section-header">
          <h3>📥 Import Data</h3>
        </div>
        <div class="card">
          <div class="card-body">
            <p style="margin-bottom: var(--space-4); color: var(--text-secondary);">
              Import data from a previously exported JSON file. This will <strong>replace</strong> all current data.
            </p>
            <div class="import-area" id="import-area">
              <input type="file" id="import-file-input" accept=".json" class="hidden">
              <button class="btn btn-secondary" id="import-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                Choose JSON File
              </button>
              <span class="import-hint" style="margin-left: var(--space-3); font-size: var(--text-sm); color: var(--text-tertiary);">
                Select a .json file exported from this app
              </span>
            </div>
          </div>
        </div>
      </section>
      
      <!-- Reset Data -->
      <section class="section">
        <div class="section-header">
          <h3>🗑️ Reset Data</h3>
        </div>
        <div class="card" style="border-color: var(--danger);">
          <div class="card-body">
            <p style="margin-bottom: var(--space-4); color: var(--text-secondary);">
              Permanently delete all your data. This action <strong>cannot be undone</strong>. 
              Consider exporting your data first.
            </p>
            <button class="btn btn-danger" id="reset-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
              Reset All Data
            </button>
          </div>
        </div>
      </section>
      
      <!-- App Info -->
      <section class="section">
        <div class="section-header">
          <h3>ℹ️ About</h3>
        </div>
        <div class="card">
          <div class="card-body">
            <div class="settings-about">
              <div class="settings-about-row">
                <span class="settings-about-label">Application</span>
                <span>Japanese Learning Tracker</span>
              </div>
              <div class="settings-about-row">
                <span class="settings-about-label">Version</span>
                <span>1.0.0</span>
              </div>
              <div class="settings-about-row">
                <span class="settings-about-label">Storage</span>
                <span>LocalStorage (${storageInfo})</span>
              </div>
              <div class="settings-about-row">
                <span class="settings-about-label">Architecture</span>
                <span>UI → Logic → StorageService → LocalStorage</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      
    </div>
  `;
}


function initSettings(storage) {
  document.getElementById('export-btn')?.addEventListener('click', () => {
    exportData(storage);
  });
  
  document.getElementById('import-btn')?.addEventListener('click', () => {
    document.getElementById('import-file-input')?.click();
  });
  
  document.getElementById('import-file-input')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      importData(storage, file);
    }
  });
  
  document.getElementById('reset-btn')?.addEventListener('click', () => {
    resetData(storage);
  });
}


/* =============================================================================
   EXPORT
   ============================================================================= */

function exportData(storage) {
  try {
    const data = storage.exportAll();
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `japanese-learning-tracker-backup-${getTodayDateString()}.json`;
    
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    storage.logActivity('data_exported', 'Exported all data as JSON');
    showToast('Data exported successfully!', 'success');
  } catch (error) {
    console.error('Export failed:', error);
    showToast('Failed to export data. Please try again.', 'error');
  }
}


/* =============================================================================
   IMPORT
   ============================================================================= */

function importData(storage, file) {
  const reader = new FileReader();
  
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      const validation = validateImportData(data);
      
      if (!validation.valid) {
        showToast(`Import failed: ${validation.errors[0]}`, 'error');
        return;
      }
      
      if (validation.warnings.length > 0) {
        console.warn('Import warnings:', validation.warnings);
      }
      
      const previewHTML = `
        <p style="margin-bottom: var(--space-4);">
          This will <strong>replace all current data</strong> with the imported data:
        </p>
        <div class="import-preview">
          <div class="import-preview-row">
            <span>📝 Vocabulary</span>
            <span>${(data.vocabulary || []).length} items</span>
          </div>
          <div class="import-preview-row">
            <span>🈴 Kanji</span>
            <span>${(data.kanji || []).length} items</span>
          </div>
          <div class="import-preview-row">
            <span>📚 Resources</span>
            <span>${(data.resources || []).length} items</span>
          </div>
          <div class="import-preview-row">
            <span>📋 Activities</span>
            <span>${(data.activities || []).length} items</span>
          </div>
          ${data.exportDate ? `
            <div class="import-preview-row" style="margin-top: var(--space-2); font-size: var(--text-xs); color: var(--text-tertiary);">
              <span>Export date</span>
              <span>${formatDate(data.exportDate)}</span>
            </div>
          ` : ''}
        </div>
        ${validation.warnings.length > 0 ? `
          <div style="margin-top: var(--space-4); padding: var(--space-3); background: var(--warning-bg); border-radius: var(--radius-md); font-size: var(--text-sm); color: var(--warning);">
            ⚠️ ${validation.warnings.join(' ')}
          </div>
        ` : ''}
      `;
      
      const footerHTML = `
        <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" id="confirm-import-btn">Import Data</button>
      `;
      
      openModal('Confirm Import', previewHTML, { footerHTML });
      
      setTimeout(() => {
        document.getElementById('confirm-import-btn')?.addEventListener('click', () => {
          storage.importAll(data);
          storage.logActivity('data_imported', 'Imported data from JSON file');
          showToast('Data imported successfully!', 'success');
          closeModal();
          
          window.location.hash = '#settings';
          navigateTo('settings');
        });
      }, 50);
      
    } catch (error) {
      console.error('Import parse error:', error);
      showToast('Invalid JSON file. Please check the file format.', 'error');
    }
  };
  
  reader.onerror = () => {
    showToast('Failed to read file. Please try again.', 'error');
  };
  
  reader.readAsText(file);
}


/* =============================================================================
   RESET
   ============================================================================= */

function resetData(storage) {
  showConfirmDialog(
    '⚠️ Reset All Data',
    'This will permanently delete ALL your vocabulary, kanji, resources, progress, and activity data. This action cannot be undone. Are you sure?',
    () => {
      const bodyHTML = `
        <div style="text-align: center;">
          <p style="margin-bottom: var(--space-4); color: var(--danger); font-weight: var(--font-semibold);">
            This is your final warning!
          </p>
          <p style="margin-bottom: var(--space-4); color: var(--text-secondary);">
            Type <strong>RESET</strong> below to confirm:
          </p>
          <input type="text" class="form-input" id="reset-confirm-input" 
                 placeholder="Type RESET" style="text-align: center; text-transform: uppercase;">
        </div>
      `;
      
      const footerHTML = `
        <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button class="btn btn-danger" id="reset-confirm-btn" disabled>Delete Everything</button>
      `;
      
      openModal('Final Confirmation', bodyHTML, { footerHTML });
      
      setTimeout(() => {
        const input = document.getElementById('reset-confirm-input');
        const btn = document.getElementById('reset-confirm-btn');
        
        input?.addEventListener('input', () => {
          const value = input.value.trim().toUpperCase();
          btn.disabled = value !== 'RESET';
        });
        
        btn?.addEventListener('click', () => {
          storage.resetAll();
          showToast('All data has been reset.', 'info');
          closeModal();
          
          localStorage.removeItem('jlt_initialized');
          window.location.reload();
        });
        
        input?.focus();
      }, 50);
    },
    'Continue'
  );
}


/* =============================================================================
   HELPERS
   ============================================================================= */

function renderDataOverview(storage) {
  const vocabCount = storage.count('vocabulary');
  const kanjiCount = storage.count('kanji');
  const resourceCount = storage.count('resources');
  const activityCount = storage.count('activities');
  const streakData = storage.getStreakData();
  
  return `
    <div class="settings-overview-grid">
      <div class="settings-overview-item">
        <span class="settings-overview-icon">📝</span>
        <div>
          <div class="settings-overview-value">${formatNumber(vocabCount)}</div>
          <div class="settings-overview-label">Vocabulary</div>
        </div>
      </div>
      <div class="settings-overview-item">
        <span class="settings-overview-icon">🈴</span>
        <div>
          <div class="settings-overview-value">${formatNumber(kanjiCount)}</div>
          <div class="settings-overview-label">Kanji</div>
        </div>
      </div>
      <div class="settings-overview-item">
        <span class="settings-overview-icon">📚</span>
        <div>
          <div class="settings-overview-value">${formatNumber(resourceCount)}</div>
          <div class="settings-overview-label">Resources</div>
        </div>
      </div>
      <div class="settings-overview-item">
        <span class="settings-overview-icon">📋</span>
        <div>
          <div class="settings-overview-value">${formatNumber(activityCount)}</div>
          <div class="settings-overview-label">Activities</div>
        </div>
      </div>
      <div class="settings-overview-item">
        <span class="settings-overview-icon">🔥</span>
        <div>
          <div class="settings-overview-value">${streakData.currentStreak}</div>
          <div class="settings-overview-label">Current Streak</div>
        </div>
      </div>
      <div class="settings-overview-item">
        <span class="settings-overview-icon">📅</span>
        <div>
          <div class="settings-overview-value">${streakData.totalStudyDays}</div>
          <div class="settings-overview-label">Study Days</div>
        </div>
      </div>
    </div>
  `;
}

function getStorageUsage() {
  try {
    let totalBytes = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key) && key.startsWith('jlt_')) {
        totalBytes += (localStorage[key].length + key.length) * 2;
      }
    }
    
    if (totalBytes < 1024) return `${totalBytes} B`;
    if (totalBytes < 1024 * 1024) return `${(totalBytes / 1024).toFixed(1)} KB`;
    return `${(totalBytes / (1024 * 1024)).toFixed(2)} MB`;
  } catch (e) {
    return 'Unknown';
  }
}
