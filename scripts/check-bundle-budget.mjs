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

const walkJs = (dir, out = []) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walkJs(p, out);
    else if (/\.js$/.test(entry.name)) out.push(p);
  }
  return out;
};

const kb = (n) => `${(n / 1024).toFixed(1)}KB`;

const failures = [];
const check = (label, actual, budget) => {
  const ok = actual <= budget;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}: ${kb(actual)} (budget ${kb(budget)})`);
  if (!ok) failures.push(label);
};

const html = fs.readFileSync(path.join(CLIENT, 'index.html'), 'utf8');
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

const cssFiles = walkJs(path.join(CLIENT, 'assets')).filter((f) => f.endsWith('.css'));
const cssGzip = cssFiles.reduce((sum, f) => sum + gzipSize(f), 0);
if (cssFiles.length === 0) {
  // CSS may live directly under assets/ with hashed names; scan broadly.
  const scan = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) scan(p);
      else if (/\.css$/.test(entry.name)) cssFiles.push(p);
    }
  };
  scan(path.join(CLIENT, 'assets'));
}
const cssGzipTotal = cssFiles.reduce((sum, f) => sum + gzipSize(f), 0);

check('landing JS (gzip)', landingGzip, BUDGETS.landingJsGzip);
check(`all JS, ${allJs.length} files (gzip)`, allJsGzip, BUDGETS.allJsGzip);
check(`CSS, ${cssFiles.length} files (gzip)`, cssGzipTotal, BUDGETS.cssGzip);

if (failures.length > 0) {
  console.error(`\nBundle budget breached: ${failures.join(', ')}`);
  process.exit(1);
}
console.log('\nAll bundle budgets pass.');
