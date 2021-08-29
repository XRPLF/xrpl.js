import {
  Trustline,
  FormattedTrustline,
} from "../../common/types/objects/trustlines";
import { removeUndefined } from "../../utils";

import { parseQuality } from "./utils";

// rippled 'account_lines' returns a different format for
// trustlines than 'tx'
function parseAccountTrustline(trustline: Trustline): FormattedTrustline {
  const specification = removeUndefined({
    limit: trustline.limit,
    currency: trustline.currency,
    counterparty: trustline.account,
    qualityIn: parseQuality(trustline.quality_in) || undefined,
    qualityOut: parseQuality(trustline.quality_out) || undefined,
    ripplingDisabled: trustline.no_ripple,
    frozen: trustline.freeze,
    authorized: trustline.authorized,
  });
  // rippled doesn't provide the counterparty's qualities
  const counterparty = removeUndefined({
    limit: trustline.limit_peer,
    ripplingDisabled: trustline.no_ripple_peer,
    frozen: trustline.freeze_peer,
    authorized: trustline.peer_authorized,
  });
  const state = {
    balance: trustline.balance,
  };
  return { specification, counterparty, state };
}

export default parseAccountTrustline;
