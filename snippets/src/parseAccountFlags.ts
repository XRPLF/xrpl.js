import {RippleAPI} from '../../dist/npm'

const api = new RippleAPI({server: 'wss://s.altnet.rippletest.net:51233'})

parseAccountFlags()

async function parseAccountFlags() {
  await api.connect()
  const account_info = await api.request('account_info', {account: 'rKsdkGhyZH6b2Zzd5hNnEqSv2wpznn4n6N'})
  const flags = api.parseAccountFlags(account_info.account_data.Flags)
  console.log(JSON.stringify(flags, null, 2))
  process.exit(0)
}
