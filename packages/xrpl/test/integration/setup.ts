import { AccountSet, Client, Payment, TrustSet, Wallet } from 'xrpl-local'

import serverUrl from './serverUrl'
import { fundAccount, ledgerAccept } from './utils'

export async function teardownClient(this: Mocha.Context): Promise<void> {
  this.client.removeAllListeners()
  this.client.disconnect()
}

// eslint-disable-next-line max-params -- need comments
async function initIC(
  client: Client,
  wallet: Wallet,
  destination: Wallet,
  gateway: Wallet,
): Promise<void> {
  const atx: AccountSet = {
    TransactionType: 'AccountSet',
    Account: gateway.classicAddress,
    SetFlag: 8,
  }
  const atxr = await client.submit(atx, {
    wallet: gateway,
  })
  if (atxr.result.engine_result !== 'tesSUCCESS') {
    // eslint-disable-next-line no-console -- happens only when something goes wrong
    console.log(atxr)
  }
  await ledgerAccept(client)

  const wtl: TrustSet = {
    TransactionType: 'TrustSet',
    Account: wallet.classicAddress,
    LimitAmount: {
      currency: 'USD',
      issuer: gateway.classicAddress,
      value: '100000',
    },
  }

  const wtlr = await client.submit(wtl, {
    wallet,
  })
  if (wtlr.result.engine_result !== 'tesSUCCESS') {
    // eslint-disable-next-line no-console -- happens only when something goes wrong
    console.log(wtlr)
  }
  await ledgerAccept(client)

  const dtl: TrustSet = {
    TransactionType: 'TrustSet',
    Account: destination.classicAddress,
    LimitAmount: {
      currency: 'USD',
      issuer: gateway.classicAddress,
      value: '100000',
    },
  }

  const dtlr = await client.submit(dtl, {
    wallet: destination,
  })
  if (wtlr.result.engine_result !== 'tesSUCCESS') {
    // eslint-disable-next-line no-console -- happens only when something goes wrong
    console.log(dtlr)
  }
  await ledgerAccept(client)

  const wp: Payment = {
    TransactionType: 'Payment',
    Account: gateway.classicAddress,
    Destination: wallet.classicAddress,
    Amount: {
      currency: 'USD',
      issuer: gateway.classicAddress,
      value: '10000',
    },
  }

  const wpr = await client.submit(wp, {
    wallet: gateway,
  })
  if (wpr.result.engine_result !== 'tesSUCCESS') {
    // eslint-disable-next-line no-console -- happens only when something goes wrong
    console.log(wpr)
  }
  await ledgerAccept(client)

  const dp: Payment = {
    TransactionType: 'Payment',
    Account: gateway.classicAddress,
    Destination: destination.classicAddress,
    Amount: {
      currency: 'USD',
      issuer: gateway.classicAddress,
      value: '10000',
    },
  }

  const dpr = await client.submit(dp, {
    wallet: gateway,
  })
  if (dpr.result.engine_result !== 'tesSUCCESS') {
    // eslint-disable-next-line no-console -- happens only when something goes wrong
    console.log(dpr)
  }
  await ledgerAccept(client)
}

export async function setupClient(
  this: Mocha.Context,
  server = serverUrl,
  ic?: boolean | false,
): Promise<void> {
  this.wallet = Wallet.generate()
  this.destination = Wallet.generate()
  this.gateway = Wallet.generate()
  return new Promise<void>((resolve, reject) => {
    this.client = new Client(server)
    this.client
      .connect()
      .then(async () => {
        await fundAccount(this.client, this.wallet)
        await fundAccount(this.client, this.destination)
        await fundAccount(this.client, this.gateway)
        if (ic) {
          await initIC(this.client, this.wallet, this.destination, this.gateway)
        }
        resolve()
      })
      .catch(reject)
  })
}
