#!/bin/bash
#
# Re-upload extension-less files in dist/ with explicit Content-Type: text/html.
# S3 can't infer text/html from a file with no extension, and CloudFront just
# passes the raw bytes back to the browser if the object has no Content-Type,
# which renders the page as plain text source instead of HTML.
#
# Run this AFTER `aws s3 sync dist/ ...` so the files are already in the bucket;
# this re-uploads only the extension-less ones with the correct metadata.

set -euo pipefail

if [[ -z "${S3_BUCKET_NAME:-}" ]]; then
    echo "apply-metadata: S3_BUCKET_NAME is not set" >&2
    exit 1
fi

count=0
for file in $(find dist -type f ! -name "*.*"); do
    key=$(echo "$file" | sed 's|dist/||')
    aws s3 cp "$file" "s3://$S3_BUCKET_NAME/$key" --content-type "text/html"
    count=$((count + 1))
done

echo "apply-metadata: tagged $count extension-less files with Content-Type: text/html"
