ripple-vault-client
===================

A javascript / http client to interact with Ripple Vault servers.

The purpose of this tool is to enable applications in any javascript
environment to login with the ripple vault and access the decrypted
data stored using credentials originally obtained at ripple.com
     
        
## Vault Client Usage

    vaultClient = new ripple.VaultClient(domain);

    vaultClient.login(username, password, callback);

    vaultClient.relogin(id, cryptKey, callback);

    vaultClient.unlock(username, password, encryptSecret, callback);

    vaultClient.loginAndUnlock(username, password, callback);
    
    vaultClient.exists(username, callback);
    
    vaultClient.register(options, callback);
    
    vaultClient.rename(options, callback);
    
    vaultClient.changePassword(options, callback);
    
    vaultClient.recoverBlob(options, callback);
    
    vaultClient.verify(username, token, callback);
    
    vaultClient.resendEmail(options, callback);
    

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
      ✓ should get the context of a ripple.txt file from a given domain

    AuthInfo
      ✓ should get authinfo given a domain and username

    Ripple Vault Client
      #initialization
        ✓ should be initialized with a domain 
        ✓ should default to ripple.com without a domain 
      #login
        ✓ with username and password should retrive the blob, crypt key, and id 
      #relogin
        ✓ should retrieve the decrypted blob with id and crypt key 
      #unlock
        ✓ should access the wallet secret using encryption secret, username and password 
      #loginAndUnlock
        ✓ should get the decrypted blob and decrypted secret given name and password 


    Blob
      #set
        ✓ should set a new property in the blob
      #extend
        ✓ should extend an object in the blob 
      #unset
        ✓ should remove a property from the blob 
      #unshift
        ✓ should prepend an item to an array in the blob 
      #filter
        ✓ should find a specific entity in an array and apply subcommands to it 
      #consolidate
        ✓ should consolidate and save changes to the blob     
    
        
      #identity_set
        ✓ should set an identity property
      #identity_get
        ✓ should retreive an identity property given the property name and encryption key 
      #identity_getAll
        ✓ should retreive all identity properties given the encryption key 
      #identity_getFullAddress
        ✓ should retreive the address as a string 
      #identity_unset
        ✓ should remove an identity property
