// TOKEN_POLICY_BATCHED_EXECUTION: shared analysis-core batch.
const FNV_OFFSET = BigInt("0xcbf29ce484222325");
const FNV_PRIME = BigInt("0x100000001b3");
const MASK_64 = BigInt("0xffffffffffffffff");

export function stableDigest(value: string): string {
  let hash = FNV_OFFSET;
  for (const byte of new TextEncoder().encode(value)) {
    hash ^= BigInt(byte);
    hash = (hash * FNV_PRIME) & MASK_64;
  }
  return `fnv1a64:${hash.toString(16).padStart(16, "0")}`;
}
