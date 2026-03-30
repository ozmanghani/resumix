/**
 * Extractor for awards and honors section from resume.
 */

import { Award } from '../types/resume';
import { Section } from '../core/section-detector';
import { BaseExtractor } from './base-extractor';
import { cleanText, removeBullets } from '../utils/text-utils';
import { parseDate } from '../utils/date-parser';

/**
 * Extracts award and honor information from the awards section.
 * Handles various formats including:
 * - "Award Title - Organization - Date"
 * - "Award Title by Organization (Date)"
 * - "Award Title, Organization, Date, Description"
 */
export class AwardsExtractor extends BaseExtractor<Award[]> {
  /**
   * Extract awards from resume sections.
   */
  extract(sections: Section[]): Award[] {
    const section = this.findSectionByNames(sections, ['awards', 'honors', 'achievements']);

    if (!section) {
      return [];
    }

    return this.parseAwards(section.lines);
  }

  /**
   * Parse award entries from section lines.
   * Awards are typically separated by empty lines or new award indicators.
   */
  private parseAwards(lines: string[]): Award[] {
    const awards: Award[] = [];
    let currentAward: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();

      // Empty line indicates end of an award entry
      if (trimmed.length === 0) {
        if (currentAward.length > 0) {
          const award = this.parseAwardBlock(currentAward);
          if (award.title) {
            awards.push(award);
          }
          currentAward = [];
        }
      } else {
        currentAward.push(line);
      }
    }

    // Don't forget the last award
    if (currentAward.length > 0) {
      const award = this.parseAwardBlock(currentAward);
      if (award.title) {
        awards.push(award);
      }
    }

    return awards;
  }

  /**
   * Parse a single award block (may be multiple lines).
   */
  private parseAwardBlock(lines: string[]): Award {
    const award: Award = {};

    if (lines.length === 0) {
      return award;
    }

    // First line is typically the award title
    const firstLine = removeBullets(lines[0]).trim();
    const fullText = lines.map((l) => removeBullets(l).trim()).join(' ');

    // Try to parse components separated by common delimiters
    const parts = firstLine.split(/\s*[-–|]\s*/);

    if (parts.length > 0) {
      // First part is the title
      award.title = cleanText(parts[0]).trim();

      // Process remaining parts
      for (let i = 1; i < parts.length; i++) {
        const part = cleanText(parts[i]).trim();

        // Check if it looks like a date
        const dateStr = parseDate(part);
        if (dateStr) {
          award.date = dateStr;
        }
        // Otherwise treat as issuer if not already set
        else if (!award.issuer) {
          award.issuer = part;
        }
      }
    }

    // Try to extract date from parentheses
    const parenMatch = fullText.match(/\(([^)]*\d{4}[^)]*)\)/);
    if (parenMatch && !award.date) {
      const dateStr = parseDate(parenMatch[1]);
      if (dateStr) {
        award.date = dateStr;
      }
    }

    // Extract issuer from "by Organization" pattern
    const byMatch = fullText.match(/\bby\s+([^.,(]+)/i);
    if (byMatch && !award.issuer) {
      award.issuer = cleanText(byMatch[1]).trim();
    }

    // Extract issuer from "Organization awarded" pattern
    const awardedMatch = fullText.match(/([^.,(]+)\s+awarded/i);
    if (awardedMatch && !award.issuer) {
      award.issuer = cleanText(awardedMatch[1]).trim();
    }

    // Description is any remaining text after title, issuer, and date
    let description = fullText
      .replace(new RegExp(`^${award.title}`), '')
      .replace(/[-–|]/g, '')
      .replace(award.issuer ? award.issuer : '', '')
      .replace(award.date ? award.date : '', '')
      .replace(/\(([^)]*\d{4}[^)]*)\)/, '')
      .replace(/\bby\s+[^.,(]+/i, '')
      .replace(/[^.,(]+\s+awarded/i, '')
      .trim();

    // Clean up extra spaces
    description = description.replace(/\s+/g, ' ').trim();

    if (description.length > 0 && description.length < 500) {
      award.description = description;
    }

    return award;
  }
}
