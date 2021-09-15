import responses from '../fixtures/responses'
import rippled from '../fixtures/rippled'
import rippledAccountLines from '../fixtures/rippled/accountLines'
import { setupClient, teardownClient } from '../setupClient'
import { assertResultMatch, addressTests } from '../testUtils'

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/client/index.ts" for more information about the test runner.
 */
describe('getBalances', function () {
  beforeEach(setupClient)
  afterEach(teardownClient)

  addressTests.forEach(function (testcase) {
    describe(testcase.type, function () {
      it('getBalances', async function () {
        this.mockRippled.addResponse(
          'account_info',
          rippled.account_info.normal,
        )
        this.mockRippled.addResponse(
          'account_lines',
          rippledAccountLines.normal,
        )
        this.mockRippled.addResponse('ledger', rippled.ledger.normal)
        const result = await this.client.getBalances(testcase.address)
        assertResultMatch(result, responses.getBalances, 'getBalances')
      })

      // it('getBalances - limit', async function () {
      //   const options = { limit: 3, ledgerVersion: 123456 }
      //   this.mockRippled.addResponse(
      //     'account_info',
      //     rippled.account_info.normal,
      //   )
      //   this.mockRippled.addResponse(
      //     'account_lines',
      //     rippledAccountLines.normal,
      //   )
      //   this.mockRippled.addResponse('ledger', rippled.ledger.normal)
      //   const expectedResponse = responses.getBalances.slice(0, 3)
      //   const result = await this.client.getBalances(testcase.address, options)
      //   assertResultMatch(result, expectedResponse, 'getBalances')
      // })

      // it('getBalances - limit & currency', async function () {
      //   const options = { currency: 'USD', limit: 3 }
      //   this.mockRippled.addResponse(
      //     'account_info',
      //     rippled.account_info.normal,
      //   )
      //   this.mockRippled.addResponse(
      //     'account_lines',
      //     rippledAccountLines.normal,
      //   )
      //   this.mockRippled.addResponse('ledger', rippled.ledger.normal)
      //   const expectedResponse = responses.getBalances
      //     .filter((item) => item.currency === 'USD')
      //     .slice(0, 3)
      //   const result = await this.client.getBalances(testcase.address, options)
      //   assertResultMatch(result, expectedResponse, 'getBalances')
      // })

      //   it("getBalances - limit & currency", async function () {
      //     const options = { currency: "USD", limit: 3 };
      //     this.mockRippled.addResponse(
      //       "account_info",
      //       rippled.account_info.normal
      //     );
      //     this.mockRippled.addResponse(
      //       "account_lines",
      //       rippledAccountLines.normal
      //     );
      //     this.mockRippled.addResponse("ledger", rippled.ledger.normal);
      //     const expectedResponse = responses.getBalances
      //       .filter((item) => item.currency === "USD")
      //       .slice(0, 3);
      //     const result = await this.client.getBalances(test.address, options);
      //     console.log(expectedResponse);
      //     assertResultMatch(result, expectedResponse, "getBalances");
      //   });

      //   it("getBalances - limit & currency & issuer", async function () {
      //     const options = {
      //       currency: "USD",
      //       issuer: "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B",
      //       limit: 3,
      //     };
      //     this.mockRippled.addResponse(
      //       "account_info",
      //       rippled.account_info.normal
      //     );
      //     this.mockRippled.addResponse(
      //       "account_lines",
      //       rippledAccountLines.normal
      //     );
      //     this.mockRippled.addResponse("ledger", rippled.ledger.normal);

      //     const expectedResponse = responses.getBalances
      //       .filter(
      //         (item) =>
      //           item.currency === "USD" &&
      //           item.issuer === "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"
      //       )
      //       .slice(0, 3);
      //     const result = await this.client.getBalances(test.address, options);
      //     console.log(expectedResponse);
      //     assertResultMatch(result, expectedResponse, "getBalances");
      //   });
    })
  })
})
