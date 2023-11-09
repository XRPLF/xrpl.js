export function hexOnly(hex: string) {
  return hex.replace(/[^a-fA-F0-9]/g, '')
}

export function parseHexOnly(hex: string) {
  return Buffer.from(hexOnly(hex), 'hex')
}
