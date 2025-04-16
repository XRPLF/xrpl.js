To run integration tests:
1. Run rippled in standalone node, either in a docker container (preferred) or by installing rippled.
  * Go to the top-level of the `xrpl.js` repo, just above the `packages` folder.
  * With docker, run `docker run  -p 6006:6006 --rm -it --name rippled_standalone --volume $PWD/.ci-config:/etc/opt/ripple/ --entrypoint bash rippleci/rippled:2.3.0-rc1 -c 'rippled -a'`
  * Or [download and build rippled](https://xrpl.org/install-rippled.html) and run `./rippled -a --start`
    * If you'd like to use the latest rippled amendments, you should modify your `rippled.cfg` file to enable amendments in the `[amendments]` section. You can view `.ci-config/rippled.cfg` in the top level folder as an example of this.
2. Run `npm run test:integration` or `npm run test:browser`
