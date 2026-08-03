/**
 * Confidential MPT (XLS-0096) — end-to-end lifecycle on the XRPL Devnet.
 *
 * A runnable walkthrough of the whole confidential MPT flow. It funds an issuer
 * and two holders from the faucet, creates a confidential-capable issuance, then
 * exercises all five confidential transactions in order — Convert, MergeInbox,
 * Send, ConvertBack, Clawback — registering the issuer/auditor/holder encryption
 * keys along the way and printing each decrypted balance so you can watch the
 * values move. It ends with auditor selective disclosure: the auditor decrypts a
 * holder's balance using only its own key.
 *
 * The confidential subpath (`xrpl/confidential`) and its `@xrplf/mpt-crypto` WASM
 * ship in this branch but are not on public npm yet, so run it from a checkout of
 * the branch, built once:
 *
 *   git checkout confidential-mpts && npm install && npm run build
 *   cd packages/xrpl
 *   node examples/confidential-mpt/confidential-mpt-lifecycle.js
 *
 * It targets Devnet by default (which runs the ConfidentialTransfer amendment).
 * Point it at any other confidential-capable server with an env var:
 *
 *   # optional
 *   CONFIDENTIAL_MPT_SERVER=ws://localhost:6006 \
 *     node examples/confidential-mpt/confidential-mpt-lifecycle.js
 */
const { decryptAmount } = require('@xrplf/mpt-crypto')
const { Client } = require('xrpl')
const {
  deriveConfidentialKeypair,
  fetchMPToken,
  getConfidentialBalance,
  prepareConfidentialClawback,
  prepareConfidentialConvert,
  prepareConfidentialConvertBack,
  prepareConfidentialMergeInbox,
  prepareConfidentialSend,
} = require('xrpl/confidential')

const SERVER =
  process.env.CONFIDENTIAL_MPT_SERVER ?? 'wss://s.devnet.rippletest.net:51233'

/** Submit, wait for validation, and assert the transaction succeeded. */
async function submit(client, tx, wallet, label) {
  const response = await client.submitAndWait(tx, { autofill: true, wallet })
  const meta = response.result.meta
  if (meta.TransactionResult !== 'tesSUCCESS') {
    throw new Error(`${label} → ${meta.TransactionResult}`)
  }
  console.log(`  ${label} → tesSUCCESS`)
  return meta
}

/** Decrypt and print a holder's spendable confidential balance. */
async function showBalance(client, name, address, mptID, key) {
  const balance = await getConfidentialBalance(
    client,
    address,
    mptID,
    key.privateKey,
  )
  console.log(`     ${name} spendable: ${balance}`)
}

async function main() {
  console.log(`Confidential MPT lifecycle\n`)
  const client = new Client(SERVER)
  await client.connect()

  try {
    // --- Fund three accounts from the Devnet faucet -----------------------
    console.log('Funding accounts (faucet)...')
    const { wallet: issuer } = await client.fundWallet()
    const { wallet: alice } = await client.fundWallet()
    const { wallet: bob } = await client.fundWallet()
    console.log(`  issuer ${issuer.classicAddress}`)
    console.log(`  alice  ${alice.classicAddress}`)
    console.log(`  bob    ${bob.classicAddress}\n`)

    // --- Encryption keypairs (separate from signing keys) -----------------
    const issuerKey = deriveConfidentialKeypair()
    const auditorKey = deriveConfidentialKeypair()
    const aliceKey = deriveConfidentialKeypair()
    const bobKey = deriveConfidentialKeypair()

    // --- Create a confidential-capable issuance ---------------------------
    console.log('Setup:')
    const createMeta = await submit(
      client,
      {
        TransactionType: 'MPTokenIssuanceCreate',
        Account: issuer.classicAddress,
        MaximumAmount: '9223372036854775807',
        AssetScale: 0,
        Flags: {
          tfMPTCanLock: true,
          tfMPTCanTransfer: true,
          tfMPTCanClawback: true,
          tfMPTCanHoldConfidentialBalance: true,
        },
      },
      issuer,
      'MPTokenIssuanceCreate',
    )
    const mptID = createMeta.mpt_issuance_id
    if (mptID == null) {
      throw new Error('MPTokenIssuanceCreate did not return an mpt_issuance_id')
    }
    console.log(`  mpt_issuance_id: ${mptID}`)

    // Register the issuer + auditor encryption keys on the issuance.
    await submit(
      client,
      {
        TransactionType: 'MPTokenIssuanceSet',
        Account: issuer.classicAddress,
        MPTokenIssuanceID: mptID,
        IssuerEncryptionKey: issuerKey.publicKey,
        AuditorEncryptionKey: auditorKey.publicKey,
      },
      issuer,
      'MPTokenIssuanceSet (register issuer + auditor keys)',
    )

    // Holders opt into the issuance.
    await submit(
      client,
      {
        TransactionType: 'MPTokenAuthorize',
        Account: alice.classicAddress,
        MPTokenIssuanceID: mptID,
      },
      alice,
      'MPTokenAuthorize (alice)',
    )
    await submit(
      client,
      {
        TransactionType: 'MPTokenAuthorize',
        Account: bob.classicAddress,
        MPTokenIssuanceID: mptID,
      },
      bob,
      'MPTokenAuthorize (bob)',
    )

    // Issuer pays alice 1000 public MPT to convert.
    await submit(
      client,
      {
        TransactionType: 'Payment',
        Account: issuer.classicAddress,
        Destination: alice.classicAddress,
        Amount: { mpt_issuance_id: mptID, value: '1000' },
      },
      issuer,
      'Payment 1000 public MPT → alice',
    )

    // --- 1. Convert: public → confidential (also registers alice's key) ---
    console.log('\n1) Convert (alice: 1000 public → confidential):')
    await submit(
      client,
      await prepareConfidentialConvert(client, {
        account: alice.classicAddress,
        amount: 1000n,
        holder: aliceKey,
        mptIssuanceID: mptID,
      }),
      alice,
      'ConfidentialMPTConvert',
    )

    // --- 2. MergeInbox: inbox → spendable ---------------------------------
    console.log('\n2) MergeInbox (alice):')
    await submit(
      client,
      await prepareConfidentialMergeInbox(client, {
        account: alice.classicAddress,
        mptIssuanceID: mptID,
      }),
      alice,
      'ConfidentialMPTMergeInbox',
    )
    await showBalance(client, 'alice', alice.classicAddress, mptID, aliceKey)

    // bob registers his key (zero-amount Convert) so he can receive.
    await submit(
      client,
      await prepareConfidentialConvert(client, {
        account: bob.classicAddress,
        amount: 0n,
        holder: bobKey,
        mptIssuanceID: mptID,
      }),
      bob,
      "ConfidentialMPTConvert (register bob's key, amount 0)",
    )

    // --- 3. Send: alice → bob's inbox, then bob merges --------------------
    console.log('\n3) Send (alice → bob: 300):')
    await submit(
      client,
      await prepareConfidentialSend(client, {
        account: alice.classicAddress,
        destination: bob.classicAddress,
        amount: 300n,
        sender: aliceKey,
        mptIssuanceID: mptID,
      }),
      alice,
      'ConfidentialMPTSend',
    )
    await submit(
      client,
      await prepareConfidentialMergeInbox(client, {
        account: bob.classicAddress,
        mptIssuanceID: mptID,
      }),
      bob,
      'ConfidentialMPTMergeInbox (bob)',
    )
    await showBalance(client, 'alice', alice.classicAddress, mptID, aliceKey)
    await showBalance(client, 'bob', bob.classicAddress, mptID, bobKey)

    // --- 4. ConvertBack: confidential → public ----------------------------
    console.log('\n4) ConvertBack (alice: 200 confidential → public):')
    await submit(
      client,
      await prepareConfidentialConvertBack(client, {
        account: alice.classicAddress,
        amount: 200n,
        holder: aliceKey,
        mptIssuanceID: mptID,
      }),
      alice,
      'ConfidentialMPTConvertBack',
    )
    await showBalance(client, 'alice', alice.classicAddress, mptID, aliceKey)
    const aliceToken = await fetchMPToken(client, alice.classicAddress, mptID)
    console.log(`     alice public MPT: ${aliceToken.MPTAmount ?? '0'}`)

    // --- 5. Clawback: issuer claws back bob's full confidential balance ---
    console.log("\n5) Clawback (issuer claws back bob's balance):")
    await submit(
      client,
      await prepareConfidentialClawback(client, {
        account: issuer.classicAddress,
        holder: bob.classicAddress,
        issuer: issuerKey,
        mptIssuanceID: mptID,
      }),
      issuer,
      'ConfidentialMPTClawback',
    )
    await showBalance(client, 'bob', bob.classicAddress, mptID, bobKey)

    // --- Auditor selective disclosure -------------------------------------
    console.log('\nAuditor disclosure (auditor decrypts with its own key):')
    const auditedToken = await fetchMPToken(client, alice.classicAddress, mptID)
    const auditorView = await decryptAmount(
      auditedToken.AuditorEncryptedBalance,
      auditorKey.privateKey,
    )
    console.log(`     auditor sees alice spendable: ${auditorView}`)

    console.log('\nDone — all 5 confidential transactions succeeded.')
  } finally {
    await client.disconnect()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
