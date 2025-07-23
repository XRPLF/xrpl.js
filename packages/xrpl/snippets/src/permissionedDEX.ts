import { AccountSetAsfFlags, Client, OfferCreateFlags } from '../../src'

const client = new Client('wss://s.devnet.rippletest.net:51233')

// This snippet walks us through the usage of permissioned DEX.
async function permDEXExamples(): Promise<void> {
  await client.connect()

  // creating wallets as prerequisite
  const { wallet: wallet1 } = await client.fundWallet(null, {
    usageContext: 'code snippets',
  })
  const { wallet: wallet2 } = await client.fundWallet(null, {
    usageContext: 'code snippets',
  })

  const { wallet: issuerWallet } = await client.fundWallet(null, {
    usageContext: 'code snippets',
  })

  // allow rippling on the issuer wallet -- required for crossing of IOU offers
  await client.submitAndWait(
    {
      TransactionType: 'AccountSet',
      Account: issuerWallet.classicAddress,
      SetFlag: AccountSetAsfFlags.asfDefaultRipple,
    },
    {
      wallet: issuerWallet,
    },
  )

  // create a credential for wallet1, issued by the issuerWallet
  await client.submitAndWait(
    {
      TransactionType: 'CredentialCreate',
      Subject: wallet1.classicAddress,
      Account: issuerWallet.classicAddress,
      CredentialType: 'ABCD',
    },
    {
      wallet: issuerWallet,
    },
  )

  // create a credential for wallet2, issued by the issuerWallet
  await client.submitAndWait(
    {
      TransactionType: 'CredentialCreate',
      Subject: wallet2.classicAddress,
      Account: issuerWallet.classicAddress,
      CredentialType: 'ABCD',
    },
    {
      wallet: issuerWallet,
    },
  )

  // accept the credential for wallet1
  await client.submitAndWait(
    {
      TransactionType: 'CredentialAccept',
      Account: wallet1.classicAddress,
      Issuer: issuerWallet.classicAddress,
      CredentialType: 'ABCD',
    },
    {
      wallet: wallet1,
    },
  )

  // accept the credential for wallet2
  await client.submitAndWait(
    {
      TransactionType: 'CredentialAccept',
      Account: wallet2.classicAddress,
      Issuer: issuerWallet.classicAddress,
      CredentialType: 'ABCD',
    },
    {
      wallet: wallet2,
    },
  )

  // issuerWallet creates a permissioned domain with the credential type 'ABCD'
  await client.submitAndWait(
    {
      TransactionType: 'PermissionedDomainSet',
      Account: issuerWallet.classicAddress,
      AcceptedCredentials: [
        {
          Credential: {
            CredentialType: 'ABCD',
            Issuer: issuerWallet.classicAddress,
          },
        },
      ],
    },
    {
      wallet: issuerWallet,
    },
  )

  const result = await client.request({
    command: 'account_objects',
    account: issuerWallet.classicAddress,
    type: 'permissioned_domain',
  })

  const pd_ledger_object = result.result.account_objects[0]

  // create a payment inside the domain
  await client.submitAndWait(
    {
      TransactionType: 'Payment',
      Account: wallet1.classicAddress,
      Amount: '10000',
      Destination: wallet2.classicAddress,
      DomainID: pd_ledger_object.index,
    },
    {
      wallet: wallet1,
    },
  )

  // establish trust line for USD IOU Token
  await client.submitAndWait(
    {
      TransactionType: 'TrustSet',
      Account: wallet1.classicAddress,
      LimitAmount: {
        currency: 'USD',
        issuer: issuerWallet.classicAddress,
        value: '10000',
      },
    },
    {
      wallet: wallet1,
    },
  )

  await client.submitAndWait(
    {
      TransactionType: 'TrustSet',
      Account: wallet2.classicAddress,
      LimitAmount: {
        currency: 'USD',
        issuer: issuerWallet.classicAddress,
        value: '10000',
      },
    },
    {
      wallet: wallet2,
    },
  )

  // ensure sufficient funds in wallet1 to pay for the offer
  await client.submitAndWait(
    {
      TransactionType: 'Payment',
      Account: issuerWallet.classicAddress,
      Amount: {
        currency: 'USD',
        issuer: issuerWallet.classicAddress,
        value: '1000',
      },
      Destination: wallet1.classicAddress,
    },
    {
      wallet: issuerWallet,
    },
  )

  await client.submitAndWait(
    {
      TransactionType: 'Payment',
      Account: issuerWallet.classicAddress,
      Amount: {
        currency: 'USD',
        issuer: issuerWallet.classicAddress,
        value: '1000',
      },
      Destination: wallet2.classicAddress,
    },
    {
      wallet: issuerWallet,
    },
  )

  // create an offer inside the domain
  await client.submitAndWait(
    {
      TransactionType: 'OfferCreate',
      Account: wallet1.classicAddress,
      TakerGets: '10',
      TakerPays: {
        currency: 'USD',
        issuer: issuerWallet.classicAddress,
        value: '10',
      },
      Flags: OfferCreateFlags.tfHybrid,
      DomainID: pd_ledger_object.index,
    },
    {
      wallet: wallet1,
    },
  )

  const offerTxResponse2 = await client.submitAndWait(
    {
      TransactionType: 'OfferCreate',
      Account: wallet2.classicAddress,
      TakerPays: '10',
      TakerGets: {
        currency: 'USD',
        issuer: issuerWallet.classicAddress,
        value: '10',
      },
      Flags: OfferCreateFlags.tfHybrid,
      DomainID: pd_ledger_object.index,
    },
    {
      wallet: wallet2,
    },
  )
  console.log('offerTxResponse2: ', offerTxResponse2)

  await client.disconnect()
}
void permDEXExamples()
