import setupClient from './setup-client'
import {Client} from 'xrpl-local'
import addresses from './fixtures/addresses.json'
import {getAllPublicMethods, LoadedTestSuite, loadTestSuitesFromFolder} from './utils'

/**
 * Client Test Runner
 *
 * Background: "test/client-test.ts" had hit 4000+ lines of test code and 300+
 * individual tests. Additionally, a new address format was added which
 * forced us to copy-paste duplicate the test file to test both the old forms
 * of address. This added a significant maintenance burden.
 *
 * This test runner allows us to split our tests by Client method, and
 * automatically load, validate, and run them. Each tests accepts arguments to
 * test with, which allows us to re-run tests across different data
 * (ex: different address styles).
 *
 * Additional benefits:
 *   - Throw errors when we detect the absence of tests.
 *   - Type the Client object under test and catch typing issues (currently untyped).
 *   - Sets the stage for more cleanup, like moving test-specific fixtures closer to their tests.
 */
describe('Client [Test Runner]', function () {
  beforeEach(setupClient.setup)
  afterEach(setupClient.teardown)

  // Collect all the tests:
  const allPublicMethods = getAllPublicMethods(new Client("wss://"))
  const apiTestSuites = loadTestSuitesFromFolder("client")

  runTests(apiTestSuites, "client.")

  // Report any missing tests for api functions.
  const allTestedMethods = new Set(apiTestSuites.map((s) => s.name))
  for (const methodName of allPublicMethods) {
    if (!allTestedMethods.has(methodName)) {
      // TODO: Once migration is complete, remove `.skip()` so that missing tests are reported as failures.
      it.skip(`${methodName} - no test suite found`, () => {
        throw new Error(
          `Test file not found! Create file "test/api/${methodName}/index.ts".`
        )
      })
    }
  }
}) 

function runTests(testSuites: LoadedTestSuite[], descriptionPrefix: string = "") {
  for (const { name: methodName, tests, config } of testSuites) {
    describe(descriptionPrefix.concat(methodName), () => {
      // Run each test that does not use an address.
      for (const [testName, fn] of tests) {
        if (fn.length === 1) {
          it(testName, function () {
            return fn(this.client, addresses.ACCOUNT)
          })
        }
      }
      // Run each test with a classic address.
      describe(`[Classic Address]`, () => {
        for (const [testName, fn] of tests) {
          if (fn.length === 2) {
            it(testName, function () {
              return fn(this.client, addresses.ACCOUNT)
            })
          }
        }
      })
      // Run each test with an X-address.
      if (!config.skipXAddress) {
        describe(`[X-address]`, () => {
          for (const [testName, fn] of tests) {
            if (fn.length === 2) {
              it(testName, function () {
                return fn(this.client, addresses.ACCOUNT_X)
              })
            }
          }
        })
      }
    })
  }
}

