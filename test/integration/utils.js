const assert = require('chai').assert

const models = require('xrpl-local/models/transactions')
const utils = require('xrpl-local/utils')

const masterAccount = 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh'
const masterSecret = 'snoPBrXtMeMyMHUVTgbuqAfg1SUTb'

function ledgerAccept(client) {
  const request = { command: 'ledger_accept' }
  return client.connection.request(request)
}

function pay(client, from, to, amount, secret, currency = 'XRP', issuer) {
  const paymentAmount =
    currency === 'XRP' ? amount : { value: amount, currency, issuer }

  const payment = {
    TransactionType: 'Payment',
    Account: from,
    Destination: to,
    Amount: paymentAmount,
  }

  let id = null
  return (
    client
      .autofill(payment, 1)
      .then((tx) => {
        models.verifyPayment(payment)
        return client.sign(JSON.stringify(tx), secret)
      })
      .then((signed) => {
        id = signed.id
        return client.request({
          command: 'submit',
          tx_blob: signed.signedTransaction,
        })
      })
      // TODO: add better error handling here
      // TODO: fix path issues
      .then((response) => {
        if (
          response.result.engine_result !== 'tesSUCCESS' &&
          response.result.engine_result !== 'tecPATH_PARTIAL'
        ) {
          console.log(response)
          assert.fail(
            `Response not successful, ${response.result.engine_result}`,
          )
        }
        ledgerAccept(client)
      })
      .then(() => id)
  )
}

function payTo(
  client,
  to,
  amount = '40000000',
  currency = 'XRP',
  counterparty,
) {
  return pay(
    client,
    masterAccount,
    to,
    amount,
    masterSecret,
    currency,
    counterparty,
  )
}

module.exports = {
  pay,
  payTo,
  ledgerAccept,
}
