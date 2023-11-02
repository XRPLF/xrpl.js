import { deriveAddress, deriveKeypair, generateSeed } from 'ripple-keypairs'

import { Account, secretToEntropy } from '../src'

describe('API: XRPL Secret Numbers', () => {
  describe('Generate new account', () => {
    const account = new Account()
    it('Output sanity checks', () => {
      expect(account.getAddress()).toMatch(/^r[a-zA-Z0-9]{19,}$/u)
      const entropy = secretToEntropy(`${account.toString()}`.split(' '))
      const familySeed = generateSeed({ entropy })
      const keypair = deriveKeypair(familySeed)
      const address = deriveAddress(keypair.publicKey)
      expect(address).toEqual(account.getAddress())
      expect(familySeed).toEqual(account.getFamilySeed())
    })
  })

  describe('Account based on entropy', () => {
    const entropy = Buffer.from('0123456789ABCDEF0123456789ABCDEF', 'hex')
    const account = new Account(entropy)

    it('familySeed as expected', () => {
      expect(account.getFamilySeed()).toEqual('sp5DmDCut79BpgumfHhvRzdxXYQyU')
    })
    it('address as expected', () => {
      expect(account.getAddress()).toEqual('rMCcybKHfwCSkDHd3M36PAeUniEoygwjR3')
    })
    it('Account object to string as expected', () => {
      const accountAsStr =
        '002913 177673 352434 527196 002910 177672 352435 527190'
      expect(`${account.toString()}`).toEqual(accountAsStr)
    })
  })

  describe('Account based on existing secret', () => {
    const secret = [
      '084677',
      '005323',
      '580272',
      '282388',
      '626800',
      '105300',
      '560913',
      '071783',
    ]

    const account = new Account(secret)

    it('familySeed as expected', () => {
      expect(account.getFamilySeed()).toEqual('sswpWwri7Y11dNCSmXdphgcoPZk3y')
    })
    it('publicKey as expected', () => {
      const pubkey =
        '020526A0EDC9123F7FBB7588402518B80FCD2C8D8AB4C45F5A68A2F220098EA06F'
      expect(account.getKeypair().publicKey).toEqual(pubkey)
    })
    it('privateKey as expected', () => {
      const privkey =
        '005122B2127B4635FEE7D242FA6EC9B02B611C04494D0D7D49764374D90C8BC8D3'
      expect(account.getKeypair().privateKey).toEqual(privkey)
    })
    it('address as expected', () => {
      expect(account.getAddress()).toEqual('rfqJsRLLmr7wdWnEzW1mP6AVaPSdzmso9Z')
    })
    it('Account object to string as expected', () => {
      const accountAsStr =
        '084677 005323 580272 282388 626800 105300 560913 071783'
      expect(`${account.toString()}`).toEqual(accountAsStr)
    })
  })

  describe('Checksum error', () => {
    const secret = [
      '084677',
      '005324',
      '580272',
      '626800',
      '282388',
      '105300',
      '560913',
      '071783',
    ]
    it('Should throw an Checksum Error', () => {
      expect(() => {
        // eslint-disable-next-line no-new -- Don't want unused variable
        new Account(secret)
      })
        // TODO: Remove if jest is removed.
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment -- Jest and Jasmine have two different signatures.
        // @ts-expect-error
        .toThrowError(Error, 'Invalid secret part: checksum invalid')
    })
  })
})
