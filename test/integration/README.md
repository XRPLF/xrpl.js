To run integration tests:
1. Run rippled-standalone node, either in a docker container (preferred) or by installing rippled.
  * With docker, run `docker run -p 6006:6006 -it natenichols/rippled-standalone:latest`
  * Or [download and build rippled](https://xrpl.org/install-rippled.html) and run `./rippled -a`
2. Run `npm test:integration` or `npm test:browser`

When editing integration tests:
* All imports should be from `xrpl-local` instead of `../../src` (browser tests need this)
