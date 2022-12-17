const {
  classicAddressToXAddress,
  xAddressToClassicAddress,
  isValidXAddress,
  encodeXAddress,
} = require('./index')

const testCases = [
  [
    'r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59',
    false,
    'X7AcgcsBL6XDcUb289X4mJ8djcdyKaB5hJDWMArnXr61cqZ',
    'T719a5UwUCnEs54UsxG9CJYYDhwmFCqkr7wxCcNcfZ6p5GZ',
  ],
  [
    'r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59',
    1,
    'X7AcgcsBL6XDcUb289X4mJ8djcdyKaGZMhc9YTE92ehJ2Fu',
    'T719a5UwUCnEs54UsxG9CJYYDhwmFCvbJNZbi37gBGkRkbE',
  ],
  [
    'r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59',
    14,
    'X7AcgcsBL6XDcUb289X4mJ8djcdyKaGo2K5VpXpmCqbV2gS',
    'T719a5UwUCnEs54UsxG9CJYYDhwmFCvqXVCALUGJGSbNV3x',
  ],
  [
    'r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59',
    11747,
    'X7AcgcsBL6XDcUb289X4mJ8djcdyKaLFuhLRuNXPrDeJd9A',
    'T719a5UwUCnEs54UsxG9CJYYDhwmFCziiNHtUukubF2Mg6t',
  ],
  [
    'rLczgQHxPhWtjkaQqn3Q6UM8AbRbbRvs5K',
    false,
    'XVZVpQj8YSVpNyiwXYSqvQoQqgBttTxAZwMcuJd4xteQHyt',
    'TVVrSWtmQQssgVcmoMBcFQZKKf56QscyWLKnUyiuZW8ALU4',
  ],
  [
    'rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo',
    false,
    'X7YenJqxv3L66CwhBSfd3N8RzGXxYqPopMGMsCcpho79rex',
    'T77wVQzA8ntj9wvCTNiQpNYLT5hmhRsFyXDoMLqYC4BzQtV',
  ],
  [
    'rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo',
    58,
    'X7YenJqxv3L66CwhBSfd3N8RzGXxYqV56ZkTCa9UCzgaao1',
    'T77wVQzA8ntj9wvCTNiQpNYLT5hmhR9kej6uxm4jGcQD7rZ',
  ],
  [
    'rsA2LpzuawewSBQXkiju3YQTMzW13pAAdW',
    23480,
    'X7d3eHCXzwBeWrZec1yT24iZerQjYL8m8zCJ16ACxu1BrBY',
    'T7YChPFWifjCAXLEtg5N74c7fSAYsvSokwcmBPBUZWhxH5P',
  ],
  [
    'rsA2LpzuawewSBQXkiju3YQTMzW13pAAdW',
    11747,
    'X7d3eHCXzwBeWrZec1yT24iZerQjYLo2CJf8oVC5CMWey5m',
    'T7YChPFWifjCAXLEtg5N74c7fSAYsvTcc7nEfwuEEvn5Q4w',
  ],
  [
    'rGWrZyQqhTp9Xu7G5Pkayo7bXjH4k4QYpf',
    false,
    'XVLhHMPHU98es4dbozjVtdWzVrDjtV5fdx1mHp98tDMoQXb',
    'TVE26TYGhfLC7tQDno7G8dGtxSkYQn49b3qD26PK7FcGSKE',
  ],
  [
    'rGWrZyQqhTp9Xu7G5Pkayo7bXjH4k4QYpf',
    0,
    'XVLhHMPHU98es4dbozjVtdWzVrDjtV8AqEL4xcZj5whKbmc',
    'TVE26TYGhfLC7tQDno7G8dGtxSkYQnSy8RHqGHoGJ59spi2',
  ],
  [
    'rGWrZyQqhTp9Xu7G5Pkayo7bXjH4k4QYpf',
    1,
    'XVLhHMPHU98es4dbozjVtdWzVrDjtV8xvjGQTYPiAx6gwDC',
    'TVE26TYGhfLC7tQDno7G8dGtxSkYQnSz1uDimDdPYXzSpyw',
  ],
  [
    'rGWrZyQqhTp9Xu7G5Pkayo7bXjH4k4QYpf',
    2,
    'XVLhHMPHU98es4dbozjVtdWzVrDjtV8zpDURx7DzBCkrQE7',
    'TVE26TYGhfLC7tQDno7G8dGtxSkYQnTryP9tG9TW8GeMBmd',
  ],
  [
    'rGWrZyQqhTp9Xu7G5Pkayo7bXjH4k4QYpf',
    32,
    'XVLhHMPHU98es4dbozjVtdWzVrDjtVoYiC9UvKfjKar4LJe',
    'TVE26TYGhfLC7tQDno7G8dGtxSkYQnT2oqaCDzMEuCDAj1j',
  ],
  [
    'rGWrZyQqhTp9Xu7G5Pkayo7bXjH4k4QYpf',
    276,
    'XVLhHMPHU98es4dbozjVtdWzVrDjtVoKj3MnFGMXEFMnvJV',
    'TVE26TYGhfLC7tQDno7G8dGtxSkYQnTMgJJYfAbsiPsc6Zg',
  ],
  [
    'rGWrZyQqhTp9Xu7G5Pkayo7bXjH4k4QYpf',
    65591,
    'XVLhHMPHU98es4dbozjVtdWzVrDjtVozpjdhPQVdt3ghaWw',
    'TVE26TYGhfLC7tQDno7G8dGtxSkYQn7ryu2W6njw7mT1jmS',
  ],
  [
    'rGWrZyQqhTp9Xu7G5Pkayo7bXjH4k4QYpf',
    16781933,
    'XVLhHMPHU98es4dbozjVtdWzVrDjtVqrDUk2vDpkTjPsY73',
    'TVE26TYGhfLC7tQDno7G8dGtxSkYQnVsw45sDtGHhLi27Qa',
  ],
  [
    'rGWrZyQqhTp9Xu7G5Pkayo7bXjH4k4QYpf',
    4294967294,
    'XVLhHMPHU98es4dbozjVtdWzVrDjtV1kAsixQTdMjbWi39u',
    'TVE26TYGhfLC7tQDno7G8dGtxSkYQnX8tDFQ53itLNqs6vU',
  ],
  [
    'rGWrZyQqhTp9Xu7G5Pkayo7bXjH4k4QYpf',
    4294967295,
    'XVLhHMPHU98es4dbozjVtdWzVrDjtV18pX8yuPT7y4xaEHi',
    'TVE26TYGhfLC7tQDno7G8dGtxSkYQnXoy6kSDh6rZzApc69',
  ],
  [
    'rPEPPER7kfTD9w2To4CQk6UCfuHM9c6GDY',
    false,
    'XV5sbjUmgPpvXv4ixFWZ5ptAYZ6PD2gYsjNFQLKYW33DzBm',
    'TVd2rqMkYL2AyS97NdELcpeiprNBjwLZzuUG5rZnaewsahi',
  ],
  [
    'rPEPPER7kfTD9w2To4CQk6UCfuHM9c6GDY',
    0,
    'XV5sbjUmgPpvXv4ixFWZ5ptAYZ6PD2m4Er6SnvjVLpMWPjR',
    'TVd2rqMkYL2AyS97NdELcpeiprNBjwRQUBetPbyrvXSTuxU',
  ],
  [
    'rPEPPER7kfTD9w2To4CQk6UCfuHM9c6GDY',
    13371337,
    'XV5sbjUmgPpvXv4ixFWZ5ptAYZ6PD2qwGkhgc48zzcx6Gkr',
    'TVd2rqMkYL2AyS97NdELcpeiprNBjwVUDvp3vhpXbNhLwJi',
  ],
]

;[false, true].forEach((isTestAddress) => {
  const MAX_32_BIT_UNSIGNED_INT = 4294967295
  const network = isTestAddress ? ' (test)' : ' (main)'

  for (const i in testCases) {
    const testCase = testCases[i]
    const classicAddress = testCase[0]
    const tag = testCase[1] !== false ? testCase[1] : false
    const xAddress = isTestAddress ? testCase[3] : testCase[2]
    test(`Converts ${classicAddress}${
      tag ? `:${tag}` : ''
    } to ${xAddress}${network}`, () => {
      expect(classicAddressToXAddress(classicAddress, tag, isTestAddress)).toBe(
        xAddress,
      )
      const myClassicAddress = xAddressToClassicAddress(xAddress)
      expect(myClassicAddress).toEqual({
        classicAddress,
        tag,
        test: isTestAddress,
      })
      expect(isValidXAddress(xAddress)).toBe(true)
    })
  }

  {
    const classicAddress = 'rGWrZyQqhTp9Xu7G5Pkayo7bXjH4k4QYpf'
    const tag = MAX_32_BIT_UNSIGNED_INT + 1

    test(`Converting ${classicAddress}:${tag}${network} throws`, () => {
      expect(() => {
        classicAddressToXAddress(classicAddress, tag, isTestAddress)
      }).toThrowError(new Error('Invalid tag'))
    })
  }

  {
    const classicAddress = 'r'
    test(`Invalid classic address: Converting ${classicAddress}${network} throws`, () => {
      expect(() => {
        classicAddressToXAddress(classicAddress, false, isTestAddress)
      }).toThrowError(
        new Error('invalid_input_size: decoded data must have length >= 5'),
      )
    })
  }

  {
    const highAndLowAccounts = [
      Buffer.from('00'.repeat(20), 'hex'),
      Buffer.from(`${'00'.repeat(19)}01`, 'hex'),
      Buffer.from('01'.repeat(20), 'hex'),
      Buffer.from('FF'.repeat(20), 'hex'),
    ]

    highAndLowAccounts.forEach((accountId) => {
      const testCases = [false, 0, 1, MAX_32_BIT_UNSIGNED_INT]
      testCases.forEach((t) => {
        const tag = t | false
        const xAddress = encodeXAddress(accountId, tag, isTestAddress)
        test(`Encoding ${accountId.toString('hex')}${
          tag ? `:${tag}` : ''
        } to ${xAddress} has expected length`, () => {
          expect(xAddress.length).toBe(47)
        })
      })
    })
  }
})

{
  const xAddress = 'XVLhHMPHU98es4dbozjVtdWzVrDjtV5fdx1mHp98tDMoQXa'
  test(`Invalid X-address (bad checksum): Converting ${xAddress} throws`, () => {
    expect(() => {
      xAddressToClassicAddress(xAddress)
    }).toThrowError(new Error('checksum_invalid'))
  })
}

{
  const xAddress = 'dGzKGt8CVpWoa8aWL1k18tAdy9Won3PxynvbbpkAqp3V47g'
  test(`Invalid X-address (bad prefix): Converting ${xAddress} throws`, () => {
    expect(() => {
      xAddressToClassicAddress(xAddress)
    }).toThrowError(new Error('Invalid X-address: bad prefix'))
  })
}

test(`Invalid X-address (64-bit tag) throws`, () => {
  expect(() => {
    // Encoded from:
    // {
    //   classicAddress: 'rGWrZyQqhTp9Xu7G5Pkayo7bXjH4k4QYpf',
    //   tag: MAX_32_BIT_UNSIGNED_INT + 1
    // }
    xAddressToClassicAddress('XVLhHMPHU98es4dbozjVtdWzVrDjtV18pX8zeUygYrCgrPh')
  }).toThrowError('Unsupported X-address')
})

test(`Invalid Account ID throws`, () => {
  expect(() => {
    encodeXAddress(Buffer.from('00'.repeat(19), 'hex'), false, false)
  }).toThrowError('Account ID must be 20 bytes')
})

test(`isValidXAddress returns false for invalid X-address`, () => {
  expect(
    isValidXAddress('XVLhHMPHU98es4dbozjVtdWzVrDjtV18pX8zeUygYrCgrPh'),
  ).toBe(false)
})

test(`Converts X7AcgcsBL6XDcUb... to r9cZA1mLK5R5A... and tag: false`, () => {
  const classicAddress = 'r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59'
  const tag = false
  const xAddress = 'X7AcgcsBL6XDcUb289X4mJ8djcdyKaB5hJDWMArnXr61cqZ'
  const isTestAddress = false
  expect(classicAddressToXAddress(classicAddress, tag, isTestAddress)).toBe(
    xAddress,
  )
  const myClassicAddress = xAddressToClassicAddress(xAddress)
  expect(myClassicAddress).toEqual({
    classicAddress,
    tag,
    test: isTestAddress,
  })
  expect(isValidXAddress(xAddress)).toBe(true)

  // Notice that converting an X-address to a classic address has `result.tag === false` (not undefined)
  expect(myClassicAddress.tag).toEqual(false)
})
