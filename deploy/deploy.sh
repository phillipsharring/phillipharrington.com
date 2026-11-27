#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────────────────────
# phillipharrington.com — Deploy Script
#
# Builds the static site, syncs to S3 with the right Content-Type and
# Cache-Control on every object, makes sure each post with comments has a
# comments file, and invalidates CloudFront.
#
# Usage:  AWS_PROFILE=phillipharrington ./deploy/deploy.sh
# Or just: make deploy
# Re-upload everything (e.g. after changing headers): FORCE_UPLOAD=1 make deploy
# ──────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$SCRIPT_DIR/.env.production"

if [ ! -f "$ENV_FILE" ]; then
    echo "Missing $ENV_FILE — run deploy/provision.sh first (or copy from a teammate)"
    exit 1
fi

set -a
# shellcheck disable=SC1090
. "$ENV_FILE"
set +a

# Sanity: confirm we're using the right AWS identity. Helps catch the
# "forgot AWS_PROFILE" or "running as reuselists" failure mode early.
CALLER=$(aws sts get-caller-identity --query 'Arn' --output text 2>/dev/null || true)
if [[ "$CALLER" != *":user/phillipharrington-deploy" ]]; then
    echo "Refusing to deploy: AWS identity is '$CALLER'"
    echo "Expected an ARN ending in :user/phillipharrington-deploy."
    echo "Run with AWS_PROFILE=phillipharrington (or 'make deploy')."
    exit 1
fi

# Say so, loudly, when the deploy dies partway.
#
# `set -e` aborts silently, so a failed run ends on whatever the last command
# printed, which for an S3 transfer is a progress meter. Piping this script
# through anything also hands you the pipe's exit status rather than its own,
# so a dead deploy can read as a successful one.
#
# ERR does not fire for failures inside an `until`/`if` condition, so retry()'s
# own attempts stay quiet and only an exhausted retry lands here.
trap 'rc=$?; echo ""; echo "============================================"; echo "  DEPLOY FAILED (line $LINENO, exit $rc)"; echo "  Nothing after this point ran."; echo "============================================"; exit $rc' ERR

# Retry a transfer that failed for transport reasons rather than logic ones.
#
# The AWS CRT client abandons uploads by itself with
# AWS_ERROR_HTTP_CHANNEL_THROUGHPUT_FAILURE once throughput falls under its
# minimum. On 2026-10-27, at roughly 640 bytes/second, that killed most of a
# 13 MB deploy and left the bucket holding HTML that referenced a stylesheet
# the same run had deleted. Every one of those uploads then succeeded on a
# later attempt, which is the whole argument for this function.
retry() {
    local attempts="$1"; shift
    local n=1
    until "$@"; do
        if [ "$n" -ge "$attempts" ]; then
            echo "  FAILED after $attempts attempts: $1 ..." >&2
            return 1
        fi
        echo "  attempt $n failed, retrying in $((n * 5))s" >&2
        sleep $((n * 5))
        n=$((n + 1))
    done
    if [ "$n" -gt 1 ]; then
        echo "  succeeded on attempt $n"
    fi
    return 0
}

# Local content hash, for comparison against an S3 ETag.
md5_of() {
    if command -v md5 >/dev/null 2>&1; then
        md5 -q "$1"
    else
        md5sum "$1" | awk '{print $1}'
    fi
}

# S3 cannot infer a Content-Type for a file with no extension, and CloudFront
# hands back whatever S3 reports, so an untyped page renders as source text.
# This is the same rule scripts/apply-metadata.sh applies; keeping it here lets
# the upload set the header once instead of re-uploading every page afterwards.
content_type_for() {
    case "$1" in
        *.html) echo "text/html" ;;
        *.css)  echo "text/css" ;;
        *.js)   echo "application/javascript" ;;
        *.json) echo "application/json" ;;
        *.svg)  echo "image/svg+xml" ;;
        *.png)  echo "image/png" ;;
        *.jpg|*.jpeg) echo "image/jpeg" ;;
        *.webp) echo "image/webp" ;;
        *.ico)  echo "image/x-icon" ;;
        *.woff2) echo "font/woff2" ;;
        *.woff) echo "font/woff" ;;
        *.xml)  echo "application/xml" ;;
        *.txt)  echo "text/plain" ;;
        *.*)    echo "" ;;
        *)      echo "text/html" ;;
    esac
}

# Cache-Control, set per object at upload so CloudFront passes it to browsers.
# Before this nothing had one, so every return visit re-downloaded everything.
#
# - assets/ and fonts/: the build hashes asset names and the fonts never change,
#   so a year, immutable.
# - img/: names are not hashed, so 30 days. Replacing an image means a new name.
# - pages: browsers always revalidate (max-age=0), while s-maxage lets CloudFront
#   keep them until the invalidation at the end of every deploy.
# - the rest (robots.txt, manifest, favicons): a day.
cache_control_for() {
    case "$1" in
        assets/*|fonts/*) echo "public, max-age=31536000, immutable" ;;
        # A replaced image always gets a new filename, so a year is safe. Editing
        # one in place (icons.svg included) means renaming it, or visitors keep
        # the old copy for up to a year.
        img/*) echo "public, max-age=31536000" ;;
        *.html) echo "public, max-age=0, must-revalidate, s-maxage=31536000" ;;
        *.*) echo "public, max-age=86400" ;;
        *) echo "public, max-age=0, must-revalidate, s-maxage=31536000" ;;
    esac
}

echo "=== phillipharrington.com Deploy ==="
echo "Bucket:       $S3_BUCKET_NAME"
echo "Distribution: $CLOUDFRONT_DISTRIBUTION_ID"
echo "Region:       $REGION"
echo ""

# ── 1. Build ────────────────────────────────────────────────
# Note: handlr-build bakes the current git HEAD (short sha) into each
# rendered HTML page via [[gitSha]]. Commit BEFORE running this script
# if you want the deployed site's sha to match the latest commit.
# Deploying with uncommitted changes works fine; the baked sha just
# points at the last committed HEAD, not the working tree.
echo "→ Building..."
cd "$PROJECT_DIR"
npm run build
echo "  Build complete"

# handlr-build emits dist/<route>/index.html. Flatten to extensionless
# paths so the CloudFront function's URL rewrites resolve to real keys.
# Same step CodeBuild runs.
echo "→ Flattening dist/ for abstract URLs..."
node scripts/flatten-dist.mjs

# A page with a TK placeholder still in it is a draft. The placeholder
# component marks itself with data-tk; refuse before anything uploads.
TK_PAGES=$(grep -rl --exclude-dir=assets --exclude-dir=img 'data-tk' "$PROJECT_DIR/dist" || true)
if [ -n "$TK_PAGES" ]; then
    echo "Refusing to deploy: these pages still have TK placeholders:"
    echo "$TK_PAGES" | sed "s|$PROJECT_DIR/dist/|  |"
    exit 1
fi

# Strip macOS cruft before anything looks at dist/. A .DS_Store that reaches the
# bucket is served publicly and lists local filenames: one was answering 200 at
# https://phillipharrington.com/.DS_Store until 2026-10-27. Removing it here
# rather than excluding it at upload time also means the delete pass below
# purges any copy already in the bucket.
find "$PROJECT_DIR/dist" -name '.DS_Store' -delete

# ── 2. Sync to S3, by content rather than by timestamp ──────
#
# This used to be one `aws s3 sync --delete --exact-timestamps`, which
# re-uploaded all 163 objects and 13 MB on every run even for a one-line copy
# change. The cause was the comparison, not the flag: `npm run build` rewrites
# every file with a fresh mtime, so each one looks newer than the bucket's copy.
# Dropping --exact-timestamps would not have helped, because the default rule
# also uploads when the source is newer. Any mtime comparison is simply wrong
# for a generator that rebuilds everything each time.
#
# So compare content. An S3 ETag is the MD5 of the object for single-part
# uploads, and one list-objects-v2 call returns every one for a few KB. On the
# first run of this version, 162 of 162 objects were byte-identical to what was
# already in the bucket and nothing uploaded at all.
#
# That run flattered it slightly, because HEAD had not moved. handlr-build
# stamps the current git sha into every page, so **every commit changes every
# page** and all of them re-upload. What skips is the rest, and that is where
# the bytes are: 10.49 MB of images, fonts and assets against 0.26 MB of pages.
# A typical commit ships roughly 2% of what it used to, and a rebuild at the
# same commit ships nothing.
#
# Deliberately NOT `--size-only`, which is the tempting one-flag version of this
# and would be actively dangerous. The two stale pages that motivated the change
# were 13548 and 19908 bytes both locally and remotely, identical in size,
# differing only in a hashed asset filename of the same length. A size
# comparison would have called them unchanged and left the site broken.
#
# Assets upload BEFORE the pages that reference them. That ordering is what
# makes a half-finished deploy harmless instead of an outage: HTML pointing at a
# stylesheet that is not there yet renders unstyled, while an unreferenced
# stylesheet sitting in the bucket a minute early costs nothing. Getting this
# backwards on 2026-10-27 is what took the site's styling down.
echo "→ Comparing dist/ against s3://$S3_BUCKET_NAME ..."

REMOTE_LIST=$(mktemp)
LOCAL_LIST=$(mktemp)
UPLOAD_ASSETS=$(mktemp)
UPLOAD_PAGES=$(mktemp)
trap 'rm -f "$REMOTE_LIST" "$LOCAL_LIST" "$UPLOAD_ASSETS" "$UPLOAD_PAGES"' EXIT

# Paginated on purpose: list-objects-v2 returns at most 1000 keys per page, and
# a bucket that outgrows that would otherwise silently look like it had fewer
# objects than it does, which this script would read as "delete the rest".
aws s3api list-objects-v2 \
    --bucket "$S3_BUCKET_NAME" \
    --region "$REGION" \
    --query 'Contents[].[Key,ETag]' \
    --output text 2>/dev/null \
    | tr -d '"' > "$REMOTE_LIST" || true

# Nested pages. flatten-dist.mjs can only flatten top-level routes, because a
# filesystem can't hold both a file dist/php and a directory dist/php/. S3 has
# no such rule: the keys `php` and `php/client-server` live side by side. So a
# nested page stays dist/php/client-server/index.html on disk and is uploaded
# under the extensionless key `php/client-server`, and dist/php/index.html
# under `php`. The root dist/index.html keeps its name (CloudFront serves it
# for `/`).
key_for() {
    local rel="${1#"$PROJECT_DIR"/dist/}"
    case "$rel" in
        index.html) echo "$rel" ;;
        */index.html) echo "${rel%/index.html}" ;;
        *) echo "$rel" ;;
    esac
}

# The local file behind a key: itself, or the index.html of a nested page.
src_for() {
    if [ -f "$PROJECT_DIR/dist/$1" ]; then
        echo "$PROJECT_DIR/dist/$1"
    else
        echo "$PROJECT_DIR/dist/$1/index.html"
    fi
}

SAME=0
while IFS= read -r file; do
    key="$(key_for "$file")"
    case "$key" in .vite/*) continue ;; esac
    echo "$key" >> "$LOCAL_LIST"

    remote_etag=$(awk -F'\t' -v k="$key" '$1 == k { print $2; exit }' "$REMOTE_LIST")

    # An ETag containing a dash is a multipart upload, where it is a hash of
    # part hashes rather than of the object, so it cannot be compared to a local
    # MD5. Treat it as changed: wrong only in the harmless direction.
    # FORCE_UPLOAD=1 re-uploads everything, for when the metadata changes
    # (Content-Type, Cache-Control) but the bytes don't, so the ETags still match.
    if [ "${FORCE_UPLOAD:-0}" != "1" ] && [ -n "$remote_etag" ] && [ "${remote_etag#*-}" = "$remote_etag" ] \
        && [ "$remote_etag" = "$(md5_of "$file")" ]; then
        SAME=$((SAME + 1))
        continue
    fi

    case "$key" in
        assets/*|fonts/*|*.woff2|*.woff) echo "$key" >> "$UPLOAD_ASSETS" ;;
        *) echo "$key" >> "$UPLOAD_PAGES" ;;
    esac
done < <(find "$PROJECT_DIR/dist" -type f)

N_ASSETS=$(wc -l < "$UPLOAD_ASSETS" | tr -d ' ')
N_PAGES=$(wc -l < "$UPLOAD_PAGES" | tr -d ' ')
echo "  unchanged: $SAME   to upload: $((N_ASSETS + N_PAGES)) ($N_ASSETS assets, $N_PAGES other)"

upload_key() {
    local key="$1"
    local ct cc
    ct="$(content_type_for "$key")"
    cc="$(cache_control_for "$key")"
    if [ -n "$ct" ]; then
        retry 5 aws s3 cp "$(src_for "$key")" "s3://$S3_BUCKET_NAME/$key" \
            --content-type "$ct" --cache-control "$cc" --no-progress --region "$REGION"
    else
        retry 5 aws s3 cp "$(src_for "$key")" "s3://$S3_BUCKET_NAME/$key" \
            --cache-control "$cc" --no-progress --region "$REGION"
    fi
}

if [ "$N_ASSETS" -gt 0 ]; then
    echo "→ Uploading assets first ($N_ASSETS)..."
    while IFS= read -r key; do upload_key "$key"; done < "$UPLOAD_ASSETS"
fi

if [ "$N_PAGES" -gt 0 ]; then
    echo "→ Uploading pages and images ($N_PAGES)..."
    while IFS= read -r key; do upload_key "$key"; done < "$UPLOAD_PAGES"
fi

# Replaces `--delete`. Runs last, so nothing a page still references is removed
# before its replacement is in place.
echo "→ Removing keys that are no longer in dist/..."
N_GONE=0
while IFS=$'\t' read -r key _etag; do
    [ -n "$key" ] || continue
    if ! grep -Fxq "$key" "$LOCAL_LIST"; then
        retry 3 aws s3 rm "s3://$S3_BUCKET_NAME/$key" --region "$REGION" >/dev/null
        echo "  deleted: $key"
        N_GONE=$((N_GONE + 1))
    fi
done < "$REMOTE_LIST"
echo "  removed: $N_GONE"

CHANGED=$((N_ASSETS + N_PAGES + N_GONE))

# Content-Type is set per object by upload_key above, so there is no second pass
# re-uploading the extensionless pages.

# ── 2b. An empty comments file for every post that shows comments ──
#
# The page asks for /api/comments/<slug>.json on every load, and a 404 there
# lands in the browser console (Lighthouse docks Best Practices for it). So a
# post that carries the comments section gets "[]" in the comments bucket the
# first time it's deployed. --if-none-match '*' makes S3 create the file only
# if it isn't there, so this can never touch approved comments, even racing an
# approval. Nothing else in this script goes near that bucket.
COMMENTS_BUCKET="phillipharrington-comments"
echo "→ Making sure every post with comments has a comments file..."
EMPTY_JSON="$(mktemp)"
printf '[]' > "$EMPTY_JSON"
N_SEEDED=0
while IFS= read -r file; do
    slug="$(key_for "$file")"
    if out=$(aws s3api put-object --bucket "$COMMENTS_BUCKET" --key "api/comments/$slug.json" \
        --body "$EMPTY_JSON" --if-none-match '*' \
        --content-type 'application/json; charset=utf-8' \
        --cache-control 'public, max-age=60, s-maxage=31536000' \
        --region "$REGION" 2>&1); then
        echo "  created: api/comments/$slug.json"
        N_SEEDED=$((N_SEEDED + 1))
    elif [[ "$out" != *PreconditionFailed* ]]; then
        # Not worth stopping a half-done deploy over (the invalidation is still
        # to come); the post just 404s on its comments until the next deploy.
        echo "  WARNING, not created: api/comments/$slug.json: $out"
    fi
done < <(grep -rl --exclude-dir=assets --exclude-dir=img 'data-comments=' "$PROJECT_DIR/dist")
# Home's Latest Comment reads latest.json; "null" until the first approval
# (the Lambda overwrites it on every approve). Same create-only rule.
printf 'null' > "$EMPTY_JSON"
if out=$(aws s3api put-object --bucket "$COMMENTS_BUCKET" --key "api/comments/latest.json" \
    --body "$EMPTY_JSON" --if-none-match '*' \
    --content-type 'application/json; charset=utf-8' \
    --cache-control 'public, max-age=60, s-maxage=31536000' \
    --region "$REGION" 2>&1); then
    echo "  created: api/comments/latest.json"
    N_SEEDED=$((N_SEEDED + 1))
elif [[ "$out" != *PreconditionFailed* ]]; then
    echo "  WARNING, not created: api/comments/latest.json: $out"
fi
rm -f "$EMPTY_JSON"
echo "  new comments files: $N_SEEDED"

# ── 3. Invalidate CloudFront ────────────────────────────────
#
# Skipped entirely when nothing changed, which is now the common case. An
# invalidation on an unchanged deploy only throws away a warm cache, and the
# first 1000 paths a month are the free ones.
#
# Still `/*` rather than the specific keys when there is anything to do. The
# pages are extensionless and the CloudFront function rewrites request URIs
# onto them, so the path a viewer is served under is not reliably the key that
# changed. `/*` counts as a single path against the monthly allowance anyway.
if [ "$CHANGED" -eq 0 ]; then
    INV_ID="(skipped, nothing changed)"
    echo "→ Nothing changed, skipping CloudFront invalidation"
else
    echo "→ Invalidating CloudFront cache..."
    INV_ID=$(retry 3 aws cloudfront create-invalidation \
        --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
        --paths "/*" \
        --query 'Invalidation.Id' \
        --output text \
        --region "$REGION")
    echo "  Invalidation submitted: $INV_ID"
fi

# ── Done ────────────────────────────────────────────────────
echo ""
echo "============================================"
echo "  DEPLOY COMPLETE"
echo "============================================"
echo ""
echo "  Site:  https://$DOMAIN"
echo "  Inv:   $INV_ID (clears in 1-3 min)"
echo ""
