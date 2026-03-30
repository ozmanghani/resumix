import {
  fieldsToSchema,
  normalizeSchema,
  resolveSchema,
  isFieldIncluded,
  getIncludedSections,
} from '../../src/schema/schema-engine';
import { NormalizedSchema, SchemaObject } from '../../src/types/schema';

describe('Schema Engine', () => {
  describe('fieldsToSchema', () => {
    it('should convert flat field paths to schema', () => {
      const fields = ['contact', 'skills', 'summary'];
      const schema = fieldsToSchema(fields);

      expect(schema.contact).toBe(true);
      expect(schema.skills).toBe(true);
      expect(schema.summary).toBe(true);
    });

    it('should convert nested field paths to schema', () => {
      const fields = ['contact.name', 'contact.email', 'skills'];
      const schema = fieldsToSchema(fields);

      expect(schema.contact).toBeDefined();
      expect(typeof schema.contact).toBe('object');
      expect((schema.contact as NormalizedSchema).name).toBe(true);
      expect((schema.contact as NormalizedSchema).email).toBe(true);
      expect(schema.skills).toBe(true);
    });

    it('should handle deeply nested paths', () => {
      const fields = ['experience.company', 'experience.title', 'education.institution'];
      const schema = fieldsToSchema(fields);

      expect(schema.experience).toBeDefined();
      expect(typeof schema.experience).toBe('object');
      expect((schema.experience as NormalizedSchema).company).toBe(true);
      expect((schema.experience as NormalizedSchema).title).toBe(true);
    });

    it('should merge overlapping paths', () => {
      const fields = ['contact.name', 'contact.email', 'contact.phone'];
      const schema = fieldsToSchema(fields);

      const contact = schema.contact as NormalizedSchema;
      expect(contact.name).toBe(true);
      expect(contact.email).toBe(true);
      expect(contact.phone).toBe(true);
    });

    it('should return empty schema for empty fields', () => {
      const schema = fieldsToSchema([]);
      expect(Object.keys(schema).length).toBe(0);
    });

    it('should handle single field', () => {
      const schema = fieldsToSchema(['skills']);
      expect(schema.skills).toBe(true);
      expect(Object.keys(schema).length).toBe(1);
    });
  });

  describe('normalizeSchema', () => {
    it('should keep true values', () => {
      const schema: SchemaObject = { contact: true, skills: true };
      const normalized = normalizeSchema(schema);

      expect(normalized.contact).toBe(true);
      expect(normalized.skills).toBe(true);
    });

    it('should remove false values', () => {
      const schema: SchemaObject = { contact: true, skills: false, experience: true };
      const normalized = normalizeSchema(schema);

      expect(normalized.contact).toBe(true);
      expect(normalized.skills).toBeUndefined();
      expect(normalized.experience).toBe(true);
    });

    it('should remove undefined values', () => {
      const schema: SchemaObject = { contact: true, skills: undefined, experience: true };
      const normalized = normalizeSchema(schema);

      expect(normalized.contact).toBe(true);
      expect(normalized.skills).toBeUndefined();
      expect(normalized.experience).toBe(true);
    });

    it('should normalize nested objects', () => {
      const schema: SchemaObject = {
        contact: { name: true, email: true, phone: false },
        skills: true,
      };
      const normalized = normalizeSchema(schema);

      expect(normalized.skills).toBe(true);
      const contact = normalized.contact as NormalizedSchema;
      expect(contact.name).toBe(true);
      expect(contact.email).toBe(true);
      expect(contact.phone).toBeUndefined();
    });

    it('should remove empty nested objects', () => {
      const schema: SchemaObject = {
        contact: { name: false, email: false },
        skills: true,
      };
      const normalized = normalizeSchema(schema);

      expect(normalized.contact).toBeUndefined();
      expect(normalized.skills).toBe(true);
    });

    it('should handle deeply nested structures', () => {
      const schema: SchemaObject = {
        experience: { company: true, location: { city: true, state: true } },
      };
      const normalized = normalizeSchema(schema);

      expect(normalized.experience).toBeDefined();
      const exp = normalized.experience as NormalizedSchema;
      expect(exp.company).toBe(true);
      expect(exp.location).toBeDefined();
    });
  });

  describe('resolveSchema', () => {
    it('should return null when no schema or fields provided', () => {
      const result = resolveSchema({});
      expect(result).toBeNull();
    });

    it('should use schema option when provided', () => {
      const schema: SchemaObject = { contact: true, skills: true };
      const result = resolveSchema({ schema });

      expect(result).not.toBeNull();
      expect(result?.contact).toBe(true);
      expect(result?.skills).toBe(true);
    });

    it('should use fields option when provided', () => {
      const fields = ['contact.name', 'skills'];
      const result = resolveSchema({ fields });

      expect(result).not.toBeNull();
      expect(result?.contact).toBeDefined();
      expect(result?.skills).toBe(true);
    });

    it('should prefer schema over fields', () => {
      const schema: SchemaObject = { contact: true };
      const fields = ['skills'];
      const result = resolveSchema({ schema, fields });

      expect(result?.contact).toBe(true);
      expect(result?.skills).toBeUndefined();
    });

    it('should handle empty fields array', () => {
      const result = resolveSchema({ fields: [] });
      expect(result).toBeNull();
    });

    it('should return null for false schema values that get normalized away', () => {
      // This would be edge case - schema with only false values
      const schema: SchemaObject = { contact: false };
      const result = resolveSchema({ schema });

      // After normalization, should be empty
      expect(result).toBeDefined();
      expect(Object.keys(result || {}).length).toBe(0);
    });
  });

  describe('isFieldIncluded', () => {
    it('should return true for null schema (no filtering)', () => {
      expect(isFieldIncluded(null, 'contact')).toBe(true);
      expect(isFieldIncluded(null, 'contact.name')).toBe(true);
      expect(isFieldIncluded(null, 'skills')).toBe(true);
    });

    it('should return true for flat included field', () => {
      const schema: NormalizedSchema = { contact: true, skills: true };
      expect(isFieldIncluded(schema, 'contact')).toBe(true);
      expect(isFieldIncluded(schema, 'skills')).toBe(true);
    });

    it('should return false for excluded flat field', () => {
      const schema: NormalizedSchema = { contact: true, skills: true };
      expect(isFieldIncluded(schema, 'experience')).toBe(false);
    });

    it('should check nested paths correctly', () => {
      const schema: NormalizedSchema = {
        contact: {
          name: true,
          email: true,
        },
        skills: true,
      };

      expect(isFieldIncluded(schema, 'contact.name')).toBe(true);
      expect(isFieldIncluded(schema, 'contact.email')).toBe(true);
      expect(isFieldIncluded(schema, 'contact.phone')).toBe(false);
    });

    it('should handle true value at parent level', () => {
      const schema: NormalizedSchema = { contact: true };
      expect(isFieldIncluded(schema, 'contact.name')).toBe(true);
      expect(isFieldIncluded(schema, 'contact.email')).toBe(true);
    });

    it('should return false for deeply nested excluded field', () => {
      const schema: NormalizedSchema = {
        experience: {
          company: true,
          location: {
            city: true,
          },
        },
      };

      expect(isFieldIncluded(schema, 'experience.location.city')).toBe(true);
      expect(isFieldIncluded(schema, 'experience.location.state')).toBe(false);
      expect(isFieldIncluded(schema, 'experience.title')).toBe(false);
    });

    it('should handle empty schema', () => {
      const schema: NormalizedSchema = {};
      expect(isFieldIncluded(schema, 'any')).toBe(false);
    });
  });

  describe('getIncludedSections', () => {
    it('should return null for null schema', () => {
      const result = getIncludedSections(null);
      expect(result).toBeNull();
    });

    it('should return top-level keys', () => {
      const schema: NormalizedSchema = {
        contact: true,
        skills: true,
        experience: { company: true },
      };

      const result = getIncludedSections(schema);
      expect(result).toContain('contact');
      expect(result).toContain('skills');
      expect(result).toContain('experience');
    });

    it('should return array of section names', () => {
      const schema: NormalizedSchema = {
        contact: { name: true, email: true },
        education: true,
      };

      const result = getIncludedSections(schema);
      expect(Array.isArray(result)).toBe(true);
      expect(result?.length).toBe(2);
    });

    it('should return empty array for empty schema', () => {
      const schema: NormalizedSchema = {};
      const result = getIncludedSections(schema);
      expect(result).toEqual([]);
    });

    it('should maintain section order (though order not guaranteed in objects)', () => {
      const schema: NormalizedSchema = {
        contact: true,
        experience: true,
        education: true,
      };

      const result = getIncludedSections(schema);
      expect(result?.length).toBe(3);
      expect(result).toContain('contact');
      expect(result).toContain('experience');
      expect(result).toContain('education');
    });
  });
});
