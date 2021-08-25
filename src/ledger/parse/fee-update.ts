import BigNumber from 'bignumber.js'
import {dropsToXrp} from '../../utils'
import {parseMemos} from './utils'

function parseFeeUpdate(tx: any) {
  const baseFeeDrops = new BigNumber(tx.BaseFee, 16).toString()
  return {
    memos: parseMemos(tx),
    baseFeeXRP: dropsToXrp(baseFeeDrops),
    referenceFeeUnits: tx.ReferenceFeeUnits,
    reserveBaseXRP: dropsToXrp(tx.ReserveBase),
    reserveIncrementXRP: dropsToXrp(tx.ReserveIncrement)
  }
}

export default parseFeeUpdate
