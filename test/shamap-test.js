/* eslint-disable max-len, valid-jsdoc */
'use strict';

var assert = require('assert');
var SHAMap = require('../src/common/hashes/shamap').SHAMap;
var TYPE_TRANSACTION_NM = require('../src/common/hashes/shamap').NodeTypes.TRANSACTION_NM

var HEX_ZERO = '00000000000000000000000000000000' +
               '00000000000000000000000000000000';

function intToVuc(v) {
  var ret = '';

  for (var i = 0; i < 32; i++) {
    ret += '0';
    ret += v.toString(16).toUpperCase();
  }
  return ret;
}

/**
* @param shamap {Object}
* @param keys {Array}
* @param hashes {Array}
*/
function fillShamapTest(shamap, keys, hashes) {
  for (var i = 0; i < keys.length; i++) {
    var data = intToVuc(i);
    shamap.addItem(keys[i].toUpperCase(), data, TYPE_TRANSACTION_NM);
    assert.equal(shamap.hash, hashes[i]);
  }
}

describe('SHAMap', function() {

  describe('#addItem', function() {
    it('will add new nodes to v1 or v2 tree', function() {
      var keys = [
        'b92891fe4ef6cee585fdc6fda1e09eb4d386363158ec3321b8123e5a772c6ca8',
        'b92881fe4ef6cee585fdc6fda1e09eb4d386363158ec3321b8123e5a772c6ca8',
        'b92691fe4ef6cee585fdc6fda1e09eb4d386363158ec3321b8123e5a772c6ca8',
        'b92791fe4ef6cee585fdc6fda1e09eb4d386363158ec3321b8123e5a772c6ca8',
        'b91891fe4ef6cee585fdc6fda1e09eb4d386363158ec3321b8123e5a772c6ca8',
        'b99891fe4ef6cee585fdc6fda1e09eb4d386363158ec3321b8123e5a772c6ca8',
        'f22891fe4ef6cee585fdc6fda1e09eb4d386363158ec3321b8123e5a772c6ca8',
        '292891fe4ef6cee585fdc6fda1e09eb4d386363158ec3321b8123e5a772c6ca8'
      ];

      var hashesv1 = [
        'B7387CFEA0465759ADC718E8C42B52D2309D179B326E239EB5075C64B6281F7F',
        'FBC195A9592A54AB44010274163CB6BA95F497EC5BA0A8831845467FB2ECE266',
        '4E7D2684B65DFD48937FFB775E20175C43AF0C94066F7D5679F51AE756795B75',
        '7A2F312EB203695FFD164E038E281839EEF06A1B99BFC263F3CECC6C74F93E07',
        '395A6691A372387A703FB0F2C6D2C405DAF307D0817F8F0E207596462B0E3A3E',
        'D044C0A696DE3169CC70AE216A1564D69DE96582865796142CE7D98A84D9DDE4',
        '76DCC77C4027309B5A91AD164083264D70B77B5E43E08AEDA5EBF94361143615',
        'DF4220E93ADC6F5569063A01B4DC79F8DB9553B6A3222ADE23DEA02BBE7230E5'
      ];


      var shamapv1 = new SHAMap(1);
      assert.equal(shamapv1.hash, HEX_ZERO);
      fillShamapTest(shamapv1, keys, hashesv1);

      var hashesv2 = [
        '90F77DA53895E34042DC8048518CC98AD24276D0A96CCA2C515A83FDAF9F9FC9',
        '425A3B6A68FAD9CB43B9981C7D0D39B942FE62110B437201057EE703F5E76390',
        '1B4BE72DD18F90F367D64C0147D2414329149724339F79958D6470E7C99E3F4A',
        'CCC18ED9B0C353278F02465E2E2F3A8A07427B458CF74C51D87ABE9C1B2ECAD8',
        '24AF98675227F387CE0E4932B71B099FE8BC66E5F07BE2DA70D7E7D98E16C8BC',
        'EAA373271474A9BF18F1CC240B40C7B5C83C7017977F1388771E56D5943F2B9B',
        'C7968A323A06BD46769B402B2A85A7FE7F37FCE99C0004A6197AD8E5D76F200D',
        '0A2412DBB16308706211E5FA5B0160817D54757B4DDC0CB105391A79D06B47BA'
      ];

      var shamapv2 = new SHAMap(2);
      assert.equal(shamapv2.hash, HEX_ZERO);
      fillShamapTest(shamapv2, keys, hashesv2);
    });
  });
});
