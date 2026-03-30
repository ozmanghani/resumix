/**
 * Extractor for summary and objective sections from resume.
 */

import { Section } from '../core/section-detector';
import { BaseExtractor } from './base-extractor';
import { removeBullets, mergeSpaces } from '../utils/text-utils';

/**
 * Extracts professional summary and career objective information.
 * Returns both summary and objective if present, cleaning up formatting.
 */
export class SummaryExtractor extends BaseExtractor<{ summary?: string; objective?: string }> {
  /**
   * Extract summary and objective from resume sections.
   */
  extract(sections: Section[]): { summary?: string; objective?: string } {
    const result: { summary?: string; objective?: string } = {};

    // Try to find summary section
    const summarySection = this.findSectionByNames(sections, ['summary', 'professional summary']);
    if (summarySection) {
      result.summary = this.cleanSectionContent(summarySection.content);
    }

    // Try to find objective section
    const objectiveSection = this.findSectionByNames(sections, ['objective', 'career objective']);
    if (objectiveSection) {
      result.objective = this.cleanSectionContent(objectiveSection.content);
    }

    return result;
  }

  /**
   * Clean section content by removing bullets and extra whitespace.
   */
  private cleanSectionContent(content: string): string {
    if (!content || typeof content !== 'string') {
      return '';
    }

    // Remove bullet points
    let cleaned = removeBullets(content);

    // Merge spaces and normalize
    cleaned = mergeSpaces(cleaned);

    // Remove leading/trailing whitespace
    cleaned = cleaned.trim();

    return cleaned;
  }
}
