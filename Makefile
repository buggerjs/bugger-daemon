default: all

MOCHA  = node_modules/.bin/mocha --recursive -u tdd
WACHS  = node_modules/.bin/wachs
GROC   = node_modules/.bin/groc

watch:
	$(WACHS) -o "**/*.js" node bin/bugger-daemon.js

.PHONY : test test-unit
test: test-unit
test-unit:
	NODE_ENV=test ${MOCHA} -R spec --recursive test/unit

.PHONY: release release-patch release-minor release-major

EDITOR ?= vim
VERSION = $(shell node -pe 'require("./package.json").version')
release-patch: NEXT_VERSION = $(shell node -pe 'require("semver").inc("$(VERSION)", "patch")')
release-minor: NEXT_VERSION = $(shell node -pe 'require("semver").inc("$(VERSION)", "minor")')
release-major: NEXT_VERSION = $(shell node -pe 'require("semver").inc("$(VERSION)", "major")')
release-patch: release
release-minor: release
release-major: release

release: test
	node -e '\
		var j = require("./package.json");\
		j.version = "$(NEXT_VERSION)";\
		var s = JSON.stringify(j, null, 2);\
		require("fs").writeFileSync("./package.json", s);'
	git commit package.json -m 'Version $(NEXT_VERSION)'
	git tag -a "v$(NEXT_VERSION)" -m "Version $(NEXT_VERSION)"
	git push --tags origin HEAD:master
	npm publish
