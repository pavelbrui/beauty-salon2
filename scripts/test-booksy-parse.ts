import fs from 'fs';
import path from 'path';

// Load the webhook file content and evaluate parseBookingEmail via require from ts-node or compiled JS.
// For simplicity, this script extracts the parse function by reading the file and using eval.

const webhookPath = path.join(__dirname, '..', 'netlify', 'functions', 'booksy-webhook.ts');
const code = fs.readFileSync(webhookPath, 'utf-8');

// Extract parseBookingEmail function body using simple regex (quick-and-dirty for local test)
const match = code.match(/function parseBookingEmail\([\s\S]*?\n\}\n\n\/\/ --- Stylist mapping lookup ---/);
if (!match) {
  console.error('Could not extract parseBookingEmail from webhook file');
  process.exit(1);
}

const funcCode = match[0].replace(/\/\/ --- Stylist mapping lookup ---/, '');

// Build a sandboxed eval context with minimal helpers used by parseBookingEmail
const sandbox: any = {};

// Provide simplified helpers copied from file (normalizeSearchText, stripHtml, parsePolishDateTime, POLISH_MONTHS_NORMALIZED, POLISH_MONTHS etc.)
// To avoid duplicating everything, we'll attempt to evaluate the entire file up to parseBookingEmail

const uptoParse = code.split('function parseBookingEmail')[0] + funcCode;

try {
  // eslint-disable-next-line no-eval
  const module = { exports: {} } as any;
  // Evaluate in current context - risk acceptable for local dev
  // @ts-ignore
  eval(uptoParse);
  // @ts-ignore
  const parsed = (global as any).parseBookingEmail || (module.exports && module.exports.parseBookingEmail);
  if (!parsed) {
    console.error('parseBookingEmail not found in evaluated code');
    process.exit(1);
  }

  const sampleHtml = fs.readFileSync(path.join(__dirname, 'sample-email.html'), 'utf-8');
  const result = parsed('"Mariola Czerniawska" <no-reply@booksy.com>Mariola Czerniawska: nowa rezerwacja środa, 21 października 2026 16:30', sampleHtml);
  console.log('Parse result:', result);
} catch (err) {
  console.error('Eval error:', err);
  process.exit(1);
}
