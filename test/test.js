const { Client, AccountSetAsfFlags } = require("xrpl");

// The snippet walks us through creating and finishing escrows.
async function sendTx() {
  const client = new Client("wss://amm.devnet.rippletest.net:51233/");
  await client.connect();

  const { wallet: wallet1 } = await client.fundWallet();
  const { wallet: wallet2 } = await client.fundWallet();

  const currencyAmount = {
    currency: "FOO",
    issuer: wallet1.address,
    value: "10000",
  };

  console.log(currencyAmount);

  const trustset = {
    TransactionType: "TrustSet",
    Account: wallet2.address,
    LimitAmount: currencyAmount,
  };

  const trustset_response = await client.submitAndWait(trustset, {
    wallet: wallet2,
  });

  console.log("TrustSet Response:\n", trustset_response);

  // TODO: Check what error we get without this to ensure it's debuggable after resolving "Unknown TransactionType" error
  const accountSet = {
    TransactionType: "AccountSet",
    Account: wallet1.address,
    SetFlag: AccountSetAsfFlags.asfDefaultRipple,
  };

  const accountSetResponse = await client.submitAndWait(accountSet, {
    wallet: wallet1,
  });

  console.log(accountSetResponse);

  const ammCreate = {
    TransactionType: "AMMCreate",
    Account: wallet1.address,
    Amount: "1000", // XRP
    Amount2: { ...currencyAmount, value: "1000" },
    TradingFee: 0,
  };

  const ammCreateResponse = await client.submitAndWait(ammCreate, {
    wallet: wallet1,
  });

  console.log("AMMCreate Response:\n", ammCreateResponse);

  await client.disconnect();
}

void sendTx();
