/**
 * Extractor for education information from resume.
 * Identifies institutions, degrees, fields, dates, and academic achievements.
 */

import { Education } from '../types/resume';
import { BaseExtractor, Section } from './base-extractor';

/**
 * Common degree patterns to recognize (without global flag to avoid alternating true/false).
 */
const DEGREE_PATTERNS = [
  /\b(?:b\.?a\.?|b\.?s\.?|bachelor|bs|ba)\b/i,
  /\b(?:m\.?a\.?|m\.?s\.?|master|ms|ma)\b/i,
  /\b(?:ph\.?d\.?|doctorate|phd)\b/i,
  /\b(?:associate|a\.?a\.?|a\.?s\.?|aa|as)\b/i,
  /\b(?:diploma|certificate)\b/i,
];

/**
 * GPA pattern matching.
 */
const GPA_PATTERN = /(?:gpa|gp)\s*[:=]?\s*(\d\.?\d{0,2})/i;

/**
 * Date range pattern for education.
 */
const DATE_RANGE_PATTERN = /(\d{1,2}\/\d{1,4}|\d{4})\s*[-–to]+\s*(\d{1,2}\/\d{1,4}|present|current|now|\d{4})/i;
const YEAR_PATTERN = /\b(20\d{2}|19\d{2})\b/g;

/**
 * Institution keywords to detect institution names.
 */
const INSTITUTION_KEYWORDS = /university|college|institute|school|academy|polytechnic|vocational|technical|grad\s+school/i;

/**
 * Bullet pattern to detect bullet points.
 */
const BULLET_PATTERN = /^[\s]*[-•*+]\s+/;

/**
 * EducationExtractor extracts education entries from resume.
 */
export class EducationExtractor extends BaseExtractor<Education[]> {
  /**
   * Extract education entries from resume sections.
   *
   * @param sections - Array of resume sections
   * @returns Array of extracted education entries
   */
  extract(sections: Section[]): Education[] {
    const educationSection = this.findSectionByNames(sections, [
      'education',
      'academic',
      'schooling',
    ]);

    if (!educationSection) {
      return [];
    }

    const entries: Education[] = [];
    const lines = educationSection.lines;

    // Split content into education blocks (separated by blank lines or new degree/institution patterns)
    const blocks = this.splitIntoBlocks(lines);

    for (const block of blocks) {
      const education = this.parseEducationBlock(block);
      if (education.degree || education.institution) {
        entries.push(education);
      }
    }

    return entries;
  }

  /**
   * Split lines into education entry blocks.
   * Blocks are separated by blank lines or when encountering a new institution/degree line.
   * Properly handles bullet points within education entries.
   *
   * @param lines - Lines from education section
   * @returns Array of line blocks
   */
  private splitIntoBlocks(lines: string[]): string[][] {
    const blocks: string[][] = [];
    let currentBlock: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();

      // Handle blank lines
      if (trimmed === '') {
        if (currentBlock.length > 0) {
          blocks.push(currentBlock);
          currentBlock = [];
        }
        continue;
      }

      // Check if this line is a bullet point
      const isBullet = BULLET_PATTERN.test(trimmed);

      // Check if this line looks like a new degree
      const looksLikeDegree = this.isDegreePattern(trimmed);

      // If we have content and encounter a new degree line, start a new block
      // when the current block already has a degree (indicating a complete entry).
      // Institution lines after a degree belong to the same entry, so don't split on those alone.
      if (
        currentBlock.length > 0 &&
        !isBullet &&
        !this.isDateLine(trimmed) &&
        looksLikeDegree &&
        currentBlock.some((line) => this.isDegreePattern(line))
      ) {
        // Current block already has a degree and we see a new one - start new block
        blocks.push(currentBlock);
        currentBlock = [trimmed];
        continue;
      }

      // Add line to current block
      currentBlock.push(trimmed);
    }

    if (currentBlock.length > 0) {
      blocks.push(currentBlock);
    }

    return blocks;
  }

  /**
   * Parse a single education block into an Education object.
   *
   * @param block - Lines comprising a single education entry
   * @returns Parsed education entry
   */
  private parseEducationBlock(block: string[]): Education {
    const education: Education = {};
    const text = block.join(' ');

    // Extract degree (look for full degree line)
    const degreeLine = this.extractDegreeLine(block);
    if (degreeLine) {
      education.degree = degreeLine;
    }

    // Extract GPA
    const gpaMatch = text.match(GPA_PATTERN);
    if (gpaMatch) {
      education.gpa = gpaMatch[1] || gpaMatch[0];
    }

    // Extract institution - find a line that contains institution keywords
    // or is a prominent non-bullet, non-date line
    const institution = this.extractInstitution(block);
    if (institution) {
      education.institution = institution;
    }

    // Extract dates
    const dateRange = this.extractDateRange(text);
    if (dateRange) {
      education.startDate = dateRange.start;
      education.endDate = dateRange.end;
    }

    // Extract field of study from text containing degree
    if (education.degree) {
      const field = this.extractFieldOfStudy(text, education.degree);
      // Avoid setting field to the institution name
      if (field && field !== education.institution) {
        education.field = field;
      }
    }

    // Extract honors
    const honors = this.extractHonors(text);
    if (honors) {
      education.honors = honors;
    }

    // Extract description (non-metadata text)
    education.description = this.extractDescription(block);

    return education;
  }

  /**
   * Extract the full degree line from the block.
   * Looks for lines containing degree keywords.
   *
   * @param block - Lines of education block
   * @returns Degree description or undefined
   */
  private extractDegreeLine(block: string[]): string | undefined {
    for (const line of block) {
      // Skip bullet points and dates
      if (BULLET_PATTERN.test(line) || this.isDateLine(line)) {
        continue;
      }
      if (this.isDegreePattern(line)) {
        return line;
      }
    }
    return undefined;
  }

  /**
   * Extract institution name from block.
   * Looks for lines containing institution keywords or prominent non-bullet lines.
   * Never picks a line starting with a bullet or date line.
   *
   * @param block - Lines of education block
   * @returns Institution name or undefined
   */
  private extractInstitution(block: string[]): string | undefined {
    // First pass: look for lines with institution keywords
    for (const line of block) {
      // Skip bullet points and date lines
      if (BULLET_PATTERN.test(line) || this.isDateLine(line)) {
        continue;
      }
      if (INSTITUTION_KEYWORDS.test(line)) {
        return line;
      }
    }

    // Second pass: find the first prominent non-bullet, non-date, non-degree line
    for (const line of block) {
      // Skip bullet points, date lines, and degree lines
      if (BULLET_PATTERN.test(line) || this.isDateLine(line) || this.isDegreePattern(line)) {
        continue;
      }
      // This is likely the institution name
      return line;
    }

    return undefined;
  }

  /**
   * Check if a line appears to be a date line.
   *
   * @param line - Line to check
   * @returns True if line looks like a date
   */
  private isDateLine(line: string): boolean {
    return /\d{4}|\d{1,2}\/\d{1,4}|present|current|now/i.test(line);
  }

  /**
   * Check if a line matches a degree pattern.
   * Does not use global flag to avoid alternating true/false results.
   *
   * @param line - Line to check
   * @returns True if line matches degree pattern
   */
  private isDegreePattern(line: string): boolean {
    return DEGREE_PATTERNS.some((pattern) => pattern.test(line));
  }

  /**
   * Extract date range from text.
   *
   * @param text - Text to search
   * @returns Object with start and end dates or undefined
   */
  private extractDateRange(text: string): { start: string; end: string } | undefined {
    const match = text.match(DATE_RANGE_PATTERN);
    if (match) {
      const parts = match[0].split(/[-–to]+/i).map((p) => p.trim());
      return {
        start: parts[0],
        end: parts[1] || '',
      };
    }

    // Try to find just years
    const yearMatches = text.match(YEAR_PATTERN);
    if (yearMatches && yearMatches.length >= 1) {
      return {
        start: yearMatches[0],
        end: yearMatches.length > 1 ? yearMatches[1] : '',
      };
    }

    return undefined;
  }

  /**
   * Extract field of study from degree text.
   *
   * @param text - Full text of education entry
   * @param degree - Identified degree
   * @returns Field of study or undefined
   */
  private extractFieldOfStudy(text: string, degree: string): string | undefined {
    // Look for "in [field]" pattern or text near the degree
    const inPattern = /(?:in|of)\s+([a-zA-Z\s&]+?)(?:\.|,|;|$)/i;
    const match = text.match(inPattern);
    if (match) {
      return match[1].trim();
    }

    // Extract words after degree
    const degreeIndex = text.toLowerCase().indexOf(degree.toLowerCase());
    if (degreeIndex !== -1) {
      const afterDegree = text
        .substring(degreeIndex + degree.length)
        .trim()
        .split(/[,;]|\d{4}/)[0]
        .trim();
      if (afterDegree && !this.isDateLine(afterDegree) && !INSTITUTION_KEYWORDS.test(afterDegree) && afterDegree.length < 50) {
        return afterDegree;
      }
    }

    return undefined;
  }

  /**
   * Extract academic honors from text.
   *
   * @param text - Text to search
   * @returns Honors string or undefined
   */
  private extractHonors(text: string): string | undefined {
    const honorPatterns = [
      /(?:cum\s+laude|summa\s+cum\s+laude|magna\s+cum\s+laude)/i,
      /(?:honors?|distinction)/i,
      /(?:dean'?s?\s+list)/i,
    ];

    for (const pattern of honorPatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[0];
      }
    }

    return undefined;
  }

  /**
   * Extract description from education block.
   * Filters out degree, date, GPA, institution lines, and bullet points.
   *
   * @param block - Lines of education block
   * @returns Description or undefined
   */
  private extractDescription(block: string[]): string | undefined {
    // Get the institution first (if any) to avoid including it in description
    const institution = this.extractInstitution(block);

    // Filter out degree, date, GPA, institution lines, and bullet points
    const descLines = block.filter((line) => {
      // Skip bullet points
      if (BULLET_PATTERN.test(line)) {
        return false;
      }
      // Skip dates
      if (this.isDateLine(line)) {
        return false;
      }
      // Skip GPA lines
      if (GPA_PATTERN.test(line)) {
        return false;
      }
      // Skip degree lines
      if (this.isDegreePattern(line)) {
        return false;
      }
      // Skip institution lines
      if (INSTITUTION_KEYWORDS.test(line)) {
        return false;
      }
      // Skip the exact institution line if found
      if (institution && line === institution) {
        return false;
      }
      return true;
    });

    return descLines.length > 0 ? descLines.join(' ') : undefined;
  }
}
