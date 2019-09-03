'use strict'

function seqEqual(arr1, arr2) {
  if (arr1.length !== arr2.length) {
    return false
  }

  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) {
      return false
    }
  }
  return true
}

function isSequence(val) {
  return val.length !== undefined
}

/**
* Concatenates all `arguments` into a single array. Each argument can be either
* a single element or a sequence, which has a `length` property and supports
* element retrieval via sequence[ix].
*
* > concatArgs(1, [2, 3], Buffer.from([4,5]), new Uint8Array([6, 7]));
*  [1,2,3,4,5,6,7]
*
* @return {Array} - concatenated arguments
*/
function concatArgs() {
  const ret = []
  const _len = arguments.length
  const args = Array(_len)

  for (let _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key]
  }

  args.forEach(function (arg) {
    if (isSequence(arg)) {
      for (let j = 0; j < arg.length; j++) {
        ret.push(arg[j])
      }
    } else {
      ret.push(arg)
    }
  })
  return ret
}

function isSet(o) {
  return o !== null && o !== undefined
}

module.exports = {
  seqEqual: seqEqual,
  concatArgs: concatArgs,
  isSet: isSet
}
