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
function store(fn) {
    try {
        return fn(window.sessionStorage);
    } catch {
        return null;
    }
}

export function initComments() {
    const root = document.querySelector('[data-comments]');
    if (!root) return;
    const path = root.dataset.comments;
    const form = root.querySelector('[data-comments-form]');
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

    loadComments(root, path.slice(1));
}

async function loadComments(root, slug) {
    const list = root.querySelector('[data-comments-list]');
    const empty = root.querySelector('[data-comments-empty]');
    const template = root.querySelector('[data-comment-template]');
    let comments = [];
    try {
        const res = await fetch(`/api/comments/${slug}.json`);
        if (res.ok) comments = await res.json();
    } catch {
        // Offline or blocked: show the empty state, the form still works.
    }
    if (!Array.isArray(comments) || comments.length === 0) {
        empty.classList.remove('hidden');
        return;
    }
    for (const c of comments) {
        const item = template.content.cloneNode(true);
        item.querySelector('[data-comment-name]').textContent = c.name;
        const time = item.querySelector('[data-comment-date]');
        time.dateTime = c.date;
        time.textContent = new Date(c.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
        item.querySelector('[data-comment-body]').textContent = c.comment;
        list.append(item);
    }
}
