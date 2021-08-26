import { classicAddressToXAddress } from "ripple-address-codec";
import { deriveKeypair, deriveAddress } from "ripple-keypairs";

function deriveXAddress(options: {
  publicKey: string;
  tag: number | false;
  test: boolean;
}): string {
  const classicAddress = deriveAddress(options.publicKey);
  return classicAddressToXAddress(classicAddress, options.tag, options.test);
}

export { deriveKeypair, deriveAddress, deriveXAddress };
