import { CATEGORIES } from '../data/demoData.js';

export const MAX_CATEGORIES = 10;
const presets = new Map(CATEGORIES.flatMap(({ id, label }) => [
  [id.toLowerCase(), id], [label.toLowerCase(), id],
]));

// Use the same canonical value for checkbox categories and typed words/phrases.
export function canonicalCategory(value) {
  if (typeof value !== 'string') return '';
  const cleaned = value.trim().replace(/\s+/g, ' ');
  if (!cleaned || cleaned.length < 2 || cleaned.length > 40) return '';
  return presets.get(cleaned.toLowerCase()) || cleaned.toLowerCase();
}

export function normalizeCategories(values) {
  if (!Array.isArray(values)) throw new Error('Interests must be a list.');
  const result = [];
  for (const value of values) {
    const normalized = canonicalCategory(value);
    if (!normalized) throw new Error('Each interest must contain 2–40 characters.');
    if (!result.includes(normalized)) result.push(normalized);
  }
  if (!result.length || result.length > MAX_CATEGORIES) {
    throw new Error(`Choose between 1 and ${MAX_CATEGORIES} total interests.`);
  }
  return result;
}

export function combineCategories(selected, typedText) {
  const typed = typedText.split(',').map(s => s.trim()).filter(Boolean);
  return normalizeCategories([...selected, ...typed]);
}

export function sharedCategories(a, b) {
  const right = new Set((b || []).map(canonicalCategory));
  return (a || []).map(canonicalCategory).filter(c => right.has(c));
}
