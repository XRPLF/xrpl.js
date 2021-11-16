# ripple-binary-codec Release History

## 1.1.3 (2021-06-11)
- Fix for case UInt64.from string allowing lowercase hex (#135)
- Fix for `ValidatorToReEnable` field code (#130)

## 1.1.2 (2021-03-10)
- Fix for case UInt64.from string '0' due to changes in rippled 1.7.0

## 1.1.1 (2021-02-12)
- PathSet.toJSON() does not return undefined values
- Add support for X-Addresses in Issued Currency Amounts
- Fix STArray error message

## 1.1.0 (2020-12-03)
- Add support for Tickets (TicketBatch amendment)
- Fix web browser compatibility

## 1.0.2 (2020-09-11)
- Allow currencies to be encoded from any 3 character ASCII code

## 1.0.1 (2020-09-08)
- Filter out fields with undefined values

## 1.0.0 (2020-08-17)

- Migrate to TypeScript
  - Javascript classes used
  - Generics for constructing core types
- Reduced dependencies
  - Dependent on create-hash, decimal.js, ripple-address-codec
- Migrate testing to Jest and added tests
  - Tests for pseudo-transactions
- Added support for NegativeUNL pseudo-transactions

## 0.2.6 (2019-12-31)

- Update dependencies
  - decimal.js, fs-extra, mocha, handlebars, bn.js, babel-eslint, ripple-address-codec

## 0.2.5 (2019-12-14)

- Add support for AccountDelete (#37)

## 0.2.4 (2019-09-04)

- Update ripple-address-codec to 3.0.4

## 0.2.3 (2019-08-29)

- Expand node version compatibility (#32, #33)

## 0.2.2 (2019-07-26)

- Input validation - Amount and Fee should not allow fractional XRP drops ([#31](https://github.com/ripple/ripple-binary-codec/issues/31))
- Fix lint errors
- Update dependencies (including lodash and mocha)
- Require node 10 (.nvmrc)
- Remove assert-diff
- Remove codecov.io as it did not appear to work. The `package.json` script was:
  - `"codecov": "cat ./coverage/coverage.json | ./node_modules/codecov.io/bin/codecov.io.js"`

## 0.2.1

- Add tecKILLED from amendment fix1578 (PR #27 fixes #25)

## 0.2.0

- Add DepositPreauth fields
  - https://developers.ripple.com/depositauth.html

## 0.1.14

- Skip amount validation when deserializing f72c115

## 0.1.13

- Add Check, CheckCreate, CheckCash, CheckCancel

## 0.1.11

- Add ledger header decode function

## 0.1.8

## 0.1.7

## 0.1.6

## 0.1.3
