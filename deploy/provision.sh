#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────────────────────
# phillipharrington.com — AWS Provisioning Script
#
# Idempotent. Ensures the supporting AWS resources are tagged + set up
# the way the project expects. Safe to re-run.
#
# What it does today:
#   - Applies the standard tag schema to the site bucket + CF distribution
#   - Sets up CloudFront standard logging to a private S3 bucket
#     (parity with reuselists)
#
# What it does NOT do (yet): create the site bucket or CF distribution
# from scratch. Those already exist. If you ever need to spin this up
# in a new account, extend this script with the create-if-missing
# pattern from reuselists/deploy/provision.sh.
#
# Usage:  AWS_PROFILE=phillipharrington ./deploy/provision.sh
# Or:     make provision
# ──────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env.production"

if [ ! -f "$ENV_FILE" ]; then
    echo "Missing $ENV_FILE"
    exit 1
fi

set -a
# shellcheck disable=SC1090
. "$ENV_FILE"
set +a

CALLER=$(aws sts get-caller-identity --query 'Arn' --output text 2>/dev/null || true)
if [[ "$CALLER" != *":user/phillipharrington-deploy" ]]; then
    echo "Refusing to provision: AWS identity is '$CALLER'"
    echo "Expected ARN ending in :user/phillipharrington-deploy."
    exit 1
fi

LOG_BUCKET="phillipharrington-cloudfront-logs"
# AWS-owned canonical user that delivers CloudFront standard logs.
# Documented constant; same value for every account.
LOG_DELIVERY_CANONICAL_ID="c4c1ede66af53448b93c283ce9448c4ba468c9432aa01d700d3878632f77d2d0"

echo "=== phillipharrington.com Provisioning ==="
echo "Site bucket:   $S3_BUCKET_NAME"
echo "Distribution:  $CLOUDFRONT_DISTRIBUTION_ID"
echo "Log bucket:    $LOG_BUCKET"
echo ""

# ── 1. Sanity: site bucket + distribution exist ─────────────
echo "→ Checking site bucket exists..."
if ! aws s3api head-bucket --bucket "$S3_BUCKET_NAME" --region "$REGION" 2>/dev/null; then
    echo "  Site bucket $S3_BUCKET_NAME not found. This script assumes existing infra."
    exit 1
fi
echo "  OK"

echo "→ Checking CloudFront distribution exists..."
if ! aws cloudfront get-distribution --id "$CLOUDFRONT_DISTRIBUTION_ID" --region "$REGION" >/dev/null 2>&1; then
    echo "  Distribution $CLOUDFRONT_DISTRIBUTION_ID not found."
    exit 1
fi
echo "  OK"

# ── 2. Tag the site bucket per project schema ───────────────
echo "→ Tagging site bucket..."
aws s3api put-bucket-tagging --bucket "$S3_BUCKET_NAME" \
    --tagging 'TagSet=[
        {Key=env,Value=production},
        {Key=project,Value=phillipharrington},
        {Key=component,Value=site},
        {Key=Name,Value=phillipharrington-site}
    ]' >/dev/null
echo "  Done"

# ── 3. Tag the CloudFront distribution ──────────────────────
echo "→ Tagging CloudFront distribution..."
CF_ARN="arn:aws:cloudfront::$(aws sts get-caller-identity --query Account --output text):distribution/$CLOUDFRONT_DISTRIBUTION_ID"
aws cloudfront tag-resource --resource "$CF_ARN" --tags 'Items=[
    {Key=env,Value=production},
    {Key=project,Value=phillipharrington},
    {Key=component,Value=cdn},
    {Key=Name,Value=phillipharrington-cdn}
]' >/dev/null
echo "  Done"

# ── 4. CloudFront standard logging → S3 ─────────────────────
# Same pattern as reuselists. V1 (legacy) standard logging uses S3
# ACLs to write, so the log bucket needs ObjectWriter/BucketOwnerPreferred
# ownership (not BucketOwnerEnforced) and the awslogsdelivery canonical
# user needs FULL_CONTROL via ACL.
echo "→ Setting up CloudFront standard logging..."

if aws s3api head-bucket --bucket "$LOG_BUCKET" --region "$REGION" 2>/dev/null; then
    echo "  Log bucket exists: $LOG_BUCKET"
else
    aws s3api create-bucket \
        --bucket "$LOG_BUCKET" \
        --region "$REGION" \
        --object-ownership BucketOwnerPreferred >/dev/null
    echo "  Log bucket created: $LOG_BUCKET"
fi

aws s3api put-bucket-tagging --bucket "$LOG_BUCKET" \
    --tagging 'TagSet=[
        {Key=env,Value=production},
        {Key=project,Value=phillipharrington},
        {Key=component,Value=cdn-logs},
        {Key=Name,Value=phillipharrington-cf-logs}
    ]' >/dev/null

aws s3api put-public-access-block --bucket "$LOG_BUCKET" \
    --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true >/dev/null

aws s3api put-bucket-ownership-controls --bucket "$LOG_BUCKET" \
    --ownership-controls 'Rules=[{ObjectOwnership=BucketOwnerPreferred}]' >/dev/null

# Grant awslogsdelivery FULL_CONTROL while preserving bucket-owner
# FULL_CONTROL (put-bucket-acl replaces the entire ACL).
LOG_BUCKET_OWNER_ID=$(aws s3api get-bucket-acl --bucket "$LOG_BUCKET" \
    --query 'Owner.ID' --output text)
aws s3api put-bucket-acl --bucket "$LOG_BUCKET" \
    --grant-full-control "id=$LOG_BUCKET_OWNER_ID,id=$LOG_DELIVERY_CANONICAL_ID" >/dev/null

# Expire logs after 90 days. Adjust if you want a longer retention.
# Note: the IAM action is s3:PutLifecycleConfiguration (no `Bucket` in
# the name) even though the API method is PutBucketLifecycleConfiguration.
aws s3api put-bucket-lifecycle-configuration --bucket "$LOG_BUCKET" \
    --lifecycle-configuration '{
        "Rules": [{
            "ID": "expire-old-logs",
            "Status": "Enabled",
            "Filter": {"Prefix": ""},
            "Expiration": {"Days": 90}
        }]
    }' >/dev/null

# Enable logging on the distribution if not already.
aws cloudfront get-distribution-config --id "$CLOUDFRONT_DISTRIBUTION_ID" --output json > /tmp/ph-cf-config.json
LOG_ETAG=$(jq -r '.ETag' /tmp/ph-cf-config.json)
ALREADY_LOGGING=$(jq -r '.DistributionConfig.Logging.Enabled' /tmp/ph-cf-config.json)

if [ "$ALREADY_LOGGING" = "true" ]; then
    echo "  CF logging already enabled — leaving alone"
else
    jq --arg bucket "${LOG_BUCKET}.s3.amazonaws.com" '
        .DistributionConfig.Logging = {
            "Enabled": true,
            "IncludeCookies": false,
            "Bucket": $bucket,
            "Prefix": ""
        } | .DistributionConfig
    ' /tmp/ph-cf-config.json > /tmp/ph-cf-logging-update.json
    aws cloudfront update-distribution --id "$CLOUDFRONT_DISTRIBUTION_ID" \
        --if-match "$LOG_ETAG" \
        --distribution-config file:///tmp/ph-cf-logging-update.json \
        --query 'Distribution.Status' --output text >/dev/null
    echo "  CF logging enabled → s3://$LOG_BUCKET/"
fi

rm -f /tmp/ph-cf-config.json /tmp/ph-cf-logging-update.json

echo ""
echo "============================================"
echo "  PROVISIONING COMPLETE"
echo "============================================"
echo ""
echo "  Tagged:        $S3_BUCKET_NAME, $CLOUDFRONT_DISTRIBUTION_ID"
echo "  CF logs bucket: $LOG_BUCKET"
echo ""
