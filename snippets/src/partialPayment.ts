import { Client, Payment, PaymentFlags, TrustSet } from '../../dist/npm'

const client = new Client('wss://s.altnet.rippletest.net:51233')

async function displayBalance(account: string): Promise<void> {
  console.log(await client.getBalances(account, { ledger_index: 'current' }))
}

async function main(): Promise<void> {
  await client.connect()
  const { wallet: wallet1 } = await client.fundWallet()
  const { wallet: wallet2 } = await client.fundWallet()

  const currency_code = 'FOO'
  const trust_set_tx: TrustSet = {
    TransactionType: 'TrustSet',
    Account: wallet2.getClassicAddress(),
    LimitAmount: {
      currency: currency_code,
      issuer: wallet1.getClassicAddress(),
      // Value for the new IOU - 10000000000 - is arbitarily chosen.
      value: '10000000000',
    },
  }

  await client.submit(wallet2, trust_set_tx)

  console.log('Balances after trustline is created')
  await displayBalance(wallet1.classicAddress)
  await displayBalance(wallet2.classicAddress)

  // Issuer(wallet1) sending to wallet2
  const issue_quantity = '3840'
  const payment: Payment = {
    TransactionType: 'Payment',
    Account: wallet1.getClassicAddress(),
    Amount: {
      currency: currency_code,
      value: issue_quantity,
      issuer: wallet1.getClassicAddress(),
    },
    Destination: wallet2.getClassicAddress(),
  }

  // submit payment
  const initialPayment = await client.submit(wallet1, payment)
  console.log(initialPayment)

  console.log('Balances after issuer(wallet1) sends IOU("FOO") to wallet2')
  await displayBalance(wallet1.classicAddress)
  await displayBalance(wallet2.classicAddress)

  /*
   * Send money less than the amount specified on 2 conditions:
   * 1. Sender has less money than the aamount specified in the payment Tx.
   * 2. Sender has the tfPartialPayment flag activated.
   *
   * Other ways to specify flags are by using Hex code and decimal code.
   * eg. For partial payment(tfPartialPayment)
   * decimal ->131072, hex -> 0x00020000
   */
  const partialPayment: Payment = {
    TransactionType: 'Payment',
    Account: wallet2.getClassicAddress(),
    Amount: {
      currency: currency_code,
      value: '4000',
      issuer: wallet1.getClassicAddress(),
    },
    Destination: wallet1.getClassicAddress(),
    Flags: PaymentFlags.tfPartialPayment,
  }

  // submit payment
  const submitResponse = await client.submit(wallet2, partialPayment)
  console.log(submitResponse)

  console.log(
    "Balances after Partial Payment, when wallet2 tried to send 4000 FOO's",
  )
  await displayBalance(wallet1.classicAddress)
  await displayBalance(wallet2.classicAddress)

  await client.disconnect()
}
void main()
