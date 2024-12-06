#!/bin/bash

for file in $(find public -type f ! -name "*.*"); do
  key=$(echo $file | sed 's|public/||')
  aws s3 cp "$file" "s3://$S3_BUCKET_NAME/$key" --content-type "text/html"
done
