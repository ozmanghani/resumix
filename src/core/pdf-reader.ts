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
    // Maintain proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ResumixError);
    }
  }
}

/**
 * Reads and parses a PDF file to extract its text content.
 *
 * @param input - Either a file path (string) or a Buffer containing PDF data
 * @returns A promise that resolves to the extracted text and page count
 * @throws {ResumixError} If the PDF cannot be read or parsed
 *
 * @example
 * ```typescript
 * // From file path
 * const result = await readPdf('/path/to/resume.pdf');
 *
 * // From Buffer
 * const buffer = await fs.promises.readFile('/path/to/resume.pdf');
 * const result = await readPdf(buffer);
 * ```
 */
export async function readPdf(input: string | Buffer): Promise<PdfReadResult> {
  try {
    let buffer: Buffer;

    // If input is a string, treat it as a file path
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

    // Parse the PDF buffer
    try {
      const parsed = await pdfParse(buffer);
      return {
        text: parsed.text,
        pages: parsed.numpages,
      };
    } catch (error) {
      throw new ResumixError(
        'Failed to parse PDF content',
        'PDF_PARSE_ERROR',
        error as Error
      );
    }
  } catch (error) {
    // Re-throw if already a ResumixError
    if (error instanceof ResumixError) {
      throw error;
    }
    // Wrap unexpected errors
    throw new ResumixError(
      'An unexpected error occurred while reading the PDF',
      'PDF_READ_ERROR',
      error as Error
    );
  }
}
