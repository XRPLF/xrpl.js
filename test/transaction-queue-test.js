'use strict';
const assert = require('assert');
const Transaction = require('ripple-lib').Transaction;
const TransactionQueue = require('ripple-lib')._test.TransactionQueue;

describe('Transaction queue', function() {
  it('Push transaction', function() {
    const queue = new TransactionQueue();
    const tx = new Transaction();

    queue.push(tx);

    assert.strictEqual(queue.length(), 1);
  });

  it('Remove transaction', function() {
    const queue = new TransactionQueue();
    const tx = new Transaction();

    queue.push(tx);
    queue.remove(tx);

    assert.strictEqual(queue.length(), 0);
  });

  it('Remove transaction by ID', function() {
    const queue = new TransactionQueue();
    const tx = new Transaction();

    queue.push(tx);

    tx.submittedIDs = [
      '1A4DEBF37496464145AA301F0AA77712E3A2BFE3480D24C3584663F800B85B5B',
      '2A4DEBF37496464145AA301F0AA77712E3A2BFE3480D24C3584663F800B85B5B'
    ];

    queue.remove(
      '3A4DEBF37496464145AA301F0AA77712E3A2BFE3480D24C3584663F800B85B5B');

    assert.strictEqual(queue.length(), 1);

    queue.remove(
      '2A4DEBF37496464145AA301F0AA77712E3A2BFE3480D24C3584663F800B85B5B');

    assert.strictEqual(queue.length(), 0);
  });

  it('Add sequence', function() {
    const queue = new TransactionQueue();
    queue.addReceivedSequence(1);
    assert(queue.hasSequence(1));
  });

  it('Add ID', function() {
    const queue = new TransactionQueue();
    const tx = new Transaction();
    queue.addReceivedId(
      '1A4DEBF37496464145AA301F0AA77712E3A2BFE3480D24C3584663F800B85B5B', tx);
    assert.strictEqual(queue.getReceived(
      '2A4DEBF37496464145AA301F0AA77712E3A2BFE3480D24C3584663F800B85B5B'),
      undefined);
    assert.strictEqual(queue.getReceived(
      '1A4DEBF37496464145AA301F0AA77712E3A2BFE3480D24C3584663F800B85B5B'), tx);
  });

  it('Get submission', function() {
    const queue = new TransactionQueue();
    const tx = new Transaction();

    queue.push(tx);

    tx.submittedIDs = [
      '1A4DEBF37496464145AA301F0AA77712E3A2BFE3480D24C3584663F800B85B5B',
      '2A4DEBF37496464145AA301F0AA77712E3A2BFE3480D24C3584663F800B85B5B'
    ];

    assert.strictEqual(queue.getSubmission(
      '1A4DEBF37496464145AA301F0AA77712E3A2BFE3480D24C3584663F800B85B5B'), tx);
    assert.strictEqual(queue.getSubmission(
      '2A4DEBF37496464145AA301F0AA77712E3A2BFE3480D24C3584663F800B85B5B'), tx);
    assert.strictEqual(queue.getSubmission(
      '3A4DEBF37496464145AA301F0AA77712E3A2BFE3480D24C3584663F800B85B5B'),
      undefined);
  });

  it('Iterate over queue', function() {
    const queue = new TransactionQueue();
    let count = 10;

    for (let i = 0; i < count; i++) {
      queue.push(new Transaction());
    }

    queue.forEach(function(tx) {
      assert(tx instanceof Transaction);
      --count;
    });

    assert.strictEqual(count, 0);
  });
});

