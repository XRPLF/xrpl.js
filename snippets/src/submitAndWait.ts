import { Client, Payment } from '../../dist/npm'

/*
 *  * References:
 *  * - https://xrpl.org/reliable-transaction-submission.html
 */

const client = new Client('wss://s.altnet.rippletest.net:51233')

void sendReliableTx()

/*
 * The snippet walks us through an example usage of submitting an transaction
 * and waiting until it is successful and goes in a validated ledger.
 * The response we get in return verified that the transaction in fact is validated.
 */
async function sendReliableTx(): Promise<void> {
  await client.connect()

  const { wallet: wallet1 } = await client.fundWallet()
  const { wallet: wallet2 } = await client.fundWallet()

  console.log('Balances of wallets before Payment tx')
  console.log(await client.getXrpBalance(wallet1.classicAddress))
  console.log(await client.getXrpBalance(wallet2.classicAddress))

  const payment: Payment = {
    TransactionType: 'Payment',
    Account: wallet1.classicAddress,
    Amount: '1000',
    Destination: wallet2.classicAddress,
  }

  // Reliable submission of tx, meaning the tx was validated on a ledger and is final.
  const paymentResponse = await client.submitAndWait(payment, {
    wallet: wallet1,
  })
  console.log(paymentResponse)

  console.log('Balances of wallets before Payment tx')
  console.log(await client.getXrpBalance(wallet1.classicAddress))
  console.log(await client.getXrpBalance(wallet2.classicAddress))

  await client.disconnect()
}
