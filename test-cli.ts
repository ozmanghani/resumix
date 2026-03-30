/**
 * 🧪 Resumix CLI Test Script
 *
 * Quick way to test the library from the command line without Postman.
 *
 * ──────────────────────────────────────────
 * USAGE:
 *
 *   # Parse entire resume
 *   npx ts-node test-cli.ts path/to/resume.pdf
 *
 *   # Parse with specific fields
 *   npx ts-node test-cli.ts path/to/resume.pdf --fields contact.name,contact.email,skills
 *
 *   # Parse with schema
 *   npx ts-node test-cli.ts path/to/resume.pdf --schema '{"contact":true,"skills":true}'
 *
 *   # Include raw text
 *   npx ts-node test-cli.ts path/to/resume.pdf --raw
 *
 *   # Save output to file
 *   npx ts-node test-cli.ts path/to/resume.pdf --output result.json
 * ──────────────────────────────────────────
 */

import * as fs from 'fs';
import * as path from 'path';
import { Resumix } from './src/index';
import type { ParseOptions } from './src/index';

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
📄 Resumix CLI Test Tool

Usage:
  npx ts-node test-cli.ts <pdf-path> [options]

Options:
  --fields <fields>    Comma-separated field paths (e.g., contact.name,skills)
  --schema <json>      JSON schema object (e.g., '{"contact":true}')
  --raw                Include raw extracted text in output
  --output <file>      Save result to a JSON file
  --help, -h           Show this help message

Examples:
  npx ts-node test-cli.ts resume.pdf
  npx ts-node test-cli.ts resume.pdf --fields contact,skills,experience
  npx ts-node test-cli.ts resume.pdf --schema '{"contact":{"name":true,"email":true}}'
  npx ts-node test-cli.ts resume.pdf --output parsed.json
`);
    process.exit(0);
  }

  // Parse arguments
  const pdfPath = args[0];
  const options: ParseOptions = {};
  let outputFile: string | null = null;

  for (let i = 1; i < args.length; i++) {
    switch (args[i]) {
      case '--fields':
        options.fields = args[++i]?.split(',').map((f) => f.trim()).filter(Boolean);
        break;
      case '--schema':
        try {
          options.schema = JSON.parse(args[++i]);
        } catch {
          console.error('❌ Invalid JSON for --schema');
          process.exit(1);
        }
        break;
      case '--raw':
        options.includeRawText = true;
        break;
      case '--output':
        outputFile = args[++i];
        break;
    }
  }

  // Validate PDF path
  const resolvedPath = path.resolve(pdfPath);
  if (!fs.existsSync(resolvedPath)) {
    console.error(`❌ File not found: ${resolvedPath}`);
    process.exit(1);
  }

  console.log(`\n📄 Parsing: ${resolvedPath}`);
  if (options.fields) console.log(`🔍 Fields: ${options.fields.join(', ')}`);
  if (options.schema) console.log(`🔍 Schema: ${JSON.stringify(options.schema)}`);
  console.log('');

  try {
    const result = await Resumix.parse(resolvedPath, options);

    // Print metadata
    console.log('── Metadata ──────────────────────────────');
    console.log(`  Pages:     ${result.metadata.pages}`);
    console.log(`  Duration:  ${result.metadata.duration}ms`);
    console.log(`  Mode:      ${result.metadata.mode}`);
    console.log(`  Sections:  ${result.metadata.sectionsDetected.join(', ') || 'none'}`);
    console.log('');

    // Print parsed data
    console.log('── Parsed Data ───────────────────────────');
    console.log(JSON.stringify(result.data, null, 2));

    // Save to file if requested
    if (outputFile) {
      const outputPath = path.resolve(outputFile);
      fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8');
      console.log(`\n💾 Result saved to: ${outputPath}`);
    }

    console.log('\n✅ Done!');
  } catch (error) {
    console.error('❌ Error parsing resume:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
