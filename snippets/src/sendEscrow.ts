/* eslint-disable new-cap -- kjifnuwie. */
import {
  AccountObjectsRequest,
  Client,
  EscrowCreate,
  EscrowFinish,
  ISOTimeToRippleTime,
} from '../../dist/npm'

const client = new Client('wss://s.altnet.rippletest.net:51233')

void sendEscrow()

async function sendEscrow(): Promise<void> {
  await client.connect()

  const { wallet: wallet1 } = await client.fundWallet()
  const { wallet: wallet2 } = await client.fundWallet()

  console.log('Balances of wallets before Escrow tx was created:')
  console.log(
    await client.getXrpBalance(wallet1.classicAddress),
    await client.getXrpBalance(wallet2.classicAddress),
  )

  // finish 2 seconds after the escrow is actually created and tx is validated.
  const finishAfter = ISOTimeToRippleTime(Date()) + 2
  console.log(finishAfter, ISOTimeToRippleTime(Date()), Date())

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

  // console.log(finishAfter, ISOTimeToRippleTime(Date()), Date())
  const finishTx: EscrowFinish = {
    TransactionType: 'EscrowFinish',
    Account: wallet1.classicAddress,
    Owner: wallet1.classicAddress,
    OfferSequence: Number(createEscrowResponse.result.Sequence),
  }

  await client.submit(finishTx, {
    wallet: wallet1,
  })

  console.log('Balances of wallets after Escrow was sent')
  console.log(
    await client.getXrpBalance(wallet1.classicAddress),
    await client.getXrpBalance(wallet2.classicAddress),
  )

  await client.disconnect()
}
