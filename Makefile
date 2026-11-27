.PHONY: help start tail stop restart vite-clear clean build deploy provision cf-report cf-report-clean comments-test deploy-comments

help: ## Print help.
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n\nTargets:\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

# The frontend dev container. Served via the basic-services proxy at
# https://phillipharrington.test (and directly at http://localhost:5177).
start: ## Start the dev container (build if needed).
	@docker compose up --build -d

tail: ## Tail the dev container's log.
	@docker compose logs -f

stop: ## Stop the dev container.
	docker compose down

restart: ## Restart the dev container.
	docker compose restart frontend

# node_modules is a Docker volume, so Vite's cache lives inside the container,
# not in this folder: clear it there.
vite-clear: ## Clear Vite's cache and restart the dev container.
	docker compose exec frontend rm -rf /app/node_modules/.vite
	docker compose restart frontend

clean: ## Delete the build output and any Vite cache in this folder.
	rm -rf node_modules/.vite src/.vite dist

build: ## Build the site into dist/.
	npm run build

# Local deploy: build, sync to S3, fix metadata, invalidate CF.
deploy: ## Build and deploy to S3 and CloudFront.
	AWS_PROFILE=phillipharrington ./deploy/deploy.sh

# Ensure tags + CloudFront logging are set up. Idempotent.
provision: ## Set up tags and CloudFront logging (idempotent).
	AWS_PROFILE=phillipharrington ./deploy/provision.sh

# Sync CloudFront logs from S3 and open an HTML traffic report (GoAccess).
cf-report: ## Sync CloudFront logs and open a traffic report.
	@mkdir -p .cf-logs
	@AWS_PROFILE=phillipharrington aws s3 sync s3://phillipharrington-cloudfront-logs/ .cf-logs/ --quiet
	@if ! ls .cf-logs/*.gz >/dev/null 2>&1; then echo "No log files yet (CF logs may take ~1h to first appear)."; exit 0; fi
	@gunzip -c .cf-logs/*.gz | goaccess --log-format=CLOUDFRONT --date-format=%Y-%m-%d --time-format=%H:%M:%S -o cf-report.html -
	@open cf-report.html
	@echo "Report: cf-report.html"

# Delete cached log files and the report (will re-sync on next cf-report).
cf-report-clean: ## Delete the cached logs and the report.
	rm -rf .cf-logs cf-report.html

# Unit tests for the comments Lambda (no AWS needed).
comments-test: ## Unit tests for the comments Lambda.
	node --test cloud/comments/

# Ship cloud/comments/ to the comments Lambda. Infrastructure changes run as
# ops-admin, so this needs a live MFA session: aws sts get-caller-identity --profile ops
deploy-comments: comments-test ## Ship the comments Lambda (needs a live ops MFA session).
	@zip=$$(mktemp -d)/comments.zip; \
	  (cd cloud/comments && zip -q -X "$$zip" app.mjs index.mjs) && \
	  AWS_PROFILE=ops aws lambda update-function-code --function-name phillipharrington-comments \
	    --zip-file "fileb://$$zip" --query LastUpdateStatus --output text
