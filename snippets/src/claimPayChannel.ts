/* eslint-disable no-await-in-loop -- waiting required. */
/* eslint-disable max-lines-per-function -- Snippet for sending escrow flow. */
/* eslint-disable no-console -- logs are helpful to understand snippets */
import {
  AccountObjectsRequest,
  Client,
  PaymentChannelCreate,
  PaymentChannelClaim,
  hashes,
  LedgerRequest,
  ISOTimeToRippleTime,
} from '../../dist/npm'

const client = new Client('wss://s.altnet.rippletest.net:51233')

async function sleep(ms): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

void claimPayChannel()

async function claimPayChannel(): Promise<void> {
  await client.connect()

  const { wallet: wallet1 } = await client.fundWallet()
  const { wallet: wallet2 } = await client.fundWallet()

  console.log('Balances of wallets before Payment Channel is claimed')
  console.log(await client.getXrpBalance(wallet1.classicAddress))
  console.log(await client.getXrpBalance(wallet2.classicAddress))

  // eslint-disable-next-line new-cap -- function defined as that.
  const finishAfter = ISOTimeToRippleTime(Date()) + 2

  const paymentChannelCreate: PaymentChannelCreate = {
    TransactionType: 'PaymentChannelCreate',
    Account: wallet1.getClassicAddress(),
    Amount: '100',
    Destination: wallet2.getClassicAddress(),
    SettleDelay: 86400,
    PublicKey: wallet1.publicKey,
  }

  const paymentChannelResponse = await client.submit(
    wallet1,
    paymentChannelCreate,
  )

  // check that the object was actually created
  const accountObjectsRequest: AccountObjectsRequest = {
    command: 'account_objects',
    account: wallet1.getClassicAddress(),
  }

  const accountObjects = (await client.request(accountObjectsRequest)).result
    .account_objects

  console.log(accountObjects)

  // wait till we get a ledger with close time > finish time
  const ledgerRequest: LedgerRequest = {
    command: 'ledger',
    ledger_index: 'validated',
  }
  let updatedCloseTime
  do {
    await sleep(1000)
    updatedCloseTime = (await client.request(ledgerRequest)).result.ledger
      .close_time
  } while (updatedCloseTime <= finishAfter)

  const paymentChannelClaim: PaymentChannelClaim = {
    Account: wallet1.getClassicAddress(),
    TransactionType: 'PaymentChannelClaim',
    Channel: hashes.hashPaymentChannel(
      wallet1.getClassicAddress(),
      wallet2.getClassicAddress(),
      paymentChannelResponse.result.tx_json.Sequence ?? 0,
    ),
    Amount: '100',
  }

  const channelClaimResponse = await client.submit(wallet1, paymentChannelClaim)
  console.log(channelClaimResponse)

  console.log('Balances of wallets after Payment Channel is claimed')
  console.log(await client.getXrpBalance(wallet1.classicAddress))
  console.log(await client.getXrpBalance(wallet2.classicAddress))

  void client.disconnect()
}
