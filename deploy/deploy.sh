#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────────────────────
# phillipharrington.com — Deploy Script
#
# Builds the static site, syncs to S3, fixes Content-Type metadata
# on extension-less files, invalidates CloudFront. Mirrors what the
# CodeBuild buildspec.yml does, but runs locally so you don't need
# a PR + merge cycle for every single change.
#
# Usage:  AWS_PROFILE=phillipharrington ./deploy/deploy.sh
# Or just: make deploy
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

echo "=== phillipharrington.com Deploy ==="
echo "Bucket:       $S3_BUCKET_NAME"
echo "Distribution: $CLOUDFRONT_DISTRIBUTION_ID"
echo "Region:       $REGION"
echo ""

# ── 1. Build ────────────────────────────────────────────────
# Note: graspr-build bakes the current git HEAD (short sha) into each
# rendered HTML page via [[gitSha]]. Commit BEFORE running this script
# if you want the deployed site's sha to match the latest commit.
# Deploying with uncommitted changes works fine; the baked sha just
# points at the last committed HEAD, not the working tree.
echo "→ Building..."
cd "$PROJECT_DIR"
npm run build
echo "  Build complete"

# graspr-build emits dist/<route>/index.html. Flatten to extensionless
# paths so the CloudFront function's URL rewrites resolve to real keys.
# Same step CodeBuild runs.
echo "→ Flattening dist/ for abstract URLs..."
node scripts/flatten-dist.mjs

# ── 2. Sync to S3 ───────────────────────────────────────────
# --delete removes destination files that aren't in source (replaces the
# `aws s3 rm --recursive` + sync pattern the buildspec uses; equivalent
# net effect, faster, doesn't briefly empty the live bucket).
# --exact-timestamps forces re-upload when timestamps differ (default
# would skip files where dest is newer).
# --exclude '.vite/*' keeps the Vite build manifest out of prod.
echo "→ Syncing dist/ to s3://$S3_BUCKET_NAME ..."
aws s3 sync "$PROJECT_DIR/dist/" "s3://$S3_BUCKET_NAME/" \
    --delete \
    --exact-timestamps \
    --exclude '.vite/*' \
    --region "$REGION"

# ── 3. Fix Content-Type on extensionless files ──────────────
# S3 can't infer Content-Type for files with no extension. CloudFront
# returns whatever S3 reports, which for unknown types is no header,
# which browsers render as plain text. apply-metadata.sh re-uploads
# the extensionless files with explicit text/html.
echo "→ Applying text/html Content-Type to extensionless files..."
"$PROJECT_DIR/scripts/apply-metadata.sh"

# ── 4. Invalidate CloudFront ────────────────────────────────
echo "→ Invalidating CloudFront cache..."
INV_ID=$(aws cloudfront create-invalidation \
    --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
    --paths "/*" \
    --query 'Invalidation.Id' \
    --output text \
    --region "$REGION")
echo "  Invalidation submitted: $INV_ID"

# ── Done ────────────────────────────────────────────────────
echo ""
echo "============================================"
echo "  DEPLOY COMPLETE"
echo "============================================"
echo ""
echo "  Site:  https://$DOMAIN"
echo "  Inv:   $INV_ID (clears in 1-3 min)"
echo ""
