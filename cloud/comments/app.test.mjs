// Run with: node --test cloud/comments/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createApp, clean, esc } from './app.mjs';

const ORIGIN = 'origin-secret';
const POST_HTML = '<html><section id=comments></section></html>';

function setup({ page = POST_HTML, emailFails = false, start = new Date('2026-11-26T12:00:00Z') } = {}) {
    const store = new Map();
    const sent = [];
    const invalidated = [];
    let clock = start;
    const handle = createApp({
        config: {
            siteUrl: 'https://example.com',
            hmacKey: 'hmac-key',
            originSecret: ORIGIN,
            from: 'from@example.com',
            to: 'to@example.com',
        },
        getObject: async (k) => store.get(k) ?? null,
        putObject: async (k, v) => store.set(k, v),
        sendEmail: async (m) => {
            if (emailFails) throw new Error('ses down');
            sent.push(m);
        },
        invalidate: async (p) => invalidated.push(p),
        fetchPage: async () => page,
        now: () => clock,
    });
    const req = (method, path, { body = '', query = '', headers = { 'x-origin-verify': ORIGIN } } = {}) =>
        handle({ method, path, body, query, headers });
    const comment = (fields) => req('POST', '/api/comments', { body: new URLSearchParams(fields).toString() });
    const tokenFromEmail = () => sent.at(-1).body.match(/t=([\w.-]+)/)[1];
    return { req, comment, store, sent, invalidated, tokenFromEmail, setClock: (d) => (clock = d) };
}

const good = { path: '/a-post', name: 'Alice', comment: 'Nice post!', website: '' };

test('rejects requests that did not come through CloudFront', async () => {
    const { req } = setup();
    const res = await req('POST', '/api/comments', { headers: {} });
    assert.equal(res.status, 403);
});

test('a valid comment emails an approve link and redirects as pending', async () => {
    const { comment, sent } = setup();
    const res = await comment(good);
    assert.equal(res.status, 303);
    assert.equal(res.headers.location, '/a-post?comment=pending#comments');
    assert.equal(sent.length, 1);
    assert.match(sent[0].body, /Nice post!/);
    assert.match(sent[0].body, /https:\/\/example\.com\/api\/moderate\?t=/);
});

test('the honeypot looks like success but sends nothing', async () => {
    const { comment, sent } = setup();
    const res = await comment({ ...good, website: 'http://spam.example' });
    assert.equal(res.headers.location, '/a-post?comment=pending#comments');
    assert.equal(sent.length, 0);
});

test('missing, too long and link-stuffed comments get their codes', async () => {
    const { comment, sent } = setup();
    assert.equal((await comment({ ...good, name: '  ' })).headers.location, '/a-post?comment=missing#comments');
    assert.equal((await comment({ ...good, comment: '' })).headers.location, '/a-post?comment=missing#comments');
    assert.equal(
        (await comment({ ...good, name: 'x'.repeat(81) })).headers.location,
        '/a-post?comment=too-long#comments',
    );
    assert.equal(
        (await comment({ ...good, comment: 'x'.repeat(2001) })).headers.location,
        '/a-post?comment=too-long#comments',
    );
    assert.equal(
        (await comment({ ...good, comment: 'http://a http://b http://c' })).headers.location,
        '/a-post?comment=invalid#comments',
    );
    assert.equal(sent.length, 0);
});

test('a broken email send redirects with error', async () => {
    const { comment } = setup({ emailFails: true });
    assert.equal((await comment(good)).headers.location, '/a-post?comment=error#comments');
});

test('without a path field, the Referer from our own site names the post', async () => {
    const { req, sent } = setup();
    const body = new URLSearchParams({ name: 'Al', comment: 'Hi', website: '' }).toString();
    const fromUs = await req('POST', '/api/comments', {
        body,
        headers: { 'x-origin-verify': ORIGIN, referer: 'https://example.com/a-post/' },
    });
    assert.equal(fromUs.headers.location, '/a-post?comment=pending#comments');
    assert.equal(sent.length, 1);
    const fromElsewhere = await req('POST', '/api/comments', {
        body,
        headers: { 'x-origin-verify': ORIGIN, referer: 'https://evil.example/a-post' },
    });
    assert.equal(fromElsewhere.status, 400);
    const noReferer = await req('POST', '/api/comments', { body });
    assert.equal(noReferer.status, 400);
});

test('bad paths and pages without the component are refused', async () => {
    assert.equal((await setup().comment({ ...good, path: '/../etc' })).status, 400);
    assert.equal((await setup().comment({ ...good, path: 'https://evil.example' })).status, 400);
    assert.equal((await setup({ page: '<html>no comments here</html>' }).comment(good)).status, 400);
    assert.equal((await setup({ page: null }).comment(good)).status, 400);
});

test('GET on the approve link shows a confirmation, escaped, and approves nothing', async () => {
    const { comment, req, store, tokenFromEmail } = setup();
    await comment({ ...good, name: '<b>Bob</b>', comment: '<script>alert(1)</script>' });
    const res = await req('GET', '/api/moderate', { query: `t=${tokenFromEmail()}` });
    assert.equal(res.status, 200);
    assert.match(res.body, /&lt;script&gt;/);
    assert.doesNotMatch(res.body, /<script>alert/);
    assert.match(res.body, /method="post"/);
    assert.equal(store.size, 0);
});

test('approving appends to the post file once, and invalidates it', async () => {
    const { comment, req, store, invalidated, tokenFromEmail } = setup();
    await comment(good);
    const t = tokenFromEmail();
    const first = await req('POST', '/api/moderate', { body: `t=${t}` });
    assert.equal(first.status, 200);
    assert.match(first.body, /Approved/);
    const again = await req('POST', '/api/moderate', { body: `t=${t}` });
    assert.match(again.body, /Already approved/);

    const list = JSON.parse(store.get('api/comments/a-post.json'));
    assert.equal(list.length, 1);
    assert.deepEqual(Object.keys(list[0]).sort(), ['comment', 'date', 'id', 'name']);
    assert.equal(list[0].comment, 'Nice post!');
    assert.deepEqual(invalidated, ['/api/comments/a-post.json']);
});

test('tampered and expired tokens are refused', async () => {
    const { comment, req, tokenFromEmail, setClock } = setup();
    await comment(good);
    const t = tokenFromEmail();
    const [data, sig] = t.split('.');
    const forged = Buffer.from(
        JSON.stringify({ ...JSON.parse(Buffer.from(data, 'base64url')), comment: 'edited' }),
    ).toString('base64url');
    assert.equal((await req('POST', '/api/moderate', { body: `t=${forged}.${sig}` })).status, 400);
    assert.equal((await req('POST', '/api/moderate', { body: 't=garbage' })).status, 400);
    setClock(new Date('2026-12-26T12:00:00Z'));
    assert.equal((await req('POST', '/api/moderate', { body: `t=${t}` })).status, 400);
});

test('clean keeps comment line breaks, flattens names, drops control characters', () => {
    assert.equal(clean('  a\r\nb\u0007\n\n\n\nc  ', { newlines: true }), 'a\nb\n\nc');
    assert.equal(clean('Al\nice\u0000', { newlines: false }), 'Al ice');
});

test('esc covers the HTML specials', () => {
    assert.equal(esc(`<a href="x">'&'</a>`), '&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;');
});

test('unknown routes 404', async () => {
    assert.equal((await setup().req('GET', '/api/nope')).status, 404);
});
