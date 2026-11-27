# phillipharrington.com

The personal home page of Phillip Harrington.

![PH](initials.svg)

Static site, no backend, built with [Handlr](https://github.com/phillipsharring/handlr-mono). Vite + [`@phillipsharring/handlr-build`](https://github.com/phillipsharring/handlr-mono/tree/main/packages/build) + Tailwind v4. Hosted on S3 + CloudFront.

## Develop

```bash
npm install
npm run dev      # vite dev server at localhost:5173, renders pages on the fly
npm run build    # vite build + handlr-build-pages → dist/
make deploy      # build, sync to S3, invalidate CloudFront (FORCE_UPLOAD=1 re-uploads everything)
```

## Project shape

```
content/
├── layouts/default.html       shared shell: header, main, footer
├── components/                custom HTML tags expanded at build time (see Custom tags below)
└── pages/                     one HTML file per route

src/
├── app.js                     vite entry: imports CSS + the hamburger menu JS
└── styles/style.css           tailwind v4 + custom theme palette + selection colors

public/                        static assets passed through as-is
├── img/                       photos (name.webp + name-400.webp, some name-full.webp), logos, icons.svg
└── favicons, manifest.json, robots.txt, browserconfig.xml

assets/graphics/               source artwork (PSDs, originals); raw phone photos are gitignored
scripts/                       flatten-dist.mjs, apply-metadata.sh, fix-format.sh (run via npm run format)
deploy/deploy.sh               make deploy: build, diff against S3, upload with Cache-Control, invalidate CloudFront
deploy/provision.sh            idempotent AWS setup: resource tags, CloudFront logging
cloud/cloudfront-redirects.js  viewer-request function source, deployed manually

initials.svg                   the PH mark at the top of this README
site.config.js                 siteName, siteUrl, copyright, injected into layouts via [[propName]]
vite.config.js                 vite + handlr-build plugin + tailwind plugin
```

## Page format

Each page declares its layout and metadata in a self-closing tag at the top, then the page body follows:

```html
<layout name="default" title="About" />
<page-head>
<meta name="description" content="..." />
<meta name="keywords" content="..." />
</page-head>

<article>
    <heading h1 id="about">About</heading>
    <spaced>
        <p>Page content uses custom tags like <lnk to="/blog">links</lnk>,
        <heading h3>headings</heading>, <list><li>lists</li></list>, and so on,
        all expanded to plain HTML at build time.</p>
    </spaced>
</article>
```

Custom tags: `<lnk to="...">`, `<heading h1|h2|h3|h4|h5 id="...">`, `<list>`, `<quote citation="...">`, `<spaced>`, `<callout label title [href button] [logo logo-w logo-h] [heading]>`, `<steal-this>`, `<byline date="..." location="..." updated>`, `<hero-photo img w h alt [caption] [full] [plain]>`, `<fig img|src w h alt caption [full] [center] [credit] [nozoom]>`, `<margin-row label="...">`, `<job>`, `<comment-count [path]>`, `<inject-comments [path]>`, `<latest-comment>`, `<section-heading label [more href]>`, `<abr tooltip="...">`, `<credits>`, `<asterisk />`, `<cde>`, `<two-dollars [title]>` (a $2 tip), `<side-story [title]>` (a true aside beside the text), `<hero img w h alt [caption] [full]>` (page-top text beside its photo), `<credits [pixlr|chatgpt]>`, `<tldr>`, `<project id logo logo-w logo-h name [eager]>`, `<facts>` (label rows, labels semibold). All defined under `content/components/`.

## Abstract URLs

Pages are served as extensionless files (`/about`, not `/about/` or `/about/index.html`). handlr-build natively emits `dist/about/index.html`, so the build runs `scripts/flatten-dist.mjs` after `handlr-build-pages` to rename each `dist/<route>/index.html` → `dist/<route>` (and keep `404.html` with its extension for the CloudFront error document).

Once flattened, `apply-metadata.sh` re-uploads each extensionless file to S3 with `--content-type text/html`, because S3 can't infer Content-Type without an extension and CloudFront would otherwise serve the raw bytes as plain text.

A small CloudFront viewer-request function handles the redirects:
- `/about/` → 301 → `/about`
- `/about/index.html` → 301 → `/about`
- `/index.html` → 301 → `/`

The source is in [`cloud/cloudfront-redirects.js`](cloud/cloudfront-redirects.js). The deployed copy lives in the CloudFront distribution under the function name `PhdcRedirects`. CloudFront does **not** auto-deploy from this repo, so when the file changes the function has to be updated manually (AWS console or CLI) and re-published to the distribution.

## Tailwind v4 caveat

`src/styles/style.css` includes a workaround for a bug in `tailwindcss@4.2.2` where every `space-y-N` selector ships with an unmatched closing paren and gets dropped by every browser. The site's `<spaced>` component depends on `space-y-5`, and without the override every page renders with no inter-element margin. The block is clearly marked; remove it once Tailwind ships a fix and we upgrade.

## License

MIT
