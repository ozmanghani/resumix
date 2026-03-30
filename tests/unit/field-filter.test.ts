import { filterBySchema } from '../../src/schema/field-filter';
import { NormalizedSchema } from '../../src/types/schema';
import { ResumeData, ContactInfo, Skill, Experience } from '../../src/types/resume';

describe('Field Filter', () => {
  describe('filterBySchema', () => {
    it('should return data unchanged for null schema', () => {
      const data: ResumeData = {
        contact: { name: 'John Doe', email: 'john@example.com' },
        skills: [{ name: 'JavaScript' }, { name: 'TypeScript' }],
        summary: 'A skilled developer',
      };

      const result = filterBySchema(data, null);
      expect(result).toEqual(data);
    });

    it('should filter top-level keys', () => {
      const data: ResumeData = {
        contact: { name: 'John Doe' },
        skills: [{ name: 'JavaScript' }],
        summary: 'A skilled developer',
        experience: [{ company: 'TechCorp', title: 'Senior Dev' }],
      };

      const schema: NormalizedSchema = {
        contact: true,
        skills: true,
      };

      const result = filterBySchema(data, schema);
      expect(result.contact).toBeDefined();
      expect(result.skills).toBeDefined();
      expect(result.summary).toBeUndefined();
      expect(result.experience).toBeUndefined();
    });

    it('should filter nested keys in objects', () => {
      const data: ResumeData = {
        contact: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '555-1234',
          linkedin: 'https://linkedin.com/in/johndoe',
        },
      };

      const schema: NormalizedSchema = {
        contact: {
          name: true,
          email: true,
        },
      };

      const result = filterBySchema(data, schema);
      expect(result.contact?.name).toBe('John Doe');
      expect(result.contact?.email).toBe('john@example.com');
      expect(result.contact?.phone).toBeUndefined();
      expect(result.contact?.linkedin).toBeUndefined();
    });

    it('should include all nested fields when parent is true', () => {
      const data: ResumeData = {
        contact: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '555-1234',
        },
        skills: [{ name: 'JavaScript' }],
      };

      const schema: NormalizedSchema = {
        contact: true,
      };

      const result = filterBySchema(data, schema);
      expect(result.contact?.name).toBe('John Doe');
      expect(result.contact?.email).toBe('john@example.com');
      expect(result.contact?.phone).toBe('555-1234');
      expect(result.skills).toBeUndefined();
    });

    it('should handle arrays correctly', () => {
      const data: ResumeData = {
        skills: [
          { name: 'JavaScript', category: 'Languages' },
          { name: 'React', category: 'Frameworks' },
          { name: 'Node.js', category: 'Frameworks' },
        ],
      };

      const schema: NormalizedSchema = {
        skills: {
          name: true,
        },
      };

      const result = filterBySchema(data, schema);
      expect(result.skills).toBeDefined();
      expect(result.skills?.length).toBe(3);
      expect(result.skills?.[0].name).toBe('JavaScript');
      expect(result.skills?.[0].category).toBeUndefined();
      expect(result.skills?.[1].name).toBe('React');
      expect(result.skills?.[1].category).toBeUndefined();
    });

    it('should handle arrays with true schema', () => {
      const data: ResumeData = {
        skills: [
          { name: 'JavaScript', category: 'Languages' },
          { name: 'React', category: 'Frameworks' },
        ],
      };

      const schema: NormalizedSchema = {
        skills: true,
      };

      const result = filterBySchema(data, schema);
      expect(result.skills).toEqual(data.skills);
    });

    it('should handle nested arrays with object filtering', () => {
      const data: ResumeData = {
        experience: [
          {
            company: 'TechCorp',
            title: 'Senior Developer',
            location: 'San Francisco, CA',
            startDate: '2020-01-01',
            description: 'Led team of developers',
          },
          {
            company: 'StartupXYZ',
            title: 'Junior Developer',
            location: 'New York, NY',
            startDate: '2018-01-01',
            description: 'Built features',
          },
        ],
      };

      const schema: NormalizedSchema = {
        experience: {
          company: true,
          title: true,
        },
      };

      const result = filterBySchema(data, schema);
      expect(result.experience?.[0].company).toBe('TechCorp');
      expect(result.experience?.[0].title).toBe('Senior Developer');
      expect(result.experience?.[0].location).toBeUndefined();
      expect(result.experience?.[0].startDate).toBeUndefined();
      expect(result.experience?.[1].company).toBe('StartupXYZ');
      expect(result.experience?.[1].title).toBe('Junior Developer');
    });

    it('should preserve null values', () => {
      const data: ResumeData = {
        contact: {
          name: 'John Doe',
          email: null as unknown as string,
        },
      };

      const schema: NormalizedSchema = {
        contact: {
          name: true,
          email: true,
        },
      };

      const result = filterBySchema(data, schema);
      expect(result.contact?.name).toBe('John Doe');
      expect(result.contact?.email).toBeNull();
    });

    it('should preserve undefined values', () => {
      const data: ResumeData = {
        contact: {
          name: 'John Doe',
          email: undefined,
        },
      };

      const schema: NormalizedSchema = {
        contact: {
          name: true,
          email: true,
        },
      };

      const result = filterBySchema(data, schema);
      expect(result.contact?.name).toBe('John Doe');
      expect(result.contact?.email).toBeUndefined();
    });

    it('should handle empty arrays', () => {
      const data: ResumeData = {
        skills: [],
      };

      const schema: NormalizedSchema = {
        skills: {
          name: true,
        },
      };

      const result = filterBySchema(data, schema);
      expect(result.skills).toEqual([]);
    });

    it('should handle deeply nested structures', () => {
      const data: ResumeData = {
        experience: [
          {
            company: 'TechCorp',
            description: 'Led team, shipped features',
          },
        ],
      };

      const schema: NormalizedSchema = {
        experience: {
          company: true,
          title: true,
        },
      };

      const result = filterBySchema(data, schema);
      expect((result.experience as any)?.[0].company).toBe('TechCorp');
      expect((result.experience as any)?.[0].title).toBeUndefined();
      expect((result.experience as any)?.[0].description).toBeUndefined();
    });

    it('should handle primitive values correctly', () => {
      const data: ResumeData = {
        summary: 'A skilled full-stack developer with 10 years of experience',
      };

      const schema: NormalizedSchema = {
        summary: true,
      };

      const result = filterBySchema(data, schema);
      expect(result.summary).toBe(
        'A skilled full-stack developer with 10 years of experience'
      );
    });

    it('should handle mixed types in data', () => {
      const data: ResumeData = {
        contact: {
          name: 'John Doe',
          email: 'john@example.com',
        },
        summary: 'Skilled developer',
        skills: [
          { name: 'JavaScript' },
          { name: 'TypeScript' },
        ],
        experience: [
          { company: 'TechCorp', title: 'Senior Dev' },
        ],
      };

      const schema: NormalizedSchema = {
        contact: {
          name: true,
        },
        summary: true,
        skills: true,
      };

      const result = filterBySchema(data, schema);
      expect(result.contact?.name).toBe('John Doe');
      expect(result.contact?.email).toBeUndefined();
      expect(result.summary).toBe('Skilled developer');
      expect(result.skills).toEqual(data.skills);
      expect(result.experience).toBeUndefined();
    });

    it('should handle filters with no matching fields in data', () => {
      const data: ResumeData = {
        contact: {
          name: 'John Doe',
        },
      };

      const schema: NormalizedSchema = {
        contact: {
          name: true,
          email: true,
          phone: true,
        },
      };

      const result = filterBySchema(data, schema);
      expect(result.contact?.name).toBe('John Doe');
      expect(result.contact?.email).toBeUndefined();
      expect(result.contact?.phone).toBeUndefined();
    });

    it('should handle numeric and boolean primitive values', () => {
      const data = {
        experience: [
          {
            company: 'TechCorp',
            yearsOfExperience: 5,
            current: true,
            salary: 150000,
          },
        ],
      };

      const schema: NormalizedSchema = {
        experience: {
          company: true,
          yearsOfExperience: true,
          current: true,
        },
      };

      const result = filterBySchema(data as ResumeData, schema);
      expect((result.experience as any)?.[0].company).toBe('TechCorp');
      expect((result.experience as any)?.[0].yearsOfExperience).toBe(5);
      expect((result.experience as any)?.[0].current).toBe(true);
      expect((result.experience as any)?.[0].salary).toBeUndefined();
    });
  });
});
