import Wallet from '../../src/Wallet'
import { assert } from 'chai'

/**
 * Wallet getXAddress Testing
 *
 * Provides tests for Wallet's getXAddress
 */
 describe('Wallet getXAddress', function () {
    const publicKey =
      '030E58CDD076E798C84755590AAF6237CA8FAE821070A59F648B517A30DC6F589D'
    const privateKey =
      '00141BA006D3363D2FB2785E8DF4E44D3A49908780CB4FB51F6D217C08C021429F'
    const wallet = new Wallet(publicKey, privateKey)
    const tag = 1337
    const mainnetXAddress = 'X7gJ5YK8abHf2eTPWPFHAAot8Knck11QGqmQ7a6a3Z8PJvk'
    const testnetXAddress = 'T7bq3e7kxYq9pwDz8UZhqAZoEkcRGTXSNr5immvcj3DYRaV'

    it('returns a testnet XAddress when test is true', () => {
      const result = wallet.getXAddress(tag, true)
      assert.equal(result, testnetXAddress)
    })

    it('returns a mainnet XAddress when test is false', () => {
      const result = wallet.getXAddress(tag, false)
      assert.equal(result, mainnetXAddress)
    })
 })
