'use strict';

/*eslint-disable new-cap*/

var assert = require('assert');
var sjcl = require('ripple-lib').sjcl;


describe('Deterministic ECDSA (RFC 6979)', function() {

  var messages = [{
    message: 'Hello world!',
    secret_hex:
      '9931c08f61f127d5735fa3c60e702212ce7ed9a2ac90d5dbade99c689728cd9b',
    hash_function: sjcl.hash.sha512
  }, {
    message: 'aiwodmao wd',
    secret_hex:
      '84814318ffe6e612694ad59b9084b7b66d68b6979567c619171a67b05e2b654b',
    hash_function: sjcl.hash.sha512
  }, {
    // another message, using sha256
    message: 'rxc76UnmVTp',
    secret_hex:
      '37eac47c212be8ea8372f506b11673c281cd9ea29a035c2c9e90d027c3dbecc6',
    hash_function: sjcl.hash.sha256
  }];

  var curve = sjcl.ecc.curves.k256;

  function testMessage(test, index) {
    it('Should create valid signatures: message #' + index, function() {

      var message = test.message;
      var secret_hex = test.secret_hex;
      var hash_function = test.hash_function;

      var secret_bn = sjcl.bn.fromBits(sjcl.codec.hex.toBits(secret_hex));
      var secret_key = new sjcl.ecc.ecdsa.secretKey(curve, secret_bn);
      var hashed_message = hash_function.hash(message);

      var signature = secret_key.signDeterministic(
        hashed_message,
        hash_function
      );

      var pub_val_point = secret_key._curve.G.mult(secret_key._exponent);
      var public_key = new sjcl.ecc.ecdsa.publicKey(curve, pub_val_point);

      assert(public_key.verify(hashed_message, signature));
    });
  }
  messages.forEach(testMessage);

  var rfcCurve = sjcl.ecc.curves.nist_p256;
  var rfcQ = sjcl.bn.fromBits(sjcl.codec.hex.toBits(
    'FFFFFFFF00000000FFFFFFFFFFFFFFFFBCE6FAADA7179E84F3B9CAC2FC632551'
  ));
  var rfcQlen = sjcl.bitArray.bitLength(rfcQ.toBits());
  var rfcPrivate = new sjcl.ecc.ecdsa.secretKey(
    rfcCurve,
    sjcl.bn.fromBits(sjcl.codec.hex.toBits(
      'C9AFA9D845BA75166B5C215767B1D6934E50C3DB36E89B127B8A622B120F6721'
  )));
  var rfcPublic = new sjcl.ecc.ecdsa.publicKey(
    rfcCurve,
    (rfcPrivate._curve.G.mult(rfcPrivate._exponent))
  );

  it('Should use the correct curve (NIST P-256)', function() {

    assert.equal(
      sjcl.codec.hex.fromBits(rfcCurve.r.toBits()),
      sjcl.codec.hex.fromBits(rfcQ.toBits()) 
    );

    var ux = '60fed4ba255a9d31c961eb74c6356d68c049b8923b61fa6ce669622e60f29fb6';
    var uy = '7903fe1008b8bc99a41ae9e95628bc64f2f1b20c2d7e9f5177a3c294d4462299';

    var secret = sjcl.bn.fromBits(rfcPrivate.get());
    
    var curve_ux = sjcl.codec.hex.fromBits(rfcCurve.G.mult(secret).x.toBits());
    var curve_uy = sjcl.codec.hex.fromBits(rfcCurve.G.mult(secret).y.toBits());

    assert.equal(curve_ux, ux);
    assert.equal(curve_uy, uy);

  });

  var rfcTests = [
    {
      hash: sjcl.hash.sha1,
      message: 'sample',
      k: '882905f1227fd620fbf2abf21244f0ba83d0dc3a9103dbbee43a1fb858109db4',
      r: '61340c88c3aaebeb4f6d667f672ca9759a6ccaa9fa8811313039ee4a35471d32',
      s: '6d7f147dac089441bb2e2fe8f7a3fa264b9c475098fdcf6e00d7c996e1b8b7eb'
    }, /*{
      hash: sjcl.hash.sha224,
      message: 'sample',
      k: '103f90ee9dc52e5e7fb5132b7033c63066d194321491862059967c715985d473',
      r: '53b2fff5d1752b2c689df257c04c40a587fababb3f6fc2702f1343af7ca9aa3f',
      s: 'b9afb64fdc03dc1a131c7d2386d11e349f070aa432a4acc918bea988bf75c74c'
    },*/ {
      hash: sjcl.hash.sha256,
      message: 'sample',
      k: 'a6e3c57dd01abe90086538398355dd4c3b17aa873382b0f24d6129493d8aad60',
      r: 'efd48b2aacb6a8fd1140dd9cd45e81d69d2c877b56aaf991c34d0ea84eaf3716',
      s: 'f7cb1c942d657c41d436c7a1b6e29f65f3e900dbb9aff4064dc4ab2f843acda8'
    },/* {
      hash: sjcl.hash.sha384,
      message: 'sample',
      k: '09f634b188cefd98e7ec88b1aa9852d734d0bc272f7d2a47decc6ebeb375aad4',
      r: '0eafea039b20e9b42309fb1d89e213057cbf973dc0cfc8f129edddc800ef7719',
      s: '4861f0491e6998b9455193e34e7b0d284ddd7149a74b95b9261f13abde940954'
    },*/ {
      hash: sjcl.hash.sha512,
      message: 'sample',
      k: '5fa81c63109badb88c1f367b47da606da28cad69aa22c4fe6ad7df73a7173aa5',
      r: '8496a60b5e9b47c825488827e0495b0e3fa109ec4568fd3f8d1097678eb97f00',
      s: '2362ab1adbe2b8adf9cb9edab740ea6049c028114f2460f96554f61fae3302fe'
    }
  ];

  function testRFC(test, index) {
    it('Should create the right k and s for RFC test #' + index, function() {

      var hashed_message = test.hash.hash(test.message);
      var k = rfcPrivate.generateK(hashed_message, test.hash);

      var signature = rfcPrivate.signDeterministic(hashed_message, test.hash);
      var r = sjcl.bitArray.bitSlice(signature, 0, rfcQlen);
      var s = sjcl.bitArray.bitSlice(signature, rfcQlen);
    
      assert.equal(sjcl.codec.hex.fromBits(k.toBits()), test.k);
      assert.equal(sjcl.codec.hex.fromBits(s), test.s);
      assert.equal(sjcl.codec.hex.fromBits(r), test.r);
      assert(rfcPublic.verify(hashed_message, signature));
    });
  }
  rfcTests.forEach(testRFC);

  it('Should create the same signatures for the same inputs', function() {

    var message = 'Hello world!';
    var secret_hex =
      '9931c08f61f127d5735fa3c60e702212ce7ed9a2ac90d5dbade99c689728cd9b';
    var hash_function = sjcl.hash.sha256;
    var k256_curve = sjcl.ecc.curves.k256;

    var secret_bn = sjcl.bn.fromBits(sjcl.codec.hex.toBits(secret_hex));
    var secret_key = new sjcl.ecc.ecdsa.secretKey(k256_curve, secret_bn);
    var hashed_message = hash_function.hash(message);

    var sig1 = secret_key.signDeterministic(hashed_message, hash_function);
    var sig2 = secret_key.signDeterministic(hashed_message, hash_function);
    assert.deepEqual(sig1, sig2);
  });
});
