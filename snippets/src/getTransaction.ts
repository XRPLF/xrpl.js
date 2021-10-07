/* eslint-disable no-console -- logs are helpful to understand snippets */
import { Client, LedgerResponse, TxResponse } from '../../dist/npm'
import TransactionMetadata from '../../dist/npm/models/transactions/metadata'

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

    console.log(
      'deliveredAmount:',
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- assertion needed
      (tx.result.meta as TransactionMetadata).DeliveredAmount,
    )
  }

  void client.disconnect()
}
