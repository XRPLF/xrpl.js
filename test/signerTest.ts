import { assert } from 'chai'
import { sign, authorizeChannel } from 'xrpl-local/ledger/signer'
import { SignedTransaction } from '../src/common/types/objects'
import { Transaction } from '../src/models/transactions'
import Wallet from '../src/Wallet'

function notImplemented() {
    assert.fail("This test is not implemented yet") 
}


describe('Signer tests', function () {
    
    it('sign transaction offline', () => {
        const publicKey =
        '030E58CDD076E798C84755590AAF6237CA8FAE821070A59F648B517A30DC6F589D'
        const privateKey =
        '00141BA006D3363D2FB2785E8DF4E44D3A49908780CB4FB51F6D217C08C021429F'
        const address = 'rhvh5SrgBL5V8oeV9EpDuVszeJSSCEkbPc'

        const tx: Transaction = {
            TransactionType: 'Payment',
            Account: address,
            Destination: 'rQ3PTWGLCbPz8ZCicV5tCX3xuymojTng5r',
            Amount: '20000000',
            Sequence: 1,
            Fee: '12',
            SigningPubKey: publicKey
        }
        const wallet = new Wallet(publicKey, privateKey)
    
        // WHEN signing a transaction offline
        const signedTx: SignedTransaction = sign(wallet, tx)
    
        // THEN we get a signedTransaction
        //schemaValidator.schemaValidate('sign', signedTx)
        // TODO: Figure out how we validate the return result of sign
        signedTx
    })

    it ('multi-signs successfully', () => {
        // TODO:
        notImplemented()
    })

    it ('throws a validation error if multi-signing with no transactions', () => {
        // TODO:
        notImplemented()
    })

    it ('authorizeChannel succeeds', () => {
        const publicKey = '02DEBD2E84F1FB9FB8A0E565F23B3109B43B5EB83DD615E1C59506C16D2EE5CDEF'
        const secretKey = '081C78F2789D35A2D501226BD099A71ED7719FDFC9ACA0257EC4246C022F960F'
        const wallet = new Wallet(publicKey, secretKey)
        const channelId = '5DB01B7FFED6B67E6B0414DED11E051D2EE2B7619CE0EAA6286D67A3A4D5BDB3'
        const amount = '1000000'

        assert.equal(authorizeChannel(wallet, channelId, amount), 
        '3045022100DB6CF7ADF76F55E4A564C986E58541B5805CA4FD44C338CB8A3CAF2F4FCBB1D50220795C8D3ED550ABA33F9D12BE4FD18899338331C590DB07B1DCB5E0493CC9C5C9')
    })

    it ('validate transaction succeeds for valid transaction', () => {
        // TODO:
        notImplemented()
    })

    it ('validate transaction throws for invalid transaction', () => {
        // TODO:
        notImplemented() 
    })
})