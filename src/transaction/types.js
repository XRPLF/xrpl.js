/* @flow */
'use strict';

export type Instructions = {
  sequence?: number,
  fee?: string,
  maxFee?: string,
  maxLedgerVersion?: number,
  maxLedgerVersionOffset?: number,
  signersCount?: number
}

export type Prepare = {
  txJSON: string,
  instructions: {
   fee: string,
   sequence: number,
   maxLedgerVersion?: number
 }
}

export type Submit = {
  success: boolean,
  engineResult: string,
  engineResultCode: number,
  engineResultMessage?: string,
  txBlob?: string,
  txJson?: Object
}
