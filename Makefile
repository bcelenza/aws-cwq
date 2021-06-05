.PHONY: build
build:
	npm run build

.PHONY: test
test:
	npm test

.PHONY: release
release: build test

.PHONY: publish
publish:
	npm publish