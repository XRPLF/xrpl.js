import { hexToBytes } from '@xrplf/isomorphic/utils'
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
    const entropy = hexToBytes('0123456789ABCDEF0123456789ABCDEF')
    const account = new Account(entropy)

    it('familySeed as expected', () => {
      expect(account.getFamilySeed()).toEqual('sEdSKUm3MuTvN745ezpSM94Xw45BsbA')
    })
    it('address as expected', () => {
      expect(account.getAddress()).toEqual('rMjDw1h3vQZUfYkQJV7PXeToajAA4JtkFJ')
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
      expect(account.getFamilySeed()).toEqual('sEdSmrWh6iszywyGQCgguErD9DiuBY8')
    })
    it('publicKey as expected', () => {
      const pubkey =
        'EDBB1A131EA944C5D07D1DE39CAD2E128329CD1321F2F5759D2BB3EB94D5B8AB2F'
      expect(account.getKeypair().publicKey).toEqual(pubkey)
    })
    it('privateKey as expected', () => {
      const privkey =
        'EDB55E7518A732963CD444E6D1E682DCD6AD60DD53AA5743854D4C4AB52E2D6800'
      expect(account.getKeypair().privateKey).toEqual(privkey)
    })
    it('address as expected', () => {
      expect(account.getAddress()).toEqual('rJmyR83BfJdRpJabbkBH2ES8mkR168bNVJ')
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
