import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const layoutPath = path.join(process.cwd(), 'app', 'layout.js');
const layoutSource = fs.readFileSync(layoutPath, 'utf8');

assert.match(
  layoutSource,
  /<html[^>]*\bsuppressHydrationWarning\b/,
  'Expected app/layout.js to set suppressHydrationWarning on the <html> element.'
);

console.log('Root layout hydration guard check passed.');
