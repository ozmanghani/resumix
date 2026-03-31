/**
 * Extractor for work experience from resume.
 * Identifies job titles, companies, dates, locations, and accomplishments.
 * Handles dateless entries and ambiguous date formats.
 */

import { Experience } from '../types/resume';
import { BaseExtractor, Section } from './base-extractor';

/**
 * Pattern for matching full employment date ranges.
 * Matches: "2024 – Present", "Jan 2020 - Dec 2022", "2020-2022", etc.
 */
const DATE_RANGE_PATTERN = /(?:january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)?\s*\d{4}\s*(?:–|-|to)\s*(?:(?:january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)\s*\d{4}|present|current|now|\d{4})/i;

/**
 * Pattern for detecting bullet points.
 */
const BULLET_PATTERN = /^[\s]*[-•*+]\s+/;

/**
 * Pattern for detecting "current" or "present" in dates.
 */
const CURRENT_PATTERN = /present|current|now/i;

/**
 * Pattern for detecting year ranges in text (e.g., "2024 – Present", "2020 - 2022")
 */
const YEAR_RANGE_PATTERN = /(\d{4})\s*(?:–|-|to)\s*(present|current|now|\d{4})/i;

/**
 * Pattern for matching "Month Year" standalone dates.
 */
const MONTH_YEAR_PATTERN = /\b(?:january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)\s+\d{4}\b/i;

/**
 * Pattern for "Title at Company" or "Title - Company" format.
 */
const TITLE_COMPANY_DASH = /^.+\s*[—–-]\s*.+$/;
const TITLE_COMPANY_AT = /^.+\s+at\s+.+$/i;

/**
 * ExperienceExtractor extracts work experience entries from resume.
 */
export class ExperienceExtractor extends BaseExtractor<Experience[]> {
  /**
   * Extract experience entries from resume sections.
   *
   * @param sections - Array of resume sections
   * @returns Array of extracted experience entries
   */
  extract(sections: Section[]): Experience[] {
    const experienceSection = this.findSectionByNames(sections, [
      'experience',
      'employment',
      'work',
      'professional experience',
      'career',
    ]);

    if (!experienceSection) {
      return [];
    }

    const entries: Experience[] = [];
    const lines = experienceSection.lines;

    // Split content into job blocks using date patterns as separators
    const blocks = this.splitIntoBlocks(lines);

    for (const block of blocks) {
      const experience = this.parseExperienceBlock(block);
      if (experience.title || experience.company) {
        entries.push(experience);
      }
    }

    return entries;
  }

  /**
   * Split lines into experience entry blocks.
   * Detects new job entries by looking for:
   * - Lines containing date patterns
   * - Blank lines separating entries
   * - Job header patterns (Title - Company, Title at Company)
   * - Short non-bullet lines after bullet points
   *
   * @param lines - Lines from experience section
   * @returns Array of line blocks
   */
  private splitIntoBlocks(lines: string[]): string[][] {
    const blocks: string[][] = [];
    let currentBlock: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();

      // Check if this is a blank line
      if (trimmed === '') {
        if (currentBlock.length > 0) {
          blocks.push(currentBlock);
          currentBlock = [];
        }
        continue;
      }

      const isBullet = BULLET_PATTERN.test(trimmed);

      // If we already have a block with content, check if this line starts a new entry
      if (currentBlock.length > 0 && !isBullet) {
        const hasBulletsOrDates =
          currentBlock.some((line) => BULLET_PATTERN.test(line)) ||
          currentBlock.some((line) => this.looksLikeDate(line));
        const hasContent = currentBlock.length >= 2;

        // Start a new block if current block has meaningful content
        // and this line looks like a new job entry header
        if (
          (hasBulletsOrDates || hasContent) &&
          this.looksLikeJobHeader(trimmed)
        ) {
          blocks.push(currentBlock);
          currentBlock = [trimmed];
          continue;
        }
      }

      // Add to current block
      currentBlock.push(trimmed);
    }

    if (currentBlock.length > 0) {
      blocks.push(currentBlock);
    }

    return blocks;
  }

  /**
   * Check if a line looks like a job entry header.
   * Matches patterns like:
   * - "Title - Company"
   * - "Title at Company"
   * - Short title-case lines (likely job titles)
   * - Lines with date patterns
   */
  private looksLikeJobHeader(line: string): boolean {
    // Skip bullet points
    if (BULLET_PATTERN.test(line)) return false;

    // Contains a date range
    if (this.looksLikeDate(line)) return true;

    // "Title - Company" or "Title at Company" format
    if (TITLE_COMPANY_DASH.test(line) && line.length < 80) return true;
    if (TITLE_COMPANY_AT.test(line)) return true;

    // Short line that is NOT a continuation sentence
    // (starts with uppercase, doesn't start with lowercase connectors)
    if (
      line.length < 60 &&
      /^[A-Z]/.test(line) &&
      !/^(?:and|or|but|the|a|an|in|at|to|for|of|with)\s/i.test(line) &&
      !line.endsWith(',')
    ) {
      return true;
    }

    return false;
  }

  /**
   * Parse a single experience block into an Experience object.
   *
   * @param block - Lines comprising a single experience entry
   * @returns Parsed experience entry
   */
  private parseExperienceBlock(block: string[]): Experience {
    const experience: Experience = {};
    const fullText = block.join(' ');

    // Extract dates and determine if current
    const dateInfo = this.extractDates(fullText);
    if (dateInfo) {
      experience.startDate = dateInfo.start;
      experience.endDate = dateInfo.end;
      experience.current = dateInfo.isCurrent;
    }

    // Extract company and title from first lines (before bullets typically)
    const nonBulletLines = block.filter((line) => !BULLET_PATTERN.test(line));
    if (nonBulletLines.length > 0) {
      const titleCompany = this.extractTitleAndCompany(nonBulletLines);
      if (titleCompany) {
        experience.title = titleCompany.title;
        experience.company = titleCompany.company;
      }
    }

    // Extract location
    const location = this.extractLocation(nonBulletLines);
    if (location) {
      experience.location = location;
    }

    // Extract highlights and description
    const bulletLines = block.filter((line) => BULLET_PATTERN.test(line));
    if (bulletLines.length > 0) {
      const highlights = bulletLines.map((line) =>
        line.replace(BULLET_PATTERN, '').trim()
      );
      experience.highlights = highlights;

      // Create description from highlights
      if (highlights.length > 0) {
        experience.description = highlights.join(' ');
      }
    } else {
      // If no bullets, try to extract description from remaining lines
      const descLines = nonBulletLines.slice(1);
      if (descLines.length > 0) {
        experience.description = descLines.join(' ');
      }
    }

    return experience;
  }

  /**
   * Extract and parse full date range from text.
   * Handles various formats including:
   * - "2024 – Present", "January 2020 - December 2022"
   * - Standalone years: "2023"
   * - Month/Year without range: "Jan 2023"
   *
   * @param text - Text containing dates
   * @returns Object with start, end, and isCurrent flag or undefined
   */
  private extractDates(
    text: string
  ): { start: string; end: string; isCurrent: boolean } | undefined {
    // Try to match year range pattern first (most common)
    const yearRangeMatch = text.match(YEAR_RANGE_PATTERN);
    if (yearRangeMatch) {
      const startYear = yearRangeMatch[1];
      const endPart = yearRangeMatch[2];
      const isCurrent = CURRENT_PATTERN.test(endPart);

      return {
        start: startYear,
        end: isCurrent ? '' : endPart,
        isCurrent,
      };
    }

    // Try to match full date range pattern
    const fullMatch = text.match(DATE_RANGE_PATTERN);
    if (fullMatch) {
      const dateStr = fullMatch[0];
      // Try to split by dash or "to"
      const parts = dateStr.split(/\s*(?:–|-|to)\s*/i).map((p) => p.trim());
      if (parts.length >= 2) {
        const isCurrent = CURRENT_PATTERN.test(parts[1]);
        return {
          start: parts[0],
          end: isCurrent ? '' : parts[1],
          isCurrent,
        };
      } else if (parts.length === 1) {
        // Single date found
        return {
          start: parts[0],
          end: '',
          isCurrent: false,
        };
      }
    }

    // Try to match a standalone "Month Year" date
    const monthYearMatch = text.match(MONTH_YEAR_PATTERN);
    if (monthYearMatch) {
      return {
        start: monthYearMatch[0],
        end: '',
        isCurrent: false,
      };
    }

    // Fallback: try to find a standalone year
    const singleYearMatch = text.match(/\b(20\d{2}|19\d{2})\b/);
    if (singleYearMatch) {
      return {
        start: singleYearMatch[1],
        end: '',
        isCurrent: false,
      };
    }

    return undefined;
  }

  /**
   * Extract job title and company from initial non-bullet lines.
   * Handles formats like:
   * - "Title — Company (Abbrev)"
   * - "Title — Company, Location"
   * - "Title" on one line, "Company, Location" on the next
   *
   * @param lines - Non-bullet lines from block
   * @returns Object with title and company or undefined
   */
  private extractTitleAndCompany(
    lines: string[]
  ): { title: string | undefined; company: string | undefined } | undefined {
    if (lines.length === 0) {
      return undefined;
    }

    let title: string | undefined;
    let company: string | undefined;

    const firstLine = lines[0];

    // Check for "Title at Company" format
    const atMatch = firstLine.match(/^(.+?)\s+at\s+(.+)$/i);
    if (atMatch) {
      title = atMatch[1].trim();
      company = atMatch[2].trim();
      return { title, company };
    }

    // Check for "Title — Company" or "Title - Company" format (em dash, en dash, hyphen)
    const dashMatch = firstLine.match(/^(.+?)\s*[—–-]\s*(.+)$/);
    if (dashMatch) {
      const part1 = dashMatch[1].trim();
      const part2 = dashMatch[2].trim();

      // Try to determine which is title and which is company
      // Company indicators: LLC, Inc, Ltd, Corp, Company, University, College, etc.
      const companyIndicators = /(?:llc|inc|ltd|corp|company|co\.?|corporation|university|college|institute|school|academy)/i;
      const part2HasCompanyIndicator = companyIndicators.test(part2);
      const part1HasCompanyIndicator = companyIndicators.test(part1);

      if (part2HasCompanyIndicator || !part1HasCompanyIndicator) {
        title = part1;
        company = part2;
      } else {
        company = part1;
        title = part2;
      }
      return { title, company };
    }

    // Single line case: assign to title by default
    title = firstLine;

    // Check if second line exists and might be company
    if (lines.length > 1) {
      const secondLine = lines[1];
      if (
        !this.looksLikeDate(secondLine) &&
        !BULLET_PATTERN.test(secondLine)
      ) {
        company = secondLine;
        return { title, company };
      }
    }

    return { title, company };
  }

  /**
   * Extract location from non-bullet lines.
   *
   * @param lines - Non-bullet lines
   * @returns Location string or undefined
   */
  private extractLocation(lines: string[]): string | undefined {
    for (const line of lines) {
      if (this.looksLikeLocation(line)) {
        return line;
      }
    }
    return undefined;
  }

  /**
   * Check if a line looks like a location (city, state/country).
   *
   * @param line - Line to check
   * @returns True if line appears to be a location
   */
  private looksLikeLocation(line: string): boolean {
    // Common location patterns: City, State or City, Country
    const locationPattern = /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s*[A-Z]{2}(?:\s|$)|^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s*[A-Z][a-z\s]+$/;
    return (
      locationPattern.test(line) ||
      /remote|distributed|hybrid/i.test(line)
    );
  }

  /**
   * Check if a line looks like a date.
   * Checks for year ranges like "2024 – Present" or "2023 – 2024"
   *
   * @param line - Line to check
   * @returns True if line appears to contain dates
   */
  private looksLikeDate(line: string): boolean {
    return /\d{4}\s*(?:–|-|to)\s*(?:present|current|now|\d{4})|january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec/i.test(
      line
    );
  }
}
