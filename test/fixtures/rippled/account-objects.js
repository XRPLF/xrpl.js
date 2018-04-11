'use strict'

const accountObjectsNormal = require('./account-objects-normal')

module.exports = function(request, options = {}) {
  return JSON.stringify(Object.assign({}, accountObjectsNormal, {id: request.id}))
}
