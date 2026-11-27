// Draws approved comments into <inject-comments> and shows the result of a
// post. The comments Lambda only ever redirects back with a code; the text for
// each code lives here, and unknown codes are ignored, so nobody can put words
// on the page through the URL.

const MESSAGES = {
    pending: 'Thanks! Your comment is waiting for approval.',
    missing: 'Name and comment are both required.',
    'too-long': 'Name max 80 characters, comment max 2,000.',
    invalid: "Something in that didn't look like a comment.",
    error: 'Something broke on my end. Try again later.',
};

// Drafts survive the round trip to the Lambda, so an error doesn't eat
// someone's comment. sessionStorage can be unavailable; that only costs the
// convenience.
const draftKey = (path) => `comment-draft:${path}`;
// Components only need path= when pointing at another page (a count on /blog).
const here = () => location.pathname.replace(/\/+$/, '') || '/';
function store(fn) {
    try {
        return fn(window.sessionStorage);
    } catch {
        return null;
    }
}

// One request per post, shared by the comments list and any count links.
const requests = new Map();
function getComments(slug) {
    if (!requests.has(slug)) {
        requests.set(
            slug,
            // The comments section starts its own request early; use it if it's this post's.
            (window.commentsRequest?.slug === slug
                ? window.commentsRequest.response
                : fetch(`/api/comments/${slug}.json`).catch(() => null)
            )
                .then((res) => (res?.ok ? res.json() : []))
                .then((list) => (Array.isArray(list) ? list : []))
                .catch(() => []), // offline or blocked: show the empty state, the form still works
        );
    }
    return requests.get(slug);
}

const dateText = (iso) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

// Home's Latest Comment: shown only when there is one.
async function initLatestComment() {
    const box = document.querySelector('[data-latest-comment]');
    if (!box) return;
    let latest = null;
    try {
        const res = await fetch('/api/comments/latest.json');
        if (res.ok) latest = await res.json();
    } catch {
        return;
    }
    if (!latest || typeof latest.slug !== 'string' || !/^[a-z0-9-]+$/.test(latest.slug)) return;
    const time = box.querySelector('[data-latest-date]');
    time.dateTime = latest.date;
    time.textContent = dateText(latest.date);
    box.querySelector('[data-latest-name]').textContent = latest.name;
    const link = box.querySelector('[data-latest-link]');
    // Comments run oldest first, so the newest is the last one: link to it.
    link.href = `/${latest.slug}#latest-comment`;
    link.textContent = latest.title || latest.slug;
    // Only the first line (paragraph) of the comment, with an ellipsis when
    // there's more. Clamping the whole multi-line comment left the ellipsis
    // stranded on a line of its own at some widths.
    const lines = String(latest.comment).trim().split(/\n+/);
    box.querySelector('[data-latest-body]').textContent =
        lines.length > 1 ? `${lines[0].trim().replace(/[.,;:!?]+$/, '')}…` : lines[0];
    box.hidden = false;
}

export function initComments() {
    initLatestComment();
    document.querySelectorAll('[data-comment-count]').forEach(async (link) => {
        const n = (await getComments((link.dataset.commentCount || here()).slice(1))).length;
        link.textContent = n === 0 ? 'Be the first to comment' : n === 1 ? '1 comment' : `${n} comments`;
    });

    const root = document.querySelector('[data-comments]');
    if (!root) return;
    const path = root.dataset.comments || here();
    const form = root.querySelector('[data-comments-form]');
    form.elements.path.value = path;
    const status = root.querySelector('[data-comments-status]');

    const url = new URL(location.href);
    const code = url.searchParams.get('comment');
    if (code && Object.hasOwn(MESSAGES, code)) {
        status.textContent = MESSAGES[code];
        status.classList.remove('hidden');
        if (code === 'pending') {
            store((s) => s.removeItem(draftKey(path)));
        } else {
            const draft = JSON.parse(store((s) => s.getItem(draftKey(path))) || 'null');
            if (draft) {
                form.elements.name.value = draft.name;
                form.elements.comment.value = draft.comment;
            }
        }
    }
    if (code !== null) {
        // A refresh shouldn't show the message again.
        url.searchParams.delete('comment');
        history.replaceState(null, '', url.pathname + url.search + url.hash);
    }

    form.addEventListener('submit', () => {
        const draft = { name: form.elements.name.value, comment: form.elements.comment.value };
        store((s) => s.setItem(draftKey(path), JSON.stringify(draft)));
    });

    loadComments(root, path.slice(1)).then(async () => {
        // Finish the #comments jump the inline script held back, now that the
        // comments are in place. Chrome scores shifts per frame, so the scroll
        // waits for the frame after the comments were drawn (off-screen, at the
        // top of the page); a scroll on its own isn't a layout shift.
        // #latest-comment (from Home's Latest Comment) does the same, to the
        // newest comment, which is the last one.
        const jump = document.documentElement.dataset.commentsJump;
        if (jump === undefined) return;
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        delete document.documentElement.dataset.commentsJump;
        if (jump === 'latest') {
            document.getElementById('latest-comment')?.scrollIntoView();
            return;
        }
        const heading = root.querySelector('h2');
        heading.id = 'comments';
        heading.scrollIntoView();
    });
}

async function loadComments(root, slug) {
    const list = root.querySelector('[data-comments-list]');
    const empty = root.querySelector('[data-comments-empty]');
    const template = root.querySelector('[data-comment-template]');
    const comments = await getComments(slug);
    if (comments.length === 0) {
        empty.classList.remove('hidden');
        return;
    }
    for (const [i, c] of comments.entries()) {
        const item = template.content.cloneNode(true);
        // The newest comment is last; Home's Latest Comment links here.
        if (i === comments.length - 1) item.firstElementChild.id = 'latest-comment';
        item.querySelector('[data-comment-name]').textContent = c.name;
        const time = item.querySelector('[data-comment-date]');
        time.dateTime = c.date;
        time.textContent = dateText(c.date);
        item.querySelector('[data-comment-body]').textContent = c.comment;
        list.append(item);
    }
}
