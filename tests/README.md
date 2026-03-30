# Resumix Unit Tests

Comprehensive unit test suite for the resumix npm library using Jest with ts-jest.

## Test Files

### 1. `unit/preprocessor.test.ts`
Tests the text preprocessing module (`src/core/preprocessor`).

**Functions tested:**
- `preprocessText(rawText: string)` - Cleans and normalizes PDF text
- `splitIntoLines(text: string)` - Splits text into non-empty trimmed lines

**Coverage:**
- CRLF/CR normalization
- Ligature fixes (ﬁ→fi, ﬂ→fl, ﬀ→ff, ﬃ→ffi, ﬄ→ffl)
- Blank line collapsing (3+→2)
- Page number removal
- Whitespace trimming
- Hyphenated word joining
- 22 test cases

### 2. `unit/section-detector.test.ts`
Tests the section detection module (`src/core/section-detector`).

**Functions tested:**
- `detectSections(text: string, customHeaders?: Record<string, string[]>)` - Detects resume sections
- `findSection(sections: Section[], name: string)` - Finds a section by name

**Coverage:**
- Standard section detection (EXPERIENCE, EDUCATION, SKILLS)
- Header section creation
- Unknown section fallback
- Case-insensitive matching
- Custom headers support
- Section indexing and lines array
- 19 test cases

### 3. `unit/schema-engine.test.ts`
Tests the schema processing module (`src/schema/schema-engine`).

**Functions tested:**
- `fieldsToSchema(fields: string[])` - Converts field paths to schema
- `normalizeSchema(schema: SchemaObject)` - Normalizes schema objects
- `resolveSchema(options)` - Resolves schema from options
- `isFieldIncluded(schema, path)` - Checks if field is in schema
- `getIncludedSections(schema)` - Gets top-level section keys

**Coverage:**
- Field path conversion
- Schema normalization
- Schema resolution
- Field inclusion checks
- Nested path handling
- Empty and null schema handling
- 23 test cases

### 4. `unit/field-filter.test.ts`
Tests the field filtering module (`src/schema/field-filter`).

**Functions tested:**
- `filterBySchema(data: ResumeData, schema: NormalizedSchema | null)` - Filters resume data by schema

**Coverage:**
- Top-level key filtering
- Nested object filtering
- Array element filtering
- Null/undefined value preservation
- Primitive type handling
- Deep nested structures
- Mixed type handling
- 18 test cases

### 5. `unit/contact-extractor.test.ts`
Tests the contact information extractor (`src/extractors/contact-extractor`).

**Functions tested:**
- `ContactExtractor.extract(sections: Section[])` - Extracts contact information

**Coverage:**
- Email extraction
- Phone number extraction (various formats)
- Name extraction and splitting
- LinkedIn URL extraction
- GitHub URL extraction
- Website URL extraction
- Location extraction
- Multi-section fallback (contact, personal, info sections)
- 20 test cases

### 6. `unit/skills-extractor.test.ts`
Tests the skills extractor module (`src/extractors/skills-extractor`).

**Functions tested:**
- `SkillsExtractor.extract(sections: Section[])` - Extracts skills

**Coverage:**
- Comma-separated skills
- Pipe-separated skills
- Semicolon-separated skills
- Categorized skills
- Bullet-point lists
- Mixed formats
- Alternative section names
- Special characters in skill names
- Whitespace handling
- 20 test cases

## Test Statistics

- **Total Test Suites:** 6
- **Total Test Cases:** 133
- **Coverage:** 83.06% statements, 69.23% branches, 83.67% functions, 84.13% lines

## Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- tests/unit/preprocessor.test.ts

# Run in watch mode
npm test -- --watch
```

## Jest Configuration

The tests use the existing `jest.config.js` with:
- ts-jest preset for TypeScript support
- Root directory at `<rootDir>/tests`
- TypeScript configuration from `tsconfig.json`
