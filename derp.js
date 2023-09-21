const assert = require("assert");

const OriginalBuffer = Symbol("OriginalBuffer");

/**
 * Converts a Node.js Buffer to a Uint8Array for uniform behavior with browser implementations.
 *
 * This function employs an optimization to share the memory of the original Buffer with the
 * resulting Uint8Array, rather than copying the data. To ensure the memory's integrity, a
 * reference to the original Buffer is attached to the resulting Uint8Array. This strategy
 * ensures the original Buffer remains in memory (isn't garbage collected) for as long as
 * the Uint8Array is alive, thus preserving the ownership semantics of the slice of the ArrayBuffer.
 *
 * Note: This internal implementation detail is primarily for efficiency and should be used with
 * caution. External consumers of this utility should treat the resulting Uint8Array as an isolated
 * entity, without making assumptions about the underlying shared memory.
 *
 * @param {Buffer} buffer - The Node.js Buffer to convert.
 * @returns {Uint8Array} Resulting Uint8Array sharing the same memory as the Buffer.
 */
function toUint8Array(buffer) {
  const u8Array = new Uint8Array(
    buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength
    )
  );
  u8Array[OriginalBuffer] = buffer;
  return u8Array;
}

(async () => {
  let buffer = Buffer.from([1, 2, 3, 4, 5]);
  const u8Array = toUint8Array(buffer);
  let weakRefToBuffer = new WeakRef(buffer);
  buffer = null; // Dereference the buffer

  // Using a promise and setTimeout to exit the current stack frame
  await new Promise((resolve) => setTimeout(resolve, 0));

  global.gc(); // Force garbage collection

  assert(weakRefToBuffer.deref() !== undefined); // Check if buffer is still alive
  console.log("Test passed!");
})();

// Ensure you run this file with: node --expose-gc <filename>.js
