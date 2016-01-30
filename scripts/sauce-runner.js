'use strict';

const _ = require('lodash');
const MochaSauce = require('mocha-in-sauce');

const testUrl = 'http://testripple.circleci.com:8080/test/saucerunner.html';


function main() {
  // uncomment for more debug info
  // process.env.DEBUG = '*';

  // configure
  const config = {
    name: 'RippleAPI',
    host: 'localhost',
    port: 4445,
    maxDuration: 180000,
    // the current build name (optional)
    build: Date.now(),
    seleniumVersion: '2.50.1',
    url: testUrl,
    runSauceConnect: true
  };

  if (process.env.CIRCLE_BUILD_NUM) {
    config.build = process.env.CIRCLE_BUILD_NUM;
    config.tags = [process.env.CIRCLE_BRANCH, process.env.CIRCLE_SHA1];
    config.tunnelIdentifier = process.env.CIRCLE_BUILD_NUM;
  }

  const sauce = new MochaSauce(config);

  sauce.concurrency(5);

  // setup what browsers to test with
  sauce.browser({browserName: 'firefox', platform: 'Linux',
   version: '43'});
  sauce.browser({browserName: 'firefox', platform: 'Windows 8.1',
    version: '43'});
  sauce.browser({browserName: 'firefox', platform: 'OS X 10.11',
   version: '43'});
  sauce.browser({browserName: 'safari', platform: 'OS X 10.11',
    version: '9'});
  sauce.browser({browserName: 'chrome', platform: 'OS X 10.11',
    version: '47'});
  sauce.browser({browserName: 'chrome', platform: 'Linux',
    version: '47'});
  sauce.browser({browserName: 'chrome', platform: 'Windows 8.1',
    version: '47'});
  sauce.browser({browserName: 'internet explorer', platform: 'Windows 10',
    version: '11'});
  sauce.browser({browserName: 'MicrosoftEdge', platform: 'Windows 10',
    version: '20'});

  sauce.on('init', function(browser) {
    console.log('  init : %s %s', browser.browserName, browser.platform);
  });

  sauce.on('start', function(browser) {
    console.log('  start : %s %s', browser.browserName, browser.platform);
  });

  sauce.on('end', function(browser, res) {
    console.log('  end : %s %s : %d failures', browser.browserName,
      browser.platform, res && res.failures);
  });

  sauce.on('connected', sauceConnectProcess => {
    sauceConnectProcess.on('exit', function(code, /* signal */) {
      if (code > 0) {
        console.log('something wrong - exiting');
        process.exit();
      } else {
        console.log('normal tunnel exit');
      }
    });
  });


  sauce.start(function(err, res) {
    let failure = false;
    if (err) {
      console.log('Error starting Sauce');
      console.error(err);
      process.exitCode = 2;
    } else {
      console.log('-------------- done --------------');
      failure = _.some(res, 'failures');
      console.log('Tests are failed:', failure);
      if (failure) {
        process.exitCode = 1;
      }
    }
  });
}

main();
