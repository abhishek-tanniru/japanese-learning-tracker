/* =============================================================================
   DEFAULTS.JS — Default/Seed Data
   ============================================================================= */

const DEFAULT_RESOURCES = [
  {
    name: 'Minna no Nihongo N5',
    category: 'Textbook',
    unitType: 'Lessons',
    totalUnits: 25,
    completedUnits: 0
  },
  {
    name: 'Minna no Nihongo N4',
    category: 'Textbook',
    unitType: 'Lessons',
    totalUnits: 25,
    completedUnits: 0
  },
  {
    name: 'Shin Nihongo 500 N4-N5',
    category: 'Workbook',
    unitType: 'Exercises',
    totalUnits: 500,
    completedUnits: 0
  },
  {
    name: 'Nihongo Challenge N4-N5',
    category: 'Grammar Book',
    unitType: 'Chapters',
    totalUnits: 40,
    completedUnits: 0
  },
  {
    name: 'Basic Kanji 320',
    category: 'Kanji Book',
    unitType: 'Kanji',
    totalUnits: 320,
    completedUnits: 0
  }
];


const RESOURCE_CATEGORIES = [
  'Textbook',
  'Workbook',
  'Kanji Book',
  'Grammar Book',
  'Reading Book',
  'Custom'
];


const COMMON_UNIT_TYPES = [
  'Lessons',
  'Chapters',
  'Exercises',
  'Kanji',
  'Pages',
  'Sections',
  'Units',
  'Modules',
  'Problems'
];


const JLPT_LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1'];


const JLPT_DESCRIPTIONS = {
  N5: {
    title: 'N5 — Beginner',
    description: 'Basic Japanese. ~800 vocabulary, ~100 kanji.',
    vocabTarget: 800,
    kanjiTarget: 100
  },
  N4: {
    title: 'N4 — Elementary',
    description: 'Basic daily conversation. ~1,500 vocabulary, ~300 kanji.',
    vocabTarget: 1500,
    kanjiTarget: 300
  },
  N3: {
    title: 'N3 — Intermediate',
    description: 'Everyday situations. ~3,750 vocabulary, ~650 kanji.',
    vocabTarget: 3750,
    kanjiTarget: 650
  },
  N2: {
    title: 'N2 — Upper Intermediate',
    description: 'More natural Japanese. ~6,000 vocabulary, ~1,000 kanji.',
    vocabTarget: 6000,
    kanjiTarget: 1000
  },
  N1: {
    title: 'N1 — Advanced',
    description: 'Near-native proficiency. ~10,000 vocabulary, ~2,000 kanji.',
    vocabTarget: 10000,
    kanjiTarget: 2000
  }
};


const ACTIVITY_TYPES = {
  vocab_added: { label: 'Added vocabulary', icon: '📝', color: 'var(--primary)' },
  vocab_edited: { label: 'Edited vocabulary', icon: '✏️', color: 'var(--warning)' },
  vocab_deleted: { label: 'Deleted vocabulary', icon: '🗑️', color: 'var(--danger)' },
  kanji_added: { label: 'Added kanji', icon: '🈴', color: 'var(--accent)' },
  kanji_edited: { label: 'Edited kanji', icon: '✏️', color: 'var(--warning)' },
  kanji_deleted: { label: 'Deleted kanji', icon: '🗑️', color: 'var(--danger)' },
  resource_added: { label: 'Added resource', icon: '📚', color: 'var(--success)' },
  resource_updated: { label: 'Updated resource', icon: '📈', color: 'var(--primary)' },
  resource_deleted: { label: 'Deleted resource', icon: '🗑️', color: 'var(--danger)' },
  jlpt_updated: { label: 'Updated JLPT level', icon: '🎯', color: 'var(--accent)' },
  data_imported: { label: 'Imported data', icon: '📥', color: 'var(--primary)' },
  data_exported: { label: 'Exported data', icon: '📤', color: 'var(--primary)' },
  data_reset: { label: 'Reset all data', icon: '🔄', color: 'var(--danger)' }
};
