var AuthInfo   = require('./authinfo');
var blobClient = require('./blob');
var crypt      = require('./crypt');

function VaultClient(opts) {
  if (!opts) opts = {};  
  else if (typeof opts === "string") opts = {domain:opts};
  
  this.domain    = opts.domain || 'ripple.com';
  this.authInfo  = new AuthInfo;
  this.infos     = {};
};
  
  
/* 
 * normalizeUsername - 
 * Reduce username to standardized form.
 * Strips whitespace at beginning and end.
 */
VaultClient.prototype.normalizeUsername = function (username) {
  username = ""+username;
  username = username.trim();
  return username;
};


/*
 * normalizePassword - 
 * Reduce password to standardized form.
 * Strips whitespace at beginning and end.
 */
VaultClient.prototype.normalizePassword = function (password) {
  password = ""+password;
  password = password.trim();
  return password;
};    

VaultClient.prototype.getRippleName = function(address, url, fn) {

  //use the url from previously retrieved authInfo, if necessary
  if (!url && this.infos[id]) url = this.infos[id].blobvault;
  if (!url) return fn(new Error("Blob vault URL is required"));
  blobClient.getRippleName(url, address, fn);
};

/*
 * Login -
 * authenticate and retrieve a decrypted blob using a ripple name and password
 * 
 */
VaultClient.prototype.login = function(username, password, fn) {
  var self = this;
  
  self.authInfo.get(self.domain, username, function(err, authInfo){
    if (err) return fn(err);
    
    if (authInfo.version !== 3) {
      return fn(new Error("This wallet is incompatible with this version of the vault-client."));
    }
    
    if (!authInfo.pakdf) {
      return fn(new Error("No settings for PAKDF in auth packet."));
    }

    if (!authInfo.exists) {
      return fn(new Error("User does not exist."));
    }

    if ("string" !== typeof authInfo.blobvault) {
      return fn(new Error("No blobvault specified in the authinfo."));
    }
    
                  
    //derive login keys
    crypt.derive(authInfo.pakdf, 'login', username.toLowerCase(), password, function(err, keys){
      if (err) return fn(err);
      
      blobClient.get(authInfo.blobvault, keys.id, keys.crypt, function (err, blob) {
        if (err) return fn(err);
        
        self.infos[keys.id] = authInfo;  //save for relogin
        
        fn (null, {
          blob     : blob,
          username : authInfo.username,  
          verified : authInfo.emailVerified
        });
      });
    });
  });
};


/*
 * Relogin -
 * retreive and decrypt blob using a blob url, id and crypt derived previously.
 * 
 */
VaultClient.prototype.relogin = function(url, id, cryptKey, fn) {
  
  //use the url from previously retrieved authInfo, if necessary
  if (!url && this.infos[id]) url = this.infos[id].blobvault;
  
  if (!url) return fn(new Error("Blob vault URL is required"));
  
  blobClient.get(url, id, cryptKey, function (err, blob) {
    if (err) return fn(err);
    
    fn (null, {
      blob : blob,
    });
  });
};


/*
 * Unlock - 
 * decrypt the secret key using a username and password
 */
VaultClient.prototype.unlock = function(username, password, encryptSecret, fn) {
  var self = this;
  
  self.authInfo.get(self.domain, username, function(err, authInfo){
    if (err) return fn(err);
    
    //derive unlock key
    crypt.derive(authInfo.pakdf, 'unlock', username.toLowerCase(), password, function(err, keys){
      if (err) return fn(err);
      
      fn(null, {
        keys   : keys,
        secret : crypt.decrypt(keys.unlock, encryptSecret)
      });      
    }); 
  });
};


/*
 * LoginAndUnlock
 * retrieve the decrypted blob and secret key in one step using
 * the username and password
 * 
 */
VaultClient.prototype.loginAndUnlock = function(username, password, fn) {
  var self = this;
  
  this.login(username, password, function(err, resp){
    if (err) return fn(err);
    
    if (!resp.blob || !resp.blob.encrypted_secret) 
      return fn(new Error("Unable to retrieve blob and secret."));
    
    if (!resp.blob.id || !resp.blob.key) 
      return fn(new Error("Unable to retrieve keys."));
     
    //get authInfo via id - would have been saved from login
    var authInfo = self.infos[resp.blob.id]; 
    if (!authInfo) return fn(new Error("Unable to find authInfo"));
     
    //derive unlock key
    crypt.derive(authInfo.pakdf, 'unlock', username.toLowerCase(), password, function(err, keys){
      if (err) return fn(err); 
      
      fn(null, {
        blob     : resp.blob,
        unlock   : keys.unlock,
        secret   : crypt.decrypt(keys.unlock, resp.blob.encrypted_secret),
        username : authInfo.username,
        verified : authInfo.emailVerified
      });
    });     
  });
};


/*
 * Exists -
 * check blobvault for existance of username
 * 
 */
VaultClient.prototype.exists = function (username, fn) {
  this.authInfo.get(this.domain, username.toLowerCase(), function(err, authInfo){
    if (err) return fn(err);
    return fn(null, !!authInfo.exists);
  });
}


/*
 * Verify -
 * verify an email address for an existing user
 * 
 */
VaultClient.prototype.verify = function (username, token, fn) {
  
  this.authInfo.get(this.domain, username.toLowerCase(), function (err, authInfo) {
    if (err) return fn(err);

    if ("string" !== typeof authInfo.blobvault) {
      return fn(new Error("No blobvault specified in the authinfo."));
    }

    blobClient.verify(authInfo.blobvault, username.toLowerCase(), token, fn);
  });    
}

/*
 * Register -
 * register a new user and save to the blob vault
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
VaultClient.prototype.register = function (options, fn) {
  var self   = this,
    username = this.normalizeUsername(options.username),
    password = this.normalizePassword(options.password);
    

  self.authInfo.get(self.domain, username, function(err, authInfo){
    
    if (err) return fn(err);
    
    if ("string" !== typeof authInfo.blobvault) {
      return fn(new Error("No blobvault specified in the authinfo."));
    }
    
    
    if (!authInfo.pakdf) {
      return fn(new Error("No settings for PAKDF in auth packet."));
    }    
    
    //derive login keys
    crypt.derive(authInfo.pakdf, 'login', username.toLowerCase(), password, function(err, loginKeys){
      if (err) return fn(err);
      
      //derive unlock key
      crypt.derive(authInfo.pakdf, 'unlock', username.toLowerCase(), password, function(err, unlockKeys){
        if (err) return fn(err);
        
        var params = {
          'url'          : authInfo.blobvault,
          'id'           : loginKeys.id,
          'crypt'        : loginKeys.crypt,
          'unlock'       : unlockKeys.unlock,
          'username'     : username,
          'email'        : options.email,
          'masterkey'    : options.masterkey || crypt.createMaster(),
          'activateLink' : options.activateLink,
          'oldUserBlob'  : options.oldUserBlob 
        }
        
        blobClient.create(params, function(err, blob){
          if (err) return fn(err);
          fn(null, blob, loginKeys, authInfo.username);
        }); 
      });
    });
  });
};

module.exports = VaultClient;