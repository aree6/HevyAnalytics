#!/usr/bin/env node
/**
 * Bundle-budget guard (Phase 0 regression protection).
 *
 * Measures what a cold landing visit actually downloads — the modulepreload
 * set + entry scripts in dist/client/index.html — plus whole-app JS/CSS
 * totals, and fails the build if a budget is breached.
 *
 * Usage: `npm run perf:budget` (run after `npm run build`).
 *
 * Budgets are set from the post-optimization baseline (Sep 2026):
 *   landing JS gzip: 430KB measured → budget 500KB
 *   all JS gzip:      988KB measured → budget 1100KB
 *   CSS gzip:          ~23KB measured → budget 35KB
 * Tighten (never loosen) when the numbers improve.
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CLIENT = path.join(ROOT, 'dist', 'client');

const BUDGETS = {
  landingJsGzip: 500_000,
  allJsGzip: 1_100_000,
  cssGzip: 35_000,
};

const gzipSize = (file) => zlib.gzipSync(fs.readFileSync(file)).length;

const walk = (dir, pattern, out = []) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, pattern, out);
    else if (pattern.test(entry.name)) out.push(p);
  }
  return out;
};

const walkJs = (dir, out = []) => walk(dir, /\.js$/, out);
const walkCss = (dir, out = []) => walk(dir, /\.css$/, out);

const kb = (n) => `${(n / 1024).toFixed(1)}KB`;

const failures = [];
const check = (label, actual, budget) => {
  const ok = actual <= budget;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}: ${kb(actual)} (budget ${kb(budget)})`);
  if (!ok) failures.push(label);
};

const htmlPath = path.join(CLIENT, 'index.html');
const assetsDir = path.join(CLIENT, 'assets');
if (!fs.existsSync(htmlPath) || !fs.existsSync(assetsDir)) {
  console.error('Bundle budget: dist/client missing. Run npm run build first.');
  process.exit(2);
}

const html = fs.readFileSync(htmlPath, 'utf8');
const refs = new Set(
  [...html.matchAll(/(?:href|src)="(\/assets\/[^"]+)"/g)].map((m) => m[1]),
);
let landingGzip = 0;
let landingCount = 0;
for (const ref of refs) {
  const file = path.join(CLIENT, ref.replace(/^\//, ''));
  if (fs.existsSync(file) && file.endsWith('.js')) {
    landingGzip += gzipSize(file);
    landingCount += 1;
  }
}
console.log(`landing init: ${landingCount} JS files`);

const allJs = walkJs(path.join(CLIENT, 'assets'));
const allJsGzip = allJs.reduce((sum, f) => sum + gzipSize(f), 0);

const cssFiles = walkCss(path.join(CLIENT, 'assets'));
const cssGzipTotal = cssFiles.reduce((sum, f) => sum + gzipSize(f), 0);

check('landing JS (gzip)', landingGzip, BUDGETS.landingJsGzip);
check(`all JS, ${allJs.length} files (gzip)`, allJsGzip, BUDGETS.allJsGzip);
check(`CSS, ${cssFiles.length} files (gzip)`, cssGzipTotal, BUDGETS.cssGzip);

if (failures.length > 0) {
  console.error(`\nBundle budget breached: ${failures.join(', ')}`);
  process.exit(1);
}
console.log('\nAll bundle budgets pass.');
