import { SECTION_HEADERS } from '../utils/patterns';

/**
 * Represents a detected section within a resume.
 */
export interface Section {
  /** The canonical name of the section (e.g., 'experience', 'education') */
  name: string;
  /** The starting line index of this section (0-based) */
  startLine: number;
  /** The ending line index of this section (exclusive, 0-based) */
  endLine: number;
  /** The full text content of this section */
  content: string;
  /** The lines that make up this section */
  lines: string[];
}

/**
 * Detects resume sections by identifying section headers in the text.
 *
 * Lines before the first detected section go into a 'header' section (contact info).
 * Returns a single 'unknown' section if no sections are detected.
 *
 * @param text - The preprocessed resume text
 * @param customHeaders - Optional custom section header patterns to merge with defaults
 * @returns Array of detected Section objects
 */
export function detectSections(
  text: string,
  customHeaders?: Record<string, string[]>,
): Section[] {
  const allLines = text.split('\n');

  if (allLines.length === 0) {
    return [];
  }

  // Merge custom headers with defaults
  const allHeaders: Record<string, string[]> = { ...SECTION_HEADERS };
  if (customHeaders) {
    for (const [key, patterns] of Object.entries(customHeaders)) {
      allHeaders[key] = [...(allHeaders[key] || []), ...patterns];
    }
  }

  // Build a lookup: lowercase pattern -> canonical section name
  const patternMap = new Map<string, string>();
  for (const [canonicalName, patterns] of Object.entries(allHeaders)) {
    for (const pattern of patterns) {
      patternMap.set(pattern.toLowerCase(), canonicalName);
    }
  }

  // Detect header lines
  const headerIndices = new Map<number, string>();

  for (let i = 0; i < allLines.length; i++) {
    const trimmed = allLines[i].trim();

    // Skip empty lines and very long lines (unlikely headers)
    if (trimmed.length === 0 || trimmed.length > 60) continue;

    const lower = trimmed.toLowerCase().replace(/[^a-z0-9\s&]/g, '').trim();

    // Direct match
    let matchedName = patternMap.get(lower);

    // Try matching without punctuation/special chars
    if (!matchedName) {
      for (const [pattern, canonicalName] of patternMap) {
        if (lower === pattern || lower.replace(/\s+/g, '') === pattern.replace(/\s+/g, '')) {
          matchedName = canonicalName;
          break;
        }
      }
    }

    // Fuzzy: check if pattern is contained in a short line
    // Require the pattern to cover a significant portion of the line to avoid
    // false positives like "Stanford University" matching the "university" education header
    if (!matchedName && trimmed.length < 40) {
      for (const [pattern, canonicalName] of patternMap) {
        if (lower.includes(pattern) && pattern.length >= 4 && pattern.length >= lower.length * 0.6) {
          matchedName = canonicalName;
          break;
        }
      }
    }

    if (matchedName) {
      headerIndices.set(i, matchedName);
    }
  }

  // No sections detected -> single 'unknown' section
  if (headerIndices.size === 0) {
    return [
      {
        name: 'unknown',
        startLine: 0,
        endLine: allLines.length,
        content: text,
        lines: allLines.filter((l) => l.trim().length > 0),
      },
    ];
  }

  // Build sections
  const sections: Section[] = [];
  const sortedHeaders = Array.from(headerIndices.entries()).sort((a, b) => a[0] - b[0]);

  // Lines before first section -> 'header' section (contact info)
  if (sortedHeaders[0][0] > 0) {
    const headerLines = allLines.slice(0, sortedHeaders[0][0]).filter((l) => l.trim().length > 0);
    if (headerLines.length > 0) {
      sections.push({
        name: 'header',
        startLine: 0,
        endLine: sortedHeaders[0][0],
        content: headerLines.join('\n'),
        lines: headerLines,
      });
    }
  }

  // Process each detected section
  for (let i = 0; i < sortedHeaders.length; i++) {
    const [headerLineIndex, sectionName] = sortedHeaders[i];
    const nextHeaderLineIndex =
      i + 1 < sortedHeaders.length ? sortedHeaders[i + 1][0] : allLines.length;

    const contentStartLine = headerLineIndex + 1;
    const sectionLines = allLines
      .slice(contentStartLine, nextHeaderLineIndex)
      .filter((l) => l.trim().length > 0);

    sections.push({
      name: sectionName,
      startLine: contentStartLine,
      endLine: nextHeaderLineIndex,
      content: sectionLines.join('\n'),
      lines: sectionLines,
    });
  }

  return sections;
}

/**
 * Finds a section by its canonical name.
 */
export function findSection(sections: Section[], name: string): Section | undefined {
  return sections.find((section) => section.name === name);
}
