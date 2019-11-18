import setupAPI from '../setup-api'
import { RippleAPI } from 'ripple-api'
import addresses from '../fixtures/addresses.json'
import { getAllPublicMethods, loadTestSuite } from './utils'

/**
 * RippleAPI Test Runner
 *
 * Background: "test/api-test.ts" had hit 4000+ lines of test code and 300+
 * individual tests. Additionally, a new address format was added which
 * forced us to copy-paste duplicate the test file to test both the old forms
 * of address. This added a significant maintenance burden.
 *
 * This test runner allows us to split our tests by RippleAPI method, and
 * automatically load, validate, and run them. Each tests accepts arguments to
 * test with, which allows us to re-run tests across different data
 * (ex: different address styles).
 *
 * Additional benefits:
 *   - Throw errors when we detect the absence of tests.
 *   - Type the API object under test and catch typing issues (currently untyped).
 *   - Sets the stage for more cleanup, like moving test-specific fixtures closer to their tests.
 */
describe('RippleAPI [Test Runner]', function() {
  beforeEach(setupAPI.setup)
  afterEach(setupAPI.teardown)

  // Collect all the tests:
  const allPublicMethods = getAllPublicMethods(new RippleAPI())
  const allTestSuites = allPublicMethods.map(loadTestSuite)

  // TODO: Once migration is complete, remove this filter so that missing tests are reported.
  const filteredTestSuites = allTestSuites.filter(({ isMissing }) => !isMissing)

  // Run all the tests:
  for (const { name: suiteName, tests, isMissing } of filteredTestSuites) {
    describe(suiteName, () => {
      // Check that tests exist as expected, and report any errors if they don't.
      it('has valid test suite', () => {
        if (isMissing) {
          throw new Error(
            `Test file not found! Create file "test/api/${suiteName}/index.ts".`
          )
        }
        if (tests.length === 0) {
          throw new Error(`No tests found! Is your test file set up properly?`)
        }
      })
      // Run each test with the original-style address.
      describe(`1. Original Address Style`, () => {
        for (const [testName, fn] of tests) {
          it(testName, function() {
            return fn(this.api, addresses.ACCOUNT)
          })
        }
      })
      // Run each test with the newer, x-address style.
      describe(`2. X-Address Style`, () => {
        for (const [testName, fn] of tests) {
          it(testName, function() {
            return fn(this.api, addresses.ACCOUNT_X)
          })
        }
      })
    })
  }
})
