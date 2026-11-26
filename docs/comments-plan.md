# Plan: comments on a static site

Comments on blog posts without a database, a server, or cookies. The pages stay static; comments live as one JSON file per post in their own bucket, and a Lambda handles posting and moderation.

## Decisions

- **Name and comment only.** No email field, no accounts, no cookies.
- **Commenter text never becomes HTML.** It is validated, length-limited, and only ever inserted as text into a template the site controls.
- **Moderated.** Nothing appears until approved.
- **Comments are their content, not the site's.** One file per post (`<slug>.json`) in a separate bucket. Never committed to git, never pulled down, never seen by `deploy/deploy.sh` (whose cleanup step deletes any key in the site bucket that isn't in `dist/`, which is the main reason for the separate bucket).
- **Pages stay static.** A small script fetches the post's JSON. Without JavaScript the comments don't show, but the form still works.

## Routes

CloudFront matches behaviors by path, not method, but `/api/comments` and `/api/comments/*` are different patterns:

| Path | Origin | Caching |
|---|---|---|
| `POST /api/comments` | Lambda | never |
| `/api/moderate` | Lambda | never |
| `GET /api/comments/<slug>.json` | comments bucket | cached; invalidated on approve |

Reads come straight from S3 through CloudFront, so showing comments costs no Lambda time. CloudFront can't strip a path prefix, so either store keys as `api/comments/<slug>.json` or add a one-line CloudFront function to trim it. Cosmetic; pick one.

## 0. AWS access

- The `default` profile is `user-manager`, which can only assume the `ops` profile's role (`ops-admin`) after MFA. Phillip starts that session in a separate terminal; it lasts about an hour.
- `ops-admin` does the provisioning: S3 bucket, Lambda + execution role, SES identity, SSM parameter, CloudFront behavior changes.
- If `ops-admin` is missing a permission, adding it is Phillip's step (via whichever identity can edit IAM; `user-manager` itself can't). Check this before starting, not halfway through.

## 1. Infrastructure (added to `deploy/provision.sh`, idempotent)

- **Bucket `phdc-comments`:** private, readable only by CloudFront (OAC), versioning on as the backup.
- **Lambda (Node):** code in `cloud/comments/`. Function URL with auth `NONE`, guarded instead by a secret `x-origin-verify` header that CloudFront adds as an origin custom header; the Lambda rejects requests without it. (CloudFront's OAC signing for Lambda origins needs a body-hash header on POSTs, which a plain browser form can't send.) Settings: comments bucket, distribution ID, notification addresses, and an SSM SecureString holding the HMAC key and the origin secret.
- **SES:** verify the sending identity. Sandbox mode is fine; the only recipient is Phillip.
- **CloudFront:** the three behaviors above. The existing `PhdcRedirects` viewer-request function stays on the default behavior only.

## 2. The Lambda

### `POST /api/comments` (urlencoded form)

1. Honeypot field filled → redirect as if accepted (`?comment=pending`), do nothing. Bots get no signal.
2. Validate: path is a known post slug; name 1 to 80 characters; comment 1 to 2,000; strip control characters; reject anything that fails with a status code (below).
3. Email Phillip via SES: name, post, comment, and an approve link. **No pending storage:** the comment rides inside the link, HMAC-signed (can't be forged or edited) with an expiry. To reject, ignore the email.
4. Redirect `303` to `/<slug>?comment=pending#comments`.

### `/api/moderate`

- **GET** shows a confirmation page with an Approve button. It must never approve on GET: email security scanners open links automatically.
- **POST** (Approve): verify signature and expiry, read `<slug>.json` (or start `[]`), skip if the comment's id is already there (double-click safe), append `{ id, name, comment, date }`, write, invalidate `/api/comments/<slug>.json`. Invalidating also clears the cached 404 from before a post's first comment.

### Status codes for `?comment=`

The Lambda redirects with a code, never a message. The component maps a fixed set of codes to its own text and ignores anything else, so nobody can put arbitrary words on the page through the URL.

| Code | Shown |
|---|---|
| `pending` | Thanks! Your comment is waiting for approval. |
| `missing` | Name and comment are both required. |
| `too-long` | Name max 80 characters, comment max 2,000. |
| `invalid` | Something in that didn't look like a comment. |
| `error` | Something broke on our end. Try again later. |

Spam gets `pending` on purpose. Because the page reloads, the script can save the draft to `sessionStorage` on submit and restore it after an error code, so nobody loses the life of John.

## 3. The site: `<inject-comments>`

At the bottom of each blog post:

- `#comments` heading and a list rendered from a `<template>` the site controls; "No comments yet" when the JSON 404s.
- A plain `<form method="post" action="/api/comments">` with the page path as a hidden field and a visually hidden honeypot field.
- About 20 lines of script: fetch the JSON, fill the template with `textContent` only, show the `?comment=` status message from the table above, restore the draft after an error.

The comment markup lives in the component, so restyling is a normal site deploy. The JSON is data only.

## 4. Order of work

1. Confirm `ops-admin` permissions; verify the SES sender; create the bucket.
2. Write the Lambda; test locally with fake events (valid, honeypot, missing, too long, bad characters, bad signature, expired link, double approve).
3. Deploy the Lambda and add the CloudFront behaviors.
4. Build the component; add it to one post.
5. End to end: comment, email arrives, GET shows confirm, approve, comment appears, second approve is a no-op, error codes render, unknown codes don't.
6. Add the component to every post.
7. Write "How in the hell does my static site have comments?"

Roughly a day, most of it steps 3 and 5. Pennies a month to run.

## The latest comment on Home (built 2026-11-26)

Phillip's design, on Home between From the Blog and Built in the Open:

- On approve, the Lambda also overwrites `api/comments/latest.json` with that comment plus its post: `{ slug, title, id, name, comment, date }`, and invalidates it along with the post's file. The title comes from the post page's `<title>`, which the Lambda already fetches when the comment is posted (carry it in the signed token).
- A separate `<latest-comment>` component, not `<inject-comments>`: Home needs one comment and "on <post title>" with a link, not a heading, a list and a form. It reuses the comment template's look (date in the margin column, name, text) and the same textContent-only rendering.
- The deploy seeds `latest.json` as `null` (create-only, like the per-post files) so Home never 404s before the first approval; the component renders nothing for `null`.
