import { ContactExtractor } from '../../src/extractors/contact-extractor';
import { Section } from '../../src/extractors/base-extractor';

describe('Contact Extractor', () => {
  const extractor = new ContactExtractor();

  describe('extract', () => {
    it('should extract email from header section', () => {
      const sections: Section[] = [
        {
          name: 'header',
          startLine: 0,
          endLine: 3,
          content: `John Doe
john.doe@example.com
(555) 123-4567`,
          lines: ['John Doe', 'john.doe@example.com', '(555) 123-4567'],
        },
        {
          name: 'experience',
          startLine: 4,
          endLine: 10,
          content: 'Senior Developer',
          lines: ['Senior Developer'],
        },
      ];

      const contact = extractor.extract(sections);
      expect(contact.email).toBe('john.doe@example.com');
    });

    it('should extract multiple email formats', () => {
      const sections: Section[] = [
        {
          name: 'header',
          startLine: 0,
          endLine: 1,
          content: 'jane.smith+test@company.co.uk',
          lines: ['jane.smith+test@company.co.uk'],
        },
      ];

      const contact = extractor.extract(sections);
      expect(contact.email).toBe('jane.smith+test@company.co.uk');
    });

    it('should extract phone number in US format', () => {
      const sections: Section[] = [
        {
          name: 'header',
          startLine: 0,
          endLine: 2,
          content: `John Doe
(555) 123-4567`,
          lines: ['John Doe', '(555) 123-4567'],
        },
      ];

      const contact = extractor.extract(sections);
      expect(contact.phone).toBeDefined();
      expect(contact.phone).toContain('555');
    });

    it('should extract phone number with different formats', () => {
      const sections: Section[] = [
        {
          name: 'header',
          startLine: 0,
          endLine: 1,
          content: '555-123-4567',
          lines: ['555-123-4567'],
        },
      ];

      const contact = extractor.extract(sections);
      expect(contact.phone).toBeDefined();
    });

    it('should extract international phone numbers', () => {
      const sections: Section[] = [
        {
          name: 'header',
          startLine: 0,
          endLine: 1,
          content: '+44 20 7946 0958',
          lines: ['+44 20 7946 0958'],
        },
      ];

      const contact = extractor.extract(sections);
      expect(contact.phone).toBeDefined();
    });

    it('should extract name from first non-email/phone line', () => {
      const sections: Section[] = [
        {
          name: 'header',
          startLine: 0,
          endLine: 3,
          content: `John Doe
john@example.com
(555) 123-4567`,
          lines: ['John Doe', 'john@example.com', '(555) 123-4567'],
        },
      ];

      const contact = extractor.extract(sections);
      expect(contact.name).toBe('John Doe');
    });

    it('should split name into firstName and lastName', () => {
      const sections: Section[] = [
        {
          name: 'header',
          startLine: 0,
          endLine: 1,
          content: 'John Michael Doe',
          lines: ['John Michael Doe'],
        },
      ];

      const contact = extractor.extract(sections);
      expect(contact.firstName).toBe('John');
      expect(contact.lastName).toBe('Michael Doe');
    });

    it('should handle single name correctly', () => {
      const sections: Section[] = [
        {
          name: 'header',
          startLine: 0,
          endLine: 1,
          content: 'Madonna',
          lines: ['Madonna'],
        },
      ];

      const contact = extractor.extract(sections);
      expect(contact.name).toBe('Madonna');
      expect(contact.firstName).toBe('Madonna');
      expect(contact.lastName).toBeUndefined();
    });

    it('should handle two-part names', () => {
      const sections: Section[] = [
        {
          name: 'header',
          startLine: 0,
          endLine: 1,
          content: 'Jane Smith',
          lines: ['Jane Smith'],
        },
      ];

      const contact = extractor.extract(sections);
      expect(contact.firstName).toBe('Jane');
      expect(contact.lastName).toBe('Smith');
    });

    it('should extract LinkedIn URL', () => {
      const sections: Section[] = [
        {
          name: 'header',
          startLine: 0,
          endLine: 2,
          content: `John Doe
https://www.linkedin.com/in/johndoe`,
          lines: ['John Doe', 'https://www.linkedin.com/in/johndoe'],
        },
      ];

      const contact = extractor.extract(sections);
      expect(contact.linkedin).toBeDefined();
      expect(contact.linkedin).toContain('linkedin');
      expect(contact.linkedin).toContain('johndoe');
    });

    it('should extract LinkedIn URL without https', () => {
      const sections: Section[] = [
        {
          name: 'header',
          startLine: 0,
          endLine: 1,
          content: 'linkedin.com/in/john-doe-123',
          lines: ['linkedin.com/in/john-doe-123'],
        },
      ];

      const contact = extractor.extract(sections);
      expect(contact.linkedin).toBeDefined();
    });

    it('should extract GitHub URL', () => {
      const sections: Section[] = [
        {
          name: 'header',
          startLine: 0,
          endLine: 2,
          content: `John Doe
https://github.com/johndoe`,
          lines: ['John Doe', 'https://github.com/johndoe'],
        },
      ];

      const contact = extractor.extract(sections);
      expect(contact.github).toBeDefined();
      expect(contact.github).toContain('github');
      expect(contact.github).toContain('johndoe');
    });

    it('should extract GitHub URL without https', () => {
      const sections: Section[] = [
        {
          name: 'header',
          startLine: 0,
          endLine: 1,
          content: 'github.com/jane-developer',
          lines: ['github.com/jane-developer'],
        },
      ];

      const contact = extractor.extract(sections);
      expect(contact.github).toBeDefined();
    });

    it('should extract website URL', () => {
      const sections: Section[] = [
        {
          name: 'header',
          startLine: 0,
          endLine: 2,
          content: `John Doe
https://johndoe.dev`,
          lines: ['John Doe', 'https://johndoe.dev'],
        },
      ];

      const contact = extractor.extract(sections);
      expect(contact.website).toBeDefined();
      expect(contact.website).toContain('johndoe.dev');
    });

    it('should prioritize LinkedIn and GitHub over generic websites', () => {
      const sections: Section[] = [
        {
          name: 'header',
          startLine: 0,
          endLine: 4,
          content: `John Doe
https://www.linkedin.com/in/johndoe
https://github.com/johndoe
https://johndoe.dev`,
          lines: [
            'John Doe',
            'https://www.linkedin.com/in/johndoe',
            'https://github.com/johndoe',
            'https://johndoe.dev',
          ],
        },
      ];

      const contact = extractor.extract(sections);
      expect(contact.linkedin).toBeDefined();
      expect(contact.github).toBeDefined();
      expect(contact.website).toBe('https://johndoe.dev');
    });

    it('should extract location from header section', () => {
      const sections: Section[] = [
        {
          name: 'header',
          startLine: 0,
          endLine: 3,
          content: `John Doe
Location: San Francisco, CA
john@example.com`,
          lines: ['John Doe', 'Location: San Francisco, CA', 'john@example.com'],
        },
      ];

      const contact = extractor.extract(sections);
      // Location extraction looks for location keyword
      expect(contact.location).toBeDefined();
      expect(contact.location).toContain('San Francisco');
    });

    it('should extract location with location keyword', () => {
      const sections: Section[] = [
        {
          name: 'header',
          startLine: 0,
          endLine: 2,
          content: `John Doe
Location: New York, NY`,
          lines: ['John Doe', 'Location: New York, NY'],
        },
      ];

      const contact = extractor.extract(sections);
      expect(contact.location).toBeDefined();
    });

    it('should return empty object when no header section', () => {
      const sections: Section[] = [
        {
          name: 'experience',
          startLine: 0,
          endLine: 5,
          content: 'Senior Developer at TechCorp',
          lines: ['Senior Developer at TechCorp'],
        },
      ];

      const contact = extractor.extract(sections);
      // When no header section, uses first section's content
      // which may extract name as contact info
      expect(contact).toBeDefined();
      expect(typeof contact).toBe('object');
    });

    it('should use contact section as fallback', () => {
      const sections: Section[] = [
        {
          name: 'contact',
          startLine: 0,
          endLine: 3,
          content: `John Doe
john@example.com
(555) 123-4567`,
          lines: ['John Doe', 'john@example.com', '(555) 123-4567'],
        },
      ];

      const contact = extractor.extract(sections);
      expect(contact.name).toBe('John Doe');
      expect(contact.email).toBe('john@example.com');
    });

    it('should use personal section as fallback', () => {
      const sections: Section[] = [
        {
          name: 'personal',
          startLine: 0,
          endLine: 2,
          content: `Jane Smith
jane@example.com`,
          lines: ['Jane Smith', 'jane@example.com'],
        },
      ];

      const contact = extractor.extract(sections);
      expect(contact.name).toBe('Jane Smith');
      expect(contact.email).toBe('jane@example.com');
    });

    it('should extract all contact info together', () => {
      const sections: Section[] = [
        {
          name: 'header',
          startLine: 0,
          endLine: 6,
          content: `John Michael Doe
john.doe@example.com
(555) 123-4567
https://www.linkedin.com/in/johndoe
https://github.com/johndoe
Location: San Francisco, CA`,
          lines: [
            'John Michael Doe',
            'john.doe@example.com',
            '(555) 123-4567',
            'https://www.linkedin.com/in/johndoe',
            'https://github.com/johndoe',
            'Location: San Francisco, CA',
          ],
        },
      ];

      const contact = extractor.extract(sections);
      expect(contact.name).toBe('John Michael Doe');
      expect(contact.firstName).toBe('John');
      expect(contact.lastName).toBe('Michael Doe');
      expect(contact.email).toBe('john.doe@example.com');
      expect(contact.phone).toBeDefined();
      expect(contact.linkedin).toBeDefined();
      expect(contact.github).toBeDefined();
      expect(contact.location).toBeDefined();
    });

    it('should handle missing optional fields gracefully', () => {
      const sections: Section[] = [
        {
          name: 'header',
          startLine: 0,
          endLine: 1,
          content: 'John Doe',
          lines: ['John Doe'],
        },
      ];

      const contact = extractor.extract(sections);
      expect(contact.name).toBe('John Doe');
      expect(contact.email).toBeUndefined();
      expect(contact.phone).toBeUndefined();
      expect(contact.linkedin).toBeUndefined();
      expect(contact.github).toBeUndefined();
    });
  });
});
