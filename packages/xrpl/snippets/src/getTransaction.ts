import { Client } from '../../src'

const client = new Client('wss://s2.ripple.com:51233')

async function getTransaction(): Promise<void> {
  await client.connect()
  const ledger = await client.request({
    command: 'ledger',
    transactions: true,
    ledger_index: 'validated',
  })
  console.log(ledger)

  const transactions = ledger.result.ledger.transactions
  if (transactions && transactions.length > 0) {
    const tx = await client.request({
      command: 'tx',
      transaction: transactions[0],
    })
    console.log(tx)

    // The meta field can be undefined if the transaction has not been validated yet (and so has not changed the ledger).
    if (tx.result.meta == null) {
      throw new Error('meta not included in the response')
    }

    /*
     * delivered_amount is the amount actually received by the destination account.
     * Use this field to determine how much was delivered, regardless of whether the transaction is a partial payment.
     * https://xrpl.org/transaction-metadata.html#delivered_amount
     */
    if (typeof tx.result.meta !== 'string') {
      console.log('delivered_amount:', tx.result.meta.delivered_amount)
    }
  }

  await client.disconnect()
}

void getTransaction()
