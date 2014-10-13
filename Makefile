.PHONY: default clean build
default: build

build: public/vendor.js public/bugger.js

clean:
	rm -f public/vendor.js public/bugger.js

public/vendor.js:
	./node_modules/.bin/browserify \
		--require react \
		--require lodash \
		--outfile $@

BUNDLE_OPTS := \
	--external react \
	--external lodash \
	--outfile public/bugger.js

public/bugger.js:
	./node_modules/.bin/browserify . $(BUNDLE_OPTS)

watch:
	./node_modules/.bin/watchify . $(BUNDLE_OPTS)
