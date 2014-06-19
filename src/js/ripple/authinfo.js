var async      = require('async');
var superagent = require('superagent');
var RippleTxt  = require('./rippletxt').RippleTxt;

var AuthInfo = { };

AuthInfo._getRippleTxt = function(domain, callback) {
  RippleTxt.get(domain, callback);
};

AuthInfo._getUser = function(url, callback) {
  superagent.get(url, callback);
};


/**
 * Get auth info for a given username
 *
 * @param {string}    domain - Domain which hosts the user's info
 * @param {string}    username - Username who's info we are retreiving
 * @param {function}  fn - Callback function
 */

AuthInfo.get = function(domain, username, callback) {
  var self = this;
  username = username.toLowerCase();
  
  function getRippleTxt(callback) {
    self._getRippleTxt(domain, function(err, txt) {
      if (err) {
        return callback(err);
      }

      if (!txt.authinfo_url) {
        return callback(new Error('Authentication is not supported on ' + domain));
      }

      var url = Array.isArray(txt.authinfo_url) ? txt.authinfo_url[0] : txt.authinfo_url;

      url += '?domain=' + domain + '&username=' + username;

      callback(null, url);
    });
  };

  function getUser(url, callback) {
    self._getUser(url, function(err, res) {
      if (err || res.error) {
        callback(new Error('Authentication info server unreachable'));
      } else {
        callback(null, res.body);
      }
    });
  };

  async.waterfall([ getRippleTxt, getUser ], callback);
};

exports.AuthInfo = AuthInfo;
