/**
 * Base extractor class providing common functionality for all extractors.
 * Defines the interface for section-based extraction logic.
 */

/**
 * Represents a section of a resume document.
 */
export interface Section {
  name: string;
  startLine: number;
  endLine: number;
  content: string;
  lines: string[];
}

/**
 * Abstract base class for all resume extractors.
 * Provides common utilities and enforces the extraction contract.
 *
 * @template T - The type of data this extractor produces
 */
export abstract class BaseExtractor<T> {
  /**
   * Extract data from resume sections.
   *
   * @param sections - Array of resume sections to extract from
   * @returns Extracted data of type T
   */
  abstract extract(sections: Section[]): T;

  /**
   * Finds the first section matching any of the given names.
   * Case-insensitive matching.
   *
   * @param sections - Array of sections to search
   * @param names - Names to match against (case-insensitive)
   * @returns The matched section or undefined if not found
   */
  protected findSectionByNames(
    sections: Section[],
    names: string[]
  ): Section | undefined {
    const normalizedNames = names.map((name) => name.toLowerCase());
    return sections.find((section) =>
      normalizedNames.includes(section.name.toLowerCase())
    );
  }
}
