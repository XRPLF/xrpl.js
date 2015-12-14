/* @flow */
'use strict';

export type Instructions = {
  sequence?: number,
  fee?: string,
  maxFee?: string,
  maxLedgerVersion?: number,
  maxLedgerVersionOffset?: number
}

export type Prepare = {
  txJSON: string,
  instructions: {
   fee: string,
   sequence: number,
   maxLedgerVersion?: number
 }
}
