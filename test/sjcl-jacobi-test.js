var assert = require('assert');
var utils  = require('./testutils');
var sjcl   = require('../build/sjcl');

describe('SJCL Jacobi', function() {
  it('(15/13) = -1', function () {
    var jac = new sjcl.bn(15).jacobi(13);
    assert.strictEqual(jac, -1);
  });
  it('(4/97) = 1', function () {
    var jac = new sjcl.bn(4).jacobi(97);
    assert.strictEqual(jac, 1);
  });
  it('(17/17) = 0', function () {
    var jac = new sjcl.bn(17).jacobi(17);
    assert.strictEqual(jac, 0);
  });
  it('(34/17) = 0', function () {
    var jac = new sjcl.bn(34).jacobi(17);
    assert.strictEqual(jac, 0);
  });
  it('(19/45) = 1', function () {
    var jac = new sjcl.bn(19).jacobi(45);
    assert.strictEqual(jac, 1);
  });
  it('(8/21) = -1', function () {
    var jac = new sjcl.bn(8).jacobi(21);
    assert.strictEqual(jac, -1);
  });
  it('(5/21) = 1', function () {
    var jac = new sjcl.bn(5).jacobi(21);
    assert.strictEqual(jac, 1);
  });
  it('(1001/9907) = -1', function () {
    var jac = new sjcl.bn(1001).jacobi(9907);
    assert.strictEqual(jac, -1);
  });
  it('(1236/20003) = 1', function () {
    var jac = new sjcl.bn(1236).jacobi(20003);
    assert.strictEqual(jac, 1);
  });
  it('With huge numbers', function () {
    var jac = new sjcl.bn("217033ffbc5a462201407027104916c5e7bf09f2b0c926f7c5cb20858be29d92e7fe67080eeb268fcbc2bc44d9cecfe1d3acbb302111eba355a8b769ed4bdbf773d37dca47e2293c173ff4f84b38f4e84bfad7cc1a913d70e11cf664a95575b80ec9d10123289b402ad2c71c70f2dc28360262d3d703faa964c741a711e4eebd324d659601dd14564fcd8c5908bbf8c97cf3ff82f083da3005848b48cb545b31be2039cca1d67714f32d32b3228c1a659415ee6c138ca274f789006a90a9a41bbc3934b84c78948eae8351f45696fa716b1328561f4c3bbb44ac73112c291b6b4587365e44fa09d583fb8074eb35bf947231e500c0d2c79c5fb957e50e84f6c9").jacobi("c7f1bc1dfb1be82d244aef01228c1409c198894eca9e21430f1669b4aa3864c9f37f3d51b2b4ba1ab9e80f59d267fda1521e88b05117993175e004543c6e3611242f24432ce8efa3b81f0ff660b4f91c5d52f2511a6f38181a7bf9abeef72db056508bbb4eeb5f65f161dd2d5b439655d2ae7081fcc62fdcb281520911d96700c85cdaf12e7d1f15b55ade867240722425198d4ce39019550c4c8a921fc231d3e94297688c2d77cd68ee8fdeda38b7f9a274701fef23b4eaa6c1a9c15b2d77f37634930386fc20ec291be95aed9956801e1c76601b09c413ad915ff03bfdc0b6b233686ae59e8caf11750b509ab4e57ee09202239baee3d6e392d1640185e1cd");
    assert.strictEqual(jac, -1);
  });
});

// vim:sw=2:sts=2:ts=8:et
