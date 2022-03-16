import { assert } from 'chai'
import { createXchainPayment, convertStringToHex, Payment } from 'xrpl-local'

describe('createXchainPayment', function () {
  it('successful xchain payment creation', function () {
    const payment: Payment = {
      TransactionType: 'Payment',
      Account: 'rRandom',
      Destination: 'rRandom2',
      Amount: '3489303',
    }
    const sidechainAccount = 'rSidechain'

    const expectedPayment = {
      ...payment,
      Memos: [
        {
          Memo: {
            MemoData: convertStringToHex(sidechainAccount),
          },
        },
      ],
    }

    const resultPayment = createXchainPayment(payment, sidechainAccount)
    assert.deepEqual(resultPayment, expectedPayment)

    // ensure that the original object wasn't modified
    assert.notDeepEqual(resultPayment, payment)
  })

  it('removes TxnSignature', function () {
    const payment: Payment = {
      TransactionType: 'Payment',
      Account: 'rRandom',
      Destination: 'rRandom2',
      Amount: '3489303',
      TxnSignature: 'asodfiuaosdfuaosd',
    }
    const sidechainAccount = 'rSidechain'

    const expectedPayment = {
      ...payment,
      Memos: [
        {
          Memo: {
            MemoData: convertStringToHex(sidechainAccount),
          },
        },
      ],
    }
    delete expectedPayment.TxnSignature

    const resultPayment = createXchainPayment(payment, sidechainAccount)
    assert.deepEqual(resultPayment, expectedPayment)

    // ensure that the original object wasn't modified
    assert.notDeepEqual(resultPayment, payment)
  })

  it('fails with 3 memos', function () {
    const payment: Payment = {
      TransactionType: 'Payment',
      Account: 'rRandom',
      Destination: 'rRandom2',
      Amount: '3489303',
      Memos: [
        {
          Memo: {
            MemoData: '2934723843ace',
          },
        },
        {
          Memo: {
            MemoData: '2934723843ace',
          },
        },
        {
          Memo: {
            MemoData: '2934723843ace',
          },
        },
      ],
    }
    assert.throws(() => {
      createXchainPayment(payment, 'rSidechain')
    }, /Cannot have more than 2 memos/u)
  })
})
