'use strict' // eslint-disable-line strict

function parseAmendment(tx: Object) {
  return {
    amendment: tx.Amendment
  }
}

module.exports = parseAmendment
