import { readPdf } from './core/pdf-reader';
import { preprocessText } from './core/preprocessor';
import { detectSections, Section } from './core/section-detector';
import { resolveSchema, getIncludedSections } from './schema/schema-engine';
import { filterBySchema } from './schema/field-filter';
import { createAIProvider, extractWithAI } from './ai/ai-extractor';
import { NormalizedSchema } from './types/schema';
import { ParseOptions } from './types/options';
import { ResumeData, ParseResult, ParseMetadata } from './types/resume';

// Extractors
import { ContactExtractor } from './extractors/contact-extractor';
import { SummaryExtractor } from './extractors/summary-extractor';
import { ExperienceExtractor } from './extractors/experience-extractor';
import { EducationExtractor } from './extractors/education-extractor';
import { SkillsExtractor } from './extractors/skills-extractor';
import { CertificationsExtractor } from './extractors/certifications-extractor';
import { ProjectsExtractor } from './extractors/projects-extractor';
import { LanguagesExtractor } from './extractors/languages-extractor';
import { AwardsExtractor } from './extractors/awards-extractor';
import { PublicationsExtractor } from './extractors/publications-extractor';
import { VolunteerExtractor } from './extractors/volunteer-extractor';

/**
 * Main class for parsing PDF resumes.
 *
 * Provides a static `parse` method for quick usage and can be instantiated
 * with default options for repeated parsing.
 */
export class Resumix {
  private defaultOptions: ParseOptions;

  /**
   * Create a Resumix instance with default options.
   *
   * @param defaultOptions - Default options applied to every parse call
   */
  constructor(defaultOptions: ParseOptions = {}) {
    this.defaultOptions = defaultOptions;
  }

  /**
   * Parse a PDF resume and return structured JSON data.
   * Static convenience method.
   *
   * @param input - File path (string) or Buffer containing the PDF
   * @param options - Parsing options (schema, fields, AI config, etc.)
   * @returns Parsed resume data with metadata
   *
   * @example
   * ```typescript
   * const result = await Resumix.parse('./resume.pdf');
   * console.log(result.data.contact?.name);
   * ```
   */
  static async parse(input: string | Buffer, options?: ParseOptions): Promise<ParseResult> {
    const instance = new Resumix();
    return instance.parseResume(input, options);
  }

  /**
   * Parse a PDF resume using instance default options merged with provided options.
   *
   * @param input - File path (string) or Buffer containing the PDF
   * @param options - Parsing options that override defaults
   * @returns Parsed resume data with metadata
   */
  async parseResume(input: string | Buffer, options?: ParseOptions): Promise<ParseResult> {
    const mergedOptions: ParseOptions = { ...this.defaultOptions, ...options };
    const startTime = Date.now();

    // Step 1: Read PDF
    const { text: rawText, pages } = await readPdf(input);

    // Step 2: Preprocess text
    const cleanedText = preprocessText(rawText);

    // Step 3: Resolve schema
    const schema = resolveSchema({
      schema: mergedOptions.schema,
      fields: mergedOptions.fields,
    });

    // Step 4: Determine extraction mode
    const aiProvider = createAIProvider(mergedOptions.ai, mergedOptions.customAIProvider);

    let data: ResumeData;
    let mode: 'rule-based' | 'ai';
    let sectionsDetected: string[] = [];
    let confidence: number | undefined;

    if (aiProvider) {
      // AI-powered extraction
      mode = 'ai';
      const includedSections = getIncludedSections(schema);
      const rawData = await extractWithAI(aiProvider, cleanedText, includedSections ?? undefined);
      data = rawData as ResumeData;
      confidence = 0.85; // Default AI confidence
    } else {
      // Rule-based extraction
      mode = 'rule-based';

      // Step 5: Detect sections
      const sections = detectSections(cleanedText, mergedOptions.customSectionHeaders);
      sectionsDetected = sections.map((s) => s.name);

      // Step 6: Run extractors
      data = this.runExtractors(sections, schema);
    }

    // Step 7: Filter by schema
    const filteredData = filterBySchema(data, schema);

    // Step 8: Build result
    const duration = Date.now() - startTime;
    const metadata: ParseMetadata = {
      pages,
      duration,
      mode,
      sectionsDetected,
      ...(confidence !== undefined ? { confidence } : {}),
    };

    const result: ParseResult = {
      data: filteredData,
      metadata,
    };

    if (mergedOptions.includeRawText) {
      result.rawText = rawText;
    }

    return result;
  }

  /**
   * Run all applicable extractors on detected sections.
   */
  private runExtractors(sections: Section[], schema: NormalizedSchema | null): ResumeData {
    const includedSections = getIncludedSections(schema);
    const shouldRun = (name: string) => !includedSections || includedSections.includes(name);

    const data: ResumeData = {};

    // Contact info
    if (shouldRun('contact')) {
      const extractor = new ContactExtractor();
      data.contact = extractor.extract(sections);
    }

    // Summary & Objective
    if (shouldRun('summary') || shouldRun('objective')) {
      const extractor = new SummaryExtractor();
      const result = extractor.extract(sections);
      if (shouldRun('summary')) data.summary = result.summary;
      if (shouldRun('objective')) data.objective = result.objective;
    }

    // Experience
    if (shouldRun('experience')) {
      const extractor = new ExperienceExtractor();
      data.experience = extractor.extract(sections);
    }

    // Education
    if (shouldRun('education')) {
      const extractor = new EducationExtractor();
      data.education = extractor.extract(sections);
    }

    // Skills
    if (shouldRun('skills')) {
      const extractor = new SkillsExtractor();
      data.skills = extractor.extract(sections);
    }

    // Certifications
    if (shouldRun('certifications')) {
      const extractor = new CertificationsExtractor();
      data.certifications = extractor.extract(sections);
    }

    // Projects
    if (shouldRun('projects')) {
      const extractor = new ProjectsExtractor();
      data.projects = extractor.extract(sections);
    }

    // Languages
    if (shouldRun('languages')) {
      const extractor = new LanguagesExtractor();
      data.languages = extractor.extract(sections);
    }

    // Awards
    if (shouldRun('awards')) {
      const extractor = new AwardsExtractor();
      data.awards = extractor.extract(sections);
    }

    // Publications
    if (shouldRun('publications')) {
      const extractor = new PublicationsExtractor();
      data.publications = extractor.extract(sections);
    }

    // Volunteer
    if (shouldRun('volunteer')) {
      const extractor = new VolunteerExtractor();
      data.volunteer = extractor.extract(sections);
    }

    return data;
  }
}
