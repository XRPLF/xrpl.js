'use strict';

const masterAccount = 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh';
const masterSecret = 'snoPBrXtMeMyMHUVTgbuqAfg1SUTb';

function ledgerAccept(client) {
  const request = {command: 'ledger_accept'};
  return client.connection.request(request);
}

function pay(client, from, to, amount, secret, currency = 'XRP', counterparty) {
  const paymentSpecification = {
    source: {
      address: from,
      maxAmount: {
        value: amount,
        currency: currency
      }
    },
    destination: {
      address: to,
      amount: {
        value: amount,
        currency: currency
      }
    }
  };

  if (counterparty != null) {
    paymentSpecification.source.maxAmount.counterparty = counterparty;
    paymentSpecification.destination.amount.counterparty = counterparty;
  }

  let id = null;
  return client.preparePayment(from, paymentSpecification, {})
    .then(data => client.sign(data.txJSON, secret))
    .then(signed => {
      id = signed.id;
      return client.request({command: 'submit', tx_blob: signed.signedTransaction});
    })
    // TODO: add better error handling here
    .then(() => ledgerAccept(client))
    .then(() => id);
}


function payTo(client, to, amount = '4003218', currency = 'XRP', counterparty) {
  return pay(client, masterAccount, to, amount, masterSecret, currency,
    counterparty);
}


module.exports = {
  pay,
  payTo,
  ledgerAccept
};
