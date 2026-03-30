/**
 * Extractor for skills from resume.
 * Identifies technical and soft skills, with optional categorization.
 * Handles both single-line categorized format (Category: skill1, skill2) and
 * multi-line category headers followed by skill lists.
 */

import { Skill } from '../types/resume';
import { BaseExtractor, Section } from './base-extractor';

/**
 * Pattern for bullet points at the start of a line.
 * Matches common bullet characters: -, •, *, +, ►, ◆, ○, ■, □, ▪, ▫
 */
const BULLET_PATTERN = /^[\s]*[-•*+►◆○■□▪▫]\s+/;

/**
 * SkillsExtractor extracts skills from resume with optional categorization.
 * Supports both "Category: skill1, skill2, skill3" on a single line and
 * traditional multi-line category headers.
 */
export class SkillsExtractor extends BaseExtractor<Skill[]> {
  /**
   * Extract skills from resume sections.
   * Searches for skills section by common names and processes lines to identify
   * skills with optional category assignments.
   *
   * @param sections - Array of resume sections
   * @returns Array of extracted skills with optional categories
   */
  extract(sections: Section[]): Skill[] {
    const skillsSection = this.findSectionByNames(sections, [
      'skills',
      'technical skills',
      'core competencies',
      'competencies',
      'expertise',
      'abilities',
      'key skills',
      'areas of expertise',
    ]);

    if (!skillsSection) {
      return [];
    }

    const skills: Skill[] = [];
    const lines = skillsSection.lines;

    for (const line of lines) {
      const trimmed = line.replace(BULLET_PATTERN, '').trim();
      if (!trimmed) continue;

      // Check for "Category: item1, item2, item3" pattern
      // Match category before colon, but be careful not to match URLs (http:) etc.
      const categoryMatch = trimmed.match(/^([A-Za-z][A-Za-z0-9\s&/]+?)\s*[:：]\s*(.+)$/);
      if (categoryMatch) {
        const category = categoryMatch[1].trim();
        const itemsStr = categoryMatch[2];
        // Split items by comma, pipe, semicolon
        const items = itemsStr.split(/[,;|]+/).map(s => s.trim()).filter(Boolean);
        for (const item of items) {
          skills.push({ name: item, category });
        }
      } else {
        // No category — treat as comma/pipe/semicolon separated flat list
        const items = trimmed.split(/[,;|]+/).map(s => s.trim()).filter(Boolean);
        for (const item of items) {
          // Skip if item is too long (probably a sentence, not a skill)
          if (item.length <= 60) {
            skills.push({ name: item });
          }
        }
      }
    }

    return skills;
  }
}
