import {Client} from 'xrpl-local'
import {TestSuite} from '../../utils'
import Wallet from '../../../src/Wallet'

const {schemaValidator} = Client._PRIVATE
const publicKey =
  '030E58CDD076E798C84755590AAF6237CA8FAE821070A59F648B517A30DC6F589D'
const privateKey =
  '00141BA006D3363D2FB2785E8DF4E44D3A49908780CB4FB51F6D217C08C021429F'
const address = 'rhvh5SrgBL5V8oeV9EpDuVszeJSSCEkbPc'

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/api/index.ts" for more information about the test runner.
 */
export default <TestSuite>{
  'sign transaction offline with txJSON': async (api) => {
    // GIVEN a transaction
    const txJSON = {
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
    const signedTx: {signedTransaction: string; id: string} =
      wallet.signTransaction(txJSON)

    // THEN we get a signedTransaction
    schemaValidator.schemaValidate('sign', signedTx)
  },
}
