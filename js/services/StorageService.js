/* =============================================================================
   STORAGE SERVICE — Data Persistence Abstraction Layer
   ============================================================================= */

class StorageService {
  constructor() {
    this.prefix = 'jlt_';
    this.collections = [
      'vocabulary',
      'kanji', 
      'resources',
      'jlptLevels',
      'activities',
      'streakData',
      'settings'
    ];
  }
  
  
  /* ===========================================================================
     CORE CRUD METHODS
     =========================================================================== */

  getAll(collection) {
    try {
      const key = this.prefix + collection;
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`Error reading collection "${collection}":`, error);
      return [];
    }
  }
  
  
  getById(collection, id) {
    const items = this.getAll(collection);
    return items.find(item => item.id === id) || null;
  }
  
  
  create(collection, item) {
    const items = this.getAll(collection);
    
    const newItem = {
      ...item,
      id: generateId(collection.slice(0, -1)),
      dateAdded: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };
    
    newItem.id = generateId(collection === 'vocabulary' ? 'vocab' : 
                            collection === 'kanji' ? 'kanji' : 
                            collection === 'resources' ? 'resource' :
                            collection === 'activities' ? 'activity' : 'item');
    
    items.unshift(newItem);
    this._save(collection, items);
    
    return newItem;
  }
  
  
  update(collection, id, updates) {
    const items = this.getAll(collection);
    const index = items.findIndex(item => item.id === id);
    
    if (index === -1) {
      console.warn(`Item with id "${id}" not found in "${collection}".`);
      return null;
    }
    
    items[index] = {
      ...items[index],
      ...updates,
      lastModified: new Date().toISOString()
    };
    
    this._save(collection, items);
    
    return items[index];
  }
  
  
  delete(collection, id) {
    const items = this.getAll(collection);
    const originalLength = items.length;
    
    const filtered = items.filter(item => item.id !== id);
    
    if (filtered.length === originalLength) {
      console.warn(`Item with id "${id}" not found in "${collection}".`);
      return false;
    }
    
    this._save(collection, filtered);
    return true;
  }
  
  
  /* ===========================================================================
     QUERY METHODS
     =========================================================================== */

  search(collection, query, fields) {
    if (!query || query.trim() === '') return this.getAll(collection);
    
    const items = this.getAll(collection);
    const lowerQuery = query.toLowerCase().trim();
    
    return items.filter(item => {
      return fields.some(field => {
        const value = item[field];
        if (typeof value === 'string') {
          return value.toLowerCase().includes(lowerQuery);
        }
        return false;
      });
    });
  }

  filter(collection, filters) {
    const items = this.getAll(collection);
    
    return items.filter(item => {
      return Object.entries(filters).every(([key, value]) => {
        if (value === '' || value === null || value === undefined || value === 'all') {
          return true;
        }
        return item[key] === value;
      });
    });
  }

  count(collection) {
    return this.getAll(collection).length;
  }
  
  
  /* ===========================================================================
     STREAK METHODS
     =========================================================================== */

  getStreakData() {
    try {
      const key = this.prefix + 'streakData';
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : {
        currentStreak: 0,
        longestStreak: 0,
        totalStudyDays: 0,
        lastStudyDate: null,
        studyDates: []
      };
    } catch (error) {
      console.error('Error reading streak data:', error);
      return {
        currentStreak: 0,
        longestStreak: 0,
        totalStudyDays: 0,
        lastStudyDate: null,
        studyDates: []
      };
    }
  }

  updateStreak() {
    const streak = this.getStreakData();
    const today = getTodayDateString();
    const yesterday = getYesterdayDateString();
    
    if (streak.lastStudyDate === today) {
      return streak;
    }
    
    if (streak.lastStudyDate === yesterday) {
      streak.currentStreak += 1;
    } else {
      streak.currentStreak = 1;
    }
    
    if (streak.currentStreak > streak.longestStreak) {
      streak.longestStreak = streak.currentStreak;
    }
    
    streak.totalStudyDays += 1;
    streak.lastStudyDate = today;
    
    if (!streak.studyDates.includes(today)) {
      streak.studyDates.push(today);
    }
    
    this._saveObject('streakData', streak);
    
    return streak;
  }
  
  
  /* ===========================================================================
     ACTIVITY LOG METHODS
     =========================================================================== */

  logActivity(type, description) {
    const activity = {
      id: generateId('activity'),
      type,
      description,
      date: getTodayDateString(),
      timestamp: new Date().toISOString()
    };
    
    const activities = this.getAll('activities');
    activities.unshift(activity);
    
    if (activities.length > 500) {
      activities.length = 500;
    }
    
    this._save('activities', activities);
    this.updateStreak();
    
    return activity;
  }

  getRecentActivities(limit = 10) {
    const activities = this.getAll('activities');
    return activities.slice(0, limit);
  }
  
  
  /**
   * Gets activity counts grouped by date.
   * Used for the heatmap visualization.
   * 
   * @returns {object} Object with date strings as keys and counts as values
   *                   e.g., { "2026-06-11": 5, "2026-06-10": 3 }
   */
  getActivityCounts() {
    const activities = this.getAll('activities');
    const counts = {};
    
    activities.forEach(activity => {
      const date = activity.date;
      if (date) {
        counts[date] = (counts[date] || 0) + 1;
      }
    });
    
    return counts;
  }
  
  
  /* ===========================================================================
     JLPT LEVEL METHODS
     =========================================================================== */
  
  /**
   * Gets all JLPT level data.
   * 
   * @returns {Array} Array of JLPT level objects
   */
  getJLPTLevels() {
    const levels = this.getAll('jlptLevels');
    if (levels.length === 0) {
      // Return defaults if no data exists yet
      return this._getDefaultJLPTLevels();
    }
    return levels;
  }
  
  
  /**
   * Updates a JLPT level's status.
   * 
   * @param {string} level - The JLPT level (e.g., 'N5')
   * @param {string} status - New status: 'locked', 'in_progress', or 'completed'
   * @returns {Array} Updated JLPT levels
   */
  updateJLPTLevel(level, status) {
    const levels = this.getJLPTLevels();
    const index = levels.findIndex(l => l.level === level);
    
    if (index !== -1) {
      levels[index].status = status;
      
      // Set dates based on status
      if (status === 'in_progress' && !levels[index].dateStarted) {
        levels[index].dateStarted = getTodayDateString();
        levels[index].dateCompleted = null;
      } else if (status === 'completed') {
        levels[index].dateCompleted = getTodayDateString();
        if (!levels[index].dateStarted) {
          levels[index].dateStarted = getTodayDateString();
        }
      } else if (status === 'locked') {
        levels[index].dateStarted = null;
        levels[index].dateCompleted = null;
      }
      
      this._save('jlptLevels', levels);
    }
    
    return levels;
  }
  
  
  /**
   * Default JLPT levels — used when app is first loaded.
   * @private
   */
  _getDefaultJLPTLevels() {
    return [
      { level: 'N5', status: 'locked', dateStarted: null, dateCompleted: null },
      { level: 'N4', status: 'locked', dateStarted: null, dateCompleted: null },
      { level: 'N3', status: 'locked', dateStarted: null, dateCompleted: null },
      { level: 'N2', status: 'locked', dateStarted: null, dateCompleted: null },
      { level: 'N1', status: 'locked', dateStarted: null, dateCompleted: null }
    ];
  }
  
  
  /* ===========================================================================
     SETTINGS METHODS
     =========================================================================== */
  
  /**
   * Gets a settings value.
   * 
   * @param {string} key - The setting key
   * @param {*} defaultValue - Default value if setting doesn't exist
   * @returns {*} The setting value
   */
  getSetting(key, defaultValue = null) {
    try {
      const settings = this.getAll('settings');
      const setting = settings.find(s => s.key === key);
      return setting ? setting.value : defaultValue;
    } catch (error) {
      return defaultValue;
    }
  }
  
  
  /**
   * Saves a settings value.
   * 
   * @param {string} key - The setting key
   * @param {*} value - The value to save
   */
  setSetting(key, value) {
    const settings = this.getAll('settings');
    const index = settings.findIndex(s => s.key === key);
    
    if (index !== -1) {
      settings[index].value = value;
    } else {
      settings.push({ key, value });
    }
    
    this._save('settings', settings);
  }
  
  
  /* ===========================================================================
     DATA MANAGEMENT (Export / Import / Reset)
     =========================================================================== */
  
  /**
   * Exports ALL data as a single JSON object.
   * Used for backup/export functionality.
   * 
   * @returns {object} Complete data export
   */
  exportAll() {
    return {
      vocabulary: this.getAll('vocabulary'),
      kanji: this.getAll('kanji'),
      resources: this.getAll('resources'),
      jlptLevels: this.getJLPTLevels(),
      activities: this.getAll('activities'),
      streakData: this.getStreakData(),
      settings: this.getAll('settings'),
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    };
  }
  
  
  /**
   * Imports data from a JSON object (replaces all existing data).
   * 
   * IMPORTANT: Always validate data with validateImportData() before calling this!
   * 
   * @param {object} data - The data to import
   */
  importAll(data) {
    if (data.vocabulary) this._save('vocabulary', data.vocabulary);
    if (data.kanji) this._save('kanji', data.kanji);
    if (data.resources) this._save('resources', data.resources);
    if (data.jlptLevels) this._save('jlptLevels', data.jlptLevels);
    if (data.activities) this._save('activities', data.activities);
    if (data.streakData) this._saveObject('streakData', data.streakData);
    if (data.settings) this._save('settings', data.settings);
  }
  
  
  /**
   * Resets ALL data — clears everything.
   * This is destructive and should require user confirmation before calling.
   */
  resetAll() {
    this.collections.forEach(collection => {
      localStorage.removeItem(this.prefix + collection);
    });
  }
  
  
  /**
   * Checks if this is the first time the app is running.
   * Used to seed default data on initial load.
   * 
   * @returns {boolean} True if no data exists yet
   */
  isFirstRun() {
    return localStorage.getItem(this.prefix + 'initialized') === null;
  }
  
  
  /**
   * Marks the app as initialized (first run complete).
   */
  markInitialized() {
    localStorage.setItem(this.prefix + 'initialized', 'true');
  }
  
  
  /* ===========================================================================
     DUPLICATE CHECKING
     =========================================================================== */
  
  /**
   * Checks if a vocabulary entry with the same Japanese word already exists.
   * 
   * @param {string} japanese - The Japanese word to check
   * @param {string|null} excludeId - ID to exclude (for edit mode)
   * @returns {boolean} True if a duplicate exists
   */
  isDuplicateVocab(japanese, excludeId = null) {
    const items = this.getAll('vocabulary');
    return items.some(item => 
      item.japanese === japanese.trim() && item.id !== excludeId
    );
  }
  
  
  /**
   * Checks if a kanji entry with the same character already exists.
   * 
   * @param {string} character - The kanji character to check
   * @param {string|null} excludeId - ID to exclude (for edit mode)
   * @returns {boolean} True if a duplicate exists
   */
  isDuplicateKanji(character, excludeId = null) {
    const items = this.getAll('kanji');
    return items.some(item => 
      item.character === character.trim() && item.id !== excludeId
    );
  }
  
  
  /* ===========================================================================
     PRIVATE HELPER METHODS
     
     Methods starting with _ are "private" by convention.
     They're only meant to be used internally by this class.
     =========================================================================== */
  
  /**
   * Saves an array of items to a collection.
   * @private
   * 
   * @param {string} collection - The collection name
   * @param {Array} items - The array to save
   */
  _save(collection, items) {
    try {
      const key = this.prefix + collection;
      localStorage.setItem(key, JSON.stringify(items));
    } catch (error) {
      // localStorage can fail if storage is full (usually 5-10MB limit)
      console.error(`Error saving to "${collection}":`, error);
      
      if (error.name === 'QuotaExceededError') {
        showToast('Storage is full! Please export and clear some data.', 'error');
      }
    }
  }
  
  
  /**
   * Saves a single object (not an array) to localStorage.
   * Used for streak data and other single-value stores.
   * @private
   * 
   * @param {string} key - The storage key (without prefix)
   * @param {object} data - The object to save
   */
  _saveObject(key, data) {
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error saving object "${key}":`, error);
    }
  }
}
