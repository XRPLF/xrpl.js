import { p256 } from '@noble/curves/nist.js'
import { sha512 } from '@xrplf/isomorphic/sha512'
import { bytesToHex, hexToBytes, randomBytes } from '@xrplf/isomorphic/utils'
import {
  decryptAmount,
  getClawbackProof,
  getConvertProof,
} from '@xrplf/mpt-crypto'
import { assert } from 'chai'
import { decodeAccountID } from 'ripple-address-codec'

import * as xrpl from '../../../src'
import {
  AMMDepositFlags,
  AccountSetAsfFlags,
  Client,
  ECDSA,
  MPTokenIssuanceCreateFlags,
  SubmittableTransaction,
  TransactionMetadata,
  TxResponse,
  Wallet,
  decode,
  deriveConfidentialKeypair,
  encode,
  encodeForSigning,
  xrpToDrops,
} from '../../../src'
import { ALPHANET } from '../serverUrl'

const SERVER = 'wss://alphanet.ws.xrplf.org'
const FAUCET = {
  faucetHost: 'alphanet.faucet.xrplf.org',
  faucetPath: '/accounts',
}
const SETUP_TIMEOUT = 180000
const STEP_TIMEOUT = 60000
// Every Ballot transaction costs ten base fees (kConfidentialFeeMultiplier)
const BALLOT_FEE = '100'

// Runs only against the live network, so `npm run test:integration` skips it
const describeAlphanet = ALPHANET ? describe : describe.skip

function sha512Half(hex: string): string {
  return bytesToHex(sha512(hexToBytes(hex)).slice(0, 32))
}

function accountHex(address: string): string {
  return bytesToHex(decodeAccountID(address))
}

function uint32Hex(value: number): string {
  return value.toString(16).padStart(8, '0').toUpperCase()
}

function createdIndex(response: TxResponse, type: string): string {
  const meta = response.result.meta as TransactionMetadata
  for (const node of meta.AffectedNodes) {
    if ('CreatedNode' in node && node.CreatedNode.LedgerEntryType === type) {
      return node.CreatedNode.LedgerIndex
    }
  }
  throw new Error(`The transaction created no ${type}`)
}

function assertValidatedSuccess(response: TxResponse): void {
  const meta = response.result.meta as TransactionMetadata
  assert.equal(meta.TransactionResult, 'tesSUCCESS')
  assert.isTrue(response.result.validated)
}

const client = new Client(SERVER, { timeout: STEP_TIMEOUT })

async function funded(): Promise<Wallet> {
  const { wallet } = await client.fundWallet(null, FAUCET)
  return wallet
}

async function submit(
  tx: Record<string, unknown>,
  wallet: Wallet,
  autofill = true,
): Promise<TxResponse> {
  const response = await client.submitAndWait(
    tx as unknown as SubmittableTransaction,
    { wallet, autofill },
  )
  assertValidatedSuccess(response)
  return response
}

async function submitBlob(txBlob: string): Promise<TxResponse> {
  const response = await client.submitAndWait(txBlob)
  assertValidatedSuccess(response)
  return response
}

async function validatedCloseTime(): Promise<number> {
  const response = await client.request({
    command: 'ledger',
    ledger_index: 'validated',
  })
  return response.result.ledger.close_time
}

async function waitForCloseTime(target: number): Promise<void> {
  if ((await validatedCloseTime()) >= target) {
    return
  }
  await new Promise((resolve) => {
    setTimeout(resolve, 1000)
  })
  await waitForCloseTime(target)
}

// An MPT issuance with `holder` authorized and holding 100 units
async function issueMPT(
  issuer: Wallet,
  holder: Wallet,
  flags = 0,
): Promise<string> {
  const created = await submit(
    {
      TransactionType: 'MPTokenIssuanceCreate',
      Account: issuer.classicAddress,
      Flags: flags,
    },
    issuer,
  )
  const { mpt_issuance_id: mptIssuanceID } = created.result.meta as {
    mpt_issuance_id: string
  }
  await submit(
    {
      TransactionType: 'MPTokenAuthorize',
      Account: holder.classicAddress,
      MPTokenIssuanceID: mptIssuanceID,
    },
    holder,
  )
  await submit(
    {
      TransactionType: 'Payment',
      Account: issuer.classicAddress,
      Destination: holder.classicAddress,
      Amount: { mpt_issuance_id: mptIssuanceID, value: '100' },
    },
    issuer,
  )
  return mptIssuanceID
}

// A trust line from `holder` to `issuer` for USD, funded with `value`
async function issueUSD(
  issuer: Wallet,
  holder: Wallet,
  value: string,
): Promise<void> {
  await submit(
    {
      TransactionType: 'TrustSet',
      Account: holder.classicAddress,
      LimitAmount: {
        currency: 'USD',
        issuer: issuer.classicAddress,
        value: '100000',
      },
    },
    holder,
  )
  await submit(
    {
      TransactionType: 'Payment',
      Account: issuer.classicAddress,
      Destination: holder.classicAddress,
      Amount: { currency: 'USD', issuer: issuer.classicAddress, value },
    },
    issuer,
  )
}

describeAlphanet('alphanet generation 1 smoke test', function () {
  let owner: Wallet
  let heir: Wallet
  const p256Secret = p256.utils.randomSecretKey()
  const p256PublicKey = `F6${bytesToHex(
    p256.getPublicKey(p256Secret, false).slice(1),
  )}`

  beforeAll(async function () {
    await client.connect()
    owner = await funded()
    heir = await funded()
  }, SETUP_TIMEOUT)

  afterAll(async function () {
    await client.disconnect()
  })

  it(
    'BeneficiarySet',
    async function () {
      await submit(
        {
          TransactionType: 'BeneficiarySet',
          Account: owner.classicAddress,
          Beneficiary: heir.classicAddress,
          TimeLock: 86400,
        },
        owner,
      )
    },
    STEP_TIMEOUT,
  )

  it(
    'PasskeyListSet',
    async function () {
      await submit(
        {
          TransactionType: 'PasskeyListSet',
          Account: owner.classicAddress,
          Passkeys: [
            {
              Passkey: {
                PasskeyID: bytesToHex(randomBytes(16)),
                PublicKey: p256PublicKey,
              },
            },
          ],
        },
        owner,
      )
    },
    STEP_TIMEOUT,
  )

  it(
    'VaultCreate with the accrual fields',
    async function () {
      const vaultOwner = await funded()
      // AccountingMethod 2 (accrual) is temMALFORMED while the network's
      // default vault version is FixedPrecision; 1 is cash basis
      await submit(
        {
          TransactionType: 'VaultCreate',
          Account: vaultOwner.classicAddress,
          Asset: { currency: 'XRP' },
          DepositFee: 100,
          RedemptionFee: 250,
          RedemptionPeriod: 86400,
          AccountingMethod: 1,
        },
        vaultOwner,
      )
    },
    STEP_TIMEOUT,
  )

  it(
    'MPTokenIssuanceCreate with MPTokenSchema',
    async function () {
      const issuer = await funded()
      // Schema str, u16, u32, u64 and metadata that decodes exactly against it
      await submit(
        {
          TransactionType: 'MPTokenIssuanceCreate',
          Account: issuer.classicAddress,
          MPTokenSchema: '0E030405',
          MPTokenMetadata: '09393132383238594B3001A9713FB30000000000000F4240',
        },
        issuer,
      )
    },
    STEP_TIMEOUT,
  )

  it(
    'TokenIssuanceCreate',
    async function () {
      const issuer = await funded()
      await submit(
        {
          TransactionType: 'TokenIssuanceCreate',
          Account: issuer.classicAddress,
          Currency: 'USD',
        },
        issuer,
      )
    },
    STEP_TIMEOUT,
  )

  it(
    'OfferCreate with MinQuantity',
    async function () {
      const issuer = await funded()
      const maker = await funded()
      await submit(
        {
          TransactionType: 'OfferCreate',
          Account: maker.classicAddress,
          TakerGets: xrpToDrops(10),
          TakerPays: {
            currency: 'USD',
            issuer: issuer.classicAddress,
            value: '10',
          },
          MinQuantity: xrpToDrops(5),
        },
        maker,
      )
    },
    STEP_TIMEOUT,
  )

  describe('Repo', function () {
    let seller: Wallet
    let lender: Wallet
    let repoID: string

    beforeAll(async function () {
      seller = await funded()
      lender = await funded()
    }, SETUP_TIMEOUT)

    it(
      'RepoCreate',
      async function () {
        const now = await validatedCloseTime()
        const created = await submit(
          {
            TransactionType: 'RepoCreate',
            Account: seller.classicAddress,
            Counterparty: lender.classicAddress,
            CollateralAmount: xrpToDrops(10),
            PurchasePrice: {
              currency: 'USD',
              issuer: lender.classicAddress,
              value: '9',
            },
            InterestRate: 0,
            Expiration: now + 3600,
            MaturityDate: now + 7200,
            GracePeriod: 600,
          },
          seller,
        )
        repoID = createdIndex(created, 'Repo')
      },
      STEP_TIMEOUT,
    )

    it(
      'RepoCancel',
      async function () {
        await submit(
          {
            TransactionType: 'RepoCancel',
            Account: seller.classicAddress,
            RepoID: repoID,
          },
          seller,
        )
      },
      STEP_TIMEOUT,
    )
  })

  describe('Firewall', function () {
    let firewallOwner: Wallet
    let guardian: Wallet
    let backup: Wallet
    let firewallID: string

    beforeAll(async function () {
      firewallOwner = await funded()
      guardian = await funded()
      backup = await funded()
    }, SETUP_TIMEOUT)

    it(
      'FirewallSet',
      async function () {
        const created = await submit(
          {
            TransactionType: 'FirewallSet',
            Account: firewallOwner.classicAddress,
            Counterparty: guardian.classicAddress,
            Backup: backup.classicAddress,
          },
          firewallOwner,
        )
        firewallID = createdIndex(created, 'Firewall')
      },
      STEP_TIMEOUT,
    )

    it(
      'FirewallDelete signed by the counterparty',
      async function () {
        // The xrplf/firewall branch's counterparty signer, in the composed tree
        const signByCounterparty = Reflect.get(xrpl, 'signByCounterparty') as (
          wallet: Wallet,
          tx: unknown,
        ) => { tx_blob: string }
        // Autofill before CounterpartySignature exists, so the fee counts it
        const prepared = await client.autofill({
          TransactionType: 'FirewallDelete',
          Account: firewallOwner.classicAddress,
          FirewallID: firewallID,
        } as unknown as SubmittableTransaction)
        // The model requires CounterpartySignature; it is not a signing field
        const ownerSigned = decode(
          firewallOwner.sign({
            ...prepared,
            CounterpartySignature: {},
          } as unknown as SubmittableTransaction).tx_blob,
        )
        delete ownerSigned.CounterpartySignature
        const { tx_blob } = signByCounterparty(guardian, ownerSigned)
        await submitBlob(tx_blob)
      },
      STEP_TIMEOUT,
    )
  })

  describe('Ballot', function () {
    let issuer: Wallet
    let voter: Wallet
    let mptIssuanceID: string
    let ballotID: string
    let closeTime: number
    const tally = deriveConfidentialKeypair()

    beforeAll(async function () {
      issuer = await funded()
      voter = await funded()
      mptIssuanceID = await issueMPT(issuer, voter)
    }, SETUP_TIMEOUT)

    it(
      'BallotCreate',
      async function () {
        const now = await validatedCloseTime()
        closeTime = now + 20
        const prepared = (await client.autofill({
          TransactionType: 'BallotCreate',
          Account: issuer.classicAddress,
          MPTokenIssuanceID: mptIssuanceID,
          Digest: sha512Half(bytesToHex(new TextEncoder().encode('smoke'))),
          OptionCount: 2,
          TallyPublicKey: tally.publicKey,
          OpenTime: now,
          CloseTime: closeTime,
          ZKProof: '00'.repeat(64),
          Fee: BALLOT_FEE,
        } as unknown as SubmittableTransaction)) as unknown as Record<
          string,
          unknown
        >
        // The Ballot's ID is in its keylet namespace 'X'
        ballotID = sha512Half(
          `0058${accountHex(issuer.classicAddress)}${uint32Hex(
            prepared.Sequence as number,
          )}`,
        )
        prepared.ZKProof = await getConvertProof(
          tally.publicKey,
          tally.privateKey,
          ballotID,
        )
        await submit(prepared, issuer, false)
      },
      STEP_TIMEOUT,
    )

    it.todo(
      'BallotCastVote: needs bulletproof_prove_agg and compact_standard_prove, which @xrplf/mpt-crypto does not export',
    )

    it(
      'BallotFinalize',
      async function () {
        await waitForCloseTime(closeTime)
        const entry = await client.request({
          command: 'ledger_entry',
          index: ballotID,
          ledger_index: 'validated',
        })
        const options = (
          entry.result.node as unknown as {
            EncryptedTally: Array<{ BallotOption: { EncryptedVote: string } }>
          }
        ).EncryptedTally
        const prepared = (await client.autofill({
          TransactionType: 'BallotFinalize',
          Account: issuer.classicAddress,
          BallotID: ballotID,
          Results: [],
          ZKProof: '',
          Fee: BALLOT_FEE,
        } as unknown as SubmittableTransaction)) as unknown as Record<
          string,
          unknown
        >
        const context = sha512Half(
          `4246${accountHex(issuer.classicAddress)}${ballotID}${uint32Hex(
            prepared.Sequence as number,
          )}`,
        )
        const amounts = await Promise.all(
          options.map(async ({ BallotOption }) =>
            decryptAmount(BallotOption.EncryptedVote, tally.privateKey, 1000n),
          ),
        )
        const proofs = await Promise.all(
          options.map(async ({ BallotOption }, index) =>
            getClawbackProof(
              tally.privateKey,
              tally.publicKey,
              context,
              amounts[index],
              BallotOption.EncryptedVote,
            ),
          ),
        )
        prepared.Results = amounts.map((amount) => ({
          BallotResult: { BallotWeight: amount.toString(16) },
        }))
        prepared.ZKProof = proofs.join('')
        await submit(prepared, issuer, false)
      },
      STEP_TIMEOUT,
    )
  })

  describe('Coupon', function () {
    let issuer: Wallet
    let mptIssuanceID: string

    beforeAll(async function () {
      issuer = await funded()
      const holder = await funded()
      mptIssuanceID = await issueMPT(
        issuer,
        holder,
        MPTokenIssuanceCreateFlags.tfMPTCanTransfer,
      )
    }, SETUP_TIMEOUT)

    it(
      'CouponScheduleCreate',
      async function () {
        await submit(
          {
            TransactionType: 'CouponScheduleCreate',
            Account: issuer.classicAddress,
            MPTokenIssuanceID: mptIssuanceID,
            CouponAsset: { currency: 'XRP' },
          },
          issuer,
        )
      },
      STEP_TIMEOUT,
    )

    it(
      'CouponPay',
      async function () {
        await submit(
          {
            TransactionType: 'CouponPay',
            Account: issuer.classicAddress,
            MPTokenIssuanceID: mptIssuanceID,
            Amount: '1000',
          },
          issuer,
        )
      },
      STEP_TIMEOUT,
    )
  })

  describe('token payment channel', function () {
    let issuer: Wallet
    let channelOwner: Wallet
    let channelID: string

    beforeAll(async function () {
      issuer = await funded()
      channelOwner = await funded()
      // Both flags go on before the issuer owns any trust line
      await submit(
        {
          TransactionType: 'AccountSet',
          Account: issuer.classicAddress,
          SetFlag: AccountSetAsfFlags.asfAllowTrustLineClawback,
        },
        issuer,
      )
      await submit(
        {
          TransactionType: 'AccountSet',
          Account: issuer.classicAddress,
          SetFlag: AccountSetAsfFlags.asfAllowTrustLineLocking,
        },
        issuer,
      )
      await issueUSD(issuer, channelOwner, '5000')
    }, SETUP_TIMEOUT)

    it(
      'PaymentChannelCreate in an IOU',
      async function () {
        const created = await submit(
          {
            TransactionType: 'PaymentChannelCreate',
            Account: channelOwner.classicAddress,
            Destination: heir.classicAddress,
            Amount: {
              currency: 'USD',
              issuer: issuer.classicAddress,
              value: '1000',
            },
            SettleDelay: 100,
            PublicKey: channelOwner.publicKey,
          },
          channelOwner,
        )
        channelID = createdIndex(created, 'PayChannel')
      },
      STEP_TIMEOUT,
    )

    it(
      'PaymentChannelClawback',
      async function () {
        await submit(
          {
            TransactionType: 'PaymentChannelClawback',
            Account: issuer.classicAddress,
            Channel: channelID,
          },
          issuer,
        )
      },
      STEP_TIMEOUT,
    )
  })

  describe('Subscription', function () {
    let payer: Wallet
    let subscriptionID: string

    beforeAll(async function () {
      payer = await funded()
    }, SETUP_TIMEOUT)

    it(
      'SubscriptionSet',
      async function () {
        const created = await submit(
          {
            TransactionType: 'SubscriptionSet',
            Account: payer.classicAddress,
            Destination: heir.classicAddress,
            Amount: xrpToDrops(1),
            Frequency: 86400,
          },
          payer,
        )
        subscriptionID = createdIndex(created, 'Subscription')
      },
      STEP_TIMEOUT,
    )

    it(
      'SubscriptionCancel',
      async function () {
        await submit(
          {
            TransactionType: 'SubscriptionCancel',
            Account: payer.classicAddress,
            SubscriptionID: subscriptionID,
          },
          payer,
        )
      },
      STEP_TIMEOUT,
    )
  })

  describe('AMM curve', function () {
    let issuer: Wallet
    let provider: Wallet
    let positionID: string
    const asset = { currency: 'XRP' }
    let usd: { currency: string; issuer: string }
    // Concentrated liquidity: the curve AMMCollectFees serves
    const CONCENTRATED_LIQUIDITY = 1

    beforeAll(async function () {
      issuer = await funded()
      provider = await funded()
      usd = { currency: 'USD', issuer: issuer.classicAddress }
      await submit(
        {
          TransactionType: 'AccountSet',
          Account: issuer.classicAddress,
          SetFlag: AccountSetAsfFlags.asfDefaultRipple,
        },
        issuer,
      )
      await issueUSD(issuer, provider, '1000')
    }, SETUP_TIMEOUT)

    it(
      'AMMCreate with a curve',
      async function () {
        await submit(
          {
            TransactionType: 'AMMCreate',
            Account: provider.classicAddress,
            Amount: xrpToDrops(1),
            Amount2: { ...usd, value: '1' },
            TradingFee: 0,
            CurveType: CONCENTRATED_LIQUIDITY,
            FeeTier: 2,
          },
          provider,
        )
      },
      STEP_TIMEOUT,
    )

    it(
      'AMMDeposit into a tick range',
      async function () {
        const deposited = await submit(
          {
            TransactionType: 'AMMDeposit',
            Account: provider.classicAddress,
            Asset: asset,
            Asset2: usd,
            CurveType: CONCENTRATED_LIQUIDITY,
            Flags: AMMDepositFlags.tfTwoAsset,
            TickLower: -60,
            TickUpper: 60,
            Amount: '1000',
            Amount2: { ...usd, value: '10' },
          },
          provider,
        )
        positionID = createdIndex(deposited, 'AMMPosition')
      },
      STEP_TIMEOUT,
    )

    it(
      'AMMCollectFees',
      async function () {
        await submit(
          {
            TransactionType: 'AMMCollectFees',
            Account: provider.classicAddress,
            Asset: asset,
            Asset2: usd,
            CurveType: CONCENTRATED_LIQUIDITY,
            PositionID: positionID,
          },
          provider,
        )
      },
      STEP_TIMEOUT,
    )
  })

  it(
    'Payment signed with a Dilithium key',
    async function () {
      const dilithium = Wallet.generate('dilithium' as ECDSA)
      await client.fundWallet(dilithium, FAUCET)
      await submit(
        {
          TransactionType: 'Payment',
          Account: dilithium.classicAddress,
          Destination: heir.classicAddress,
          Amount: xrpToDrops(1),
        },
        dilithium,
      )
    },
    STEP_TIMEOUT,
  )

  it(
    'Payment signed with a P-256 key',
    async function () {
      // The key is on the owner's PasskeyList from PasskeyListSet
      const prepared = await client.autofill({
        TransactionType: 'Payment',
        Account: owner.classicAddress,
        Destination: heir.classicAddress,
        Amount: xrpToDrops(1),
      })
      const unsigned = { ...prepared, SigningPubKey: p256PublicKey }
      const signature = p256.sign(
        hexToBytes(encodeForSigning(unsigned)),
        p256Secret,
        { lowS: true, format: 'der' },
      )
      await submitBlob(
        encode({ ...unsigned, TxnSignature: bytesToHex(signature) }),
      )
    },
    STEP_TIMEOUT,
  )
})
