/* eslint-disable max-lines -- cohesive Batch assembler: the state-transition helpers and the op dispatch belong in one module */
import { type Client } from '../client'
import { XrplError } from '../errors'
import {
  Batch,
  ConfidentialMPTConvert,
  ConfidentialMPTSend,
  SubmittableTransaction,
} from '../models/transactions'
import { GlobalFlags } from '../models/transactions/common'

import {
  prepareConfidentialConvert,
  prepareConfidentialConvertBack,
  prepareConfidentialMergeInbox,
} from './convert'
import { fetchMPToken, getAccountSequence } from './ledger'
import { loadMptCrypto, type MptCryptoModule } from './loader'
import {
  prepareConfidentialClawback,
  prepareConfidentialSend,
} from './transfer'
import type {
  ConfidentialBatchInner,
  ConfidentialBatchOp,
  ConfidentialBatchParams,
} from './types'

const TF_INNER_BATCH_TXN = GlobalFlags.tfInnerBatchTxn
// XLS-56 Batch flag: every inner applies or the whole Batch fails (atomic).
const TF_ALL_OR_NOTHING = 0x0001_0000
// A confidential proof binds the first 32 bytes (64 hex chars) of its ZKProof as
// the re-randomization challenge; rippled reuses it to re-blind the destination's
// inbox credit, so we reproduce that to predict the recipient's post-send inbox.
const CHALLENGE_HEX_LEN = 64
// rippled bounds a Batch to 2-8 inner transactions (Batch.cpp rejects <= 1;
// STTx.cpp rejects > kMaxBatchTxCount = 8). Fail fast here rather than after
// building every proof.
const MIN_BATCH_INNERS = 2
const MAX_BATCH_INNERS = 8

/**
 * Predicted confidential state of one `(account, token)` MPToken, threaded through
 * the batch as it is built. An `undefined` balance is one a prior inner reset to
 * the canonical encrypted zero — MergeInbox clears the inbox, Clawback clears
 * everything — which the WASM cannot reproduce; a later inner that reads one throws
 * rather than emit a proof rippled would reject.
 */
interface TokenState {
  spending?: string
  inbox?: string
  issuerEnc?: string
  auditorEnc?: string
  version: number
  holderKey?: string
}

/** The three ciphertexts a spend (Send/ConvertBack) debits from the balances. */
interface Debit {
  spend: string
  issuer: string
  auditor?: string
}

/** The ciphertexts a Convert credits into the pending balances. */
interface Credit {
  inbox: string
  issuer: string
  auditor?: string
}

/**
 * Build the map key for a confidential balance. One MPToken is `(holder, issuance)`.
 *
 * @param account - The holder's classic address.
 * @param token - The MPTokenIssuanceID.
 * @returns The composite key.
 */
function stateKey(account: string, token: string): string {
  return `${account}:${token}`
}

/**
 * Distinguish a confidential op-spec (carries an `op` discriminator) from a
 * pre-built plain transaction.
 *
 * @param inner - A batch inner.
 * @returns Whether `inner` is a confidential op-spec.
 */
function isConfidentialOp(
  inner: ConfidentialBatchInner,
): inner is ConfidentialBatchOp {
  return 'op' in inner
}

/**
 * The account whose sequence an inner consumes (its submitter).
 *
 * @param inner - A batch inner.
 * @returns The submitting account's classic address.
 */
function innerAccount(inner: ConfidentialBatchInner): string {
  return isConfidentialOp(inner) ? inner.account : inner.Account
}

/**
 * Look up a required map entry, throwing rather than returning `undefined` (which
 * keeps call sites free of non-null assertions).
 *
 * @param map - The map to read.
 * @param key - The key to read.
 * @param what - A human-readable name for the error message.
 * @returns The value at `key`.
 * @throws {XrplError} If `key` is absent.
 */
function mustGet<T>(map: Map<string, T>, key: string, what: string): T {
  const value = map.get(key)
  if (value == null) {
    throw new XrplError(`prepareConfidentialBatch: missing ${what}`)
  }
  return value
}

/**
 * Read a predicted balance, throwing if a prior reset left it uncomputable.
 *
 * @param value - The predicted ciphertext, or `undefined` if reset.
 * @param what - A human-readable name for the error message.
 * @returns The ciphertext.
 * @throws {XrplError} If the value was reset by an earlier MergeInbox/Clawback.
 */
function readBalance(value: string | undefined, what: string): string {
  if (value == null) {
    throw new XrplError(
      `prepareConfidentialBatch: cannot predict ${what} — an earlier MergeInbox ` +
        `or Clawback in this Batch reset it to a value the client cannot ` +
        `reproduce. Split these operations across separate Batches.`,
    )
  }
  return value
}

/**
 * Shape a built inner as an XLS-56 Batch inner: the inner-batch flag and zero fee.
 *
 * @param tx - The transaction to shape.
 * @returns The shaped inner transaction.
 */
function shapeInner(tx: SubmittableTransaction): SubmittableTransaction {
  return { ...tx, Flags: TF_INNER_BATCH_TXN, Fee: '0' }
}

/**
 * The distinct `(account, token)` MPTokens whose confidential state the batch
 * reads or mutates: every op's own account, a send's destination, a clawback's
 * holder.
 *
 * @param ops - The confidential ops in the batch.
 * @returns The set of state keys to load.
 */
function collectStateKeys(ops: ConfidentialBatchOp[]): Set<string> {
  const keys = new Set<string>()
  for (const op of ops) {
    if (op.op === 'clawback') {
      // The issuer (op.account) holds no MPToken; it is the holder's balance that
      // the clawback reads and burns.
      keys.add(stateKey(op.holder, op.mptIssuanceID))
    } else {
      keys.add(stateKey(op.account, op.mptIssuanceID))
      if (op.op === 'send') {
        keys.add(stateKey(op.destination, op.mptIssuanceID))
      }
    }
  }
  return keys
}

/**
 * Fetch the initial confidential state of each referenced MPToken.
 *
 * @param client - A connected Client.
 * @param ops - The confidential ops in the batch.
 * @returns A map from state key to that MPToken's initial confidential state.
 */
async function loadStates(
  client: Client,
  ops: ConfidentialBatchOp[],
): Promise<Map<string, TokenState>> {
  const states = new Map<string, TokenState>()
  await Promise.all(
    Array.from(collectStateKeys(ops), async (key) => {
      const [account, token] = key.split(':')
      const mptoken = await fetchMPToken(client, account, token)
      states.set(key, {
        spending: mptoken.ConfidentialBalanceSpending,
        inbox: mptoken.ConfidentialBalanceInbox,
        issuerEnc: mptoken.IssuerEncryptedBalance,
        auditorEnc: mptoken.AuditorEncryptedBalance,
        version: mptoken.ConfidentialBalanceVersion ?? 0,
        holderKey: mptoken.HolderEncryptionKey,
      })
    }),
  )
  return states
}

/**
 * Assign each account its starting inner sequence, mirroring `autofillBatchTxn`:
 * the outer Batch account's inners start at its current sequence + 1 (the outer
 * Batch itself consumes the current one); every other account's inners start at
 * its own current sequence.
 *
 * @param client - A connected Client.
 * @param batchAccount - The outer Batch account.
 * @param inners - The batch inners.
 * @returns The outer Batch sequence and a per-account next-sequence counter.
 */
async function loadSequences(
  client: Client,
  batchAccount: string,
  inners: ConfidentialBatchInner[],
): Promise<{ outerSequence: number; next: Map<string, number> }> {
  const accounts = new Set<string>([batchAccount])
  for (const inner of inners) {
    accounts.add(innerAccount(inner))
  }
  const current = new Map<string, number>()
  await Promise.all(
    Array.from(accounts, async (account) => {
      current.set(account, await getAccountSequence(client, account))
    }),
  )
  const outerSequence = mustGet(current, batchAccount, 'batch account sequence')
  const next = new Map<string, number>()
  for (const account of accounts) {
    const seq = mustGet(current, account, 'account sequence')
    next.set(account, account === batchAccount ? seq + 1 : seq)
  }
  return { outerSequence, next }
}

/**
 * Consume an account's next inner sequence and advance its counter.
 *
 * @param next - The per-account next-sequence counter from {@link loadSequences}.
 * @param account - The account consuming a sequence.
 * @returns The sequence to assign to this inner.
 */
function nextSequence(next: Map<string, number>, account: string): number {
  const sequence = mustGet(next, account, `sequence for ${account}`)
  next.set(account, sequence + 1)
  return sequence
}

/**
 * Debit a spender's balances (Send/ConvertBack): subtract the encrypted amount
 * from spending, issuer-encrypted, and (if present) auditor-encrypted balances,
 * and bump the version.
 *
 * @param crypto - The confidential crypto module.
 * @param state - The spender's current predicted state.
 * @param debit - The encrypted amounts to subtract.
 * @returns The spender's state after the debit.
 */
async function applyDebit(
  crypto: MptCryptoModule,
  state: TokenState,
  debit: Debit,
): Promise<TokenState> {
  const spending = await crypto.subtractCiphertexts(
    readBalance(state.spending, 'spending balance'),
    debit.spend,
  )
  const issuerEnc = await crypto.subtractCiphertexts(
    readBalance(state.issuerEnc, 'issuer-encrypted balance'),
    debit.issuer,
  )
  const auditorEnc =
    debit.auditor == null
      ? state.auditorEnc
      : await crypto.subtractCiphertexts(
          readBalance(state.auditorEnc, 'auditor-encrypted balance'),
          debit.auditor,
        )
  return {
    ...state,
    spending,
    issuerEnc,
    auditorEnc,
    version: state.version + 1,
  }
}

/**
 * Credit a holder's pending balances after a Convert (rippled adds the tx
 * ciphertexts straight in; a first-ever convert initializes them, so an absent
 * balance becomes the encrypted amount itself). Spending is untouched — it stays
 * the canonical zero until a MergeInbox, so it remains uncomputable here.
 *
 * @param crypto - The confidential crypto module.
 * @param state - The holder's current predicted state.
 * @param credit - The encrypted amounts to add.
 * @returns The holder's state after the credit.
 */
async function applyConvertCredit(
  crypto: MptCryptoModule,
  state: TokenState,
  credit: Credit,
): Promise<TokenState> {
  const inbox =
    state.inbox == null
      ? credit.inbox
      : await crypto.addCiphertexts(state.inbox, credit.inbox)
  const issuerEnc =
    state.issuerEnc == null
      ? credit.issuer
      : await crypto.addCiphertexts(state.issuerEnc, credit.issuer)
  let { auditorEnc } = state
  if (credit.auditor != null) {
    auditorEnc =
      auditorEnc == null
        ? credit.auditor
        : await crypto.addCiphertexts(auditorEnc, credit.auditor)
  }
  return { ...state, inbox, issuerEnc, auditorEnc }
}

/**
 * Fold a holder's inbox into spending after a MergeInbox and reset the inbox.
 *
 * @param crypto - The confidential crypto module.
 * @param state - The holder's current predicted state.
 * @returns The holder's state after the merge (inbox reset to uncomputable).
 * @throws {XrplError} If spending or inbox was reset by an earlier inner.
 */
async function applyMerge(
  crypto: MptCryptoModule,
  state: TokenState,
): Promise<TokenState> {
  const spending = await crypto.addCiphertexts(
    readBalance(state.spending, 'spending balance'),
    readBalance(state.inbox, 'inbox balance'),
  )
  // rippled resets the inbox to the canonical encrypted zero, which the WASM
  // cannot reproduce; mark it uncomputable so a later reader fails loudly.
  return { ...state, spending, inbox: undefined, version: state.version + 1 }
}

/**
 * Reset a holder's balances after a Clawback burns their entire confidential
 * holding.
 *
 * @param state - The holder's current predicted state.
 * @returns The holder's state after the clawback (all balances uncomputable).
 */
function applyClawback(state: TokenState): TokenState {
  return {
    ...state,
    spending: undefined,
    inbox: undefined,
    issuerEnc: undefined,
    auditorEnc: undefined,
    version: state.version + 1,
  }
}

/**
 * Predict a destination's inbox after a Send credits it. rippled re-blinds the
 * credit deterministically with the proof's challenge, so reproduce it:
 * `inbox += DestinationEncryptedAmount + enc(0, destKey, challenge)`.
 *
 * @param crypto - The confidential crypto module.
 * @param dest - The destination's current predicted state.
 * @param tx - The built ConfidentialMPTSend.
 * @returns The destination's state after the inbox credit.
 * @throws {XrplError} If the destination key or inbox was reset/absent.
 */
async function applyInboxCredit(
  crypto: MptCryptoModule,
  dest: TokenState,
  tx: ConfidentialMPTSend,
): Promise<TokenState> {
  const destKey = readBalance(dest.holderKey, 'destination holder key')
  const challenge = tx.ZKProof.slice(0, CHALLENGE_HEX_LEN)
  const reblinded = await crypto.addCiphertexts(
    tx.DestinationEncryptedAmount,
    await crypto.encryptAmount(BigInt(0), destKey, challenge),
  )
  const inbox = await crypto.addCiphertexts(
    readBalance(dest.inbox, 'destination inbox balance'),
    reblinded,
  )
  return { ...dest, inbox }
}

/** The confidential builders + shared context threaded through the assembler. */
interface AssembleContext {
  client: Client
  crypto: MptCryptoModule
  states: Map<string, TokenState>
}

/** A built inner plus the state updates it implies, keyed by state key. */
interface BuiltInner {
  tx: SubmittableTransaction
  updates: Array<[string, TokenState]>
}

/**
 * Build one confidential inner against the current predicted state and compute
 * the state updates it implies (applied by the caller so this stays pure w.r.t.
 * the shared map).
 *
 * @param ctx - The assembler context (client, crypto, current states).
 * @param op - The confidential op-spec.
 * @param sequence - The sequence to pin the inner to.
 * @returns The shaped inner and the `(key, newState)` updates it implies.
 * @throws {XrplError} If a needed balance was reset by an earlier inner.
 */
// eslint-disable-next-line max-lines-per-function, max-statements -- one op-dispatch switch; each arm is short
async function buildConfidentialInner(
  ctx: AssembleContext,
  op: ConfidentialBatchOp,
  sequence: number,
): Promise<BuiltInner> {
  const { client, crypto, states } = ctx
  switch (op.op) {
    case 'send': {
      const { op: _op, ...params } = op
      const key = stateKey(op.account, op.mptIssuanceID)
      const state = mustGet(states, key, `state for ${key}`)
      const tx = await prepareConfidentialSend(client, {
        ...params,
        sequence,
        confidentialState: {
          spending: readBalance(state.spending, `${op.account} spending`),
          version: state.version,
        },
      })
      const destKey = stateKey(op.destination, op.mptIssuanceID)
      const dest = mustGet(states, destKey, `state for ${destKey}`)
      const debit: Debit = {
        spend: tx.SenderEncryptedAmount,
        issuer: tx.IssuerEncryptedAmount,
        auditor: tx.AuditorEncryptedAmount,
      }
      return {
        tx: shapeInner(tx),
        updates: [
          [key, await applyDebit(crypto, state, debit)],
          [destKey, await applyInboxCredit(crypto, dest, tx)],
        ],
      }
    }
    case 'convertBack': {
      const { op: _op, ...params } = op
      const key = stateKey(op.account, op.mptIssuanceID)
      const state = mustGet(states, key, `state for ${key}`)
      const tx = await prepareConfidentialConvertBack(client, {
        ...params,
        sequence,
        confidentialState: {
          spending: readBalance(state.spending, `${op.account} spending`),
          version: state.version,
        },
      })
      const debit: Debit = {
        spend: tx.HolderEncryptedAmount,
        issuer: tx.IssuerEncryptedAmount,
        auditor: tx.AuditorEncryptedAmount,
      }
      return {
        tx: shapeInner(tx),
        updates: [[key, await applyDebit(crypto, state, debit)]],
      }
    }
    case 'convert': {
      const { op: _op, ...params } = op
      const key = stateKey(op.account, op.mptIssuanceID)
      const state = mustGet(states, key, `state for ${key}`)
      const tx: ConfidentialMPTConvert = await prepareConfidentialConvert(
        client,
        {
          ...params,
          sequence,
        },
      )
      const credit: Credit = {
        inbox: tx.HolderEncryptedAmount,
        issuer: tx.IssuerEncryptedAmount,
        auditor: tx.AuditorEncryptedAmount,
      }
      return {
        tx: shapeInner(tx),
        updates: [[key, await applyConvertCredit(crypto, state, credit)]],
      }
    }
    case 'mergeInbox': {
      const { op: _op, ...params } = op
      const key = stateKey(op.account, op.mptIssuanceID)
      const state = mustGet(states, key, `state for ${key}`)
      const tx = await prepareConfidentialMergeInbox(client, {
        ...params,
        sequence,
      })
      return {
        tx: shapeInner(tx),
        updates: [[key, await applyMerge(crypto, state)]],
      }
    }
    case 'clawback': {
      const { op: _op, ...params } = op
      const holderKey = stateKey(op.holder, op.mptIssuanceID)
      const holder = mustGet(states, holderKey, `state for ${holderKey}`)
      const tx = await prepareConfidentialClawback(client, {
        ...params,
        sequence,
        issuerEncryptedBalanceOverride: readBalance(
          holder.issuerEnc,
          `${op.holder} issuer-encrypted balance`,
        ),
      })
      return {
        tx: shapeInner(tx),
        updates: [[holderKey, applyClawback(holder)]],
      }
    }
    default:
      throw new XrplError(
        'prepareConfidentialBatch: unrecognized confidential op',
      )
  }
}

/**
 * Assemble a Batch (XLS-56) of Confidential MPT (XLS-0096) inner transactions.
 *
 * Takes the outer Batch account and an ordered list of inners — each either a
 * confidential operation spec or a pre-built plain transaction — and returns a
 * fully-assembled, autofilled Batch ready to sign. The assembler owns everything
 * that makes confidential-in-a-Batch subtle: it assigns each inner its
 * position-derived sequence (a confidential proof binds its sequence, so it must
 * be built with the final value — `autofill` cannot fix a proof afterward), threads
 * predicted balance state through repeated same-`(account, token)` operations (each
 * proof binds the balance the previous inner leaves behind), shapes every inner
 * (`tfInnerBatchTxn`, `Fee: '0'`), and autofills the outer fee. Signing stays with
 * the caller: `signMultiBatch` for each non-outer participant, then the outer
 * account signs.
 *
 * A plain (non-confidential) inner that already carries its own `Sequence` or
 * `TicketSequence` is passed through untouched; otherwise it is assigned a
 * position-derived sequence, mirroring how `autofill` sequences a Batch.
 *
 * @param client - A connected Client.
 * @param params - The batch account, ordered inners, and optional outer flags.
 * @returns The assembled, autofilled Batch.
 * @throws {XrplError} If `inners` has fewer than 2 or more than 8 entries (rippled's
 * Batch bounds), or a chain reads a balance a prior MergeInbox/Clawback reset (split
 * those into separate Batches).
 */
// eslint-disable-next-line max-lines-per-function -- one linear assemble loop; splitting would obscure the sequence threading
export async function prepareConfidentialBatch(
  client: Client,
  params: ConfidentialBatchParams,
): Promise<Batch> {
  const { account, inners, batchFlags } = params
  if (inners.length < MIN_BATCH_INNERS || inners.length > MAX_BATCH_INNERS) {
    throw new XrplError(
      `prepareConfidentialBatch: a Batch requires between ${MIN_BATCH_INNERS} and ` +
        `${MAX_BATCH_INNERS} inner transactions, got ${inners.length}`,
    )
  }
  const ops = inners.filter(isConfidentialOp)
  const [crypto, states, sequencing] = await Promise.all([
    loadMptCrypto(),
    loadStates(client, ops),
    loadSequences(client, account, inners),
  ])
  const ctx: AssembleContext = { client, crypto, states }

  const rawTransactions: Array<{ RawTransaction: SubmittableTransaction }> = []
  for (const inner of inners) {
    const acct = innerAccount(inner)
    if (isConfidentialOp(inner)) {
      const sequence = nextSequence(sequencing.next, acct)
      // eslint-disable-next-line no-await-in-loop -- an ordered chain; state must thread in sequence
      const built = await buildConfidentialInner(ctx, inner, sequence)
      for (const [key, newState] of built.updates) {
        states.set(key, newState)
      }
      rawTransactions.push({ RawTransaction: built.tx })
    } else if (inner.Sequence == null && inner.TicketSequence == null) {
      // Mirror autofillBatchTxn: assign a position-derived Sequence only to a plain
      // inner that has neither its own Sequence nor a TicketSequence; a caller-set
      // Sequence or a ticketed inner is passed through as-is.
      const sequence = nextSequence(sequencing.next, acct)
      rawTransactions.push({
        RawTransaction: shapeInner({ ...inner, Sequence: sequence }),
      })
    } else {
      rawTransactions.push({ RawTransaction: shapeInner(inner) })
    }
  }

  const batch: Batch = {
    TransactionType: 'Batch',
    Account: account,
    Sequence: sequencing.outerSequence,
    Flags: batchFlags ?? TF_ALL_OR_NOTHING,
    RawTransactions: rawTransactions,
  }
  return client.autofill(batch)
}
