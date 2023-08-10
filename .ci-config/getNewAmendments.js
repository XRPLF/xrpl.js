const xrpl = require("xrpl");
const fs = require("fs");
const path = require("path");

const filePath = path.resolve(__dirname, "./rippled.cfg");
const existingConfig = fs.readFileSync(filePath, "utf-8");

const networkToEmulate = "wss://s.devnet.rippletest.net:51233/";

const amendmentsToIgnore = [
  "86E83A7D2ECE3AD5FA87AB2195AE015C950469ABF0B72EAACED318F74886AE90", // CryptoConditionsSuite is obsolete
];

async function main() {
  const client = new xrpl.Client(networkToEmulate);
  await client.connect();

  // Looks up what amendments have been enabled via their hash
  const request = {
    command: "ledger_entry",
    index: "7DB0788C020F02780A673DC74757F23823FA3014C1866E72CC4CD8B226CD6EF4",
    ledger_index: "validated",
  };
  const response = await client.request(request);

  const amendments = response.result.node.Amendments;

  const newAmendments = [];
  amendments.forEach((amendment) => {
    if (
      !existingConfig.includes(amendment) &&
      !amendmentsToIgnore.includes(amendment)
    ) {
      newAmendments.push(amendment);
    }
  });

  if (newAmendments.length > 0) {
    console.log(
      "New Amendment Hashes - Look up their names on https://xrpl.org/known-amendments.html"
    );
    newAmendments.forEach((amendment) => {
      console.log(amendment);
    });
  } else {
    console.log(
      `No new amendments to add!
Looking at network: ${networkToEmulate}.
Path to config: ${filePath}`
    );
  }

  await client.disconnect();
}

main().catch((error) => console.log(error));
