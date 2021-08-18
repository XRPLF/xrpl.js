import {Client} from '../../dist/npm'

const client = new Client('wss://s.altnet.rippletest.net:51233')

getTransaction()

async function getTransaction() {
  await client.connect()
  const ledger = await client.getLedger({includeTransactions: true})
  console.log(ledger)
  const tx = await client.getTransaction(ledger.transactionHashes[0])
  console.log(tx)
  console.log('deliveredAmount:', tx.outcome.deliveredAmount)
  process.exit(0)
}
