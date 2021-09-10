import { assert } from 'chai'

import { Client } from 'xrpl-local'
import { BaseResponse } from 'xrpl-local/models/methods/baseMethod'
import { verifyPayment, Payment } from 'xrpl-local/models/transactions'

const masterAccount = 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh'
const masterSecret = 'snoPBrXtMeMyMHUVTgbuqAfg1SUTb'

interface LedgerAcceptResponse extends BaseResponse {
  result: {
    ledger_current_index: number
  }
}

async function ledgerAccept(client: Client): Promise<LedgerAcceptResponse> {
  const request = { command: 'ledger_accept' }
  return client.connection.request(request) as Promise<LedgerAcceptResponse>
}

// eslint-disable-next-line max-params -- helper test function
async function pay(
  client: Client,
  from: string,
  to: string,
  amount: string,
  secret: string,
  issuer: string,
  currency = 'XRP',
): Promise<string> {
  const paymentAmount =
    currency === 'XRP' ? amount : { value: amount, currency, issuer }

  const payment: Payment = {
    TransactionType: 'Payment',
    Account: from,
    Destination: to,
    Amount: paymentAmount,
  }

  const paymentTx = client.autofill(payment, 1)
  verifyPayment(paymentTx)
  const signed = client.sign(JSON.stringify(paymentTx), secret)
  const id = signed.id
  const response = await client.request({
    command: 'submit',
    tx_blob: signed.signedTransaction,
  })
  // TODO: add better error handling here
  // TODO: fix path issues
  if (
    response.result.engine_result !== 'tesSUCCESS' &&
    response.result.engine_result !== 'tecPATH_PARTIAL'
  ) {
    console.log(response)
    assert.fail(`Response not successful, ${response.result.engine_result}`)
  }
  ledgerAccept(client)
  return id
}

// eslint-disable-next-line max-params -- Helper test function
async function payTo(
  client: Client,
  to: string,
  amount = '40000000',
  currency = 'XRP',
  issuer = '',
): Promise<string> {
  return pay(client, masterAccount, to, amount, masterSecret, issuer, currency)
}

export { pay, payTo, ledgerAccept }
