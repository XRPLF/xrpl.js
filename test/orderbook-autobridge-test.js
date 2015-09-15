/* eslint-disable max-len */

'use strict';

const _ = require('lodash');
const assert = require('assert-diff');
const Remote = require('ripple-lib').Remote;
const Currency = require('ripple-lib').Currency;
const Amount = require('ripple-lib').Amount;
const addresses = require('./fixtures/addresses');
const fixtures = require('./fixtures/orderbook');
const IOUValue = require('ripple-lib')._test.IOUValue;

describe('OrderBook Autobridging', function() {
  this.timeout(0);

  function createRemote() {
    const remote = new Remote();

    remote.isConnected = function() {
      return true;
    };

    return remote;
  }

  it('Initialize IOU/IOU', function() {
    const book = createRemote().createOrderBook({
      currency_gets: 'EUR',
      issuer_gets: addresses.ISSUER,
      currency_pays: 'USD',
      issuer_pays: addresses.ISSUER
    });

    assert.deepEqual(book._legOneBook._currencyGets.to_hex(), Currency.from_json('XRP').to_hex());
    assert.deepEqual(book._legOneBook._currencyPays.to_hex(), Currency.from_json('USD').to_hex());
    assert.deepEqual(book._legTwoBook._currencyGets.to_hex(), Currency.from_json('EUR').to_hex());
    assert.deepEqual(book._legTwoBook._currencyPays.to_hex(), Currency.from_json('XRP').to_hex());
  });

  it('Compute autobridged offers', function() {
    const book = createRemote().createOrderBook({
      currency_gets: 'EUR',
      issuer_gets: addresses.ISSUER,
      currency_pays: 'USD',
      issuer_pays: addresses.ISSUER
    });

    book._issuerTransferRate = new IOUValue(1000000000);
    book._legOneBook._issuerTransferRate = new IOUValue(1000000000);
    book._legTwoBook._issuerTransferRate = new IOUValue(1000000000);

    const legOneOffers = _.cloneDeep(fixtures.LEG_ONE_OFFERS.slice(0, 1));
    const legTwoOffers = _.cloneDeep(fixtures.LEG_TWO_OFFERS.slice(0, 1));

    book._legOneBook.setOffers(legOneOffers);
    book._legTwoBook.setOffers(legTwoOffers);

    book._gotOffersFromLegOne = book._gotOffersFromLegTwo = true;
    book.computeAutobridgedOffers();

    assert.strictEqual(book._offersAutobridged.length, 1);

    assert.strictEqual(book._offersAutobridged[0].TakerGets.value, '17.07639524223001');
    assert.strictEqual(book._offersAutobridged[0].TakerPays.value, '58.61727326122974');

    assert.strictEqual(book._offersAutobridged[0].taker_gets_funded, '17.07639524223001');
    assert.strictEqual(book._offersAutobridged[0].taker_pays_funded, '58.61727326122974');

    assert(book._offersAutobridged[0].autobridged);
  });

  it('Compute autobridged offers - leg one partially funded', function() {
    const book = createRemote().createOrderBook({
      currency_gets: 'EUR',
      issuer_gets: addresses.ISSUER,
      currency_pays: 'USD',
      issuer_pays: addresses.ISSUER
    });

    book._issuerTransferRate = new IOUValue(1000000000);
    book._legOneBook._issuerTransferRate = new IOUValue(1000000000);
    book._legTwoBook._issuerTransferRate = new IOUValue(1000000000);

    const legOneOffers = _.cloneDeep(fixtures.LEG_ONE_OFFERS.slice(0, 1));
    const legTwoOffers = _.cloneDeep(fixtures.LEG_TWO_OFFERS.slice(0, 1));

    legOneOffers[0].owner_funds = '2105863129';

    book._legOneBook.setOffers(legOneOffers);
    book._legTwoBook.setOffers(legTwoOffers);

    book._gotOffersFromLegOne = book._gotOffersFromLegTwo = true;
    book.computeAutobridgedOffers();

    assert.strictEqual(book._offersAutobridged.length, 1);

    assert.strictEqual(book._offersAutobridged[0].TakerGets.value, '7.273651248813431');
    assert.strictEqual(book._offersAutobridged[0].TakerPays.value, '24.96789265329184');

    assert(book._offersAutobridged[0].autobridged);
  });

  it('Compute autobridged offers - leg two partially funded', function() {
    const book = createRemote().createOrderBook({
      currency_gets: 'EUR',
      issuer_gets: addresses.ISSUER,
      currency_pays: 'USD',
      issuer_pays: addresses.ISSUER
    });

    book._issuerTransferRate = new IOUValue(1000000000);
    book._legOneBook._issuerTransferRate = new IOUValue(1000000000);
    book._legTwoBook._issuerTransferRate = new IOUValue(1000000000);

    const legOneOffers = _.cloneDeep(fixtures.LEG_ONE_OFFERS.slice(0, 1));
    const legTwoOffers = _.cloneDeep(fixtures.LEG_TWO_OFFERS.slice(0, 1));

    legTwoOffers[0].owner_funds = '10';

    book._legOneBook.setOffers(legOneOffers);
    book._legTwoBook.setOffers(legTwoOffers);

    book._gotOffersFromLegOne = book._gotOffersFromLegTwo = true;
    book.computeAutobridgedOffers();

    assert.strictEqual(book._offersAutobridged.length, 1);

    assert.strictEqual(book._offersAutobridged[0].TakerGets.value, '10');
    assert.strictEqual(book._offersAutobridged[0].TakerPays.value, '34.32649132449533');

    assert(book._offersAutobridged[0].autobridged);
  });

  it('Compute autobridged offers - leg two transfer rate', function() {
    const book = createRemote().createOrderBook({
      currency_gets: 'EUR',
      issuer_gets: addresses.ISSUER,
      currency_pays: 'USD',
      issuer_pays: addresses.ISSUER
    });

    book._issuerTransferRate = new IOUValue(1000000000);
    book._legOneBook._issuerTransferRate = new IOUValue(1000000000);
    book._legTwoBook._issuerTransferRate = new IOUValue(1002000000);

    const legOneOffers = _.cloneDeep(fixtures.LEG_ONE_OFFERS.slice(0, 1));
    const legTwoOffers = _.cloneDeep(fixtures.LEG_TWO_OFFERS.slice(0, 1));

    legTwoOffers[0].owner_funds = '10';

    book._legOneBook.setOffers(legOneOffers);
    book._legTwoBook.setOffers(legTwoOffers);

    book._gotOffersFromLegOne = book._gotOffersFromLegTwo = true;
    book.computeAutobridgedOffers();

    assert.strictEqual(book._offersAutobridged[0].TakerGets.value, '9.980039920159681');
    assert.strictEqual(book._offersAutobridged[0].TakerPays.value, '34.25797537722665');

    assert(book._offersAutobridged[0].autobridged);
  });

  it('Compute autobridged offers - taker funds < leg two in', function() {
    const book = createRemote().createOrderBook({
      currency_gets: 'EUR',
      issuer_gets: addresses.ISSUER,
      currency_pays: 'USD',
      issuer_pays: addresses.ISSUER
    });

    book._issuerTransferRate = new IOUValue(1000000000);
    book._legOneBook._issuerTransferRate = new IOUValue(1000000000);
    book._legTwoBook._issuerTransferRate = new IOUValue(1000000000);

    const legOneOffers = _.cloneDeep(fixtures.LEG_ONE_OFFERS.slice(0, 1));
    const legTwoOffers = _.cloneDeep(fixtures.LEG_TWO_OFFERS.slice(0, 1));

    legOneOffers[0].owner_funds = '33461561812';

    legTwoOffers[0].owner_funds = '360';
    legTwoOffers[0].TakerGets.value = '170.7639524223001';
    legTwoOffers[0].TakerPays = '49439476610';

    book._legOneBook.setOffers(legOneOffers);
    book._legTwoBook.setOffers(legTwoOffers);

    book._gotOffersFromLegOne = book._gotOffersFromLegTwo = true;
    book.computeAutobridgedOffers();

    assert.strictEqual(book._offersAutobridged.length, 1);

    assert.strictEqual(book._offersAutobridged[0].TakerGets.value, '108.6682345172846');
    assert.strictEqual(book._offersAutobridged[0].TakerPays.value, '373.019921005');

    assert(book._offersAutobridged[0].autobridged);
  });

  it('Compute autobridged offers - leg one partially funded - owners equal', function() {
    const book = createRemote().createOrderBook({
      currency_gets: 'EUR',
      issuer_gets: addresses.ISSUER,
      currency_pays: 'USD',
      issuer_pays: addresses.ISSUER
    });

    book._issuerTransferRate = new IOUValue(1000000000);
    book._legOneBook._issuerTransferRate = new IOUValue(1000000000);
    book._legTwoBook._issuerTransferRate = new IOUValue(1000000000);

    const legOneOffers = _.cloneDeep(fixtures.LEG_ONE_OFFERS.slice(0, 1));
    const legTwoOffers = _.cloneDeep(fixtures.LEG_TWO_OFFERS.slice(0, 1));

    legOneOffers[0].owner_funds = '2105863129';

    legTwoOffers[0].Account = legOneOffers[0].Account;

    book._legOneBook.setOffers(legOneOffers);
    book._legTwoBook.setOffers(legTwoOffers);

    book._gotOffersFromLegOne = book._gotOffersFromLegTwo = true;
    book.computeAutobridgedOffers();

    assert.strictEqual(book._offersAutobridged.length, 1);

    assert.strictEqual(book._offersAutobridged[0].TakerGets.value, '17.07639524223001');
    assert.strictEqual(book._offersAutobridged[0].TakerPays.value, '58.61727326122974');

    assert(book._offersAutobridged[0].autobridged);
  });

  it('Compute autobridged offers - leg one partially funded - owners equal - leg two in > leg one out', function() {
    const book = createRemote().createOrderBook({
      currency_gets: 'EUR',
      issuer_gets: addresses.ISSUER,
      currency_pays: 'USD',
      issuer_pays: addresses.ISSUER
    });

    book._issuerTransferRate = new IOUValue(1000000000);
    book._legOneBook._issuerTransferRate = new IOUValue(1000000000);
    book._legTwoBook._issuerTransferRate = new IOUValue(1000000000);

    const legOneOffers = _.cloneDeep(fixtures.LEG_ONE_OFFERS.slice(0, 1));
    const legTwoOffers = _.cloneDeep(fixtures.LEG_TWO_OFFERS.slice(0, 1));

    legOneOffers[0].owner_funds = '2105863129';

    legTwoOffers[0].Account = legOneOffers[0].Account;
    legTwoOffers[0].owner_funds = '360';
    legTwoOffers[0].TakerGets.value = '170.7639524223001';
    legTwoOffers[0].TakerPays = '49439476610';

    book._legOneBook.setOffers(legOneOffers);
    book._legTwoBook.setOffers(legTwoOffers);

    book._gotOffersFromLegOne = book._gotOffersFromLegTwo = true;
    book.computeAutobridgedOffers();

    assert.strictEqual(book._offersAutobridged.length, 1);

    assert.strictEqual(book._offersAutobridged[0].TakerGets.value, '108.6682345172846');
    assert.strictEqual(book._offersAutobridged[0].TakerPays.value, '373.0199210049999');

    assert(book._offersAutobridged[0].autobridged);
  });

  it('Compute autobridged offers - leg one consumes leg two fully', function() {
    const book = createRemote().createOrderBook({
      currency_gets: 'EUR',
      issuer_gets: addresses.ISSUER,
      currency_pays: 'USD',
      issuer_pays: addresses.ISSUER
    });

    book._issuerTransferRate = new IOUValue(1000000000);
    book._legOneBook._issuerTransferRate = new IOUValue(1000000000);
    book._legTwoBook._issuerTransferRate = new IOUValue(1000000000);

    const legOneOffers = _.cloneDeep(fixtures.LEG_ONE_OFFERS.slice(0, 1));
    const legTwoOffers = _.cloneDeep(fixtures.LEG_TWO_OFFERS.slice(0, 2));

    book._legOneBook.setOffers(legOneOffers);
    book._legTwoBook.setOffers(legTwoOffers);

    book._gotOffersFromLegOne = book._gotOffersFromLegTwo = true;
    book.computeAutobridgedOffers();

    assert.strictEqual(book._offersAutobridged.length, 2);

    assert.strictEqual(book._offersAutobridged[0].TakerGets.value, '17.07639524223001');
    assert.strictEqual(book._offersAutobridged[0].TakerPays.value, '58.61727326122974');

    assert(book._offersAutobridged[0].autobridged);

    assert.strictEqual(book._offersAutobridged[1].TakerGets.value, '5.038346688725268');
    assert.strictEqual(book._offersAutobridged[1].TakerPays.value, '314.4026477437702');

    assert(book._offersAutobridged[1].autobridged);
  });

  it('Compute autobridged offers - leg two consumes first leg one offer fully', function() {
    const book = createRemote().createOrderBook({
      currency_gets: 'EUR',
      issuer_gets: addresses.ISSUER,
      currency_pays: 'USD',
      issuer_pays: addresses.ISSUER
    });

    book._issuerTransferRate = new IOUValue(1000000000);
    book._legOneBook._issuerTransferRate = new IOUValue(1000000000);
    book._legTwoBook._issuerTransferRate = new IOUValue(1000000000);

    const legOneOffers = _.cloneDeep(fixtures.LEG_ONE_OFFERS.slice(0, 2));
    const legTwoOffers = _.cloneDeep(fixtures.LEG_TWO_OFFERS.slice(0, 1));

    legTwoOffers[0].TakerGets.value = '170.7639524223001';
    legTwoOffers[0].TakerPays = '49439476610';
    legTwoOffers[0].owner_funds = '364.0299530003982';

    book._legOneBook.setOffers(legOneOffers);
    book._legTwoBook.setOffers(legTwoOffers);

    book._gotOffersFromLegOne = book._gotOffersFromLegTwo = true;
    book.computeAutobridgedOffers();

    assert.strictEqual(book._offersAutobridged.length, 2);

    assert.strictEqual(book._offersAutobridged[0].TakerGets.value, '108.6682345172846');
    assert.strictEqual(book._offersAutobridged[0].TakerPays.value, '373.019921005');

    assert(book._offersAutobridged[0].autobridged);

    assert.strictEqual(book._offersAutobridged[1].TakerGets.value, '62.0957179050155');
    assert.strictEqual(book._offersAutobridged[1].TakerPays.value, '213.1791399943838');

    assert(book._offersAutobridged[1].autobridged);
  });

  it('Compute autobridged offers - owners equal', function() {
    const book = createRemote().createOrderBook({
      currency_gets: 'EUR',
      issuer_gets: addresses.ISSUER,
      currency_pays: 'USD',
      issuer_pays: addresses.ISSUER
    });

    book._issuerTransferRate = new IOUValue(1000000000);
    book._legOneBook._issuerTransferRate = new IOUValue(1000000000);
    book._legTwoBook._issuerTransferRate = new IOUValue(1002000000);

    const legOneOffers = _.cloneDeep(fixtures.LEG_ONE_OFFERS.slice(0, 1));
    const legTwoOffers = _.cloneDeep(fixtures.LEG_TWO_OFFERS.slice(0, 2));

    legOneOffers[0].owner_funds = '2105863129';
    legTwoOffers[1].owner_funds = '19.32660005780981';

    legTwoOffers[0].Account = legOneOffers[0].Account;

    book._legOneBook.setOffers(legOneOffers);
    book._legTwoBook.setOffers(legTwoOffers);

    book._gotOffersFromLegOne = book._gotOffersFromLegTwo = true;
    book.computeAutobridgedOffers();

    assert.strictEqual(book._offersAutobridged.length, 2);

    assert.strictEqual(book._offersAutobridged[0].TakerGets.value, '17.07639524223001');
    assert.strictEqual(book._offersAutobridged[0].TakerPays.value, '58.61727326122974');

    assert(book._offersAutobridged[0].autobridged);

    assert.strictEqual(book._offersAutobridged[1].TakerGets.value, '0.4001139945128008');
    assert.strictEqual(book._offersAutobridged[1].TakerPays.value, '24.96789265329184');

    assert(book._offersAutobridged[1].autobridged);
  });

  it('Compute autobridged offers - owners equal - leg one overfunded', function() {
    const book = createRemote().createOrderBook({
      currency_gets: 'EUR',
      issuer_gets: addresses.ISSUER,
      currency_pays: 'USD',
      issuer_pays: addresses.ISSUER
    });

    book._issuerTransferRate = new IOUValue(1000000000);
    book._legOneBook._issuerTransferRate = new IOUValue(1000000000);
    book._legTwoBook._issuerTransferRate = new IOUValue(1002000000);

    const legOneOffers = _.cloneDeep(fixtures.LEG_ONE_OFFERS.slice(0, 1));
    const legTwoOffers = _.cloneDeep(fixtures.LEG_TWO_OFFERS.slice(0, 2));

    legOneOffers[0].owner_funds = '41461561812';

    legTwoOffers[0].Account = legOneOffers[0].Account;

    legTwoOffers[1].owner_funds = '30';

    book._legOneBook.setOffers(legOneOffers);
    book._legTwoBook.setOffers(legTwoOffers);

    book._gotOffersFromLegOne = book._gotOffersFromLegTwo = true;
    book.computeAutobridgedOffers();

    assert.strictEqual(book._offersAutobridged.length, 2);

    assert.strictEqual(book._offersAutobridged[0].TakerGets.value, '17.07639524223001');
    assert.strictEqual(book._offersAutobridged[0].TakerPays.value, '58.61727326122974');

    assert(book._offersAutobridged[0].autobridged);

    assert.strictEqual(book._offersAutobridged[1].TakerGets.value, '5.038346688725268');
    assert.strictEqual(book._offersAutobridged[1].TakerPays.value, '314.4026477437702');

    assert(book._offersAutobridged[1].autobridged);
  });

  it('Compute autobridged offers - TakerPays < Quality * TakerGets', function() {
    const book = createRemote().createOrderBook({
      currency_gets: 'EUR',
      issuer_gets: addresses.ISSUER,
      currency_pays: 'USD',
      issuer_pays: addresses.ISSUER
    });

    book._issuerTransferRate = new IOUValue(1000000000);
    book._legOneBook._issuerTransferRate = new IOUValue(1000000000);
    book._legTwoBook._issuerTransferRate = new IOUValue(1000000000);

    book._legOneBook.setOffers([
      {
        Account: addresses.ACCOUNT,
        BookDirectory: '3B95C29205977C2136BBC70F21895F8C8F471C8522BF446E570463F9CDB31517',
        TakerGets: '75',
        TakerPays: {
          value: '50',
          issuer: addresses.ISSUER,
          currency: 'USD'
        },
        owner_funds: '50',
        quality: '1'
      }
    ]);

    book._legTwoBook.setOffers([
      {
        Account: addresses.ACCOUNT,
        BookDirectory: '3B95C29205977C2136BBC70F21895F8C8F471C8522BF446E570463F9CDB31517',
        TakerGets: {
          value: '90',
          issuer: addresses.ISSUER,
          currency: 'EUR'
        },
        TakerPays: '90',
        owner_funds: '150',
        quality: '1'
      }
    ]);

    book._gotOffersFromLegOne = book._gotOffersFromLegTwo = true;
    book.computeAutobridgedOffers();

    assert.strictEqual(book._offersAutobridged.length, 1);

    assert.strictEqual(book._offersAutobridged[0].TakerGets.value, '75');
    assert.strictEqual(book._offersAutobridged[0].TakerPays.value, '75');

    assert(book._offersAutobridged[0].autobridged);
  });

  it('Compute autobridged offers - update funded amount', function() {
    const book = createRemote().createOrderBook({
      currency_gets: 'EUR',
      issuer_gets: addresses.ISSUER,
      currency_pays: 'USD',
      issuer_pays: addresses.ISSUER
    });

    book._issuerTransferRate = new IOUValue(1000000000);
    book._legOneBook._issuerTransferRate = new IOUValue(1000000000);
    book._legTwoBook._issuerTransferRate = new IOUValue(1000000000);

    book._legOneBook.setOffers([
      {
        Account: addresses.ACCOUNT,
        BookDirectory: '3B95C29205977C2136BBC70F21895F8C8F471C8522BF446E570463F9CDB31517',
        TakerGets: '100',
        TakerPays: {
          value: '100',
          issuer: addresses.ISSUER,
          currency: 'USD'
        },
        owner_funds: '50',
        quality: '1'
      },
      {
        Account: addresses.ACCOUNT,
        BookDirectory: '3B95C29205977C2136BBC70F21895F8C8F471C8522BF446E570463F9CDB31517',
        TakerGets: '50',
        TakerPays: {
          value: '100',
          issuer: addresses.ISSUER,
          currency: 'USD'
        },
        quality: '2'
      }
    ]);

    book._legTwoBook.setOffers([
      {
        Account: addresses.ACCOUNT,
        BookDirectory: '3B95C29205977C2136BBC70F21895F8C8F471C8522BF446E570463F9CDB31517',
        TakerGets: {
          value: '90',
          issuer: addresses.ISSUER,
          currency: 'EUR'
        },
        TakerPays: '90',
        owner_funds: '150',
        quality: '1'
      },
      {
        Account: addresses.OTHER_ACCOUNT,
        BookDirectory: '3B95C29205977C2136BBC70F21895F8C8F471C8522BF446E570463F9CDB31517',
        TakerGets: {
          value: '30',
          issuer: addresses.ISSUER,
          currency: 'EUR'
        },
        TakerPays: '60',
        owner_funds: '70',
        quality: '2'
      }
    ]);

    book._gotOffersFromLegOne = book._gotOffersFromLegTwo = true;
    book.computeAutobridgedOffers();

    assert.strictEqual(book._offersAutobridged.length, 3);

    assert.strictEqual(book._offersAutobridged[0].TakerGets.value, '90');
    assert.strictEqual(book._offersAutobridged[0].TakerPays.value, '90');

    assert(book._offersAutobridged[0].autobridged);

    assert.strictEqual(book._offersAutobridged[1].TakerGets.value, '5');
    assert.strictEqual(book._offersAutobridged[1].TakerPays.value, '10');

    assert(book._offersAutobridged[1].autobridged);

    assert.strictEqual(book._offersAutobridged[2].TakerGets.value, '20');
    assert.strictEqual(book._offersAutobridged[2].TakerPays.value, '80');

    assert(book._offersAutobridged[2].autobridged);
  });

  it('Compute autobridged offers - update funded amount - owners equal', function() {
    const book = createRemote().createOrderBook({
      currency_gets: 'EUR',
      issuer_gets: addresses.ISSUER,
      currency_pays: 'USD',
      issuer_pays: addresses.ISSUER
    });

    book._issuerTransferRate = new IOUValue(1000000000);
    book._legOneBook._issuerTransferRate = new IOUValue(1000000000);
    book._legTwoBook._issuerTransferRate = new IOUValue(1000000000);

    book._legOneBook.setOffers([
      {
        Account: addresses.ACCOUNT,
        BookDirectory: '3B95C29205977C2136BBC70F21895F8C8F471C8522BF446E570463F9CDB31517',
        TakerGets: '100',
        TakerPays: {
          value: '100',
          issuer: addresses.ISSUER,
          currency: 'USD'
        },
        owner_funds: '50',
        quality: '1'
      },
      {
        Account: addresses.ACCOUNT,
        BookDirectory: '3B95C29205977C2136BBC70F21895F8C8F471C8522BF446E570463F9CDB31517',
        TakerGets: '20',
        TakerPays: {
          value: '100',
          issuer: addresses.ISSUER,
          currency: 'USD'
        },
        quality: '5'
      }
    ]);

    book._legTwoBook.setOffers([
      {
        Account: addresses.ACCOUNT,
        BookDirectory: '3B95C29205977C2136BBC70F21895F8C8F471C8522BF446E570463F9CDB31517',
        TakerGets: {
          value: '90',
          issuer: addresses.ISSUER,
          currency: 'EUR'
        },
        TakerPays: '90',
        owner_funds: '150',
        quality: '1'
      },
      {
        Account: addresses.OTHER_ACCOUNT,
        BookDirectory: '3B95C29205977C2136BBC70F21895F8C8F471C8522BF446E570463F9CDB31517',
        TakerGets: {
          value: '30',
          issuer: addresses.ISSUER,
          currency: 'EUR'
        },
        TakerPays: '60',
        owner_funds: '70',
        quality: '2'
      }
    ]);

    book._gotOffersFromLegOne = book._gotOffersFromLegTwo = true;
    book.computeAutobridgedOffers();

    assert.strictEqual(book._offersAutobridged.length, 3);

    assert.strictEqual(book._offersAutobridged[0].TakerGets.value, '90');
    assert.strictEqual(book._offersAutobridged[0].TakerPays.value, '90');

    assert(book._offersAutobridged[0].autobridged);

    assert.strictEqual(book._offersAutobridged[1].TakerGets.value, '5');
    assert.strictEqual(book._offersAutobridged[1].TakerPays.value, '10');

    assert(book._offersAutobridged[1].autobridged);

    assert.strictEqual(book._offersAutobridged[2].TakerGets.value, '10');
    assert.strictEqual(book._offersAutobridged[2].TakerPays.value, '100');

    assert(book._offersAutobridged[2].autobridged);
  });

  it('Compute autobridged offers - update funded amount - first two owners equal', function() {
    const book = createRemote().createOrderBook({
      currency_gets: 'EUR',
      issuer_gets: addresses.ISSUER,
      currency_pays: 'USD',
      issuer_pays: addresses.ISSUER
    });

    book._issuerTransferRate = new IOUValue(1000000000);
    book._legOneBook._issuerTransferRate = new IOUValue(1000000000);
    book._legTwoBook._issuerTransferRate = new IOUValue(1000000000);

    book._legOneBook.setOffers([
      {
        Account: addresses.ACCOUNT,
        BookDirectory: '3B95C29205977C2136BBC70F21895F8C8F471C8522BF446E570463F9CDB31517',
        TakerGets: '100',
        TakerPays: {
          value: '100',
          issuer: addresses.ISSUER,
          currency: 'USD'
        },
        owner_funds: '50',
        quality: '1'
      },
      {
        Account: addresses.ACCOUNT,
        BookDirectory: '3B95C29205977C2136BBC70F21895F8C8F471C8522BF446E570463F9CDB31517',
        TakerGets: '100',
        TakerPays: {
          value: '200',
          issuer: addresses.ISSUER,
          currency: 'USD'
        },
        quality: '2'
      }
    ]);

    book._legTwoBook.setOffers([
      {
        Account: addresses.ACCOUNT,
        BookDirectory: '3B95C29205977C2136BBC70F21895F8C8F471C8522BF446E570463F9CDB31517',
        TakerGets: {
          value: '90',
          issuer: addresses.ISSUER,
          currency: 'EUR'
        },
        TakerPays: '90',
        owner_funds: '150',
        quality: '1'
      },
      {
        Account: addresses.ACCOUNT,
        BookDirectory: '3B95C29205977C2136BBC70F21895F8C8F471C8522BF446E570463F9CDB31517',
        TakerGets: {
          value: '30',
          issuer: addresses.ISSUER,
          currency: 'EUR'
        },
        TakerPays: '60',
        quality: '2'
      },
      {
        Account: addresses.OTHER_ACCOUNT,
        BookDirectory: '3B95C29205977C2136BBC70F21895F8C8F471C8522BF446E570463F9CDB31517',
        TakerGets: {
          value: '20',
          issuer: addresses.ISSUER,
          currency: 'EUR'
        },
        TakerPays: '40',
        owner_funds: '70',
        quality: '2'
      }
    ]);

    book._gotOffersFromLegOne = book._gotOffersFromLegTwo = true;
    book.computeAutobridgedOffers();

    assert.strictEqual(book._offersAutobridged.length, 4);

    assert.strictEqual(book._offersAutobridged[0].TakerGets.value, '90');
    assert.strictEqual(book._offersAutobridged[0].TakerPays.value, '90');

    assert(book._offersAutobridged[0].autobridged);

    assert.strictEqual(book._offersAutobridged[1].TakerGets.value, '5');
    assert.strictEqual(book._offersAutobridged[1].TakerPays.value, '10');

    assert(book._offersAutobridged[1].autobridged);

    assert.strictEqual(book._offersAutobridged[2].TakerGets.value, '25');
    assert.strictEqual(book._offersAutobridged[2].TakerPays.value, '100');

    assert(book._offersAutobridged[2].autobridged);

    assert.strictEqual(book._offersAutobridged[3].TakerGets.value, '20');
    assert.strictEqual(book._offersAutobridged[3].TakerPays.value, '80');

    assert(book._offersAutobridged[3].autobridged);
  });

  it('Compute autobridged offers - unfunded offer - owners equal', function() {
    const book = createRemote().createOrderBook({
      currency_gets: 'EUR',
      issuer_gets: addresses.ISSUER,
      currency_pays: 'USD',
      issuer_pays: addresses.ISSUER
    });

    book._issuerTransferRate = new IOUValue(1000000000);
    book._legOneBook._issuerTransferRate = new IOUValue(1000000000);
    book._legTwoBook._issuerTransferRate = new IOUValue(1000000000);

    book._legOneBook.setOffers([
      {
        Account: addresses.ACCOUNT,
        BookDirectory: '3B95C29205977C2136BBC70F21895F8C8F471C8522BF446E570463F9CDB31517',
        TakerGets: '75',
        TakerPays: {
          value: '75',
          issuer: addresses.ISSUER,
          currency: 'USD'
        },
        owner_funds: '0',
        quality: '1'
      }
    ]);

    book._legTwoBook.setOffers([
      {
        Account: addresses.ACCOUNT,
        BookDirectory: '3B95C29205977C2136BBC70F21895F8C8F471C8522BF446E570463F9CDB31517',
        TakerGets: {
          value: '90',
          issuer: addresses.ISSUER,
          currency: 'EUR'
        },
        TakerPays: '90',
        owner_funds: '150',
        quality: '1'
      }
    ]);

    book._gotOffersFromLegOne = book._gotOffersFromLegTwo = true;
    book.computeAutobridgedOffers();

    assert.strictEqual(book._offersAutobridged.length, 1);

    assert.strictEqual(book._offersAutobridged[0].TakerGets.value, '75');
    assert.strictEqual(book._offersAutobridged[0].TakerPays.value, '75');

    assert(book._offersAutobridged[0].autobridged);
  });
});
