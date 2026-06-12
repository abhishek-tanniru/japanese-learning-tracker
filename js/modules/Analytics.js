/* =============================================================================
   ANALYTICS.JS — Analytics Dashboard Module
   ============================================================================= */

function renderAnalytics(storage) {
  return `
    <div class="page-header">
      <div class="page-header-left">
        <h2>Analytics</h2>
        <p>Visualize your learning progress over time.</p>
      </div>
      <div class="page-header-right">
        <select class="sort-select" id="analytics-range">
          <option value="30">Last 30 Days</option>
          <option value="90">Last 90 Days</option>
          <option value="365" selected>Last Year</option>
          <option value="all">All Time</option>
        </select>
      </div>
    </div>
    
    <div class="page-content fade-in">
      <!-- Summary Stats -->
      <section class="section">
        <div class="stats-grid stagger-children" id="analytics-summary">
          ${renderAnalyticsSummary(storage)}
        </div>
      </section>
      
      <!-- Charts Grid -->
      <section class="section">
        <div class="analytics-grid">
          
          <!-- Vocabulary Growth -->
          <div class="card analytics-chart-card">
            <div class="card-header">
              <h3>📝 Vocabulary Growth</h3>
            </div>
            <div class="card-body">
              <canvas id="vocab-growth-chart" class="analytics-canvas"></canvas>
            </div>
          </div>
          
          <!-- Kanji Growth -->
          <div class="card analytics-chart-card">
            <div class="card-header">
              <h3>🈴 Kanji Growth</h3>
            </div>
            <div class="card-body">
              <canvas id="kanji-growth-chart" class="analytics-canvas"></canvas>
            </div>
          </div>
          
          <!-- Resource Completion -->
          <div class="card analytics-chart-card">
            <div class="card-header">
              <h3>📚 Resource Progress</h3>
            </div>
            <div class="card-body">
              <canvas id="resource-chart" class="analytics-canvas"></canvas>
            </div>
          </div>
          
          <!-- Weekly Activity -->
          <div class="card analytics-chart-card">
            <div class="card-header">
              <h3>📊 Weekly Activity</h3>
            </div>
            <div class="card-body">
              <canvas id="weekly-activity-chart" class="analytics-canvas"></canvas>
            </div>
          </div>
          
        </div>
      </section>
      
      <!-- JLPT Level Distribution -->
      <section class="section">
        <div class="section-header">
          <h3>📊 Vocabulary & Kanji by JLPT Level</h3>
        </div>
        <div class="card">
          <div class="card-body">
            ${renderJLPTDistribution(storage)}
          </div>
        </div>
      </section>
    </div>
  `;
}


function initAnalytics(storage) {
  const rangeSelect = document.getElementById('analytics-range');
  const range = parseInt(rangeSelect?.value || '365', 10);
  
  drawAllCharts(storage, range);
  
  // Re-draw charts when range changes
  rangeSelect?.addEventListener('change', (e) => {
    const newRange = e.target.value === 'all' ? 99999 : parseInt(e.target.value, 10);
    drawAllCharts(storage, newRange);
  });
}


function drawAllCharts(storage, daysRange) {
  // Vocabulary Growth Chart
  const vocabData = buildGrowthData(storage.getAll('vocabulary'), daysRange);
  drawLineChart(document.getElementById('vocab-growth-chart'), {
    labels: vocabData.labels,
    data: vocabData.cumulativeData,
    lineColor: '#2D5A7B',
    fillColor: 'rgba(45, 90, 123, 0.15)',
    title: ''
  });
  
  // Kanji Growth Chart
  const kanjiData = buildGrowthData(storage.getAll('kanji'), daysRange);
  drawLineChart(document.getElementById('kanji-growth-chart'), {
    labels: kanjiData.labels,
    data: kanjiData.cumulativeData,
    lineColor: '#D4654A',
    fillColor: 'rgba(212, 101, 74, 0.15)',
    title: ''
  });
  
  // Resource Progress Chart
  const resources = storage.getAll('resources');
  const resourceLabels = resources.slice(0, 8).map(r => r.name.substring(0, 12));
  const resourceData = resources.slice(0, 8).map(r => calculatePercentage(r.completedUnits, r.totalUnits));
  drawBarChart(document.getElementById('resource-chart'), {
    labels: resourceLabels,
    data: resourceData,
    barColor: '#4A8B6F',
    title: ''
  });
  
  // Weekly Activity Chart
  const weeklyData = buildWeeklyActivity(storage.getAll('activities'), daysRange);
  drawBarChart(document.getElementById('weekly-activity-chart'), {
    labels: weeklyData.labels,
    data: weeklyData.data,
    barColor: '#2D5A7B',
    title: ''
  });
}


function buildGrowthData(items, daysRange) {
  if (items.length === 0) {
    return { labels: [], cumulativeData: [] };
  }
  
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - daysRange);
  
  // Group items by date
  const countsByDate = {};
  items.forEach(item => {
    const date = item.dateAdded ? item.dateAdded.split('T')[0] : null;
    if (date) {
      countsByDate[date] = (countsByDate[date] || 0) + 1;
    }
  });
  
  // Build daily cumulative data
  const labels = [];
  const cumulativeData = [];
  let runningTotal = 0;
  
  // Count items before the start date
  items.forEach(item => {
    const date = item.dateAdded ? new Date(item.dateAdded) : null;
    if (date && date < startDate) {
      runningTotal++;
    }
  });
  
  // Sample data points (don't show every single day for large ranges)
  const sampleInterval = daysRange > 90 ? 7 : daysRange > 30 ? 3 : 1;
  
  const currentDate = new Date(startDate);
  let dayIndex = 0;
  
  while (currentDate <= today) {
    const dateStr = currentDate.toISOString().split('T')[0];
    runningTotal += (countsByDate[dateStr] || 0);
    
    if (dayIndex % sampleInterval === 0 || currentDate.toDateString() === today.toDateString()) {
      labels.push(dateStr);
      cumulativeData.push(runningTotal);
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
    dayIndex++;
  }
  
  return { labels, cumulativeData };
}


function buildWeeklyActivity(activities, daysRange) {
  const weeks = Math.min(Math.ceil(daysRange / 7), 52);
  const labels = [];
  const data = [];
  
  const today = new Date();
  
  for (let w = weeks - 1; w >= 0; w--) {
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() - (w * 7));
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 6);
    
    const weekStartStr = weekStart.toISOString().split('T')[0];
    const weekEndStr = weekEnd.toISOString().split('T')[0];
    
    // Count activities in this week
    const count = activities.filter(a => {
      return a.date >= weekStartStr && a.date <= weekEndStr;
    }).length;
    
    // Label format: "Jun 1"
    const label = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    labels.push(label);
    data.push(count);
  }
  
  return { labels, data };
}


function renderAnalyticsSummary(storage) {
  const streakData = storage.getStreakData();
  const activities = storage.getAll('activities');
  
  // This month's activities
  const now = new Date();
  const thisMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const thisMonthActivities = activities.filter(a => a.date && a.date.startsWith(thisMonthStr)).length;
  
  // This week's activities
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString().split('T')[0];
  const thisWeekActivities = activities.filter(a => a.date && a.date >= weekAgoStr).length;
  
  return `
    <div class="stat-card">
      <div class="stat-card-header">
        <span class="stat-card-label">This Week</span>
        <div class="stat-card-icon" style="background-color: var(--primary-bg); color: var(--primary);">📊</div>
      </div>
      <div class="stat-card-value">${thisWeekActivities}</div>
      <div class="stat-card-footer">Activities</div>
    </div>
    
    <div class="stat-card">
      <div class="stat-card-header">
        <span class="stat-card-label">This Month</span>
        <div class="stat-card-icon" style="background-color: var(--success-bg); color: var(--success);">📅</div>
      </div>
      <div class="stat-card-value">${thisMonthActivities}</div>
      <div class="stat-card-footer">Activities</div>
    </div>
    
    <div class="stat-card">
      <div class="stat-card-header">
        <span class="stat-card-label">Total Study Days</span>
        <div class="stat-card-icon" style="background-color: var(--warning-bg); color: var(--warning);">🔥</div>
      </div>
      <div class="stat-card-value">${streakData.totalStudyDays}</div>
      <div class="stat-card-footer">Days studied</div>
    </div>
    
    <div class="stat-card">
      <div class="stat-card-header">
        <span class="stat-card-label">Best Streak</span>
        <div class="stat-card-icon" style="background-color: var(--accent-bg); color: var(--accent);">🏆</div>
      </div>
      <div class="stat-card-value">${streakData.longestStreak}</div>
      <div class="stat-card-footer">Consecutive days</div>
    </div>
  `;
}


function renderJLPTDistribution(storage) {
  const allVocab = storage.getAll('vocabulary');
  const allKanji = storage.getAll('kanji');
  
  const levelsHTML = JLPT_LEVELS.map(level => {
    const vocabCount = allVocab.filter(v => v.jlptLevel === level).length;
    const kanjiCount = allKanji.filter(k => k.jlptLevel === level).length;
    const info = JLPT_DESCRIPTIONS[level];
    const vocabPct = calculatePercentage(vocabCount, info.vocabTarget);
    const kanjiPct = calculatePercentage(kanjiCount, info.kanjiTarget);
    
    return `
      <div class="jlpt-dist-row">
        <div class="jlpt-dist-label">
          <span class="badge badge-${level.toLowerCase()}">${level}</span>
        </div>
        <div class="jlpt-dist-bars">
          <div class="jlpt-dist-bar-group">
            <span class="jlpt-dist-bar-label">Vocab: ${vocabCount}/${formatNumber(info.vocabTarget)}</span>
            <div class="progress-bar progress-bar-sm">
              <div class="progress-bar-fill ${vocabPct >= 100 ? 'completed' : ''}" 
                   style="width: ${Math.min(vocabPct, 100)}%"></div>
            </div>
          </div>
          <div class="jlpt-dist-bar-group">
            <span class="jlpt-dist-bar-label">Kanji: ${kanjiCount}/${formatNumber(info.kanjiTarget)}</span>
            <div class="progress-bar progress-bar-sm">
              <div class="progress-bar-fill ${kanjiPct >= 100 ? 'completed' : ''}" 
                   style="width: ${Math.min(kanjiPct, 100)}%; background: linear-gradient(90deg, var(--accent), var(--accent-light));"></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  if (allVocab.length === 0 && allKanji.length === 0) {
    return `
      <div class="empty-state" style="padding: var(--space-8);">
        <div class="empty-state-icon">📊</div>
        <h3>No Data Yet</h3>
        <p>Add vocabulary and kanji to see distribution by JLPT level.</p>
      </div>
    `;
  }
  
  return `<div class="jlpt-distribution">${levelsHTML}</div>`;
}
