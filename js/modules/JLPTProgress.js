/* =============================================================================
   JLPT PROGRESS.JS — JLPT Level Tracking Module
   ============================================================================= */

function renderJLPTProgress(storage) {
  const levels = storage.getJLPTLevels();
  const allVocab = storage.getAll('vocabulary');
  const allKanji = storage.getAll('kanji');
  
  // Count vocab and kanji per JLPT level
  const vocabByLevel = {};
  const kanjiByLevel = {};
  
  JLPT_LEVELS.forEach(level => {
    vocabByLevel[level] = allVocab.filter(v => v.jlptLevel === level).length;
    kanjiByLevel[level] = allKanji.filter(k => k.jlptLevel === level).length;
  });
  
  // Build the level cards
  const levelCardsHTML = levels.map((levelData, index) => {
    const info = JLPT_DESCRIPTIONS[levelData.level];
    const vocabCount = vocabByLevel[levelData.level] || 0;
    const kanjiCount = kanjiByLevel[levelData.level] || 0;
    const vocabProgress = calculatePercentage(vocabCount, info.vocabTarget);
    const kanjiProgress = calculatePercentage(kanjiCount, info.kanjiTarget);
    
    // Status-specific styling
    let statusClass = '';
    let statusIcon = '';
    let statusLabel = '';
    
    switch (levelData.status) {
      case 'completed':
        statusClass = 'jlpt-completed';
        statusIcon = '✅';
        statusLabel = 'Completed';
        break;
      case 'in_progress':
        statusClass = 'jlpt-in-progress';
        statusIcon = '📖';
        statusLabel = 'In Progress';
        break;
      default: // locked
        statusClass = 'jlpt-locked';
        statusIcon = '🔒';
        statusLabel = 'Locked';
    }
    
    return `
      ${index > 0 ? '<div class="jlpt-connector"><div class="jlpt-connector-line"></div></div>' : ''}
      <div class="jlpt-card ${statusClass}" data-level="${levelData.level}">
        <div class="jlpt-card-left">
          <div class="jlpt-level-badge jlpt-badge-${levelData.level.toLowerCase()}">
            <span class="jlpt-level-number">${levelData.level}</span>
          </div>
        </div>
        
        <div class="jlpt-card-center">
          <div class="jlpt-card-header">
            <h3 class="jlpt-card-title">${info.title}</h3>
            <span class="badge badge-${levelData.status === 'completed' ? 'completed' : levelData.status === 'in_progress' ? 'in-progress' : 'locked'}">
              ${statusIcon} ${statusLabel}
            </span>
          </div>
          <p class="jlpt-card-description">${info.description}</p>
          
          <div class="jlpt-card-stats">
            <div class="jlpt-stat">
              <div class="jlpt-stat-header">
                <span>Vocabulary</span>
                <span>${vocabCount} / ${formatNumber(info.vocabTarget)}</span>
              </div>
              <div class="progress-bar progress-bar-sm">
                <div class="progress-bar-fill ${vocabProgress >= 100 ? 'completed' : ''}" 
                     style="width: ${Math.min(vocabProgress, 100)}%"></div>
              </div>
            </div>
            
            <div class="jlpt-stat">
              <div class="jlpt-stat-header">
                <span>Kanji</span>
                <span>${kanjiCount} / ${formatNumber(info.kanjiTarget)}</span>
              </div>
              <div class="progress-bar progress-bar-sm">
                <div class="progress-bar-fill ${kanjiProgress >= 100 ? 'completed' : ''}" 
                     style="width: ${Math.min(kanjiProgress, 100)}%"></div>
              </div>
            </div>
          </div>
          
          ${levelData.dateStarted ? `
            <div class="jlpt-card-dates">
              ${levelData.dateStarted ? `<span>Started: ${formatDate(levelData.dateStarted)}</span>` : ''}
              ${levelData.dateCompleted ? `<span>Completed: ${formatDate(levelData.dateCompleted)}</span>` : ''}
            </div>
          ` : ''}
        </div>
        
        <div class="jlpt-card-right">
          <button class="btn btn-sm btn-secondary jlpt-status-btn" data-level="${levelData.level}" 
                  title="Click to change status">
            Change Status
          </button>
        </div>
      </div>
    `;
  }).join('');
  
  return `
    <div class="page-header">
      <div class="page-header-left">
        <h2>JLPT Progress</h2>
        <p>Track your journey through the JLPT levels.</p>
      </div>
    </div>
    
    <div class="page-content fade-in">
      <section class="section">
        <div class="jlpt-roadmap">
          ${levelCardsHTML}
        </div>
      </section>
    </div>
  `;
}


function initJLPTProgress(storage) {
  document.querySelector('.jlpt-roadmap')?.addEventListener('click', (e) => {
    const statusBtn = e.target.closest('.jlpt-status-btn');
    if (!statusBtn) return;
    
    const level = statusBtn.dataset.level;
    showJLPTStatusModal(level);
  });
}

function showJLPTStatusModal(level) {
  const levels = storage.getJLPTLevels();
  const levelData = levels.find(l => l.level === level);
  if (!levelData) return;
  
  const bodyHTML = `
    <div style="text-align: center; margin-bottom: var(--space-6);">
      <div class="jlpt-level-badge jlpt-badge-${level.toLowerCase()}" style="width: 64px; height: 64px; font-size: var(--text-xl); margin: 0 auto var(--space-4);">
        <span class="jlpt-level-number">${level}</span>
      </div>
      <p style="color: var(--text-secondary);">Select the new status for ${level}:</p>
    </div>
    
    <div class="jlpt-status-options">
      <button class="jlpt-status-option ${levelData.status === 'locked' ? 'active' : ''}" data-status="locked">
        <span>🔒</span>
        <span>Locked</span>
      </button>
      <button class="jlpt-status-option ${levelData.status === 'in_progress' ? 'active' : ''}" data-status="in_progress">
        <span>📖</span>
        <span>In Progress</span>
      </button>
      <button class="jlpt-status-option ${levelData.status === 'completed' ? 'active' : ''}" data-status="completed">
        <span>✅</span>
        <span>Completed</span>
      </button>
    </div>
  `;
  
  openModal(`${level} Status`, bodyHTML);
  
  setTimeout(() => {
    document.querySelectorAll('.jlpt-status-option').forEach(btn => {
      btn.addEventListener('click', () => {
        const newStatus = btn.dataset.status;
        storage.updateJLPTLevel(level, newStatus);
        storage.logActivity('jlpt_updated', `Updated ${level} status to ${newStatus.replace('_', ' ')}`);
        showToast(`${level} status updated to ${newStatus.replace('_', ' ')}!`, 'success');
        closeModal();
        
        // Re-render the page
        const content = document.getElementById('app-content');
        if (content) {
          content.innerHTML = renderJLPTProgress(storage);
          setTimeout(() => initJLPTProgress(storage), 0);
        }
      });
    });
  }, 50);
}
