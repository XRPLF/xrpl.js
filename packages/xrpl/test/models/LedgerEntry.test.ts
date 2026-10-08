import { assert } from 'chai'

import { AccountObject } from '../../src'
import {
  DID,
  LedgerEntry,
  MPToken,
  NFTokenOffer,
  NFTokenPage,
  PermissionedDomain,
} from '../../src/models/ledger'

const ACCOUNT = 'rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe'
const INDEX = 'A738A1E6E8505E1FC77BBB9FEF84FF9A9C609F2739E0F9573CDD6367100A0AA9'
const PREVIOUS_TXN = {
  PreviousTxnID:
    '8C20D9D2D5C6B1B9F4F8E2E1B8A3A9C2B4F0D6C9E1A7B3D5F2C8E4A6B0D9C7E1',
  PreviousTxnLgrSeq: 42,
}

const did: DID = {
  LedgerEntryType: 'DID',
  index: INDEX,
  Account: ACCOUNT,
  Data: '617474657374',
  DIDDocument: '646F63',
  URI: '6469645F6578616D706C65',
  Flags: 0,
  OwnerNode: '0',
  ...PREVIOUS_TXN,
}

const mpToken: MPToken = {
  LedgerEntryType: 'MPToken',
  index: INDEX,
  MPTokenIssuanceID: '0000012FFD9EE5DA93AC614B4DB94D7E0FCE415CA51BED47',
  MPTAmount: '100',
  Flags: 0,
  ...PREVIOUS_TXN,
}

const nftOffer: NFTokenOffer = {
  LedgerEntryType: 'NFTokenOffer',
  index: INDEX,
  Amount: '1000000',
  Expiration: 0,
  Flags: 1,
  Owner: ACCOUNT,
  ...PREVIOUS_TXN,
}

const nftPage: NFTokenPage = {
  LedgerEntryType: 'NFTokenPage',
  index: INDEX,
  NFTokens: [
    {
      NFToken: {
        Flags: 8,
        Issuer: ACCOUNT,
        NFTokenID:
          '000800006203F49C21D5D6E022CB16DE3538F248662FC73C00000099B7E7E2F4',
        NFTokenTaxon: 0,
      },
    },
  ],
  ...PREVIOUS_TXN,
}

const permissionedDomain: PermissionedDomain = {
  LedgerEntryType: 'PermissionedDomain',
  index: INDEX,
  Owner: ACCOUNT,
  AcceptedCredentials: [
    { Credential: { Issuer: ACCOUNT, CredentialType: '4B5943' } },
  ],
  Flags: 0,
  OwnerNode: '0',
  Sequence: 1,
  ...PREVIOUS_TXN,
}

describe('LedgerEntry', function () {
  // These assignments only compile when each type is a member of the
  // LedgerEntry and AccountObject unions.
  const ledgerEntries: LedgerEntry[] = [
    did,
    mpToken,
    nftOffer,
    nftPage,
    permissionedDomain,
  ]
  const accountObjects: AccountObject[] = [
    did,
    mpToken,
    nftOffer,
    nftPage,
    permissionedDomain,
  ]

  it('includes DID, MPToken, NFTokenOffer, NFTokenPage and PermissionedDomain', function () {
    const expected = [
      'DID',
      'MPToken',
      'NFTokenOffer',
      'NFTokenPage',
      'PermissionedDomain',
    ]
    assert.deepEqual(
      ledgerEntries.map((entry) => entry.LedgerEntryType),
      expected,
    )
    assert.deepEqual(
      accountObjects.map((object) => object.LedgerEntryType),
      expected,
    )
  })

  it('narrows an account object by LedgerEntryType', function () {
    const token = accountObjects.find(
      (object): object is MPToken => object.LedgerEntryType === 'MPToken',
    )
    assert.equal(token?.MPTAmount, '100')
  })
})
