import _ = require("lodash");
const inherits = require("inherits");

function forEach(obj, func) {
  Object.keys(obj || {}).forEach((k) => {
    func(obj[k], k);
  });
}

function ensureArray(val) {
  return Array.isArray(val) ? val : [val];
}

export function makeClass(klass_, definition_) {
  const definition = definition_ || klass_;
  let klass = typeof klass_ === "function" ? klass_ : null;
  if (klass === null) {
    for (const k in definition) {
      if (k[0].match(/[A-Z]/)) {
        klass = definition[k];
        break;
      }
    }
  }
  const parent = definition.inherits;
  if (parent) {
    if (klass === null) {
      klass = function () {
        parent.apply(this, arguments);
      };
    }
    inherits(klass, parent);
    _.defaults(klass, parent);
  }
  if (klass === null) {
    klass = function () {};
  }
  const proto = klass.prototype;
  function addFunc(original, name, wrapper) {
    proto[name] = wrapper || original;
  }
  (definition.getters || []).forEach((k) => {
    const key = "_" + k;
    proto[k] = function () {
      return this[key];
    };
  });
  forEach(definition.virtuals, (f, n) => {
    addFunc(f, n, function () {
      throw new Error("unimplemented");
    });
  });
  forEach(definition.methods, addFunc);
  forEach(definition, (f, n) => {
    if (_.isFunction(f) && f !== klass) {
      addFunc(f, n, undefined);
    }
  });
  _.assign(klass, definition.statics);
  if (typeof klass.init === "function") {
    klass.init();
  }
  forEach(definition.cached, (f, n) => {
    const key = "_" + n;
    addFunc(f, n, function () {
      let value = this[key];
      if (value === undefined) {
        value = this[key] = f.call(this);
      }
      return value;
    });
  });
  if (definition.mixins) {
    const mixins = {};
    // Right-most in the list win
    ensureArray(definition.mixins)
      .reverse()
      .forEach((o) => {
        _.defaults(mixins, o);
      });
    _.defaults(proto, mixins);
  }

  return klass;
}
