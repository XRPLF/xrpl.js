var async      = require('async');
var blobClient = require('./blob').BlobClient;
var AuthInfo   = require('./authinfo').AuthInfo;
var crypt      = require('./crypt').Crypt;

function VaultClient(opts) {
  
  var self = this;
  
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
 * getAuthInfo
 * gets auth info for a username. returns authinfo
 * even if user does not exists (with exist set to false)
 * @param {string} username
 * @param {function} callback
 */
VaultClient.prototype.getAuthInfo = function (username, callback) {

  this.authInfo.get(this.domain, username, function(err, authInfo) {
    if (err) {
      return callback(err);
    }

    if (authInfo.version !== 3) {
      return callback(new Error('This wallet is incompatible with this version of the vault-client.'));
    }

    if (!authInfo.pakdf) {
      return callback(new Error('No settings for PAKDF in auth packet.'));
    }

    if (typeof authInfo.blobvault !== 'string') {
      return callback(new Error('No blobvault specified in the authinfo.'));
    }

    callback(null, authInfo);
  });  
};

/**
 * _deriveLoginKeys
 * method designed for asnyc waterfall
 */

VaultClient.prototype._deriveLoginKeys = function (authInfo, password, callback) {

  //derive login keys
  crypt.derive(authInfo.pakdf, 'login', authInfo.username.toLowerCase(), password, function(err, keys) {
    if (err) {
      callback(err);
    } else {
      callback(null, authInfo, password, keys);
    }
  });
};



/**
 * _deriveUnlockKey
 * method designed for asnyc waterfall
 */

VaultClient.prototype._deriveUnlockKey = function (authInfo, password, keys, callback) {
  //derive unlock key
  crypt.derive(authInfo.pakdf, 'unlock', authInfo.username.toLowerCase(), password, function(err, unlock) {
    if (err) {
      console.log('Error',err);
      return callback(err);
    }

    if (!keys) {
      keys = { };
    }
    
    keys.unlock = unlock.unlock;
    callback(null, authInfo, keys);
  });
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
  
  var steps = [
    getAuthInfo,
    self._deriveLoginKeys,
    getBlob
  ];

  async.waterfall(steps, callback);
    
  function getAuthInfo(callback) {
    self.getAuthInfo(username, function(err, authInfo){
      
      if (authInfo && !authInfo.exists) {
        return callback(new Error('User does not exist.'));
      }
            
      return callback (err, authInfo, password);
    });  
  }
  
  function getBlob(authInfo, password, keys, callback) {
    blobClient.get(authInfo.blobvault, keys.id, keys.crypt, function(err, blob) {
      if (err) {
        return callback(err);
      }

      //save for relogin
      self.infos[keys.id] = authInfo;

      callback(null, {
        blob      : blob,
        username  : authInfo.username,
        verified  : authInfo.emailVerified
      });
    });
  };
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

VaultClient.prototype.unlock = function(username, password, encryptSecret, fn) {
  var self = this;
  
  var steps = [
    getAuthInfo,
    self._deriveUnlockKey,
    unlockSecret
  ];

  async.waterfall(steps, fn);
  
  function getAuthInfo(callback) {
    self.getAuthInfo(username, function(err, authInfo){
      
      if (authInfo && !authInfo.exists) {
        return callback(new Error('User does not exist.'));
      }
            
      return callback (err, authInfo, password, {});
    });  
  }
  
  function unlockSecret (authinfo, keys, callback) {

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
  }
};

/**
 * Retrieve the decrypted blob and secret key in one step using
 * the username and password
 *
 * @param {string}    username
 * @param {string}    password
 * @param {function}  fn - Callback function
 */

VaultClient.prototype.loginAndUnlock = function(username, password, fn) {
  var self = this;

  var steps = [
    login,
    deriveUnlockKey,
    unlockSecret
  ];

  async.waterfall(steps, fn);  
  
  function login (callback) {
    self.login(username, password, function(err, resp) {

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
    
      callback(null, authInfo, password, resp.blob);
    });    
  };

  function deriveUnlockKey (authInfo, password, blob, callback) {
    self._deriveUnlockKey(authInfo, password, null, function(err, authInfo, keys){
      callback(err, keys.unlock, authInfo, blob);
    });
  };
  
  function unlockSecret (unlock, authInfo, blob, callback) {
    var secret;
    try {
      secret = crypt.decrypt(unlock, blob.encrypted_secret);
    } catch (error) {
      return callback(error);
    }     
    
    callback(null, {
      blob      : blob,
      unlock    : unlock,
      secret    : secret,
      username  : authInfo.username,
      verified  : authInfo.emailVerified
    });    
  };  
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

  self.getAuthInfo(username, function (err, authInfo){
    if (err) {
      return callback(err);
    }
    
    blobClient.verify(authInfo.blobvault, username.toLowerCase(), token, callback);     
  });
};

/**
 * resendEmail
 * send a new verification email
 * @param {object}   options
 * @param {string}   options.id
 * @param {string}   options.username
 * @param {string}   options.account_id
 * @param {string}   options.email
 * @param {string}   options.activateLink
 * @param {function} fn - Callback
 */

VaultClient.prototype.resendEmail = function (options, fn) {
  blobClient.resendEmail(options, fn);  
};

/**
 * recoverBlob
 * recover blob with account secret
 * @param {object} options
 * @param {string} options.url
 * @param {string} options.username
 * @param {string} options.masterkey
 * @param {function} 
 */

VaultClient.prototype.recoverBlob = function (options, fn) {
  blobClient.recoverBlob(options, fn);    
};

/*
 * changePassword
 * @param {object} options
 * @param {string} options.username
 * @param {string} options.password
 * @param {string} options.masterkey
 * @param {object} options.blob
 */

VaultClient.prototype.changePassword = function (options, fn) {
  var self     = this;
  var password = String(options.password).trim();
  
  var steps = [
    getAuthInfo,
    self._deriveLoginKeys,
    self._deriveUnlockKey,
    changePassword
  ];
  
  async.waterfall(steps, fn);
    
  function getAuthInfo(callback) {
    self.getAuthInfo(options.username, function(err, authInfo) { 
      return callback (err, authInfo, password);      
    });
  };
  
  function changePassword (authInfo, keys, callback) {
    options.keys = keys;
    blobClient.updateKeys(options, callback); 
  };
};

/**
 * rename
 * rename a ripple account
 * @param {object} options
 * @param {string} options.username
 * @param {string} options.new_username
 * @param {string} options.password
 * @param {string} options.masterkey
 * @param {object} options.blob
 * @param {function} fn
 */

VaultClient.prototype.rename = function (options, fn) {
  var self         = this;
  var new_username = String(options.new_username).trim();
  var password     = String(options.password).trim();
  
  var steps = [
    getAuthInfo,
    self._deriveLoginKeys,
    self._deriveUnlockKey,
    renameBlob
  ];

  async.waterfall(steps, fn);
    
  function getAuthInfo(callback) {
    self.getAuthInfo(new_username, function(err, authInfo){
      
      if (authInfo && authInfo.exists) {
        return callback(new Error('username already taken.'));
      } else {
        authInfo.username = new_username;
      }
            
      return callback (err, authInfo, password);
    });  
  };
  
  function renameBlob (authInfo, keys, callback) {
    options.keys = keys;
    blobClient.rename(options, callback);    
  };
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
  var self     = this;
  var username = String(options.username).trim();
  var password = String(options.password).trim();
  
  var steps = [
    getAuthInfo,
    self._deriveLoginKeys,
    self._deriveUnlockKey,
    create    
  ];
  
  async.waterfall(steps, fn);
  
  function getAuthInfo(callback) {
    self.getAuthInfo(username, function(err, authInfo){
                  
      return callback (err, authInfo, password);
    });  
  };

  function create(authInfo, keys, callback) {
    var params = {
      url          : authInfo.blobvault,
      id           : keys.id,
      crypt        : keys.crypt,
      unlock       : keys.unlock,
      username     : authInfo.username,
      email        : options.email,
      masterkey    : options.masterkey || crypt.createMaster(),
      activateLink : options.activateLink,
      oldUserBlob  : options.oldUserBlob
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
};

exports.VaultClient = VaultClient;
