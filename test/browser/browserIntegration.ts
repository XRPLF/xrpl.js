import assert from 'assert'
import puppeteer from 'puppeteer'

describe("Browser Tests", () => {
    it("Integration Tests", async () => {
        const browser = await puppeteer.launch({"headless": true});
        try {
            const page = await browser.newPage().catch();    
            await page.goto(`file:///${__dirname}/../localIntegrationRunner.html`);    

            await page.waitForFunction('document.querySelector("body").innerText.includes("submit multisigned transaction")');

            const fails = await page.evaluate(() => {
                return document.querySelector('.failures').textContent
            })
            const passes = await page.evaluate(() => {
                return document.querySelector('.passes').textContent
            })

            assert.equal(fails, "failures: 0")
            assert.notEqual(passes, "passes: 0")

        } catch (err) {
            console.log(err)
            assert(false)
        } finally {
            await browser.close();
        }
    }).timeout(40000)
}) 