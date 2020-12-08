'use strict';
const axios = require('axios')

let WALLET = undefined
let COUNTERPARTY_WALLET = undefined

const generateWallet = async () => {
   await axios.post("https://faucet.altnet.rippletest.net/accounts")
       .then(res => {
        WALLET = res.data.account
       })
}


const generateWallet2 = async () => {
  await axios.post("https://faucet.altnet.rippletest.net/accounts")
      .then(res => {
        COUNTERPARTY_WALLET = res.data.account
      })
}

async function getAddress() {
  if(WALLET === undefined)
    await generateWallet()
  
  return WALLET.classicAddress
}

async function getSecret() {
  if (WALLET === undefined)
    await generateWallet()

  return WALLET.secret
}

async function getCounterparty() {
  if(COUNTERPARTY_WALLET === undefined)
    await generateWallet2()
  
  return COUNTERPARTY_WALLET.classicAddress
}

async function getCounterpartySecret() {
  if (WALLET2 === undefined)
    await generateWallet2()

  return WALLET2.secret
}


module.exports = {
  getAddress: getAddress,
  getSecret: getSecret,
  getCounterparty: getCounterparty,
  getCounterpartySecret: getCounterpartySecret,
};
