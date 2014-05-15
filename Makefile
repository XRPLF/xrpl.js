all:
	./node_modules/.bin/gulp

test:
	mocha --reporter spec test/*-test.js

coverage:
	rm -rf src-cov
	mkdir src-cov
	mkdir src-cov/js
	jscoverage --no-highlight src/js/ripple src-cov/js/ripple
	RIPPLE_LIB_COV=1 mocha --reporter html-cov test/*-test.js > coverage.html
	rm -rf src-cov


.PHONY: test coverage all
