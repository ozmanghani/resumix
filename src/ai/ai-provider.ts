import { ResumeData } from '../types/resume';

/**
 * Interface for AI providers that can extract structured resume data from text.
 */
export interface IAIProvider {
  /**
   * Extract structured resume data from raw text.
   *
   * @param text - The raw text extracted from the PDF
   * @param fields - Optional list of specific fields to extract
   * @returns Parsed resume data
   */
  extract(text: string, fields?: string[]): Promise<Partial<ResumeData>>;
}

/**
 * Builds a system prompt for AI-based resume extraction.
 */
export function buildExtractionPrompt(fields?: string[]): string {
  const fieldSpec = fields?.length
    ? `Only extract these fields: ${fields.join(', ')}.`
    : 'Extract all available fields.';

  return `You are a professional resume parser. Parse the following resume text and return structured JSON data.

${fieldSpec}

Return a JSON object with these possible top-level keys (include only those that have data):
- "contact": { "name", "firstName", "lastName", "email", "phone", "linkedin", "github", "website", "location", "address" }
- "summary": string (professional summary)
- "objective": string (career objective)
- "experience": [{ "company", "title", "location", "startDate", "endDate", "current" (boolean), "description", "highlights" (string[]) }]
- "education": [{ "institution", "degree", "field", "startDate", "endDate", "gpa", "honors", "description" }]
- "skills": [{ "name", "category" }]
- "certifications": [{ "name", "issuer", "date", "expiryDate", "credentialId" }]
- "projects": [{ "name", "description", "technologies" (string[]), "url", "startDate", "endDate" }]
- "languages": [{ "name", "proficiency" }]
- "awards": [{ "title", "issuer", "date", "description" }]
- "publications": [{ "title", "publisher", "date", "url", "description" }]
- "volunteer": [{ "organization", "role", "startDate", "endDate", "description" }]

Dates should be in "YYYY-MM" or "YYYY" format. Return ONLY valid JSON, no markdown or explanation.`;
}
