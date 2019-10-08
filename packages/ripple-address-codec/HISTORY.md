# ripple-address-codec Release History

## 4.0.0 (2019-10-08)

### Breaking Changes

* `decodeAddress` has been renamed to `decodeAccountID`
* `isValidAddress` has been renamed to `isValidClassicAddress`

### New Features

* `classicAddressToXAddress` - Derive X-address from classic address, tag, and network ID
* `encodeXAddress` - Encode account ID, tag, and network ID as an X-address
* `xAddressToClassicAddress` - Decode an X-address to account ID, tag, and network ID
* `decodeXAddress` - Convert X-address to classic address, tag, and network ID
* `isValidXAddress` - Check whether an X-address (X...) is valid

