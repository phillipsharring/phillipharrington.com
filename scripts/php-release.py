#!/usr/bin/env python3
"""Build a release of the PHP course: only the reviewed pages go live.

Run from the php-course checkout, pointing at a checkout of the release branch
(a branch cut from main):

    python3 scripts/php-release.py ../phillipharrington.com-release

It brings over the shared pieces from this checkout (components, styles,
build settings, deploy script, the home page), copies the pages listed in
scripts/php-published.txt plus /php and /php/vocabulary, and then makes every
link into the course point only at pages that are live: links to unreleased
lessons become plain text, /php lists the rest as coming, and the vocabulary
keeps only the words the live pages use. Nothing is committed or deployed.
"""
import pathlib, re, shutil, sys

SRC = pathlib.Path(__file__).resolve().parent.parent
if len(sys.argv) != 2:
    sys.exit(__doc__)
DST = pathlib.Path(sys.argv[1]).resolve()
if not (DST / '.git').exists():
    sys.exit(f'{DST} is not a git checkout')

SHARED = [
    'content/components', 'src/styles/style.css', 'src/app.js', 'site.config.js',
    'package.json', 'package-lock.json', 'scripts/flatten-dist.mjs', 'deploy/deploy.sh',
    'docker-compose.yml', 'README.md', 'content/pages/index.html',
]
published = [l.strip() for l in (SRC / 'scripts/php-published.txt').read_text().splitlines()
             if l.strip() and not l.startswith('#')]
live = set(published) | {'', 'vocabulary'}

def is_live(url):
    path = url.split('#')[0].rstrip('/')
    if not path.startswith('/php'):
        return True
    return path.removeprefix('/php').lstrip('/') in live

# 1. Shared pieces
for rel in SHARED:
    s, d = SRC / rel, DST / rel
    if s.is_dir():
        shutil.copytree(s, d, dirs_exist_ok=True)
    else:
        d.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(s, d)

# 2. Pages: start the course folder fresh, so nothing unreleased lingers
course = DST / 'content/pages/php'
if course.exists():
    shutil.rmtree(course)
for slug in published + ['index', 'vocabulary']:
    s = SRC / 'content/pages/php' / f'{slug}.html'
    d = course / f'{slug}.html'
    d.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(s, d)

LINK = re.compile(r'<(xref|lnk)(\s+)to="([^"]+)"([^>]*)>(.*?)</\1\s*>', re.S)

def unlink(html, coming=''):
    def fix(m):
        tag, _, url, _, text = m.groups()
        if is_live(url):
            return m.group(0)
        return text + coming
    return LINK.sub(fix, html)

def fix_nav(html):
    # The lesson nav's Next link to an unreleased lesson: say it's coming.
    def fix(m):
        url, title = m.group(1), m.group(2)
        if is_live(url):
            return m.group(0)
        return f'<span class="text-th-muted">Next: {title.strip()} (coming soon)</span>'
    return re.sub(r'<lnk\s+to="([^"]+)"\s*>\s*Next:\s*(.*?)\s*&rarr;\s*</lnk\s*>', fix, html, flags=re.S)

# 3. Lesson pages: unreleased links become text
for p in course.rglob('*.html'):
    if p.name in ('index.html', 'vocabulary.html'):
        continue
    html = fix_nav(p.read_text())
    p.write_text(unlink(html))

# 4. /php: unreleased lessons listed, not linked
idx = course / 'index.html'
idx.write_text(unlink(idx.read_text()))

# 5. Vocabulary: only the words the live pages use; unreleased lessons are "coming"
used = set()
for p in course.rglob('*.html'):
    used |= set(re.findall(r'<term\s+def="([^"]+)"', p.read_text()))
voc = course / 'vocabulary.html'
v = voc.read_text()
entry = re.compile(r'\s*<heading h3 id="([^"]+)">.*?</heading>\s*<p>.*?</p>', re.S)
v = entry.sub(lambda m: m.group(0) if m.group(1) in used else '', v)
v = re.sub(r'\s*<heading h2 id="[a-z]">[A-Z]</heading>(?=\s*(<heading h2|<hr))', '', v)
v = unlink(v, ' (coming soon)')
voc.write_text(v)

# 6. Report anything that still points somewhere unreleased
bad = []
for p in list(course.rglob('*.html')) + [DST / 'content/pages/index.html']:
    for m in LINK.finditer(p.read_text()):
        if not is_live(m.group(3)):
            bad.append(f'{p.relative_to(DST)}: {m.group(3)}')
print(f'{len(published)} lessons, {len(used)} vocabulary words')
print('unreleased links left:', len(bad))
for b in bad:
    print('  ', b)
