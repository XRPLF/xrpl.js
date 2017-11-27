
function setPrototypeOf(object, prototype) {
  // Object.setPrototypeOf not supported on Internet Explorer 9
  Object.setPrototypeOf ? Object.setPrototypeOf(object, prototype) :
    // @ts-ignore: Specifically a fallback for IE9
    object.__proto__ = prototype
}

function getConstructorName(object: Object): string {
  // hack for internet explorer
  if (!object.constructor.name) {
    return object.constructor.toString().match(/^function\s+([^(]*)/)![1]
  }
  return object.constructor.name
}

export {
  getConstructorName,
  setPrototypeOf
}
