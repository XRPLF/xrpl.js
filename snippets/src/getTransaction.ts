import {Client} from '../../dist/npm'

const client = new Client('wss://s.altnet.rippletest.net:51233')

getTransaction()

async function getTransaction() {
  await client.connect()
  const ledger = await client.request({command: 'ledger', transactions: true})
  console.log(ledger)
  const tx = await client.getTransaction(ledger.result.ledger.transactions[0] as string)
  console.log(tx)
  console.log('deliveredAmount:', tx.outcome.deliveredAmount)
  process.exit(0)
}
