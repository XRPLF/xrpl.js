var request = require('superagent');

function RippleTxt() {
  this.txts = { };
};

/**
 * Gets the ripple.txt file for the given domain
 *
 * @param {string}    domain - Domain to retrieve file from
 * @param {function}  fn - Callback function
 */

RippleTxt.prototype.get = function (domain, fn) {
  var self = this;

  if (self.txts[domain]) {
    return fn(null, self.txts[domain]);
  }

  var urls = [
    'https://ripple.'+domain+'/ripple.txt',
    'https://www.'+domain+'/ripple.txt',
    'https://'+domain+'/ripple.txt',
    'http://ripple.'+domain+'/ripple.txt',
    'http://www.'+domain+'/ripple.txt',
    'http://'+domain+'/ripple.txt'
  ];

  ;(function nextUrl() {
    var url = urls.shift();

    if (!url) {
      return fn(new Error('No ripple.txt found'));
    }

    request.get(url, function(err, resp) {
      if (err || !resp.text) {
        return nextUrl();
      }

      var sections = self.parse(resp.text);
      self.txts[domain] = sections;

      fn(null, sections);
    });
  })();
};

/**
 * Parse a ripple.txt file
 *
 * @param {string}  txt - Unparsed ripple.txt data
 */

RippleTxt.prototype.parse = function (txt) {
  var txt = txt.replace(/\r?\n/g, '\n').split('\n')
  var currentSection = '';
  var sections = { };

  for (var i = 0, l = txt.length; i < l; i++) {
    var line = txt[i];

    if (!line.length || line[0] === '#') {
      continue;
    }

    if (line[0] === '[' && line[line.length-1] === ']') {
      currentSection = line.slice(1, line.length-1);
      sections[currentSection] = [];
    } else {
      line = line.replace(/^\s+|\s+$/g, '');
      if (sections[currentSection]) {
        sections[currentSection].push(line);
      }
    }
  }

  return sections;
};

exports.RippleTxt = RippleTxt;
