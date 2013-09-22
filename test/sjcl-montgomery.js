var assert = require('assert');
var utils  = require('./testutils');
var sjcl   = require('../build/sjcl');

function testExp(vec) {
  var actual = new sjcl.bn(vec.g).powermodMontgomery(new sjcl.bn(vec.e),
                                                     new sjcl.bn(vec.m));
  assert.strictEqual(actual.toString(), new sjcl.bn(vec.r).toString());
}

describe('SJCL Montgomery Exponentiation', function() {
  describe('powermod', function() {
    it('test 1', function () {
      testExp({
        g: 2,
        e: 3,
        m: 3,
        r: 2
      });
    });
    it('test 2', function () {
      testExp({
        g: 2,
        e: "10000000000000000000000000",
        m: 1337,
        r: 1206
      });
    });
    it('test 3', function () {
      testExp({
        g: 17,
        e: 90,
        m: 34717861147,
        r: 28445204336
      });
    });
    it('test 4', function () {
      testExp({
        g: 2,
        e: "0x844A000000000000000000000",
        m: 13,
        r: 9
      });
    });
    it('test 5', function () {
      testExp({
        g: 2,
        e: 0x1010,
        m: 131,
        r: 59
      });
    });
    it('test 6', function () {
      testExp({
        g: 2,
        e: "43207437777777877617151",
        m: 13,
        r: 2
      });
    });
    it('test 7', function () {
      testExp({
        g: 2,
        e: "389274238947216444871600001871964319565192765874149",
        m: 117,
        r: 44
      });
    });
    it('test 8', function () {
      testExp({
        g: 2,
        e: "89457115510016156219817846189181057618965150496979174671534084187",
        m: "1897166415676096761",
        r: "16840615e646a4c5c8d"
      });
    });
    it('test 9', function () {
      testExp({
        g: "4c3399bebab284bc7f9056efe17ea39db324ffa1d52dc1542eb16a749570789359f192535b7bcb514b36be9cdb4fb2a6ba3ad6b4248034e9a1d2a8612cd9d885242b4f679524121b74f79d7db14859fccde1c0dfe6ef002dcbc777ab5fcf4432",
        e: "000322e6b6dafe138ccd6a991977d19",
        m: "a5091daa41997943e3c98469e93377f668d05d8059bc53f72aaacdac3729a3070dc7439a5171160bf9ec2826b7191b03b0e84b28e14dd376de35d29a96f686666e053ab62a41ebc2b5f52e8cf06254100fd153a1cda4485f170c39c54689e52d",
        r: "554336ea044782d29f091117cfeaeee2334b4242bd7428d0bba3ce5325781dc219e891e54698cb0193ffe7c6fc07f1808f6685e64b6a082815f6afd2e16c7a61316b5e3e59cd8b3984d5a76c8e173f8615f7dceac0c99e27e4abfb1278dfa67f"
      });
    });
  });
});

// vim:sw=2:sts=2:ts=8:et
