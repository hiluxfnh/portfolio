/**
 * Sealtrace core logic — pure, dependency-free functions for hashing and
 * manifest/merkle construction. No DOM access, so this module loads
 * identically in the browser (as a <script type="module">) and in Node
 * (for the test suite in test/sealtrace.core.test.mjs).
 */

const subtle = (globalThis.crypto && globalThis.crypto.subtle) || null;

/** SHA-256 of raw bytes, returned as lowercase hex. */
export async function sha256Hex(bytes) {
  if (!subtle) throw new Error("Web Crypto (crypto.subtle) is not available in this environment.");
  const digest = await subtle.digest("SHA-256", bytes);
  return bufToHex(digest);
}

export function bufToHex(buf) {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function hexToBytes(hex) {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out;
}

/**
 * Binary Merkle root over a list of hex-encoded leaf hashes.
 * Odd node at any level is duplicated (Bitcoin-style) so the tree is
 * always well-formed. Order-sensitive by design: the root changes if the
 * items are reordered, which is what lets a capsule prove a *sequence*
 * of screenshots (e.g. a conversation) hasn't been reshuffled.
 */
export async function merkleRoot(leafHexHashes) {
  if (!leafHexHashes || leafHexHashes.length === 0) return null;
  let level = leafHexHashes.slice();
  while (level.length > 1) {
    const next = [];
    for (let i = 0; i < level.length; i += 2) {
      const left = level[i];
      const right = i + 1 < level.length ? level[i + 1] : level[i];
      const combined = hexToBytes(left + right);
      next.push(await sha256Hex(combined));
    }
    level = next;
  }
  return level[0];
}

/**
 * Simple 64-bit average hash (aHash) over an already-grayscaled 8x8
 * pixel sample. Takes a Uint8ClampedArray/array of 64 grayscale values
 * (0-255) and returns a 16-char hex string. Used to flag "this looks
 * like the same picture" even when re-encoding changed every byte, so
 * a sha256 mismatch alone can't be used to claim an image was faked.
 */
export function averageHash64(grayValues) {
  if (grayValues.length !== 64) throw new Error("averageHash64 expects exactly 64 grayscale samples.");
  const mean = grayValues.reduce((a, b) => a + b, 0) / 64;
  let bits = "";
  for (const v of grayValues) bits += v >= mean ? "1" : "0";
  let hex = "";
  for (let i = 0; i < 64; i += 4) {
    hex += parseInt(bits.substr(i, 4), 2).toString(16);
  }
  return hex;
}

/** Hamming distance between two same-length hex strings, in bits. */
export function hexHammingDistance(hexA, hexB) {
  if (hexA.length !== hexB.length) throw new Error("hexHammingDistance requires equal-length hex strings.");
  let dist = 0;
  for (let i = 0; i < hexA.length; i++) {
    let x = parseInt(hexA[i], 16) ^ parseInt(hexB[i], 16);
    while (x) {
      dist += x & 1;
      x >>= 1;
    }
  }
  return dist;
}

export const TOOL_NAME = "Sealtrace";
export const TOOL_VERSION = "1.0.0";
export const MANIFEST_VERSION = 1;

/**
 * Build the manifest object describing a set of sealed items. `items`
 * is an array of { filename, byteHashHex, pHashHex, width, height, notes,
 * redactions }. Returns the manifest plus its merkle root over byte hashes.
 */
export async function buildManifest({ items, createdAt = new Date(), caseNotes = "" }) {
  const root = await merkleRoot(items.map((it) => it.byteHashHex));
  return {
    tool: TOOL_NAME,
    toolVersion: TOOL_VERSION,
    manifestVersion: MANIFEST_VERSION,
    createdAt: createdAt.toISOString(),
    createdAtTzOffsetMinutes: -createdAt.getTimezoneOffset ? -createdAt.getTimezoneOffset() : 0,
    caseNotes,
    merkleRoot: root,
    items: items.map((it, i) => ({
      index: i,
      filename: it.filename,
      byteHash: { algo: "sha256", hex: it.byteHashHex },
      perceptualHash: it.pHashHex ? { algo: "aHash64", hex: it.pHashHex } : null,
      width: it.width ?? null,
      height: it.height ?? null,
      notes: it.notes || "",
      redactions: it.redactions || [],
    })),
  };
}

/** Plain-text "anchor statement" a user can post publicly to timestamp a manifest externally. */
export function buildAnchorStatement(manifest) {
  const lines = [
    `${TOOL_NAME} evidence seal — ${manifest.createdAt}`,
    `Merkle root (sha256): ${manifest.merkleRoot}`,
    `Items (${manifest.items.length}): ${manifest.items.map((it) => it.byteHash.hex.slice(0, 12) + "…").join(", ")}`,
    `Generated with Sealtrace — post this text somewhere you don't control (a public reply, commit, or message to yourself) before sharing the capsule, so the timestamp is anchored outside your own device.`,
  ];
  return lines.join("\n");
}
