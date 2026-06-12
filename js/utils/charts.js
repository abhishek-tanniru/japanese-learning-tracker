/* =============================================================================
   CHARTS.JS — Lightweight Canvas-Based Charting
   ============================================================================= */

function drawLineChart(canvas, config) {
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  
  const displayWidth = canvas.offsetWidth;
  const displayHeight = canvas.offsetHeight;
  
  canvas.width = displayWidth * dpr;
  canvas.height = displayHeight * dpr;
  ctx.scale(dpr, dpr);
  
  const { labels = [], data = [], lineColor = '#2D5A7B', fillColor = 'rgba(45, 90, 123, 0.1)', title = '' } = config;
  
  if (data.length === 0) {
    drawEmptyChart(ctx, displayWidth, displayHeight, 'No data yet');
    return;
  }
  
  const padding = { top: 30, right: 20, bottom: 40, left: 50 };
  const chartWidth = displayWidth - padding.left - padding.right;
  const chartHeight = displayHeight - padding.top - padding.bottom;
  
  const maxValue = Math.max(...data, 1);
  const minValue = 0;
  const valueRange = maxValue - minValue;
  
  ctx.clearRect(0, 0, displayWidth, displayHeight);
  
  const style = getComputedStyle(document.documentElement);
  const textColor = style.getPropertyValue('--text-secondary').trim() || '#6B6B80';
  const gridColor = style.getPropertyValue('--border-light').trim() || '#EDEBE7';
  
  if (title) {
    ctx.font = `600 14px Inter, sans-serif`;
    ctx.fillStyle = style.getPropertyValue('--text-primary').trim() || '#2C2C3A';
    ctx.textAlign = 'left';
    ctx.fillText(title, padding.left, 18);
  }
  
  const gridLines = 5;
  ctx.font = `11px Inter, sans-serif`;
  ctx.fillStyle = textColor;
  ctx.textAlign = 'right';
  
  for (let i = 0; i <= gridLines; i++) {
    const y = padding.top + (chartHeight * i / gridLines);
    const value = Math.round(maxValue - (valueRange * i / gridLines));
    
    ctx.beginPath();
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.moveTo(padding.left, y);
    ctx.lineTo(displayWidth - padding.right, y);
    ctx.stroke();
    ctx.setLineDash([]);
    
    ctx.fillText(value.toString(), padding.left - 8, y + 4);
  }
  
  const maxLabels = Math.min(labels.length, 10);
  const labelStep = Math.max(1, Math.floor(labels.length / maxLabels));
  
  ctx.textAlign = 'center';
  ctx.fillStyle = textColor;
  
  for (let i = 0; i < labels.length; i += labelStep) {
    const x = padding.left + (chartWidth * i / Math.max(labels.length - 1, 1));
    const y = displayHeight - padding.bottom + 18;
    
    const label = labels[i].length > 6 ? labels[i].substring(5) : labels[i];
    ctx.fillText(label, x, y);
  }
  
  const points = data.map((value, i) => ({
    x: padding.left + (chartWidth * i / Math.max(data.length - 1, 1)),
    y: padding.top + chartHeight - (chartHeight * (value - minValue) / Math.max(valueRange, 1))
  }));
  
  if (points.length > 1) {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    
    ctx.lineTo(points[points.length - 1].x, padding.top + chartHeight);
    ctx.lineTo(points[0].x, padding.top + chartHeight);
    ctx.closePath();
    
    const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight);
    gradient.addColorStop(0, fillColor);
    gradient.addColorStop(1, 'rgba(45, 90, 123, 0.01)');
    ctx.fillStyle = gradient;
    ctx.fill();
  }
  
  if (points.length > 0) {
    ctx.beginPath();
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();
    
    points.forEach(point => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = lineColor;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(point.x, point.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = style.getPropertyValue('--bg-card').trim() || '#FFFFFF';
      ctx.fill();
    });
  }
}


/**
 * Draws a bar chart on a canvas element.
 * 
 * @param {HTMLCanvasElement} canvas - The canvas element
 * @param {object} config - Chart configuration
 */
function drawBarChart(canvas, config) {
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  
  const displayWidth = canvas.offsetWidth;
  const displayHeight = canvas.offsetHeight;
  
  canvas.width = displayWidth * dpr;
  canvas.height = displayHeight * dpr;
  ctx.scale(dpr, dpr);
  
  const { labels = [], data = [], barColor = '#2D5A7B', title = '' } = config;
  
  if (data.length === 0) {
    drawEmptyChart(ctx, displayWidth, displayHeight, 'No data yet');
    return;
  }
  
  const padding = { top: 30, right: 20, bottom: 40, left: 50 };
  const chartWidth = displayWidth - padding.left - padding.right;
  const chartHeight = displayHeight - padding.top - padding.bottom;
  
  const maxValue = Math.max(...data, 1);
  
  ctx.clearRect(0, 0, displayWidth, displayHeight);
  
  const style = getComputedStyle(document.documentElement);
  const textColor = style.getPropertyValue('--text-secondary').trim() || '#6B6B80';
  const gridColor = style.getPropertyValue('--border-light').trim() || '#EDEBE7';
  
  if (title) {
    ctx.font = `600 14px Inter, sans-serif`;
    ctx.fillStyle = style.getPropertyValue('--text-primary').trim() || '#2C2C3A';
    ctx.textAlign = 'left';
    ctx.fillText(title, padding.left, 18);
  }
  
  const gridLines = 5;
  ctx.font = `11px Inter, sans-serif`;
  
  for (let i = 0; i <= gridLines; i++) {
    const y = padding.top + (chartHeight * i / gridLines);
    const value = Math.round(maxValue - (maxValue * i / gridLines));
    
    ctx.beginPath();
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.moveTo(padding.left, y);
    ctx.lineTo(displayWidth - padding.right, y);
    ctx.stroke();
    ctx.setLineDash([]);
    
    ctx.fillStyle = textColor;
    ctx.textAlign = 'right';
    ctx.fillText(value.toString(), padding.left - 8, y + 4);
  }
  
  const barCount = data.length;
  const barGap = 8;
  const barWidth = Math.min(40, (chartWidth - barGap * (barCount + 1)) / barCount);
  const totalBarsWidth = barCount * barWidth + (barCount - 1) * barGap;
  const startX = padding.left + (chartWidth - totalBarsWidth) / 2;
  
  data.forEach((value, i) => {
    const barHeight = (value / maxValue) * chartHeight;
    const x = startX + i * (barWidth + barGap);
    const y = padding.top + chartHeight - barHeight;
    
    const radius = Math.min(4, barWidth / 2);
    ctx.beginPath();
    ctx.moveTo(x, y + radius);
    ctx.arcTo(x, y, x + radius, y, radius);
    ctx.arcTo(x + barWidth, y, x + barWidth, y + radius, radius);
    ctx.lineTo(x + barWidth, padding.top + chartHeight);
    ctx.lineTo(x, padding.top + chartHeight);
    ctx.closePath();
    ctx.fillStyle = barColor;
    ctx.fill();
    
    ctx.font = `11px Inter, sans-serif`;
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    const label = labels[i] || '';
    const shortLabel = label.length > 5 ? label.substring(0, 5) : label;
    ctx.fillText(shortLabel, x + barWidth / 2, displayHeight - padding.bottom + 18);
  });
}

function drawEmptyChart(ctx, width, height, message) {
  const style = getComputedStyle(document.documentElement);
  ctx.font = `14px Inter, sans-serif`;
  ctx.fillStyle = style.getPropertyValue('--text-tertiary').trim() || '#9B99AC';
  ctx.textAlign = 'center';
  ctx.fillText(message, width / 2, height / 2);
}
