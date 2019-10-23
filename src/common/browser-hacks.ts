
function setPrototypeOf(object, prototype) {
  // Object.setPrototypeOf not supported on Internet Explorer 9
  Object.setPrototypeOf ? Object.setPrototypeOf(object, prototype) :
    // @ts-ignore: Specifically a fallback for IE9
    object.__proto__ = prototype
}

function getConstructorName(object: object): string {
  if (object.constructor.name) {
    return object.constructor.name
  }
  // try to guess it on legacy browsers (ie)
  const constructorString = object.constructor.toString()
  const functionConstructor = constructorString.match(/^function\s+([^(]*)/)
  const classConstructor = constructorString.match(/^class\s([^\s]*)/)
  return functionConstructor ? functionConstructor[1] : classConstructor[1]
}

export {
  getConstructorName,
  setPrototypeOf
}
