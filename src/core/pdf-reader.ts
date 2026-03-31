import { readFile } from 'fs/promises';
import pdfParse from 'pdf-parse';

/**
 * Result from reading and parsing a PDF file.
 */
export interface PdfReadResult {
  /** The extracted text content from the PDF */
  text: string;
  /** The total number of pages in the PDF */
  pages: number;
  /** Detected layout type */
  layout: 'single-column' | 'two-column' | 'unknown';
}

/**
 * Custom error class for Resumix operations.
 * Provides structured error information with codes and optional cause chains.
 */
export class ResumixError extends Error {
  /**
   * Creates a new ResumixError.
   * @param message - Human-readable error message
   * @param code - Machine-readable error code
   * @param cause - The underlying error that caused this error
   */
  constructor(
    message: string,
    public code: string,
    public cause?: Error
  ) {
    super(message);
    this.name = 'ResumixError';
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ResumixError);
    }
  }
}

/**
 * Y-coordinate tolerance for grouping text items on the same line.
 * Items within this tolerance are considered to be on the same row.
 */
const Y_TOLERANCE = 3;

/**
 * Minimum gap width (as fraction of page width) to detect a column boundary.
 */
const COLUMN_GAP_THRESHOLD = 0.08;

/**
 * Minimum number of rows that must span across a gap to consider it a column layout.
 */
const MIN_ROWS_FOR_COLUMN = 5;

interface TextRow {
  y: number;
  items: Array<{ x: number; width: number; str: string }>;
}

/**
 * Groups text items by Y-coordinate into rows.
 */
function groupIntoRows(items: Array<{ str: string; transform: number[]; width: number }>): TextRow[] {
  const rows: TextRow[] = [];

  for (const item of items) {
    if (!item.str.trim()) continue;
    const y = item.transform[5];
    const x = item.transform[4];

    let foundRow = false;
    for (const row of rows) {
      if (Math.abs(row.y - y) < Y_TOLERANCE) {
        row.items.push({ x, width: item.width, str: item.str });
        foundRow = true;
        break;
      }
    }

    if (!foundRow) {
      rows.push({ y, items: [{ x, width: item.width, str: item.str }] });
    }
  }

  // Sort rows top-to-bottom (higher Y = higher on page in PDF coordinates)
  rows.sort((a, b) => b.y - a.y);

  // Sort items within each row left-to-right
  for (const row of rows) {
    row.items.sort((a, b) => a.x - b.x);
  }

  return rows;
}

/**
 * Detects if the page has a two-column layout by analyzing X-coordinate distribution.
 * Returns the column boundary X-coordinate, or null if single-column.
 */
function detectColumnBoundary(rows: TextRow[], pageWidth: number): number | null {
  if (rows.length < MIN_ROWS_FOR_COLUMN || pageWidth <= 0) return null;

  // Count rows that have items on both sides of potential boundaries
  // Scan across the page width to find a consistent gap
  const binCount = 50;
  const binWidth = pageWidth / binCount;
  const coverage = new Array<number>(binCount).fill(0);

  for (const row of rows) {
    for (const item of row.items) {
      const startBin = Math.max(0, Math.floor(item.x / binWidth));
      const endBin = Math.min(binCount - 1, Math.floor((item.x + item.width) / binWidth));
      for (let b = startBin; b <= endBin; b++) {
        coverage[b]++;
      }
    }
  }

  // Find the largest gap in the middle 60% of the page
  const searchStart = Math.floor(binCount * 0.2);
  const searchEnd = Math.floor(binCount * 0.8);

  let bestGapStart = -1;
  let bestGapEnd = -1;
  let bestGapWidth = 0;

  let gapStart = -1;
  for (let i = searchStart; i <= searchEnd; i++) {
    if (coverage[i] === 0) {
      if (gapStart === -1) gapStart = i;
    } else {
      if (gapStart !== -1) {
        const gapWidth = i - gapStart;
        if (gapWidth > bestGapWidth) {
          bestGapWidth = gapWidth;
          bestGapStart = gapStart;
          bestGapEnd = i;
        }
        gapStart = -1;
      }
    }
  }
  // Check if gap extends to searchEnd
  if (gapStart !== -1) {
    const gapWidth = searchEnd - gapStart + 1;
    if (gapWidth > bestGapWidth) {
      bestGapWidth = gapWidth;
      bestGapStart = gapStart;
      bestGapEnd = searchEnd + 1;
    }
  }

  // Check if gap is wide enough
  const gapFraction = bestGapWidth / binCount;
  if (gapFraction < COLUMN_GAP_THRESHOLD) return null;

  // The boundary is at the midpoint of the gap
  const boundary = ((bestGapStart + bestGapEnd) / 2) * binWidth;

  // Verify both sides have substantial content
  let leftRowCount = 0;
  let rightRowCount = 0;
  for (const row of rows) {
    const hasLeft = row.items.some(item => item.x < boundary);
    const hasRight = row.items.some(item => item.x >= boundary);
    if (hasLeft) leftRowCount++;
    if (hasRight) rightRowCount++;
  }

  // Both columns need meaningful content
  if (leftRowCount < MIN_ROWS_FOR_COLUMN || rightRowCount < MIN_ROWS_FOR_COLUMN) return null;

  return boundary;
}

/**
 * Renders a page with column-aware text extraction.
 * Detects two-column layouts and reads left column first, then right column.
 */
async function columnAwareRender(pageData: { getTextContent: (opts?: Record<string, boolean>) => Promise<{ items: Array<{ str: string; transform: number[]; width: number; height: number }> }> }): Promise<string> {
  const textContent = await pageData.getTextContent({
    normalizeWhitespace: false,
    disableCombineTextItems: false,
  });

  if (!textContent.items || textContent.items.length === 0) {
    return '';
  }

  const rows = groupIntoRows(textContent.items);

  // Determine page width from the rightmost text item
  let pageWidth = 0;
  for (const row of rows) {
    for (const item of row.items) {
      pageWidth = Math.max(pageWidth, item.x + item.width);
    }
  }

  const boundary = detectColumnBoundary(rows, pageWidth);

  if (boundary !== null) {
    // Two-column layout: read left column top-to-bottom, then right column
    const leftLines: string[] = [];
    const rightLines: string[] = [];

    for (const row of rows) {
      const leftItems = row.items.filter(item => item.x < boundary);
      const rightItems = row.items.filter(item => item.x >= boundary);

      if (leftItems.length > 0) {
        leftLines.push(leftItems.map(i => i.str).join(' '));
      }
      if (rightItems.length > 0) {
        rightLines.push(rightItems.map(i => i.str).join(' '));
      }
    }

    // Mark layout for detection
    return '<!-- layout:two-column -->\n' + leftLines.join('\n') + '\n\n' + rightLines.join('\n');
  }

  // Single-column: render rows in order with proper X-sorting
  const lines: string[] = [];
  for (const row of rows) {
    lines.push(row.items.map(i => i.str).join(' '));
  }

  return lines.join('\n');
}

/**
 * Reads and parses a PDF file to extract its text content.
 * Supports two-column layout detection for better extraction accuracy.
 *
 * @param input - Either a file path (string) or a Buffer containing PDF data
 * @returns A promise that resolves to the extracted text and page count
 * @throws {ResumixError} If the PDF cannot be read or parsed
 */
export async function readPdf(input: string | Buffer): Promise<PdfReadResult> {
  try {
    let buffer: Buffer;

    if (typeof input === 'string') {
      try {
        buffer = await readFile(input);
      } catch (error) {
        const err = error as NodeJS.ErrnoException;
        if (err.code === 'ENOENT') {
          throw new ResumixError(
            `File not found: ${input}`,
            'FILE_NOT_FOUND',
            error as Error
          );
        }
        throw new ResumixError(
          `Failed to read file: ${input}`,
          'FILE_READ_ERROR',
          error as Error
        );
      }
    } else {
      buffer = input;
    }

    try {
      const parsed = await pdfParse(buffer, {
        pagerender: columnAwareRender as Parameters<typeof pdfParse>[1] extends { pagerender?: infer R } ? R : never,
      } as Record<string, unknown>);

      let text = parsed.text;
      let layout: PdfReadResult['layout'] = 'unknown';

      // Check for layout markers
      if (text.includes('<!-- layout:two-column -->')) {
        layout = 'two-column';
        text = text.replace(/<!-- layout:two-column -->\n?/g, '');
      } else {
        layout = 'single-column';
      }

      return {
        text,
        pages: parsed.numpages,
        layout,
      };
    } catch (error) {
      throw new ResumixError(
        'Failed to parse PDF content',
        'PDF_PARSE_ERROR',
        error as Error
      );
    }
  } catch (error) {
    if (error instanceof ResumixError) {
      throw error;
    }
    throw new ResumixError(
      'An unexpected error occurred while reading the PDF',
      'PDF_READ_ERROR',
      error as Error
    );
  }
}
