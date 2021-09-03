import fs from 'fs'
import path from 'path'

import { Client } from 'xrpl-local'

/**
 * Client Test Runner.
 *
 * Throws errors when we detect the absence of tests.
 * Puts all the client methods under one "describe" umbrella.
 */
describe('Client [Test Runner]', function () {
  // doesn't need a functional client, just needs to instantiate to get a list of public methods
  // (to determine what methods are missing from )
  const allPublicMethods = getAllPublicMethods(new Client('wss://'))

  const allTestSuites = loadTestSuites()

  // Report any missing tests.
  const allTestedMethods = new Set(allTestSuites.map((s) => s.name))
  for (const methodName of allPublicMethods) {
    if (!allTestedMethods.has(methodName)) {
      // TODO: Once migration is complete, remove `.skip()` so that missing tests are reported as failures.
      it.skip(`${methodName} - no test suite found`, function () {
        throw new Error(
          `Test file not found! Create file "test/client/${methodName}.ts".`,
        )
      })
    }
  }
})

function getAllPublicMethods(client: Client) {
  return Array.from(
    new Set([
      ...Object.getOwnPropertyNames(client),
      ...Object.getOwnPropertyNames(Client.prototype),
    ]),
  ).filter((key) => !key.startsWith('_')) // removes private methods
}

/**
 * When the test suite is loaded, we represent it with the following
 * data structure containing tests and metadata about the suite.
 * If no test suite exists, we return this object with `isMissing: true`
 * so that we can report it.
 */
interface LoadedTestSuite {
  name: string
  tests: Array<[string, () => void | PromiseLike<void>]>
}

function loadTestSuites(): LoadedTestSuite[] {
  const allTests: any[] = fs.readdirSync(path.join(__dirname, 'client'), {
    encoding: 'utf8',
  })
  return allTests
    .map((methodName) => {
      if (methodName.startsWith('.DS_Store')) {
        return null
      }
      if (methodName.endsWith('.ts')) {
        methodName = methodName.slice(0, -3)
      }
      const testSuite = require(`./client/${methodName}`)
      return {
        name: methodName,
        config: testSuite.config || {},
        tests: Object.entries(testSuite.default || {}),
      } as LoadedTestSuite
    })
    .filter(Boolean) as LoadedTestSuite[]
}
