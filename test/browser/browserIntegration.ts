import { expect, assert } from 'chai'
import puppeteer from 'puppeteer'

describe('Browser Tests', function () {
  it('Integration Tests', async function () {
    const browser = await puppeteer.launch({ headless: true })
    try {
      const page = await browser.newPage().catch()
      await page.goto(`file:///${__dirname}/../localIntegrationRunner.html`)

      await page.waitForFunction(
        'document.querySelector("body").innerText.includes("submit multisigned transaction")',
      )

      const fails = await page.evaluate(() => {
        const element = document.querySelector('.failures')

        return element == null ? null : element.textContent
      })
      const passes = await page.evaluate(() => {
        const element = document.querySelector('.passes')

        return element == null ? null : element.textContent
      })

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
