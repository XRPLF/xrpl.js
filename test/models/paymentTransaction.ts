import { ValidationError } from 'xrpl-local/common/errors'
import { PaymentTransactionFlagsEnum, verifyPaymentTransaction } from './../../src/models/transactions/paymentTransaction'
import { assert } from 'chai'
import { verify } from '../../src/models/transactions'

/**
 * PaymentTransaction Verification Testing
 *
 * Providing runtime verification testing for each specific transaction type
 */
describe('Payment Transaction Verification', () => {
    let paymentTransaction

  beforeEach(function () {
    paymentTransaction = {
      Account: "rEDkMjt2bUtbwJDrp2Z2G54p8XauGjDkfq",
      Amount: {
        currency: "DGX",
        issuer: "rwZZuhKUjaR3ANckeUMmX2KDdA4AoAB5WM",
        value: "5",
      },
      Destination: "rL87kubrKHCm1psco3KpemtR7ephUuuVV9",
      Fee: "12",
      Flags: 2147483648,
      LastLedgerSequence: 65953073,
      Sequence: 65923914,
      SigningPubKey:
        "02F9E33F16DF9507705EC954E3F94EB5F10D1FC4A354606DBE6297DBB1096FE654",
      TransactionType: "Payment",
      TxnSignature:
        "3045022100E3FAE0EDEC3D6A8FF6D81BC9CF8288A61B7EEDE8071E90FF9314CB4621058D10022043545CF631706D700CEE65A1DB83EFDD185413808292D9D90F14D87D3DC2D8CB",
    } as any;
  });

    it (`verifies valid PaymentTransaction`, () => {
        assert.doesNotThrow(() => {
            verifyPaymentTransaction(paymentTransaction)
            verify(paymentTransaction)
        })
    })

    it (`throws when Amount is missing`, () => {
        delete paymentTransaction.Amount
        assert.throws(
            () => {
            verifyPaymentTransaction(paymentTransaction)
            verify(paymentTransaction)
        },
            ValidationError,
            'PaymentTransaction: missing field Amount'
        )
    })

    it (`throws when Amount is invalid`, () => {
        paymentTransaction.Amount = 1234
        assert.throws(
            () => {
            verifyPaymentTransaction(paymentTransaction)
            verify(paymentTransaction)
        },
            ValidationError,
            'PaymentTransaction: invalid Amount'
        )
    })

    it (`throws when Destination is missing`, () => {
        delete paymentTransaction.Destination
        assert.throws(
            () => {
            verifyPaymentTransaction(paymentTransaction)
            verify(paymentTransaction)
        },
            ValidationError,
            'PaymentTransaction: missing field Destination'
        )
    })

    it (`throws when Destination is invalid`, () => {
        paymentTransaction.Destination = 7896214
        assert.throws(
            () => {
            verifyPaymentTransaction(paymentTransaction)
            verify(paymentTransaction)
        },
            ValidationError,
            'PaymentTransaction: invalid Destination'
        )
    })

    it (`throws when DestinationTag is not a number`, () => {
        paymentTransaction.DestinationTag = '1'
        assert.throws(
            () => {
            verifyPaymentTransaction(paymentTransaction)
            verify(paymentTransaction)
        },
            ValidationError,
            'PaymentTransaction: DestinationTag must be a number'
        )
    })

    it (`throws when InvoiceID is not a string`, () => {
        paymentTransaction.InvoiceID = 19832
        assert.throws(
            () => {
            verifyPaymentTransaction(paymentTransaction)
            verify(paymentTransaction)
        },
            ValidationError,
            'PaymentTransaction: InvoiceID must be a string'
        )
    })

    it (`throws when Paths is invalid`, () => {
        paymentTransaction.Paths = [[{ account: 123 }]]
        assert.throws(
            () => {
            verifyPaymentTransaction(paymentTransaction)
            verify(paymentTransaction)
        },
            ValidationError,
            'PaymentTransaction: invalid Paths'
        )
    })

    it (`throws when SendMax is invalid`, () => {
        paymentTransaction.SendMax = 100000000
        assert.throws(
            () => {
            verifyPaymentTransaction(paymentTransaction)
            verify(paymentTransaction)
        },
            ValidationError,
            'PaymentTransaction: invalid SendMax'
        )
    })

    it (`verifies valid DeliverMin with tfPartialPayment flag set as a number`, () => {
        paymentTransaction.DeliverMin = '10000'
        paymentTransaction.Flags = PaymentTransactionFlagsEnum.tfPartialPayment,
        assert.doesNotThrow(() => {
            verifyPaymentTransaction(paymentTransaction)
            verify(paymentTransaction)
        })
    })

  it(`verifies valid DeliverMin with tfPartialPayment flag set as a boolean`, function () {
    paymentTransaction.DeliverMin = "10000";
    paymentTransaction.Flags = 0x00020000;
    assert.doesNotThrow(() => verifyPaymentTransaction(paymentTransaction));
    assert.doesNotThrow(() => verify(paymentTransaction));
  });

    it (`throws when DeliverMin is invalid`, () => {
        paymentTransaction.DeliverMin = 10000
        paymentTransaction.Flags = { tfPartialPayment: true }
        assert.throws(
            () => {
            verifyPaymentTransaction(paymentTransaction)
            verify(paymentTransaction)
        },
            ValidationError,
            'PaymentTransaction: invalid DeliverMin'
        )
    })

    it (`throws when tfPartialPayment flag is missing with valid DeliverMin`, () => {
        paymentTransaction.DeliverMin = '10000'
        assert.throws(
            () => {
            verifyPaymentTransaction(paymentTransaction)
            verify(paymentTransaction)
        },
            ValidationError,
            'PaymentTransaction: tfPartialPayment flag required with DeliverMin'
        )
    })
})
