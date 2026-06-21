.PHONY: start clean build deploy provision cf-report cf-report-clean

# Start the frontend dev container. Served via the basic-services proxy at
# https://phillipharrington.test (and directly at http://localhost:5177).
start:
	docker compose up -d

clean:
	rm -rf node_modules/.vite src/.vite dist

build:
	npm run build

# Local deploy: build, sync to S3, fix metadata, invalidate CF.
# Replaces the PR-merge -> CodeBuild round trip for routine deploys.
# CodeBuild still works if you'd rather merge a PR for visibility.
deploy:
	AWS_PROFILE=phillipharrington ./deploy/deploy.sh

# Ensure tags + CloudFront logging are set up. Idempotent.
provision:
	AWS_PROFILE=phillipharrington ./deploy/provision.sh

# Sync CloudFront logs from S3 and open an HTML traffic report (GoAccess).
cf-report:
	@mkdir -p .cf-logs
	@AWS_PROFILE=phillipharrington aws s3 sync s3://phillipharrington-cloudfront-logs/ .cf-logs/ --quiet
	@if ! ls .cf-logs/*.gz >/dev/null 2>&1; then echo "No log files yet (CF logs may take ~1h to first appear)."; exit 0; fi
	@gunzip -c .cf-logs/*.gz | goaccess --log-format=CLOUDFRONT --date-format=%Y-%m-%d --time-format=%H:%M:%S -o cf-report.html -
	@open cf-report.html
	@echo "Report: cf-report.html"

# Delete cached log files and the report (will re-sync on next cf-report).
cf-report-clean:
	rm -rf .cf-logs cf-report.html
