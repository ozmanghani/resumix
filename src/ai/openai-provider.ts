import { IAIProvider, buildExtractionPrompt } from './ai-provider';
import { ResumeData } from '../types/resume';
import { AIProviderConfig } from '../types/options';
import { ResumixError } from '../core/pdf-reader';

/**
 * OpenAI-based resume extraction provider.
 *
 * Requires the `openai` package to be installed as a peer dependency.
 *
 * @example
 * ```typescript
 * const provider = new OpenAIProvider({
 *   provider: 'openai',
 *   apiKey: 'sk-...',
 *   model: 'gpt-4o-mini',
 * });
 * const data = await provider.extract(resumeText);
 * ```
 */
export class OpenAIProvider implements IAIProvider {
  private config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.config = config;
  }

  /**
   * Extract structured resume data using OpenAI's API.
   */
  async extract(text: string, fields?: string[]): Promise<Partial<ResumeData>> {
    let OpenAI: new (opts: { apiKey: string; baseURL?: string }) => {
      chat: {
        completions: {
          create: (params: {
            model: string;
            messages: { role: string; content: string }[];
            max_tokens?: number;
            temperature?: number;
            response_format?: { type: string };
          }) => Promise<{
            choices: { message: { content: string | null } }[];
          }>;
        };
      };
    };

    try {
      // Dynamic import so openai is only needed when AI is used
      // Try both ESM dynamic import and CJS require for compatibility
      let openaiModule: Record<string, unknown>;
      try {
        openaiModule = await (Function('return import("openai")')() as Promise<Record<string, unknown>>);
      } catch {
        // Fallback to require for CommonJS environments
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        openaiModule = require('openai') as Record<string, unknown>;
      }
      OpenAI = (openaiModule.default || openaiModule.OpenAI || openaiModule) as typeof OpenAI;
    } catch {
      throw new ResumixError(
        'The "openai" package is required for AI extraction. Install it with: npm install openai',
        'MISSING_DEPENDENCY',
      );
    }

    const client = new OpenAI({
      apiKey: this.config.apiKey,
      ...(this.config.baseUrl ? { baseURL: this.config.baseUrl } : {}),
    });

    const systemPrompt = buildExtractionPrompt(fields);

    try {
      const response = await client.chat.completions.create({
        model: this.config.model || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text },
        ],
        max_tokens: this.config.maxTokens || 4096,
        temperature: this.config.temperature ?? 0.1,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new ResumixError('AI returned empty response', 'AI_EMPTY_RESPONSE');
      }

      return JSON.parse(content) as Partial<ResumeData>;
    } catch (error) {
      if (error instanceof ResumixError) throw error;
      throw new ResumixError(
        'Failed to extract resume data using AI',
        'AI_EXTRACTION_ERROR',
        error as Error,
      );
    }
  }
}
