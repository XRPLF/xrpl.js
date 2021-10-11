/* eslint-disable no-console -- Logging out errors. */
/* eslint-disable max-depth -- Result object is deeply nested. */
import path from 'path'

import { expect, assert } from 'chai'
import puppeteer from 'puppeteer'

const TIMEOUT = 60000

describe('Browser Tests', function () {
  this.timeout(TIMEOUT)

  it('Integration Tests', async function () {
    const browser = await puppeteer.launch({ headless: true })
    try {
      const page = await browser.newPage().catch()
      page.setDefaultNavigationTimeout(0)

      await page.goto(
        path.join('file:///', __dirname, '../localIntegrationRunner.html'),
      )

      await page.waitForFunction(
        'document.querySelector("body").innerText.includes("submit multisigned transaction")',
        { timeout: TIMEOUT },
      )
      interface TestCaseInfo {
        name: string
        span: string
        error?: string
      }

      const mocha_results = await page.evaluate(() => {
        const results: Array<{ type: string; test: TestCaseInfo[] }> = []
        const items = document.querySelectorAll('.suite')
        items.forEach((item) => {
          const tests = item.querySelectorAll('li')
          const cases: TestCaseInfo[] = []
          tests.forEach((testCase) => {
            cases.push({
              name: testCase.querySelector('h2')?.outerText as string,
              span: testCase.querySelector('.duration')?.textContent as string,
              error: testCase.querySelector('.error')?.textContent as string,
            })
          })
          results.push({
            type: item.querySelector('h1')!.textContent as string,
            test: cases,
          })
        })
        return results
      })

      const fails = await page.evaluate(() => {
        const element = document.querySelector('.failures')

        return element == null ? null : element.textContent
      })
      const passes = await page.evaluate(() => {
        const element = document.querySelector('.passes')

        return element == null ? null : element.textContent
      })

      console.log('Failed Tests:')
      for (const result of mocha_results) {
        for (const testCase of result.test) {
          if (Object.prototype.hasOwnProperty.call(testCase, 'error')) {
            console.log(result.type, JSON.stringify(testCase, null, '\t'))
          }
        }
      }
      expect(fails).to.equal('failures: 0')
      expect(passes).to.not.equal('passes: 0')
    } catch (err) {
      console.log(err)
      assert(false)
    } finally {
      await browser.close()
    }
  }).timeout(40000)
})
