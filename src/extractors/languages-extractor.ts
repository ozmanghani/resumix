/**
 * Extractor for languages section from resume.
 */

import { Language } from '../types/resume';
import { Section } from '../core/section-detector';
import { BaseExtractor } from './base-extractor';
import { cleanText, removeBullets } from '../utils/text-utils';

/**
 * Known world languages for validation.
 * Used to filter out non-language entries like "Available for freelance, remote, or onsite roles"
 */
const KNOWN_LANGUAGES = new Set([
  'english', 'spanish', 'french', 'german', 'chinese', 'mandarin', 'cantonese',
  'japanese', 'korean', 'arabic', 'hindi', 'urdu', 'persian', 'farsi', 'dari',
  'pashto', 'portuguese', 'russian', 'italian', 'dutch', 'swedish', 'norwegian',
  'danish', 'finnish', 'polish', 'turkish', 'greek', 'hebrew', 'thai', 'vietnamese',
  'indonesian', 'malay', 'tagalog', 'filipino', 'bengali', 'tamil', 'telugu',
  'swahili', 'amharic', 'hausa', 'yoruba', 'igbo', 'zulu', 'czech', 'slovak',
  'hungarian', 'romanian', 'bulgarian', 'ukrainian', 'catalan', 'basque', 'welsh',
  'gaelic', 'latin', 'sanskrit', 'nepali', 'punjabi', 'gujarati', 'marathi',
  'kannada', 'malayalam', 'sinhala', 'burmese', 'khmer', 'lao', 'georgian',
  'armenian', 'azerbaijani', 'uzbek', 'kazakh', 'mongolian', 'tibetan', 'somali'
]);

/**
 * Extracts language information from the languages section.
 * Handles various formats including:
 * - "English (Native)"
 * - "Spanish - Fluent"
 * - "French: Intermediate"
 * - "German, Conversational"
 * - Comma, bullet, or newline-separated lists
 */
export class LanguagesExtractor extends BaseExtractor<Language[]> {
  /**
   * Extract languages from resume sections.
   */
  extract(sections: Section[]): Language[] {
    const section = this.findSectionByNames(sections, ['languages', 'language']);

    if (!section) {
      return [];
    }

    return this.parseLanguages(section.content, section.lines);
  }

  /**
   * Parse language entries from section content and lines.
   */
  private parseLanguages(content: string, lines: string[]): Language[] {
    const languages: Language[] = [];
    const processedLanguages = new Set<string>();

    // First, try to parse from individual lines (handles bullet points, etc.)
    for (const line of lines) {
      const cleaned = removeBullets(line).trim();
      if (cleaned.length === 0) {
        continue;
      }

      const lang = this.parseLanguageLine(cleaned);
      if (lang.name && !processedLanguages.has(lang.name.toLowerCase())) {
        languages.push(lang);
        processedLanguages.add(lang.name.toLowerCase());
      }
    }

    // If no languages found from lines, try parsing as comma-separated
    if (languages.length === 0) {
      const lang = this.parseLanguagesFromContent(content);
      languages.push(...lang);
    }

    return languages;
  }

  /**
   * Validate if a language name is actually a known language.
   * Filters out entries like "Available for freelance, remote, or onsite roles"
   */
  private isValidLanguage(name: string): boolean {
    if (!name || name.length === 0) {
      return false;
    }

    // Skip if name is too long (definitely not a language name)
    if (name.length > 40) {
      return false;
    }

    // Extract the first word (before any dash, parenthesis, etc.)
    const firstWord = name.split(/[-(/]/)[0].trim().toLowerCase();

    // Check if it's in our known languages set
    return KNOWN_LANGUAGES.has(firstWord);
  }

  /**
   * Parse a single language line with optional proficiency.
   * Handles formats like:
   * - "English (Native)"
   * - "Spanish - Fluent"
   * - "French: Intermediate"
   * - "German"
   */
  private parseLanguageLine(line: string): Language {
    const lang: Language = { name: '' };

    // Try to split on common separators: parentheses, dash, colon, comma
    const parenMatch = line.match(/^([^()]+)\s*\(([^)]+)\)/);
    if (parenMatch) {
      lang.name = cleanText(parenMatch[1]).trim();
      if (this.isValidLanguage(lang.name)) {
        lang.proficiency = cleanText(parenMatch[2]).trim();
        return lang;
      }
    }

    const dashMatch = line.match(/^([^-]+)\s*[-–]\s*(.+)$/);
    if (dashMatch) {
      lang.name = cleanText(dashMatch[1]).trim();
      if (this.isValidLanguage(lang.name)) {
        lang.proficiency = cleanText(dashMatch[2]).trim();
        return lang;
      }
    }

    const colonMatch = line.match(/^([^:]+):\s*(.+)$/);
    if (colonMatch) {
      lang.name = cleanText(colonMatch[1]).trim();
      if (this.isValidLanguage(lang.name)) {
        lang.proficiency = cleanText(colonMatch[2]).trim();
        return lang;
      }
    }

    const commaMatch = line.match(/^([^,]+),\s*(.+)$/);
    if (commaMatch) {
      lang.name = cleanText(commaMatch[1]).trim();
      if (this.isValidLanguage(lang.name)) {
        lang.proficiency = cleanText(commaMatch[2]).trim();
        return lang;
      }
    }

    // No separator found, entire line is the language name
    lang.name = cleanText(line).trim();
    
    // Validate that this is actually a language name
    if (!this.isValidLanguage(lang.name)) {
      lang.name = '';
    }
    
    return lang;
  }

  /**
   * Parse comma-separated language string.
   */
  private parseLanguagesFromContent(content: string): Language[] {
    const languages: Language[] = [];

    // Try splitting by comma first
    const commaSplit = content.split(',').map((s) => s.trim());
    if (commaSplit.length > 1) {
      for (const item of commaSplit) {
        const lang = this.parseLanguageLine(item);
        if (lang.name) {
          languages.push(lang);
        }
      }
    }

    // If comma split didn't work, try newlines
    if (languages.length === 0) {
      const lineSplit = content.split('\n').map((s) => s.trim());
      for (const item of lineSplit) {
        if (item.length > 0) {
          const lang = this.parseLanguageLine(item);
          if (lang.name) {
            languages.push(lang);
          }
        }
      }
    }

    return languages;
  }
}
