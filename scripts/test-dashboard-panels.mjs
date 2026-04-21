import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const cssPath = path.join(process.cwd(), 'app', 'globals.css');
const pagePath = path.join(process.cwd(), 'app', 'page.js');
const cssSource = fs.readFileSync(cssPath, 'utf8');
const pageSource = fs.readFileSync(pagePath, 'utf8');

assert.match(
  cssSource,
  /\.realtime-panel\s+\.panel-body\s*\{[\s\S]*overflow-y:\s*auto;[\s\S]*overflow-x:\s*hidden;/,
  'Expected the realtime order panel body to support vertical scrolling.'
);

assert.match(
  cssSource,
  /\.stores-panel\s+\.data-table\s+thead\s+th\s*,[\s\S]*\.products-panel\s+\.data-table\s+thead\s+th\s*,[\s\S]*\.realtime-panel\s+\.data-table\s+thead\s+th\s*\{/,
  'Expected all table panels, including realtime orders, to keep sticky headers while scrolling.'
);

assert.match(
  cssSource,
  /\.products-panel\s*\{[\s\S]*bottom:\s*36px;/,
  'Expected the product Top 10 panel to align to the shared bottom baseline.'
);

assert.match(
  cssSource,
  /\.stores-panel\s*\{[\s\S]*height:\s*374px;/,
  'Expected the store Top 10 panel to become taller after the left-column rebalance.'
);

assert.match(
  cssSource,
  /\.products-panel\s*\{[\s\S]*top:\s*514px;[\s\S]*bottom:\s*36px;/,
  'Expected the product Top 10 panel to start lower so it fits the content more tightly.'
);

assert.match(
  cssSource,
  /\.chart-three\s*\{[\s\S]*bottom:\s*36px;/,
  'Expected the platform trend panel to align to the shared bottom baseline.'
);

assert.match(
  pageSource,
  /<Panel title="实时订单" className="realtime-panel">[\s\S]*\{view\.latestOrders\.map\(/,
  'Expected the realtime order table to render the full latest order list for manual scrolling.'
);

console.log('Dashboard panel guard check passed.');
