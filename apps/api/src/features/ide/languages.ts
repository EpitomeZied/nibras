import type { Judge0Language } from './judge0-client';

const CURATED_LANGUAGE_PATTERNS: RegExp[] = [
  /^C\+\+ \(GCC/i,
  /^Python \(3/i,
  /^Java \(OpenJDK/i,
  /^C \(GCC/i,
  /^JavaScript \(Node\.js/i,
];

let cachedLanguages: Judge0Language[] | null = null;
let cacheExpiresAt = 0;
const CACHE_TTL_MS = 60 * 60 * 1000;

export function filterCuratedLanguages(languages: Judge0Language[]): Judge0Language[] {
  return languages
    .filter((language) => CURATED_LANGUAGE_PATTERNS.some((pattern) => pattern.test(language.name)))
    .sort((left, right) => left.name.localeCompare(right.name));
}

export function getCachedLanguages(): Judge0Language[] | null {
  if (cachedLanguages && Date.now() < cacheExpiresAt) {
    return cachedLanguages;
  }
  return null;
}

export function setCachedLanguages(languages: Judge0Language[]): Judge0Language[] {
  cachedLanguages = languages;
  cacheExpiresAt = Date.now() + CACHE_TTL_MS;
  return languages;
}

export function pickDefaultLanguage(languages: Judge0Language[]): Judge0Language | null {
  if (languages.length === 0) return null;
  return (
    languages.find((language) => /C\+\+ \(GCC 9/i.test(language.name)) ??
    languages.find((language) => /^C\+\+ \(GCC/i.test(language.name)) ??
    languages[0]
  );
}
