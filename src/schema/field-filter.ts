import { NormalizedSchema } from '../types/schema';
import { ResumeData } from '../types/resume';

/**
 * Filters parsed resume data to include only fields specified by the schema.
 * If schema is null, returns data unchanged (no filtering).
 *
 * @param data - The full parsed resume data
 * @param schema - The normalized schema, or null for no filtering
 * @returns Filtered resume data containing only requested fields
 */
export function filterBySchema(
  data: ResumeData,
  schema: NormalizedSchema | null,
): ResumeData {
  if (!schema) return data;
  return deepFilter(data, schema) as ResumeData;
}

/**
 * Recursively filters an object to include only keys present in the schema.
 */
function deepFilter(
  value: unknown,
  schema: NormalizedSchema | true,
): unknown {
  // Schema is `true` — include everything at this level
  if (schema === true) return value;

  // Null / undefined / primitives — return as-is
  if (value === null || value === undefined) return value;
  if (typeof value !== 'object') return value;

  // Arrays — filter each element
  if (Array.isArray(value)) {
    return value.map((item) => deepFilter(item, schema));
  }

  // Objects — filter keys
  const result: Record<string, unknown> = {};
  for (const [key, schemaValue] of Object.entries(schema)) {
    if (key in (value as Record<string, unknown>)) {
      const originalValue = (value as Record<string, unknown>)[key];
      result[key] = deepFilter(originalValue, schemaValue);
    }
  }

  return result;
}
