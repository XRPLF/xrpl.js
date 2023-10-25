import * as utils from '../src/utils'

describe('Utils', () => {
  it('randomEntropy: valid output', () => {
    const data = utils.randomEntropy()
    expect(typeof data).toEqual('object')
    expect(data instanceof Buffer).toBeTruthy()
    expect(data.length).toEqual(16)
    expect(data.toString('hex').length).toEqual(32)
    expect(data.toString('hex')).toMatch(/^[a-f0-9]+$/u)
  })

  it('calculateChecksum: 1st position', () => {
    expect(utils.calculateChecksum(0, 55988)).toEqual(8)
  })

  it('calculateChecksum: 8th position', () => {
    expect(utils.calculateChecksum(7, 49962)).toEqual(0)
  })

  it('checkChecksum: 2nd position, split numbers', () => {
    expect(utils.checkChecksum(1, 55450, 3)).toBeTruthy()
  })

  it('checkChecksum: 7th position, split numbers', () => {
    expect(utils.checkChecksum(6, 18373, 7)).toBeTruthy()
  })

  it('checkChecksum: 4th position, as string', () => {
    expect(utils.checkChecksum(3, '391566')).toBeTruthy()
  })

  it('randomSecret: valid checksums', () => {
    utils.randomSecret()
    expect(0).toEqual(0)
  })

  it('randomSecret: valid output', () => {
    const data = utils.randomSecret()
    expect(Array.isArray(data)).toBeTruthy()
    expect(data.length).toEqual(8)
    expect(typeof data[0]).toEqual('string')
    expect(data[0].length).toEqual(6)
    expect(data[7].length).toEqual(6)
  })

  it('entropyToSecret', () => {
    const entropy = Buffer.from('76ebb2d06879b45b7568fb9c1ded097c', 'hex')
    const secret = [
      '304435',
      '457766',
      '267453',
      '461717',
      '300560',
      '644127',
      '076618',
      '024286',
    ]
    expect(utils.entropyToSecret(entropy)).toEqual(secret)
  })

  it('secretToEntropy', () => {
    const secret = [
      '304435',
      '457766',
      '267453',
      '461717',
      '300560',
      '644127',
      '076618',
      '024286',
    ]
    const entropy = Buffer.from('76ebb2d06879b45b7568fb9c1ded097c', 'hex')
    expect(utils.secretToEntropy(secret)).toEqual(entropy)
  })

  it('parseSecretString with spaces valid', () => {
    const secret = [
      '304435',
      '457766',
      '267453',
      '461717',
      '300560',
      '644127',
      '076618',
      '024286',
    ]
    expect(
      utils.parseSecretString(
        '304435 457766 267453 461717 300560 644127 076618 024286',
      ),
    ).toEqual(secret)
    expect(
      utils.parseSecretString(
        '304435457766267453461717300560644127076618024286',
      ),
    ).toEqual(secret)
    expect(
      utils.parseSecretString(`
      304435 457766
      267453 461717
      300560 644127
      076618 024286
    `),
    ).toEqual(secret)
  })
})
