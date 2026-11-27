#!/usr/bin/env node
/**
 * The PHP course shows its example code on the page and keeps the same code,
 * runnable and tested, in the web-nerdism-php repo. A code block that names its
 * file (code-block example="dns/dns.php") must match that file exactly, or this
 * fails, so a lesson can't quietly drift from the code people download.
 *
 * Reads the repo from EXAMPLES_DIR, or a sibling checkout at
 * ../web-nerdism-php. Pages with no example= blocks need neither. (Not file=: handlr-build
 * reserves that attribute on every tag, to load a component from a file.)
 *
 *   node scripts/check-examples.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const examples = path.resolve(process.env.EXAMPLES_DIR || path.join(root, '..', 'web-nerdism-php'));

const decode = (s) =>
    s
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, '&');

const pagesDir = path.join(root, 'content', 'pages');
const pages = [];
(function walk(dir) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, ent.name);
        if (ent.isDirectory()) walk(p);
        else if (ent.name.endsWith('.html')) pages.push(p);
    }
})(pagesDir);

const blocks = [];
for (const page of pages) {
    const src = fs.readFileSync(page, 'utf8');
    for (const m of src.matchAll(/<code-block\s+example="([^"]+)"\s*>([\s\S]*?)<\/code-block\s*>/g)) {
        blocks.push({ page: path.relative(root, page), file: m[1], code: decode(m[2]) });
    }
}

if (blocks.length === 0) {
    console.log('check-examples: no code blocks name an example file');
    process.exit(0);
}
if (!fs.existsSync(examples)) {
    console.error(`check-examples: ${blocks.length} code blocks name a file, but ${examples} isn't there.`);
    console.error('Clone github.com/phillipsharring/web-nerdism-php next to this repo, or set EXAMPLES_DIR.');
    process.exit(1);
}

let bad = 0;
for (const b of blocks) {
    const target = path.join(examples, b.file);
    if (!fs.existsSync(target)) {
        console.error(`  MISSING  ${b.file} (from ${b.page})`);
        bad++;
        continue;
    }
    const file = fs.readFileSync(target, 'utf8').replace(/\n+$/, '');
    if (file !== b.code.replace(/\n+$/, '')) {
        console.error(`  DIFFERS  ${b.file} (from ${b.page})`);
        bad++;
    }
}
if (bad) {
    console.error(`check-examples: ${bad} of ${blocks.length} code blocks don't match web-nerdism-php`);
    process.exit(1);
}
console.log(`check-examples: all ${blocks.length} code blocks match web-nerdism-php`);
