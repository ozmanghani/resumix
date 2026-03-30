/**
 * Schema types for defining which fields to extract.
 * Supports both schema objects and field arrays.
 */

/**
 * A schema value can be:
 * - `true` to include the field
 * - `false` to exclude the field
 * - A nested object for sub-field selection
 */
export type SchemaValue = boolean | { [key: string]: SchemaValue };

/**
 * Schema object for defining which resume fields to extract.
 *
 * @example
 * ```typescript
 * const schema: SchemaObject = {
 *   contact: { name: true, email: true },
 *   skills: true,
 *   experience: { company: true, title: true },
 * };
 * ```
 */
export interface SchemaObject {
  contact?: SchemaValue;
  summary?: SchemaValue;
  objective?: SchemaValue;
  experience?: SchemaValue;
  education?: SchemaValue;
  skills?: SchemaValue;
  certifications?: SchemaValue;
  projects?: SchemaValue;
  languages?: SchemaValue;
  awards?: SchemaValue;
  publications?: SchemaValue;
  volunteer?: SchemaValue;
  [key: string]: SchemaValue | undefined;
}

/**
 * A field path string using dot notation.
 *
 * @example
 * ```typescript
 * const fields: FieldPath[] = [
 *   'contact.name',
 *   'contact.email',
 *   'skills',
 *   'experience.company',
 * ];
 * ```
 */
export type FieldPath = string;

/**
 * Normalized internal schema representation.
 * Used after converting field arrays to schema objects.
 */
export interface NormalizedSchema {
  [key: string]: true | NormalizedSchema;
}
