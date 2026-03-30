/**
 * Text manipulation utilities for resume parsing
 * Provides common text processing functions used throughout the library
 */

/**
 * Removes excessive whitespace and normalizes line breaks in text
 *
 * - Removes leading and trailing whitespace
 * - Converts multiple consecutive spaces to single space
 * - Normalizes line breaks (CRLF to LF)
 *
 * @param text - The text to clean
 * @returns Cleaned text with normalized whitespace
 */
export function cleanText(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return (
    text
      // Normalize line breaks: CRLF -> LF
      .replace(/\r\n/g, '\n')
      // Remove excessive spaces
      .replace(/[ \t]+/g, ' ')
      // Remove spaces before line breaks
      .replace(/[ \t]+\n/g, '\n')
      // Trim each line
      .split('\n')
      .map((line) => line.trim())
      .join('\n')
      // Remove multiple consecutive line breaks
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  );
}

/**
 * Splits text into individual lines and trims each line
 *
 * @param text - The text to split
 * @returns Array of trimmed lines
 */
export function splitLines(text: string): string[] {
  if (!text || typeof text !== 'string') {
    return [];
  }

  return text.split(/\r?\n/).map((line) => line.trim());
}

/**
 * Removes bullet point characters from the beginning of text
 *
 * Removes common bullet characters: •, -, *, ►, ◆, ○, ■, □, ▪, ▫, etc.
 *
 * @param text - The text to process
 * @returns Text with bullet characters removed
 */
export function removeBullets(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text.replace(/^[\s]*[•\-*►◆○■□▪▫]+[\s]*/gm, '').trim();
}

/**
 * Extracts a substring between two character positions
 *
 * @param text - The source text
 * @param start - Starting position (inclusive)
 * @param end - Ending position (exclusive)
 * @returns The extracted substring, or empty string if positions are invalid
 */
export function extractBetween(text: string, start: number, end: number): string {
  if (!text || typeof text !== 'string' || start < 0 || end <= start || end > text.length) {
    return '';
  }

  return text.substring(start, end).trim();
}

/**
 * Capitalizes the first letter of each word in a string (title case)
 *
 * @param text - The text to capitalize
 * @returns Text with each word capitalized
 */
export function capitalize(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text
    .split(/\s+/)
    .map((word) => {
      if (word.length === 0) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

/**
 * Checks if a string is entirely in uppercase letters (ignoring non-letter characters)
 *
 * @param text - The text to check
 * @returns true if all letters are uppercase, false otherwise
 */
export function isUpperCase(text: string): boolean {
  if (!text || typeof text !== 'string') {
    return false;
  }

  const lettersOnly = text.replace(/[^a-zA-Z]/g, '');
  if (lettersOnly.length === 0) {
    return false;
  }

  return lettersOnly === lettersOnly.toUpperCase();
}

/**
 * Calculates a basic string similarity score between two strings (0-1)
 *
 * Uses character overlap for fuzzy matching. This is a simple implementation
 * that counts matching characters at the same positions and divides by the
 * length of the longer string.
 *
 * @param a - First string to compare
 * @param b - Second string to compare
 * @returns Similarity score between 0 and 1 (1 = identical, 0 = no match)
 */
export function similarity(a: string, b: string): number {
  if (!a || !b || typeof a !== 'string' || typeof b !== 'string') {
    return 0;
  }

  const str1 = a.toLowerCase();
  const str2 = b.toLowerCase();

  // Identical strings have similarity of 1
  if (str1 === str2) {
    return 1;
  }

  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) {
    return 1;
  }

  // Calculate Levenshtein-style distance for better accuracy
  const dp: number[][] = [];

  for (let i = 0; i <= str1.length; i++) {
    dp[i] = [i];
  }

  for (let j = 0; j <= str2.length; j++) {
    dp[0][j] = j;
  }

  for (let i = 1; i <= str1.length; i++) {
    for (let j = 1; j <= str2.length; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  const distance = dp[str1.length][str2.length];
  const similarity = 1 - distance / maxLen;

  return Math.max(0, similarity);
}

/**
 * Collapses multiple consecutive spaces into a single space
 *
 * @param text - The text to process
 * @returns Text with multiple spaces replaced by single spaces
 */
export function mergeSpaces(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text.replace(/[ \t]+/g, ' ').trim();
}
