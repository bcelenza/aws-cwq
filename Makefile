.PHONY: install
install:
	npm install

.PHONY: clean
clean:
	rm -rf dist

.PHONY: build
build:
	npm run build

.PHONY: test
test:
	npm test

.PHONY: release
release: clean build test

.PHONY: publish
publish:
	npm publish