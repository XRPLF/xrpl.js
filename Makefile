test:
	mocha --reporter spec test/*-test.js

coverage:
	rm -rf lib-cov
	jscoverage src/js/ripple lib-cov
	RIPPLE_LIB_COV=1 mocha --reporter html-cov test/*-test.js > coverage.html
	rm -rf lib-cov

.PHONY: test
