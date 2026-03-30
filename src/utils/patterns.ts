/**
 * Pattern definitions and constants used throughout the resumix library
 * for parsing and extracting information from resumes.
 */

/**
 * Regex pattern for matching email addresses
 */
export const EMAIL_PATTERN: RegExp = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

/**
 * Regex pattern for matching phone numbers in various formats:
 * - US format: (123) 456-7890, 123-456-7890, 123.456.7890, 1234567890
 * - International: +1 123 456 7890, +44 20 7946 0958, etc.
 * - With country codes: +1-123-456-7890
 * - Afghan format: +93 7XX XXX XXXX
 */
export const PHONE_PATTERN: RegExp = /(?:\+\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}(?:[-.\s]?\d{1,4})?/g;

/**
 * Regex pattern for matching URLs (http and https)
 */
export const URL_PATTERN: RegExp = /https?:\/\/[^\s)]+/g;

/**
 * Regex pattern for matching LinkedIn profile URLs
 */
export const LINKEDIN_PATTERN: RegExp = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in|company)\/[^\s)]+/gi;

/**
 * Regex pattern for matching GitHub profile URLs
 */
export const GITHUB_PATTERN: RegExp = /(?:https?:\/\/)?(?:www\.)?github\.com\/[^\s)]+/gi;

/**
 * Array of regex patterns for matching dates in various formats:
 * - MM/YYYY: 01/2020
 * - MM-YYYY: 01-2020
 * - Month YYYY: January 2020, Jan 2020
 * - YYYY-MM: 2020-01
 * - YYYY: 2020
 * - Month DD YYYY: January 15 2020
 * - D/M/YYYY: 15/1/2020
 * - M/D/YYYY: 1/15/2020
 */
export const DATE_PATTERNS: RegExp[] = [
  /\b(?:0?[1-9]|1[0-2])\/(\d{4})\b/g, // MM/YYYY or M/YYYY
  /\b(?:0?[1-9]|1[0-2])-(\d{4})\b/g, // MM-YYYY or M-YYYY
  /\b(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\s+(\d{4})\b/gi, // Month YYYY
  /\b(\d{4})-(?:0?[1-9]|1[0-2])\b/g, // YYYY-MM or YYYY-M
  /\b(\d{4})\b(?!\s*[-/])/g, // YYYY (standalone)
  /\b(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\s+\d{1,2},?\s+(\d{4})\b/gi, // Month DD YYYY
  /\b(?:0?[1-9]|[12]\d|3[01])\/(?:0?[1-9]|1[0-2])\/(\d{4})\b/g, // DD/MM/YYYY or D/M/YYYY
  /\b(?:0?[1-9]|1[0-2])\/(?:0?[1-9]|[12]\d|3[01])\/(\d{4})\b/g, // MM/DD/YYYY or M/D/YYYY
];

/**
 * Regex pattern for matching date ranges with various separators
 * Examples: 'Jan 2020 - Present', '2019 - 2021', 'January 2020 to December 2021'
 */
export const DATE_RANGE_PATTERN: RegExp =
  /(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec|0?[1-9]|1[0-2])?\s*(?:0?[1-9]|[12]\d|3[01])?,?\s*\d{4}\s*(?:–|-|to|through|till)\s*(?:Present|Current|Now|[^,.\n]+(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)?\s*\d{4})?/gi;

/**
 * Mapping of canonical section names to common variations of section headers
 * Used to identify resume sections regardless of exact formatting
 */
export const SECTION_HEADERS: Record<string, string[]> = {
  contact: [
    'contact',
    'contact info',
    'contact information',
    'contact details',
    'personal info',
    'personal information',
    'get in touch',
    'reach out',
  ],
  summary: [
    'summary',
    'professional summary',
    'executive summary',
    'profile',
    'professional profile',
    'about',
    'about me',
    'overview',
    'introduction',
  ],
  objective: [
    'objective',
    'career objective',
    'job objective',
    'professional objective',
    'goal',
    'career goal',
  ],
  experience: [
    'experience',
    'professional experience',
    'work experience',
    'employment',
    'work history',
    'employment history',
    'career history',
    'positions',
    'jobs',
  ],
  education: [
    'education',
    'academic',
    'academic background',
    'schooling',
    'educational background',
    'university',
    'college',
    'degrees',
  ],
  skills: ['skills', 'core competencies', 'competencies', 'technical skills', 'key skills', 'areas of expertise', 'expertise'],
  certifications: [
    'certifications',
    'certification',
    'licenses',
    'license',
    'professional certifications',
    'credentials',
    'certified',
  ],
  projects: [
    'projects',
    'key projects',
    'notable projects',
    'portfolio',
    'portfolio projects',
    'featured projects',
    'accomplishments',
  ],
  languages: [
    'languages',
    'language',
    'language skills',
    'languages spoken',
    'multilingual',
    'linguistic skills',
  ],
  awards: [
    'awards',
    'recognition',
    'honors',
    'honour',
    'distinctions',
    'accolades',
    'awards & recognition',
    'awards and recognition',
  ],
  publications: [
    'publications',
    'published work',
    'articles',
    'papers',
    'research',
    'published papers',
    'writing',
  ],
  volunteer: [
    'volunteer',
    'volunteering',
    'volunteer experience',
    'volunteer work',
    'community service',
    'community involvement',
  ],
};

/**
 * Regex pattern for matching bullet points
 * Matches various bullet characters: •, -, *, ►, ◆, ○, ■, etc.
 */
export const BULLET_PATTERN: RegExp = /^[\s]*[•\-*►◆○■□▪▫]+[\s]+/gm;

/**
 * Regex pattern for matching GPA values in various formats:
 * - 3.5/4.0
 * - GPA: 3.5
 * - 3.5 GPA
 * - 4.0
 */
export const GPA_PATTERN: RegExp = /(?:GPA:?\s*)?(\d\.\d{1,2})(?:\/4\.0)?(?:\s*GPA)?/gi;

/**
 * Array of common degree strings to aid in education parsing
 * Includes full and abbreviated forms
 */
export const DEGREE_PATTERNS: string[] = [
  'Bachelor',
  'Master',
  'PhD',
  'Doctorate',
  'Associate',
  'Certificate',
  'Diploma',
  'B.S.',
  'B.A.',
  'B.Sc.',
  'B.E.',
  'B.Tech',
  'B.Com',
  'M.S.',
  'M.A.',
  'M.Sc.',
  'M.E.',
  'M.Tech',
  'M.Com',
  'MBA',
  'MBBS',
  'BCA',
  'MCA',
  'LLB',
  'LLM',
  'MD',
  'DDS',
  'DVM',
];
