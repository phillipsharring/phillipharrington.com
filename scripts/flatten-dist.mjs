#!/usr/bin/env node
/**
 * Flatten graspr-build's dist/ output for abstract URLs.
 *
 * graspr-build emits one directory per route:
 *     dist/about/index.html
 *     dist/blog/index.html
 *     dist/say-it-once/index.html
 *
 * For phillipharrington.com we want extension-less files at the root so the
 * existing CloudFront function + S3 bucket can serve `/about` directly with
 * no trailing slash and no `.html`. This script converts:
 *
 *     dist/about/index.html       ->  dist/about        (extensionless file)
 *     dist/blog/index.html        ->  dist/blog
 *     dist/404/index.html         ->  dist/404.html     (kept with extension; CF error doc)
 *     dist/index.html             ->  dist/index.html   (untouched; CF function rewrites /index.html -> /)
 *
 * Limitation: nested routes (e.g. dist/blog/post-1/index.html) cannot be
 * flattened to extensionless files because a filesystem can't have both
 * `dist/blog` (file) and `dist/blog/post-1` (file inside dir). For this site
 * every page lives at the top level, so this script only flattens top-level
 * directories. Nested directories are left alone and the script warns.
 *
 * Re-running this script after a successful flatten is a no-op: directories
 * that were already flattened are now files and get skipped.
 */
import fs from 'node:fs/promises';
import path from 'node:path';

const distDir = process.argv[2] || 'dist';

// Page route names that should keep their `.html` extension instead of going
// extensionless (e.g. CloudFront error documents).
const keepWithExtension = new Set(['404']);

async function flattenTopLevel() {
    let entries;
    try {
        entries = await fs.readdir(distDir, { withFileTypes: true });
    } catch (err) {
        console.error(`flatten-dist: cannot read ${distDir}: ${err.message}`);
        process.exit(1);
    }

    let flattened = 0;
    let skipped = 0;

    for (const ent of entries) {
        if (!ent.isDirectory()) continue;

        const dir = path.join(distDir, ent.name);
        const indexPath = path.join(dir, 'index.html');

        try {
            await fs.access(indexPath);
        } catch {
            // No index.html in this dir — probably an asset dir like dist/assets
            // or dist/img. Leave it alone.
            continue;
        }

        const siblings = await fs.readdir(dir);
        if (siblings.length !== 1) {
            console.warn(
                `flatten-dist: skipping ${dir} — contains ${siblings.length} entries (not just index.html). ` +
                `Nested URLs aren't compatible with extension-less flattening.`
            );
            skipped++;
            continue;
        }

        const target = keepWithExtension.has(ent.name)
            ? path.join(distDir, `${ent.name}.html`)
            : path.join(distDir, ent.name);

        // Two-step rename: move index.html to a temp name first so we can rmdir
        // the now-empty source directory before claiming its name as a file.
        const tmp = path.join(distDir, `.${ent.name}.flatten.tmp`);
        await fs.rename(indexPath, tmp);
        await fs.rmdir(dir);
        await fs.rename(tmp, target);

        console.log(
            `flatten-dist: ${path.relative(distDir, dir)}/index.html -> ${path.relative(distDir, target)}`
        );
        flattened++;
    }

    console.log(`flatten-dist: ${flattened} flattened, ${skipped} skipped`);
}

await flattenTopLevel();
