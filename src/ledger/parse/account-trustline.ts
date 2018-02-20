import {parseQuality} from './utils'
import {removeUndefined} from '../../common'
import {
  Trustline,
  FormattedTrustline
} from '../../common/types/objects/trustlines'

// rippled 'account_lines' returns a different format for
// trustlines than 'tx'
function parseAccountTrustline(trustline: Trustline): FormattedTrustline {
  const specification = removeUndefined({
    limit: trustline.limit,
    currency: trustline.currency,
    counterparty: trustline.account,
    qualityIn: parseQuality(trustline.quality_in) || undefined,
    qualityOut: parseQuality(trustline.quality_out) || undefined,
    ripplingDisabled: trustline.no_ripple || undefined,
    frozen: trustline.freeze || undefined,
    authorized: trustline.authorized || undefined
  })
  // rippled doesn't provide the counterparty's qualities
  const counterparty = removeUndefined({
    limit: trustline.limit_peer,
    ripplingDisabled: trustline.no_ripple_peer || undefined,
    frozen: trustline.freeze_peer || undefined,
    authorized: trustline.peer_authorized || undefined
  })
  const state = {
    balance: trustline.balance
  }
  return {specification, counterparty, state}
}

export default parseAccountTrustline
