// Require all important source files so they 
// are included in the code coverage statistics
var requireDirectory = require('require-directory');
requireDirectory(module, __dirname + '/../src/ripple');
requireDirectory(module, __dirname + '/../src/sjcl-custom');
