import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/blog',
    component: ComponentCreator('/blog', 'b21'),
    exact: true
  },
  {
    path: '/blog/archive',
    component: ComponentCreator('/blog/archive', '393'),
    exact: true
  },
  {
    path: '/blog/first-blog-post',
    component: ComponentCreator('/blog/first-blog-post', 'cb9'),
    exact: true
  },
  {
    path: '/blog/long-blog-post',
    component: ComponentCreator('/blog/long-blog-post', 'a03'),
    exact: true
  },
  {
    path: '/blog/mdx-blog-post',
    component: ComponentCreator('/blog/mdx-blog-post', '1b9'),
    exact: true
  },
  {
    path: '/blog/tags',
    component: ComponentCreator('/blog/tags', 'a0f'),
    exact: true
  },
  {
    path: '/blog/tags/docusaurus',
    component: ComponentCreator('/blog/tags/docusaurus', '16a'),
    exact: true
  },
  {
    path: '/blog/tags/facebook',
    component: ComponentCreator('/blog/tags/facebook', '27a'),
    exact: true
  },
  {
    path: '/blog/tags/hello',
    component: ComponentCreator('/blog/tags/hello', '0e6'),
    exact: true
  },
  {
    path: '/blog/tags/hola',
    component: ComponentCreator('/blog/tags/hola', 'c07'),
    exact: true
  },
  {
    path: '/blog/welcome',
    component: ComponentCreator('/blog/welcome', '089'),
    exact: true
  },
  {
    path: '/markdown-page',
    component: ComponentCreator('/markdown-page', 'b2c'),
    exact: true
  },
  {
    path: '/search',
    component: ComponentCreator('/search', 'e67'),
    exact: true
  },
  {
    path: '/api',
    component: ComponentCreator('/api', '67f'),
    routes: [
      {
        path: '/api',
        component: ComponentCreator('/api', '887'),
        exact: true,
        sidebar: "api"
      },
      {
        path: '/api/ripple-address-codec',
        component: ComponentCreator('/api/ripple-address-codec', '1f8'),
        exact: true,
        sidebar: "api",
        id: 43
      },
      {
        path: '/api/ripple-address-codec/changelog',
        component: ComponentCreator('/api/ripple-address-codec/changelog', '5ba'),
        exact: true,
        sidebar: "api"
      },
      {
        path: '/api/ripple-address-codec/function/classicAddressToXAddress',
        component: ComponentCreator('/api/ripple-address-codec/function/classicAddressToXAddress', '84e'),
        exact: true,
        sidebar: "api",
        id: 44
      },
      {
        path: '/api/ripple-address-codec/function/decodeAccountID',
        component: ComponentCreator('/api/ripple-address-codec/function/decodeAccountID', '317'),
        exact: true,
        sidebar: "api",
        id: 3474
      },
      {
        path: '/api/ripple-address-codec/function/decodeAccountPublic',
        component: ComponentCreator('/api/ripple-address-codec/function/decodeAccountPublic', '247'),
        exact: true,
        sidebar: "api",
        id: 3486
      },
      {
        path: '/api/ripple-address-codec/function/decodeNodePublic',
        component: ComponentCreator('/api/ripple-address-codec/function/decodeNodePublic', 'c82'),
        exact: true,
        sidebar: "api",
        id: 3480
      },
      {
        path: '/api/ripple-address-codec/function/decodeSeed',
        component: ComponentCreator('/api/ripple-address-codec/function/decodeSeed', 'bd7'),
        exact: true,
        sidebar: "api",
        id: 3459
      },
      {
        path: '/api/ripple-address-codec/function/decodeXAddress',
        component: ComponentCreator('/api/ripple-address-codec/function/decodeXAddress', 'ed4'),
        exact: true,
        sidebar: "api",
        id: 61
      },
      {
        path: '/api/ripple-address-codec/function/encodeAccountID',
        component: ComponentCreator('/api/ripple-address-codec/function/encodeAccountID', '01e'),
        exact: true,
        sidebar: "api",
        id: 3471
      },
      {
        path: '/api/ripple-address-codec/function/encodeAccountPublic',
        component: ComponentCreator('/api/ripple-address-codec/function/encodeAccountPublic', 'b6e'),
        exact: true,
        sidebar: "api",
        id: 3483
      },
      {
        path: '/api/ripple-address-codec/function/encodeNodePublic',
        component: ComponentCreator('/api/ripple-address-codec/function/encodeNodePublic', '49a'),
        exact: true,
        sidebar: "api",
        id: 3477
      },
      {
        path: '/api/ripple-address-codec/function/encodeSeed',
        component: ComponentCreator('/api/ripple-address-codec/function/encodeSeed', '5f3'),
        exact: true,
        sidebar: "api",
        id: 3455
      },
      {
        path: '/api/ripple-address-codec/function/encodeXAddress',
        component: ComponentCreator('/api/ripple-address-codec/function/encodeXAddress', 'f6c'),
        exact: true,
        sidebar: "api",
        id: 49
      },
      {
        path: '/api/ripple-address-codec/function/isValidClassicAddress',
        component: ComponentCreator('/api/ripple-address-codec/function/isValidClassicAddress', '9e6'),
        exact: true,
        sidebar: "api",
        id: 3489
      },
      {
        path: '/api/ripple-address-codec/function/isValidXAddress',
        component: ComponentCreator('/api/ripple-address-codec/function/isValidXAddress', '0ed'),
        exact: true,
        sidebar: "api",
        id: 68
      },
      {
        path: '/api/ripple-address-codec/function/xAddressToClassicAddress',
        component: ComponentCreator('/api/ripple-address-codec/function/xAddressToClassicAddress', '800'),
        exact: true,
        sidebar: "api",
        id: 54
      },
      {
        path: '/api/ripple-binary-codec',
        component: ComponentCreator('/api/ripple-binary-codec', 'cd0'),
        exact: true,
        sidebar: "api",
        id: 71
      },
      {
        path: '/api/ripple-binary-codec/changelog',
        component: ComponentCreator('/api/ripple-binary-codec/changelog', '35e'),
        exact: true,
        sidebar: "api"
      },
      {
        path: '/api/ripple-binary-codec/class/XrplDefinitions',
        component: ComponentCreator('/api/ripple-binary-codec/class/XrplDefinitions', '3c5'),
        exact: true,
        sidebar: "api",
        id: 3497
      },
      {
        path: '/api/ripple-binary-codec/class/XrplDefinitionsBase',
        component: ComponentCreator('/api/ripple-binary-codec/class/XrplDefinitionsBase', 'a43'),
        exact: true,
        sidebar: "api",
        id: 3514
      },
      {
        path: '/api/ripple-binary-codec/function/decode',
        component: ComponentCreator('/api/ripple-binary-codec/function/decode', '98d'),
        exact: true,
        sidebar: "api",
        id: 72
      },
      {
        path: '/api/ripple-binary-codec/function/decodeLedgerData',
        component: ComponentCreator('/api/ripple-binary-codec/function/decodeLedgerData', '2a0'),
        exact: true,
        sidebar: "api",
        id: 3492
      },
      {
        path: '/api/ripple-binary-codec/function/decodeQuality',
        component: ComponentCreator('/api/ripple-binary-codec/function/decodeQuality', '404'),
        exact: true,
        sidebar: "api",
        id: 95
      },
      {
        path: '/api/ripple-binary-codec/function/encode',
        component: ComponentCreator('/api/ripple-binary-codec/function/encode', 'fc1'),
        exact: true,
        sidebar: "api",
        id: 76
      },
      {
        path: '/api/ripple-binary-codec/function/encodeForMultisigning',
        component: ComponentCreator('/api/ripple-binary-codec/function/encodeForMultisigning', 'bf2'),
        exact: true,
        sidebar: "api",
        id: 87
      },
      {
        path: '/api/ripple-binary-codec/function/encodeForSigning',
        component: ComponentCreator('/api/ripple-binary-codec/function/encodeForSigning', '784'),
        exact: true,
        sidebar: "api",
        id: 80
      },
      {
        path: '/api/ripple-binary-codec/function/encodeForSigningClaim',
        component: ComponentCreator('/api/ripple-binary-codec/function/encodeForSigningClaim', 'a05'),
        exact: true,
        sidebar: "api",
        id: 84
      },
      {
        path: '/api/ripple-binary-codec/function/encodeQuality',
        component: ComponentCreator('/api/ripple-binary-codec/function/encodeQuality', 'a31'),
        exact: true,
        sidebar: "api",
        id: 92
      },
      {
        path: '/api/ripple-keypairs',
        component: ComponentCreator('/api/ripple-keypairs', '390'),
        exact: true,
        sidebar: "api",
        id: 2
      },
      {
        path: '/api/ripple-keypairs/changelog',
        component: ComponentCreator('/api/ripple-keypairs/changelog', '8c9'),
        exact: true,
        sidebar: "api"
      },
      {
        path: '/api/ripple-keypairs/function/decodeSeed',
        component: ComponentCreator('/api/ripple-keypairs/function/decodeSeed', '622'),
        exact: true,
        sidebar: "api",
        id: 31
      },
      {
        path: '/api/ripple-keypairs/function/deriveAddress',
        component: ComponentCreator('/api/ripple-keypairs/function/deriveAddress', '17b'),
        exact: true,
        sidebar: "api",
        id: 25
      },
      {
        path: '/api/ripple-keypairs/function/deriveKeypair',
        component: ComponentCreator('/api/ripple-keypairs/function/deriveKeypair', 'fbd'),
        exact: true,
        sidebar: "api",
        id: 9
      },
      {
        path: '/api/ripple-keypairs/function/deriveNodeAddress',
        component: ComponentCreator('/api/ripple-keypairs/function/deriveNodeAddress', 'e4c'),
        exact: true,
        sidebar: "api",
        id: 28
      },
      {
        path: '/api/ripple-keypairs/function/generateSeed',
        component: ComponentCreator('/api/ripple-keypairs/function/generateSeed', '05d'),
        exact: true,
        sidebar: "api",
        id: 3
      },
      {
        path: '/api/ripple-keypairs/function/sign',
        component: ComponentCreator('/api/ripple-keypairs/function/sign', 'a1b'),
        exact: true,
        sidebar: "api",
        id: 16
      },
      {
        path: '/api/ripple-keypairs/function/verify',
        component: ComponentCreator('/api/ripple-keypairs/function/verify', '8fa'),
        exact: true,
        sidebar: "api",
        id: 20
      },
      {
        path: '/api/xrpl',
        component: ComponentCreator('/api/xrpl', 'dcc'),
        exact: true,
        sidebar: "api",
        id: 1
      },
      {
        path: '/api/xrpl/changelog',
        component: ComponentCreator('/api/xrpl/changelog', '6d9'),
        exact: true,
        sidebar: "api"
      },
      {
        path: '/api/xrpl/class/BroadcastClient',
        component: ComponentCreator('/api/xrpl/class/BroadcastClient', '7fe'),
        exact: true,
        sidebar: "api",
        id: 98
      },
      {
        path: '/api/xrpl/class/Client',
        component: ComponentCreator('/api/xrpl/class/Client', 'e6b'),
        exact: true,
        sidebar: "api",
        id: 384
      },
      {
        path: '/api/xrpl/class/ConnectionError',
        component: ComponentCreator('/api/xrpl/class/ConnectionError', '9af'),
        exact: true,
        sidebar: "api",
        id: 3324
      },
      {
        path: '/api/xrpl/class/DisconnectedError',
        component: ComponentCreator('/api/xrpl/class/DisconnectedError', 'b32'),
        exact: true,
        sidebar: "api",
        id: 3360
      },
      {
        path: '/api/xrpl/class/NotConnectedError',
        component: ComponentCreator('/api/xrpl/class/NotConnectedError', '79f'),
        exact: true,
        sidebar: "api",
        id: 3348
      },
      {
        path: '/api/xrpl/class/NotFoundError',
        component: ComponentCreator('/api/xrpl/class/NotFoundError', '64e'),
        exact: true,
        sidebar: "api",
        id: 3420
      },
      {
        path: '/api/xrpl/class/ResponseFormatError',
        component: ComponentCreator('/api/xrpl/class/ResponseFormatError', '3a4'),
        exact: true,
        sidebar: "api",
        id: 3396
      },
      {
        path: '/api/xrpl/class/RippledError',
        component: ComponentCreator('/api/xrpl/class/RippledError', 'b80'),
        exact: true,
        sidebar: "api",
        id: 3336
      },
      {
        path: '/api/xrpl/class/RippledNotInitializedError',
        component: ComponentCreator('/api/xrpl/class/RippledNotInitializedError', 'f47'),
        exact: true,
        sidebar: "api",
        id: 3372
      },
      {
        path: '/api/xrpl/class/TimeoutError',
        component: ComponentCreator('/api/xrpl/class/TimeoutError', '495'),
        exact: true,
        sidebar: "api",
        id: 3384
      },
      {
        path: '/api/xrpl/class/UnexpectedError',
        component: ComponentCreator('/api/xrpl/class/UnexpectedError', '1c8'),
        exact: true,
        sidebar: "api",
        id: 3312
      },
      {
        path: '/api/xrpl/class/ValidationError',
        component: ComponentCreator('/api/xrpl/class/ValidationError', 'd23'),
        exact: true,
        sidebar: "api",
        id: 3408
      },
      {
        path: '/api/xrpl/class/Wallet',
        component: ComponentCreator('/api/xrpl/class/Wallet', '83f'),
        exact: true,
        sidebar: "api",
        id: 691
      },
      {
        path: '/api/xrpl/class/XrplError',
        component: ComponentCreator('/api/xrpl/class/XrplError', '081'),
        exact: true,
        sidebar: "api",
        id: 3300
      },
      {
        path: '/api/xrpl/class/XRPLFaucetError',
        component: ComponentCreator('/api/xrpl/class/XRPLFaucetError', '153'),
        exact: true,
        sidebar: "api",
        id: 3431
      },
      {
        path: '/api/xrpl/enum/AccountSetAsfFlags',
        component: ComponentCreator('/api/xrpl/enum/AccountSetAsfFlags', '440'),
        exact: true,
        sidebar: "api",
        id: 2356
      },
      {
        path: '/api/xrpl/enum/AccountSetTfFlags',
        component: ComponentCreator('/api/xrpl/enum/AccountSetTfFlags', '3ba'),
        exact: true,
        sidebar: "api",
        id: 2371
      },
      {
        path: '/api/xrpl/enum/ECDSA',
        component: ComponentCreator('/api/xrpl/enum/ECDSA', '8ab'),
        exact: true,
        sidebar: "api",
        id: 688
      },
      {
        path: '/api/xrpl/enum/EnableAmendmentFlags',
        component: ComponentCreator('/api/xrpl/enum/EnableAmendmentFlags', '693'),
        exact: true,
        sidebar: "api",
        id: 2570
      },
      {
        path: '/api/xrpl/enum/NFTokenCreateOfferFlags',
        component: ComponentCreator('/api/xrpl/enum/NFTokenCreateOfferFlags', '359'),
        exact: true,
        sidebar: "api",
        id: 2644
      },
      {
        path: '/api/xrpl/enum/NFTokenMintFlags',
        component: ComponentCreator('/api/xrpl/enum/NFTokenMintFlags', '3d8'),
        exact: true,
        sidebar: "api",
        id: 2667
      },
      {
        path: '/api/xrpl/enum/OfferCreateFlags',
        component: ComponentCreator('/api/xrpl/enum/OfferCreateFlags', 'f86'),
        exact: true,
        sidebar: "api",
        id: 2693
      },
      {
        path: '/api/xrpl/enum/PaymentChannelClaimFlags',
        component: ComponentCreator('/api/xrpl/enum/PaymentChannelClaimFlags', 'd2b'),
        exact: true,
        sidebar: "api",
        id: 2752
      },
      {
        path: '/api/xrpl/enum/PaymentFlags',
        component: ComponentCreator('/api/xrpl/enum/PaymentFlags', '5fd'),
        exact: true,
        sidebar: "api",
        id: 2722
      },
      {
        path: '/api/xrpl/enum/TrustSetFlags',
        component: ComponentCreator('/api/xrpl/enum/TrustSetFlags', '355'),
        exact: true,
        sidebar: "api",
        id: 2912
      },
      {
        path: '/api/xrpl/function/authorizeChannel',
        component: ComponentCreator('/api/xrpl/function/authorizeChannel', 'e86'),
        exact: true,
        sidebar: "api",
        id: 3443
      },
      {
        path: '/api/xrpl/function/classicAddressToXAddress',
        component: ComponentCreator('/api/xrpl/function/classicAddressToXAddress', '695'),
        exact: true,
        sidebar: "api",
        id: 3207
      },
      {
        path: '/api/xrpl/function/convertHexToString',
        component: ComponentCreator('/api/xrpl/function/convertHexToString', '3a7'),
        exact: true,
        sidebar: "api",
        id: 3203
      },
      {
        path: '/api/xrpl/function/convertStringToHex',
        component: ComponentCreator('/api/xrpl/function/convertStringToHex', '3b0'),
        exact: true,
        sidebar: "api",
        id: 3200
      },
      {
        path: '/api/xrpl/function/decimalToQuality',
        component: ComponentCreator('/api/xrpl/function/decimalToQuality', 'aa8'),
        exact: true,
        sidebar: "api",
        id: 3083
      },
      {
        path: '/api/xrpl/function/decimalToTransferRate',
        component: ComponentCreator('/api/xrpl/function/decimalToTransferRate', '21f'),
        exact: true,
        sidebar: "api",
        id: 3089
      },
      {
        path: '/api/xrpl/function/decode',
        component: ComponentCreator('/api/xrpl/function/decode', '16a'),
        exact: true,
        sidebar: "api",
        id: 3274
      },
      {
        path: '/api/xrpl/function/decodeAccountID',
        component: ComponentCreator('/api/xrpl/function/decodeAccountID', '46a'),
        exact: true,
        sidebar: "api",
        id: 3244
      },
      {
        path: '/api/xrpl/function/decodeAccountPublic',
        component: ComponentCreator('/api/xrpl/function/decodeAccountPublic', '261'),
        exact: true,
        sidebar: "api",
        id: 3256
      },
      {
        path: '/api/xrpl/function/decodeNodePublic',
        component: ComponentCreator('/api/xrpl/function/decodeNodePublic', '27e'),
        exact: true,
        sidebar: "api",
        id: 3250
      },
      {
        path: '/api/xrpl/function/decodeSeed',
        component: ComponentCreator('/api/xrpl/function/decodeSeed', '125'),
        exact: true,
        sidebar: "api",
        id: 3229
      },
      {
        path: '/api/xrpl/function/decodeXAddress',
        component: ComponentCreator('/api/xrpl/function/decodeXAddress', 'fa6'),
        exact: true,
        sidebar: "api",
        id: 3264
      },
      {
        path: '/api/xrpl/function/deriveAddress',
        component: ComponentCreator('/api/xrpl/function/deriveAddress', '97d'),
        exact: true,
        sidebar: "api",
        id: 3174
      },
      {
        path: '/api/xrpl/function/deriveKeypair',
        component: ComponentCreator('/api/xrpl/function/deriveKeypair', 'e8a'),
        exact: true,
        sidebar: "api",
        id: 3163
      },
      {
        path: '/api/xrpl/function/deriveXAddress',
        component: ComponentCreator('/api/xrpl/function/deriveXAddress', '18d'),
        exact: true,
        sidebar: "api",
        id: 3177
      },
      {
        path: '/api/xrpl/function/dropsToXrp',
        component: ComponentCreator('/api/xrpl/function/dropsToXrp', '4f8'),
        exact: true,
        sidebar: "api",
        id: 3059
      },
      {
        path: '/api/xrpl/function/encode',
        component: ComponentCreator('/api/xrpl/function/encode', '730'),
        exact: true,
        sidebar: "api",
        id: 3271
      },
      {
        path: '/api/xrpl/function/encodeAccountID',
        component: ComponentCreator('/api/xrpl/function/encodeAccountID', 'f9a'),
        exact: true,
        sidebar: "api",
        id: 3241
      },
      {
        path: '/api/xrpl/function/encodeAccountPublic',
        component: ComponentCreator('/api/xrpl/function/encodeAccountPublic', 'bf9'),
        exact: true,
        sidebar: "api",
        id: 3253
      },
      {
        path: '/api/xrpl/function/encodeForMultiSigning',
        component: ComponentCreator('/api/xrpl/function/encodeForMultiSigning', 'e0a'),
        exact: true,
        sidebar: "api",
        id: 3277
      },
      {
        path: '/api/xrpl/function/encodeForSigning',
        component: ComponentCreator('/api/xrpl/function/encodeForSigning', 'b0c'),
        exact: true,
        sidebar: "api",
        id: 3281
      },
      {
        path: '/api/xrpl/function/encodeForSigningClaim',
        component: ComponentCreator('/api/xrpl/function/encodeForSigningClaim', 'ee1'),
        exact: true,
        sidebar: "api",
        id: 3284
      },
      {
        path: '/api/xrpl/function/encodeNodePublic',
        component: ComponentCreator('/api/xrpl/function/encodeNodePublic', 'cdc'),
        exact: true,
        sidebar: "api",
        id: 3247
      },
      {
        path: '/api/xrpl/function/encodeSeed',
        component: ComponentCreator('/api/xrpl/function/encodeSeed', '819'),
        exact: true,
        sidebar: "api",
        id: 3225
      },
      {
        path: '/api/xrpl/function/encodeXAddress',
        component: ComponentCreator('/api/xrpl/function/encodeXAddress', '104'),
        exact: true,
        sidebar: "api",
        id: 3259
      },
      {
        path: '/api/xrpl/function/getBalanceChanges',
        component: ComponentCreator('/api/xrpl/function/getBalanceChanges', '9a5'),
        exact: true,
        sidebar: "api",
        id: 3049
      },
      {
        path: '/api/xrpl/function/getNFTokenID',
        component: ComponentCreator('/api/xrpl/function/getNFTokenID', '893'),
        exact: true,
        sidebar: "api",
        id: 3287
      },
      {
        path: '/api/xrpl/function/hasNextPage',
        component: ComponentCreator('/api/xrpl/function/hasNextPage', '8a9'),
        exact: true,
        sidebar: "api",
        id: 3065
      },
      {
        path: '/api/xrpl/function/isCreatedNode',
        component: ComponentCreator('/api/xrpl/function/isCreatedNode', '74c'),
        exact: true,
        sidebar: "api",
        id: 2941
      },
      {
        path: '/api/xrpl/function/isDeletedNode',
        component: ComponentCreator('/api/xrpl/function/isDeletedNode', '5f1'),
        exact: true,
        sidebar: "api",
        id: 2947
      },
      {
        path: '/api/xrpl/function/isModifiedNode',
        component: ComponentCreator('/api/xrpl/function/isModifiedNode', '358'),
        exact: true,
        sidebar: "api",
        id: 2944
      },
      {
        path: '/api/xrpl/function/isoTimeToRippleTime',
        component: ComponentCreator('/api/xrpl/function/isoTimeToRippleTime', '060'),
        exact: true,
        sidebar: "api",
        id: 3071
      },
      {
        path: '/api/xrpl/function/isValidAddress',
        component: ComponentCreator('/api/xrpl/function/isValidAddress', 'e9f'),
        exact: true,
        sidebar: "api",
        id: 3101
      },
      {
        path: '/api/xrpl/function/isValidClassicAddress',
        component: ComponentCreator('/api/xrpl/function/isValidClassicAddress', 'bff'),
        exact: true,
        sidebar: "api",
        id: 3222
      },
      {
        path: '/api/xrpl/function/isValidSecret',
        component: ComponentCreator('/api/xrpl/function/isValidSecret', '079'),
        exact: true,
        sidebar: "api",
        id: 3098
      },
      {
        path: '/api/xrpl/function/isValidXAddress',
        component: ComponentCreator('/api/xrpl/function/isValidXAddress', 'e08'),
        exact: true,
        sidebar: "api",
        id: 3219
      },
      {
        path: '/api/xrpl/function/keyToRFC1751Mnemonic',
        component: ComponentCreator('/api/xrpl/function/keyToRFC1751Mnemonic', 'cf1'),
        exact: true,
        sidebar: "api",
        id: 769
      },
      {
        path: '/api/xrpl/function/multisign',
        component: ComponentCreator('/api/xrpl/function/multisign', '1f9'),
        exact: true,
        sidebar: "api",
        id: 3451
      },
      {
        path: '/api/xrpl/function/parseAccountRootFlags',
        component: ComponentCreator('/api/xrpl/function/parseAccountRootFlags', '400'),
        exact: true,
        sidebar: "api",
        id: 1047
      },
      {
        path: '/api/xrpl/function/parseNFTokenID',
        component: ComponentCreator('/api/xrpl/function/parseNFTokenID', 'ec5'),
        exact: true,
        sidebar: "api",
        id: 3290
      },
      {
        path: '/api/xrpl/function/percentToQuality',
        component: ComponentCreator('/api/xrpl/function/percentToQuality', '40c'),
        exact: true,
        sidebar: "api",
        id: 3080
      },
      {
        path: '/api/xrpl/function/percentToTransferRate',
        component: ComponentCreator('/api/xrpl/function/percentToTransferRate', '0ff'),
        exact: true,
        sidebar: "api",
        id: 3086
      },
      {
        path: '/api/xrpl/function/qualityToDecimal',
        component: ComponentCreator('/api/xrpl/function/qualityToDecimal', '30a'),
        exact: true,
        sidebar: "api",
        id: 3095
      },
      {
        path: '/api/xrpl/function/rfc1751MnemonicToKey',
        component: ComponentCreator('/api/xrpl/function/rfc1751MnemonicToKey', '3b2'),
        exact: true,
        sidebar: "api",
        id: 772
      },
      {
        path: '/api/xrpl/function/rippleTimeToISOTime',
        component: ComponentCreator('/api/xrpl/function/rippleTimeToISOTime', '1ca'),
        exact: true,
        sidebar: "api",
        id: 3068
      },
      {
        path: '/api/xrpl/function/rippleTimeToUnixTime',
        component: ComponentCreator('/api/xrpl/function/rippleTimeToUnixTime', '59e'),
        exact: true,
        sidebar: "api",
        id: 3074
      },
      {
        path: '/api/xrpl/function/setTransactionFlagsToNumber',
        component: ComponentCreator('/api/xrpl/function/setTransactionFlagsToNumber', 'd4d'),
        exact: true,
        sidebar: "api",
        id: 1044
      },
      {
        path: '/api/xrpl/function/signPaymentChannelClaim',
        component: ComponentCreator('/api/xrpl/function/signPaymentChannelClaim', 'bf9'),
        exact: true,
        sidebar: "api",
        id: 3184
      },
      {
        path: '/api/xrpl/function/transferRateToDecimal',
        component: ComponentCreator('/api/xrpl/function/transferRateToDecimal', '5b9'),
        exact: true,
        sidebar: "api",
        id: 3092
      },
      {
        path: '/api/xrpl/function/unixTimeToRippleTime',
        component: ComponentCreator('/api/xrpl/function/unixTimeToRippleTime', 'e12'),
        exact: true,
        sidebar: "api",
        id: 3077
      },
      {
        path: '/api/xrpl/function/validate',
        component: ComponentCreator('/api/xrpl/function/validate', '01c'),
        exact: true,
        sidebar: "api",
        id: 2349
      },
      {
        path: '/api/xrpl/function/verifyKeypairSignature',
        component: ComponentCreator('/api/xrpl/function/verifyKeypairSignature', 'f7d'),
        exact: true,
        sidebar: "api",
        id: 3189
      },
      {
        path: '/api/xrpl/function/verifyPaymentChannelClaim',
        component: ComponentCreator('/api/xrpl/function/verifyPaymentChannelClaim', 'dcd'),
        exact: true,
        sidebar: "api",
        id: 3194
      },
      {
        path: '/api/xrpl/function/verifySignature',
        component: ComponentCreator('/api/xrpl/function/verifySignature', '45f'),
        exact: true,
        sidebar: "api",
        id: 3448
      },
      {
        path: '/api/xrpl/function/xAddressToClassicAddress',
        component: ComponentCreator('/api/xrpl/function/xAddressToClassicAddress', '1f8'),
        exact: true,
        sidebar: "api",
        id: 3212
      },
      {
        path: '/api/xrpl/function/xrpToDrops',
        component: ComponentCreator('/api/xrpl/function/xrpToDrops', 'ee8'),
        exact: true,
        sidebar: "api",
        id: 3062
      },
      {
        path: '/api/xrpl/interface/AccountChannelsRequest',
        component: ComponentCreator('/api/xrpl/interface/AccountChannelsRequest', 'e7c'),
        exact: true,
        sidebar: "api",
        id: 1087
      },
      {
        path: '/api/xrpl/interface/AccountChannelsResponse',
        component: ComponentCreator('/api/xrpl/interface/AccountChannelsResponse', '24f'),
        exact: true,
        sidebar: "api",
        id: 1097
      },
      {
        path: '/api/xrpl/interface/AccountCurrenciesRequest',
        component: ComponentCreator('/api/xrpl/interface/AccountCurrenciesRequest', 'e2f'),
        exact: true,
        sidebar: "api",
        id: 1114
      },
      {
        path: '/api/xrpl/interface/AccountCurrenciesResponse',
        component: ComponentCreator('/api/xrpl/interface/AccountCurrenciesResponse', '352'),
        exact: true,
        sidebar: "api",
        id: 1122
      },
      {
        path: '/api/xrpl/interface/AccountDelete',
        component: ComponentCreator('/api/xrpl/interface/AccountDelete', '2bf'),
        exact: true,
        sidebar: "api",
        id: 2408
      },
      {
        path: '/api/xrpl/interface/AccountInfoAccountFlags',
        component: ComponentCreator('/api/xrpl/interface/AccountInfoAccountFlags', '844'),
        exact: true,
        sidebar: "api",
        id: 1137
      },
      {
        path: '/api/xrpl/interface/AccountInfoRequest',
        component: ComponentCreator('/api/xrpl/interface/AccountInfoRequest', '9c5'),
        exact: true,
        sidebar: "api",
        id: 1151
      },
      {
        path: '/api/xrpl/interface/AccountInfoResponse',
        component: ComponentCreator('/api/xrpl/interface/AccountInfoResponse', '96a'),
        exact: true,
        sidebar: "api",
        id: 1161
      },
      {
        path: '/api/xrpl/interface/AccountLinesRequest',
        component: ComponentCreator('/api/xrpl/interface/AccountLinesRequest', '2f7'),
        exact: true,
        sidebar: "api",
        id: 1192
      },
      {
        path: '/api/xrpl/interface/AccountLinesResponse',
        component: ComponentCreator('/api/xrpl/interface/AccountLinesResponse', 'dd8'),
        exact: true,
        sidebar: "api",
        id: 1202
      },
      {
        path: '/api/xrpl/interface/AccountLinesTrustline',
        component: ComponentCreator('/api/xrpl/interface/AccountLinesTrustline', '10e'),
        exact: true,
        sidebar: "api",
        id: 1218
      },
      {
        path: '/api/xrpl/interface/AccountNFToken',
        component: ComponentCreator('/api/xrpl/interface/AccountNFToken', '667'),
        exact: true,
        sidebar: "api",
        id: 1232
      },
      {
        path: '/api/xrpl/interface/AccountNFTsRequest',
        component: ComponentCreator('/api/xrpl/interface/AccountNFTsRequest', 'cac'),
        exact: true,
        sidebar: "api",
        id: 1239
      },
      {
        path: '/api/xrpl/interface/AccountNFTsResponse',
        component: ComponentCreator('/api/xrpl/interface/AccountNFTsResponse', 'cb3'),
        exact: true,
        sidebar: "api",
        id: 1248
      },
      {
        path: '/api/xrpl/interface/AccountObjectsRequest',
        component: ComponentCreator('/api/xrpl/interface/AccountObjectsRequest', '871'),
        exact: true,
        sidebar: "api",
        id: 1266
      },
      {
        path: '/api/xrpl/interface/AccountObjectsResponse',
        component: ComponentCreator('/api/xrpl/interface/AccountObjectsResponse', '82e'),
        exact: true,
        sidebar: "api",
        id: 1277
      },
      {
        path: '/api/xrpl/interface/AccountOffer',
        component: ComponentCreator('/api/xrpl/interface/AccountOffer', '9ac'),
        exact: true,
        sidebar: "api",
        id: 1295
      },
      {
        path: '/api/xrpl/interface/AccountOffersRequest',
        component: ComponentCreator('/api/xrpl/interface/AccountOffersRequest', 'b91'),
        exact: true,
        sidebar: "api",
        id: 1302
      },
      {
        path: '/api/xrpl/interface/AccountOffersResponse',
        component: ComponentCreator('/api/xrpl/interface/AccountOffersResponse', '7e6'),
        exact: true,
        sidebar: "api",
        id: 1312
      },
      {
        path: '/api/xrpl/interface/AccountQueueData',
        component: ComponentCreator('/api/xrpl/interface/AccountQueueData', '88b'),
        exact: true,
        sidebar: "api",
        id: 1179
      },
      {
        path: '/api/xrpl/interface/AccountQueueTransaction',
        component: ComponentCreator('/api/xrpl/interface/AccountQueueTransaction', 'f15'),
        exact: true,
        sidebar: "api",
        id: 1186
      },
      {
        path: '/api/xrpl/interface/AccountSet',
        component: ComponentCreator('/api/xrpl/interface/AccountSet', '8f3'),
        exact: true,
        sidebar: "api",
        id: 2385
      },
      {
        path: '/api/xrpl/interface/AccountSetFlagsInterface',
        component: ComponentCreator('/api/xrpl/interface/AccountSetFlagsInterface', 'db5'),
        exact: true,
        sidebar: "api",
        id: 2378
      },
      {
        path: '/api/xrpl/interface/AccountTxRequest',
        component: ComponentCreator('/api/xrpl/interface/AccountTxRequest', '8cb'),
        exact: true,
        sidebar: "api",
        id: 1328
      },
      {
        path: '/api/xrpl/interface/AccountTxResponse',
        component: ComponentCreator('/api/xrpl/interface/AccountTxResponse', '72b'),
        exact: true,
        sidebar: "api",
        id: 1341
      },
      {
        path: '/api/xrpl/interface/AccountTxTransaction',
        component: ComponentCreator('/api/xrpl/interface/AccountTxTransaction', '2da'),
        exact: true,
        sidebar: "api",
        id: 1358
      },
      {
        path: '/api/xrpl/interface/BaseRequest',
        component: ComponentCreator('/api/xrpl/interface/BaseRequest', '11c'),
        exact: true,
        sidebar: "api",
        id: 1050
      },
      {
        path: '/api/xrpl/interface/BaseResponse',
        component: ComponentCreator('/api/xrpl/interface/BaseResponse', 'b08'),
        exact: true,
        sidebar: "api",
        id: 1056
      },
      {
        path: '/api/xrpl/interface/BaseTransaction',
        component: ComponentCreator('/api/xrpl/interface/BaseTransaction', '080'),
        exact: true,
        sidebar: "api",
        id: 2334
      },
      {
        path: '/api/xrpl/interface/BookOffer',
        component: ComponentCreator('/api/xrpl/interface/BookOffer', 'b28'),
        exact: true,
        sidebar: "api",
        id: 1707
      },
      {
        path: '/api/xrpl/interface/BookOfferCurrency',
        component: ComponentCreator('/api/xrpl/interface/BookOfferCurrency', '0d6'),
        exact: true,
        sidebar: "api",
        id: 1725
      },
      {
        path: '/api/xrpl/interface/BookOffersRequest',
        component: ComponentCreator('/api/xrpl/interface/BookOffersRequest', '346'),
        exact: true,
        sidebar: "api",
        id: 1697
      },
      {
        path: '/api/xrpl/interface/BookOffersResponse',
        component: ComponentCreator('/api/xrpl/interface/BookOffersResponse', '953'),
        exact: true,
        sidebar: "api",
        id: 1728
      },
      {
        path: '/api/xrpl/interface/Channel',
        component: ComponentCreator('/api/xrpl/interface/Channel', 'eb9'),
        exact: true,
        sidebar: "api",
        id: 1074
      },
      {
        path: '/api/xrpl/interface/ChannelVerifyRequest',
        component: ComponentCreator('/api/xrpl/interface/ChannelVerifyRequest', '221'),
        exact: true,
        sidebar: "api",
        id: 1847
      },
      {
        path: '/api/xrpl/interface/ChannelVerifyResponse',
        component: ComponentCreator('/api/xrpl/interface/ChannelVerifyResponse', '951'),
        exact: true,
        sidebar: "api",
        id: 1855
      },
      {
        path: '/api/xrpl/interface/CheckCancel',
        component: ComponentCreator('/api/xrpl/interface/CheckCancel', '1d4'),
        exact: true,
        sidebar: "api",
        id: 2425
      },
      {
        path: '/api/xrpl/interface/CheckCash',
        component: ComponentCreator('/api/xrpl/interface/CheckCash', '840'),
        exact: true,
        sidebar: "api",
        id: 2441
      },
      {
        path: '/api/xrpl/interface/CheckCreate',
        component: ComponentCreator('/api/xrpl/interface/CheckCreate', 'd3b'),
        exact: true,
        sidebar: "api",
        id: 2459
      },
      {
        path: '/api/xrpl/interface/ClientOptions',
        component: ComponentCreator('/api/xrpl/interface/ClientOptions', '606'),
        exact: true,
        sidebar: "api",
        id: 667
      },
      {
        path: '/api/xrpl/interface/ConsensusStream',
        component: ComponentCreator('/api/xrpl/interface/ConsensusStream', '4d8'),
        exact: true,
        sidebar: "api",
        id: 1979
      },
      {
        path: '/api/xrpl/interface/CreatedNode',
        component: ComponentCreator('/api/xrpl/interface/CreatedNode', 'b2d'),
        exact: true,
        sidebar: "api",
        id: 2950
      },
      {
        path: '/api/xrpl/interface/DeletedNode',
        component: ComponentCreator('/api/xrpl/interface/DeletedNode', 'e2e'),
        exact: true,
        sidebar: "api",
        id: 2974
      },
      {
        path: '/api/xrpl/interface/DepositAuthorizedRequest',
        component: ComponentCreator('/api/xrpl/interface/DepositAuthorizedRequest', 'b7b'),
        exact: true,
        sidebar: "api",
        id: 1743
      },
      {
        path: '/api/xrpl/interface/DepositAuthorizedResponse',
        component: ComponentCreator('/api/xrpl/interface/DepositAuthorizedResponse', 'a60'),
        exact: true,
        sidebar: "api",
        id: 1751
      },
      {
        path: '/api/xrpl/interface/DepositPreauth',
        component: ComponentCreator('/api/xrpl/interface/DepositPreauth', 'a2e'),
        exact: true,
        sidebar: "api",
        id: 2479
      },
      {
        path: '/api/xrpl/interface/EnableAmendment',
        component: ComponentCreator('/api/xrpl/interface/EnableAmendment', '59c'),
        exact: true,
        sidebar: "api",
        id: 2553
      },
      {
        path: '/api/xrpl/interface/ErrorResponse',
        component: ComponentCreator('/api/xrpl/interface/ErrorResponse', '0be'),
        exact: true,
        sidebar: "api",
        id: 2235
      },
      {
        path: '/api/xrpl/interface/EscrowCancel',
        component: ComponentCreator('/api/xrpl/interface/EscrowCancel', 'b80'),
        exact: true,
        sidebar: "api",
        id: 2496
      },
      {
        path: '/api/xrpl/interface/EscrowCreate',
        component: ComponentCreator('/api/xrpl/interface/EscrowCreate', 'cd8'),
        exact: true,
        sidebar: "api",
        id: 2513
      },
      {
        path: '/api/xrpl/interface/EscrowFinish',
        component: ComponentCreator('/api/xrpl/interface/EscrowFinish', '79a'),
        exact: true,
        sidebar: "api",
        id: 2534
      },
      {
        path: '/api/xrpl/interface/FeeRequest',
        component: ComponentCreator('/api/xrpl/interface/FeeRequest', '083'),
        exact: true,
        sidebar: "api",
        id: 2003
      },
      {
        path: '/api/xrpl/interface/FeeResponse',
        component: ComponentCreator('/api/xrpl/interface/FeeResponse', 'dc6'),
        exact: true,
        sidebar: "api",
        id: 2007
      },
      {
        path: '/api/xrpl/interface/GatewayBalance',
        component: ComponentCreator('/api/xrpl/interface/GatewayBalance', 'aff'),
        exact: true,
        sidebar: "api",
        id: 1364
      },
      {
        path: '/api/xrpl/interface/GatewayBalancesRequest',
        component: ComponentCreator('/api/xrpl/interface/GatewayBalancesRequest', '37a'),
        exact: true,
        sidebar: "api",
        id: 1367
      },
      {
        path: '/api/xrpl/interface/GatewayBalancesResponse',
        component: ComponentCreator('/api/xrpl/interface/GatewayBalancesResponse', 'c02'),
        exact: true,
        sidebar: "api",
        id: 1376
      },
      {
        path: '/api/xrpl/interface/IssuedCurrency',
        component: ComponentCreator('/api/xrpl/interface/IssuedCurrency', '221'),
        exact: true,
        sidebar: "api",
        id: 2993
      },
      {
        path: '/api/xrpl/interface/IssuedCurrencyAmount',
        component: ComponentCreator('/api/xrpl/interface/IssuedCurrencyAmount', '4bb'),
        exact: true,
        sidebar: "api",
        id: 2997
      },
      {
        path: '/api/xrpl/interface/JobType',
        component: ComponentCreator('/api/xrpl/interface/JobType', 'aee'),
        exact: true,
        sidebar: "api",
        id: 2193
      },
      {
        path: '/api/xrpl/interface/LedgerBinary',
        component: ComponentCreator('/api/xrpl/interface/LedgerBinary', 'cec'),
        exact: true,
        sidebar: "api",
        id: 1465
      },
      {
        path: '/api/xrpl/interface/LedgerClosedRequest',
        component: ComponentCreator('/api/xrpl/interface/LedgerClosedRequest', '8a1'),
        exact: true,
        sidebar: "api",
        id: 1485
      },
      {
        path: '/api/xrpl/interface/LedgerClosedResponse',
        component: ComponentCreator('/api/xrpl/interface/LedgerClosedResponse', '395'),
        exact: true,
        sidebar: "api",
        id: 1489
      },
      {
        path: '/api/xrpl/interface/LedgerCurrentRequest',
        component: ComponentCreator('/api/xrpl/interface/LedgerCurrentRequest', '9c6'),
        exact: true,
        sidebar: "api",
        id: 1501
      },
      {
        path: '/api/xrpl/interface/LedgerCurrentResponse',
        component: ComponentCreator('/api/xrpl/interface/LedgerCurrentResponse', 'c80'),
        exact: true,
        sidebar: "api",
        id: 1505
      },
      {
        path: '/api/xrpl/interface/LedgerDataBinaryLedgerEntry',
        component: ComponentCreator('/api/xrpl/interface/LedgerDataBinaryLedgerEntry', 'f3a'),
        exact: true,
        sidebar: "api",
        id: 1528
      },
      {
        path: '/api/xrpl/interface/LedgerDataRequest',
        component: ComponentCreator('/api/xrpl/interface/LedgerDataRequest', '201'),
        exact: true,
        sidebar: "api",
        id: 1516
      },
      {
        path: '/api/xrpl/interface/LedgerDataResponse',
        component: ComponentCreator('/api/xrpl/interface/LedgerDataResponse', '969'),
        exact: true,
        sidebar: "api",
        id: 1530
      },
      {
        path: '/api/xrpl/interface/LedgerEntryRequest',
        component: ComponentCreator('/api/xrpl/interface/LedgerEntryRequest', 'b5c'),
        exact: true,
        sidebar: "api",
        id: 1548
      },
      {
        path: '/api/xrpl/interface/LedgerEntryResponse',
        component: ComponentCreator('/api/xrpl/interface/LedgerEntryResponse', '6d1'),
        exact: true,
        sidebar: "api",
        id: 1585
      },
      {
        path: '/api/xrpl/interface/LedgerModifiedOfferCreateTransaction',
        component: ComponentCreator('/api/xrpl/interface/LedgerModifiedOfferCreateTransaction', 'b37'),
        exact: true,
        sidebar: "api",
        id: 1480
      },
      {
        path: '/api/xrpl/interface/LedgerQueueData',
        component: ComponentCreator('/api/xrpl/interface/LedgerQueueData', 'b6c'),
        exact: true,
        sidebar: "api",
        id: 1453
      },
      {
        path: '/api/xrpl/interface/LedgerRequest',
        component: ComponentCreator('/api/xrpl/interface/LedgerRequest', '1b8'),
        exact: true,
        sidebar: "api",
        id: 1425
      },
      {
        path: '/api/xrpl/interface/LedgerResponse',
        component: ComponentCreator('/api/xrpl/interface/LedgerResponse', 'bb5'),
        exact: true,
        sidebar: "api",
        id: 1438
      },
      {
        path: '/api/xrpl/interface/LedgerStream',
        component: ComponentCreator('/api/xrpl/interface/LedgerStream', '386'),
        exact: true,
        sidebar: "api",
        id: 1894
      },
      {
        path: '/api/xrpl/interface/LedgerStreamResponse',
        component: ComponentCreator('/api/xrpl/interface/LedgerStreamResponse', '8af'),
        exact: true,
        sidebar: "api",
        id: 1905
      },
      {
        path: '/api/xrpl/interface/ManifestRequest',
        component: ComponentCreator('/api/xrpl/interface/ManifestRequest', 'd17'),
        exact: true,
        sidebar: "api",
        id: 2034
      },
      {
        path: '/api/xrpl/interface/ManifestResponse',
        component: ComponentCreator('/api/xrpl/interface/ManifestResponse', '989'),
        exact: true,
        sidebar: "api",
        id: 2039
      },
      {
        path: '/api/xrpl/interface/Memo',
        component: ComponentCreator('/api/xrpl/interface/Memo', '866'),
        exact: true,
        sidebar: "api",
        id: 3008
      },
      {
        path: '/api/xrpl/interface/ModifiedNode',
        component: ComponentCreator('/api/xrpl/interface/ModifiedNode', 'e03'),
        exact: true,
        sidebar: "api",
        id: 2959
      },
      {
        path: '/api/xrpl/interface/NFTBuyOffersRequest',
        component: ComponentCreator('/api/xrpl/interface/NFTBuyOffersRequest', '766'),
        exact: true,
        sidebar: "api",
        id: 2244
      },
      {
        path: '/api/xrpl/interface/NFTBuyOffersResponse',
        component: ComponentCreator('/api/xrpl/interface/NFTBuyOffersResponse', '3c6'),
        exact: true,
        sidebar: "api",
        id: 2251
      },
      {
        path: '/api/xrpl/interface/NFTHistoryRequest',
        component: ComponentCreator('/api/xrpl/interface/NFTHistoryRequest', '68b'),
        exact: true,
        sidebar: "api",
        id: 2298
      },
      {
        path: '/api/xrpl/interface/NFTHistoryResponse',
        component: ComponentCreator('/api/xrpl/interface/NFTHistoryResponse', 'a88'),
        exact: true,
        sidebar: "api",
        id: 2311
      },
      {
        path: '/api/xrpl/interface/NFTHistoryTransaction',
        component: ComponentCreator('/api/xrpl/interface/NFTHistoryTransaction', 'c49'),
        exact: true,
        sidebar: "api",
        id: 2328
      },
      {
        path: '/api/xrpl/interface/NFTInfoRequest',
        component: ComponentCreator('/api/xrpl/interface/NFTInfoRequest', '5f9'),
        exact: true,
        sidebar: "api",
        id: 2282
      },
      {
        path: '/api/xrpl/interface/NFTInfoResponse',
        component: ComponentCreator('/api/xrpl/interface/NFTInfoResponse', 'a43'),
        exact: true,
        sidebar: "api",
        id: 2289
      },
      {
        path: '/api/xrpl/interface/NFTOffer',
        component: ComponentCreator('/api/xrpl/interface/NFTOffer', '43c'),
        exact: true,
        sidebar: "api",
        id: 3031
      },
      {
        path: '/api/xrpl/interface/NFToken',
        component: ComponentCreator('/api/xrpl/interface/NFToken', '4f9'),
        exact: true,
        sidebar: "api",
        id: 3038
      },
      {
        path: '/api/xrpl/interface/NFTokenAcceptOffer',
        component: ComponentCreator('/api/xrpl/interface/NFTokenAcceptOffer', '046'),
        exact: true,
        sidebar: "api",
        id: 2573
      },
      {
        path: '/api/xrpl/interface/NFTokenBurn',
        component: ComponentCreator('/api/xrpl/interface/NFTokenBurn', '74c'),
        exact: true,
        sidebar: "api",
        id: 2591
      },
      {
        path: '/api/xrpl/interface/NFTokenCancelOffer',
        component: ComponentCreator('/api/xrpl/interface/NFTokenCancelOffer', '368'),
        exact: true,
        sidebar: "api",
        id: 2608
      },
      {
        path: '/api/xrpl/interface/NFTokenCreateOffer',
        component: ComponentCreator('/api/xrpl/interface/NFTokenCreateOffer', 'c08'),
        exact: true,
        sidebar: "api",
        id: 2624
      },
      {
        path: '/api/xrpl/interface/NFTokenCreateOfferFlagsInterface',
        component: ComponentCreator('/api/xrpl/interface/NFTokenCreateOfferFlagsInterface', 'a6a'),
        exact: true,
        sidebar: "api",
        id: 2646
      },
      {
        path: '/api/xrpl/interface/NFTokenMint',
        component: ComponentCreator('/api/xrpl/interface/NFTokenMint', '0b6'),
        exact: true,
        sidebar: "api",
        id: 2648
      },
      {
        path: '/api/xrpl/interface/NFTokenMintFlagsInterface',
        component: ComponentCreator('/api/xrpl/interface/NFTokenMintFlagsInterface', 'ed0'),
        exact: true,
        sidebar: "api",
        id: 2672
      },
      {
        path: '/api/xrpl/interface/NFTSellOffersRequest',
        component: ComponentCreator('/api/xrpl/interface/NFTSellOffersRequest', 'ea7'),
        exact: true,
        sidebar: "api",
        id: 2263
      },
      {
        path: '/api/xrpl/interface/NFTSellOffersResponse',
        component: ComponentCreator('/api/xrpl/interface/NFTSellOffersResponse', '3ad'),
        exact: true,
        sidebar: "api",
        id: 2270
      },
      {
        path: '/api/xrpl/interface/NoRippleCheckRequest',
        component: ComponentCreator('/api/xrpl/interface/NoRippleCheckRequest', '57f'),
        exact: true,
        sidebar: "api",
        id: 1402
      },
      {
        path: '/api/xrpl/interface/NoRippleCheckResponse',
        component: ComponentCreator('/api/xrpl/interface/NoRippleCheckResponse', 'ef9'),
        exact: true,
        sidebar: "api",
        id: 1412
      },
      {
        path: '/api/xrpl/interface/OfferCancel',
        component: ComponentCreator('/api/xrpl/interface/OfferCancel', 'd08'),
        exact: true,
        sidebar: "api",
        id: 2677
      },
      {
        path: '/api/xrpl/interface/OfferCreate',
        component: ComponentCreator('/api/xrpl/interface/OfferCreate', '798'),
        exact: true,
        sidebar: "api",
        id: 2703
      },
      {
        path: '/api/xrpl/interface/OfferCreateFlagsInterface',
        component: ComponentCreator('/api/xrpl/interface/OfferCreateFlagsInterface', 'fb2'),
        exact: true,
        sidebar: "api",
        id: 2698
      },
      {
        path: '/api/xrpl/interface/OrderBookStream',
        component: ComponentCreator('/api/xrpl/interface/OrderBookStream', 'ec3'),
        exact: true,
        sidebar: "api",
        id: 1967
      },
      {
        path: '/api/xrpl/interface/PathFindCloseRequest',
        component: ComponentCreator('/api/xrpl/interface/PathFindCloseRequest', '3a8'),
        exact: true,
        sidebar: "api",
        id: 1779
      },
      {
        path: '/api/xrpl/interface/PathFindCreateRequest',
        component: ComponentCreator('/api/xrpl/interface/PathFindCreateRequest', '451'),
        exact: true,
        sidebar: "api",
        id: 1769
      },
      {
        path: '/api/xrpl/interface/PathFindPathOption',
        component: ComponentCreator('/api/xrpl/interface/PathFindPathOption', 'e60'),
        exact: true,
        sidebar: "api",
        id: 1784
      },
      {
        path: '/api/xrpl/interface/PathFindResponse',
        component: ComponentCreator('/api/xrpl/interface/PathFindResponse', 'f48'),
        exact: true,
        sidebar: "api",
        id: 1793
      },
      {
        path: '/api/xrpl/interface/PathFindStatusRequest',
        component: ComponentCreator('/api/xrpl/interface/PathFindStatusRequest', '17e'),
        exact: true,
        sidebar: "api",
        id: 1788
      },
      {
        path: '/api/xrpl/interface/PathFindStream',
        component: ComponentCreator('/api/xrpl/interface/PathFindStream', 'bee'),
        exact: true,
        sidebar: "api",
        id: 1947
      },
      {
        path: '/api/xrpl/interface/PathStep',
        component: ComponentCreator('/api/xrpl/interface/PathStep', 'aaa'),
        exact: true,
        sidebar: "api",
        id: 3015
      },
      {
        path: '/api/xrpl/interface/Payment',
        component: ComponentCreator('/api/xrpl/interface/Payment', '081'),
        exact: true,
        sidebar: "api",
        id: 2730
      },
      {
        path: '/api/xrpl/interface/PaymentChannelClaim',
        component: ComponentCreator('/api/xrpl/interface/PaymentChannelClaim', '00b'),
        exact: true,
        sidebar: "api",
        id: 2758
      },
      {
        path: '/api/xrpl/interface/PaymentChannelClaimFlagsInterface',
        component: ComponentCreator('/api/xrpl/interface/PaymentChannelClaimFlagsInterface', 'c7d'),
        exact: true,
        sidebar: "api",
        id: 2755
      },
      {
        path: '/api/xrpl/interface/PaymentChannelCreate',
        component: ComponentCreator('/api/xrpl/interface/PaymentChannelCreate', '332'),
        exact: true,
        sidebar: "api",
        id: 2778
      },
      {
        path: '/api/xrpl/interface/PaymentChannelFund',
        component: ComponentCreator('/api/xrpl/interface/PaymentChannelFund', 'e09'),
        exact: true,
        sidebar: "api",
        id: 2799
      },
      {
        path: '/api/xrpl/interface/PaymentFlagsInterface',
        component: ComponentCreator('/api/xrpl/interface/PaymentFlagsInterface', 'bfc'),
        exact: true,
        sidebar: "api",
        id: 2726
      },
      {
        path: '/api/xrpl/interface/PeerStatusStream',
        component: ComponentCreator('/api/xrpl/interface/PeerStatusStream', '4f7'),
        exact: true,
        sidebar: "api",
        id: 1959
      },
      {
        path: '/api/xrpl/interface/PingRequest',
        component: ComponentCreator('/api/xrpl/interface/PingRequest', '588'),
        exact: true,
        sidebar: "api",
        id: 2204
      },
      {
        path: '/api/xrpl/interface/PingResponse',
        component: ComponentCreator('/api/xrpl/interface/PingResponse', 'e4a'),
        exact: true,
        sidebar: "api",
        id: 2208
      },
      {
        path: '/api/xrpl/interface/RandomRequest',
        component: ComponentCreator('/api/xrpl/interface/RandomRequest', '185'),
        exact: true,
        sidebar: "api",
        id: 2220
      },
      {
        path: '/api/xrpl/interface/RandomResponse',
        component: ComponentCreator('/api/xrpl/interface/RandomResponse', '4ac'),
        exact: true,
        sidebar: "api",
        id: 2224
      },
      {
        path: '/api/xrpl/interface/ResponseOnlyTxInfo',
        component: ComponentCreator('/api/xrpl/interface/ResponseOnlyTxInfo', '52e'),
        exact: true,
        sidebar: "api",
        id: 3026
      },
      {
        path: '/api/xrpl/interface/ResponseWarning',
        component: ComponentCreator('/api/xrpl/interface/ResponseWarning', 'af0'),
        exact: true,
        sidebar: "api",
        id: 1067
      },
      {
        path: '/api/xrpl/interface/RipplePathFindPathOption',
        component: ComponentCreator('/api/xrpl/interface/RipplePathFindPathOption', '67d'),
        exact: true,
        sidebar: "api",
        id: 1811
      },
      {
        path: '/api/xrpl/interface/RipplePathFindRequest',
        component: ComponentCreator('/api/xrpl/interface/RipplePathFindRequest', '501'),
        exact: true,
        sidebar: "api",
        id: 1814
      },
      {
        path: '/api/xrpl/interface/RipplePathFindResponse',
        component: ComponentCreator('/api/xrpl/interface/RipplePathFindResponse', 'd4a'),
        exact: true,
        sidebar: "api",
        id: 1825
      },
      {
        path: '/api/xrpl/interface/ServerInfoRequest',
        component: ComponentCreator('/api/xrpl/interface/ServerInfoRequest', '430'),
        exact: true,
        sidebar: "api",
        id: 2057
      },
      {
        path: '/api/xrpl/interface/ServerInfoResponse',
        component: ComponentCreator('/api/xrpl/interface/ServerInfoResponse', '991'),
        exact: true,
        sidebar: "api",
        id: 2061
      },
      {
        path: '/api/xrpl/interface/ServerStateRequest',
        component: ComponentCreator('/api/xrpl/interface/ServerStateRequest', '50d'),
        exact: true,
        sidebar: "api",
        id: 2129
      },
      {
        path: '/api/xrpl/interface/ServerStateResponse',
        component: ComponentCreator('/api/xrpl/interface/ServerStateResponse', 'e2f'),
        exact: true,
        sidebar: "api",
        id: 2133
      },
      {
        path: '/api/xrpl/interface/SetFeePostAmendment',
        component: ComponentCreator('/api/xrpl/interface/SetFeePostAmendment', '73e'),
        exact: true,
        sidebar: "api",
        id: 2839
      },
      {
        path: '/api/xrpl/interface/SetFeePreAmendment',
        component: ComponentCreator('/api/xrpl/interface/SetFeePreAmendment', '9e5'),
        exact: true,
        sidebar: "api",
        id: 2820
      },
      {
        path: '/api/xrpl/interface/SetRegularKey',
        component: ComponentCreator('/api/xrpl/interface/SetRegularKey', 'ade'),
        exact: true,
        sidebar: "api",
        id: 2857
      },
      {
        path: '/api/xrpl/interface/Signer',
        component: ComponentCreator('/api/xrpl/interface/Signer', '06f'),
        exact: true,
        sidebar: "api",
        id: 3002
      },
      {
        path: '/api/xrpl/interface/SignerEntry',
        component: ComponentCreator('/api/xrpl/interface/SignerEntry', '986'),
        exact: true,
        sidebar: "api",
        id: 3020
      },
      {
        path: '/api/xrpl/interface/SignerListSet',
        component: ComponentCreator('/api/xrpl/interface/SignerListSet', '754'),
        exact: true,
        sidebar: "api",
        id: 2873
      },
      {
        path: '/api/xrpl/interface/SourceCurrencyAmount',
        component: ComponentCreator('/api/xrpl/interface/SourceCurrencyAmount', '5e8'),
        exact: true,
        sidebar: "api",
        id: 1844
      },
      {
        path: '/api/xrpl/interface/StateAccounting',
        component: ComponentCreator('/api/xrpl/interface/StateAccounting', '1a2'),
        exact: true,
        sidebar: "api",
        id: 2201
      },
      {
        path: '/api/xrpl/interface/SubmitMultisignedRequest',
        component: ComponentCreator('/api/xrpl/interface/SubmitMultisignedRequest', 'a52'),
        exact: true,
        sidebar: "api",
        id: 1630
      },
      {
        path: '/api/xrpl/interface/SubmitMultisignedResponse',
        component: ComponentCreator('/api/xrpl/interface/SubmitMultisignedResponse', '117'),
        exact: true,
        sidebar: "api",
        id: 1636
      },
      {
        path: '/api/xrpl/interface/SubmitRequest',
        component: ComponentCreator('/api/xrpl/interface/SubmitRequest', '380'),
        exact: true,
        sidebar: "api",
        id: 1600
      },
      {
        path: '/api/xrpl/interface/SubmitResponse',
        component: ComponentCreator('/api/xrpl/interface/SubmitResponse', '375'),
        exact: true,
        sidebar: "api",
        id: 1606
      },
      {
        path: '/api/xrpl/interface/SubscribeBook',
        component: ComponentCreator('/api/xrpl/interface/SubscribeBook', '98f'),
        exact: true,
        sidebar: "api",
        id: 1886
      },
      {
        path: '/api/xrpl/interface/SubscribeRequest',
        component: ComponentCreator('/api/xrpl/interface/SubscribeRequest', '97c'),
        exact: true,
        sidebar: "api",
        id: 1866
      },
      {
        path: '/api/xrpl/interface/SubscribeResponse',
        component: ComponentCreator('/api/xrpl/interface/SubscribeResponse', '38f'),
        exact: true,
        sidebar: "api",
        id: 1877
      },
      {
        path: '/api/xrpl/interface/TicketCreate',
        component: ComponentCreator('/api/xrpl/interface/TicketCreate', '8c3'),
        exact: true,
        sidebar: "api",
        id: 2890
      },
      {
        path: '/api/xrpl/interface/TransactionAndMetadata',
        component: ComponentCreator('/api/xrpl/interface/TransactionAndMetadata', '2fc'),
        exact: true,
        sidebar: "api",
        id: 2352
      },
      {
        path: '/api/xrpl/interface/TransactionEntryRequest',
        component: ComponentCreator('/api/xrpl/interface/TransactionEntryRequest', '862'),
        exact: true,
        sidebar: "api",
        id: 1651
      },
      {
        path: '/api/xrpl/interface/TransactionEntryResponse',
        component: ComponentCreator('/api/xrpl/interface/TransactionEntryResponse', '584'),
        exact: true,
        sidebar: "api",
        id: 1658
      },
      {
        path: '/api/xrpl/interface/TransactionMetadata',
        component: ComponentCreator('/api/xrpl/interface/TransactionMetadata', 'fbc'),
        exact: true,
        sidebar: "api",
        id: 2984
      },
      {
        path: '/api/xrpl/interface/TransactionStream',
        component: ComponentCreator('/api/xrpl/interface/TransactionStream', '5a8'),
        exact: true,
        sidebar: "api",
        id: 1931
      },
      {
        path: '/api/xrpl/interface/TrustSet',
        component: ComponentCreator('/api/xrpl/interface/TrustSet', 'c82'),
        exact: true,
        sidebar: "api",
        id: 2918
      },
      {
        path: '/api/xrpl/interface/TrustSetFlagsInterface',
        component: ComponentCreator('/api/xrpl/interface/TrustSetFlagsInterface', '412'),
        exact: true,
        sidebar: "api",
        id: 2906
      },
      {
        path: '/api/xrpl/interface/TxRequest',
        component: ComponentCreator('/api/xrpl/interface/TxRequest', 'ceb'),
        exact: true,
        sidebar: "api",
        id: 1672
      },
      {
        path: '/api/xrpl/interface/TxResponse',
        component: ComponentCreator('/api/xrpl/interface/TxResponse', 'e5f'),
        exact: true,
        sidebar: "api",
        id: 1680
      },
      {
        path: '/api/xrpl/interface/UNLModify',
        component: ComponentCreator('/api/xrpl/interface/UNLModify', '964'),
        exact: true,
        sidebar: "api",
        id: 2936
      },
      {
        path: '/api/xrpl/interface/UnsubscribeBook',
        component: ComponentCreator('/api/xrpl/interface/UnsubscribeBook', 'b68'),
        exact: true,
        sidebar: "api",
        id: 1999
      },
      {
        path: '/api/xrpl/interface/UnsubscribeRequest',
        component: ComponentCreator('/api/xrpl/interface/UnsubscribeRequest', '6b4'),
        exact: true,
        sidebar: "api",
        id: 1982
      },
      {
        path: '/api/xrpl/interface/UnsubscribeResponse',
        component: ComponentCreator('/api/xrpl/interface/UnsubscribeResponse', '3f4'),
        exact: true,
        sidebar: "api",
        id: 1990
      },
      {
        path: '/api/xrpl/interface/ValidationStream',
        component: ComponentCreator('/api/xrpl/interface/ValidationStream', '57d'),
        exact: true,
        sidebar: "api",
        id: 1914
      },
      {
        path: '/api/xrpl/interface/XRP',
        component: ComponentCreator('/api/xrpl/interface/XRP', '06c'),
        exact: true,
        sidebar: "api",
        id: 2991
      },
      {
        path: '/api/xrpl/namespace/LedgerEntry',
        component: ComponentCreator('/api/xrpl/namespace/LedgerEntry', '7d4'),
        exact: true,
        sidebar: "api",
        id: 775
      }
    ]
  },
  {
    path: '/docs',
    component: ComponentCreator('/docs', '993'),
    routes: [
      {
        path: '/docs/category/unique-setup-steps-for-xrpljs',
        component: ComponentCreator('/docs/category/unique-setup-steps-for-xrpljs', '85a'),
        exact: true,
        sidebar: "tutorialSidebar"
      },
      {
        path: '/docs/intro',
        component: ComponentCreator('/docs/intro', 'aed'),
        exact: true,
        sidebar: "tutorialSidebar"
      },
      {
        path: '/docs/setup/CDN',
        component: ComponentCreator('/docs/setup/CDN', '59c'),
        exact: true,
        sidebar: "tutorialSidebar"
      },
      {
        path: '/docs/setup/create-react-app',
        component: ComponentCreator('/docs/setup/create-react-app', '299'),
        exact: true,
        sidebar: "tutorialSidebar"
      },
      {
        path: '/docs/setup/react-native',
        component: ComponentCreator('/docs/setup/react-native', '3d1'),
        exact: true,
        sidebar: "tutorialSidebar"
      },
      {
        path: '/docs/setup/vite-react',
        component: ComponentCreator('/docs/setup/vite-react', 'e8b'),
        exact: true,
        sidebar: "tutorialSidebar"
      }
    ]
  },
  {
    path: '/',
    component: ComponentCreator('/', '152'),
    exact: true
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];
