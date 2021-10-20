import {
  AccountObjectsRequest,
  Client,
  EscrowCreate,
  EscrowFinish,
  isoTimeToRippleTime,
} from '../../dist/npm'

const client = new Client('wss://s.altnet.rippletest.net:51233')

void sendEscrow()

// The snippet walks us through creating and finishing escrows.
async function sendEscrow(): Promise<void> {
  await client.connect()

  // creating wallets as prerequisite
  const { wallet: wallet1 } = await client.fundWallet()
  const { wallet: wallet2 } = await client.fundWallet()

  console.log('Balances of wallets before Escrow tx was created:')
  console.log(
    await client.getXrpBalance(wallet1.classicAddress),
    await client.getXrpBalance(wallet2.classicAddress),
  )

  // finish 2 seconds after the escrow is actually created and tx is validated.
  const finishAfter = isoTimeToRippleTime(Date()) + 2

  // creating an Escrow using `EscrowCreate` and submit and wait for tx to be validated.
  const createTx: EscrowCreate = {
    TransactionType: 'EscrowCreate',
    Account: wallet1.address,
    Destination: wallet2.address,
    Amount: '1000000',
    FinishAfter: finishAfter,
  }

  const createEscrowResponse = await client.submitAndWait(createTx, {
    wallet: wallet1,
  })

  console.log(createEscrowResponse)

  // check that the object was actually created
  const accountObjectsRequest: AccountObjectsRequest = {
    command: 'account_objects',
    account: wallet1.classicAddress,
  }

  const accountObjects = (await client.request(accountObjectsRequest)).result
    .account_objects

  console.log("Escrow object exists in `wallet1`'s account")
  console.log(accountObjects)

  // the creator finishes the Escrow using `EscrowFinish` to release the Escrow
  const finishTx: EscrowFinish = {
    TransactionType: 'EscrowFinish',
    Account: wallet1.classicAddress,
    Owner: wallet1.classicAddress,
    OfferSequence: Number(createEscrowResponse.result.Sequence),
  }

  await client.submit(finishTx, {
    wallet: wallet1,
  })

  // we see the balances to verify.
  console.log('Balances of wallets after Escrow was sent')
  console.log(
    await client.getXrpBalance(wallet1.classicAddress),
    await client.getXrpBalance(wallet2.classicAddress),
  )

  await client.disconnect()
}
