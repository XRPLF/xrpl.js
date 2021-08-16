import {Client} from '../../dist/npm'

const client = new Client({
  // server: 'wss://s.altnet.rippletest.net:51233'
  // server: 'ws://35.158.96.209:51233'
  server: 'ws://34.210.87.206:51233'
})

sign()

async function sign() {
  await client.connect()
  const pathfind: any = {
    source: {
      address: 'r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59',
      amount: {
        currency: 'drops',
        value: '100'
      }
    },
    destination: {
      address: 'rKT4JX4cCof6LcDYRz8o3rGRu7qxzZ2Zwj',
      amount: {
        currency: 'USD',
        counterparty: 'rVnYNK9yuxBz4uP8zC8LEFokM2nqH3poc'
      }
    }
  }

  await client.getPaths(pathfind).then(async (data) => {
    console.log('paths:', JSON.stringify(data))
    const fakeSecret = 'shsWGZcmZz6YsWWmcnpfr6fLTdtFV'

    pathfind.paths = data[0].paths
    pathfind.destination = data[0].destination
    await client.preparePayment('r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59', pathfind).then(ret => {
      const signed = client.sign(ret.txJSON, fakeSecret)
      console.log('signed:', signed)
    }).catch(err => {
        console.log('ERR 1:', JSON.stringify(err))
    })
  }).catch(err => {
      console.log('ERR 2:', err)
  })

  client.disconnect()
}
