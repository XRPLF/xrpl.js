export function hexOnly(hex: string): string {
  return hex.replace(/[^a-fA-F0-9]/g, '')
}

export function parseHexOnly(hex: string): Buffer {
  return Buffer.from(hexOnly(hex), 'hex')
}
