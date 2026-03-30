import { SkillsExtractor } from '../../src/extractors/skills-extractor';
import { Section } from '../../src/extractors/base-extractor';

describe('Skills Extractor', () => {
  const extractor = new SkillsExtractor();

  describe('extract', () => {
    it('should extract comma-separated skills', () => {
      const sections: Section[] = [
        {
          name: 'skills',
          startLine: 0,
          endLine: 2,
          content: 'JavaScript, TypeScript, React, Node.js',
          lines: ['JavaScript, TypeScript, React, Node.js'],
        },
      ];

      const skills = extractor.extract(sections);
      expect(skills.length).toBe(4);
      expect(skills[0].name).toBe('JavaScript');
      expect(skills[1].name).toBe('TypeScript');
      expect(skills[2].name).toBe('React');
      expect(skills[3].name).toBe('Node.js');
    });

    it('should extract pipe-separated skills', () => {
      const sections: Section[] = [
        {
          name: 'skills',
          startLine: 0,
          endLine: 1,
          content: 'Python | Java | C++ | Go',
          lines: ['Python | Java | C++ | Go'],
        },
      ];

      const skills = extractor.extract(sections);
      expect(skills.length).toBe(4);
      expect(skills[0].name).toBe('Python');
      expect(skills[1].name).toBe('Java');
      expect(skills[2].name).toBe('C++');
      expect(skills[3].name).toBe('Go');
    });

    it('should extract semicolon-separated skills', () => {
      const sections: Section[] = [
        {
          name: 'skills',
          startLine: 0,
          endLine: 1,
          content: 'HTML; CSS; JavaScript; Vue.js',
          lines: ['HTML; CSS; JavaScript; Vue.js'],
        },
      ];

      const skills = extractor.extract(sections);
      expect(skills.length).toBe(4);
      expect(skills[0].name).toBe('HTML');
      expect(skills[1].name).toBe('CSS');
      expect(skills[2].name).toBe('JavaScript');
      expect(skills[3].name).toBe('Vue.js');
    });

    it('should extract skills with categories', () => {
      const sections: Section[] = [
        {
          name: 'skills',
          startLine: 0,
          endLine: 3,
          content: `Languages: JavaScript, Python, Go
Frameworks: React, Angular, Vue`,
          lines: [
            'Languages: JavaScript, Python, Go',
            'Frameworks: React, Angular, Vue',
          ],
        },
      ];

      const skills = extractor.extract(sections);
      expect(skills.length).toBeGreaterThan(0);

      // Check that we have at least some skills extracted
      const skillNames = skills.map((s) => s.name);
      expect(skillNames.length).toBeGreaterThan(0);
    });

    it('should handle category with hyphen separator', () => {
      const sections: Section[] = [
        {
          name: 'skills',
          startLine: 0,
          endLine: 2,
          content: `Technical Skills - AWS, Azure, GCP
Soft Skills - Leadership, Communication`,
          lines: [
            'Technical Skills - AWS, Azure, GCP',
            'Soft Skills - Leadership, Communication',
          ],
        },
      ];

      const skills = extractor.extract(sections);
      expect(skills.length).toBeGreaterThan(0);

      // Should have both categorized and flat skills
      const cloudSkills = skills.filter(
        (s) => s.name === 'AWS' || s.name === 'Azure' || s.name === 'GCP'
      );
      expect(cloudSkills.length).toBeGreaterThan(0);
    });

    it('should extract bullet-point skill lists', () => {
      const sections: Section[] = [
        {
          name: 'skills',
          startLine: 0,
          endLine: 4,
          content: `- JavaScript
- TypeScript
- React
- Node.js`,
          lines: ['- JavaScript', '- TypeScript', '- React', '- Node.js'],
        },
      ];

      const skills = extractor.extract(sections);
      expect(skills.length).toBe(4);
      expect(skills.map((s) => s.name)).toEqual([
        'JavaScript',
        'TypeScript',
        'React',
        'Node.js',
      ]);
    });

    it('should extract bullet-point skills with various bullet characters', () => {
      const sections: Section[] = [
        {
          name: 'skills',
          startLine: 0,
          endLine: 4,
          content: `• Java
* Python
+ C++
• JavaScript`,
          lines: ['• Java', '* Python', '+ C++', '• JavaScript'],
        },
      ];

      const skills = extractor.extract(sections);
      expect(skills.length).toBe(4);
      expect(skills.map((s) => s.name)).toContain('Java');
      expect(skills.map((s) => s.name)).toContain('Python');
      expect(skills.map((s) => s.name)).toContain('C++');
      expect(skills.map((s) => s.name)).toContain('JavaScript');
    });

    it('should handle mixed bullet and comma-separated on same line', () => {
      const sections: Section[] = [
        {
          name: 'skills',
          startLine: 0,
          endLine: 2,
          content: `- JavaScript, TypeScript, React
- Node.js, Express, MongoDB`,
          lines: ['- JavaScript, TypeScript, React', '- Node.js, Express, MongoDB'],
        },
      ];

      const skills = extractor.extract(sections);
      expect(skills.length).toBe(6);
      expect(skills.map((s) => s.name)).toContain('JavaScript');
      expect(skills.map((s) => s.name)).toContain('TypeScript');
      expect(skills.map((s) => s.name)).toContain('React');
    });

    it('should return empty array when no skills section found', () => {
      const sections: Section[] = [
        {
          name: 'experience',
          startLine: 0,
          endLine: 5,
          content: 'Senior Developer at TechCorp',
          lines: ['Senior Developer at TechCorp'],
        },
        {
          name: 'education',
          startLine: 6,
          endLine: 10,
          content: 'BS Computer Science',
          lines: ['BS Computer Science'],
        },
      ];

      const skills = extractor.extract(sections);
      expect(skills).toEqual([]);
    });

    it('should find alternative section names', () => {
      const sections: Section[] = [
        {
          name: 'technical skills',
          startLine: 0,
          endLine: 2,
          content: 'JavaScript, Python, Go',
          lines: ['JavaScript, Python, Go'],
        },
      ];

      const skills = extractor.extract(sections);
      expect(skills.length).toBe(3);
    });

    it('should find core competencies section', () => {
      const sections: Section[] = [
        {
          name: 'core competencies',
          startLine: 0,
          endLine: 2,
          content: 'Leadership, Project Management, Agile',
          lines: ['Leadership, Project Management, Agile'],
        },
      ];

      const skills = extractor.extract(sections);
      expect(skills.length).toBe(3);
    });

    it('should handle empty lines in skills section', () => {
      const sections: Section[] = [
        {
          name: 'skills',
          startLine: 0,
          endLine: 5,
          content: 'JavaScript, Python, React, Vue',
          lines: [
            'JavaScript, Python',
            'React, Vue',
          ],
        },
      ];

      const skills = extractor.extract(sections);
      expect(skills.length).toBeGreaterThan(0);
      expect(skills.some((s) => s.name === 'JavaScript')).toBe(true);
      expect(skills.some((s) => s.name === 'React')).toBe(true);
    });

    it('should trim whitespace from skill names', () => {
      const sections: Section[] = [
        {
          name: 'skills',
          startLine: 0,
          endLine: 1,
          content: 'JavaScript  ,   TypeScript  ,   React',
          lines: ['JavaScript  ,   TypeScript  ,   React'],
        },
      ];

      const skills = extractor.extract(sections);
      expect(skills[0].name).toBe('JavaScript');
      expect(skills[1].name).toBe('TypeScript');
      expect(skills[2].name).toBe('React');
    });

    it('should not include empty skill names', () => {
      const sections: Section[] = [
        {
          name: 'skills',
          startLine: 0,
          endLine: 1,
          content: 'JavaScript, , TypeScript, ',
          lines: ['JavaScript, , TypeScript, '],
        },
      ];

      const skills = extractor.extract(sections);
      expect(skills.length).toBe(2);
      expect(skills.map((s) => s.name)).toEqual(['JavaScript', 'TypeScript']);
    });

    it('should handle complex categorized structure', () => {
      const sections: Section[] = [
        {
          name: 'skills',
          startLine: 0,
          endLine: 8,
          content: `Languages:
JavaScript, TypeScript, Python

Frameworks & Libraries:
React, Angular, Vue, Express

Tools & Platforms:
Docker, Kubernetes, AWS`,
          lines: [
            'Languages:',
            'JavaScript, TypeScript, Python',
            'Frameworks & Libraries:',
            'React, Angular, Vue, Express',
            'Tools & Platforms:',
            'Docker, Kubernetes, AWS',
          ],
        },
      ];

      const skills = extractor.extract(sections);
      expect(skills.length).toBeGreaterThan(0);
      expect(skills.some((s) => s.name === 'JavaScript')).toBe(true);
      expect(skills.some((s) => s.name === 'React')).toBe(true);
      expect(skills.some((s) => s.name === 'Docker')).toBe(true);
    });

    it('should handle single skill', () => {
      const sections: Section[] = [
        {
          name: 'skills',
          startLine: 0,
          endLine: 1,
          content: 'Leadership',
          lines: ['Leadership'],
        },
      ];

      const skills = extractor.extract(sections);
      expect(skills.length).toBe(1);
      expect(skills[0].name).toBe('Leadership');
    });

    it('should preserve skills with special characters', () => {
      const sections: Section[] = [
        {
          name: 'skills',
          startLine: 0,
          endLine: 1,
          content: 'C++, C#, F#, Node.js, Vue.js, ASP.NET',
          lines: ['C++, C#, F#, Node.js, Vue.js, ASP.NET'],
        },
      ];

      const skills = extractor.extract(sections);
      expect(skills.map((s) => s.name)).toContain('C++');
      expect(skills.map((s) => s.name)).toContain('C#');
      expect(skills.map((s) => s.name)).toContain('Node.js');
    });

    it('should handle "Soft Skills" category', () => {
      const sections: Section[] = [
        {
          name: 'skills',
          startLine: 0,
          endLine: 2,
          content: 'Leadership, Communication, Problem Solving, JavaScript, Python',
          lines: [
            'Leadership, Communication, Problem Solving',
            'JavaScript, Python',
          ],
        },
      ];

      const skills = extractor.extract(sections);
      expect(skills.length).toBeGreaterThan(0);
      // Check that various skills are extracted
      expect(skills.some((s) => s.name === 'Leadership')).toBe(true);
      expect(skills.some((s) => s.name === 'JavaScript')).toBe(true);
    });
  });
});
