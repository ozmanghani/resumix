# Resumix

[![npm version](https://img.shields.io/npm/v/resumix.svg?style=flat-square)](https://www.npmjs.com/package/resumix)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3%2B-blue.svg?style=flat-square)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-16%2B-green.svg?style=flat-square)](https://nodejs.org/)

> Advanced PDF resume parser that extracts structured JSON data with schema-driven field selection and optional AI support.

Parse resumes in any format into clean, structured JSON using powerful rule-based parsing or optional AI-powered extraction. Control exactly which fields you want using intuitive schema objects or field arrays.

## Features

✨ **Schema-driven extraction** — Extract only the fields you need using flexible schema objects or field arrays

🎯 **Rule-based parsing by default** — No external dependencies required for basic parsing; works out of the box

🤖 **Optional AI support** — Integrate OpenAI for higher accuracy; loads dynamically so it's not forced on users

📦 **TypeScript-first** — Full type safety with comprehensive type definitions for all data structures

🔀 **Dual CJS/ESM** — Works with both CommonJS and ES modules

🎨 **Structured output** — Consistent JSON schema with proper typing for contact info, experience, education, skills, and more

🔧 **Customizable** — Plug in custom AI providers or define custom section headers

## Installation

```bash
npm install resumix
```

### Optional: AI Support

To use AI-powered extraction with OpenAI, install the peer dependency:

```bash
npm install openai
```

## Quick Start

### Basic Usage

Parse a resume and extract all fields:

```typescript
import { Resumix } from 'resumix';

const result = await Resumix.parse('./resume.pdf');
console.log(result.data.contact?.name);
console.log(result.data.experience);
console.log(result.metadata);
```

### Schema-Based Extraction

Extract specific fields using a schema object:

```typescript
const result = await Resumix.parse('./resume.pdf', {
  schema: {
    contact: { name: true, email: true, phone: true },
    skills: true,
    experience: { company: true, title: true, startDate: true },
  },
});
```

### Field Array Extraction

Extract specific fields using dot notation:

```typescript
const result = await Resumix.parse('./resume.pdf', {
  fields: ['contact.name', 'contact.email', 'skills', 'experience.company', 'experience.title'],
});
```

### From Buffer

Parse from a Buffer instead of a file path:

```typescript
import fs from 'fs';

const pdfBuffer = fs.readFileSync('./resume.pdf');
const result = await Resumix.parse(pdfBuffer);
```

### With AI Enhancement

Use OpenAI for improved accuracy:

```typescript
const result = await Resumix.parse('./resume.pdf', {
  ai: {
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4o-mini',
  },
});
```

### Instance with Defaults

Create a reusable parser with default options:

```typescript
const parser = new Resumix({
  includeRawText: true,
  schema: {
    contact: true,
    experience: true,
    education: true,
    skills: true,
  },
});

const result1 = await parser.parseResume('./resume1.pdf');
const result2 = await parser.parseResume('./resume2.pdf');
```

## API Reference

### `Resumix.parse(input, options?)`

Static method to parse a resume.

**Parameters:**

- `input` (string | Buffer) — File path to the PDF or a Buffer containing PDF data
- `options` (ParseOptions, optional) — Parsing configuration

**Returns:** `Promise<ParseResult>`

**Example:**

```typescript
const result = await Resumix.parse('./resume.pdf', {
  schema: { contact: { name: true, email: true }, skills: true },
});
```

### `new Resumix(defaultOptions?)`

Create a Resumix instance with default options that apply to all subsequent parse calls.

**Parameters:**

- `defaultOptions` (ParseOptions, optional) — Default options for all parsing operations

**Methods:**

- `parseResume(input, options?)` — Parse a resume using instance defaults merged with provided options

**Example:**

```typescript
const parser = new Resumix({ includeRawText: true });
const result = await parser.parseResume('./resume.pdf', {
  schema: { contact: true },
});
```

## Schema Selection

Resumix supports two flexible approaches to specify which fields to extract:

### Schema Objects

Use a nested object structure for fine-grained control:

```typescript
const schema = {
  contact: {
    name: true,
    email: true,
    phone: true,
    linkedin: false, // Explicitly exclude
  },
  experience: true, // Extract entire array
  skills: {
    name: true,
    category: false,
  },
  education: true,
  certifications: false, // Exclude entire section
};

const result = await Resumix.parse('./resume.pdf', { schema });
```

### Field Arrays

Use dot notation for a flat, compact syntax:

```typescript
const fields = [
  'contact.name',
  'contact.email',
  'contact.phone',
  'experience.company',
  'experience.title',
  'experience.startDate',
  'experience.endDate',
  'skills',
  'education.institution',
  'education.degree',
];

const result = await Resumix.parse('./resume.pdf', { fields });
```

**Supported Top-Level Sections:**

- `contact` — Contact information
- `summary` — Professional summary
- `objective` — Career objective
- `experience` — Work experience
- `education` — Education history
- `skills` — Skills and expertise
- `certifications` — Certifications and licenses
- `projects` — Notable projects
- `languages` — Language proficiencies
- `awards` — Awards and honors
- `publications` — Publications
- `volunteer` — Volunteer experience

**Nested Fields (examples):**

- `contact.name`, `contact.email`, `contact.phone`, `contact.linkedin`, `contact.github`, `contact.website`, `contact.location`
- `experience.company`, `experience.title`, `experience.location`, `experience.startDate`, `experience.endDate`, `experience.current`, `experience.description`, `experience.highlights`
- `education.institution`, `education.degree`, `education.field`, `education.startDate`, `education.endDate`, `education.gpa`, `education.honors`

## AI Integration

### Using OpenAI

Enhance parsing accuracy with AI-powered extraction:

```typescript
const result = await Resumix.parse('./resume.pdf', {
  ai: {
    provider: 'openai',
    apiKey: 'sk-...', // or use process.env.OPENAI_API_KEY
    model: 'gpt-4o-mini', // Default: gpt-4o-mini
    maxTokens: 2000,
    temperature: 0.1,
  },
});

console.log(result.metadata.mode); // 'ai'
console.log(result.metadata.confidence); // e.g., 0.85
```

**AI Provider Configuration:**

```typescript
interface AIProviderConfig {
  provider: 'openai' | 'custom';
  apiKey: string;
  model?: string; // Default: 'gpt-4o-mini'
  maxTokens?: number;
  temperature?: number; // 0-1, default: 0.1
  baseUrl?: string; // For proxies or custom endpoints
}
```

**Environment Variables:**

```bash
OPENAI_API_KEY=sk-...
```

```typescript
const result = await Resumix.parse('./resume.pdf', {
  ai: {
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY!,
    model: 'gpt-4o',
  },
});
```

## Custom AI Provider

Implement your own AI extraction logic:

```typescript
import { Resumix, CustomAIProvider } from 'resumix';

class MyCustomAIProvider implements CustomAIProvider {
  async extract(text: string, fields?: string[]): Promise<Record<string, unknown>> {
    // Implement your custom AI logic here
    // Call your own API, use a different LLM, etc.
    
    return {
      contact: {
        name: 'John Doe',
        email: 'john@example.com',
      },
      experience: [
        {
          company: 'Tech Corp',
          title: 'Senior Engineer',
          startDate: '2020-01-15',
        },
      ],
      // ... more data
    };
  }
}

const customProvider = new MyCustomAIProvider();

const result = await Resumix.parse('./resume.pdf', {
  customAIProvider: customProvider,
  schema: { contact: true, experience: true },
});
```

**CustomAIProvider Interface:**

```typescript
interface CustomAIProvider {
  extract(text: string, fields?: string[]): Promise<Record<string, unknown>>;
}
```

## Advanced Usage

### Include Raw Text

Get the extracted PDF text along with parsed data:

```typescript
const result = await Resumix.parse('./resume.pdf', {
  includeRawText: true,
  schema: { contact: true, skills: true },
});

console.log(result.rawText); // Full extracted text
console.log(result.data); // Parsed JSON
```

### Custom Section Headers

Define custom patterns to detect non-standard section headers:

```typescript
const result = await Resumix.parse('./resume.pdf', {
  customSectionHeaders: {
    experience: ['Work History', 'Employment', 'Professional Experience', 'Career'],
    education: ['Academic Background', 'Education & Training', 'Schooling'],
    skills: ['Core Competencies', 'Technical Skills', 'Expertise'],
  },
});
```

### Metadata Inspection

Access detailed parsing metadata:

```typescript
const result = await Resumix.parse('./resume.pdf');

console.log(result.metadata.pages); // Number of pages
console.log(result.metadata.duration); // Parsing time in ms
console.log(result.metadata.mode); // 'rule-based' or 'ai'
console.log(result.metadata.sectionsDetected); // ['contact', 'experience', 'education', ...]
console.log(result.metadata.confidence); // AI confidence score (0-1), if using AI
```

### Reusable Parser with Merged Options

Combine instance defaults with per-call options:

```typescript
const parser = new Resumix({
  includeRawText: true,
  customSectionHeaders: {
    experience: ['Work History'],
  },
});

// Uses instance defaults
const result1 = await parser.parseResume('./resume.pdf');

// Merges and overrides instance defaults
const result2 = await parser.parseResume('./resume.pdf', {
  schema: { contact: true, skills: true }, // Overrides defaults
  includeRawText: false, // Overrides instance default
});
```

## TypeScript Support

Resumix is built with TypeScript and provides comprehensive type definitions:

```typescript
import {
  Resumix,
  ParseResult,
  ResumeData,
  ContactInfo,
  Experience,
  Education,
  Skill,
  ParseOptions,
  SchemaObject,
  AIProviderConfig,
} from 'resumix';

// Fully typed result
const result: ParseResult = await Resumix.parse('./resume.pdf');

// Typed resume data
const contact: ContactInfo | undefined = result.data.contact;
const experiences: Experience[] | undefined = result.data.experience;

// Typed schema
const schema: SchemaObject = {
  contact: { name: true, email: true },
  experience: { company: true, title: true },
  skills: true,
};

// Typed options
const options: ParseOptions = {
  schema,
  ai: {
    provider: 'openai',
    apiKey: 'sk-...',
    model: 'gpt-4o-mini',
  },
};
```

### Available Types

**Resume Data:**

- `ResumeData` — Complete parsed resume
- `ContactInfo` — Contact details
- `Experience` — Work experience entry
- `Education` — Education entry
- `Skill` — Skill with optional category
- `Certification` — Certification entry
- `Project` — Project entry
- `Language` — Language with proficiency
- `Award` — Award entry
- `Publication` — Publication entry
- `VolunteerExperience` — Volunteer work entry
- `ParseResult` — Complete parsing result with data and metadata
- `ParseMetadata` — Parsing operation metadata

**Configuration:**

- `ParseOptions` — Parsing configuration
- `SchemaObject` — Schema definition
- `FieldPath` — Field path string type
- `AIProviderConfig` — AI configuration
- `CustomAIProvider` — Custom AI provider interface
- `IAIProvider` — Internal AI provider interface

## Output Structure

The `ParseResult` includes both extracted data and metadata:

```typescript
interface ParseResult {
  data: ResumeData;        // Extracted resume data
  metadata: ParseMetadata; // Parsing metadata
  rawText?: string;        // Optional raw PDF text
}

interface ResumeData {
  contact?: ContactInfo;
  summary?: string;
  objective?: string;
  experience?: Experience[];
  education?: Education[];
  skills?: Skill[];
  certifications?: Certification[];
  projects?: Project[];
  languages?: Language[];
  awards?: Award[];
  publications?: Publication[];
  volunteer?: VolunteerExperience[];
}

interface ParseMetadata {
  pages: number;                      // Total pages in PDF
  duration: number;                   // Parsing duration in ms
  mode: 'rule-based' | 'ai';         // Parsing mode used
  sectionsDetected: string[];         // Detected sections
  confidence?: number;                // AI confidence (0-1) if using AI
}
```

## Error Handling

Handle parsing errors gracefully:

```typescript
import { Resumix, ResumixError } from 'resumix';

try {
  const result = await Resumix.parse('./resume.pdf');
  console.log(result.data);
} catch (error) {
  if (error instanceof ResumixError) {
    console.error('Parsing error:', error.message);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Performance Tips

- **For quick parsing:** Use rule-based mode (default) for speed
- **For accuracy:** Use AI mode with OpenAI when accuracy is critical
- **For batch processing:** Create a `Resumix` instance with shared defaults
- **For large batches:** Consider rate limiting when using AI mode
- **For memory efficiency:** Don't include raw text unless needed

## Supported Formats

- **Input:** PDF files (via file path or Buffer)
- **Output:** JSON (with full TypeScript typing)

## Requirements

- Node.js 16+
- TypeScript 5.3+ (for type safety)
- OpenAI package (optional, for AI extraction)

## Browser Support

Resumix is designed for Node.js environments. For browser use, consider using it with a backend API.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License — see [LICENSE](LICENSE) file for details.

---

**Need help?** Check out the examples, open an issue, or refer to the type definitions for detailed API documentation.
