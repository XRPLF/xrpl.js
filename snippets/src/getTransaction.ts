import {Client} from '../../dist/npm'
import Metadata from '../../src/models/common/metadata'

const client = new Client('wss://s.altnet.rippletest.net:51233')

getTransaction()

async function getTransaction() {
  await client.connect()
  const ledger = await client.request({command: 'ledger', ledger_index: 'validated', transactions: true})
  console.log(ledger)
  const transactionHash = ledger.result.ledger.transactions[0]
  const tx = await client.request({command: 'tx', transaction: transactionHash})
  console.log(tx)
  console.log('deliveredAmount:', (tx.result.meta as Metadata).DeliveredAmount)
  process.exit(0)
}
