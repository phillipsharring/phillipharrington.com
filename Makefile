.PHONY: clean dev build format deploy provision

clean:
	rm -rf node_modules/.vite src/.vite dist

dev: clean
	npm run dev

build:
	npm run build

format:
	npm run format

# Local deploy: build, sync to S3, fix metadata, invalidate CF.
# Replaces the PR-merge -> CodeBuild round trip for routine deploys.
# CodeBuild still works if you'd rather merge a PR for visibility.
deploy:
	AWS_PROFILE=phillipharrington ./deploy/deploy.sh

# Ensure tags + CloudFront logging are set up. Idempotent.
provision:
	AWS_PROFILE=phillipharrington ./deploy/provision.sh
