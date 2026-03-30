/**
 * Extractor for projects section from resume.
 */

import { Project } from '../types/resume';
import { Section } from '../core/section-detector';
import { BaseExtractor } from './base-extractor';
import { cleanText, removeBullets } from '../utils/text-utils';
import { parseDateRange } from '../utils/date-parser';
import { URL_PATTERN, BULLET_PATTERN } from '../utils/patterns';

/**
 * Extracts project information from the projects section.
 * Handles various formats including:
 * - Project name as bold/first line
 * - Description in following lines
 * - Technologies as comma-separated list or in parentheses
 * - URLs/links
 * - Start and end dates
 */
export class ProjectsExtractor extends BaseExtractor<Project[]> {
  /**
   * Extract projects from resume sections.
   */
  extract(sections: Section[]): Project[] {
    const section = this.findSectionByNames(sections, ['projects', 'portfolio', 'personal projects']);

    if (!section) {
      return [];
    }

    return this.parseProjects(section.lines);
  }

  /**
   * Parse project entries from section lines.
   * Projects are typically separated by empty lines or new project indicators.
   */
  private parseProjects(lines: string[]): Project[] {
    const projects: Project[] = [];
    let currentProject: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();

      // Empty line indicates end of a project entry
      if (trimmed.length === 0) {
        if (currentProject.length > 0) {
          const project = this.parseProjectBlock(currentProject);
          if (project.name) {
            projects.push(project);
          }
          currentProject = [];
        }
      } else {
        currentProject.push(line);
      }
    }

    // Don't forget the last project
    if (currentProject.length > 0) {
      const project = this.parseProjectBlock(currentProject);
      if (project.name) {
        projects.push(project);
      }
    }

    return projects;
  }

  /**
   * Parse a project block (multiple lines).
   */
  private parseProjectBlock(lines: string[]): Project {
    const project: Project = {};

    if (lines.length === 0) {
      return project;
    }

    // First non-empty line is typically the project name
    let nameIndex = 0;
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (trimmed.length > 0) {
        project.name = cleanText(removeBullets(trimmed));
        nameIndex = i;
        break;
      }
    }

    // Combine remaining lines for further parsing
    const descriptionLines = lines.slice(nameIndex + 1);
    const fullText = descriptionLines.map((l) => l.trim()).join(' ');

    if (fullText) {
      // Extract URLs
      const urlMatches = fullText.match(URL_PATTERN);
      if (urlMatches && urlMatches.length > 0) {
        project.url = urlMatches[0];
      }

      // Extract technologies (look for comma-separated or parenthesized list)
      const techMatch = fullText.match(/technologies?:?\s*(.+?)(?:\.(?:\s|$)|$)/i);
      if (techMatch) {
        project.technologies = techMatch[1].split(/[,;]+/).map((s) => s.trim()).filter(Boolean);
      } else {
        // Try to find parenthesized tech list
        const parenMatch = fullText.match(/\(([^)]+)\)/);
        if (parenMatch) {
          const content = parenMatch[1];
          // Check if this looks like a technology list
          if (/[,;]|\busing\b|\bbuilt\b|\bwith\b/i.test(content)) {
            project.technologies = content.split(/[,;]+/).map((s) => s.trim()).filter(Boolean);
          }
        }
      }

      // Extract date range
      const dateRangeMatch = fullText.match(
        /(\w+\s+\d{4})\s*[-–]\s*(\w+\s+\d{4}|Present|Current)/i
      );
      if (dateRangeMatch) {
        const dates = parseDateRange(dateRangeMatch[0]);
        project.startDate = dates.startDate;
        project.endDate = dates.endDate;
      }

      // Description is everything minus URLs, technologies, and dates
      let description = fullText
        .replace(URL_PATTERN, '')
        .replace(/technologies?:?\s*.+?(?:\.(?:\s|$)|$)/i, '')
        .replace(/(\w+\s+\d{4})\s*[-–]\s*(\w+\s+\d{4}|Present|Current)/i, '')
        .replace(BULLET_PATTERN, '')
        .trim();

      // Remove extra whitespace and trailing/leading bullet chars
      description = description.replace(/\s+/g, ' ').replace(/(?:^[\s\-•*+]+|[\s\-•*+]+$)/g, '').trim();

      if (description.length > 0) {
        project.description = description;
      }
    }

    return project;
  }
}
