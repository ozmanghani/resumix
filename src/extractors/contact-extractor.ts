/**
 * Extractor for contact information from resume headers.
 * Identifies email, phone, social profiles, location, and name.
 */

import { ContactInfo } from '../types/resume';
import { BaseExtractor, Section } from './base-extractor';

/**
 * Regular expressions for pattern matching.
 */
const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_PATTERN = /(\+\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}|\+\d{1,14}/g;
const LINKEDIN_PATTERN = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in|company)\/[\w-]+/gi;
const GITHUB_PATTERN = /(?:https?:\/\/)?(?:www\.)?github\.com\/[\w-]+/gi;
const URL_PATTERN = /https?:\/\/[^\s]+|www\.[^\s]+/gi;

/**
 * ContactExtractor extracts contact information from resume sections.
 * Primarily uses the header section and dedicated contact section.
 */
export class ContactExtractor extends BaseExtractor<ContactInfo> {
  /**
   * Extract contact information from resume sections.
   *
   * @param sections - Array of resume sections
   * @returns Extracted contact information
   */
  extract(sections: Section[]): ContactInfo {
    const contact: ContactInfo = {};

    // Look for header or contact section
    const headerSection = this.findSectionByNames(sections, [
      'header',
      'contact',
      'personal',
      'info',
    ]);
    const fullText = headerSection
      ? headerSection.content
      : sections.length > 0
        ? sections[0].content
        : '';
    const lines = fullText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    // Extract email
    const emailMatch = fullText.match(EMAIL_PATTERN);
    if (emailMatch) {
      contact.email = emailMatch[0];
    }

    // Extract phone
    const phoneMatch = fullText.match(PHONE_PATTERN);
    if (phoneMatch) {
      contact.phone = phoneMatch[0];
    }

    // Extract LinkedIn
    const linkedinMatch = fullText.match(LINKEDIN_PATTERN);
    if (linkedinMatch) {
      contact.linkedin = linkedinMatch[0];
    }

    // Extract GitHub
    const githubMatch = fullText.match(GITHUB_PATTERN);
    if (githubMatch) {
      contact.github = githubMatch[0];
    }

    // Extract website (other URLs)
    const urlMatches = fullText.match(URL_PATTERN);
    if (urlMatches) {
      const websites = urlMatches.filter(
        (url) =>
          !url.toLowerCase().includes('linkedin') &&
          !url.toLowerCase().includes('github')
      );
      if (websites.length > 0) {
        contact.website = websites[0];
      }
    }

    // Extract name from first meaningful line
    const nameCandidate = this.extractNameFromLines(lines);
    if (nameCandidate) {
      contact.name = nameCandidate;
      const [firstName, lastName] = this.splitName(nameCandidate);
      if (firstName) {
        contact.firstName = firstName;
      }
      if (lastName) {
        contact.lastName = lastName;
      }
    }

    // Extract location
    const location = this.extractLocation(lines);
    if (location) {
      contact.location = location;
    }

    return contact;
  }

  /**
   * Extract the name from the first non-empty, non-contact line.
   *
   * @param lines - Lines from header section
   * @returns The name or undefined
   */
  private extractNameFromLines(lines: string[]): string | undefined {
    for (const line of lines) {
      // Skip lines that are clearly contact info
      if (
        EMAIL_PATTERN.test(line) ||
        PHONE_PATTERN.test(line) ||
        URL_PATTERN.test(line)
      ) {
        continue;
      }
      // First non-contact line is likely the name
      if (line.length > 0 && line.length < 100) {
        return line;
      }
    }
    return undefined;
  }

  /**
   * Split a full name into first and last name.
   *
   * @param fullName - The full name to split
   * @returns Tuple of [firstName, lastName]
   */
  private splitName(fullName: string): [string | undefined, string | undefined] {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 0) {
      return [undefined, undefined];
    }
    if (parts.length === 1) {
      return [parts[0], undefined];
    }
    return [parts[0], parts.slice(1).join(' ')];
  }

  /**
   * Extract location from lines, looking for common city/state patterns.
   *
   * @param lines - Lines to search
   * @returns The location or undefined
   */
  private extractLocation(lines: string[]): string | undefined {
    const locationIndicators = ['city', 'state', 'location', 'based', 'area'];
    const cityStatePattern = /^[A-Z][a-z]+,\s*[A-Z]{2}$/;

    for (const line of lines) {
      // Check for city, state pattern (e.g., "San Francisco, CA")
      if (cityStatePattern.test(line)) {
        return line;
      }

      // Check for lines with location indicators
      const lowerLine = line.toLowerCase();
      if (
        locationIndicators.some((indicator) => lowerLine.includes(indicator))
      ) {
        // Strip common prefixes like "Location:", "Based in:", etc.
        return line.replace(/^(?:location|based\s+in|city|area)\s*[:]\s*/i, '').trim();
      }
    }

    return undefined;
  }
}
