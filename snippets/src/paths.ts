/* eslint-disable no-console -- logs are helpful to understand snippets */
import { Client, RipplePathFindResponse } from '../../dist/npm'

const client = new Client('wss://s.altnet.rippletest.net:51233')

void sign()

async function sign(): Promise<void> {
  await client.connect()
  const resp: RipplePathFindResponse = await client.request({
    command: 'ripple_path_find',
    source_account: 'r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59',
    source_currencies: [
      {
        currency: 'XRP',
      },
    ],
    destination_account: 'rKT4JX4cCof6LcDYRz8o3rGRu7qxzZ2Zwj',
    destination_amount: {
      value: '0.001',
      currency: 'USD',
      issuer: 'rVnYNK9yuxBz4uP8zC8LEFokM2nqH3poc',
    },
  })
  console.log(resp)

  const paths = resp.result.alternatives[0].paths_computed
  console.log(paths)

  void client.disconnect()
}
