var async      = require('async');
var blobClient = require('./blob').BlobClient;
var AuthInfo   = require('./authinfo').AuthInfo;
var crypt      = require('./crypt').Crypt;

function VaultClient(opts) {
  if (!opts) {
    opts = { };
  }

  if (typeof opts === 'string') {
    opts = { domain: opts };
  }

  this.domain   = opts.domain || 'ripple.com';
  this.authInfo = new AuthInfo();
  this.infos    = { };
};

/**
 * Get a ripple name from a given account address, if it has one
 * @param {string} address - Account address to query
 * @param {string} url     - Url of blob vault
 */

VaultClient.prototype.getRippleName = function(address, url, callback) {
  //use the url from previously retrieved authInfo, if necessary
  if (!url) {
    callback(new Error('Blob vault URL is required'));
  } else {
    blobClient.getRippleName(url, address, callback);
  }
};

/**
 * Authenticate and retrieve a decrypted blob using a ripple name and password
 *
 * @param {string}    username
 * @param {string}    password
 * @param {function}  fn - Callback function
 */

VaultClient.prototype.login = function(username, password, callback) {
  var self = this;

  function getAuthInfo(callback) {
    self.authInfo.get(self.domain, username, function(err, authInfo) {
      if (err) {
        return callback(err);
      }

      if (authInfo.version !== 3) {
        return callback(new Error('This wallet is incompatible with this version of the vault-client.'));
      }

      if (!authInfo.pakdf) {
        return callback(new Error('No settings for PAKDF in auth packet.'));
      }

      if (!authInfo.exists) {
        return callback(new Error('User does not exist.'));
      }

      if (typeof authInfo.blobvault !== 'string') {
        return callback(new Error('No blobvault specified in the authinfo.'));
      }

      callback(null, authInfo);
    });
  };

  function deriveLoginKeys(authInfo, callback) {
    //derive login keys
    crypt.derive(authInfo.pakdf, 'login', username.toLowerCase(), password, function(err, keys) {
      if (err) {
        callback(err);
      } else {
        callback(null, authInfo, keys);
      }
    });
  };

  function getBlob(authInfo, keys, callback) {
    blobClient.get(authInfo.blobvault, keys.id, keys.crypt, function(err, blob) {
      if (err) {
        return callback(err);
      }

      //save for relogin
      self.infos[keys.id] = authInfo;

      callback(null, {
        blob: blob,
        username: authInfo.username,
        verified: authInfo.emailVerified
      });
    });
  };

  var steps = [
    getAuthInfo,
    deriveLoginKeys,
    getBlob
  ];

  async.waterfall(steps, callback);
};

/**
 * Retreive and decrypt blob using a blob url, id and crypt derived previously.
 *
 * @param {string}   url - Blob vault url
 * @param {string}   id  - Blob id from previously retreived blob
 * @param {string}   key - Blob decryption key
 * @param {function} fn  - Callback function
 */

VaultClient.prototype.relogin = function(url, id, key, callback) {
  //use the url from previously retrieved authInfo, if necessary
  if (!url && this.infos[id]) {
    url = this.infos[id].blobvault;
  }

  if (!url) {
    return callback(new Error('Blob vault URL is required'));
  }

  blobClient.get(url, id, key, function(err, blob) {
    if (err) {
      callback(err);
    } else {
      callback (null, { blob: blob });
    }
  });
};

/**
 * Decrypt the secret key using a username and password
 *
 * @param {string}    username
 * @param {string}    password
 * @param {string}    encryptSecret
 * @param {function}  fn - Callback function
 */

VaultClient.prototype.unlock = function(username, password, encryptSecret, callback) {
  var self = this;

  function deriveUnlockKey(authInfo, callback) {
    //derive unlock key
    crypt.derive(authInfo.pakdf, 'unlock', username.toLowerCase(), password, function(err, keys) {
      if (err) {
        return callback(err);
      }

      var secret;
      try {
        secret = crypt.decrypt(keys.unlock, encryptSecret);
      } catch (error) {
        return callback(error);
      } 
           
      callback(null, {
        keys   : keys,
        secret : secret
      });
    });
  };

  self.authInfo.get(self.domain, username, function(err, authInfo) {
    if (err) {
      callback(err);
    } else {
      deriveUnlockKey(authInfo, callback);
    }
  });
};

/**
 * Retrieve the decrypted blob and secret key in one step using
 * the username and password
 *
 * @param {string}    username
 * @param {string}    password
 * @param {function}  fn - Callback function
 */

VaultClient.prototype.loginAndUnlock = function(username, password, callback) {
  var self = this;

  function deriveUnlockKey(authInfo, blob, callback) {
    //derive unlock key
    crypt.derive(authInfo.pakdf, 'unlock', username.toLowerCase(), password, function(err, keys) {
      if (err) {
        return callback(err);
      }

      var secret;
      try {
        secret = crypt.decrypt(keys.unlock, blob.encrypted_secret);
      } catch (error) {
        return callback(error);
      } 
            
      callback(null, {
        blob     : blob,
        unlock   : keys.unlock,
        secret   : secret,
        username : authInfo.username,
        verified : authInfo.emailVerified
      });
    });
  };

  this.login(username, password, function(err, resp) {
    if (err) {
      return callback(err);
    }

    if (!resp.blob || !resp.blob.encrypted_secret) {
      return callback(new Error('Unable to retrieve blob and secret.'));
    }

    if (!resp.blob.id || !resp.blob.key) {
      return callback(new Error('Unable to retrieve keys.'));
    }

    //get authInfo via id - would have been saved from login
    var authInfo = self.infos[resp.blob.id];

    if (!authInfo) {
      return callback(new Error('Unable to find authInfo'));
    }

    deriveUnlockKey(authInfo, resp.blob, callback);
  });
};

/**
 * Check blobvault for existance of username
 *
 * @param {string}    username
 * @param {function}  fn - Callback function
 */

VaultClient.prototype.exists = function(username, callback) {
  this.authInfo.get(this.domain, username.toLowerCase(), function(err, authInfo) {
    if (err) {
      callback(err);
    } else {
      callback(null, !!authInfo.exists);
    }
  });
};

/**
 * Verify an email address for an existing user
 *
 * @param {string}    username
 * @param {string}    token - Verification token
 * @param {function}  fn - Callback function
 */

VaultClient.prototype.verify = function(username, token, callback) {
  var self = this;

  this.authInfo.get(this.domain, username.toLowerCase(), function(err, authInfo) {
    if (err) {
      return callback(err);
    }

    if (typeof authInfo.blobvault !== 'string') {
      return callback(new Error('No blobvault specified in the authinfo.'));
    }

    blobClient.verify(authInfo.blobvault, username.toLowerCase(), token, callback);
  });
};

/**
 * resendEmail
 * send a new verification email
 * @param {object}   options
 * @param {function} callback
 */
VaultClient.prototype.resendEmail = function (options, callback) {
  blobClient.resendEmail(options, callback);  
};

/**
 * Register a new user and save to the blob vault
 *
 * @param {object} options
 * @param {string} options.username
 * @param {string} options.password
 * @param {string} options.masterkey   //optional, will create if absent
 * @param {string} options.email
 * @param {string} options.activateLink
 * @param {object} options.oldUserBlob //optional
 * @param {function} fn
 */

VaultClient.prototype.register = function(options, fn) {
  var self = this;
  var username = String(options.username).trim();
  var password = String(options.password).trim();

  function getAuthInfo(callback) {
    self.authInfo.get(self.domain, username, function(err, authInfo) {
      if (err) {
        return callback(err);
      }

      if (typeof authInfo.blobvault !== 'string') {
        return callback(new Error('No blobvault specified in the authinfo.'));
      }

      if (!authInfo.pakdf) {
        return callback(new Error('No settings for PAKDF in auth packet.'));
      }

      callback(null, authInfo);
    });
  };

  function deriveKeys(authInfo, callback) {
    // derive unlock and login keys
    var keys = { };

    function deriveKey(keyType, callback) {
      crypt.derive(authInfo.pakdf, keyType, username.toLowerCase(), password, function(err, key) {
        if (err) {
          callback(err);
        } else {
          keys[keyType] = key;
          callback();
        }
      });
    };

    async.eachSeries([ 'login', 'unlock' ], deriveKey, function(err) {
      if (err) {
        callback(err);
      } else {
        callback(null, authInfo, keys);
      }
    });
  };

  function create(authInfo, keys, callback) {
    var params = {
      url: authInfo.blobvault,
      id: keys.login.id,
      crypt: keys.login.crypt,
      unlock: keys.unlock.unlock,
      username: username,
      email: options.email,
      masterkey: options.masterkey || crypt.createMaster(),
      activateLink: options.activateLink,
      oldUserBlob: options.oldUserBlob
    };
        
    blobClient.create(params, function(err, blob) {
      if (err) {
        callback(err);
      } else {
        callback(null, {
          blob     : blob, 
          username : authInfo.username
        });
      }
    });
  };

  async.waterfall([ getAuthInfo, deriveKeys, create], fn);
};

exports.VaultClient = VaultClient;
