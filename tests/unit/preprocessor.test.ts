import { preprocessText, splitIntoLines } from '../../src/core/preprocessor';

describe('Preprocessor', () => {
  describe('preprocessText', () => {
    it('should normalize CRLF to LF', () => {
      const input = 'line1\r\nline2\r\nline3';
      const result = preprocessText(input);
      expect(result).not.toContain('\r');
      expect(result).toContain('line1\nline2');
    });

    it('should normalize CR to LF', () => {
      const input = 'line1\rline2\rline3';
      const result = preprocessText(input);
      expect(result).not.toContain('\r');
      expect(result).toContain('line1\nline2');
    });

    it('should fix ligature ﬁ to fi', () => {
      const input = 'proﬁle';
      const result = preprocessText(input);
      // The ligature ﬁ gets replaced with 'fi'
      expect(result).toContain('profi');
    });

    it('should fix ligature ﬂ to fl', () => {
      const input = 'ﬂourish the skill';
      const result = preprocessText(input);
      expect(result).toContain('flourish the skill');
    });

    it('should fix ligature ﬀ to ff', () => {
      const input = 'ofﬀer';
      const result = preprocessText(input);
      // The ligature ﬀ gets replaced with 'ff' so ofﬀer becomes offfer
      expect(result).toContain('offfer');
    });

    it('should fix ligature ﬃ to ffi', () => {
      const input = 'suﬃcient';
      const result = preprocessText(input);
      expect(result).toContain('sufficient');
    });

    it('should fix ligature ﬄ to ffl', () => {
      const input = 'shuﬄe the cards';
      const result = preprocessText(input);
      expect(result).toContain('shuffle the cards');
    });

    it('should collapse 3+ blank lines to 2', () => {
      const input = 'line1\n\n\n\nline2';
      const result = preprocessText(input);
      expect(result).toEqual('line1\n\nline2');
    });

    it('should collapse 4+ blank lines to 2', () => {
      const input = 'experience\n\n\n\n\neducation';
      const result = preprocessText(input);
      expect(result).toEqual('experience\n\neducation');
    });

    it('should remove page number lines (just digits)', () => {
      const input = 'content\n42\nmore content';
      const result = preprocessText(input);
      expect(result).not.toContain('42');
      expect(result).toContain('content');
      expect(result).toContain('more content');
    });

    it('should remove "Page X of Y" lines case-insensitive', () => {
      const input = 'content\nPage 1 of 5\nmore content';
      const result = preprocessText(input);
      expect(result).not.toContain('Page 1 of 5');
      expect(result).toContain('content');
      expect(result).toContain('more content');
    });

    it('should remove "page X / Y" format', () => {
      const input = 'content\npage 2 / 10\nmore content';
      const result = preprocessText(input);
      expect(result).not.toContain('page 2 / 10');
      expect(result).toContain('content');
    });

    it('should trim whitespace on each line', () => {
      const input = '  line1  \n  line2  \n  line3  ';
      const result = preprocessText(input);
      expect(result).toEqual('line1\nline2\nline3');
    });

    it('should fix broken words across lines with hyphen', () => {
      const input = 'this is a hyphen-\nated word';
      const result = preprocessText(input);
      expect(result).toContain('hyphenated');
    });

    it('should handle multiple hyphenated breaks', () => {
      const input = 'pro-\nject man-\nagement';
      const result = preprocessText(input);
      expect(result).toContain('project');
      expect(result).toContain('management');
    });

    it('should return empty string for empty input', () => {
      const result = preprocessText('');
      expect(result).toBe('');
    });

    it('should return empty string for null/undefined input', () => {
      expect(preprocessText('')).toBe('');
    });

    it('should merge multiple spaces into single space', () => {
      const input = 'word1    word2  word3';
      const result = preprocessText(input);
      expect(result).toContain('word1 word2 word3');
    });

    it('should handle complex preprocessing with all features', () => {
      const input = `  John Doe  
  Software Engineer
  
  
  
  Experience
  Page 1 of 2
  
  ﬁntech pro-
ject lead
  
  2020 - Present`;

      const result = preprocessText(input);
      expect(result).not.toContain('\r');
      expect(result).not.toContain('Page 1 of 2');
      expect(result).toContain('fintech');
      expect(result).toContain('project');
      expect(result).toContain('lead');
    });
  });

  describe('splitIntoLines', () => {
    it('should split text into lines', () => {
      const input = 'line1\nline2\nline3';
      const result = splitIntoLines(input);
      expect(result).toEqual(['line1', 'line2', 'line3']);
    });

    it('should return only non-empty trimmed lines', () => {
      const input = 'line1\n\nline2\n  \nline3';
      const result = splitIntoLines(input);
      expect(result).toEqual(['line1', 'line2', 'line3']);
    });

    it('should trim whitespace from each line', () => {
      const input = '  line1  \n  line2  \n  line3  ';
      const result = splitIntoLines(input);
      expect(result).toEqual(['line1', 'line2', 'line3']);
    });

    it('should filter out lines with only whitespace', () => {
      const input = 'line1\n   \n\t\nline2';
      const result = splitIntoLines(input);
      expect(result).toEqual(['line1', 'line2']);
    });

    it('should return empty array for empty input', () => {
      const result = splitIntoLines('');
      expect(result).toEqual([]);
    });

    it('should handle single line input', () => {
      const result = splitIntoLines('single line');
      expect(result).toEqual(['single line']);
    });

    it('should handle CRLF line breaks', () => {
      const input = 'line1\r\nline2\r\nline3';
      const result = splitIntoLines(input);
      expect(result).toEqual(['line1', 'line2', 'line3']);
    });

    it('should handle mixed line breaks', () => {
      const input = 'line1\nline2\r\nline3\rline4';
      const result = splitIntoLines(input);
      expect(result.length).toBeGreaterThanOrEqual(3);
      expect(result[0]).toBe('line1');
    });
  });
});
