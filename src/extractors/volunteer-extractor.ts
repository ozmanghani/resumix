/**
 * Extractor for volunteer experience section from resume.
 */

import { VolunteerExperience } from '../types/resume';
import { Section } from '../core/section-detector';
import { BaseExtractor } from './base-extractor';
import { cleanText, removeBullets } from '../utils/text-utils';
import { parseDateRange } from '../utils/date-parser';

/**
 * Extracts volunteer experience information from the volunteer section.
 * Handles various formats similar to work experience:
 * - Organization name and role
 * - Start and end dates
 * - Description of volunteer work
 */
export class VolunteerExtractor extends BaseExtractor<VolunteerExperience[]> {
  /**
   * Extract volunteer experiences from resume sections.
   */
  extract(sections: Section[]): VolunteerExperience[] {
    const section = this.findSectionByNames(sections, ['volunteer', 'volunteering', 'volunteer experience']);

    if (!section) {
      return [];
    }

    return this.parseVolunteerExperiences(section.lines);
  }

  /**
   * Parse volunteer experience entries from section lines.
   * Experiences are typically separated by empty lines or organizational headers.
   */
  private parseVolunteerExperiences(lines: string[]): VolunteerExperience[] {
    const experiences: VolunteerExperience[] = [];
    let currentExp: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();

      // Empty line indicates end of an experience entry
      if (trimmed.length === 0) {
        if (currentExp.length > 0) {
          const exp = this.parseVolunteerBlock(currentExp);
          if (exp.organization || exp.role) {
            experiences.push(exp);
          }
          currentExp = [];
        }
      } else {
        currentExp.push(line);
      }
    }

    // Don't forget the last experience
    if (currentExp.length > 0) {
      const exp = this.parseVolunteerBlock(currentExp);
      if (exp.organization || exp.role) {
        experiences.push(exp);
      }
    }

    return experiences;
  }

  /**
   * Parse a single volunteer experience block (may be multiple lines).
   */
  private parseVolunteerBlock(lines: string[]): VolunteerExperience {
    const experience: VolunteerExperience = {};

    if (lines.length === 0) {
      return experience;
    }

    // Combine all lines
    const fullText = lines.map((l) => l.trim()).join(' ');

    // First line typically contains organization and/or role
    const firstLine = removeBullets(lines[0]).trim();

    // Extract dates from the entire block
    const dateRangeMatch = fullText.match(
      /(\w+\s+\d{4})\s*[-–]\s*(\w+\s+\d{4}|Present|Current)/i
    );
    if (dateRangeMatch) {
      const dates = parseDateRange(dateRangeMatch[0]);
      experience.startDate = dates.startDate;
      experience.endDate = dates.endDate;
    }

    // Try to extract organization and role from first line
    // Common patterns:
    // - "Organization - Role"
    // - "Role at Organization"
    // - "Organization, Role"
    const dashMatch = firstLine.match(/^([^-]+)\s*[-–]\s*(.+)$/);
    if (dashMatch) {
      const [, part1, part2] = dashMatch;
      const p1 = cleanText(part1).trim();
      const p2 = cleanText(part2).trim();

      // Determine which is organization and which is role
      // Usually the one with "at" is the organization
      if (/at\s/i.test(p1)) {
        experience.role = p1.replace(/\s*at\s+/i, '').trim();
        experience.organization = p1.split(/\s+at\s+/i)[1]?.trim();
      } else {
        experience.organization = p1;
        experience.role = p2;
      }
    } else {
      // Try "Role at Organization" pattern
      const atMatch = firstLine.match(/^([^@]+?)\s+at\s+(.+)$/i);
      if (atMatch) {
        experience.role = cleanText(atMatch[1]).trim();
        experience.organization = cleanText(atMatch[2]).trim();
      } else {
        // Try comma separation
        const commaMatch = firstLine.match(/^([^,]+),\s*(.+)$/);
        if (commaMatch) {
          experience.organization = cleanText(commaMatch[1]).trim();
          experience.role = cleanText(commaMatch[2]).trim();
        } else {
          // Entire first line is organization
          experience.organization = cleanText(firstLine).trim();
        }
      }
    }

    // Extract description from remaining lines (bullet points, achievements, etc.)
    const descriptionLines = lines.slice(1);
    if (descriptionLines.length > 0) {
      const descText = descriptionLines
        .map((l) => removeBullets(l).trim())
        .filter((l) => l.length > 0)
        .join(' ');

      if (descText.length > 0) {
        // Remove dates from description
        let description = descText.replace(
          /(\w+\s+\d{4})\s*[-–]\s*(\w+\s+\d{4}|Present|Current)/i,
          ''
        );

        // Clean up extra spaces
        description = description.replace(/\s+/g, ' ').trim();

        if (description.length > 0) {
          experience.description = description;
        }
      }
    }

    return experience;
  }
}
