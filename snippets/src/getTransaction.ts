import {
  Client,
  LedgerResponse,
  TxResponse,
  TransactionMetadata,
} from '../../dist/npm'

const client = new Client('wss://s.altnet.rippletest.net:51233')

void getTransaction()

async function getTransaction(): Promise<void> {
  await client.connect()
  const ledger: LedgerResponse = await client.request({
    command: 'ledger',
    transactions: true,
    ledger_index: 'validated',
  })
  console.log(ledger)

  const transactions = ledger.result.ledger.transactions
  if (transactions) {
    const tx: TxResponse = await client.request({
      command: 'tx',
      transaction: transactions[0],
    })
    console.log(tx)

    /*
     * delivered_amount is the amount actually received by the destination account.
     * Use this field to determine how much was delivered, regardless of whether the transaction is a partial payment.
     * https://xrpl.org/transaction-metadata.html#delivered_amount
     */
    console.log(
      'delivered_amount:',
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- assertion needed
      (tx.result.meta as TransactionMetadata).delivered_amount,
    )
  }

  await client.disconnect()
}
