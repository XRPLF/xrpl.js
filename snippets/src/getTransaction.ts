// import {Client} from '../../dist/npm'
// import {TransactionMetadata} from '../../src/models/common/transaction'

// const client = new Client('wss://s.altnet.rippletest.net:51233')

// getTransaction()

// async function getTransaction() {
//   await client.connect()
//   const ledger = await client.request({command: 'ledger', transactions: true})
//   console.log(ledger)
//   const tx = await client.request({
//     command: 'tx',
//     transaction: ledger.result.ledger.transactions[0] as string
//   })
//   console.log(tx)
//   console.log(
//     'deliveredAmount:',
//     (tx.result.meta as TransactionMetadata).DeliveredAmount
//   )
//   process.exit(0)
// }
