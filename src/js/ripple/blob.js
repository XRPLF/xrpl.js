var crypt = require('./crypt'),
  message = require('./message'),
  request = require('superagent'),
  extend  = require("extend");

//Blob object class
var BlobObj = function (url, id, key) {
  this.url  = url;
  this.id   = id;
  this.key  = key;
  this.data = {};  
};

// Blob operations
// Do NOT change the mapping of existing ops
BlobObj.ops = {
  // Special
  "noop" : 0,

  // Simple ops
  "set"     : 16,
  "unset"   : 17,
  "extend"  : 18,

  // Meta ops
  "push"    : 32,
  "pop"     : 33,
  "shift"   : 34,
  "unshift" : 35,
  "filter"  : 36
};


BlobObj.opsReverseMap = [];
for (var name in BlobObj.ops) { 
  BlobObj.opsReverseMap[BlobObj.ops[name]] = name;
}


/*
 * Init -
 * initialize a new blob object
 * 
 */
BlobObj.prototype.init = function (fn) {
  var self = this, url;
  if (self.url.indexOf("://") === -1) self.url = "http://" + url;
  
  url = self.url + '/v1/blob/' + self.id;
  
  request.get(url, function(err, resp){

    if (err || !resp.body || resp.body.result !== 'success')
      return fn(new Error("Could not retrieve blob"));
      
      self.revision         = resp.body.revision;
      self.encrypted_secret = resp.body.encrypted_secret;
            
      if (!self.decrypt(resp.body.blob)) {
        return fn(new Error("Error while decrypting blob"));
      }
      
      //Apply patches
      if (resp.body.patches && resp.body.patches.length) {
        var successful = true;
        resp.body.patches.forEach(function (patch) {
          successful = successful && self.applyEncryptedPatch(patch);
        });

        if (successful) self.consolidate();
      }

      fn(null, self);//return with newly decrypted blob      
    
  }).timeout(8000);  
} 


/*
 * Consolidate -
 * Consolidate patches as a new revision
 * 
 */
BlobObj.prototype.consolidate = function (fn) {
  
  // Callback is optional
  if ("function" !== typeof fn) fn = function(){};

  console.log("client: blob: consolidation at revision", this.revision);
  var encrypted = this.encrypt();

  var config = {
    method   : 'POST',
    url      : this.url + '/v1/blob/consolidate',
    dataType : 'json',
    data : {
      blob_id  : this.id,
      data     : encrypted,
      revision : this.revision
    },
  };
  
  var signed = crypt.signRequestHmac(config, this.data.auth_secret, this.id);
  
  request.post(signed.url)
    .send(signed.data)
    .end(function(err, resp) {

    // XXX Add better error information to exception
    if (err) return fn(new Error("Failed to consolidate blob - XHR error"));   
    else if (resp.body && resp.body.result === 'success') return fn(null, resp.body);  
    else return fn(new Error("Failed to consolidate blob"));      
  });
};
  
  
/*
 * ApplyEncryptedPatch -
 * save changes from a downloaded patch to the blob
 * 
 */
BlobObj.prototype.applyEncryptedPatch = function (patch)
{
  try {
    var params = JSON.parse(crypt.decrypt(this.key, patch));
    var op     = params.shift();
    var path   = params.shift();

    this.applyUpdate(op, path, params);
    this.revision++;

    return true;
    
  } catch (err) {
    console.log("client: blob: failed to apply patch:", err.toString());
    console.log(err.stack);
    return false;
  }
}


//decrypt secret with unlock key
BlobObj.prototype.decryptSecret = function (secretUnlockKey) {
  return crypt.decrypt(secretUnlockKey, this.data.encrypted_secret);
};


//encrypt secret with unlock key
BlobObj.prototype.encryptSecret = function (secretUnlockKey, secret) {
  return crypt.encrypt(secretUnlockKey, secret);
};
   

//decrypt blob with crypt key   
BlobObj.prototype.decrypt = function (data) {
  
  try {
    this.data = JSON.parse(crypt.decrypt(this.key, data));
    return this;
  } catch (e) {
    console.log("client: blob: decryption failed", e.toString());
    console.log(e.stack);
    return false;
  }
};


//encrypt blob data with crypt key
BlobObj.prototype.encrypt = function()
{
  
// Filter Angular metadata before encryption
//  if ('object' === typeof this.data &&
//      'object' === typeof this.data.contacts)
//    this.data.contacts = angular.fromJson(angular.toJson(this.data.contacts));

  return crypt.encrypt(this.key, JSON.stringify(this.data));
};

BlobObj.prototype.decryptBlobCrypt = function (secret) {
  var recoveryEncryptionKey = crypt.deriveRecoveryEncryptionKeyFromSecret(secret);
  return crypt.decrypt(recoveryEncryptionKey, this.encrypted_blobdecrypt_key);
};

BlobObj.prototype.encryptBlobCrypt = function (secret, blobDecryptKey) {
  var recoveryEncryptionKey = crypt.deriveRecoveryEncryptionKeyFromSecret(secret);
  return crypt.encrypt(recoveryEncryptionKey, blobDecryptKey);
};



/**** Blob updating ****/


//set blob element
BlobObj.prototype.set = function (pointer, value, fn) {
  this.applyUpdate('set', pointer, [value]);
  this.postUpdate('set', pointer, [value], fn);
};


//get remove blob element
BlobObj.prototype.unset = function (pointer, fn) {
  this.applyUpdate('unset', pointer, []);
  this.postUpdate('unset', pointer, [], fn);
};


//extend blob element
BlobObj.prototype.extend = function (pointer, value, fn) {
  this.applyUpdate('extend', pointer, [value]);
  this.postUpdate('extend', pointer, [value], fn);
};


//Prepend an entry to an array.
BlobObj.prototype.unshift = function (pointer, value, fn) {
  this.applyUpdate('unshift', pointer, [value]);
  this.postUpdate('unshift', pointer, [value], fn);
};


/**
 * Filter the row(s) from an array.
 *
 * This method will find any entries from the array stored under `pointer` and
 * apply the `subcommands` to each of them.
 *
 * The subcommands can be any commands with the pointer parameter left out.
 */
BlobObj.prototype.filter = function (pointer, field, value, subcommands, callback) {
  var params = Array.prototype.slice.apply(arguments);
  if ("function" === typeof params[params.length-1]) {
    callback = params.pop();
  }
  params.shift();

  // Normalize subcommands to minimize the patch size
  params = params.slice(0, 2).concat(normalizeSubcommands(params.slice(2), true));
  
  this.applyUpdate('filter', pointer, params);
  this.postUpdate('filter', pointer, params, callback);
};


//apply new update to the blob data
BlobObj.prototype.applyUpdate = function (op, path, params) {
  
  // Exchange from numeric op code to string
  if ("number" === typeof op) {
    op = BlobObj.opsReverseMap[op];
  }
  if ("string" !== typeof op) {
    throw new Error("Blob update op code must be a number or a valid op id string");
  }

  // Separate each step in the "pointer"
  var pointer = path.split("/");

  var first = pointer.shift();
  if (first !== "") {
    throw new Error("Invalid JSON pointer: "+path);
  }

  this._traverse(this.data, pointer, path, op, params);
};


//for applyUpdate function
BlobObj.prototype._traverse = function (context, pointer,
                                        originalPointer, op, params) {
  var _this = this;
  var part = _this.unescapeToken(pointer.shift());

  if (Array.isArray(context)) {
    if (part === '-') {
      part = context.length;
    } else if (part % 1 !== 0 && part >= 0) {
      throw new Error("Invalid pointer, array element segments must be " +
                      "a positive integer, zero or '-'");
    }
  } else if ("object" !== typeof context) {
    return null;
  } else if (!context.hasOwnProperty(part)) {
    // Some opcodes create the path as they're going along
    if (op === "set") {
      context[part] = {};
    } else if (op === "unshift") {
      context[part] = [];
    } else {
      return null;
    }
  }

  if (pointer.length !== 0) {
    return this._traverse(context[part], pointer,
                          originalPointer, op, params);
  }

  switch (op) {
  case "set":
    context[part] = params[0];
    break;
  case "unset":
    if (Array.isArray(context)) {
      context.splice(part, 1);
    } else {
      delete context[part];
    }
    break;
  case "extend":
    if ("object" !== typeof context[part]) {
      throw new Error("Tried to extend a non-object");
    }
    extend(true, context[part], params[0]);
    break;
  case "unshift":
    if ("undefined" === typeof context[part]) {
      context[part] = [];
    } else if (!Array.isArray(context[part])) {
      throw new Error("Operator 'unshift' must be applied to an array.");
    }
    context[part].unshift(params[0]);
    break;
  case "filter":
    if (Array.isArray(context[part])) {
      context[part].forEach(function (element, i) {
        if ("object" === typeof element &&
            element.hasOwnProperty(params[0]) &&
            element[params[0]] === params[1]) {
          var subpointer = originalPointer+"/"+i;
          var subcommands = normalizeSubcommands(params.slice(2));

          subcommands.forEach(function (subcommand) {
            var op = subcommand[0];
            var pointer = subpointer+subcommand[1];
            _this.applyUpdate(op, pointer, subcommand.slice(2));
          });
        }
      });
    }
    break;
  default:
    throw new Error("Unsupported op "+op);
  }
};


BlobObj.prototype.escapeToken = function (token) {
  return token.replace(/[~\/]/g, function (key) { return key === "~" ? "~0" : "~1"; });
};


BlobObj.prototype.unescapeToken = function(str) {
  return str.replace(/~./g, function(m) {
    switch (m) {
    case "~0":
      return "~";
    case "~1":
      return "/";
    }
    throw("Invalid tilde escape: " + m);
  });
};


//sumbit update to blob vault
BlobObj.prototype.postUpdate = function (op, pointer, params, fn) {
  // Callback is optional
  if ("function" !== typeof fn) fn = function(){};

  if ("string" === typeof op) {
    op = BlobObj.ops[op];
  }
  if ("number" !== typeof op) {
    throw new Error("Blob update op code must be a number or a valid op id string");
  }
  if (op < 0 || op > 255) {
    throw new Error("Blob update op code out of bounds");
  }

  console.log("client: blob: submitting update", BlobObj.opsReverseMap[op], pointer, params);

  params.unshift(pointer);
  params.unshift(op);

  var config = {
    method   : 'POST',
    url      : this.url + '/v1/blob/patch',
    dataType : 'json',
    data     : {
      blob_id : this.id,
      patch   : crypt.encrypt(this.key, JSON.stringify(params))
    }
  };

  
  var signed = crypt.signRequestHmac(config, this.data.auth_secret, this.id);

  request.post(signed.url)
    .send(signed.data)
    .end(function(err, resp) { 
    if (err) 
      return fn(new Error("Patch could not be saved - XHR error"));
    else if (!resp.body || resp.body.result !== 'success')
      return fn(new Error("Patch could not be saved - bad result")); 
      
    return fn(null, resp.body);  
  });
};



/***** helper functions *****/


function normalizeSubcommands(subcommands, compress) {
  // Normalize parameter structure
  if ("number" === typeof subcommands[0] ||
      "string" === typeof subcommands[0]) {
    // Case 1: Single subcommand inline
    subcommands = [subcommands];
  } else if (subcommands.length === 1 &&
             Array.isArray(subcommands[0]) &&
             ("number" === typeof subcommands[0][0] ||
              "string" === typeof subcommands[0][0])) {
    // Case 2: Single subcommand as array
    // (nothing to do)
  } else if (Array.isArray(subcommands[0])) {
    // Case 3: Multiple subcommands as array of arrays
    subcommands = subcommands[0];
  }

  // Normalize op name and convert strings to numeric codes
  subcommands = subcommands.map(function (subcommand) {
    if ("string" === typeof subcommand[0]) {
      subcommand[0] = BlobObj.ops[subcommand[0]];
    }
    if ("number" !== typeof subcommand[0]) {
      throw new Error("Invalid op in subcommand");
    }
    if ("string" !== typeof subcommand[1]) {
      throw new Error("Invalid path in subcommand");
    }
    return subcommand;
  });

  if (compress) {
    // Convert to the minimal possible format
    if (subcommands.length === 1) {
      return subcommands[0];
    } else {
      return [subcommands];
    }
  } else {
    return subcommands;
  }
}
  

/***** blob client methods ****/


//blob object class
module.exports.Blob = BlobObj

//get ripple name for a given address 
module.exports.getRippleName = function (url, address, fn) {
  
  if (!crypt.isValidAddress(address)) return fn (new Error("Invalid ripple address"));
  request.get(url + '/v1/user/' + address, function(err, resp){
    if (err) return fn(new Error("Unable to access vault sever"));
    else if (resp.body && resp.body.username) return fn(null, resp.body.username);
    else if (resp.body && resp.body.exists === false) return fn (new Error("No ripple name for this address"));
    else return fn(new Error("Unable to determine if ripple name exists"));
  }); 
} 

//retrive a blob with url, id and key  
module.exports.get = function (url, id, crypt, fn) {

  var blob = new BlobObj(url, id, crypt);
  blob.init(fn);
}


//verify email address
module.exports.verify = function (url, username, token, fn) {
  url += '/v1/user/' + username + '/verify/' + token;
  request.get(url, function(err, resp){
    if (err) return fn(err);
    else if (resp.body && resp.body.result === 'success') return fn(null, data);
    else return fn(new Error("Failed to verify the account"));  
  }); 
}


/**
 * Create a blob object
 *
 * @param {object} options
 * @param {string} options.url
 * @param {string} options.id
 * @param {string} options.crypt
 * @param {string} options.unlock
 * @param {string} options.username
 * @param {string} options.masterkey
 * @param {object} options.oldUserBlob
 * @param {function} fn
 */
module.exports.create = function (options, fn)
{
  
  var blob      = new BlobObj(options.url, options.id, options.crypt);
  
  blob.revision = 0;
  blob.data     = {
    auth_secret : crypt.createSecret(8),
    account_id  : crypt.getAddress(options.masterkey),
    email       : options.email,
    contacts    : [],
    created     : (new Date()).toJSON()
  };
  
  blob.encrypted_secret = blob.encryptSecret(options.unlock, options.masterkey);

  // Migration
  if (options.oldUserBlob) {
    blob.data.contacts = options.oldUserBlob.data.contacts;
  }
  
  //post to the blob vault to create
  var config = {
    method   : "POST",
    url      : options.url + '/v1/user',
    data : {
      blob_id     : options.id,
      username    : options.username,
      address     : blob.data.account_id,
      auth_secret : blob.data.auth_secret,
      data        : blob.encrypt(),
      email       : options.email,
      hostlink    : options.activateLink,
      encrypted_blobdecrypt_key : blob.encryptBlobCrypt(options.masterkey, options.crypt),
      encrypted_secret          : blob.encrypted_secret
    }
  };
  
  
  var signed = crypt.signRequestAsymmetric(config, options.masterkey, blob.data.account_id, options.id);
  
  
  request.post(signed)
    .send(signed.data)
    .end(function(err, resp) {
      if (err) return fn(err);
      else if (resp.body && resp.body.result === 'success') return fn(null, blob,resp.body);
      else return fn(new Error("Could not create blob"));
  }); 
}