import { Client, IssuedCurrencyAmount, AccountSetAsfFlags } from '../../src'

// Note: This test is inspired from a unit test titled `indirect_paths_path_find` in the
// rippled C++ codebase (Path_test.cpp)
// https://github.com/XRPLF/rippled/blob/d9bd75e68326861fb38fd5b27d47da1054a7fc3b/src/test/app/Path_test.cpp#L683

async function runTest(): Promise<void> {
  // Create a client to connect to the test network
  const client = new Client('wss://s.altnet.rippletest.net:51233')
  await client.connect()

  // Creating wallets to send money from
  // these wallets will have 100 testnet XRP
  const { wallet: alice } = await client.fundWallet()
  const { wallet: bob } = await client.fundWallet()
  const { wallet: carol } = await client.fundWallet()

  // send AccountSet transaction with asfDefaultRipple turned on
  // this enables rippling on all trustlines through these accounts.

  await client.submitAndWait(
    {
      TransactionType: 'AccountSet',
      Account: alice.classicAddress,
      SetFlag: AccountSetAsfFlags.asfDefaultRipple,
    },
    {
      wallet: alice,
    },
  )

  await client.submitAndWait(
    {
      TransactionType: 'AccountSet',
      Account: bob.classicAddress,
      SetFlag: AccountSetAsfFlags.asfDefaultRipple,
    },
    {
      wallet: bob,
    },
  )

  await client.submitAndWait(
    {
      TransactionType: 'AccountSet',
      Account: carol.classicAddress,
      SetFlag: AccountSetAsfFlags.asfDefaultRipple,
    },
    {
      wallet: carol,
    },
  )

  // set up trustlines from bob -> alice, carol -> bob to transfer IssuedCurrency `USD`
  await client.submitAndWait(
    {
      TransactionType: 'TrustSet',
      Account: bob.classicAddress,
      LimitAmount: {
        currency: 'USD',
        issuer: alice.classicAddress,
        value: '1000',
      },
    },
    {
      wallet: bob,
    },
  )

  await client.submitAndWait(
    {
      TransactionType: 'TrustSet',
      Account: carol.classicAddress,
      LimitAmount: {
        currency: 'USD',
        issuer: bob.classicAddress,
        value: '1000',
      },
    },
    {
      wallet: carol,
    },
  )

  // Perform path find
  // Note: Rippling allows IssuedCurrencies with identical currency-codes,
  // but different (ex: alice, bob and carol) issuers to settle their transfers.
  // Docs: https://xrpl.org/docs/concepts/tokens/fungible-tokens/rippling
  const response = await client.request({
    command: 'ripple_path_find',
    source_account: alice.classicAddress,
    source_currencies: [
      {
        currency: 'USD',
        issuer: alice.classicAddress,
      },
    ],
    destination_account: carol.classicAddress,
    destination_amount: {
      currency: 'USD',
      issuer: carol.classicAddress,
      value: '5',
    },
  })

  // Check the results
  const paths = response.result.alternatives
  if (paths.length === 0) {
    throw new Error('No paths found')
  }

  console.log('Paths discovered by ripple_path_find RPC:')
  console.log(JSON.stringify(paths, null, 2))

  // Check if the path includes bob
  // the "paths_computed" field uses a 2-D matrix representation as detailed here:
  // https://xrpl.org/docs/concepts/tokens/fungible-tokens/paths#path-specifications
  const path = paths[0].paths_computed[0][0]
  if (path.account !== bob.classicAddress) {
    throw new Error('Path does not include bob')
  }

  // Check the source amount

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- result currency will be USD
  const sourceAmount = paths[0].source_amount as IssuedCurrencyAmount
  if (
    sourceAmount.currency !== 'USD' ||
    sourceAmount.issuer !== alice.classicAddress ||
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- 5 is an arbitrarily chosen amount for this test
    parseFloat(sourceAmount.value) !== 5.0
  ) {
    throw new Error('Unexpected source amount')
  }

  console.log('Test passed successfully!')

  // Disconnect from the client
  await client.disconnect()
}

runTest().catch(console.error)
