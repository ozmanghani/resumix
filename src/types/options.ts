import { SchemaObject, FieldPath } from './schema';

/**
 * AI provider configuration for enhanced extraction.
 */
export interface AIProviderConfig {
  /** The AI provider to use */
  provider: 'openai' | 'custom';
  /** API key for the AI provider */
  apiKey: string;
  /** Model to use (e.g., 'gpt-4o-mini', 'gpt-4o') */
  model?: string;
  /** Maximum tokens for the AI response */
  maxTokens?: number;
  /** Temperature for AI generation (0-1) */
  temperature?: number;
  /** Custom API base URL (for custom providers or proxies) */
  baseUrl?: string;
}

/**
 * Custom AI provider interface for plugging in any AI service.
 */
export interface CustomAIProvider {
  /**
   * Extract structured resume data from raw text using AI.
   * @param text - The raw text extracted from the PDF
   * @param fields - The fields requested by the user (if any)
   * @returns Parsed resume data as a plain object
   */
  extract(text: string, fields?: string[]): Promise<Record<string, unknown>>;
}

/**
 * Options for parsing a resume.
 */
export interface ParseOptions {
  /**
   * Schema object defining which fields to extract.
   * Cannot be used together with `fields`.
   */
  schema?: SchemaObject;

  /**
   * Array of field paths to extract (dot notation).
   * Cannot be used together with `schema`.
   *
   * @example ['contact.name', 'contact.email', 'skills']
   */
  fields?: FieldPath[];

  /**
   * AI provider configuration for enhanced extraction.
   * When provided, AI will be used instead of rule-based parsing.
   */
  ai?: AIProviderConfig;

  /**
   * Custom AI provider instance.
   * Takes precedence over `ai` config if both are provided.
   */
  customAIProvider?: CustomAIProvider;

  /**
   * Whether to include raw extracted text in the result.
   * @default false
   */
  includeRawText?: boolean;

  /**
   * Custom section header patterns to help the parser
   * identify non-standard section headers.
   */
  customSectionHeaders?: Record<string, string[]>;
}
