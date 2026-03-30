/**
 * 🧪 Resumix Test Server
 *
 * A simple Express server to test the Resumix library via Postman or any HTTP client.
 *
 * ──────────────────────────────────────────
 * HOW TO RUN:
 *   npx ts-node test-server.ts
 *
 * ──────────────────────────────────────────
 * POSTMAN SETUP:
 *
 * 1️⃣  Parse full resume (extract everything):
 *     POST http://localhost:3000/parse
 *     Body → form-data → Key: "resume" (type: File) → Value: select your PDF
 *
 * 2️⃣  Parse with specific fields (field array):
 *     POST http://localhost:3000/parse
 *     Body → form-data:
 *       - Key: "resume" (type: File) → Value: your PDF
 *       - Key: "fields" (type: Text) → Value: contact.name,contact.email,skills,experience
 *
 * 3️⃣  Parse with schema (JSON schema object):
 *     POST http://localhost:3000/parse
 *     Body → form-data:
 *       - Key: "resume" (type: File) → Value: your PDF
 *       - Key: "schema" (type: Text) → Value: {"contact":{"name":true,"email":true},"skills":true}
 *
 * 4️⃣  Include raw text:
 *     POST http://localhost:3000/parse
 *     Body → form-data:
 *       - Key: "resume" (type: File) → Value: your PDF
 *       - Key: "includeRawText" (type: Text) → Value: true
 *
 * 5️⃣  Health check:
 *     GET http://localhost:3000/health
 * ──────────────────────────────────────────
 */

import express from 'express';
import multer from 'multer';
import cors from 'cors';
import { Resumix } from './src/index';
import type { ParseOptions } from './src/index';

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Multer config — store uploaded files in memory as Buffer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
});

/**
 * Health check endpoint
 */
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    library: 'resumix',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Main parse endpoint — upload a PDF and get structured JSON back
 */
app.post('/parse', upload.single('resume'), async (req, res) => {
  try {
    // Validate file was uploaded
    if (!req.file) {
      res.status(400).json({
        error: 'No PDF file uploaded. Send a file with key "resume" in form-data.',
      });
      return;
    }

    // Build parse options from request body
    const options: ParseOptions = {};

    // Handle "fields" — comma-separated string
    if (req.body.fields) {
      options.fields = req.body.fields
        .split(',')
        .map((f: string) => f.trim())
        .filter(Boolean);
    }

    // Handle "schema" — JSON string
    if (req.body.schema) {
      try {
        options.schema = JSON.parse(req.body.schema);
      } catch {
        res.status(400).json({
          error: 'Invalid JSON in "schema" field. Must be a valid JSON object.',
        });
        return;
      }
    }

    // Handle "includeRawText"
    if (req.body.includeRawText === 'true') {
      options.includeRawText = true;
    }

    // Handle AI config (if provided)
    if (req.body.aiProvider && req.body.aiApiKey) {
      options.ai = {
        provider: req.body.aiProvider,
        apiKey: req.body.aiApiKey,
        model: req.body.aiModel || 'gpt-4o-mini',
      };
    }

    console.log(`\n📄 Parsing PDF: ${req.file.originalname} (${(req.file.size / 1024).toFixed(1)} KB)`);
    if (options.fields) console.log(`   Fields: ${options.fields.join(', ')}`);
    if (options.schema) console.log(`   Schema: ${JSON.stringify(options.schema)}`);

    // Parse the PDF buffer
    const result = await Resumix.parse(req.file.buffer, options);

    console.log(`✅ Parsed in ${result.metadata.duration}ms | ${result.metadata.pages} page(s) | Sections: ${result.metadata.sectionsDetected.join(', ')}`);

    res.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error('❌ Parse error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      code: (error as { code?: string }).code || 'UNKNOWN',
    });
  }
});

/**
 * Error handling middleware
 */
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err.message === 'Only PDF files are allowed') {
    res.status(400).json({ error: err.message });
  } else if (err.message.includes('File too large')) {
    res.status(413).json({ error: 'File too large. Max size is 10MB.' });
  } else {
    res.status(500).json({ error: err.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║               🧪 Resumix Test Server                    ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  Server running at: http://localhost:${PORT}               ║
║                                                          ║
║  ENDPOINTS:                                              ║
║  ─────────                                               ║
║  GET  /health    → Health check                          ║
║  POST /parse     → Parse a resume PDF                    ║
║                                                          ║
║  POSTMAN SETUP:                                          ║
║  ──────────────                                          ║
║  POST http://localhost:${PORT}/parse                       ║
║  Body → form-data:                                       ║
║    • resume (File)           → Your PDF file             ║
║    • fields (Text, optional) → contact.name,skills       ║
║    • schema (Text, optional) → {"contact":true}          ║
║    • includeRawText (Text)   → true                      ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
  `);
});
