import _ from 'lodash'
import fs from 'fs'
import assert from 'assert'
import {Server as WebSocketServer} from 'ws'
import {EventEmitter2} from 'eventemitter2'
import fixtures from './fixtures/rippled'
import addresses from './fixtures/addresses.json'
import hashes from './fixtures/hashes.json'
import transactionsResponse from './fixtures/rippled/account-tx'
import accountLinesResponse from './fixtures/rippled/account-lines'
import accountObjectsResponse from './fixtures/rippled/account-objects'
import fullLedger from './fixtures/rippled/ledger-full-38129.json'
import {getFreePort} from './utils'

function isUSD(json) {
  return json === 'USD' || json === '0000000000000000000000005553440000000000'
}

function isBTC(json) {
  return json === 'BTC' || json === '0000000000000000000000004254430000000000'
}

function createResponse(request, response, overrides = {}) {
  const result = _.assign({}, response.result, overrides)
  const change =
    response.result && !_.isEmpty(overrides)
      ? {id: request.id, result: result}
      : {id: request.id}
  return JSON.stringify(_.assign({}, response, change))
}

function createLedgerResponse(request, response) {
  const newResponse = JSON.parse(createResponse(request, response))
  if (newResponse.result && newResponse.result.ledger) {
    if (!request.transactions) {
      delete newResponse.result.ledger.transactions
    }
    if (!request.accounts) {
      delete newResponse.result.ledger.accountState
    }
    // the following fields were not in the ledger response in the past
    if (newResponse.result.ledger.close_flags === undefined) {
      newResponse.result.ledger.close_flags = 0
    }
    if (newResponse.result.ledger.parent_close_time === undefined) {
      newResponse.result.ledger.parent_close_time =
        newResponse.result.ledger.close_time - 10
    }
  }
  return JSON.stringify(newResponse)
}

// We mock out WebSocketServer in these tests and add a lot of custom
// properties not defined on the normal WebSocketServer object.
type MockedWebSocketServer = any

export function createMockRippled(port) {
  const mock = new WebSocketServer({port: port}) as MockedWebSocketServer
  _.assign(mock, EventEmitter2.prototype)

  const close = mock.close
  mock.close = function () {
    if (mock.expectedRequests !== undefined) {
      const allRequestsMade = _.every(mock.expectedRequests, function (
        counter
      ) {
        return counter === 0
      })
      if (!allRequestsMade) {
        const json = JSON.stringify(mock.expectedRequests, null, 2)
        const indent = '      '
        const indented = indent + json.replace(/\n/g, '\n' + indent)
        assert(false, 'Not all expected requests were made:\n' + indented)
      }
    }
    close.call(mock)
  }

  mock.expect = function (expectedRequests) {
    mock.expectedRequests = expectedRequests
  }

  mock.on('connection', function (this: MockedWebSocketServer, conn: any) {
    if (mock.config.breakNextConnection) {
      mock.config.breakNextConnection = false
      conn.terminate()
      return
    }
    this.socket = conn
    conn.config = {}
    conn.on('message', function (requestJSON) {
      try {
        const request = JSON.parse(requestJSON)
        mock.emit('request_' + request.command, request, conn)
      } catch (err) {
        console.error('Error: ' + err.message)
        assert(false, err.message)
      }
    })
  })

  mock.config = {}

  mock.onAny(function (this: MockedWebSocketServer) {
    if (this.event.indexOf('request_') !== 0) {
      return
    }
    if (mock.listeners(this.event).length === 0) {
      throw new Error('No event handler registered for ' + this.event)
    }
    if (mock.expectedRequests === undefined) {
      return // TODO: fail here to require expectedRequests
    }
    const expectedCount = mock.expectedRequests[this.event]
    if (expectedCount === undefined || expectedCount === 0) {
      throw new Error('Unexpected request: ' + this.event)
    }
    mock.expectedRequests[this.event] -= 1
  })

  mock.on('request_config', function (request, conn) {
    assert.strictEqual(request.command, 'config')
    conn.config = _.assign(conn.config, request.data)
    conn.send(
      createResponse(request, {
        status: 'success',
        type: 'response',
        result: {}
      })
    )
  })

  mock.on('request_test_command', function (request, conn) {
    assert.strictEqual(request.command, 'test_command')
    if (request.data.disconnectIn) {
      setTimeout(conn.terminate.bind(conn), request.data.disconnectIn)
      conn.send(
        createResponse(request, {
          status: 'success',
          type: 'response',
          result: {}
        })
      )
    } else if (request.data.openOnOtherPort) {
      getFreePort().then((newPort) => {
        createMockRippled(newPort)
        conn.send(
          createResponse(request, {
            status: 'success',
            type: 'response',
            result: {port: newPort}
          })
        )
      })
    } else if (request.data.closeServerAndReopen) {
      setTimeout(() => {
        conn.terminate()
        close.call(mock, () => {
          setTimeout(() => {
            createMockRippled(port)
          }, request.data.closeServerAndReopen)
        })
      }, 10)
    } else if (request.data.unrecognizedResponse) {
      conn.send(
        createResponse(request, {
          status: 'unrecognized',
          type: 'response',
          result: {}
        })
      )
    }
  })

  mock.on('request_global_config', function (request, conn) {
    assert.strictEqual(request.command, 'global_config')
    mock.config = _.assign(conn.config, request.data)
    conn.send(
      createResponse(request, {
        status: 'success',
        type: 'response',
        result: {}
      })
    )
  })

  mock.on('request_echo', function (request, conn) {
    assert.strictEqual(request.command, 'echo')
    conn.send(JSON.stringify(request.data))
  })

  mock.on('request_server_info', function (request, conn) {
    assert.strictEqual(request.command, 'server_info')
    if (conn.config.highLoadFactor || conn.config.loadFactor) {
      const response = {
        id: 0,
        status: 'success',
        type: 'response',
        result: {
          info: {
            build_version: '0.24.0-rc1',
            complete_ledgers: '32570-6595042',
            hostid: 'ARTS',
            io_latency_ms: 1,
            last_close: {
              converge_time_s: 2.007,
              proposers: 4
            },
            load_factor: conn.config.loadFactor || 4294967296,
            peers: 53,
            pubkey_node: 'n94wWvFUmaKGYrKUGgpv1DyYgDeXRGdACkNQaSe7zJiy5Znio7UC',
            server_state: 'full',
            validated_ledger: {
              age: 5,
              base_fee_xrp: 0.00001,
              hash:
                '4482DEE5362332F54A4036ED57EE1767C9F33CF7CE5A6670355C16CECE381D46',
              reserve_base_xrp: 20,
              reserve_inc_xrp: 5,
              seq: 6595042
            },
            validation_quorum: 3
          }
        }
      }
      conn.send(createResponse(request, response))
    } else if (conn.config.returnErrorOnServerInfo) {
      conn.send(createResponse(request, fixtures.server_info.error))
    } else if (conn.config.disconnectOnServerInfo) {
      conn.close()
    } else if (conn.config.serverInfoWithoutValidated) {
      conn.send(createResponse(request, fixtures.server_info.noValidated))
    } else if (mock.config.returnSyncingServerInfo) {
      mock.config.returnSyncingServerInfo--
      conn.send(createResponse(request, fixtures.server_info.syncing))
    } else {
      conn.send(createResponse(request, fixtures.server_info.normal))
    }
  })

  mock.on('request_subscribe', function (request, conn) {
    assert.strictEqual(request.command, 'subscribe')
    if (request && request.streams === 'validations') {
      conn.send(createResponse(request, fixtures.subscribe_error))
    } else if (mock.config.returnEmptySubscribeRequest) {
      mock.config.returnEmptySubscribeRequest--
      conn.send(createResponse(request, fixtures.empty))
    } else if (request.accounts) {
      assert(_.indexOf(_.values(addresses), request.accounts[0]) !== -1)
    }
    conn.send(createResponse(request, fixtures.subscribe))
  })

  mock.on('request_unsubscribe', function (request, conn) {
    assert.strictEqual(request.command, 'unsubscribe')
    if (request.accounts) {
      assert(_.indexOf(_.values(addresses), request.accounts[0]) !== -1)
    } else {
      assert.deepEqual(request.streams, ['ledger', 'server'])
    }
    conn.send(createResponse(request, fixtures.unsubscribe))
  })

  mock.on('request_account_objects', function (request, conn) {
    assert.strictEqual(request.command, 'account_objects')
    if (request.account === addresses.ACCOUNT) {
      conn.send(accountObjectsResponse(request))
    } else {
      assert(false, 'Unrecognized account address: ' + request.account)
    }
  })

  mock.on('request_account_info', function (request, conn) {
    assert.strictEqual(request.command, 'account_info')
    if (request.account === addresses.ACCOUNT) {
      conn.send(createResponse(request, fixtures.account_info.normal))
    } else if (request.account === addresses.NOTFOUND) {
      conn.send(createResponse(request, fixtures.account_info.notfound))
    } else if (request.account === addresses.THIRD_ACCOUNT) {
      const response = Object.assign({}, fixtures.account_info.normal)
      response.Account = addresses.THIRD_ACCOUNT
      conn.send(createResponse(request, response))
    } else if (request.account === undefined) {
      const response = Object.assign(
        {},
        {
          error: 'invalidParams',
          error_code: 31,
          error_message: "Missing field 'account'.",
          id: 2,
          request: {command: 'account_info', id: 2},
          status: 'error',
          type: 'response'
        }
      )
      conn.send(createResponse(request, response))
    } else {
      const response = Object.assign(
        {},
        {
          account: request.account,
          error: 'actNotFound',
          error_code: 19,
          error_message: 'Account not found.',
          id: 2,
          ledger_current_index: 17714714,
          request:
            // This will be inaccurate, but that's OK because this is just a mock rippled
            {
              account: 'rogvkYnY8SWjxkJNgU4ZRVfLeRyt5DR9i',
              command: 'account_info',
              id: 2
            },

          status: 'error',
          type: 'response',
          validated: false
        }
      )
      conn.send(createResponse(request, response))
    }
  })

  mock.on('request_ledger', function (request, conn) {
    assert.strictEqual(request.command, 'ledger')
    if (request.ledger_index === 34) {
      conn.send(createLedgerResponse(request, fixtures.ledger.notFound))
    } else if (request.ledger_index === 6) {
      conn.send(createResponse(request, fixtures.ledger.withStateAsHashes))
    } else if (request.ledger_index === 9038215) {
      conn.send(createLedgerResponse(request, fixtures.ledger.withoutCloseTime))
    } else if (request.ledger_index === 4181996) {
      conn.send(createLedgerResponse(request, fixtures.ledger.withSettingsTx))
    } else if (
      request.ledger_index === 22420574 &&
      request.expand === true &&
      request.transactions === true
    ) {
      conn.send(
        createLedgerResponse(request, fixtures.ledger.withPartialPayment)
      )
    } else if (request.ledger_index === 100001) {
      conn.send(
        createLedgerResponse(request, fixtures.ledger.pre2014withPartial)
      )
    } else if (request.ledger_index === 38129) {
      const response = _.assign({}, fixtures.ledger.normal, {
        result: {ledger: fullLedger}
      })
      conn.send(createLedgerResponse(request, response))
    } else if (
      request.ledger_hash ===
      '15F20E5FA6EA9770BBFFDBD62787400960B04BE32803B20C41F117F41C13830D'
    ) {
      conn.send(createLedgerResponse(request, fixtures.ledger.normalByHash))
    } else if (
      request.ledger_index === 'validated' ||
      request.ledger_index === 14661789 ||
      request.ledger_index === 14661788 /* getTransaction - order */
    ) {
      conn.send(createLedgerResponse(request, fixtures.ledger.normal))
    } else {
      assert(false, 'Unrecognized ledger request: ' + JSON.stringify(request))
    }
  })

  mock.on('request_ledger_data', function (request, conn) {
    assert.strictEqual(request.command, 'ledger_data')
    if (request.marker) {
      conn.send(createResponse(request, fixtures.ledger_data.last_page))
    } else {
      conn.send(createResponse(request, fixtures.ledger_data.first_page))
    }
  })

  mock.on('request_ledger_entry', function (request, conn) {
    assert.strictEqual(request.command, 'ledger_entry')
    if (
      request.index ===
      'E30E709CF009A1F26E0E5C48F7AA1BFB79393764F15FB108BDC6E06D3CBD8415'
    ) {
      conn.send(createResponse(request, fixtures.payment_channel.normal))
    } else if (
      request.index ===
      'D77CD4713AA08195E6B6D0E5BC023DA11B052EBFF0B5B22EDA8AE85345BCF661'
    ) {
      conn.send(createResponse(request, fixtures.payment_channel.full))
    } else if (
      request.index ===
      '8EF9CCB9D85458C8D020B3452848BBB42EAFDDDB69A93DD9D1223741A4CA562B'
    ) {
      conn.send(createResponse(request, fixtures.escrow))
    } else {
      conn.send(createResponse(request, fixtures.ledger_entry.error))
    }
  })

  mock.on('request_ping', function (request, conn) {
    // NOTE: We give the response a timeout of 2 second, so that tests can
    // set their timeout threshold to greater than or less than this number
    // to test timeouts.
    setTimeout(() => {
      conn.send(
        createResponse(request, {
          result: {},
          status: 'success',
          type: 'response'
        })
      )
    }, 1000 * 2)
  })

  mock.on('request_tx', function (request, conn) {
    assert.strictEqual(request.command, 'tx')
    if (request.transaction === hashes.VALID_TRANSACTION_HASH) {
      conn.send(createResponse(request, fixtures.tx.Payment))
    } else if (
      request.transaction ===
      '4FB3ADF22F3C605E23FAEFAA185F3BD763C4692CAC490D9819D117CD33BFAA1B'
    ) {
      conn.send(createResponse(request, fixtures.tx.AccountSet))
    } else if (
      request.transaction ===
      '8925FC8844A1E930E2CC76AD0A15E7665AFCC5425376D548BB1413F484C31B8C'
    ) {
      conn.send(createResponse(request, fixtures.tx.AccountSetTrackingOn))
    } else if (
      request.transaction ===
      'C8C5E20DFB1BF533D0D81A2ED23F0A3CBD1EF2EE8A902A1D760500473CC9C582'
    ) {
      conn.send(createResponse(request, fixtures.tx.AccountSetTrackingOff))
    } else if (
      request.transaction ===
      '278E6687C1C60C6873996210A6523564B63F2844FB1019576C157353B1813E60'
    ) {
      conn.send(createResponse(request, fixtures.tx.RegularKey))
    } else if (
      request.transaction ===
      '10A6FB4A66EE80BED46AAE4815D7DC43B97E944984CCD5B93BCF3F8538CABC51'
    ) {
      conn.send(createResponse(request, fixtures.tx.OfferCreate))
    } else if (
      request.transaction === hashes.WITH_MEMOS_OFFER_CREATE_TRANSACTION_HASH
    ) {
      conn.send(createResponse(request, fixtures.tx.OfferCreateWithMemo))
    } else if (
      request.transaction ===
      '458101D51051230B1D56E9ACAFAA34451BF65FA000F95DF6F0FF5B3A62D83FC2'
    ) {
      conn.send(createResponse(request, fixtures.tx.OfferCreateSell))
    } else if (
      request.transaction ===
      '809335DD3B0B333865096217AA2F55A4DF168E0198080B3A090D12D88880FF0E'
    ) {
      conn.send(createResponse(request, fixtures.tx.OfferCancel))
    } else if (
      request.transaction === hashes.WITH_MEMOS_ORDER_CANCELLATION_TRANSACTION_HASH
    ) {
      conn.send(createResponse(request, fixtures.tx.OfferCancelWithMemo))
    } else if (
      request.transaction ===
      '635A0769BD94710A1F6A76CDE65A3BC661B20B798807D1BBBDADCEA26420538D'
    ) {
      conn.send(createResponse(request, fixtures.tx.TrustSet))
    } else if (
      request.transaction ===
      '4FB3ADF22F3C605E23FAEFAA185F3BD763C4692CAC490D9819D117CD33BFAA11'
    ) {
      conn.send(createResponse(request, fixtures.tx.NoLedgerIndex))
    } else if (
      request.transaction ===
      '4FB3ADF22F3C605E23FAEFAA185F3BD763C4692CAC490D9819D117CD33BFAA12'
    ) {
      conn.send(createResponse(request, fixtures.tx.NoLedgerFound))
    } else if (
      request.transaction ===
      '0F7ED9F40742D8A513AE86029462B7A6768325583DF8EE21B7EC663019DD6A04'
    ) {
      conn.send(createResponse(request, fixtures.tx.LedgerWithoutTime))
    } else if (
      request.transaction ===
      'FE72FAD0FA7CA904FB6C633A1666EDF0B9C73B2F5A4555D37EEF2739A78A531B'
    ) {
      conn.send(createResponse(request, fixtures.tx.TrustSetFrozenOff))
    } else if (
      request.transaction ===
      'BAF1C678323C37CCB7735550C379287667D8288C30F83148AD3C1CB019FC9002'
    ) {
      conn.send(createResponse(request, fixtures.tx.TrustSetNoQuality))
    } else if (
      request.transaction ===
      '9D6AC5FD6545B2584885B85E36759EB6440CDD41B6C55859F84AFDEE2B428220'
    ) {
      conn.send(createResponse(request, fixtures.tx.TrustSetAddMemo))
    } else if (
      request.transaction ===
      '4FB3ADF22F3C605E23FAEFAA185F3BD763C4692CAC490D9819D117CD33BFAA10'
    ) {
      conn.send(createResponse(request, fixtures.tx.NotValidated))
    } else if (request.transaction === hashes.NOTFOUND_TRANSACTION_HASH) {
      conn.send(createResponse(request, fixtures.tx.NotFound))
    } else if (request.transaction === hashes.WITH_MEMOS_ACCOUNT_DELETE_TRANSACTION_HASH) {
      conn.send(createResponse(request, fixtures.tx.AccountDeleteWithMemo))
    } else if (
      request.transaction ===
      '097B9491CC76B64831F1FEA82EAA93BCD728106D90B65A072C933888E946C40B'
    ) {
      conn.send(createResponse(request, fixtures.tx.OfferWithExpiration))
    } else if (
      request.transaction === hashes.WITH_MEMO_TRANSACTION_HASH
    ) {
      conn.send(createResponse(request, fixtures.tx.WithMemo))
    } else if (
      request.transaction === hashes.WITH_MEMOS_TRANSACTION_HASH
    ) {
      conn.send(createResponse(request, fixtures.tx.WithMemos))
    }


    // Checks
    else if (
      request.transaction ===
      '605A2E2C8E48AECAF5C56085D1AEAA0348DC838CE122C9188F94EB19DA05C2FE'
    ) {
      conn.send(createResponse(request, fixtures.tx.CheckCreate))
    } else if (
      request.transaction === hashes.WITH_MEMOS_CHECK_CREATE_TRANSACTION_HASH
    ) {
      conn.send(createResponse(request, fixtures.tx.CheckCreateWithMemo))
    } else if (
      request.transaction ===
      'B4105D1B2D83819647E4692B7C5843D674283F669524BD50C9614182E3A12CD4'
    ) {
      conn.send(createResponse(request, fixtures.tx.CheckCancel))
    } else if (
      request.transaction === hashes.WITH_MEMOS_CHECK_CANCEL_TRANSACTION_HASH
    ) {
      conn.send(createResponse(request, fixtures.tx.CheckCancelWithMemo))
    } else if (
      request.transaction ===
      '8321208465F70BA52C28BCC4F646BAF3B012BA13B57576C0336F42D77E3E0749'
    ) {
      conn.send(createResponse(request, fixtures.tx.CheckCash))
    } else if (
      request.transaction === hashes.WITH_MEMOS_CHECK_CASH_TRANSACTION_HASH
    ) {
      conn.send(createResponse(request, fixtures.tx.CheckCashWithMemo))
    }

    // Escrows
    else if (
      request.transaction ===
      '144F272380BDB4F1BD92329A2178BABB70C20F59042C495E10BF72EBFB408EE1'
    ) {
      conn.send(createResponse(request, fixtures.tx.EscrowCreation))
    } else if (
      request.transaction ===
      'F346E542FFB7A8398C30A87B952668DAB48B7D421094F8B71776DA19775A3B22'
    ) {
      conn.send(createResponse(request, fixtures.tx.EscrowCancellation))
    } else if (
      request.transaction ===
      'CC5277137B3F25EE8B86259C83CB0EAADE818505E4E9BCBF19B1AC6FD136993B'
    ) {
      conn.send(createResponse(request, fixtures.tx.EscrowExecution))
    } else if (
      request.transaction ===
      'CC5277137B3F25EE8B86259C83CB0EAADE818505E4E9BCBF19B1AC6FD1369931'
    ) {
      conn.send(createResponse(request, fixtures.tx.EscrowExecutionSimple))
    }

    // Payment Channels
    else if (
      request.transaction ===
      '0E9CA3AB1053FC0C1CBAA75F636FE1EC92F118C7056BBEF5D63E4C116458A16D'
    ) {
      conn.send(createResponse(request, fixtures.tx.PaymentChannelCreate))
    } else if (
      request.transaction === hashes.WITH_MEMOS_PAYMENT_CHANNEL_CREATE_TRANSACTION_HASH
    ) {
      conn.send(createResponse(request, fixtures.tx.PaymentChannelCreateWithMemo))
    } else if (
      request.transaction ===
      'CD053D8867007A6A4ACB7A432605FE476D088DCB515AFFC886CF2B4EB6D2AE8B'
    ) {
      conn.send(createResponse(request, fixtures.tx.PaymentChannelFund))
    } else if (
      request.transaction === hashes.WITH_MEMOS_PAYMENT_CHANNEL_FUND_TRANSACTION_HASH
    ) {
      conn.send(createResponse(request, fixtures.tx.PaymentChannelFundWithMemo))
    } else if (
      request.transaction ===
      '81B9ECAE7195EB6E8034AEDF44D8415A7A803E14513FDBB34FA984AB37D59563'
    ) {
      conn.send(createResponse(request, fixtures.tx.PaymentChannelClaim))
    } else if (
      request.transaction === hashes.WITH_MEMOS_PAYMENT_CHANNEL_CLAIM_TRANSACTION_HASH
    ) {
      conn.send(createResponse(request, fixtures.tx.PaymentChannelClaimWithMemo))
    } else if (
      request.transaction ===
      'EC2AB14028DC84DE525470AB4DAAA46358B50A8662C63804BFF38244731C0CB9'
    ) {
      conn.send(createResponse(request, fixtures.tx.AccountDelete))
    } else if (
      request.transaction ===
      'AFB3ADF22F3C605E23FAEFAA185F3BD763C4692CAC490D9819D117CD33BFAA11'
    ) {
      conn.send(createResponse(request, fixtures.tx.Unrecognized))
    } else if (
      request.transaction ===
      'AFB3ADF22F3C605E23FAEFAA185F3BD763C4692CAC490D9819D117CD33BFAA1B'
    ) {
      conn.send(createResponse(request, fixtures.tx.NoMeta))
    } else if (
      request.transaction ===
      '4FB3ADF22F3C605E23FAEFAA185F3BD763C4692CAC490D9819D117CD33BFAA13'
    ) {
      conn.send(createResponse(request, fixtures.tx.LedgerZero))
    } else if (
      request.transaction ===
      'A971B83ABED51D83749B73F3C1AAA627CD965AFF74BE8CD98299512D6FB0658F'
    ) {
      conn.send(createResponse(request, fixtures.tx.Amendment))
    } else if (
      request.transaction ===
      'C6A40F56127436DCD830B1B35FF939FD05B5747D30D6542572B7A835239817AF'
    ) {
      conn.send(createResponse(request, fixtures.tx.SetFee))
    } else if (
      request.transaction === hashes.WITH_MEMOS_FEE_UPDATE_TRANSACTION_HASH
    ) {
      conn.send(createResponse(request, fixtures.tx.SetFeeWithMemo))
    } else if (
      request.transaction === hashes.WITH_MEMOS_TICKET_CREATE_TRANSACTION_HASH
    ) {
      conn.send(createResponse(request, fixtures.tx.TicketCreateWithMemo))
    } else if (
      request.transaction === hashes.WITH_MEMOS_DEPOSIT_PREAUTH_TRANSACTION_HASH
    ) {
      conn.send(createResponse(request, fixtures.tx.DepositPreauthWithMemo))
    } else {
      assert(false, 'Unrecognized transaction hash: ' + request.transaction)
    }
  })

  mock.on('request_submit', function (request, conn) {
    assert.strictEqual(request.command, 'submit')
    if (request.tx_blob === 'BAD') {
      conn.send(createResponse(request, fixtures.submit.failure))
    } else {
      conn.send(createResponse(request, fixtures.submit.success))
    }
  })

  mock.on('request_submit_multisigned', function (request, conn) {
    assert.strictEqual(request.command, 'submit_multisigned')
    conn.send(createResponse(request, fixtures.submit.success))
  })

  mock.on('request_account_lines', function (request, conn) {
    if (request.account === addresses.ACCOUNT) {
      conn.send(accountLinesResponse.normal(request))
    } else if (request.account === addresses.OTHER_ACCOUNT) {
      conn.send(accountLinesResponse.counterparty(request))
    } else if (request.account === addresses.THIRD_ACCOUNT) {
      conn.send(accountLinesResponse.manyItems(request))
    } else if (request.account === addresses.NOTFOUND) {
      conn.send(createResponse(request, fixtures.account_info.notfound))
    } else {
      assert(false, 'Unrecognized account address: ' + request.account)
    }
  })

  mock.on('request_account_tx', function (request, conn) {
    if (request.account === addresses.ACCOUNT) {
      conn.send(transactionsResponse(request))
    } else if (request.account === addresses.OTHER_ACCOUNT) {
      conn.send(createResponse(request, fixtures.account_tx.one))
    } else {
      assert(false, 'Unrecognized account address: ' + request.account)
    }
  })

  mock.on('request_account_offers', function (request, conn) {
    if (request.account === addresses.ACCOUNT) {
      conn.send(fixtures.account_offers(request))
    } else {
      assert(false, 'Unrecognized account address: ' + request.account)
    }
  })

  let requestsCache = undefined

  mock.on('request_book_offers', function (request, conn) {
    if (request.taker_pays.issuer === 'rp8rJYTpodf8qbSCHVTNacf8nSW8mRakFw') {
      conn.send(createResponse(request, fixtures.book_offers.xrp_usd))
    } else if (
      request.taker_gets.issuer === 'rp8rJYTpodf8qbSCHVTNacf8nSW8mRakFw'
    ) {
      conn.send(createResponse(request, fixtures.book_offers.usd_xrp))
    } else if (
      isBTC(request.taker_gets.currency) &&
      isUSD(request.taker_pays.currency)
    ) {
      conn.send(
        fixtures.book_offers.fabric.requestBookOffersBidsResponse(request)
      )
    } else if (
      isUSD(request.taker_gets.currency) &&
      isBTC(request.taker_pays.currency)
    ) {
      conn.send(
        fixtures.book_offers.fabric.requestBookOffersAsksResponse(request)
      )
    } else {
      const rippledDir = 'test/fixtures/rippled'
      if (!requestsCache) {
        requestsCache = fs.readdirSync(rippledDir + '/requests')
      }
      for (var i = 0; i < requestsCache.length; i++) {
        const file = requestsCache[i]
        const json = fs.readFileSync(rippledDir + '/requests/' + file, 'utf8')
        const r = JSON.parse(json)
        const requestWithoutId = Object.assign({}, request)
        delete requestWithoutId.id
        if (JSON.stringify(requestWithoutId) === JSON.stringify(r)) {
          const responseFile =
            rippledDir + '/responses/' + file.split('.')[0] + '-res.json'
          const res = fs.readFileSync(responseFile, 'utf8')
          const response = createResponse(request, {
            id: 0,
            type: 'response',
            status: 'success',
            result: JSON.parse(res)
          })
          conn.send(response)
          return
        }
      }

      assert(false, 'Unrecognized order book: ' + JSON.stringify(request))
    }
  })

  mock.on('request_ripple_path_find', function (request, conn) {
    let response = null
    if (request.subcommand === 'close') {
      // for path_find command
      return
    }
    if (request.source_account === 'rB2NTuTTS3eNCsWxZYzJ4wqRqxNLZqA9Vx') {
      // getPaths - result path has source_amount in drops
      response = createResponse(request, {
        id: 0,
        type: 'response',
        status: 'success',
        result: {
          alternatives: [
            {
              destination_amount: {
                currency: 'EUR',
                issuer: 'rGpGaj4sxEZGenW1prqER25EUi7x4fqK9u',
                value: '1'
              },
              paths_canonical: [],
              paths_computed: [
                [
                  {
                    currency: 'USD',
                    issuer: 'rGpGaj4sxEZGenW1prqER25EUi7x4fqK9u',
                    type: 48,
                    type_hex: '0000000000000030'
                  },
                  {
                    currency: 'EUR',
                    issuer: 'rGpGaj4sxEZGenW1prqER25EUi7x4fqK9u',
                    type: 48,
                    type_hex: '0000000000000030'
                  }
                ]
              ],
              source_amount: '1000000'
            }
          ],
          destination_account: 'rhpJkBfZGQyT1xeDbwtKEuSrSXw3QZSAy5',
          destination_amount: {
            currency: 'EUR',
            issuer: 'rGpGaj4sxEZGenW1prqER25EUi7x4fqK9u',
            value: '-1'
          },
          destination_currencies: ['EUR', 'XRP'],
          full_reply: true,
          id: 2,
          source_account: 'rB2NTuTTS3eNCsWxZYzJ4wqRqxNLZqA9Vx',
          status: 'success'
        }
      })
    } else if (request.source_account === addresses.NOTFOUND) {
      response = createResponse(request, fixtures.path_find.srcActNotFound)
    } else if (request.source_account === addresses.SOURCE_LOW_FUNDS) {
      response = createResponse(request, fixtures.path_find.sourceAmountLow)
    } else if (request.source_account === addresses.OTHER_ACCOUNT) {
      response = createResponse(request, fixtures.path_find.sendUSD)
    } else if (request.source_account === addresses.THIRD_ACCOUNT) {
      response = createResponse(request, fixtures.path_find.XrpToXrp, {
        destination_amount: request.destination_amount,
        destination_address: request.destination_address
      })
    } else if (request.source_account === addresses.ACCOUNT) {
      if (
        request.destination_account === 'ra5nK24KXen9AHvsdFTKHSANinZseWnPcX' &&
        // Important: Ensure that destination_amount.value is correct
        request.destination_amount.value === '-1'
      ) {
        response = createResponse(request, fixtures.path_find.sendAll)
      } else {
        response = fixtures.path_find.generate.generateIOUPaymentPaths(
          request.id,
          request.source_account,
          request.destination_account,
          request.destination_amount
        )
      }
    } else {
      assert(
        false,
        'Unrecognized path find request: ' + JSON.stringify(request)
      )
    }
    conn.send(response)
  })

  mock.on('request_gateway_balances', function (request, conn) {
    if (request.ledger_index === 123456) {
      conn.send(createResponse(request, fixtures.unsubscribe))
    } else {
      conn.send(createResponse(request, fixtures.gateway_balances))
    }
  })

  return mock
}
