/* =============================================================================
   VALIDATORS.JS — Input Validation & Sanitization
   ============================================================================= */

function validateVocab(data) {
  const errors = [];
  const validLevels = ['N5', 'N4', 'N3', 'N2', 'N1'];
  
  if (!data.japanese || typeof data.japanese !== 'string' || data.japanese.trim() === '') {
    errors.push('Japanese word is required.');
  }
  
  if (!data.english || typeof data.english !== 'string' || data.english.trim() === '') {
    errors.push('English meaning is required.');
  }
  
  if (!data.jlptLevel || !validLevels.includes(data.jlptLevel)) {
    errors.push('Please select a valid JLPT level (N5-N1).');
  }
  
  if (data.japanese && data.japanese.length > 100) {
    errors.push('Japanese word is too long (max 100 characters).');
  }
  
  if (data.english && data.english.length > 200) {
    errors.push('English meaning is too long (max 200 characters).');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}


/**
 * Validates a kanji entry before saving.
 * 
 * RULES:
 * - character: Required, should be a single kanji character (or small number)
 * - english: Required, non-empty string
 * - jlptLevel: Must be one of N5, N4, N3, N2, N1
 * 
 * @param {object} data - The kanji data to validate
 * @returns {object} { valid: boolean, errors: string[] }
 */
function validateKanji(data) {
  const errors = [];
  const validLevels = ['N5', 'N4', 'N3', 'N2', 'N1'];
  
  if (!data.character || typeof data.character !== 'string' || data.character.trim() === '') {
    errors.push('Kanji character is required.');
  } else if (data.character.trim().length > 5) {
    errors.push('Please enter a single kanji or small compound (max 5 characters).');
  }
  
  if (!data.english || typeof data.english !== 'string' || data.english.trim() === '') {
    errors.push('English meaning is required.');
  }
  
  if (!data.jlptLevel || !validLevels.includes(data.jlptLevel)) {
    errors.push('Please select a valid JLPT level (N5-N1).');
  }
  
  if (data.english && data.english.length > 200) {
    errors.push('English meaning is too long (max 200 characters).');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}


/**
 * Validates a resource entry before saving.
 * 
 * RULES:
 * - name: Required, non-empty string
 * - category: Must be a valid category
 * - unitType: Required (e.g., "Lessons", "Chapters")
 * - totalUnits: Required, must be a positive integer
 * - completedUnits: Must be >= 0 and <= totalUnits
 * 
 * @param {object} data - The resource data to validate
 * @returns {object} { valid: boolean, errors: string[] }
 */
function validateResource(data) {
  const errors = [];
  const validCategories = [
    'Textbook', 'Workbook', 'Kanji Book', 
    'Grammar Book', 'Reading Book', 'Custom'
  ];
  
  if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
    errors.push('Resource name is required.');
  }
  
  if (data.name && data.name.length > 200) {
    errors.push('Resource name is too long (max 200 characters).');
  }
  
  if (!data.category || !validCategories.includes(data.category)) {
    errors.push('Please select a valid resource category.');
  }
  
  if (!data.unitType || typeof data.unitType !== 'string' || data.unitType.trim() === '') {
    errors.push('Progress unit type is required (e.g., Lessons, Chapters).');
  }
  
  const totalUnits = parseInt(data.totalUnits, 10);
  if (isNaN(totalUnits) || totalUnits < 1) {
    errors.push('Total units must be a positive number.');
  } else if (totalUnits > 10000) {
    errors.push('Total units cannot exceed 10,000.');
  }
  
  const completedUnits = parseInt(data.completedUnits, 10);
  if (isNaN(completedUnits) || completedUnits < 0) {
    errors.push('Completed units must be 0 or greater.');
  } else if (completedUnits > totalUnits) {
    errors.push('Completed units cannot exceed total units.');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}


/**
 * Validates imported JSON data before restoring.
 * 
 * This is critical for data safety. When a user imports a JSON file,
 * we need to verify:
 * 1. It's valid JSON (already parsed before reaching this function)
 * 2. It has the expected structure
 * 3. Each collection contains valid data types
 * 
 * We don't validate every single field — just enough to prevent
 * corrupt data from breaking the app.
 * 
 * @param {object} data - The parsed JSON data to validate
 * @returns {object} { valid: boolean, errors: string[], warnings: string[] }
 */
function validateImportData(data) {
  const errors = [];
  const warnings = [];
  
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    errors.push('Import data must be a valid JSON object.');
    return { valid: false, errors, warnings };
  }
  
  const expectedCollections = ['vocabulary', 'kanji', 'resources', 'jlptLevels', 'activities', 'streakData'];
  
  for (const collection of expectedCollections) {
    if (!(collection in data)) {
      warnings.push(`Missing collection: "${collection}". It will be initialized as empty.`);
    }
  }
  
  if (data.vocabulary) {
    if (!Array.isArray(data.vocabulary)) {
      errors.push('Vocabulary data must be an array.');
    } else {
      if (data.vocabulary.length > 0) {
        const sample = data.vocabulary[0];
        if (!sample.id || !sample.japanese || !sample.english) {
          errors.push('Vocabulary entries must have id, japanese, and english fields.');
        }
      }
    }
  }
  
  if (data.kanji) {
    if (!Array.isArray(data.kanji)) {
      errors.push('Kanji data must be an array.');
    } else {
      if (data.kanji.length > 0) {
        const sample = data.kanji[0];
        if (!sample.id || !sample.character || !sample.english) {
          errors.push('Kanji entries must have id, character, and english fields.');
        }
      }
    }
  }
  
  if (data.resources) {
    if (!Array.isArray(data.resources)) {
      errors.push('Resources data must be an array.');
    } else {
      if (data.resources.length > 0) {
        const sample = data.resources[0];
        if (!sample.id || !sample.name) {
          errors.push('Resource entries must have id and name fields.');
        }
      }
    }
  }
  
  if (data.activities) {
    if (!Array.isArray(data.activities)) {
      errors.push('Activities data must be an array.');
    }
  }
  
  if (data.streakData) {
    if (typeof data.streakData !== 'object' || Array.isArray(data.streakData)) {
      errors.push('Streak data must be an object.');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

function sanitizeInput(str) {
  if (typeof str !== 'string') return '';
  return str.trim();
}
