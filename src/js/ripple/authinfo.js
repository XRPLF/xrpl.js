var RippleTxt = require('./rippletxt').RippleTxt;
var request   = require('superagent');

function AuthInfo () {
  this.rippleTxt = new RippleTxt();
}

/**
 * Get auth info for a given username
 * @param {string}    domain - Domain which hosts the user's info
 * @param {string}    username - Username who's info we are retreiving
 * @param {function}  fn - Callback function
 */
AuthInfo.prototype.get = function (domain, username, fn) {
  var self = this;
  
  self.rippleTxt.get(domain, function(err, txt){
    if (err) return fn(err);
    
    processTxt(txt);
  });
  
  
  function processTxt(txt) {
    if (!txt.authinfo_url) return fn(new Error("Authentication is not supported on "+domain));
    var url = Array.isArray(txt.authinfo_url) ? txt.authinfo_url[0] : txt.authinfo_url;
    url += "?domain="+domain+"&username="+username;
    
    request.get(url, function(err, resp){
      if (err || resp.error) return fn(new Error("Authentication info server unreachable"));
      fn(null, resp.body);
    }); 
  }  
};

module.exports.AuthInfo = AuthInfo;