/* eslint-disable max-params, max-lines-per-function -- proof builders mirror the C ABI */
import {
  BLINDING_FACTOR_SIZE,
  CLAWBACK_PROOF_SIZE,
  CONVERT_BACK_PROOF_SIZE,
  CONVERT_PROOF_SIZE,
  CONTEXT_HASH_SIZE,
  ELGAMAL_TOTAL_SIZE,
  PEDERSEN_COMMIT_SIZE,
  PRIVKEY_SIZE,
  PUBKEY_SIZE,
  SEND_PROOF_SIZE,
} from './constants'
import { bytesToHex, hexToBytes } from './hex'
import { assertUint64, rawParticipant, rawPedersenParams } from './internal'
import { withModule } from './runtime'
import { PedersenParams, SendProofParams } from './types'

const SIZE_T_BYTES = 4

/**
 * Generate the 64-byte Schnorr proof for a ConfidentialMPTConvert transaction.
 *
 * @param publicKey - The 33-byte hex public key.
 * @param privateKey - The 32-byte hex private key.
 * @param contextHash - The 32-byte hex transaction context hash.
 * @returns The 64-byte hex proof.
 * @throws If inputs are malformed or the WASM call fails.
 */
export async function getConvertProof(
  publicKey: string,
  privateKey: string,
  contextHash: string,
): Promise<string> {
  const pub = hexToBytes(publicKey, 'publicKey', PUBKEY_SIZE)
  const priv = hexToBytes(privateKey, 'privateKey', PRIVKEY_SIZE)
  const ctx = hexToBytes(contextHash, 'contextHash', CONTEXT_HASH_SIZE)
  return withModule((mod, marshaller) => {
    const pubPtr = marshaller.allocBytes(pub)
    const privPtr = marshaller.allocBytes(priv)
    // Wipe the transient JS copy; WASM scratch is zeroed on dispose().
    priv.fill(0)
    const ctxPtr = marshaller.allocBytes(ctx)
    const outPtr = marshaller.alloc(CONVERT_PROOF_SIZE)
    if (mod._mpt_get_convert_proof(pubPtr, privPtr, ctxPtr, outPtr) !== 0) {
      throw new Error('mpt_get_convert_proof failed')
    }
    return bytesToHex(marshaller.readBytes(outPtr, CONVERT_PROOF_SIZE))
  })
}

/**
 * Generate the 64-byte sigma proof for a ConfidentialMPTClawback transaction.
 *
 * @param privateKey - The issuer's 32-byte hex private key.
 * @param publicKey - The issuer's 33-byte hex public key.
 * @param contextHash - The 32-byte hex transaction context hash.
 * @param amount - The publicly known amount being clawed back.
 * @param ciphertext - The holder's 66-byte hex balance ciphertext.
 * @returns The 64-byte hex proof.
 * @throws If inputs are malformed or the WASM call fails.
 */
export async function getClawbackProof(
  privateKey: string,
  publicKey: string,
  contextHash: string,
  amount: bigint,
  ciphertext: string,
): Promise<string> {
  assertUint64(amount, 'amount')
  const priv = hexToBytes(privateKey, 'privateKey', PRIVKEY_SIZE)
  const pub = hexToBytes(publicKey, 'publicKey', PUBKEY_SIZE)
  const ctx = hexToBytes(contextHash, 'contextHash', CONTEXT_HASH_SIZE)
  const ct = hexToBytes(ciphertext, 'ciphertext', ELGAMAL_TOTAL_SIZE)
  return withModule((mod, marshaller) => {
    const privPtr = marshaller.allocBytes(priv)
    // Wipe the transient JS copy; WASM scratch is zeroed on dispose().
    priv.fill(0)
    const pubPtr = marshaller.allocBytes(pub)
    const ctxPtr = marshaller.allocBytes(ctx)
    const ctPtr = marshaller.allocBytes(ct)
    const outPtr = marshaller.alloc(CLAWBACK_PROOF_SIZE)
    if (
      mod._mpt_get_clawback_proof(
        privPtr,
        pubPtr,
        ctxPtr,
        amount,
        ctPtr,
        outPtr,
      ) !== 0
    ) {
      throw new Error('mpt_get_clawback_proof failed')
    }
    return bytesToHex(marshaller.readBytes(outPtr, CLAWBACK_PROOF_SIZE))
  })
}

/**
 * Generate the 816-byte proof for a ConfidentialMPTConvertBack transaction.
 *
 * @param privateKey - The holder's 32-byte hex private key.
 * @param publicKey - The holder's 33-byte hex public key.
 * @param contextHash - The 32-byte hex transaction context hash.
 * @param amount - The publicly revealed conversion amount.
 * @param params - The holder's balance Pedersen witness.
 * @returns The 816-byte hex proof.
 * @throws If inputs are malformed or the WASM call fails.
 */
export async function getConvertBackProof(
  privateKey: string,
  publicKey: string,
  contextHash: string,
  amount: bigint,
  params: PedersenParams,
): Promise<string> {
  assertUint64(amount, 'amount')
  const priv = hexToBytes(privateKey, 'privateKey', PRIVKEY_SIZE)
  const pub = hexToBytes(publicKey, 'publicKey', PUBKEY_SIZE)
  const ctx = hexToBytes(contextHash, 'contextHash', CONTEXT_HASH_SIZE)
  const rawParams = rawPedersenParams(params, 'params')
  return withModule((mod, marshaller) => {
    const privPtr = marshaller.allocBytes(priv)
    // Wipe the transient JS copy; WASM scratch is zeroed on dispose().
    priv.fill(0)
    const pubPtr = marshaller.allocBytes(pub)
    const ctxPtr = marshaller.allocBytes(ctx)
    const paramsPtr = marshaller.allocPedersenParams(rawParams)
    // Wipe the transient JS copy; WASM scratch is zeroed on dispose().
    rawParams.blindingFactor.fill(0)
    const outPtr = marshaller.alloc(CONVERT_BACK_PROOF_SIZE)
    if (
      mod._mpt_get_convert_back_proof(
        privPtr,
        pubPtr,
        ctxPtr,
        amount,
        paramsPtr,
        outPtr,
      ) !== 0
    ) {
      throw new Error('mpt_get_convert_back_proof failed')
    }
    return bytesToHex(marshaller.readBytes(outPtr, CONVERT_BACK_PROOF_SIZE))
  })
}

/**
 * Generate the 946-byte proof for a ConfidentialMPTSend transaction.
 *
 * @param params - The send-proof inputs (sender keys, participants, witnesses).
 * @returns The 946-byte hex proof.
 * @throws If inputs are malformed or the WASM call fails.
 */
export async function getConfidentialSendProof(
  params: SendProofParams,
): Promise<string> {
  assertUint64(params.amount, 'amount')
  if (params.participants.length === 0) {
    throw new Error('getConfidentialSendProof: participants must not be empty')
  }
  const priv = hexToBytes(params.privateKey, 'privateKey', PRIVKEY_SIZE)
  const pub = hexToBytes(params.publicKey, 'publicKey', PUBKEY_SIZE)
  const txBlinding = hexToBytes(
    params.txBlindingFactor,
    'txBlindingFactor',
    BLINDING_FACTOR_SIZE,
  )
  const ctx = hexToBytes(params.contextHash, 'contextHash', CONTEXT_HASH_SIZE)
  const amountCommitment = hexToBytes(
    params.amountCommitment,
    'amountCommitment',
    PEDERSEN_COMMIT_SIZE,
  )
  const participants = params.participants.map((participant, index) =>
    rawParticipant(participant, `participants[${index}]`),
  )
  const balanceParams = rawPedersenParams(params.balanceParams, 'balanceParams')
  return withModule((mod, marshaller) => {
    const privPtr = marshaller.allocBytes(priv)
    // Wipe the transient JS copy; WASM scratch is zeroed on dispose().
    priv.fill(0)
    const pubPtr = marshaller.allocBytes(pub)
    const participantsPtr = marshaller.allocParticipants(participants)
    const txBlindingPtr = marshaller.allocBytes(txBlinding)
    // Wipe the transient JS copy; WASM scratch is zeroed on dispose().
    txBlinding.fill(0)
    const ctxPtr = marshaller.allocBytes(ctx)
    const amountCommitmentPtr = marshaller.allocBytes(amountCommitment)
    const balancePtr = marshaller.allocPedersenParams(balanceParams)
    // Wipe the transient JS copy; WASM scratch is zeroed on dispose().
    balanceParams.blindingFactor.fill(0)
    const outPtr = marshaller.alloc(SEND_PROOF_SIZE)
    const outLenPtr = marshaller.alloc(SIZE_T_BYTES)
    marshaller.writeU32(outLenPtr, SEND_PROOF_SIZE)
    if (
      mod._mpt_get_confidential_send_proof(
        privPtr,
        pubPtr,
        params.amount,
        participantsPtr,
        participants.length,
        txBlindingPtr,
        ctxPtr,
        amountCommitmentPtr,
        balancePtr,
        outPtr,
        outLenPtr,
      ) !== 0
    ) {
      throw new Error('mpt_get_confidential_send_proof failed')
    }
    const outLen = marshaller.readU32(outLenPtr)
    if (outLen > SEND_PROOF_SIZE) {
      throw new Error(
        'mpt_get_confidential_send_proof wrote more than the allocated buffer',
      )
    }
    return bytesToHex(marshaller.readBytes(outPtr, outLen))
  })
}
