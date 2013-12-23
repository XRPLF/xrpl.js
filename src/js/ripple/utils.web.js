var exports = module.exports = require('./utils.js');

// We override this function for browsers, because they print objects nicer
// natively than JSON.stringify can.
exports.logObject = function (msg, obj) {
  var args = Array.prototype.slice.call(arguments, 1);

  args = args.map(function(arg) {
    if (/MSIE/.test(navigator.userAgent)) {
      return JSON.stringify(arg, null, 2);
    } else {
      return arg;
    }
  });

  args.unshift(msg);

  console.log.apply(console, args);
};
