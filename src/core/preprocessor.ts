import { mergeSpaces, splitLines } from '../utils/text-utils';

/**
 * Preprocesses raw PDF text by cleaning and normalizing it.
 *
 * This function performs the following operations:
 * 1. Normalizes line breaks (CRLF -> LF)
 * 2. Fixes common PDF extraction artifacts (ligatures, broken words)
 * 3. Collapses excessive blank lines (3+ -> 2)
 * 4. Normalizes whitespace on each line
 * 5. Removes page numbers and headers/footers
 *
 * @param rawText - The raw text extracted from the PDF
 * @returns The cleaned and normalized text
 */
export function preprocessText(rawText: string): string {
  if (!rawText) return '';

  let text = rawText;

  // Step 1: Normalize line breaks
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Step 2: Fix common PDF extraction artifacts
  // Fix ligatures
  text = text.replace(/ﬁ/g, 'fi');
  text = text.replace(/ﬂ/g, 'fl');
  text = text.replace(/ﬀ/g, 'ff');
  text = text.replace(/ﬃ/g, 'ffi');
  text = text.replace(/ﬄ/g, 'ffl');

  // Fix broken words across lines (word ending with hyphen followed by newline)
  text = text.replace(/(\w)-\n(\w)/g, '$1$2');

  // Step 3: Collapse excessive blank lines (3+ consecutive blank lines -> 2)
  text = text.replace(/\n{3,}/g, '\n\n');

  // Step 4: Normalize whitespace on each line and trim
  text = text
    .split('\n')
    .map((line) => mergeSpaces(line))
    .join('\n');

  // Step 5: Remove page numbers and headers/footers
  text = text
    .split('\n')
    .filter((line) => {
      const trimmed = line.trim();
      // Remove lines that are just page numbers
      if (/^\d+$/.test(trimmed)) return false;
      // Remove 'Page X of Y' patterns
      if (/^page\s+\d+\s+(of|\/)\s+\d+$/i.test(trimmed)) return false;
      return true;
    })
    .join('\n');

  return text.trim();
}

/**
 * Splits preprocessed text into an array of trimmed non-empty lines.
 *
 * @param text - The preprocessed text to split
 * @returns Array of non-empty trimmed lines
 */
export function splitIntoLines(text: string): string[] {
  return splitLines(text).filter((line) => line.length > 0);
}
