import assert from 'assert-diff'
import {
  MissingLedgerHistoryError,
  NotFoundError,
  UnexpectedError
} from 'ripple-api/common/errors'
import {PendingLedgerVersionError} from '../../../src/common/errors'
import hashes from '../../fixtures/hashes.json'
import responses from '../../fixtures/responses'
import ledgerClosed from '../../fixtures/rippled/ledger-close-newer.json'
import {assertRejects, assertResultMatch, TestSuite} from '../../utils'
const {getTransaction: RESPONSE_FIXTURES} = responses

function closeLedger(connection) {
  connection._ws.emit('message', JSON.stringify(ledgerClosed))
}

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/api/index.ts" for more information about the test runner.
 */
export default <TestSuite>{
  'payment': async (api, address) => {
    const response = await api.getTransaction(hashes.VALID_TRANSACTION_HASH)
    assertResultMatch(response, RESPONSE_FIXTURES.payment, 'getTransaction')
  },

  'payment - include raw transaction': async (api, address) => {
    const options = {
      includeRawTransaction: true
    }
    const response = await api.getTransaction(
      hashes.VALID_TRANSACTION_HASH,
      options
    )
    assertResultMatch(
      response,
      RESPONSE_FIXTURES.paymentIncludeRawTransaction,
      'getTransaction'
    )
  },

  'settings': async (api, address) => {
    const hash =
      '4FB3ADF22F3C605E23FAEFAA185F3BD763C4692CAC490D9819D117CD33BFAA1B'
    const response = await api.getTransaction(hash)
    assertResultMatch(response, RESPONSE_FIXTURES.settings, 'getTransaction')
  },

  'settings - include raw transaction': async (api, address) => {
    const hash =
      '4FB3ADF22F3C605E23FAEFAA185F3BD763C4692CAC490D9819D117CD33BFAA1B'
    const options = {
      includeRawTransaction: true
    }
    const expected = Object.assign({}, RESPONSE_FIXTURES.settings) // Avoid mutating test fixture
    expected.rawTransaction =
      '{"Account":"rLVKsA4F9iJBbA6rX2x4wCmkj6drgtqpQe","Fee":"10","Flags":2147483648,"Sequence":1,"SetFlag":2,"SigningPubKey":"03EA3ADCA632F125EC2CC4F7F6A82DE0DCE2B65290CAC1F22242C5163F0DA9652D","TransactionType":"AccountSet","TxnSignature":"3045022100DE8B666B1A31EA65011B0F32130AB91A5747E32FA49B3054CEE8E8362DBAB98A022040CF0CF254677A8E5CD04C59CA2ED7F6F15F7E184641BAE169C561650967B226","date":460832270,"hash":"4FB3ADF22F3C605E23FAEFAA185F3BD763C4692CAC490D9819D117CD33BFAA1B","inLedger":8206418,"ledger_index":8206418,"meta":{"AffectedNodes":[{"ModifiedNode":{"FinalFields":{"Account":"rLVKsA4F9iJBbA6rX2x4wCmkj6drgtqpQe","Balance":"29999990","Flags":786432,"OwnerCount":0,"Sequence":2},"LedgerEntryType":"AccountRoot","LedgerIndex":"3F5072C4875F32ED770DAF3610A716600ED7C7BB0348FADC7A98E011BB2CD36F","PreviousFields":{"Balance":"30000000","Flags":4194304,"Sequence":1},"PreviousTxnID":"3FB0350A3742BBCC0D8AA3C5247D1AEC01177D0A24D9C34762BAA2FEA8AD88B3","PreviousTxnLgrSeq":8206397}}],"TransactionIndex":5,"TransactionResult":"tesSUCCESS"},"validated":true}'
    const response = await api.getTransaction(hash, options)
    assertResultMatch(response, expected, 'getTransaction')
  },

  'order': async (api, address) => {
    const hash =
      '10A6FB4A66EE80BED46AAE4815D7DC43B97E944984CCD5B93BCF3F8538CABC51'
    closeLedger(api.connection)
    const response = await api.getTransaction(hash)
    assertResultMatch(response, RESPONSE_FIXTURES.order, 'getTransaction')
  },

  'order with memo': async (api, address) => {
    const hash = hashes.WITH_MEMOS_OFFER_CREATE_TRANSACTION_HASH
    closeLedger(api.connection)
    const response = await api.getTransaction(hash)
    assertResultMatch(response, RESPONSE_FIXTURES.orderWithMemo, 'getTransaction')
  },

  'sell order': async (api, address) => {
    const hash =
      '458101D51051230B1D56E9ACAFAA34451BF65FA000F95DF6F0FF5B3A62D83FC2'
    closeLedger(api.connection)
    const response = await api.getTransaction(hash)
    assertResultMatch(response, RESPONSE_FIXTURES.orderSell, 'getTransaction')
  },

  'order cancellation': async (api, address) => {
    const hash =
      '809335DD3B0B333865096217AA2F55A4DF168E0198080B3A090D12D88880FF0E'
    closeLedger(api.connection)
    const response = await api.getTransaction(hash)
    assertResultMatch(
      response,
      RESPONSE_FIXTURES.orderCancellation,
      'getTransaction'
    )
  },

  'order with expiration cancellation': async (api, address) => {
    const hash =
      '097B9491CC76B64831F1FEA82EAA93BCD728106D90B65A072C933888E946C40B'
    const response = await api.getTransaction(hash)
    assertResultMatch(
      response,
      RESPONSE_FIXTURES.orderWithExpirationCancellation,
      'getTransaction'
    )
  },

  'order cancellation with memo': async (api, address) => {
    const hash = hashes.WITH_MEMOS_ORDER_CANCELLATION_TRANSACTION_HASH
    closeLedger(api.connection)
    const response = await api.getTransaction(hash)
    assertResultMatch(
      response,
      RESPONSE_FIXTURES.orderCancellationWithMemo,
      'getTransaction'
    )
  },

  'trustline set': async (api, address) => {
    const hash =
      '635A0769BD94710A1F6A76CDE65A3BC661B20B798807D1BBBDADCEA26420538D'
    const response = await api.getTransaction(hash)
    assertResultMatch(response, RESPONSE_FIXTURES.trustline, 'getTransaction')
  },

  'trustline frozen off': async (api, address) => {
    const hash =
      'FE72FAD0FA7CA904FB6C633A1666EDF0B9C73B2F5A4555D37EEF2739A78A531B'
    const response = await api.getTransaction(hash)
    assertResultMatch(
      response,
      RESPONSE_FIXTURES.trustlineFrozenOff,
      'getTransaction'
    )
  },

  'trustline no quality': async (api, address) => {
    const hash =
      'BAF1C678323C37CCB7735550C379287667D8288C30F83148AD3C1CB019FC9002'
    const response = await api.getTransaction(hash)
    assertResultMatch(
      response,
      RESPONSE_FIXTURES.trustlineNoQuality,
      'getTransaction'
    )
  },

  'trustline add memo': async (api, address) => {
    const hash =
      '9D6AC5FD6545B2584885B85E36759EB6440CDD41B6C55859F84AFDEE2B428220'
    const response = await api.getTransaction(hash)
    assertResultMatch(
      response,
      RESPONSE_FIXTURES.trustlineAddMemo,
      'getTransaction'
    )
  },

  'not validated': async (api, address) => {
    const hash =
      '4FB3ADF22F3C605E23FAEFAA185F3BD763C4692CAC490D9819D117CD33BFAA10'
    await assertRejects(
      api.getTransaction(hash),
      NotFoundError,
      'Transaction not found'
    )
  },

  'tracking on': async (api, address) => {
    const hash =
      '8925FC8844A1E930E2CC76AD0A15E7665AFCC5425376D548BB1413F484C31B8C'
    const response = await api.getTransaction(hash)
    assertResultMatch(response, RESPONSE_FIXTURES.trackingOn, 'getTransaction')
  },

  'tracking off': async (api, address) => {
    const hash =
      'C8C5E20DFB1BF533D0D81A2ED23F0A3CBD1EF2EE8A902A1D760500473CC9C582'
    const response = await api.getTransaction(hash)
    assertResultMatch(response, RESPONSE_FIXTURES.trackingOff, 'getTransaction')
  },

  'set regular key': async (api, address) => {
    const hash =
      '278E6687C1C60C6873996210A6523564B63F2844FB1019576C157353B1813E60'
    const response = await api.getTransaction(hash)
    assertResultMatch(
      response,
      RESPONSE_FIXTURES.setRegularKey,
      'getTransaction'
    )
  },

  'not found in range': async (api, address) => {
    const hash =
      '809335DD3B0B333865096217AA2F55A4DF168E0198080B3A090D12D88880FF0E'
    const options = {
      minLedgerVersion: 32570,
      maxLedgerVersion: 32571
    }
    await assertRejects(api.getTransaction(hash, options), NotFoundError)
  },

  'not found by hash': async (api, address) => {
    const hash = hashes.NOTFOUND_TRANSACTION_HASH

    await assertRejects(api.getTransaction(hash), NotFoundError)
  },

  'missing ledger history': async (api, address) => {
    const hash = hashes.NOTFOUND_TRANSACTION_HASH
    // make gaps in history
    closeLedger(api.connection)

    await assertRejects(api.getTransaction(hash), MissingLedgerHistoryError)
  },

  'missing ledger history with ledger range': async (api, address) => {
    const hash = hashes.NOTFOUND_TRANSACTION_HASH
    const options = {
      minLedgerVersion: 32569,
      maxLedgerVersion: 32571
    }
    await assertRejects(
      api.getTransaction(hash, options),
      MissingLedgerHistoryError
    )
  },

  'not found - future maxLedgerVersion': async (api, address) => {
    const hash = hashes.NOTFOUND_TRANSACTION_HASH
    const options = {
      maxLedgerVersion: 99999999999
    }
    await assertRejects(
      api.getTransaction(hash, options),
      PendingLedgerVersionError,
      "maxLedgerVersion is greater than server's most recent validated ledger"
    )
  },

  'transaction not validated': async (api, address) => {
    const hash =
      '4FB3ADF22F3C605E23FAEFAA185F3BD763C4692CAC490D9819D117CD33BFAA11'
    await assertRejects(
      api.getTransaction(hash),
      NotFoundError,
      /Transaction has not been validated yet/
    )
  },

  'transaction ledger not found': async (api, address) => {
    const hash =
      '4FB3ADF22F3C605E23FAEFAA185F3BD763C4692CAC490D9819D117CD33BFAA12'
    await assertRejects(
      api.getTransaction(hash),
      NotFoundError,
      /ledger not found/
    )
  },

  'ledger missing close time': async (api, address) => {
    const hash =
      '0F7ED9F40742D8A513AE86029462B7A6768325583DF8EE21B7EC663019DD6A04'
    closeLedger(api.connection)
    await assertRejects(api.getTransaction(hash), UnexpectedError)
  },

  // Checks
  'CheckCreate': async (api, address) => {
    const hash =
      '605A2E2C8E48AECAF5C56085D1AEAA0348DC838CE122C9188F94EB19DA05C2FE'
    const response = await api.getTransaction(hash)
    assertResultMatch(response, RESPONSE_FIXTURES.checkCreate, 'getTransaction')
  },

  'CheckCreate with memo': async (api, address) => {
    const hash = hashes.WITH_MEMOS_CHECK_CREATE_TRANSACTION_HASH
    const response = await api.getTransaction(hash)
    assertResultMatch(response, RESPONSE_FIXTURES.checkCreateWithMemo, 'getTransaction')
  },

  'CheckCancel': async (api, address) => {
    const hash =
      'B4105D1B2D83819647E4692B7C5843D674283F669524BD50C9614182E3A12CD4'
    const response = await api.getTransaction(hash)
    assertResultMatch(response, RESPONSE_FIXTURES.checkCancel, 'getTransaction')
  },

  'CheckCancel with memo': async (api, address) => {
    const hash = hashes.WITH_MEMOS_CHECK_CANCEL_TRANSACTION_HASH
    const response = await api.getTransaction(hash)
    assertResultMatch(response, RESPONSE_FIXTURES.checkCancelWithMemo, 'getTransaction')
  },

  'CheckCash': async (api, address) => {
    const hash =
      '8321208465F70BA52C28BCC4F646BAF3B012BA13B57576C0336F42D77E3E0749'
    const response = await api.getTransaction(hash)
    assertResultMatch(response, RESPONSE_FIXTURES.checkCash, 'getTransaction')
  },

  'CheckCash with memo': async (api, address) => {
    const hash = hashes.WITH_MEMOS_CHECK_CASH_TRANSACTION_HASH
    const response = await api.getTransaction(hash)
    assertResultMatch(response, RESPONSE_FIXTURES.checkCashWithMemo, 'getTransaction')
  },

  // Escrows
  'EscrowCreation': async (api, address) => {
    const hash =
      '144F272380BDB4F1BD92329A2178BABB70C20F59042C495E10BF72EBFB408EE1'
    const response = await api.getTransaction(hash)
    assertResultMatch(
      response,
      RESPONSE_FIXTURES.escrowCreation,
      'getTransaction'
    )
  },

  'EscrowCancellation': async (api, address) => {
    const hash =
      'F346E542FFB7A8398C30A87B952668DAB48B7D421094F8B71776DA19775A3B22'
    const response = await api.getTransaction(hash)
    assertResultMatch(
      response,
      RESPONSE_FIXTURES.escrowCancellation,
      'getTransaction'
    )
  },

  'EscrowExecution': async (api, address) => {
    const options = {
      minLedgerVersion: 10,
      maxLedgerVersion: 15
    }
    const hash =
      'CC5277137B3F25EE8B86259C83CB0EAADE818505E4E9BCBF19B1AC6FD136993B'
    const response = await api.getTransaction(hash, options)
    assertResultMatch(
      response,
      RESPONSE_FIXTURES.escrowExecution,
      'getTransaction'
    )
  },

  'EscrowExecution simple': async (api, address) => {
    const hash =
      'CC5277137B3F25EE8B86259C83CB0EAADE818505E4E9BCBF19B1AC6FD1369931'
    const response = await api.getTransaction(hash)
    assertResultMatch(
      response,
      RESPONSE_FIXTURES.escrowExecutionSimple,
      'getTransaction'
    )
  },

  'PaymentChannelCreate': async (api, address) => {
    const hash =
      '0E9CA3AB1053FC0C1CBAA75F636FE1EC92F118C7056BBEF5D63E4C116458A16D'
    const response = await api.getTransaction(hash)
    assertResultMatch(
      response,
      RESPONSE_FIXTURES.paymentChannelCreate,
      'getTransaction'
    )
  },

  'PaymentChannelCreate with memo': async (api, address) => {
    const hash = hashes.WITH_MEMOS_PAYMENT_CHANNEL_CREATE_TRANSACTION_HASH
    const response = await api.getTransaction(hash)
    assertResultMatch(
      response,
      RESPONSE_FIXTURES.paymentChannelCreateWithMemo,
      'getTransaction'
    )
  },

  'PaymentChannelFund': async (api, address) => {
    const hash =
      'CD053D8867007A6A4ACB7A432605FE476D088DCB515AFFC886CF2B4EB6D2AE8B'
    const response = await api.getTransaction(hash)
    assertResultMatch(
      response,
      RESPONSE_FIXTURES.paymentChannelFund,
      'getTransaction'
    )
  },

  'PaymentChannelFund with memo': async (api, address) => {
    const hash = hashes.WITH_MEMOS_PAYMENT_CHANNEL_FUND_TRANSACTION_HASH
    const response = await api.getTransaction(hash)
    assertResultMatch(
      response,
      RESPONSE_FIXTURES.paymentChannelFundWithMemo,
      'getTransaction'
    )
  },

  'PaymentChannelClaim': async (api, address) => {
    const hash =
      '81B9ECAE7195EB6E8034AEDF44D8415A7A803E14513FDBB34FA984AB37D59563'
    const response = await api.getTransaction(hash)
    assertResultMatch(
      response,
      RESPONSE_FIXTURES.paymentChannelClaim,
      'getTransaction'
    )
  },

  'PaymentChannelClaim with memo': async (api, address) => {
    const hash = hashes.WITH_MEMOS_PAYMENT_CHANNEL_CLAIM_TRANSACTION_HASH
    const response = await api.getTransaction(hash)
    assertResultMatch(
      response,
      RESPONSE_FIXTURES.paymentChannelClaimWithMemo,
      'getTransaction'
    )
  },

  'AccountDelete': async (api, address) => {
    const hash =
      'EC2AB14028DC84DE525470AB4DAAA46358B50A8662C63804BFF38244731C0CB9'
    const response = await api.getTransaction(hash)
    assertResultMatch(
      response,
      RESPONSE_FIXTURES.accountDelete,
      'getTransaction'
    )
  },

  'AccountDelete with memo': async (api, address) => {
    const hash = hashes.WITH_MEMOS_ACCOUNT_DELETE_TRANSACTION_HASH
    const response = await api.getTransaction(hash)
    assertResultMatch(
      response,
      RESPONSE_FIXTURES.accountDeleteWithMemo,
      'getTransaction'
    )
  },

  'no Meta': async (api, address) => {
    const hash =
      'AFB3ADF22F3C605E23FAEFAA185F3BD763C4692CAC490D9819D117CD33BFAA1B'
    const response = await api.getTransaction(hash)
    assert.deepEqual(response, RESPONSE_FIXTURES.noMeta)
  },

  'Unrecognized transaction type': async (api, address) => {
    const hash =
      'AFB3ADF22F3C605E23FAEFAA185F3BD763C4692CAC490D9819D117CD33BFAA11'
    closeLedger(api.connection)
    const response = await api.getTransaction(hash)
    assert.strictEqual(
      // @ts-ignore
      response.specification.UNAVAILABLE,
      'Unrecognized transaction type.'
    )
  },

  'amendment': async (api, address) => {
    const hash =
      'A971B83ABED51D83749B73F3C1AAA627CD965AFF74BE8CD98299512D6FB0658F'
    const response = await api.getTransaction(hash)
    assertResultMatch(response, RESPONSE_FIXTURES.amendment)
  },

  'feeUpdate': async (api, address) => {
    const hash =
      'C6A40F56127436DCD830B1B35FF939FD05B5747D30D6542572B7A835239817AF'
    const response = await api.getTransaction(hash)
    assertResultMatch(response, RESPONSE_FIXTURES.feeUpdate)
  },

  'feeUpdate with memo': async (api, address) => {
    const hash = hashes.WITH_MEMOS_FEE_UPDATE_TRANSACTION_HASH
    const response = await api.getTransaction(hash)
    assertResultMatch(response, RESPONSE_FIXTURES.feeUpdateWithMemo)
  },

  'order with one memo': async (api, address) => {
    const hash =
      '995570FE1E40F42DF56BFC80503BA9E3C1229619C61A1C279A76BC0805036D74'
    const response = await api.getTransaction(hash)
    assertResultMatch(response, RESPONSE_FIXTURES.withMemo)
  },

  'order with more than one memo': async (api, address) => {
    const hash =
      '995570FE1E40F42DF56BFC80503BA9E3C1229619C61A1C279A76BC0805036D73'
    const response = await api.getTransaction(hash)
    assertResultMatch(response, RESPONSE_FIXTURES.withMemos)
  },

  'ticketCreate with memo': async (api, address) => {
    const hash = hashes.WITH_MEMOS_TICKET_CREATE_TRANSACTION_HASH
    const response = await api.getTransaction(hash)
    assertResultMatch(response, RESPONSE_FIXTURES.ticketCreateWithMemo)
  },

  'depositPreauth with memo': async (api, address) => {
    const hash = hashes.WITH_MEMOS_DEPOSIT_PREAUTH_TRANSACTION_HASH
    const response = await api.getTransaction(hash)
    assertResultMatch(response, RESPONSE_FIXTURES.depositPreauthWithMemo)
  }
}
