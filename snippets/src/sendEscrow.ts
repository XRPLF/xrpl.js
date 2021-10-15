/* eslint-disable no-await-in-loop -- waiting required. */
import {
  AccountInfoRequest,
  AccountObjectsRequest,
  Client,
  EscrowCreate,
  EscrowFinish,
  LedgerRequest,
  ISOTimeToRippleTime,
} from '../../dist/npm'

const client = new Client('wss://s.altnet.rippletest.net:51233')

async function getXRPBalance(account: string): Promise<string> {
  const request: AccountInfoRequest = {
    command: 'account_info',
    account,
  }
  return (await client.request(request)).result.account_data.Balance
}

async function sleep(ms): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

void sendEscrow()

async function sendEscrow(): Promise<void> {
  await client.connect()

  const { wallet: wallet1 } = await client.fundWallet()
  const { wallet: wallet2 } = await client.fundWallet()

  console.log('Balances of wallets before Escrow tx was created')
  console.log(
    await getXRPBalance(wallet1.classicAddress),
    await getXRPBalance(wallet2.classicAddress),
  )

  // eslint-disable-next-line new-cap -- function defined as that.
  const finishAfter = ISOTimeToRippleTime(Date()) + 2

  const createTx: EscrowCreate = {
    TransactionType: 'EscrowCreate',
    Account: wallet1.address,
    Destination: wallet2.address,
    Amount: '1000000',
    FinishAfter: finishAfter,
  }

  const createEscrowResponse = await client.submit(wallet1, createTx)

  console.log(createEscrowResponse)

  // check that the object was actually created
  const accountObjectsRequest: AccountObjectsRequest = {
    command: 'account_objects',
    account: wallet1.getClassicAddress(),
  }

  const accountObjects = (await client.request(accountObjectsRequest)).result
    .account_objects

  console.log(
    "Escrow object was created and we can see the info in wallet1's account",
  )
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

  const finishTx: EscrowFinish = {
    TransactionType: 'EscrowFinish',
    Account: wallet1.getClassicAddress(),
    Owner: wallet1.getClassicAddress(),
    OfferSequence: Number(createEscrowResponse.result.tx_json.Sequence),
  }

  await client.submit(wallet1, finishTx)

  console.log('Account objects after the Escrow Finish tx')
  console.log(
    (await client.request(accountObjectsRequest)).result.account_objects,
  )

  console.log('Balances of wallets after Escrow was sent')
  console.log(
    await getXRPBalance(wallet1.classicAddress),
    await getXRPBalance(wallet2.classicAddress),
  )

  void client.disconnect()
}
