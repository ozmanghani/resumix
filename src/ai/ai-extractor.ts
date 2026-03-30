import { IAIProvider } from './ai-provider';
import { OpenAIProvider } from './openai-provider';
import { AIProviderConfig, CustomAIProvider } from '../types/options';
import { ResumeData } from '../types/resume';
import { ResumixError } from '../core/pdf-reader';

/**
 * Creates the appropriate AI provider based on configuration.
 */
export function createAIProvider(
  config?: AIProviderConfig,
  customProvider?: CustomAIProvider,
): IAIProvider | null {
  if (customProvider) {
    return {
      async extract(text: string, fields?: string[]): Promise<Partial<ResumeData>> {
        const result = await customProvider.extract(text, fields);
        return result as Partial<ResumeData>;
      },
    };
  }

  if (config) {
    switch (config.provider) {
      case 'openai':
        return new OpenAIProvider(config);
      case 'custom':
        throw new ResumixError(
          'Custom AI provider requires a customAIProvider instance in options',
          'INVALID_CONFIG',
        );
      default:
        throw new ResumixError(
          `Unsupported AI provider: ${config.provider}`,
          'INVALID_CONFIG',
        );
    }
  }

  return null;
}

/**
 * Extract resume data using an AI provider.
 */
export async function extractWithAI(
  provider: IAIProvider,
  text: string,
  fields?: string[],
): Promise<Partial<ResumeData>> {
  return provider.extract(text, fields);
}
