#!/bin/bash -ex

NODE_INDEX="$1"
TOTAL_NODES="$2"

function checkEOL {
  ./scripts/checkeol.sh
}

lint() {
  echo "tslint $(node_modules/.bin/tslint --version)"
  npm run lint
}

unittest() {
  # test "src"

  # TODO: replace/upgrade mocha-junit-reporter
  #mocha test --reporter mocha-junit-reporter --reporter-options mochaFile=$CIRCLE_TEST_REPORTS/test-results.xml

  npm test --coverage
  #npm run coveralls

  # test compiled version in "dist/npm"
  $(npm bin)/babel -D --optional runtime --ignore "**/node_modules/**" -d test-compiled/ test/
  echo "--reporter spec --timeout 5000 --slow 500" > test-compiled/mocha.opts
  mkdir -p test-compiled/node_modules
  ln -nfs ../../dist/npm test-compiled/node_modules/xrpl-local
  mocha --opts test-compiled/mocha.opts test-compiled

  #compile tests for browser testing
  #gulp build-min build-tests
  #node --harmony test-compiled/mocked-server.js > /dev/null &

  #echo "Running tests in PhantomJS"
  #mocha-phantomjs test/localRunner.html
  #echo "Running tests using minified version in PhantomJS"
  #mocha-phantomjs test/localRunnerMin.html

  #echo "Running tests in SauceLabs"
  #http-server &
  #npm run sauce

  #pkill -f mocked-server.js
  #pkill -f http-server
  rm -rf test-compiled
}

integrationtest() {
  mocha test/integration/integration.js

  # run integration tests in PhantomJS
  #gulp build-tests build-min
  #echo "Running integragtion tests in PhantomJS"
  #mocha-phantomjs test/localIntegrationRunner.html
}

doctest() {
  mv docs/index.md docs/index.md.save
  npm run docgen
  mv docs/index.md docs/index.md.test
  mv docs/index.md.save docs/index.md
  cmp docs/index.md docs/index.md.test
  rm docs/index.md.test
}

oneNode() {
  checkEOL
  doctest
  lint
  unittest
  integrationtest
}

twoNodes() {
  case "$NODE_INDEX" in
    0) doctest; lint; integrationtest;;
    1) checkEOL; unittest;;
    *) echo "ERROR: invalid usage"; exit 2;;
  esac
}

threeNodes() {
  case "$NODE_INDEX" in
    0) doctest; lint; integrationtest;;
    1) checkEOL;;
    2) unittest;;
    *) echo "ERROR: invalid usage"; exit 2;;
  esac
}

case "$TOTAL_NODES" in
  "") oneNode;;
  1) oneNode;;
  2) twoNodes;;
  3) threeNodes;;
  *) echo "ERROR: invalid usage"; exit 2;;
esac
