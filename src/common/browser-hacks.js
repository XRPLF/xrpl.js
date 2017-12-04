

function setPrototypeOf(object, prototype) {
  // Object.setPrototypeOf not supported on Internet Explorer 9
  /* eslint-disable */
  Object.setPrototypeOf ? Object.setPrototypeOf(object, prototype) :
    object.__proto__ = prototype
  /* eslint-enable */
}

function getConstructorName(object) {
  // hack for internet explorer
  return process.browser ?
    object.constructor.toString().match(/^function\s+([^(]*)/)[1] :
    object.constructor.name
}

export {
  getConstructorName,
  setPrototypeOf
}
