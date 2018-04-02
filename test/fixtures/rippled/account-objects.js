'use strict'

const accountObjectsNormal = require('./account-objects-normal')

module.exports = function(request, options = {}) {
  if (request.ledger_hash !== 'TEST_LEDGER_HASH_MULTIPLE_PAGES') {
    // Normal response
    return JSON.stringify(Object.assign({}, accountObjectsNormal, {id: request.id}))
  } else {
    if (request.marker !== 'TEST_MARKER_PAGE_2') {
      // Page 1
      const result = Object.assign({}, accountObjectsNormal.result, {
        account_objects: accountObjectsNormal.result.account_objects.slice(0, 5),
        marker: 'TEST_MARKER_PAGE_2'
      })
      return JSON.stringify(Object.assign({}, accountObjectsNormal, {
        id: request.id,
        result: result
      }))
    } else {
      // Page 2
      const result = Object.assign({}, accountObjectsNormal.result, {
        account_objects: accountObjectsNormal.result.account_objects.slice(5, 10)
      })
      return JSON.stringify(Object.assign({}, accountObjectsNormal, {
        id: request.id,
        result: result
      }))
    }
  }
}
