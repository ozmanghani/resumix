/**
 * Date parsing utilities for resume text
 * Handles various date formats and date ranges commonly found in resumes
 */

/**
 * Map of month names (full and abbreviated) to month numbers (1-12)
 */
export const MONTH_MAP: Record<string, number> = {
  january: 1,
  jan: 1,
  february: 2,
  feb: 2,
  march: 3,
  mar: 3,
  april: 4,
  apr: 4,
  may: 5,
  june: 6,
  jun: 6,
  july: 7,
  jul: 7,
  august: 8,
  aug: 8,
  september: 9,
  sep: 9,
  sept: 9,
  october: 10,
  oct: 10,
  november: 11,
  nov: 11,
  december: 12,
  dec: 12,
};

/**
 * Map of season names to approximate month numbers (start of season)
 */
const SEASON_MAP: Record<string, number> = {
  spring: 3,
  summer: 6,
  fall: 9,
  autumn: 9,
  winter: 12,
};

/**
 * Parses a date string into a normalized format (YYYY-MM or YYYY)
 *
 * Handles various date formats including:
 * - 'Jan 2020', 'January 2020'
 * - '01/2020', '1/2020'
 * - '2020-01', '2020'
 * - 'Spring 2020', 'Summer 2020'
 * - 'January 15 2020', 'Jan 15 2020'
 *
 * @param text - The date string to parse
 * @returns Normalized date string in 'YYYY-MM' or 'YYYY' format, or undefined if unparseable
 */
export function parseDate(text: string): string | undefined {
  if (!text || typeof text !== 'string') {
    return undefined;
  }

  const trimmedText = text.trim();

  // Try to match Month YYYY (e.g., "January 2020" or "Jan 2020")
  const monthYearMatch = trimmedText.match(
    /^(?:january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)\s+(\d{4})$/i,
  );
  if (monthYearMatch) {
    const monthName = trimmedText.split(/\s+/)[0].toLowerCase();
    const year = monthYearMatch[1];
    const month = MONTH_MAP[monthName];
    if (month) {
      return `${year}-${String(month).padStart(2, '0')}`;
    }
  }

  // Try to match MM/YYYY or M/YYYY (e.g., "01/2020" or "1/2020")
  const slashDateMatch = trimmedText.match(/^(0?[1-9]|1[0-2])\/(\d{4})$/);
  if (slashDateMatch) {
    const month = String(parseInt(slashDateMatch[1], 10)).padStart(2, '0');
    const year = slashDateMatch[2];
    return `${year}-${month}`;
  }

  // Try to match MM-YYYY or M-YYYY (e.g., "01-2020" or "1-2020")
  const dashDateMatch = trimmedText.match(/^(0?[1-9]|1[0-2])-(\d{4})$/);
  if (dashDateMatch) {
    const month = String(parseInt(dashDateMatch[1], 10)).padStart(2, '0');
    const year = dashDateMatch[2];
    return `${year}-${month}`;
  }

  // Try to match YYYY-MM (e.g., "2020-01")
  const isoDateMatch = trimmedText.match(/^(\d{4})-(0?[1-9]|1[0-2])$/);
  if (isoDateMatch) {
    const year = isoDateMatch[1];
    const month = String(parseInt(isoDateMatch[2], 10)).padStart(2, '0');
    return `${year}-${month}`;
  }

  // Try to match Month DD YYYY (e.g., "January 15 2020" or "Jan 15 2020")
  const fullDateMatch = trimmedText.match(
    /^(?:january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)\s+\d{1,2},?\s+(\d{4})$/i,
  );
  if (fullDateMatch) {
    const monthName = trimmedText.split(/\s+/)[0].toLowerCase();
    const year = fullDateMatch[1];
    const month = MONTH_MAP[monthName];
    if (month) {
      return `${year}-${String(month).padStart(2, '0')}`;
    }
  }

  // Try to match Season YYYY (e.g., "Spring 2020")
  const seasonMatch = trimmedText.match(/^(spring|summer|fall|autumn|winter)\s+(\d{4})$/i);
  if (seasonMatch) {
    const seasonName = seasonMatch[1].toLowerCase();
    const year = seasonMatch[2];
    const month = SEASON_MAP[seasonName];
    if (month) {
      return `${year}-${String(month).padStart(2, '0')}`;
    }
  }

  // Try to match standalone YYYY (e.g., "2020")
  const yearMatch = trimmedText.match(/^(\d{4})$/);
  if (yearMatch) {
    return yearMatch[1];
  }

  return undefined;
}

/**
 * Parses a date range string and extracts start and end dates
 *
 * Handles various formats including:
 * - 'Jan 2020 - Present'
 * - '2019 - 2021'
 * - 'January 2020 to December 2021'
 * - 'Jan 2020 - Current'
 * - '2020 - Now'
 *
 * @param text - The date range string to parse
 * @returns Object containing startDate, endDate (in YYYY-MM or YYYY format), and current flag
 */
export function parseDateRange(text: string): { startDate?: string; endDate?: string; current?: boolean } {
  if (!text || typeof text !== 'string') {
    return {};
  }

  const trimmedText = text.trim();

  // Check if the range contains "Present", "Current", or "Now"
  const isCurrent = /\b(present|current|now)\b/i.test(trimmedText);

  // Split on common range separators
  const parts = trimmedText
    .split(/\s*(?:–|-|to|through|till)\s*/i)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  const result: { startDate?: string; endDate?: string; current?: boolean } = {};

  if (parts.length >= 1) {
    // Parse the first part as the start date
    const startDateText = parts[0];
    const startDate = parseDate(startDateText);
    if (startDate) {
      result.startDate = startDate;
    }
  }

  if (parts.length >= 2) {
    // Parse the second part as the end date (if it's not "Present", "Current", etc.)
    const endDateText = parts[1];
    if (!/\b(present|current|now)\b/i.test(endDateText)) {
      const endDate = parseDate(endDateText);
      if (endDate) {
        result.endDate = endDate;
      }
    }
  }

  // Set current flag if applicable
  if (isCurrent) {
    result.current = true;
  }

  return result;
}
