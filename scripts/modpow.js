var Benchmark;
try {
  Benchmark = require('benchmark');
} catch (e) {
  console.error("Please install Benchmark.js: npm install benchmark");
  process.exit(1);
}

var sjcl = require('../build/sjcl');
var jsbn = require('../src/js/jsbn/jsbn');

var base = "3f70f29d3f3ae354a6d2536ceafba83cfc787cd91e7acd2b6bde05e62beb8295ae18e3f786726f8d034bbc15bf8331df959f59d431736d5f306aaba63dacec279484e39d76db9b527738072af15730e8b9956a64e8e4dbe868f77d1414a8a8b8bf65380a1f008d39c5fabe1a9f8343929342ab7b4f635bdc52532d764701ff3d8072c475c012ff0c59373e8bc423928d99f58c3a6d9f6ab21ee20bc8e8818fc147db09f60c81906f2c6f73dc69725f075853a89f0cd02a30a8dd86b660ccdeffc292f398efb54088c822774445a6afde471f7dd327ef9996296898a5747726ccaeeceeb2e459df98b4128cb5ab8c7cd20c563f960a1aa770f3c81f13f967b6cc";
var exponent = "322e393f76a1c22b147e7d193c00c023afb7c1500b006ff1bc1cc8d391fc38bd";
var modulus = "c7f1bc1dfb1be82d244aef01228c1409c198894eca9e21430f1669b4aa3864c9f37f3d51b2b4ba1ab9e80f59d267fda1521e88b05117993175e004543c6e3611242f24432ce8efa3b81f0ff660b4f91c5d52f2511a6f38181a7bf9abeef72db056508bbb4eeb5f65f161dd2d5b439655d2ae7081fcc62fdcb281520911d96700c85cdaf12e7d1f15b55ade867240722425198d4ce39019550c4c8a921fc231d3e94297688c2d77cd68ee8fdeda38b7f9a274701fef23b4eaa6c1a9c15b2d77f37634930386fc20ec291be95aed9956801e1c76601b09c413ad915ff03bfdc0b6b233686ae59e8caf11750b509ab4e57ee09202239baee3d6e392d1640185e1cd";
var expected = "5b3823974b3eda87286d3f38499de290bd575d8b02f06720acacf3d50950f9ca0ff6b749f3be03913ddca0b291e0b263bdab6c9cb97e4ab47ee9c235ff20931a8ca358726fab93614e2c549594f5c50b1c979b34f840b6d4fc51d6feb2dd072995421d17862cb405e040fc1ed662a3245a1f97bbafa6d1f7f76c7db6a802e3037acdf01ab5053f5da518d6753477193b9c25e1720519dcb9e2f6e70d5786656d356151845a49861dfc40187eff0e85cd18b1f3f3b97c476472edfa090b868b2388edfffecc521c20df8cebb8aacfb3669b020330dd6ea64b2a3067a972b8f249bccc19347eff43893e916f0949bd5789a5cce0f8b7cd87cece909d679345c0d4";

var BigInteger = jsbn.BigInteger;
var jsbnBase = new BigInteger(base, 16);
var jsbnExponent = new BigInteger(exponent, 16);
var jsbnModulus = new BigInteger(modulus, 16);

var bn = sjcl.bn;
var sjclBase = new bn(base);
var sjclExponent = new bn(exponent);
var sjclModulus = new bn(modulus);

var suite = new Benchmark.Suite;

// add tests
suite.add('jsbn#modPow', function() {
  jsbnBase.modPow(jsbnExponent, jsbnModulus);
});
suite.add('sjcl#powermodMontgomery', function() {
  sjclBase.powermodMontgomery(sjclExponent, sjclModulus);
});
suite.on('cycle', function(event) {
  console.log(String(event.target));
});
suite.on('complete', function() {
  console.log('Fastest is ' + this.filter('fastest').pluck('name'));
});
// run async
console.log("Running benchmark...");
suite.run({ 'async': false });
