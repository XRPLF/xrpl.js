const xrpl = require("xrpl");
async function main() {
  const client = new xrpl.Client("wss://s1.ripple.com:51233");
  await client.connect();
  const pathFindrequest = {
    id: 8,
    command: "ripple_path_find",
    // "command":"path_find",
    // "subcommand": "create",
    source_account: "ra53Mf6nVXsHRZWhAhEhAiTxsbUKi7Li6E",
    source_currencies: [
      {
        currency: "5852646F67650000000000000000000000000000", // XRDOGE
        issuer: "rLqUC2eCPohYvJCEBJ77eCCqVL2uEiczjA",
      },
    ],
    destination_account: "rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq",
    destination_amount: {
      value: "0.001",
      currency: "USD",
      issuer: "rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq", // Gatehub USD
    },
  };

  let pathfind = await client.request(pathFindrequest);
  console.log(JSON.stringify(pathfind, null, 2), "pathfind");
}

main();
