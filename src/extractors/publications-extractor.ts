/**
 * Extractor for publications section from resume.
 */

import { Publication } from '../types/resume';
import { Section } from '../core/section-detector';
import { BaseExtractor } from './base-extractor';
import { cleanText, removeBullets } from '../utils/text-utils';
import { parseDate } from '../utils/date-parser';
import { URL_PATTERN } from '../utils/patterns';

/**
 * Extracts publication information from the publications section.
 * Handles various formats including:
 * - "Publication Title - Publisher - Date"
 * - "Title by Author, Publisher, Date"
 * - URLs and descriptions
 */
export class PublicationsExtractor extends BaseExtractor<Publication[]> {
  /**
   * Extract publications from resume sections.
   */
  extract(sections: Section[]): Publication[] {
    const section = this.findSectionByNames(sections, [
      'publications',
      'published work',
      'articles',
      'papers',
    ]);

    if (!section) {
      return [];
    }

    return this.parsePublications(section.lines);
  }

  /**
   * Parse publication entries from section lines.
   * Publications are typically separated by empty lines.
   */
  private parsePublications(lines: string[]): Publication[] {
    const publications: Publication[] = [];
    let currentPub: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();

      // Empty line indicates end of a publication entry
      if (trimmed.length === 0) {
        if (currentPub.length > 0) {
          const pub = this.parsePublicationBlock(currentPub);
          if (pub.title) {
            publications.push(pub);
          }
          currentPub = [];
        }
      } else {
        currentPub.push(line);
      }
    }

    // Don't forget the last publication
    if (currentPub.length > 0) {
      const pub = this.parsePublicationBlock(currentPub);
      if (pub.title) {
        publications.push(pub);
      }
    }

    return publications;
  }

  /**
   * Parse a single publication block (may be multiple lines).
   */
  private parsePublicationBlock(lines: string[]): Publication {
    const publication: Publication = {};

    if (lines.length === 0) {
      return publication;
    }

    // Combine all lines into a single text for processing
    const fullText = lines.map((l) => removeBullets(l).trim()).join(' ');

    // Extract URLs first
    const urlMatches = fullText.match(URL_PATTERN);
    if (urlMatches && urlMatches.length > 0) {
      publication.url = urlMatches[0];
    }

    // Try to parse components separated by common delimiters
    const parts = fullText.split(/\s*[-–|,]\s*/);

    if (parts.length > 0) {
      // First part is typically the title
      publication.title = cleanText(parts[0]).trim();

      // Process remaining parts
      for (let i = 1; i < parts.length; i++) {
        const part = cleanText(parts[i]).trim();

        // Check if it looks like a date
        const dateStr = parseDate(part);
        if (dateStr) {
          publication.date = dateStr;
        }
        // Check if it looks like a publisher
        else if (!publication.publisher && !this.looksLikeDate(part)) {
          publication.publisher = part;
        }
      }
    }

    // Try to extract title more intelligently if it seems too short
    if (!publication.title || publication.title.length < 3) {
      const titleMatch = fullText.match(/^([^-–|,]+)/);
      if (titleMatch) {
        publication.title = cleanText(titleMatch[1]).trim();
      }
    }

    // Try to extract publisher from "published in" pattern
    const publishedMatch = fullText.match(/published\s+in\s+([^,.(]+)/i);
    if (publishedMatch && !publication.publisher) {
      publication.publisher = cleanText(publishedMatch[1]).trim();
    }

    // Extract description (everything after the main components)
    let description = fullText
      .replace(publication.title ? new RegExp(`^${publication.title}`, 'i') : '', '')
      .replace(/[-–|,]/g, ' ')
      .replace(publication.publisher ? publication.publisher : '', '')
      .replace(publication.date ? publication.date : '', '')
      .replace(URL_PATTERN, '')
      .replace(/published\s+in\s+[^,.]+/i, '')
      .trim();

    description = description.replace(/\s+/g, ' ').trim();

    if (description.length > 0 && description.length < 500) {
      publication.description = description;
    }

    return publication;
  }

  /**
   * Check if a string appears to be a date.
   */
  private looksLikeDate(str: string): boolean {
    return /\d{4}|\d{1,2}\/\d{1,2}|\w+\s+\d{1,2}/.test(str);
  }
}
