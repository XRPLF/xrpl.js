import { Client, Payment } from '../../src'

// Prerequisites for this snippet. Please verify these conditions after a reset of the
// test network:
// - destination_account must have a trust line with the destination_amount.issuer
// - There must be appropriate DEX Offers or XRP/TST AMM for the cross-currency exchange

// PathFind RPC requires the use of a Websocket client only
const client = new Client('wss://s.altnet.rippletest.net:51233')

async function createTxWithPaths(): Promise<void> {
  await client.connect()

  const { wallet } = await client.fundWallet(null, {
    usageContext: 'code snippets',
  })
  const destination_account = 'rJPeZVPty1bXXbDR9oKscg2irqABr7sP3t'
  const destination_amount = {
    value: '0.001',
    currency: 'TST',
    issuer: 'rP9jPyP5kyvFRb6ZiRghAGw5u8SGAmU4bd',
  }

  const resp = await client.request({
    command: 'path_find',
    subcommand: 'create',
    source_account: wallet.classicAddress,
    destination_account,
    destination_amount,
  })
  console.log(resp)

  const paths = resp.result.alternatives[0].paths_computed
  console.log(paths)

  const tx: Payment = {
    TransactionType: 'Payment',
    Account: wallet.classicAddress,
    Amount: destination_amount,
    Destination: destination_account,
    Paths: paths,
  }

  await client.autofill(tx)
  const signed = wallet.sign(tx)
  console.log('signed:', signed)

  await client.disconnect()
}

void createTxWithPaths()
