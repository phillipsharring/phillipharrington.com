.PHONY: clean dev build format

clean:
	rm -rf node_modules/.vite src/.vite dist

dev: clean
	npm run dev

build:
	npm run build

format:
	npm run format
