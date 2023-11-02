import * as fs from 'fs'
import * as path from 'path'

const jsonFilePath = path.join(__dirname, '../../globalTestData.json')

interface IGlobalTestDataMap {
  // TODO: add sidechains test data types here and remove AMM example below
  ammPool?: {
    issuerWalletSeed: string
    lpWalletSeed: string
    testWalletSeed: string
    asset: object
    asset2: object
  }
}

// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- required
export class GlobalTestDataUtils {
  public static get = async <K extends keyof IGlobalTestDataMap>(
    key: K,
  ): Promise<IGlobalTestDataMap[K]> => {
    const data = GlobalTestDataUtils._getAllData()
    return data[key]
  }

  public static set = <K extends keyof IGlobalTestDataMap>(
    key: K,
    value: IGlobalTestDataMap[K],
  ): void => {
    const currentData = GlobalTestDataUtils._getAllData()
    currentData[key] = value
    // eslint-disable-next-line node/no-sync -- required
    fs.writeFileSync(jsonFilePath, JSON.stringify(currentData, null, 2))
  }

  public static has = (key: keyof IGlobalTestDataMap): boolean => {
    const data = GlobalTestDataUtils._getAllData()
    return Object.prototype.hasOwnProperty.call(data, key)
  }

  // Private function: retrieve all data from the JSON file
  private static readonly _getAllData = (): IGlobalTestDataMap => {
    // eslint-disable-next-line node/no-sync -- required
    if (fs.existsSync(jsonFilePath)) {
      // eslint-disable-next-line node/no-sync -- required
      const rawData = fs.readFileSync(jsonFilePath, 'utf-8')
      return JSON.parse(rawData) as Record<string, never>
    }
    return {}
  }
}
