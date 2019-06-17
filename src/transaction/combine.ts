import binary = require('ripple-binary-codec')
import * as utils from './utils'
import {validate} from '../common'
import {computeBinaryTransactionHash} from 'ripple-hashes'

function hashArrayToObjectArray( signedTransactions : Array<string> ): Array {
    validate.combine({signedTransactions})
    const transactions: any[] = signedTransactions.map(binary.decode)
    const tx = transactions[0]
    delete tx.Signers
    transactions.forEach( _tx => {
        delete _tx.Signers;
        if ( JSON.stringify(tx) !== JSON.stringify(_tx)) {
            throw new utils.common.errors.ValidationError('txJSON is not the same for all signedTransactions')
        }
    })
    return transactions
}

function combine(signedTransactions: Array<string>): object {
    const txs = hashArrayToObjectArray(signedTransactions)
    const signedTransaction = binary.encode(txs[0])
    const id = computeBinaryTransactionHash(signedTransaction)
    return {signedTransaction, id}
}

export default combine
