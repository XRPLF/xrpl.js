var exports = module.exports = require('./log.js');

/**
 * Log engine for browser consoles.
 *
 * Browsers tend to have better consoles that support nicely formatted
 * JavaScript objects. This connector passes objects through to the logging
 * function without any stringification.
 */
var InteractiveLogEngine = {
  logObject: function (msg, obj) {
    var args = Array.prototype.slice.call(arguments, 1);

    args = args.map(function(arg) {
      if (/MSIE/.test(navigator.userAgent)) {
        return JSON.stringify(arg, null, 2);
      } else {
        return arg;
      }
    });

    args.unshift(msg);
    args.unshift('[' + new Date().toISOString() + ']');

    console.log.apply(console, args);
  }
};

if (window.console && window.console.log) {
  exports.Log.engine = InteractiveLogEngine;
}
