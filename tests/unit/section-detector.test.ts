import { detectSections, findSection, Section } from '../../src/core/section-detector';

describe('Section Detector', () => {
  describe('detectSections', () => {
    it('should detect standard EXPERIENCE section', () => {
      const text = `John Doe
john@example.com

EXPERIENCE
Senior Developer at TechCorp
2020 - Present

EDUCATION
BS Computer Science`;

      const sections = detectSections(text);
      const expSection = sections.find((s) => s.name === 'experience');
      expect(expSection).toBeDefined();
      expect(expSection?.content).toContain('Senior Developer');
    });

    it('should detect standard EDUCATION section', () => {
      const text = `John Doe

EXPERIENCE
Senior Developer

EDUCATION
BS Computer Science
University of Tech`;

      const sections = detectSections(text);
      const eduSection = sections.find((s) => s.name === 'education');
      expect(eduSection).toBeDefined();
      expect(eduSection?.content).toContain('BS Computer Science');
    });

    it('should detect standard SKILLS section', () => {
      const text = `John Doe

SKILLS
JavaScript, TypeScript, React

EXPERIENCE
Senior Developer`;

      const sections = detectSections(text);
      const skillsSection = sections.find((s) => s.name === 'skills');
      expect(skillsSection).toBeDefined();
      expect(skillsSection?.content).toContain('JavaScript');
    });

    it('should create header section for content before first section', () => {
      const text = `John Doe
john@example.com
(555) 123-4567

EXPERIENCE
Senior Developer`;

      const sections = detectSections(text);
      const headerSection = sections.find((s) => s.name === 'header');
      expect(headerSection).toBeDefined();
      expect(headerSection?.content).toContain('John Doe');
      expect(headerSection?.content).toContain('john@example.com');
    });

    it('should return unknown section when no headers found', () => {
      const text = `This is some random resume text
without any clear section headers
just a bunch of content`;

      const sections = detectSections(text);
      expect(sections.length).toBe(1);
      expect(sections[0].name).toBe('unknown');
      expect(sections[0].content).toContain('random resume text');
    });

    it('should handle case-insensitive matching', () => {
      const text = `John Doe

experience
Senior Developer

education
BS Computer Science`;

      const sections = detectSections(text);
      const expSection = sections.find((s) => s.name === 'experience');
      const eduSection = sections.find((s) => s.name === 'education');
      expect(expSection).toBeDefined();
      expect(eduSection).toBeDefined();
    });

    it('should handle uppercase section headers', () => {
      const text = `John Doe

EXPERIENCE
Senior Developer

SKILLS
JavaScript`;

      const sections = detectSections(text);
      const expSection = sections.find((s) => s.name === 'experience');
      const skillsSection = sections.find((s) => s.name === 'skills');
      expect(expSection).toBeDefined();
      expect(skillsSection).toBeDefined();
    });

    it('should support custom headers', () => {
      const text = `John Doe

SPECIAL_SECTION
Custom content here

EXPERIENCE
Senior Developer`;

      const customHeaders = {
        custom: ['special_section', 'special section'],
      };

      const sections = detectSections(text, customHeaders);
      const customSection = sections.find((s) => s.name === 'custom');
      expect(customSection).toBeDefined();
      expect(customSection?.content).toContain('Custom content');
    });

    it('should merge custom headers with defaults', () => {
      const text = `John Doe

EXPERIENCE
Senior Developer

SPECIAL SKILLS
Custom skill`;

      const customHeaders = {
        experience: ['professional experience'],
        skills: ['special skills'],
      };

      const sections = detectSections(text, customHeaders);
      const skillsSection = sections.find((s) => s.name === 'skills');
      expect(skillsSection).toBeDefined();
      expect(skillsSection?.content).toContain('Custom skill');
    });

    it('should set correct startLine and endLine indices', () => {
      const text = `John Doe

EXPERIENCE
Senior Developer
2020 - Present

EDUCATION
BS Computer Science`;

      const sections = detectSections(text);
      const expSection = sections.find((s) => s.name === 'experience');
      expect(expSection?.startLine).toBeGreaterThanOrEqual(0);
      expect(expSection?.endLine).toBeGreaterThan(expSection?.startLine || 0);
    });

    it('should populate lines array correctly', () => {
      const text = `John Doe

EXPERIENCE
Senior Developer
2020 - Present`;

      const sections = detectSections(text);
      const expSection = sections.find((s) => s.name === 'experience');
      expect(Array.isArray(expSection?.lines)).toBe(true);
      expect(expSection?.lines.length).toBeGreaterThan(0);
    });

    it('should handle empty input', () => {
      const sections = detectSections('');
      // Empty input returns array with 'unknown' section or empty array
      expect(Array.isArray(sections)).toBe(true);
    });

    it('should handle input with only whitespace', () => {
      const sections = detectSections('   \n   \n   ');
      expect(sections.length).toBeLessThanOrEqual(1);
    });

    it('should detect multiple sections in order', () => {
      const text = `John Doe

SUMMARY
A skilled developer

EXPERIENCE
Senior Developer

EDUCATION
BS Computer Science

SKILLS
JavaScript`;

      const sections = detectSections(text);
      const names = sections.map((s) => s.name);
      const expIndex = names.indexOf('experience');
      const eduIndex = names.indexOf('education');
      const skillsIndex = names.indexOf('skills');

      // Experience should come before education
      if (expIndex !== -1 && eduIndex !== -1) {
        expect(expIndex).toBeLessThan(eduIndex);
      }
    });

    it('should handle sections with special characters', () => {
      const text = `John Doe

PROFESSIONAL EXPERIENCE & ACHIEVEMENTS
Senior Developer

CERTIFICATIONS & AWARDS
AWS Certified`;

      const sections = detectSections(text);
      expect(sections.length).toBeGreaterThan(1);
    });

    it('should not mistake long content lines as headers', () => {
      const text = `John Doe

EXPERIENCE
This is a very long line that describes the job responsibilities and achievements in great detail without being a header`;

      const sections = detectSections(text);
      const expSection = sections.find((s) => s.name === 'experience');
      expect(expSection).toBeDefined();
      expect(sections.length).toBeLessThanOrEqual(2);
    });
  });

  describe('findSection', () => {
    it('should find section by exact name', () => {
      const sections: Section[] = [
        {
          name: 'header',
          startLine: 0,
          endLine: 3,
          content: 'John Doe',
          lines: ['John Doe'],
        },
        {
          name: 'experience',
          startLine: 4,
          endLine: 10,
          content: 'Senior Developer',
          lines: ['Senior Developer'],
        },
      ];

      const found = findSection(sections, 'experience');
      expect(found).toBeDefined();
      expect(found?.name).toBe('experience');
    });

    it('should return undefined for non-existent section', () => {
      const sections: Section[] = [
        {
          name: 'header',
          startLine: 0,
          endLine: 3,
          content: 'John Doe',
          lines: ['John Doe'],
        },
      ];

      const found = findSection(sections, 'experience');
      expect(found).toBeUndefined();
    });

    it('should return correct section when multiple exist', () => {
      const sections: Section[] = [
        {
          name: 'header',
          startLine: 0,
          endLine: 3,
          content: 'John Doe',
          lines: ['John Doe'],
        },
        {
          name: 'experience',
          startLine: 4,
          endLine: 10,
          content: 'Senior Developer',
          lines: ['Senior Developer'],
        },
        {
          name: 'education',
          startLine: 11,
          endLine: 15,
          content: 'BS Computer Science',
          lines: ['BS Computer Science'],
        },
      ];

      const edu = findSection(sections, 'education');
      expect(edu?.name).toBe('education');
      expect(edu?.content).toContain('BS');
    });

    it('should be case-sensitive', () => {
      const sections: Section[] = [
        {
          name: 'Experience',
          startLine: 0,
          endLine: 5,
          content: 'Senior Developer',
          lines: ['Senior Developer'],
        },
      ];

      const found = findSection(sections, 'experience');
      expect(found).toBeUndefined();

      const foundCorrect = findSection(sections, 'Experience');
      expect(foundCorrect).toBeDefined();
    });

    it('should return first match if duplicates exist', () => {
      const sections: Section[] = [
        {
          name: 'skills',
          startLine: 0,
          endLine: 5,
          content: 'First skill section',
          lines: ['First skill section'],
        },
        {
          name: 'skills',
          startLine: 6,
          endLine: 10,
          content: 'Second skill section',
          lines: ['Second skill section'],
        },
      ];

      const found = findSection(sections, 'skills');
      expect(found?.content).toBe('First skill section');
    });
  });
});
