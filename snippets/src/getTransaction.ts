import {RippleAPI} from '../../dist/npm'

const api = new RippleAPI({
  server: 'wss://s.altnet.rippletest.net:51233'
})

getTransaction()

async function getTransaction() {
  await api.connect()
  const ledger = await api.getLedger({includeTransactions: true})
  console.log(ledger)
  const tx = await api.getTransaction(ledger.transactionHashes[0])
  console.log(tx)
  console.log('deliveredAmount:', tx.outcome.deliveredAmount)
  process.exit(0)
}
