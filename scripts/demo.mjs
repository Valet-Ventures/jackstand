#!/usr/bin/env node
/**
 * Demo site generator for Good Standings.
 *
 *   node scripts/demo.mjs init <template> <slug>   create demos/<slug>.json with blank fields
 *   node scripts/demo.mjs build <slug>             render demos/<slug>.json -> public/<slug>/
 *   node scripts/demo.mjs build                    rebuild every demo
 *   node scripts/demo.mjs list                     show templates and demos
 *
 * The JSON file is the single source of truth for a business. Improve a template,
 * run `build` with no slug, and every demo picks up the change.
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TEMPLATES = join(ROOT, 'templates');
const DEMOS = join(ROOT, 'demos');
const PUBLIC = join(ROOT, 'public');

const die = (m) => { console.error(`\n  ✗ ${m}\n`); process.exit(1); };
const tmplPath = (t) => join(TEMPLATES, t, 'index.html');
const tokensIn = (html) => [...new Set([...html.matchAll(/\{\{([A-Z0-9_]+)\}\}/g)].map((m) => m[1]))];
const listDirs = (p) => existsSync(p) ? readdirSync(p, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name) : [];

function init(template, slug) {
  if (!template || !slug) die('usage: demo.mjs init <template> <slug>');
  if (!existsSync(tmplPath(template))) die(`no template "${template}". Have: ${listDirs(TEMPLATES).join(', ') || 'none'}`);
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) die(`slug must be lowercase-with-hyphens, got "${slug}"`);

  const out = join(DEMOS, `${slug}.json`);
  if (existsSync(out)) die(`demos/${slug}.json already exists`);

  const data = { _template: template, SLUG: slug };
  for (const t of tokensIn(readFileSync(tmplPath(template), 'utf8'))) {
    if (t !== 'SLUG') data[t] = '';
  }
  mkdirSync(DEMOS, { recursive: true });
  writeFileSync(out, JSON.stringify(data, null, 2) + '\n');
  console.log(`\n  ✓ demos/${slug}.json  (${Object.keys(data).length - 2} fields to fill)`);
  console.log(`    then: node scripts/demo.mjs build ${slug}\n`);
}

function build(slug) {
  const src = join(DEMOS, `${slug}.json`);
  if (!existsSync(src)) die(`no demos/${slug}.json`);

  const data = JSON.parse(readFileSync(src, 'utf8'));
  const template = data._template;
  if (!template || !existsSync(tmplPath(template))) die(`${slug}.json has bad _template "${template}"`);

  let html = readFileSync(tmplPath(template), 'utf8');
  const missing = [];
  for (const t of tokensIn(html)) {
    const v = t === 'SLUG' ? slug : data[t];
    if (v === undefined || v === '') missing.push(t);
    html = html.replaceAll(`{{${t}}}`, v ?? '');
  }

  const dir = join(PUBLIC, slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), html);

  const warn = missing.length ? `  ⚠ blank: ${missing.join(', ')}` : '';
  console.log(`  ✓ /${slug}${warn ? '\n' + warn : ''}`);
  return missing.length;
}

function buildAll() {
  const slugs = existsSync(DEMOS)
    ? readdirSync(DEMOS).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5))
    : [];
  if (!slugs.length) die('no demos yet. Start with: demo.mjs init auto-shop <slug>');
  console.log('');
  let blanks = 0;
  for (const s of slugs) blanks += build(s);
  console.log(`\n  ${slugs.length} demo(s) built${blanks ? `, ${blanks} blank field(s)` : ''}.\n`);
}

function list() {
  console.log(`\n  templates: ${listDirs(TEMPLATES).join(', ') || 'none'}`);
  const slugs = existsSync(DEMOS) ? readdirSync(DEMOS).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5)) : [];
  console.log(`  demos:     ${slugs.join(', ') || 'none'}`);
  console.log(`  live at:   ${slugs.map((s) => 'goodstandings.com/' + s).join('\n             ') || '-'}\n`);
}

const [cmd, a, b] = process.argv.slice(2);
if (cmd === 'init') init(a, b);
else if (cmd === 'build') a ? (console.log(''), build(a), console.log('')) : buildAll();
else if (cmd === 'list') list();
else die('usage: demo.mjs <init|build|list>');
