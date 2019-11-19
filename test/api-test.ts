import assert from 'assert-diff';
import BigNumber from 'bignumber.js';
import _ from 'lodash';
import {RippleAPI} from 'ripple-api';
import {RecursiveData} from 'ripple-api/ledger/utils';
import binary from 'ripple-binary-codec';
import requests from './fixtures/requests';
import responses from './fixtures/responses';
import addresses from './fixtures/addresses.json';
import ledgerClosed from './fixtures/rippled/ledger-close-newer.json';
import setupAPI from './setup-api';
const {validate, schemaValidator} = RippleAPI._PRIVATE;
const address = addresses.ACCOUNT;
const utils = RippleAPI._PRIVATE.ledgerUtils;
assert.options.strict = true;

// how long before each test case times out
const TIMEOUT = 20000;

function closeLedger(connection) {
  connection._ws.emit('message', JSON.stringify(ledgerClosed));
}

function checkResult(expected, schemaName, response) {
  if (expected.txJSON) {
    assert(response.txJSON);
    assert.deepEqual(JSON.parse(response.txJSON), JSON.parse(expected.txJSON));
  }
  if (expected.tx_json) {
    assert(response.tx_json);
    assert.deepEqual(response.tx_json, expected.tx_json);
  }
  assert.deepEqual(_.omit(response, ['txJSON', 'tx_json']), _.omit(expected, ['txJSON', 'tx_json']))
  if (schemaName) {
    schemaValidator.schemaValidate(schemaName, response);
  }
  return response;
}


describe('RippleAPI', function () {
  this.timeout(TIMEOUT);
  const instructionsWithMaxLedgerVersionOffset = { maxLedgerVersionOffset: 100 };
  beforeEach(setupAPI.setup);
  afterEach(setupAPI.teardown);

  it('error inspect', function () {
    const error = new this.api.errors.RippleError('mess', { data: 1 });
    assert.strictEqual(error.inspect(), '[RippleError(mess, { data: 1 })]');
  });



  describe('isValidAddress', function () {
    it('returns true for valid address', function () {
      assert(this.api.isValidAddress('rLczgQHxPhWtjkaQqn3Q6UM8AbRbbRvs5K'));
      assert(this.api.isValidAddress(addresses.ACCOUNT_X));
      assert(this.api.isValidAddress(addresses.ACCOUNT_T));
    })

    it('returns false for invalid address', function () {
      assert(!this.api.isValidAddress('foobar'));
      assert(!this.api.isValidAddress(addresses.ACCOUNT_X.slice(0, -1)));
      assert(!this.api.isValidAddress(addresses.ACCOUNT_T.slice(1)));
    })
  })

  describe('isValidSecret', function () {
    it('returns true for valid secret', function () {
      assert(this.api.isValidSecret('snsakdSrZSLkYpCXxfRkS4Sh96PMK'));
    })

    it('returns false for invalid secret', function () {
      assert(!this.api.isValidSecret('foobar'));
    })
  })

  describe('deriveKeypair', function () {
    it('returns keypair for secret', function () {
      var keypair = this.api.deriveKeypair('snsakdSrZSLkYpCXxfRkS4Sh96PMK');
      assert.equal(keypair.privateKey, '008850736302221AFD59FF9CA1A29D4975F491D726249302EE48A3078A8934D335');
      assert.equal(keypair.publicKey, '035332FBA71D705BD5D97014A833BE2BBB25BEFCD3506198E14AFEA241B98C2D06');
    })

    it('returns keypair for ed25519 secret', function () {
      var keypair = this.api.deriveKeypair('sEdV9eHWbibBnTj7b1H5kHfPfv7gudx');
      assert.equal(keypair.privateKey, 'ED5C2EF6C2E3200DFA6B72F47935C7F64D35453646EA34919192538F458C7BC30F');
      assert.equal(keypair.publicKey, 'ED0805EC4E728DB87C0CA6C420751F296C57A5F42D02E9E6150CE60694A44593E5');
    })

    it('throws with an invalid secret', function (){
      assert.throws(() => {
        this.api.deriveKeypair('...');
      }, /^Error: Non-base58 character$/)
    })
  })
  
  describe('deriveAddress', function () {
    it('returns address for public key', function () {
      var address = this.api.deriveAddress('035332FBA71D705BD5D97014A833BE2BBB25BEFCD3506198E14AFEA241B98C2D06');
      assert.equal(address, 'rLczgQHxPhWtjkaQqn3Q6UM8AbRbbRvs5K');
    })
  })

  describe('deriveXAddress', function () {
    it('returns address for public key', function () {
      assert.equal(RippleAPI.deriveXAddress({
        publicKey: '035332FBA71D705BD5D97014A833BE2BBB25BEFCD3506198E14AFEA241B98C2D06',
        tag: false,
        test: false
      }), 'XVZVpQj8YSVpNyiwXYSqvQoQqgBttTxAZwMcuJd4xteQHyt');
      assert.equal(RippleAPI.deriveXAddress({
        publicKey: '035332FBA71D705BD5D97014A833BE2BBB25BEFCD3506198E14AFEA241B98C2D06',
        tag: false,
        test: true
      }), 'TVVrSWtmQQssgVcmoMBcFQZKKf56QscyWLKnUyiuZW8ALU4');
    })
  })

  describe('pagination', function () {

    describe('hasNextPage', function () {

      it('returns true when there is another page', function () {
        return this.api.request('ledger_data').then(response => {
            assert(this.api.hasNextPage(response));
          }
        );
      });

      it('returns false when there are no more pages', function () {
        return this.api.request('ledger_data').then(response => {
          return this.api.requestNextPage('ledger_data', {}, response);
        }).then(response => {
          assert(!this.api.hasNextPage(response));
        });
      });

    });

    describe('requestNextPage', function () {

      it('requests the next page', function () {
        return this.api.request('ledger_data').then(response => {
          return this.api.requestNextPage('ledger_data', {}, response);
        }).then(response => {
          assert.equal(response.state[0].index, '000B714B790C3C79FEE00D17C4DEB436B375466F29679447BA64F265FD63D731')
        });
      });

      it('rejects when there are no more pages', function () {
        return this.api.request('ledger_data').then(response => {
          return this.api.requestNextPage('ledger_data', {}, response);
        }).then(response => {
          assert(!this.api.hasNextPage(response))
          return this.api.requestNextPage('ledger_data', {}, response);
        }).then(() => {
          assert(false, 'Should reject');
        }).catch(error => {
          assert(error instanceof Error);
          assert.equal(error.message, 'response does not have a next page')
        });
      });

    });

  });

  it('prepareOrder - buy order', function () {
    const request = requests.prepareOrder.buy;
    return this.api.prepareOrder(address, request)
      .then(_.partial(checkResult, responses.prepareOrder.buy, 'prepare'));
  });

  it('prepareOrder - buy order with expiration', function () {
    const request = requests.prepareOrder.expiration;
    const response = responses.prepareOrder.expiration;
    return this.api.prepareOrder(address, request, instructionsWithMaxLedgerVersionOffset)
      .then(_.partial(checkResult, response, 'prepare'));
  });

  it('prepareOrder - sell order', function () {
    const request = requests.prepareOrder.sell;
    return this.api.prepareOrder(address, request, instructionsWithMaxLedgerVersionOffset).then(
      _.partial(checkResult, responses.prepareOrder.sell, 'prepare'));
  });

  it('prepareOrder - invalid', function (done) {
    const request = Object.assign({}, requests.prepareOrder.sell);
    delete request.direction; // Make invalid
    try {
      this.api.prepareOrder(address, request, instructionsWithMaxLedgerVersionOffset).then(prepared => {
        done(new Error('Expected method to reject. Prepared transaction: ' + JSON.stringify(prepared)));
      }).catch(err => {
        assert.strictEqual(err.name, 'ValidationError');
        assert.strictEqual(err.message, 'instance.order requires property "direction"');
        done();
      }).catch(done); // Finish test with assertion failure immediately instead of waiting for timeout.
    } catch (err) {
      done(new Error('Expected method to reject, but method threw. Thrown: ' + err));
    }
  });

  it('prepareOrderCancellation', function () {
    const request = requests.prepareOrderCancellation.simple;
    return this.api.prepareOrderCancellation(address, request, instructionsWithMaxLedgerVersionOffset)
      .then(_.partial(checkResult, responses.prepareOrderCancellation.normal,
        'prepare'));
  });

  it('prepareOrderCancellation - no instructions', function () {
    const request = requests.prepareOrderCancellation.simple;
    return this.api.prepareOrderCancellation(address, request)
      .then(_.partial(checkResult,
        responses.prepareOrderCancellation.noInstructions,
        'prepare'));
  });

  it('prepareOrderCancellation - with memos', function () {
    const request = requests.prepareOrderCancellation.withMemos;
    return this.api.prepareOrderCancellation(address, request)
      .then(_.partial(checkResult,
        responses.prepareOrderCancellation.withMemos,
        'prepare'));
  });

  it('prepareOrderCancellation - invalid', function (done) {
    const request = Object.assign({}, requests.prepareOrderCancellation.withMemos);
    delete request.orderSequence; // Make invalid
    try {
      this.api.prepareOrderCancellation(address, request).then(prepared => {
        done(new Error('Expected method to reject. Prepared transaction: ' + JSON.stringify(prepared)));
      }).catch(err => {
        assert.strictEqual(err.name, 'ValidationError');
        assert.strictEqual(err.message, 'instance.orderCancellation requires property "orderSequence"');
        done();
      }).catch(done); // Finish test with assertion failure immediately instead of waiting for timeout.
    } catch (err) {
      done(new Error('Expected method to reject, but method threw. Thrown: ' + err));
    }
  });

  it('prepareTrustline - simple', function () {
    return this.api.prepareTrustline(
      address, requests.prepareTrustline.simple, instructionsWithMaxLedgerVersionOffset).then(
        _.partial(checkResult, responses.prepareTrustline.simple, 'prepare'));
  });

  it('prepareTrustline - frozen', function () {
    return this.api.prepareTrustline(
      address, requests.prepareTrustline.frozen).then(
        _.partial(checkResult, responses.prepareTrustline.frozen, 'prepare'));
  });

  it('prepareTrustline - complex', function () {
    return this.api.prepareTrustline(
      address, requests.prepareTrustline.complex, instructionsWithMaxLedgerVersionOffset).then(
        _.partial(checkResult, responses.prepareTrustline.complex, 'prepare'));
  });

  it('prepareTrustline - invalid', function (done) {
    const trustline = Object.assign({}, requests.prepareTrustline.complex);
    delete trustline.limit; // Make invalid
    try {
      this.api.prepareTrustline(
        address, trustline, instructionsWithMaxLedgerVersionOffset).then(prepared => {
        done(new Error('Expected method to reject. Prepared transaction: ' + JSON.stringify(prepared)));
      }).catch(err => {
        assert.strictEqual(err.name, 'ValidationError');
        assert.strictEqual(err.message, 'instance.trustline requires property "limit"');
        done();
      }).catch(done); // Finish test with assertion failure immediately instead of waiting for timeout.
    } catch (err) {
      done(new Error('Expected method to reject, but method threw. Thrown: ' + err));
    }
  });

  it('prepareEscrowCreation', function () {
    const localInstructions = _.defaults({
      maxFee: '0.000012'
    }, instructionsWithMaxLedgerVersionOffset);
    return this.api.prepareEscrowCreation(
      address, requests.prepareEscrowCreation.normal,
      localInstructions).then(
        _.partial(checkResult, responses.prepareEscrowCreation.normal,
          'prepare'));
  });

  it('prepareEscrowCreation full', function () {
    return this.api.prepareEscrowCreation(
      address, requests.prepareEscrowCreation.full).then(
        _.partial(checkResult, responses.prepareEscrowCreation.full,
          'prepare'));
  });

  it('prepareEscrowCreation - invalid', function (done) {
    const escrow = Object.assign({}, requests.prepareEscrowCreation.full);
    delete escrow.amount; // Make invalid
    try {
      this.api.prepareEscrowCreation(
        address, escrow).then(prepared => {
        done(new Error('Expected method to reject. Prepared transaction: ' + JSON.stringify(prepared)));
      }).catch(err => {
        assert.strictEqual(err.name, 'ValidationError');
        assert.strictEqual(err.message, 'instance.escrowCreation requires property "amount"');
        done();
      }).catch(done); // Finish test with assertion failure immediately instead of waiting for timeout.
    } catch (err) {
      done(new Error('Expected method to reject, but method threw. Thrown: ' + err));
    }
  });

  it('prepareEscrowExecution', function () {
    return this.api.prepareEscrowExecution(
      address,
      requests.prepareEscrowExecution.normal, instructionsWithMaxLedgerVersionOffset).then(
        _.partial(checkResult,
          responses.prepareEscrowExecution.normal,
          'prepare'));
  });

  it('prepareEscrowExecution - simple', function () {
    return this.api.prepareEscrowExecution(
      address,
      requests.prepareEscrowExecution.simple).then(
        _.partial(checkResult,
          responses.prepareEscrowExecution.simple,
          'prepare'));
  });

  it('prepareEscrowExecution - no condition', function (done) {
    try {
      this.api.prepareEscrowExecution(address,
        requests.prepareEscrowExecution.noCondition, instructionsWithMaxLedgerVersionOffset).then(prepared => {
        done(new Error('Expected method to reject. Prepared transaction: ' + JSON.stringify(prepared)));
      }).catch(err => {
        assert.strictEqual(err.name, 'ValidationError');
        assert.strictEqual(err.message, '"condition" and "fulfillment" fields on EscrowFinish must only be specified together.');
        done();
      }).catch(done); // Finish test with assertion failure immediately instead of waiting for timeout.
    } catch (err) {
      done(new Error('Expected method to reject, but method threw. Thrown: ' + err));
    }
  });

  it('prepareEscrowExecution - no fulfillment', function (done) {
    try {
      this.api.prepareEscrowExecution(address,
        requests.prepareEscrowExecution.noFulfillment, instructionsWithMaxLedgerVersionOffset).then(prepared => {
        done(new Error('Expected method to reject. Prepared transaction: ' + JSON.stringify(prepared)));
      }).catch(err => {
        assert.strictEqual(err.name, 'ValidationError');
        assert.strictEqual(err.message, '"condition" and "fulfillment" fields on EscrowFinish must only be specified together.');
        done();
      }).catch(done); // Finish test with assertion failure immediately instead of waiting for timeout.
    } catch (err) {
      done(new Error('Expected method to reject, but method threw. Thrown: ' + err));
    }
  });

  it('prepareEscrowCancellation', function () {
    return this.api.prepareEscrowCancellation(
      address,
      requests.prepareEscrowCancellation.normal, instructionsWithMaxLedgerVersionOffset).then(
        _.partial(checkResult,
          responses.prepareEscrowCancellation.normal,
          'prepare'));
  });

  it('prepareEscrowCancellation with memos', function () {
    return this.api.prepareEscrowCancellation(
      address,
      requests.prepareEscrowCancellation.memos).then(
        _.partial(checkResult,
          responses.prepareEscrowCancellation.memos,
          'prepare'));
  });

  it('prepareCheckCreate', function () {
    const localInstructions = _.defaults({
      maxFee: '0.000012'
    }, instructionsWithMaxLedgerVersionOffset);
    return this.api.prepareCheckCreate(
      address, requests.prepareCheckCreate.normal,
      localInstructions).then(
        _.partial(checkResult, responses.prepareCheckCreate.normal,
          'prepare'));
  });

  it('prepareCheckCreate full', function () {
    return this.api.prepareCheckCreate(
      address, requests.prepareCheckCreate.full).then(
        _.partial(checkResult, responses.prepareCheckCreate.full,
          'prepare'));
  });

  it('prepareCheckCash amount', function () {
    return this.api.prepareCheckCash(
      address, requests.prepareCheckCash.amount).then(
        _.partial(checkResult, responses.prepareCheckCash.amount,
          'prepare'));
  });

  it('prepareCheckCash deliverMin', function () {
    return this.api.prepareCheckCash(
      address, requests.prepareCheckCash.deliverMin).then(
        _.partial(checkResult, responses.prepareCheckCash.deliverMin,
          'prepare'));
  });

  it('prepareCheckCancel', function () {
    return this.api.prepareCheckCancel(
      address, requests.prepareCheckCancel.normal).then(
        _.partial(checkResult, responses.prepareCheckCancel.normal,
          'prepare'));
  });

  it('preparePaymentChannelCreate', function () {
    const localInstructions = _.defaults({
      maxFee: '0.000012'
    }, instructionsWithMaxLedgerVersionOffset);
    return this.api.preparePaymentChannelCreate(
      address, requests.preparePaymentChannelCreate.normal,
      localInstructions).then(
        _.partial(checkResult, responses.preparePaymentChannelCreate.normal,
          'prepare'));
  });

  it('preparePaymentChannelCreate full', function () {
    return this.api.preparePaymentChannelCreate(
      address, requests.preparePaymentChannelCreate.full).then(
        _.partial(checkResult, responses.preparePaymentChannelCreate.full,
          'prepare'));
  });

  it('preparePaymentChannelFund', function () {
    const localInstructions = _.defaults({
      maxFee: '0.000012'
    }, instructionsWithMaxLedgerVersionOffset);
    return this.api.preparePaymentChannelFund(
      address, requests.preparePaymentChannelFund.normal,
      localInstructions).then(
        _.partial(checkResult, responses.preparePaymentChannelFund.normal,
          'prepare'));
  });

  it('preparePaymentChannelFund full', function () {
    return this.api.preparePaymentChannelFund(
      address, requests.preparePaymentChannelFund.full).then(
        _.partial(checkResult, responses.preparePaymentChannelFund.full,
          'prepare'));
  });

  it('submit', function () {
    return this.api.submit(responses.sign.normal.signedTransaction).then(response => {
      checkResult(responses.submit, 'submit', response);
    });
  });

  it('submit - failure', function () {
    return this.api.submit('BAD').then(() => {
      assert(false, 'Should throw RippledError');
    }).catch(error => {
      assert(error instanceof this.api.errors.RippledError);
      assert.strictEqual(error.data.resultCode, 'temBAD_FEE');
    });
  });

  it('signPaymentChannelClaim', function () {
    const privateKey =
      'ACCD3309DB14D1A4FC9B1DAE608031F4408C85C73EE05E035B7DC8B25840107A';
    const result = this.api.signPaymentChannelClaim(
      requests.signPaymentChannelClaim.channel,
      requests.signPaymentChannelClaim.amount, privateKey);
    checkResult(responses.signPaymentChannelClaim,
      'signPaymentChannelClaim', result)
  });

  it('verifyPaymentChannelClaim', function () {
    const publicKey =
      '02F89EAEC7667B30F33D0687BBA86C3FE2A08CCA40A9186C5BDE2DAA6FA97A37D8';
    const result = this.api.verifyPaymentChannelClaim(
      requests.signPaymentChannelClaim.channel,
      requests.signPaymentChannelClaim.amount,
      responses.signPaymentChannelClaim, publicKey);
    checkResult(true, 'verifyPaymentChannelClaim', result)
  });

  it('verifyPaymentChannelClaim - invalid', function () {
    const publicKey =
      '03A6523FE4281DA48A6FD77FAF3CB77F5C7001ABA0B32BCEDE0369AC009758D7D9';
    const result = this.api.verifyPaymentChannelClaim(
      requests.signPaymentChannelClaim.channel,
      requests.signPaymentChannelClaim.amount,
      responses.signPaymentChannelClaim, publicKey);
    checkResult(false,
      'verifyPaymentChannelClaim', result)
  });

  it('combine', function () {
    const combined = this.api.combine(requests.combine.setDomain);
    checkResult(responses.combine.single, 'sign', combined);
  });

  it('combine - different transactions', function () {
    const request = [requests.combine.setDomain[0]];
    const tx = binary.decode(requests.combine.setDomain[0]);
    tx.Flags = 0;
    request.push(binary.encode(tx));
    assert.throws(() => {
      this.api.combine(request);
    }, /txJSON is not the same for all signedTransactions/);
  });

  describe('RippleAPI', function () {

    it('getBalances', function () {
      return this.api.getBalances(address).then(
        _.partial(checkResult, responses.getBalances, 'getBalances'));
    });

    it('getBalances - limit', function () {
      const options = {
        limit: 3,
        ledgerVersion: 123456
      };
      const expectedResponse = responses.getBalances.slice(0, 3);
      return this.api.getBalances(address, options).then(
        _.partial(checkResult, expectedResponse, 'getBalances'));
    });

    it('getBalances - limit & currency', function () {
      const options = {
        currency: 'USD',
        limit: 3
      };
      const expectedResponse = _.filter(responses.getBalances,
        item => item.currency === 'USD').slice(0, 3);
      return this.api.getBalances(address, options).then(
        _.partial(checkResult, expectedResponse, 'getBalances'));
    });

    it('getBalances - limit & currency & issuer', function () {
      const options = {
        currency: 'USD',
        counterparty: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
        limit: 3
      };
      const expectedResponse = _.filter(responses.getBalances,
        item => item.currency === 'USD' &&
          item.counterparty === 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B').slice(0, 3);
      return this.api.getBalances(address, options).then(
        _.partial(checkResult, expectedResponse, 'getBalances'));
    });
  });

  it('getBalanceSheet', function () {
    return this.api.getBalanceSheet(address).then(
      _.partial(checkResult, responses.getBalanceSheet, 'getBalanceSheet'));
  });

  it('getBalanceSheet - invalid options', function () {
    return this.api.getBalanceSheet(address, { invalid: 'options' }).then(() => {
      assert(false, 'Should throw ValidationError');
    }).catch(error => {
      assert(error instanceof this.api.errors.ValidationError);
    });
  });

  it('getBalanceSheet - empty', function () {
    const options = { ledgerVersion: 123456 };
    return this.api.getBalanceSheet(address, options).then(
      _.partial(checkResult, {}, 'getBalanceSheet'));
  });

  it('getTrustlines - filtered', function () {
    const options = { currency: 'USD' };
    return this.api.getTrustlines(address, options).then(
      _.partial(checkResult,
        responses.getTrustlines.filtered, 'getTrustlines'));
  });

  it('getTrustlines - more than 400 items', function () {
    const options = { limit: 401 };
    return this.api.getTrustlines(addresses.THIRD_ACCOUNT, options).then(
      _.partial(checkResult, responses.getTrustlines.moreThan400Items, 'getTrustlines'));
  });

  it('getTrustlines - no options', function () {
    return this.api.getTrustlines(address).then(
      _.partial(checkResult, responses.getTrustlines.all, 'getTrustlines'));
  });

  it('generateAddress', function () {
    function random() {
      return _.fill(Array(16), 0);
    }
    assert.deepEqual(this.api.generateAddress({ entropy: random() }),
      responses.generateAddress);
  });

  it('generateAddress invalid', function () {
    assert.throws(() => {
      function random() {
        return _.fill(Array(1), 0);
      }
      this.api.generateAddress({ entropy: random() });
    }, this.api.errors.UnexpectedError);
  });

  it('generateXAddress', function () {
    function random() {
      return _.fill(Array(16), 0);
    }
    assert.deepEqual(this.api.generateXAddress({ entropy: random() }),
      responses.generateXAddress);
  });

  it('generateXAddress invalid', function () {
    assert.throws(() => {
      function random() {
        return _.fill(Array(1), 0);
      }
      this.api.generateXAddress({ entropy: random() });
    }, this.api.errors.UnexpectedError);
  });

  it('getSettings', function () {
    return this.api.getSettings(address).then(
      _.partial(checkResult, responses.getSettings, 'getSettings'));
  });

  it('getSettings - options undefined', function () {
    return this.api.getSettings(address, undefined).then(
      _.partial(checkResult, responses.getSettings, 'getSettings'));
  });

  it('getSettings - invalid options', function () {
    return this.api.getSettings(address, { invalid: 'options' }).then(() => {
      assert(false, 'Should throw ValidationError');
    }).catch(error => {
      assert(error instanceof this.api.errors.ValidationError);
    });
  });

  it('getAccountInfo', function () {
    return this.api.getAccountInfo(address).then(
      _.partial(checkResult, responses.getAccountInfo, 'getAccountInfo'));
  });

  it('getAccountInfo - options undefined', function () {
    return this.api.getAccountInfo(address, undefined).then(
      _.partial(checkResult, responses.getAccountInfo, 'getAccountInfo'));
  });

  it('getAccountInfo - invalid options', function () {
    return this.api.getAccountInfo(address, { invalid: 'options' }).then(() => {
      assert(false, 'Should throw ValidationError');
    }).catch(error => {
      assert(error instanceof this.api.errors.ValidationError);
    });
  });

  it('getAccountObjects', function () {
    return this.api.getAccountObjects(address).then(response =>
      checkResult(responses.getAccountObjects, 'AccountObjectsResponse', response));
  });

  it('getAccountObjects - invalid options', function () {
    // Intentionally no local validation of these options
    return this.api.getAccountObjects(address, {invalid: 'options'}).then(response =>
      checkResult(responses.getAccountObjects, 'AccountObjectsResponse', response));
  });

  it('request account_objects', function () {
    return this.api.request('account_objects', {
      account: address
    }).then(response =>
      checkResult(responses.getAccountObjects, 'AccountObjectsResponse', response));
  });

  it('request account_objects - invalid options', function () {
    // Intentionally no local validation of these options
    return this.api.request('account_objects', {
      account: address,
      invalid: 'options'
    }).then(response =>
      checkResult(responses.getAccountObjects, 'AccountObjectsResponse', response));
  });

  it('getOrders', function () {
    return this.api.getOrders(address).then(
      _.partial(checkResult, responses.getOrders, 'getOrders'));
  });

  it('getOrders - limit', function () {
    return this.api.getOrders(address, { limit: 20 }).then(
      _.partial(checkResult, responses.getOrders, 'getOrders'));
  });

  it('getOrders - invalid options', function () {
    return this.api.getOrders(address, { invalid: 'options' }).then(() => {
      assert(false, 'Should throw ValidationError');
    }).catch(error => {
      assert(error instanceof this.api.errors.ValidationError);
    });
  });

  describe('formatBidsAndAsks', function () {

    it('normal', function () {
      const orderbookInfo = {
        "base": {
          "currency": "USD",
          "counterparty": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"
        },
        "counter": {
          "currency": "BTC",
          "counterparty": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"
        }
      };

      return Promise.all(
        [
          this.api.request('book_offers', {
            taker_gets: RippleAPI.renameCounterpartyToIssuer(orderbookInfo.base),
            taker_pays: RippleAPI.renameCounterpartyToIssuer(orderbookInfo.counter),
            ledger_index: 'validated',
            limit: 20,
            taker: address
          }),
          this.api.request('book_offers', {
            taker_gets: RippleAPI.renameCounterpartyToIssuer(orderbookInfo.counter),
            taker_pays: RippleAPI.renameCounterpartyToIssuer(orderbookInfo.base),
            ledger_index: 'validated',
            limit: 20,
            taker: address
          })
        ]
      ).then(([directOfferResults, reverseOfferResults]) => {
        const directOffers = (directOfferResults ? directOfferResults.offers : []).reduce((acc, res) => acc.concat(res), [])
        const reverseOffers = (reverseOfferResults ? reverseOfferResults.offers : []).reduce((acc, res) => acc.concat(res), [])
        const orderbook = RippleAPI.formatBidsAndAsks(orderbookInfo, [...directOffers, ...reverseOffers]);
        assert.deepEqual(orderbook, responses.getOrderbook.normal);
      });
    });

    it('with XRP', function () {
      const orderbookInfo = {
        "base": {
          "currency": "USD",
          "counterparty": "rp8rJYTpodf8qbSCHVTNacf8nSW8mRakFw"
        },
        "counter": {
          "currency": "XRP"
        }
      };

      return Promise.all(
        [
          this.api.request('book_offers', {
            taker_gets: RippleAPI.renameCounterpartyToIssuer(orderbookInfo.base),
            taker_pays: RippleAPI.renameCounterpartyToIssuer(orderbookInfo.counter),
            ledger_index: 'validated',
            limit: 20,
            taker: address
          }),
          this.api.request('book_offers', {
            taker_gets: RippleAPI.renameCounterpartyToIssuer(orderbookInfo.counter),
            taker_pays: RippleAPI.renameCounterpartyToIssuer(orderbookInfo.base),
            ledger_index: 'validated',
            limit: 20,
            taker: address
          })
        ]
      ).then(([directOfferResults, reverseOfferResults]) => {
        const directOffers = (directOfferResults ? directOfferResults.offers : []).reduce((acc, res) => acc.concat(res), [])
        const reverseOffers = (reverseOfferResults ? reverseOfferResults.offers : []).reduce((acc, res) => acc.concat(res), [])
        const orderbook = RippleAPI.formatBidsAndAsks(orderbookInfo, [...directOffers, ...reverseOffers]);
        assert.deepEqual(orderbook, responses.getOrderbook.withXRP);
      });
    });

    function checkSortingOfOrders(orders) {
      let previousRate = '0';
      for (var i = 0; i < orders.length; i++) {
        const order = orders[i];
        let rate;

        // We calculate the quality of output/input here as a test.
        // This won't hold in general because when output and input amounts get tiny,
        // the quality can differ significantly. However, the offer stays in the
        // order book where it was originally placed. It would be more consistent
        // to check the quality from the offer book, but for the test data set,
        // this calculation holds.

        if (order.specification.direction === 'buy') {
          rate = (new BigNumber(order.specification.quantity.value))
          .dividedBy(order.specification.totalPrice.value)
          .toString();
        } else {
          rate = (new BigNumber(order.specification.totalPrice.value))
          .dividedBy(order.specification.quantity.value)
          .toString();
        }
        assert((new BigNumber(rate)).isGreaterThanOrEqualTo(previousRate),
          'Rates must be sorted from least to greatest: ' +
          rate + ' should be >= ' + previousRate);
        previousRate = rate;
      }
      return true;
    }

    it('sample XRP/JPY book has orders sorted correctly', function () {
      const orderbookInfo = {
        "base": { // the first currency in pair
          "currency": 'XRP'
        },
        "counter": {
          "currency": 'JPY',
          "counterparty": "rB3gZey7VWHYRqJHLoHDEJXJ2pEPNieKiS"
        }
      };

      const myAddress = 'rE9qNjzJXpiUbVomdv7R4xhrXVeH2oVmGR';

      return Promise.all(
        [
          this.api.request('book_offers', {
            taker_gets: RippleAPI.renameCounterpartyToIssuer(orderbookInfo.base),
            taker_pays: RippleAPI.renameCounterpartyToIssuer(orderbookInfo.counter),
            ledger_index: 'validated',
            limit: 400, // must match `test/fixtures/rippled/requests/1-taker_gets-XRP-taker_pays-JPY.json`
            taker: myAddress
          }),
          this.api.request('book_offers', {
            taker_gets: RippleAPI.renameCounterpartyToIssuer(orderbookInfo.counter),
            taker_pays: RippleAPI.renameCounterpartyToIssuer(orderbookInfo.base),
            ledger_index: 'validated',
            limit: 400, // must match `test/fixtures/rippled/requests/2-taker_gets-JPY-taker_pays-XRP.json`
            taker: myAddress
          })
        ]
      ).then(([directOfferResults, reverseOfferResults]) => {
        const directOffers = (directOfferResults ? directOfferResults.offers : []).reduce((acc, res) => acc.concat(res), [])
        const reverseOffers = (reverseOfferResults ? reverseOfferResults.offers : []).reduce((acc, res) => acc.concat(res), [])
        const orderbook = RippleAPI.formatBidsAndAsks(orderbookInfo, [...directOffers, ...reverseOffers]);
        assert.deepStrictEqual([], orderbook.bids);
        return checkSortingOfOrders(orderbook.asks);
      });
    });

    it('sample USD/XRP book has orders sorted correctly', function () {
      const orderbookInfo = { counter: { currency: 'XRP' },
      base: { currency: 'USD',
       counterparty: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B' } };

      const myAddress = 'rE9qNjzJXpiUbVomdv7R4xhrXVeH2oVmGR';

      return Promise.all(
        [
          this.api.request('book_offers', {
            taker_gets: RippleAPI.renameCounterpartyToIssuer(orderbookInfo.base),
            taker_pays: RippleAPI.renameCounterpartyToIssuer(orderbookInfo.counter),
            ledger_index: 'validated',
            limit: 400, // must match `test/fixtures/rippled/requests/1-taker_gets-XRP-taker_pays-JPY.json`
            taker: myAddress
          }),
          this.api.request('book_offers', {
            taker_gets: RippleAPI.renameCounterpartyToIssuer(orderbookInfo.counter),
            taker_pays: RippleAPI.renameCounterpartyToIssuer(orderbookInfo.base),
            ledger_index: 'validated',
            limit: 400, // must match `test/fixtures/rippled/requests/2-taker_gets-JPY-taker_pays-XRP.json`
            taker: myAddress
          })
        ]
      ).then(([directOfferResults, reverseOfferResults]) => {
        const directOffers = (directOfferResults ? directOfferResults.offers : []).reduce((acc, res) => acc.concat(res), [])
        const reverseOffers = (reverseOfferResults ? reverseOfferResults.offers : []).reduce((acc, res) => acc.concat(res), [])
        const orderbook = RippleAPI.formatBidsAndAsks(orderbookInfo, [...directOffers, ...reverseOffers]);
        return checkSortingOfOrders(orderbook.bids) && checkSortingOfOrders(orderbook.asks);
      });
    });

    it('sorted so that best deals come first', function () {
      const orderbookInfo = {
        "base": {
          "currency": "USD",
          "counterparty": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"
        },
        "counter": {
          "currency": "BTC",
          "counterparty": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"
        }
      };

      return Promise.all(
        [
          this.api.request('book_offers', {
            taker_gets: RippleAPI.renameCounterpartyToIssuer(orderbookInfo.base),
            taker_pays: RippleAPI.renameCounterpartyToIssuer(orderbookInfo.counter),
            ledger_index: 'validated',
            limit: 20,
            taker: address
          }),
          this.api.request('book_offers', {
            taker_gets: RippleAPI.renameCounterpartyToIssuer(orderbookInfo.counter),
            taker_pays: RippleAPI.renameCounterpartyToIssuer(orderbookInfo.base),
            ledger_index: 'validated',
            limit: 20,
            taker: address
          })
        ]
      ).then(([directOfferResults, reverseOfferResults]) => {
        const directOffers = (directOfferResults ? directOfferResults.offers : []).reduce((acc, res) => acc.concat(res), [])
        const reverseOffers = (reverseOfferResults ? reverseOfferResults.offers : []).reduce((acc, res) => acc.concat(res), [])
        const orderbook = RippleAPI.formatBidsAndAsks(orderbookInfo, [...directOffers, ...reverseOffers]);
        
        const bidRates = orderbook.bids.map(bid => bid.properties.makerExchangeRate);
        const askRates = orderbook.asks.map(ask => ask.properties.makerExchangeRate);
        // makerExchangeRate = quality = takerPays.value/takerGets.value
        // so the best deal for the taker is the lowest makerExchangeRate
        // bids and asks should be sorted so that the best deals come first
        assert.deepEqual(_.sortBy(bidRates, x => Number(x)), bidRates);
        assert.deepEqual(_.sortBy(askRates, x => Number(x)), askRates);
      });
    });

    it('currency & counterparty are correct', function () {
      const orderbookInfo = {
        "base": {
          "currency": "USD",
          "counterparty": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"
        },
        "counter": {
          "currency": "BTC",
          "counterparty": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"
        }
      };

      return Promise.all(
        [
          this.api.request('book_offers', {
            taker_gets: RippleAPI.renameCounterpartyToIssuer(orderbookInfo.base),
            taker_pays: RippleAPI.renameCounterpartyToIssuer(orderbookInfo.counter),
            ledger_index: 'validated',
            limit: 20,
            taker: address
          }),
          this.api.request('book_offers', {
            taker_gets: RippleAPI.renameCounterpartyToIssuer(orderbookInfo.counter),
            taker_pays: RippleAPI.renameCounterpartyToIssuer(orderbookInfo.base),
            ledger_index: 'validated',
            limit: 20,
            taker: address
          })
        ]
      ).then(([directOfferResults, reverseOfferResults]) => {
        const directOffers = (directOfferResults ? directOfferResults.offers : []).reduce((acc, res) => acc.concat(res), [])
        const reverseOffers = (reverseOfferResults ? reverseOfferResults.offers : []).reduce((acc, res) => acc.concat(res), [])
        const orderbook = RippleAPI.formatBidsAndAsks(orderbookInfo, [...directOffers, ...reverseOffers]);
        
        const orders = _.flatten([orderbook.bids, orderbook.asks]);
        _.forEach(orders, order => {
          const quantity = order.specification.quantity;
          const totalPrice = order.specification.totalPrice;
          const { base, counter } = requests.getOrderbook.normal;
          assert.strictEqual(quantity.currency, base.currency);
          assert.strictEqual(quantity.counterparty, base.counterparty);
          assert.strictEqual(totalPrice.currency, counter.currency);
          assert.strictEqual(totalPrice.counterparty, counter.counterparty);
        });
      });
    });

    it('direction is correct for bids and asks', function () {
      const orderbookInfo = {
        "base": {
          "currency": "USD",
          "counterparty": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"
        },
        "counter": {
          "currency": "BTC",
          "counterparty": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"
        }
      };

      return Promise.all(
        [
          this.api.request('book_offers', {
            taker_gets: RippleAPI.renameCounterpartyToIssuer(orderbookInfo.base),
            taker_pays: RippleAPI.renameCounterpartyToIssuer(orderbookInfo.counter),
            ledger_index: 'validated',
            limit: 20,
            taker: address
          }),
          this.api.request('book_offers', {
            taker_gets: RippleAPI.renameCounterpartyToIssuer(orderbookInfo.counter),
            taker_pays: RippleAPI.renameCounterpartyToIssuer(orderbookInfo.base),
            ledger_index: 'validated',
            limit: 20,
            taker: address
          })
        ]
      ).then(([directOfferResults, reverseOfferResults]) => {
        const directOffers = (directOfferResults ? directOfferResults.offers : []).reduce((acc, res) => acc.concat(res), [])
        const reverseOffers = (reverseOfferResults ? reverseOfferResults.offers : []).reduce((acc, res) => acc.concat(res), [])
        const orderbook = RippleAPI.formatBidsAndAsks(orderbookInfo, [...directOffers, ...reverseOffers]);
        
        assert(
          _.every(orderbook.bids, bid => bid.specification.direction === 'buy'));
        assert(
          _.every(orderbook.asks, ask => ask.specification.direction === 'sell'));
      });
    });
  });

  it('getPaymentChannel', function () {
    const channelId =
      'E30E709CF009A1F26E0E5C48F7AA1BFB79393764F15FB108BDC6E06D3CBD8415';
    return this.api.getPaymentChannel(channelId).then(
      _.partial(checkResult, responses.getPaymentChannel.normal,
        'getPaymentChannel'));
  });

  it('getPaymentChannel - full', function () {
    const channelId =
      'D77CD4713AA08195E6B6D0E5BC023DA11B052EBFF0B5B22EDA8AE85345BCF661';
    return this.api.getPaymentChannel(channelId).then(
      _.partial(checkResult, responses.getPaymentChannel.full,
        'getPaymentChannel'));
  });

  it('getPaymentChannel - not found', function () {
    const channelId =
      'DFA557EA3497585BFE83F0F97CC8E4530BBB99967736BB95225C7F0C13ACE708';
    return this.api.getPaymentChannel(channelId).then(() => {
      assert(false, 'Should throw entryNotFound');
    }).catch(error => {
      assert(error instanceof this.api.errors.RippledError);
      assert.equal(error.message, 'entryNotFound');
      assert.equal(error.data.error, 'entryNotFound');
    });
  });

  it('getPaymentChannel - wrong type', function () {
    const channelId =
      '8EF9CCB9D85458C8D020B3452848BBB42EAFDDDB69A93DD9D1223741A4CA562B';
    return this.api.getPaymentChannel(channelId).then(() => {
      assert(false, 'Should throw NotFoundError');
    }).catch(error => {
      assert(_.includes(error.message,
        'Payment channel ledger entry not found'));
      assert(error instanceof this.api.errors.NotFoundError);
    });
  });




  it('disconnect & isConnected', function () {
    assert.strictEqual(this.api.isConnected(), true);
    return this.api.disconnect().then(() => {
      assert.strictEqual(this.api.isConnected(), false);
    });
  });

  it('getLedgerVersion', function (done) {
    this.api.getLedgerVersion().then(ver => {
      assert.strictEqual(ver, 8819951);
      done();
    }, done);
  });

  it('getFeeBase', function (done) {
    this.api.connection.getFeeBase().then(fee => {
      assert.strictEqual(fee, 10);
      done();
    }, done);
  });

  it('getFeeRef', function (done) {
    this.api.connection.getFeeRef().then(fee => {
      assert.strictEqual(fee, 10);
      done();
    }, done);
  });

  it('RippleError with data', function () {
    const error = new this.api.errors.RippleError('_message_', '_data_');
    assert.strictEqual(error.toString(),
      '[RippleError(_message_, \'_data_\')]');
  });

  it('NotFoundError default message', function () {
    const error = new this.api.errors.NotFoundError();
    assert.strictEqual(error.toString(),
      '[NotFoundError(Not found)]');
  });

  it('common utils - toRippledAmount', function () {
    const amount = { issuer: 'is', currency: 'c', value: 'v' };

    assert.deepEqual(utils.common.toRippledAmount(amount), {
      issuer: 'is', currency: 'c', value: 'v'
    });
  });

  it('ledger utils - renameCounterpartyToIssuerInOrder', function () {
    const order = {
      taker_gets: { counterparty: '1', currency: 'XRP' },
      taker_pays: { counterparty: '1', currency: 'XRP' }
    };
    const expected = {
      taker_gets: { issuer: '1', currency: 'XRP' },
      taker_pays: { issuer: '1', currency: 'XRP' }
    };
    assert.deepEqual(utils.renameCounterpartyToIssuerInOrder(order), expected);
  });

  it('ledger utils - compareTransactions', function () {
    // @ts-ignore
    assert.strictEqual(utils.compareTransactions({}, {}), 0);
    let first: any = { outcome: { ledgerVersion: 1, indexInLedger: 100 } };
    let second: any = { outcome: { ledgerVersion: 1, indexInLedger: 200 } };

    assert.strictEqual(utils.compareTransactions(first, second), -1);

    first = { outcome: { ledgerVersion: 1, indexInLedger: 100 } };
    second = { outcome: { ledgerVersion: 1, indexInLedger: 100 } };

    assert.strictEqual(utils.compareTransactions(first, second), 0);

    first = { outcome: { ledgerVersion: 1, indexInLedger: 200 } };
    second = { outcome: { ledgerVersion: 1, indexInLedger: 100 } };

    assert.strictEqual(utils.compareTransactions(first, second), 1);
  });

  it('ledger utils - getRecursive', function () {
    function getter(marker) {
      return new Promise<RecursiveData>((resolve, reject) => {
        if (marker !== undefined) {
          reject(new Error());
          return;
        }
        resolve({ marker: 'A', results: [1] });
      });
    }
    return utils.getRecursive(getter, 10).then(() => {
      assert(false, 'Should throw Error');
    }).catch(error => {
      assert(error instanceof Error);
    });
  });

  describe('schema-validator', function () {
    it('valid', function () {
      assert.doesNotThrow(function () {
        schemaValidator.schemaValidate('hash256',
          '0F7ED9F40742D8A513AE86029462B7A6768325583DF8EE21B7EC663019DD6A0F');
      });
    });

    it('invalid', function () {
      assert.throws(function () {
        schemaValidator.schemaValidate('hash256', 'invalid');
      }, this.api.errors.ValidationError);
    });

    it('invalid - empty value', function () {
      assert.throws(function () {
        schemaValidator.schemaValidate('hash256', '');
      }, this.api.errors.ValidationError);
    });

    it('schema not found error', function () {
      assert.throws(function () {
        schemaValidator.schemaValidate('unexisting', 'anything');
      }, /no schema/);
    });

  });

  describe('validator', function () {

    it('validateLedgerRange', function () {
      const options = {
        minLedgerVersion: 20000,
        maxLedgerVersion: 10000
      };
      const thunk = _.partial(validate.getTransactions,
        { address, options });
      assert.throws(thunk, this.api.errors.ValidationError);
      assert.throws(thunk,
        /minLedgerVersion must not be greater than maxLedgerVersion/);
    });

    it('secret', function () {
      function validateSecret(secret) {
        validate.sign({ txJSON: '', secret });
      }
      assert.doesNotThrow(_.partial(validateSecret,
        'shzjfakiK79YQdMjy4h8cGGfQSV6u'));
      assert.throws(_.partial(validateSecret,
        'shzjfakiK79YQdMjy4h8cGGfQSV6v'), this.api.errors.ValidationError);
      assert.throws(_.partial(validateSecret, 1),
        this.api.errors.ValidationError);
      assert.throws(_.partial(validateSecret, ''),
        this.api.errors.ValidationError);
      assert.throws(_.partial(validateSecret, 's!!!'),
        this.api.errors.ValidationError);
      assert.throws(_.partial(validateSecret, 'passphrase'),
        this.api.errors.ValidationError);
      // 32 0s is a valid hex repr of seed bytes
      const hex = new Array(33).join('0');
      assert.throws(_.partial(validateSecret, hex),
        this.api.errors.ValidationError);
    });

  });

  it('ledger event', function (done) {
    this.api.on('ledger', message => {
      checkResult(responses.ledgerEvent, 'ledgerEvent', message);
      done();
    });
    closeLedger(this.api.connection);
  });
});

describe('RippleAPI - offline', function () {
  it('prepareSettings and sign', function () {
    const api = new RippleAPI();
    const secret = 'shsWGZcmZz6YsWWmcnpfr6fLTdtFV';
    const settings = requests.prepareSettings.domain;
    const instructions = {
      sequence: 23,
      maxLedgerVersion: 8820051,
      fee: '0.000012'
    };
    return api.prepareSettings(address, settings, instructions).then(data => {
      checkResult(responses.prepareSettings.flags, 'prepare', data);
      assert.deepEqual(api.sign(data.txJSON, secret),
        responses.prepareSettings.signed);
    });
  });

  it('computeLedgerHash', function () {
    const api = new RippleAPI();
    const header = requests.computeLedgerHash.header;
    const ledgerHash = api.computeLedgerHash(header);
    assert.strictEqual(ledgerHash,
      'F4D865D83EB88C1A1911B9E90641919A1314F36E1B099F8E95FE3B7C77BE3349');
  });

  it('computeLedgerHash - with transactions', function () {
    const api = new RippleAPI();
    const header = _.omit(requests.computeLedgerHash.header,
      'transactionHash');
    header.rawTransactions = JSON.stringify(
      requests.computeLedgerHash.transactions);
    const ledgerHash = api.computeLedgerHash(header);
    assert.strictEqual(ledgerHash,
      'F4D865D83EB88C1A1911B9E90641919A1314F36E1B099F8E95FE3B7C77BE3349');
  });

  it('computeLedgerHash - incorrent transaction_hash', function () {
    const api = new RippleAPI();
    const header = _.assign({}, requests.computeLedgerHash.header,
      {
        transactionHash:
          '325EACC5271322539EEEC2D6A5292471EF1B3E72AE7180533EFC3B8F0AD435C9'
      });
    header.rawTransactions = JSON.stringify(
      requests.computeLedgerHash.transactions);
    assert.throws(() => api.computeLedgerHash(header));
  });

  it('RippleAPI - implicit server port', function () {
    new RippleAPI({ server: 'wss://s1.ripple.com' });
  });

  it('RippleAPI invalid options', function () {
    assert.throws(() => new RippleAPI({ invalid: true } as any));
  });

  it('RippleAPI valid options', function () {
    const api = new RippleAPI({ server: 'wss://s:1' });
    const privateConnectionUrl = (api.connection as any)._url;
    assert.deepEqual(privateConnectionUrl, 'wss://s:1');
  });

  it('RippleAPI invalid server uri', function () {
    assert.throws(() => new RippleAPI({ server: 'wss//s:1' }));
  });

  xit('RippleAPI connect() times out after 2 seconds', function () {
    // TODO: Use a timer mock like https://jestjs.io/docs/en/timer-mocks
    //       to test that connect() times out after 2 seconds.
  });
});
