import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const cssPath = path.join(process.cwd(), 'app', 'globals.css');
const cssSource = fs.readFileSync(cssPath, 'utf8');

assert.match(
  cssSource,
  /\.stores-panel\s+\.panel-body\s*,\s*\.products-panel\s+\.panel-body\s*\{[\s\S]*overflow-y:\s*auto;/,
  'Expected Top 10 panel bodies to support vertical scrolling.'
);

console.log('Top 10 panel scroll guard check passed.');
