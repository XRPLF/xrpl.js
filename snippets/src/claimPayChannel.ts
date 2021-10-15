import {
  AccountObjectsRequest,
  Client,
  PaymentChannelCreate,
  PaymentChannelClaim,
  hashes,
} from '../../dist/npm'

const client = new Client('wss://s.altnet.rippletest.net:51233')

void claimPayChannel()

async function claimPayChannel(): Promise<void> {
  await client.connect()

  const { wallet: wallet1 } = await client.fundWallet()
  const { wallet: wallet2 } = await client.fundWallet()

  console.log('Balances of wallets before Payment Channel is claimed')
  console.log(await client.getXrpBalance(wallet1.classicAddress))
  console.log(await client.getXrpBalance(wallet2.classicAddress))

  const paymentChannelCreate: PaymentChannelCreate = {
    TransactionType: 'PaymentChannelCreate',
    Account: wallet1.getClassicAddress(),
    Amount: '100',
    Destination: wallet2.getClassicAddress(),
    SettleDelay: 86400,
    PublicKey: wallet1.publicKey,
  }

  const paymentChannelResponse = await client.submitReliable(
    wallet1,
    paymentChannelCreate,
  )
  console.log(paymentChannelResponse)

  // check that the object was actually created
  const accountObjectsRequest: AccountObjectsRequest = {
    command: 'account_objects',
    account: wallet1.getClassicAddress(),
  }

  const accountObjects = (await client.request(accountObjectsRequest)).result
    .account_objects

  console.log(accountObjects)

  const paymentChannelClaim: PaymentChannelClaim = {
    Account: wallet1.getClassicAddress(),
    TransactionType: 'PaymentChannelClaim',
    Channel: hashes.hashPaymentChannel(
      wallet1.getClassicAddress(),
      wallet2.getClassicAddress(),
      paymentChannelResponse.result.Sequence ?? 0,
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
