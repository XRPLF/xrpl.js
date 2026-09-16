/**
 * Checks whether a transaction engine result code indicates that the transaction
 * was successfully applied to the ledger.
 *
 * Only `tesSUCCESS` indicates success. Other classes of result code (`tec*`, `tef*`,
 * `tem*`, `tel*`, `ter*`) all indicate that the transaction did not have its intended
 * effect, even though some of them (`tec*`) are still recorded in a validated ledger
 * and charge a fee.
 *
 * @param resultCode - A transaction engine result code, such as the value returned by
 *                      {@link getTransactionResultCode} or `SubmitResponse.result.engine_result`.
 * @returns `true` if the result code is `tesSUCCESS`, `false` otherwise.
 * @category Utilities
 */
export default function isTesSuccess(resultCode: string): boolean {
  return resultCode === 'tesSUCCESS'
}
