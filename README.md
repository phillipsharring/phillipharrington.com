# phillipharrington.com

The personal home page of Phillip Harrington.

![Build Badge](https://codebuild.us-east-1.amazonaws.com/badges?uuid=eyJlbmNyeXB0ZWREYXRhIjoiVXBEREFFbytrYUFTWG9UTVpoWXFKQzFxd1RaemppdFAvWGxWWi80Ty9MV2R6dHhxWUJGK1RLUERNVmhPbHB3MUNVMHlGY1ZWaU5teXMyaFVodEFOK3hZPSIsIml2UGFyYW1ldGVyU3BlYyI6IldsZWFtaTUyTUhXa0hBcWMiLCJtYXRlcmlhbFNldFNlcmlhbCI6MX0%3D&branch=main)

Static site, no backend, built with [Graspr](https://github.com/phillipsharring/graspr-framework). Vite + [`@phillipsharring/graspr-build`](https://github.com/phillipsharring/graspr-build) + Tailwind v4. Hosted on S3 + CloudFront.

## Develop

```bash
npm install
npm run dev      # vite dev server at localhost:5173, renders pages on the fly
npm run build    # vite build + graspr-build-pages → dist/
```

## Project shape

```
content/
├── layouts/default.html       shared shell — header, main, footer
├── components/                custom HTML tags expanded at build time
│   ├── lnk.html  heading.html  list.html  quote.html  spaced.html
│   ├── byline.html  fig.html  abr.html  cde.html  asterisk.html
│   ├── band.html  drumset.html  credits.html
│   ├── nav-link.html  hamburger-menu.html  initials.html
│   └── layout-header.html  layout-footer.html
└── pages/                     one HTML file per route
    ├── index.html   404.html   about.html   blog.html
    ├── colophon.html   contact.html   work.html   uses.html
    ├── now.html   music.html   mashanda-smile-big.html
    ├── did-you-run-this-code.html   say-it-once.html
    ├── you-are-not-your-brain.html  my-trick-for-managing-adhd.html

src/
├── app.js                     vite entry — imports CSS + the hamburger menu JS
└── styles/style.css           tailwind v4 + custom theme palette + selection colors

public/                        static assets passed through as-is
├── img/                       104 images, SVGs, PNGs, JPGs
├── favicon-*  apple-icon-*  android-icon-*  ms-icon-*
└── manifest.json  robots.txt  browserconfig.xml

scripts/
├── flatten-dist.mjs           rename dist/<route>/index.html → dist/<route> for abstract URLs
└── apply-metadata.sh          re-upload extensionless files with Content-Type: text/html

cloud/
└── cloudfront-redirects.js    viewer-request function source — deployed manually

site.config.js                 siteName, siteUrl, copyright — injected into layouts via [[propName]]
vite.config.js                 vite + graspr-build plugin + tailwind plugin
buildspec.yml                  AWS CodeBuild → S3 sync → CloudFront invalidate
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
        <heading h3>headings</heading>, <list><li>lists</li></list>, and so on —
        all expanded to plain HTML at build time.</p>
    </spaced>
</article>
```

Custom tags: `<lnk to="...">`, `<heading h1|h2|h3|h4|h5 id="...">`, `<list>`, `<quote citation="...">`, `<spaced>`, `<byline date="..." location="..." updated>`, `<fig src="..." alt="..." caption="...">`, `<abr tooltip="...">`, `<band>`, `<drumset>`, `<credits>`, `<asterisk />`, `<cde>`. All defined under `content/components/`.

## Abstract URLs

Pages are served as extensionless files (`/about`, not `/about/` or `/about/index.html`). graspr-build natively emits `dist/about/index.html`, so the build runs `scripts/flatten-dist.mjs` after `graspr-build-pages` to rename each `dist/<route>/index.html` → `dist/<route>` (and keep `404.html` with its extension for the CloudFront error document).

Once flattened, `apply-metadata.sh` re-uploads each extensionless file to S3 with `--content-type text/html`, because S3 can't infer Content-Type without an extension and CloudFront would otherwise serve the raw bytes as plain text.

A small CloudFront viewer-request function handles the redirects:
- `/about/` → 301 → `/about`
- `/about/index.html` → 301 → `/about`
- `/index.html` → 301 → `/`

The source is in [`cloud/cloudfront-redirects.js`](cloud/cloudfront-redirects.js). The deployed copy lives in the CloudFront distribution under the function name `PhdcRedirects` — CloudFront does **not** auto-deploy from this repo, so when the file changes the function has to be updated manually (AWS console or CLI) and re-published to the distribution.

## Tailwind v4 caveat

`src/styles/style.css` includes a workaround for a bug in `tailwindcss@4.2.2` where every `space-y-N` selector ships with an unmatched closing paren and gets dropped by every browser. The site's `<spaced>` component depends on `space-y-5`, and without the override every page renders with no inter-element margin. The block is clearly marked — remove it once Tailwind ships a fix and we upgrade.

## License

MIT
