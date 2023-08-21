import * as keypairs from "ripple-keypairs";
import * as utils from "../utils";

/* Types ==================================================================== */

export type Keypair = {
  publicKey: string;
  privateKey: string;
};

export type AccountData = {
  familySeed: string;
  address: string;
  keypair: Keypair;
};

/* Class ==================================================================== */

export default class Account {
  private secret: Array<string>;
  private account: AccountData = {
    familySeed: "",
    address: "",
    keypair: {
      publicKey: "",
      privateKey: "",
    },
  };

  constructor(SecretNumbers?: Array<string> | string | Buffer) {
    const asserts = (): void => {
      if (this.secret.length !== 8) {
        throw new Error("Secret must have 8 numbers");
      }
      this.secret.forEach((r) => {
        if (r.length !== 6) {
          throw new Error("Each secret number must be 6 digits");
        }
      });
    };

    const derive = (): void => {
      try {
        const entropy = utils.secretToEntropy(this.secret);
        this.account.familySeed = keypairs.generateSeed({ entropy: entropy });
        this.account.keypair = keypairs.deriveKeypair(this.account.familySeed);
        this.account.address = keypairs.deriveAddress(
          this.account.keypair.publicKey
        );
      } catch (e) {
        let message = "Unknown Error";
        if (e instanceof Error) message = e.message;
        // we'll proceed, but let's report it
        throw message;
      }
    };

    if (typeof SecretNumbers === "string") {
      this.secret = utils.parseSecretString(SecretNumbers);
    } else if (Array.isArray(SecretNumbers)) {
      this.secret = SecretNumbers;
    } else if (Buffer.isBuffer(SecretNumbers)) {
      this.secret = utils.entropyToSecret(SecretNumbers);
    } else {
      this.secret = utils.randomSecret();
    }

    asserts();
    derive();
  }

  getSecret(): Array<string> {
    return this.secret;
  }

  getSecretString(): string {
    return this.secret.join(" ");
  }

  getAddress(): string {
    return this.account.address;
  }

  getFamilySeed(): string {
    return this.account.familySeed;
  }

  getKeypair(): Keypair {
    return this.account.keypair;
  }

  toString() {
    return this.getSecretString();
  }
}
