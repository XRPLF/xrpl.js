var request = require('superagent');

var RippleTxt = {
  txts : { }
};

RippleTxt.urlTemplates = [
  'https://{{domain}}/ripple.txt',
  'https://www.{{domain}}/ripple.txt',
  'https://ripple.{{domain}}/ripple.txt',
  'http://{{domain}}/ripple.txt',
  'http://www.{{domain}}/ripple.txt',
  'http://ripple.{{domain}}/ripple.txt'
];

/**
 * Gets the ripple.txt file for the given domain
 * @param {string}    domain - Domain to retrieve file from
 * @param {function}  fn - Callback function
 */

RippleTxt.get = function(domain, fn) {
  var self = this;

  if (self.txts[domain]) {
    return fn(null, self.txts[domain]);
  }

  ;(function nextUrl(i) {
    var url = RippleTxt.urlTemplates[i];
    
    if (!url) {
      return fn(new Error('No ripple.txt found'));
    }

    url = url.replace('{{domain}}', domain);
    
    request.get(url, function(err, resp) {
      if (err || !resp.text) {
        return nextUrl(++i);
      }

      var sections = self.parse(resp.text);
      self.txts[domain] = sections;

      fn(null, sections);
    });
  })(0);
};

/**
 * Parse a ripple.txt file
 * @param {string}  txt - Unparsed ripple.txt data
 */

RippleTxt.parse = function(txt) {
  var currentSection = '';
  var sections = { };
  
  txt = txt.replace(/\r?\n/g, '\n').split('\n');

  for (var i = 0, l = txt.length; i < l; i++) {
    var line = txt[i];

    if (!line.length || line[0] === '#') {
      continue;
    }

    if (line[0] === '[' && line[line.length - 1] === ']') {
      currentSection = line.slice(1, line.length - 1);
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
