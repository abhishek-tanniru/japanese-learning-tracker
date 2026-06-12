/* =============================================================================
   HEATMAP.JS — GitHub-Style Contribution Calendar
   ============================================================================= */

function renderHeatmap(container, activityCounts) {
  if (!container) return;
  
  // Calculate date range: past 365 days
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 364); // 365 days including today
  
  // Adjust start date to the nearest Sunday (start of week)
  const dayOfWeek = startDate.getDay();
  startDate.setDate(startDate.getDate() - dayOfWeek);
  
  // Build the grid data
  const weeks = [];
  const currentDate = new Date(startDate);
  let currentWeek = [];
  
  while (currentDate <= today) {
    const dateStr = formatDateISO(currentDate);
    const count = activityCounts[dateStr] || 0;
    const level = getIntensityLevel(count);
    
    currentWeek.push({
      date: dateStr,
      count,
      level,
      dayOfWeek: currentDate.getDay()
    });
    
    // Start new week on Sunday
    if (currentDate.getDay() === 6) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Push the last partial week
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }
  
  // Generate month labels
  const monthLabels = generateMonthLabels(startDate, weeks);
  
  // Calculate total activities
  const totalActivities = Object.values(activityCounts).reduce((sum, count) => sum + count, 0);
  const activeDays = Object.keys(activityCounts).length;
  
  // Build HTML
  const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', ''];
  
  let html = `
    <div class="heatmap-wrapper">
      <div class="heatmap-stats">
        <span class="heatmap-stat">${totalActivities} activities in the last year</span>
        <span class="heatmap-stat">${activeDays} active days</span>
      </div>
      
      <div class="heatmap-container">
        <!-- Month labels -->
        <div class="heatmap-months">
          <div class="heatmap-day-label-spacer"></div>
          ${monthLabels.map(m => `
            <div class="heatmap-month-label" style="grid-column: span ${m.span};">${m.name}</div>
          `).join('')}
        </div>
        
        <!-- Heatmap grid with day labels -->
        <div class="heatmap-grid-wrapper">
          <!-- Day of week labels -->
          <div class="heatmap-day-labels">
            ${dayLabels.map(label => `
              <div class="heatmap-day-label">${label}</div>
            `).join('')}
          </div>
          
          <!-- The actual grid -->
          <div class="heatmap-grid">
            ${weeks.map(week => `
              <div class="heatmap-week">
                ${Array.from({ length: 7 }, (_, dayIndex) => {
                  const day = week.find(d => d.dayOfWeek === dayIndex);
                  if (day) {
                    return `
                      <div class="heatmap-cell heatmap-level-${day.level}" 
                           data-date="${day.date}" 
                           data-count="${day.count}"
                           title="${day.date}: ${day.count} activit${day.count === 1 ? 'y' : 'ies'}">
                      </div>
                    `;
                  }
                  return `<div class="heatmap-cell heatmap-empty-cell"></div>`;
                }).join('')}
              </div>
            `).join('')}
          </div>
        </div>
      </div>
      
      <!-- Legend -->
      <div class="heatmap-legend">
        <span class="heatmap-legend-label">Less</span>
        <div class="heatmap-cell heatmap-level-0" title="No activity"></div>
        <div class="heatmap-cell heatmap-level-1" title="1-2 activities"></div>
        <div class="heatmap-cell heatmap-level-2" title="3-5 activities"></div>
        <div class="heatmap-cell heatmap-level-3" title="6-9 activities"></div>
        <div class="heatmap-cell heatmap-level-4" title="10+ activities"></div>
        <span class="heatmap-legend-label">More</span>
      </div>
    </div>
  `;
  
  container.innerHTML = html;
}


/* =============================================================================
   HELPER FUNCTIONS
   ============================================================================= */

function getIntensityLevel(count) {
  if (count === 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 9) return 3;
  return 4;
}

function formatDateISO(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function generateMonthLabels(startDate, weeks) {
  const months = [];
  let currentMonth = -1;
  
  weeks.forEach((week) => {
    // Use the first day of each week to determine the month
    const firstDay = week[0];
    if (!firstDay) return;
    
    const date = new Date(firstDay.date);
    const month = date.getMonth();
    
    if (month !== currentMonth) {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      months.push({ name: monthNames[month], span: 1 });
      currentMonth = month;
    } else {
      months[months.length - 1].span += 1;
    }
  });
  
  return months;
}
