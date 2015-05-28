'use strict';
/*eslint-disable max-nested-callbacks*/
/*eslint-disable new-cap*/

let assert = require('assert');
let sjcl = require('ripple-lib').sjcl;

describe('ECDSA signing with recoverable public key', function() {

  describe('Sign and recover public key from signature', function() {

    it('should recover public keys from signatures it generates', function() {

      let messages = [{
        message: 'Hello world!',
        secret_hex:
          '9931c08f61f127d5735fa3c60e702212ce7ed9a2ac90d5dbade99c689728cd9b',
        random_value:
          '5473a3dbdc13ec9efbad7f7f929fbbea404af556a48041dd9d41d29fdbc989ad',
        hash_function: sjcl.hash.sha512.hash
        // signature: 'AAAAGzFa1pYjhssCpDFZgFSnYQ8qCnMkLaZrg0mXZyNQ2NxgMQ8z' +
        // '9U3ngYerxSZCEt3Q4raMIpt03db7jDNGbfmHy8I='
      }, {
        // Correct recovery value for this one is 0
        message:
          'ua5pdcG0I1JuhSr9Fwai2UoZ9ll5leUtHE5NzSSNnPkw8nSPH5mT1gE1fe0sn',
        secret_hex:
          '84814318ffe6e612694ad59b9084b7b66d68b6979567c619171a67b05e2b654b',
        random_value:
          '14261d30b319709c10ab13cabe595313b99dd2d5c76b8b38d7eb445f0b81cc9a',
        hash_function: sjcl.hash.sha512.hash
        // signature: 'AAAAHGjpBM7wnTHbPGo0TXsxKbr+d7KvACuJ/eGQsp3ZJfOOQHsz' +
        // 'aciRo3ClenwKixcquFcBlaVfHlOc3JWOZq1RjpQ='
      }, {
        // Correct recovery value for this one is 1
        message: 'rxc76UnmVTp',
        secret_hex:
          '37eac47c212be8ea8372f506b11673c281cd9ea29a035c2c9e90d027c3dbecc6',
        random_value:
          '61b53ca6de0543f911765ae216a3a4d851918a0733fba9ac80cf29de5bec8032',
        hash_function: sjcl.hash.sha256.hash
        // signature: 'AAAAG8L/yOA3nNqK4aOiQWJmOaWvkvr3NoTk6wCdX97U3qowdgFd' +
        // '98UK3evWV16qO3RHgFMEnUW/Vt4+kcidqW6hMo0='
      }];

      let curve = sjcl.ecc.curves.k256;

      for (let m = 0; m < messages.length; m++) {

        let message = messages[m].message;
        let secret_hex = messages[m].secret_hex;
        let random_test_value = sjcl.bn.fromBits(sjcl.codec.hex.toBits(
          messages[m].random_value
        ));
        let hash_function = messages[m].hash_function;

        let secret_bn = sjcl.bn.fromBits(sjcl.codec.hex.toBits(secret_hex));
        let secret_key = new sjcl.ecc.ecdsa.secretKey(curve, secret_bn);

        let pub_val_point = secret_key._curve.G.mult(secret_key._exponent);
        let public_key = new sjcl.ecc.ecdsa.publicKey(curve, pub_val_point);
        let hash = sjcl.bitArray.clamp(
          hash_function(message), secret_key._curveBitLength
        );

        let recoverable_signature = secret_key.signWithRecoverablePublicKey(
          hash, 0, random_test_value
        );
        let recovered_public_key =
          sjcl.ecc.ecdsa.publicKey.recoverFromSignature(
            hash, recoverable_signature
          );

        assert.deepEqual(
          public_key.get().x, recovered_public_key.get().x,
          'The x value for the recovered public key did not match for message: '
          + message + '. Expected: ' + public_key.get().x.toString() +
          '. Actual: ' + recovered_public_key.get().x.toString()
        );
        assert.deepEqual(
          public_key.get().y, recovered_public_key.get().y,
          'The y value for the recovered public key did not match for message: '
          + message + '. Expected: ' + public_key.get().y.toString() +
          '. Actual: ' + recovered_public_key.get().y.toString()
        );

      }

    });

  });

  // used for the next couple of describes
  let random_value = sjcl.bn.fromBits(sjcl.codec.hex.toBits(
    'c3aa71cecb965bbbc96083d868b4955d77adb4e02ce229fe60869f745dfcd4e4a4' +
    'd0f17a15a353d7592dca1baba2824e45c8e7a8f9faad3ce2c2d3792799f27a'
  ));

  describe('signWithRecoverablePublicKey', function() {

    it('should produce an error if the hash is not given as a bitArray',
    function() {

      let curve = sjcl.ecc.curves.k256;
      let secret_hex =
       '9e623166ac44d4e75fa842f3443485b9c8380551132a8ffaa898b5c93bb18b7d';
      let secret_bn = sjcl.bn.fromBits(sjcl.codec.hex.toBits(secret_hex));
      let secret_key = new sjcl.ecc.ecdsa.secretKey(curve, secret_bn);
      let hash =
        'e865bcc63a86ef21585ac8340a7cc8590ed85175a2a718c6fb2bfb2715d13778';

      assert.throws(function() {
        secret_key.signWithRecoverablePublicKey(hash, 0, random_value);
      }, /(?=.*hash)(?=.*bitArray).+/);

    });

    it('should return a bitArray', function() {

      let curve = sjcl.ecc.curves.k256;
      let secret_hex =
        '9e623166ac44d4e75fa842f3443485b9c8380551132a8ffaa898b5c93bb18b7d';
      let secret_bn = sjcl.bn.fromBits(sjcl.codec.hex.toBits(secret_hex));
      let secret_key = new sjcl.ecc.ecdsa.secretKey(curve, secret_bn);
      let hash = sjcl.codec.hex.toBits(
        'e865bcc63a86ef21585ac8340a7cc8590ed85175a2a718c6fb2bfb2715d13778'
      );

      let signature = secret_key.signWithRecoverablePublicKey(
        hash, 0, random_value
      );
      assert(
        typeof signature === 'object' &&
        signature.length > 0 &&
        typeof signature[0] === 'number'
      );

    });

    it(
      'should return a bitArray where the first word contains the recovery' +
      'factor',
    function() {

      let curve = sjcl.ecc.curves.k256;
      let secret_hex =
        '9e623166ac44d4e75fa842f3443485b9c8380551132a8ffaa898b5c93bb18b7d';
      let secret_bn = sjcl.bn.fromBits(sjcl.codec.hex.toBits(secret_hex));
      let secret_key = new sjcl.ecc.ecdsa.secretKey(curve, secret_bn);
      let hash = sjcl.codec.hex.toBits(
        'e865bcc63a86ef21585ac8340a7cc8590ed85175a2a718c6fb2bfb2715d13778'
      );

      let signature = secret_key.signWithRecoverablePublicKey(
        hash, 0, random_value);
      let recovery_factor = signature[0] - 27;

      assert(recovery_factor >= 0 && recovery_factor < 4);

    });

  });

  describe('recoverFromSignature', function() {

    it('should produce an error if the signature given does not have the ' +
       'recovery factor prefix',
    function() {

      let curve = sjcl.ecc.curves.k256;
      let secret_hex =
        '9e623166ac44d4e75fa842f3443485b9c8380551132a8ffaa898b5c93bb18b7d';
      let secret_bn = sjcl.bn.fromBits(sjcl.codec.hex.toBits(secret_hex));
      let secret_key = new sjcl.ecc.ecdsa.secretKey(curve, secret_bn);
      let hash = sjcl.codec.hex.toBits(
        'e865bcc63a86ef21585ac8340a7cc8590ed85175a2a718c6fb2bfb2715d13778'
      );

      let signature = secret_key.sign(hash, 0, undefined, random_value);

      assert.throws(function() {
        sjcl.ecc.ecdsa.publicKey.recoverFromSignature(hash, signature);
      }, /(?=.*signature)(?=.*recovery factor)(?=.*public key).*/);

    });

    it('should produce an error if it is not given both the hash and the' +
      'signature',
    function() {

      let curve = sjcl.ecc.curves.k256;
      let secret_hex =
        '9e623166ac44d4e75fa842f3443485b9c8380551132a8ffaa898b5c93bb18b7d';
      let secret_bn = sjcl.bn.fromBits(sjcl.codec.hex.toBits(secret_hex));
      let secret_key = new sjcl.ecc.ecdsa.secretKey(curve, secret_bn);
      let hash = sjcl.codec.hex.toBits(
        'e865bcc63a86ef21585ac8340a7cc8590ed85175a2a718c6fb2bfb2715d13778'
      );

      let signature = secret_key.signWithRecoverablePublicKey(
        hash, 0, random_value
      );

      assert.throws(function() {
        sjcl.ecc.ecdsa.publicKey.recoverFromSignature(hash);
      }, /(?=.*hash\ and\ signature)(?=.*recover\ public\ key).*/);

      assert.throws(function() {
        sjcl.ecc.ecdsa.publicKey.recoverFromSignature(signature);
      }, /(?=.*hash\ and\ signature)(?=.*recover\ public\ key).*/);

    });

    it('should produce an error if it cannot generate a valid public key' +
       'from the the signature',
    function() {

      // let curve = sjcl.ecc.curves.k256;
      // let secret_hex =
      //  '9e623166ac44d4e75fa842f3443485b9c8380551132a8ffaa898b5c93bb18b7d';
      // let secret_bn = sjcl.bn.fromBits(sjcl.codec.hex.toBits(secret_hex));
      // let secret_key = new sjcl.ecc.ecdsa.secretKey(curve, secret_bn);
      let hash = sjcl.codec.hex.toBits(
        'e865bcc63a86ef21585ac8340a7cc8590ed85175a2a718c6fb2bfb2715d13778'
      );

      let signature = sjcl.codec.base64.toBits(
        'IJPzXewhO1CORRx14FROzZC8ne4v0Me94UZoBKH15e4pcSgeYiYeKZ4PJOBI/D5y' +
        'qUOhemO+rKKHhE0HL66kAcM='
      );
      signature[0] = 27;

      signature[3] = 0 - signature[3];

      assert.throws(function() {
        sjcl.ecc.ecdsa.publicKey.recoverFromSignature(hash, signature);
      }, /(?=.*Cannot\ recover\ public\ key).*/);

    });

    it('should return a publicKey object', function() {

      let curve = sjcl.ecc.curves.k256;
      let secret_hex =
        '9e623166ac44d4e75fa842f3443485b9c8380551132a8ffaa898b5c93bb18b7d';
      let secret_bn = sjcl.bn.fromBits(sjcl.codec.hex.toBits(secret_hex));
      let secret_key = new sjcl.ecc.ecdsa.secretKey(curve, secret_bn);
      let hash = sjcl.codec.hex.toBits(
        'e865bcc63a86ef21585ac8340a7cc8590ed85175a2a718c6fb2bfb2715d13778'
      );
      let signature = secret_key.signWithRecoverablePublicKey(
        hash, 0, random_value
      );

      let key = sjcl.ecc.ecdsa.publicKey.recoverFromSignature(hash, signature);

      assert(key instanceof sjcl.ecc.ecdsa.publicKey);

    });

    it('tampering with the signature should produce a different public key,' +
       'if it produces a valid one at all',
    function() {

      let curve = sjcl.ecc.curves.k256;
      let secret_hex =
        '9e623166ac44d4e75fa842f3443485b9c8380551132a8ffaa898b5c93bb18b7d';
      let secret_bn = sjcl.bn.fromBits(sjcl.codec.hex.toBits(secret_hex));
      let secret_key = new sjcl.ecc.ecdsa.secretKey(curve, secret_bn);
      let hash = sjcl.codec.hex.toBits(
        'e865bcc63a86ef21585ac8340a7cc8590ed85175a2a718c6fb2bfb2715d13778'
      );

      let signature = secret_key.signWithRecoverablePublicKey(
        hash, 0, random_value
      );

      signature[3]++;

      let original_public_key = new sjcl.ecc.ecdsa.publicKey(
        curve, curve.G.mult(secret_key._exponent)
      );
      let recovered_public_key = sjcl.ecc.ecdsa.publicKey.recoverFromSignature(
        hash, signature
      );

      assert.notDeepEqual(
        original_public_key.get().x,
        recovered_public_key.get().x
      );
      assert.notDeepEqual(
        original_public_key.get().y,
        recovered_public_key.get().y
      );

    });

    it('should return a publicKey object, while using the overridden' +
       'c256 curve',
    function() {

      let curve = sjcl.ecc.curves.c256;
      let secret_hex =
        '9e623166ac44d4e75fa842f3443485b9c8380551132a8ffaa898b5c93bb18b7d';
      let secret_bn = sjcl.bn.fromBits(sjcl.codec.hex.toBits(secret_hex));
      let secret_key = new sjcl.ecc.ecdsa.secretKey(curve, secret_bn);
      let hash = sjcl.codec.hex.toBits(
        'e865bcc63a86ef21585ac8340a7cc8590ed85175a2a718c6fb2bfb2715d13778'
      );
      let signature = secret_key.signWithRecoverablePublicKey(
        hash, 0, random_value
      );

      let key = sjcl.ecc.ecdsa.publicKey.recoverFromSignature(hash, signature);

      assert(key instanceof sjcl.ecc.ecdsa.publicKey);

    });

  });

});
