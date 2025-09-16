import { MPTokenIssuanceCreate, TxResponse, Wallet } from '../../../src'
import { MPTokenIssuanceCreateMetadata } from '../../../src/models/transactions/MPTokenIssuanceCreate'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'
import { generateFundedWallet, testTransaction } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('Lending Protocol IT', () => {
  let testContext: XrplIntegrationTestContext

  beforeEach(async () => {
    testContext = await setupClient(serverUrl)
  }, TIMEOUT)

  afterEach(() => {
    teardownClient(testContext)
  }, TIMEOUT)

  it(
    'Successful LoanBroker creation and loan payment',
    async () => {
      await createSingleAssetVault(testContext)
    },
    TIMEOUT,
  )
})

async function createSingleAssetVault(
  testContext: XrplIntegrationTestContext,
): Promise<string> {
  const mptIssuerWallet = await generateFundedWallet(testContext.client)
  const mptIssuanceId = await createMPToken(testContext, mptIssuerWallet)

  // const vaultCreateTx: VaultCreate = {}
  return ''
}

async function createMPToken(
  testContext: XrplIntegrationTestContext,
  mptIssuerWallet: Wallet,
): Promise<string> {
  const mptCreateTx: MPTokenIssuanceCreate = {
    TransactionType: 'MPTokenIssuanceCreate',
    AssetScale: 2,
    Flags: {
      tfMPTCanTransfer: true,
    },
    Account: mptIssuerWallet.address,
  }

  const response = await testTransaction(
    testContext.client,
    mptCreateTx,
    mptIssuerWallet,
  )

  const txResponse: TxResponse = await testContext.client.request({
    command: 'tx',
    transaction: response.result.tx_json.hash,
  })

  return (txResponse.result.meta as MPTokenIssuanceCreateMetadata)
    .mpt_issuance_id as string
}
