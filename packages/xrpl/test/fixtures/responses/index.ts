import generateAddress from './generateAddress.json'
import generateXAddress from './generateXAddress.json'
import getAccountObjects from './getAccountObjects.json'
import getBalances from './getBalances.json'
import fullLedger from './getLedgerFull.json'
import normalOrderBook from './getOrderbook.json'
import withXRPOrderBook from './getOrderbookWithXrp.json'
import getServerInfo from './getServerInfo.json'
import normalSign from './sign.json'
import signAsSign from './signAs.json'
import escrowSign from './signEscrow.json'
import signPaymentChannelClaim from './signPaymentChannelClaim.json'
import ticketSign from './signTicket.json'

const getOrderbook = {
  normal: normalOrderBook,
  withXRP: withXRPOrderBook,
}

const getLedger = {
  full: fullLedger,
}

const sign = {
  normal: normalSign,
  ticket: ticketSign,
  escrow: escrowSign,
  signAs: signAsSign,
}

const responses = {
  generateAddress,
  generateXAddress,
  getAccountObjects,
  getBalances,
  getServerInfo,
  signPaymentChannelClaim,
  getOrderbook,
  getLedger,
  sign,
}

export default responses
