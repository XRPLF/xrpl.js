import { encodeForSigningBatch } from 'ripple-binary-codec'
import { sign } from 'ripple-keypairs'

import { ValidationError } from '../errors'
import { Batch, Signer, validate } from '../models'
import { BatchSigner } from '../models/transactions/batch'

import { Wallet } from '.'

/**
 * Sign a multi-account Batch transaction.
 *
 * @param wallet - Wallet instance.
 * @param transaction - The Batch transaction to sign.
 * @param multisign - Specify true/false to use multisign or actual address (classic/x-address) to make multisign tx request.
 * @throws ValidationError if the transaction is malformed.
 */
// eslint-disable-next-line max-lines-per-function -- TODO: refactor
export function signMultiBatch(
  wallet: Wallet,
  transaction: Batch,
  multisign?: boolean | string,
): void {
  let multisignAddress: boolean | string = false
  if (typeof multisign === 'string' && multisign.startsWith('X')) {
    multisignAddress = multisign
  } else if (multisign) {
    multisignAddress = wallet.classicAddress
  }

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- needed for JS
  if (transaction.TransactionType !== 'Batch') {
    throw new ValidationError('Must be a Batch transaction.')
  }
  /*
   * This will throw a more clear error for JS users if the supplied transaction has incorrect formatting
   */
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- validate does not accept Transaction type
  validate(transaction as unknown as Record<string, unknown>)
  const fieldsToSign = {
    flags: transaction.Flags,
    txIDs: transaction.TxIDs,
  }
  let batchSigner: BatchSigner
  if (multisignAddress) {
    const signer: Signer = {
      Signer: {
        Account: multisignAddress,
        SigningPubKey: wallet.publicKey,
        TxnSignature: sign(
          encodeForSigningBatch(fieldsToSign),
          wallet.privateKey,
        ),
      },
    }
    batchSigner = {
      BatchSigner: {
        Account: multisignAddress,
        Signers: [signer],
      },
    }
  } else {
    batchSigner = {
      BatchSigner: {
        Account: wallet.address,
        SigningPubKey: wallet.publicKey,
        TxnSignature: sign(
          encodeForSigningBatch(fieldsToSign),
          wallet.privateKey,
        ),
      },
    }
  }

  if (transaction.BatchSigners == null) {
    // eslint-disable-next-line no-param-reassign -- okay for signing
    transaction.BatchSigners = [batchSigner]
  } else {
    transaction.BatchSigners.push(batchSigner)
  }
}
