ripple-vault-client
===================

A javascript / http client to interact with Ripple Vault servers.

The purpose of this tool is to enable applications in any javascript
environment to login with the ripple vault and access the decrypted
data stored using credentials originally obtained at ripple.com
     
        
## Vault Client Usage

    vaultClient = new ripple.VaultClient(domain);
    
    vaultClient.getAuthInfo(username, callback);
    
    vaultClient.getRippleName(address, url, callback);

    vaultClient.exists(username, callback);
    
        

    vaultClient.login(username, password, callback);

    vaultClient.relogin(id, cryptKey, callback);

    vaultClient.unlock(username, password, encryptSecret, callback);

    vaultClient.loginAndUnlock(username, password, callback);
    
    
    
    vaultClient.register(options, callback);
    
    vaultClient.deleteBlob(options, callback);
    
    vaultClient.recoverBlob(options, callback);
        
    vaultClient.rename(options, callback);
    
    vaultClient.changePassword(options, callback);
     
    vaultClient.verify(username, token, callback);
    
    vaultClient.resendEmail(options, callback);
    
    vaultClient.updateProfile(options, fn);
    

# Blob Methods
    
    blob.encrypt();
    
    blob.decrypt(encryptedBlob);
    
    blob.encryptSecret(encryptionKey);
    
    blob.decryptSecret(encryptionKey, secret);
    
    blob.set(pointer, value, callback);
    
    blob.unset(pointer, callback);
    
    blob.extend(pointer, value, callback);
    
    blob.unshift(pointer, value, callback);
    
    blob.filter(pointer, field, value, subcommands, callback);
    
    
## Identity Vault

  The identity vault stores identity information inside the encrypted 
  blob vault.  The identity fields can be additionally encrypted with the 
  unlock key, that encrypts the secret, for added security. Methods are 
  accessed from the 'identity' property of the blob object.


# Identity fields
  + name
  + entityType (individual, corporation, organization)
  + email
  + phone
  + address
    + contact
    + line1
    + line2
    + city
    + postalCode
    + region - state/province/region
    + country
  + nationalID
    + number
    + type (ssn, taxID, passport, driversLicense, other)
    + country - issuing country
  + birthday
  + birthplace
  
  
# Identity Methods

    blob.identity.set(pointer, key, value, callback);
    
    blob.identity.unset(pointer, key, callback);
    
    blob.identity.get(pointer, key);
    
    blob.identity.getAll(key);
    
    blob.identity.getFullAddress(key);  //get text string of full address
    

## Spec Tests

Run `npm test` to test the high-level behavior specs 

  Ripple Txt
    ✓ should get the content of a ripple.txt file from a given domain 
    ✓ should get currencies from a ripple.txt file for a given domain
    ✓ should get the domain from a given url 

  AuthInfo
    ✓ should get auth info 

  VaultClient
    #initialization
      ✓ should be initialized with a domain 
      ✓ should default to ripple.com without a domain 
    #exists
      ✓ should determine if a username exists on the domain 
    #login
      ✓ with username and password should retrive the blob, crypt key, and id
    #relogin
      ✓ should retrieve the decrypted blob with blob vault url, id, and crypt key 
    #unlock
      ✓ should access the wallet secret using encryption secret, username and password
    #loginAndUnlock
      ✓ should get the decrypted blob and decrypted secret given name and password
    #register
      ✓ should create a new blob
    #deleteBlob
      ✓ should remove an existing blob
    #updateProfile
      ✓ should update profile parameters associated with a blob 

  Blob
    ✓ #set 
    ✓ #extend 
    ✓ #unset 
    ✓ #unshift 
    ✓ #filter 
    ✓ #consolidate 
    #rename
      ✓ should change the username of a blob
    #changePassword
      ✓ should change the password and keys of a blob
    #recoverBlob
      ✓ should recover the blob given a username and secret
    #verifyEmail
      ✓ should verify an email given a username and token 
    #resendVerifcationEmail
      ✓ should resend a verification given options
    identity
      ✓ #identity_set 
      ✓ #identity_get 
      ✓ #identity_getAll 
      ✓ #identity_getFullAddress 
      ✓ #identity_unset 
