import { SchemaObject, FieldPath, NormalizedSchema } from '../types/schema';

/**
 * Converts a field path array into a normalized schema object.
 *
 * @example
 * ```typescript
 * fieldsToSchema(['contact.name', 'contact.email', 'skills'])
 * // => { contact: { name: true, email: true }, skills: true }
 * ```
 */
export function fieldsToSchema(fields: FieldPath[]): NormalizedSchema {
  const schema: NormalizedSchema = {};

  for (const field of fields) {
    const parts = field.split('.');
    let current: NormalizedSchema = schema;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;

      if (isLast) {
        current[part] = true;
      } else {
        if (current[part] === true) {
          // Already fully selected, no need to go deeper
          break;
        }
        if (typeof current[part] !== 'object') {
          current[part] = {};
        }
        current = current[part] as NormalizedSchema;
      }
    }
  }

  return schema;
}

/**
 * Normalizes a SchemaObject into a NormalizedSchema.
 * Converts boolean values and nested objects into a consistent format.
 */
export function normalizeSchema(schema: SchemaObject): NormalizedSchema {
  const result: NormalizedSchema = {};

  for (const [key, value] of Object.entries(schema)) {
    if (value === undefined || value === false) continue;
    if (value === true) {
      result[key] = true;
    } else if (typeof value === 'object') {
      const nested = normalizeSchema(value as SchemaObject);
      if (Object.keys(nested).length > 0) {
        result[key] = nested;
      }
    }
  }

  return result;
}

/**
 * Resolves ParseOptions into a single NormalizedSchema.
 * Handles both `schema` and `fields` options.
 *
 * @returns NormalizedSchema, or null if no schema/fields specified (extract everything)
 */
export function resolveSchema(options: {
  schema?: SchemaObject;
  fields?: FieldPath[];
}): NormalizedSchema | null {
  if (options.schema) {
    return normalizeSchema(options.schema);
  }
  if (options.fields && options.fields.length > 0) {
    return fieldsToSchema(options.fields);
  }
  return null; // No filtering — extract everything
}

/**
 * Checks if a specific field path is included in the schema.
 */
export function isFieldIncluded(schema: NormalizedSchema | null, path: string): boolean {
  if (!schema) return true; // No schema = include everything

  const parts = path.split('.');
  let current: NormalizedSchema | true = schema;

  for (const part of parts) {
    if (current === true) return true;
    if (typeof current !== 'object') return false;

    const next: NormalizedSchema[string] | undefined = current[part];
    if (next === undefined) return false;
    current = next;
  }

  return true;
}

/**
 * Returns the list of top-level section names included in the schema.
 * Used to determine which extractors to run.
 */
export function getIncludedSections(schema: NormalizedSchema | null): string[] | null {
  if (!schema) return null; // Run all extractors
  return Object.keys(schema);
}
