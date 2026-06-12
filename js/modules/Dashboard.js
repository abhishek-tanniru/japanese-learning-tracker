/* =============================================================================
   DASHBOARD.JS — Dashboard Page Module
   ============================================================================= */

function renderDashboard(storage) {
  const vocabCount = storage.count('vocabulary');
  const kanjiCount = storage.count('kanji');
  const resources = storage.getAll('resources');
  const streakData = storage.getStreakData();
  const jlptLevels = storage.getJLPTLevels();
  const recentActivities = storage.getRecentActivities(8);
  
  const activeResources = resources.filter(r => {
    const pct = calculatePercentage(r.completedUnits, r.totalUnits);
    return pct > 0 && pct < 100;
  }).length;
  
  const completedResources = resources.filter(r => 
    r.completedUnits >= r.totalUnits && r.totalUnits > 0
  ).length;
  
  const currentJLPT = getCurrentJLPTLevel(jlptLevels);
  
  return `
    <div class="page-header">
      <div class="page-header-left">
        <h2>Dashboard</h2>
        <p>Welcome back! Here's your learning overview.</p>
      </div>
      <div class="page-header-right">
        <span class="total-count">📅 ${formatDate(new Date())}</span>
      </div>
    </div>
    
    <div class="page-content fade-in">
      
      <section class="section">
        <div class="stats-grid stagger-children">
          
          <div class="stat-card" id="stat-vocab">
            <div class="stat-card-header">
              <span class="stat-card-label">Total Vocabulary</span>
              <div class="stat-card-icon" style="background-color: var(--primary-bg); color: var(--primary);">📝</div>
            </div>
            <div class="stat-card-value">${formatNumber(vocabCount)}</div>
            <div class="stat-card-footer">Words learned</div>
          </div>
          
          <div class="stat-card" id="stat-kanji">
            <div class="stat-card-header">
              <span class="stat-card-label">Total Kanji</span>
              <div class="stat-card-icon" style="background-color: var(--accent-bg); color: var(--accent);">🈴</div>
            </div>
            <div class="stat-card-value">${formatNumber(kanjiCount)}</div>
            <div class="stat-card-footer">Characters learned</div>
          </div>
          
          <div class="stat-card" id="stat-active-resources">
            <div class="stat-card-header">
              <span class="stat-card-label">Active Resources</span>
              <div class="stat-card-icon" style="background-color: var(--warning-bg); color: var(--warning);">📚</div>
            </div>
            <div class="stat-card-value">${formatNumber(activeResources)}</div>
            <div class="stat-card-footer">In progress</div>
          </div>
          
          <div class="stat-card" id="stat-completed-resources">
            <div class="stat-card-header">
              <span class="stat-card-label">Completed</span>
              <div class="stat-card-icon" style="background-color: var(--success-bg); color: var(--success);">✅</div>
            </div>
            <div class="stat-card-value">${formatNumber(completedResources)}</div>
            <div class="stat-card-footer">Resources finished</div>
          </div>
          
          <div class="stat-card" id="stat-streak">
            <div class="stat-card-header">
              <span class="stat-card-label">Study Streak</span>
              <div class="stat-card-icon" style="background-color: var(--danger-bg); color: var(--danger);">🔥</div>
            </div>
            <div class="stat-card-value">${formatNumber(streakData.currentStreak)}</div>
            <div class="stat-card-footer">
              Best: ${streakData.longestStreak} days · Total: ${streakData.totalStudyDays} days
            </div>
          </div>
          
          <div class="stat-card" id="stat-jlpt">
            <div class="stat-card-header">
              <span class="stat-card-label">JLPT Level</span>
              <div class="stat-card-icon" style="background-color: var(--primary-bg); color: var(--primary);">🎯</div>
            </div>
            <div class="stat-card-value">${currentJLPT}</div>
            <div class="stat-card-footer">Current level</div>
          </div>
          
        </div>
      </section>
      
      
      <section class="section">
        <div class="section-header">
          <h3>📊 Study Activity</h3>
        </div>
        <div class="card">
          <div class="card-body">
            <div id="heatmap-container"></div>
          </div>
        </div>
      </section>
      
      
      <section class="section">
        <div class="section-header">
          <h3>🕐 Recent Activity</h3>
        </div>
        <div class="card">
          <div class="card-body">
            ${renderRecentActivity(recentActivities)}
          </div>
        </div>
      </section>
      
    </div>
  `;
}


function initDashboard(storage) {
  const heatmapContainer = document.getElementById('heatmap-container');
  if (heatmapContainer) {
    const activityCounts = storage.getActivityCounts();
    renderHeatmap(heatmapContainer, activityCounts);
  }
}

/* =============================================================================
   HELPER FUNCTIONS
   ============================================================================= */

function getCurrentJLPTLevel(levels) {
  const inProgress = levels.find(l => l.status === 'in_progress');
  if (inProgress) return inProgress.level;
  
  const completed = levels
    .filter(l => l.status === 'completed')
    .sort((a, b) => {
      const order = { N1: 5, N2: 4, N3: 3, N4: 2, N5: 1 };
      return order[b.level] - order[a.level];
    });
  
  if (completed.length > 0) return completed[0].level;
  
  return 'N/A';
}

function renderRecentActivity(activities) {
  if (activities.length === 0) {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">📭</div>
        <h3>No Activity Yet</h3>
        <p>Start adding vocabulary, kanji, or updating resources to see your activity here.</p>
      </div>
    `;
  }
  
  const activityItems = activities.map(activity => {
    const typeInfo = ACTIVITY_TYPES[activity.type] || { 
      label: 'Activity', icon: '📋', color: 'var(--text-secondary)' 
    };
    
    return `
      <div class="activity-item">
        <div class="activity-icon" style="color: ${typeInfo.color}">
          ${typeInfo.icon}
        </div>
        <div class="activity-content">
          <span class="activity-text">${escapeHTML(activity.description)}</span>
          <span class="activity-time">${formatRelativeTime(activity.timestamp)}</span>
        </div>
      </div>
    `;
  }).join('');
  
  return `<div class="activity-list">${activityItems}</div>`;
}
