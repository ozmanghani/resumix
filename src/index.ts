/**
 * Resumix — Advanced PDF Resume Parser
 *
 * Parse PDF resumes into structured JSON with schema-driven field selection
 * and optional AI-powered extraction.
 *
 * @example
 * ```typescript
 * import { Resumix } from 'resumix';
 *
 * // Extract everything
 * const result = await Resumix.parse('./resume.pdf');
 *
 * // Extract specific fields using schema
 * const result = await Resumix.parse('./resume.pdf', {
 *   schema: { contact: { name: true, email: true }, skills: true },
 * });
 *
 * // Extract specific fields using field array
 * const result = await Resumix.parse(buffer, {
 *   fields: ['contact.name', 'contact.email', 'skills'],
 * });
 *
 * // Use AI for better accuracy
 * const result = await Resumix.parse('./resume.pdf', {
 *   ai: { provider: 'openai', apiKey: 'sk-...', model: 'gpt-4o-mini' },
 * });
 * ```
 *
 * @packageDocumentation
 */

export { Resumix } from './resumix';
export { ResumixError } from './core/pdf-reader';

// Re-export all types
export type {
  // Resume data types
  ResumeData,
  ContactInfo,
  Education,
  Experience,
  Skill,
  Certification,
  Project,
  Language,
  Award,
  Publication,
  VolunteerExperience,
  ParseResult,
  ParseMetadata,
} from './types/resume';

export type {
  // Schema types
  SchemaObject,
  SchemaValue,
  FieldPath,
  NormalizedSchema,
} from './types/schema';

export type {
  // Options types
  ParseOptions,
  AIProviderConfig,
  CustomAIProvider,
} from './types/options';

// Export section type for advanced usage
export type { Section } from './core/section-detector';

// Export AI provider interface for custom implementations
export type { IAIProvider } from './ai/ai-provider';
