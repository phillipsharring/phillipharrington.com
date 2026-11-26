// Comments on a static site: the request logic, free of AWS so it can be
// tested with fakes. index.mjs wires in the real S3, SES and CloudFront
// clients. The plan lives in docs/comments-plan.md.
//
//     POST /api/comments    form post from a blog post   -> email Phillip, redirect back
//     GET  /api/moderate    approve link from that email -> confirmation page
//     POST /api/moderate    the confirmation's button    -> append to <slug>.json
//
// Approved comments are read straight from the comments bucket by CloudFront
// (GET /api/comments/<slug>.json); no Lambda time is spent on reads.
//
// Commenter text is only ever data: stored as JSON, rendered by the site with
// textContent, and HTML-escaped on the one page this function draws.

import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';

export const LIMITS = { name: 80, comment: 2000, links: 2 };
const TOKEN_DAYS = 14;

// deps: { config, getObject, putObject, sendEmail, invalidate, fetchPage, now }
//   config: { siteUrl, hmacKey, originSecret, from, to }
//   getObject(key) -> string | null (null when the key doesn't exist)
export function createApp(deps) {
    const { config } = deps;
    const now = deps.now ?? (() => new Date());

    return async function handle(req) {
        // Only CloudFront knows this header; anything calling the function URL
        // directly gets turned away.
        if (!safeEqual(req.headers['x-origin-verify'] ?? '', config.originSecret)) {
            return text(403, 'Forbidden');
        }
        if (req.path === '/api/comments' && req.method === 'POST') return postComment(req);
        if (req.path === '/api/moderate' && req.method === 'GET') return confirmPage(req);
        if (req.path === '/api/moderate' && req.method === 'POST') return approve(req);
        return text(404, 'Not found');
    };

    async function postComment(req) {
        const form = new URLSearchParams(req.body);
        // The page's script fills in path; without JavaScript, the browser's
        // Referer from our own site says which post the form was on.
        const path = form.get('path') || refererPath(req.headers.referer);
        if (!/^\/[a-z0-9-]+$/.test(path)) return text(400, 'Bad request');
        const back = (code) => redirect(`${path}?comment=${code}#comments`);

        // Bots fill in every field; people never see this one. Tell them it
        // worked so they learn nothing.
        if ((form.get('website') ?? '') !== '') return back('pending');

        const name = clean(form.get('name') ?? '', { newlines: false });
        const comment = clean(form.get('comment') ?? '', { newlines: true });
        if (!name || !comment) return back('missing');
        if (name.length > LIMITS.name || comment.length > LIMITS.comment) return back('too-long');
        if ((comment.match(/https?:\/\//gi) ?? []).length > LIMITS.links) return back('invalid');

        // Only pages that carry the comments component take comments.
        const page = await deps.fetchPage(path);
        if (page === null || !/id=["']?comments\b/.test(page)) return text(400, 'Bad request');

        const entry = {
            id: randomUUID(),
            slug: path.slice(1),
            name,
            comment,
            date: now().toISOString(),
            exp: now().getTime() + TOKEN_DAYS * 86400000,
        };
        const link = `${config.siteUrl}/api/moderate?t=${sign(entry)}`;
        try {
            await deps.sendEmail({
                from: config.from,
                to: config.to,
                subject: `Comment on ${path} from ${name}`,
                body: `${name} on ${config.siteUrl}${path}\n\n${comment}\n\nApprove: ${link}\n\nTo reject, ignore this email.`,
            });
        } catch {
            return back('error');
        }
        return back('pending');
    }

    async function confirmPage(req) {
        const token = new URLSearchParams(req.query).get('t') ?? '';
        const entry = verify(token);
        if (!entry) return page(400, 'Link expired or invalid', '<p>This approve link is expired or invalid.</p>');
        return page(
            200,
            'Approve comment?',
            `<p><strong>${esc(entry.name)}</strong> on <a href="/${esc(entry.slug)}">/${esc(entry.slug)}</a></p>
<blockquote style="white-space:pre-wrap">${esc(entry.comment)}</blockquote>
<form method="post" action="/api/moderate">
<input type="hidden" name="t" value="${esc(token)}">
<button type="submit">Approve</button>
</form>`,
        );
    }

    async function approve(req) {
        const entry = verify(new URLSearchParams(req.body).get('t') ?? '');
        if (!entry) return page(400, 'Link expired or invalid', '<p>This approve link is expired or invalid.</p>');

        const key = `api/comments/${entry.slug}.json`;
        const list = JSON.parse((await deps.getObject(key)) ?? '[]');
        const back = `<p><a href="/${esc(entry.slug)}#comments">Back to the post</a></p>`;
        if (list.some((c) => c.id === entry.id)) return page(200, 'Already approved', back);

        list.push({ id: entry.id, name: entry.name, comment: entry.comment, date: entry.date });
        await deps.putObject(key, JSON.stringify(list));
        await deps.invalidate(`/${key}`);
        return page(200, 'Approved', back);
    }

    function refererPath(referer) {
        try {
            const url = new URL(referer);
            return url.origin === new URL(config.siteUrl).origin ? url.pathname.replace(/\/+$/, '') : '';
        } catch {
            return '';
        }
    }

    // The token carries the whole comment, signed, so nothing waits in storage
    // for approval: rejecting a comment is ignoring the email.
    function sign(entry) {
        const data = Buffer.from(JSON.stringify(entry)).toString('base64url');
        return `${data}.${hmac(data)}`;
    }

    function verify(token) {
        const [data, sig] = token.split('.');
        if (!data || !sig || !safeEqual(sig, hmac(data))) return null;
        try {
            const entry = JSON.parse(Buffer.from(data, 'base64url').toString());
            return entry.exp > now().getTime() ? entry : null;
        } catch {
            return null;
        }
    }

    function hmac(data) {
        return createHmac('sha256', config.hmacKey).update(data).digest('base64url');
    }
}

// Trim, drop control characters (keeping line breaks in the comment), and
// collapse runs of blank lines.
export function clean(value, { newlines }) {
    let s = value.replace(/\r\n?/g, '\n');
    s = newlines ? s.replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, '') : s.replace(/[\u0000-\u001f\u007f]/g, ' ');
    return s.replace(/\n{3,}/g, '\n\n').trim();
}

export function esc(s) {
    return String(s).replace(
        /[&<>"']/g,
        (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    );
}

function safeEqual(a, b) {
    const x = Buffer.from(String(a));
    const y = Buffer.from(String(b));
    return x.length === y.length && timingSafeEqual(x, y);
}

function redirect(location) {
    return { status: 303, headers: { location, 'cache-control': 'no-store' }, body: '' };
}

function text(status, body) {
    return { status, headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' }, body };
}

function page(status, title, html) {
    return {
        status,
        headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
        body: `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex"><title>${esc(title)}</title>
<body style="font-family:system-ui,sans-serif;max-width:40rem;margin:3rem auto;padding:0 1rem;line-height:1.6">
<h1>${esc(title)}</h1>${html}</body>`,
    };
}
