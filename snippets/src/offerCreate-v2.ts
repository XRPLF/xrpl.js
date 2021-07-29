const client = new WsClient({server: `wss://xrpl.ws`})
const wallet: Wallet = Wallet.walletFromSeed("sEd…")

const tx: OfferCreateTransaction = {
    account: "r…",
    taker_gets: "XRP",
    taker_pays: {...}
}

const preparedTransaction = client.autofill(tx)
const signedTransaction = sign(wallet, preparedTransaction)

const info: SubmitResponse = client.request({
    command: "submit",
    transaction: signedTransaction
})
