import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const pagePath = path.join(process.cwd(), 'app', 'page.js');
const pageSource = fs.readFileSync(pagePath, 'utf8');

assert.match(
  pageSource,
  /requestFullscreen|webkitRequestFullscreen/,
  'Expected dashboard to support entering browser fullscreen mode.'
);

assert.match(
  pageSource,
  /exitFullscreen|webkitExitFullscreen/,
  'Expected dashboard to support exiting browser fullscreen mode.'
);

assert.match(
  pageSource,
  /全屏|退出全屏/,
  'Expected dashboard header to render a fullscreen toggle button.'
);

console.log('Fullscreen toggle guard check passed.');
