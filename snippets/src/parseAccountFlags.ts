// import {Client} from '../../dist/npm'
// import {AccountFlags} from '../../dist/npm/common/constants'

// const client = new Client('wss://s.altnet.rippletest.net:51233')

// parseAccountFlags()

// async function parseAccountFlags() {
//   await client.connect()
//   const account_info = await client.request({
//     command: 'account_info',
//     account: 'rKsdkGhyZH6b2Zzd5hNnEqSv2wpznn4n6N'
//   })
//   const flags = account_info.result.account_data.Flags
//   for (const flagName in AccountFlags) {
//     if (flags & AccountFlags[flagName]) {
//       console.log(`${flagName} enabled`)
//     }
//   }
//   process.exit(0)
// }
