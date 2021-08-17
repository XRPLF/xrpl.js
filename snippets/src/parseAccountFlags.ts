import {Client} from '../../dist/npm'

const client = new Client({server: 'wss://s.altnet.rippletest.net:51233'})

parseAccountFlags()

async function parseAccountFlags() {
  await client.connect()
  const account_info = await client.request('account_info', {account: 'rKsdkGhyZH6b2Zzd5hNnEqSv2wpznn4n6N'})
  const flags = client.parseAccountFlags(account_info.account_data.Flags)
  console.log(JSON.stringify(flags, null, 2))
  process.exit(0)
}
