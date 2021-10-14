/* eslint-disable no-console -- logs are helpful to understand snippets */
import { AccountInfoRequest, Client, Payment } from '../../dist/npm'

/*
 *  * References:
 *  * - https://xrpl.org/reliable-transaction-submission.html
 */

const client = new Client('wss://s.altnet.rippletest.net:51233')

async function getXRPBalance(account: string): Promise<string> {
  const request: AccountInfoRequest = {
    command: 'account_info',
    account,
  }
  return (await client.request(request)).result.account_data.Balance
}

void sendReliableTx()

async function sendReliableTx(): Promise<void> {
  await client.connect()

  const { wallet: wallet1 } = await client.fundWallet()
  const { wallet: wallet2 } = await client.fundWallet()

  console.log('Balances of wallets before Payment tx')
  console.log(
    await getXRPBalance(wallet1.classicAddress),
    await getXRPBalance(wallet2.classicAddress),
  )

  const payment: Payment = {
    TransactionType: 'Payment',
    Account: wallet1.getClassicAddress(),
    Amount: '1000',
    Destination: wallet2.getClassicAddress(),
  }

  // Reliable submission of tx, meaning the tx was validated on a ledger and is final.
  const paymentResponse = await client.submitReliable(wallet1, payment)
  console.log(paymentResponse)

  console.log('Balances of wallets before Payment tx')
  console.log(
    await getXRPBalance(wallet1.classicAddress),
    await getXRPBalance(wallet2.classicAddress),
  )

  void client.disconnect()
}
