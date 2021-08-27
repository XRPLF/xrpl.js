import { createMockRippled } from "./mockRippled";

const port = 34371;

function main() {
  // @ts-expect-error -- mocha.
  if (global.describe) {
    // we are running inside mocha, exiting
    return;
  }
  console.log(`starting server on port ${port}`);
  createMockRippled(port);
  console.log(`starting server on port ${String(port + 1)}`);
  createMockRippled(port + 1);
}

main();
