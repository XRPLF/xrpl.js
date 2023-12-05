class NativeAsset {
  private nativeAsset = 'XRP'

  constructor() {
    //
  }

  set(asset: string): void {
    this.nativeAsset = asset.trim().toUpperCase()
  }

  get(): string {
    return this.nativeAsset
  }
}

const nativeAsset = new NativeAsset()

export { nativeAsset }
