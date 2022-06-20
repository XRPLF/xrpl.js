# Applications using xrpl.js

A curated list of some of the projects and apps that leverage `xrpl.js` in some way.

**Have one to add?** Please edit this file and open a PR!

## Notice (disclaimer)

These sites are independent of Ripple and have not been authorized, endorsed, sponsored or otherwise approved by Ripple or its affiliates.

Warning: Use at your own risk.

## Exchanges

- **[The World Exchange](https://www.theworldexchange.net/)**

  Trade, issue, and send directly on the XRP Ledger. A user interface for the XRPL's decentralized exchange.

- **[Bitso](https://bitso.com/)**

  Exchange allowing clients to buy and sell XRP, based in Mexico.

## Explorers

- **[xrpintel - XRP Intelligence](https://xrpintel.com/)**

  Monitor the XRP Network in real time and explore historical statistics.

- **[XRP Charts](https://xrpcharts.ripple.com/)** (xrpcharts.ripple.com)

  XRP Charts provides information based on public data, including trade volume, top markets, metrics, transactions, and more.

- **[Ripple Live](https://gatehub.net/live)** (gatehub.net/live)

  Visualize XRP network transactions.

- **[XRPL Dev. Dashboard](https://xrp.fans/)** (xrp.fans)

  Debugging dashboard for `rippled-ws-client-pool`, transaction and query explorer, and transaction signing and submission tool.

- **[XRP Value](http://xrpvalue.com/)**

  Real-time XRP price, trades, and orderbook data from the XRP Ledger.

- **[Bithomp - XRP Explorer](https://bithomp.com/explorer/)**

  Look up information by entering an address, transaction hash, username, or PayID.

- **[Bithomp - XRPL validators](https://bithomp.com/validators)**

  List of XRPL validators, nodes, and testnet validators.

- **[XRP Scan - XRP Ledger explorer](https://xrpscan.com)**

  XRP Ledger explorer, metrics and analytics.

- **[xrplorer](https://xrplorer.com)**

  XRP Ledger explorer, API, metrics, and analytics using a graph database that is synchronized live with the XRPL.

## Data monitoring

- **[zerptracker](https://zerptracker.com)**

  Monitor the XRPL using powerful JSONPath expressions, and receive notifications via email, SMS, webhooks, and more.

- **[Utility-Scan](https://utility-scan.com)**

  Attempts to detect RippleNet on-demand liquidity (ODL) transactions through known fiat corridors and report these transactions in real time.

- **[XRPL Rosetta](https://threexrp.dev/)**

  3D Globe written in three.js connected to a Node.js websocket server that is listening to exchanges and the XRPL. The visualization aims to show trading, ODL, and liquidity at exchanges, intra-exchange volume, and flows.

## Wallets and wallet tools

- **[XUMM](https://xumm.app/)**

  Users can use the xumm application to track their accounts, balances and transactions. The true power of xumm is the platform available for developers.

- **[Xpring Wallet](https://xpring.io)** (uses `ripple-keypairs`)

  Non-custodial XRP wallet.

- **[XRP Toolkit](https://www.xrptoolkit.com)**

  A web interface to the XRP Ledger, supporting both hardware and software wallets.

- **[Toast Wallet](https://toastwallet.com/)**

  A free, open source XRP Wallet for iOS, Android, Windows, Mac and Linux.

- **[Toastify Ledger](https://github.com/WietseWind/toastify-ledger)** (uses `ripple-keypairs`)

  Add a Regular Key to a mnemonic XRP Wallet (e.g. Ledger Nano S) to use the account with a Family Seed (secret).

- **[Bithomp-submit](https://github.com/Bithomp/bithomp-submit)** (GitHub)

  A tool to submit an offline-signed XRPL transaction.

- **[Kyte](https://kyteapp.co/)** (kyteapp.co) ([Source](https://github.com/WietseWind/Zerp-Wallet)) (Deprecated)

  Web-based XRP wallet.

- **[XRP Vanity Address Generator](https://github.com/WietseWind/xrp-vanity-generator)** (Node.js)

  A vanity address is a wallet address containing a few characters you like at the beginning or the end of the wallet address.

- **[XRP Account Mnemonic Recovery](https://github.com/WietseWind/xrp-mnemonic-recovery)** (uses `ripple-keypairs`)

  Recover a 24 word mnemonic if one word is wrong or one word is missing.
  
- **[Trustline](https://trustline.co)**

  A decentralized stablecoin wallet that runs on the XRP Ledger.

## Send and request payments

- **[XRP Tip Bot](https://www.xrptipbot.com/)**

  A bot that enables users on reddit, Twitter and Discord to send XRP to each other through reddit comments and Twitter tweets.

- **[XRP Text](https://xrptext.com/)**

  Send XRP using SMS text messages.

- **[XRParrot](https://xrparrot.com/)** (uses `ripple-address-codec`)

  Easy EUR (SEPA) to XRP transfer (currency conversion).

- **[XRP Payment](https://xrpayments.co/)** (xrpayments.co)

  Tool for generating a XRP payment request URI in a QR code, with currency converter.

## Development tools

- **[XRP Faucets for Testnet and Devnet](https://xrpl.org/xrp-testnet-faucet.html)**

  Get some test funds for development on the test network. The faucet uses `xrpl.js`.

## Code samples and libraries

- **[ilp-plugin-xrp-paychan](https://github.com/interledgerjs/ilp-plugin-xrp-paychan)**

  Send ILP payments using XRP and payment channels (PayChan).

- **[RunKit: WietseWind](https://runkit.com/wietsewind/)**

  XRP Ledger code samples for Node.js.

- **[GitHub Gist: WietseWind](https://gist.github.com/WietseWind)**

  XRP Ledger code samples for Node.js and the web (mostly).

- **[rippled-ws-client-sign](https://github.com/WietseWind/rippled-ws-client-sign)**

  Sign transactions, with support for MultiSign.

- **[ILP-enabled power switch](https://xrpcommunity.blog/raspberry-pi-interledger-xp-powerswitch-howto/)** ([video](https://www.youtube.com/watch?v=c-eS0HQUuJg)) (uses [`moneyd-uplink-xrp`](https://github.com/interledgerjs/moneyd-uplink-xrp))

  For about $30 in parts (Raspberry Pi, 3.3V Relay board and a few wires) you can build your own power switch that will switch on if a streaming ILP payment comes in. When the payment stream stops, the power turns off.

## Related apps that do not appear to use xrpl.js

- **[XRP Stats](https://ledger.exposed/)** (ledger.exposed)

  Rich list, live ledger stats and XRP distribution. Visualize escrows and flow of funds.
