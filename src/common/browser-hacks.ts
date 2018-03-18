
function setPrototypeOf(object, prototype) {
  // Object.setPrototypeOf not supported on Internet Explorer 9
  Object.setPrototypeOf ? Object.setPrototypeOf(object, prototype) :
    // @ts-ignore: Specifically a fallback for IE9
    object.__proto__ = prototype
}

function getConstructorName(object: Object): string {
  // hack for internet explorer
  if (!object.constructor.name) {
    const ctorStr = object.constructor.toString()
    const fnMatch=ctorStr.match(/^function\s+([^(]*)/)
    const classMatch=ctorStr.match(/^class\sextends\s+([^{]*)/)
    return classMatch?classMatch[1]:fnMatch[1]
  }
  return object.constructor.name
}

export {
  getConstructorName,
  setPrototypeOf
}
