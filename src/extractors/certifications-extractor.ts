/**
 * Extractor for certifications section from resume.
 */

import { Certification } from '../types/resume';
import { Section } from '../core/section-detector';
import { BaseExtractor } from './base-extractor';
import { cleanText, removeBullets } from '../utils/text-utils';
import { parseDate } from '../utils/date-parser';

/**
 * Extracts certification information from the certifications section.
 * Handles various formats including:
 * - "Certification Name - Issuer - Date"
 * - "Certified in X by Organization (Date)"
 * - Credential IDs and expiry dates
 */
export class CertificationsExtractor extends BaseExtractor<Certification[]> {
  /**
   * Extract certifications from resume sections.
   */
  extract(sections: Section[]): Certification[] {
    const section = this.findSectionByNames(sections, ['certifications', 'licenses', 'credentials']);

    if (!section) {
      return [];
    }

    return this.parseCertifications(section.content, section.lines);
  }

  /**
   * Parse certification entries from section content.
   */
  private parseCertifications(content: string, lines: string[]): Certification[] {
    const certifications: Certification[] = [];

    // Process each non-empty line as a potential certification
    for (const line of lines) {
      const cleaned = removeBullets(line).trim();
      if (cleaned.length === 0) {
        continue;
      }

      const cert = this.parseCertificationLine(cleaned);
      if (cert.name) {
        certifications.push(cert);
      }
    }

    return certifications;
  }

  /**
   * Parse a single certification line.
   */
  private parseCertificationLine(line: string): Certification {
    const cert: Certification = {};

    // Try to extract name and other details separated by common delimiters
    const parts = line.split(/\s*[-–|,]\s*/);

    if (parts.length > 0) {
      // First part is typically the name
      cert.name = cleanText(parts[0]).trim();

      // Process remaining parts
      for (let i = 1; i < parts.length; i++) {
        const part = cleanText(parts[i]).trim();

        // Check if it looks like a date
        const dateStr = parseDate(part);
        if (dateStr) {
          cert.date = dateStr;
        }
        // Check if it looks like an expiry date (contains "expir", "valid until", etc.)
        else if (/expir|valid|until/i.test(part)) {
          const expiryMatch = part.match(/(\w+\s+\d{4}|\d{1,2}\/\d{4})/);
          if (expiryMatch) {
            cert.expiryDate = parseDate(expiryMatch[0]);
          }
        }
        // Check for credential ID pattern
        else if (/credential|id|certificate\s*#|no\.|number/i.test(part)) {
          const idMatch = part.match(/[A-Z0-9-]+$/);
          if (idMatch) {
            cert.credentialId = idMatch[0];
          }
        }
        // Otherwise treat as issuer
        else if (!cert.issuer) {
          cert.issuer = part;
        }
      }
    }

    // Try to extract credential ID from parentheses
    const credentialMatch = line.match(/\(([A-Z0-9-]+)\)/);
    if (credentialMatch && !cert.credentialId) {
      cert.credentialId = credentialMatch[1];
    }

    return cert;
  }
}
