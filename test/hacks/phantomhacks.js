'use strict';
// this one will be directly run in browser, so disable eslint
/* eslint-disable no-var, no-extend-native, consistent-this, func-style */

(function() {
  var phantomTest = /PhantomJS/;
  if (phantomTest.test(navigator.userAgent)) {
    // mocha-phantomjs-core has wrong shim for Function.bind, so we
    // will replace it with correct one
    // this bind polyfill copied from MDN documentation
    Function.prototype.bind = function(oThis) {
      if (typeof this !== 'function') {
        // closest thing possible to the ECMAScript 5
        // internal IsCallable function
        throw new TypeError(
          'Function.prototype.bind - what is trying to be bound is not callable'
        );
      }

      var aArgs = Array.prototype.slice.call(arguments, 1);
      var fToBind = this;
      var FNOP = function() {};
      var fBound = function() {
        return fToBind.apply(this instanceof FNOP ? this : oThis,
          aArgs.concat(Array.prototype.slice.call(arguments)));
      };

      if (this.prototype) {
        // native functions don't have a prototype
        FNOP.prototype = this.prototype;
      }
      fBound.prototype = new FNOP();

      return fBound;
    };
  }
})();
