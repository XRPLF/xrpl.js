/**
 * Logging functionality for ripple-lib and any applications built on it.
 */
function Log(namespace) {
  if (!namespace) {
    this._namespace = [];
  } else if (Array.isArray(namespace)) {
    this._namespace = namespace;
  } else {
    this._namespace = [''+namespace];
  }

  this._prefix = this._namespace.concat(['']).join(': ');
};

/**
 * Create a sub-logger.
 *
 * You can have a hierarchy of loggers.
 *
 * @example
 *
 *   var log = require('ripple').log.sub('server');
 *
 *   log.info('connection successful');
 *   // prints: 'server: connection successful'
 */
Log.prototype.sub = function(namespace) {
  var subNamespace = this._namespace.slice();

  if (namespace && typeof namespace === 'string') {
    subNamespace.push(namespace);
  }

  var subLogger = new Log(subNamespace);
  subLogger._setParent(this);
  return subLogger;
};

Log.prototype._setParent = function(parentLogger) {
  this._parent = parentLogger;
};

Log.makeLevel = function(level) {
  return function() {
    var args = Array.prototype.slice.call(arguments);
    args[0] = this._prefix + args[0];
    Log.engine.logObject.apply(Log, args);
  };
};

Log.prototype.debug = Log.makeLevel(1);
Log.prototype.info  = Log.makeLevel(2);
Log.prototype.warn  = Log.makeLevel(3);
Log.prototype.error = Log.makeLevel(4);

/**
 * Basic logging connector.
 *
 * This engine has no formatting and works with the most basic of 'console.log'
 * implementations. This is the logging engine used in Node.js.
 */
var BasicLogEngine = {
  logObject: function logObject(msg) {
    var args = Array.prototype.slice.call(arguments, 1);

    args = args.map(function(arg) {
      return JSON.stringify(arg, null, 2);
    });

    args.unshift(msg);
    args.unshift('[' + new Date().toISOString() + ']');

    console.log.apply(console, args);
  }
};

/**
 * Null logging connector.
 *
 * This engine simply swallows all messages. Used when console.log is not
 * available.
 */
var NullLogEngine = {
  logObject: function() {}
};

Log.engine = NullLogEngine;

if (console && console.log) {
  Log.engine = BasicLogEngine;
}

/**
 * Provide a root logger as our main export.
 *
 * This means you can use the logger easily on the fly:
 *     ripple.log.debug('My object is', myObj);
 */
module.exports = new Log();

/**
 * This is the logger for ripple-lib internally.
 */
module.exports.internal = module.exports.sub();

/**
 * Expose the class as well.
 */
module.exports.Log = Log;
