import test from "node:test";
import assert from "node:assert/strict";
import {
  sha256Hex,
  merkleRoot,
  averageHash64,
  hexHammingDistance,
  buildManifest,
  buildAnchorStatement,
} from "../assets/js/sealtrace-core.mjs";

test("sha256Hex matches a known test vector", async () => {
  const bytes = new TextEncoder().encode("abc");
  const hex = await sha256Hex(bytes);
  assert.equal(hex, "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
});

test("sha256Hex is deterministic and byte-sensitive", async () => {
  const a = await sha256Hex(new TextEncoder().encode("hello"));
  const b = await sha256Hex(new TextEncoder().encode("hello"));
  const c = await sha256Hex(new TextEncoder().encode("hellO"));
  assert.equal(a, b);
  assert.notEqual(a, c);
});

test("merkleRoot of a single item equals that item's hash", async () => {
  const h = await sha256Hex(new TextEncoder().encode("solo"));
  const root = await merkleRoot([h]);
  assert.equal(root, h);
});

test("merkleRoot is order-sensitive", async () => {
  const h1 = await sha256Hex(new TextEncoder().encode("first"));
  const h2 = await sha256Hex(new TextEncoder().encode("second"));
  const rootAB = await merkleRoot([h1, h2]);
  const rootBA = await merkleRoot([h2, h1]);
  assert.notEqual(rootAB, rootBA);
});

test("merkleRoot handles odd counts via last-node duplication and is deterministic", async () => {
  const hashes = await Promise.all(
    ["a", "b", "c"].map((s) => sha256Hex(new TextEncoder().encode(s)))
  );
  const root1 = await merkleRoot(hashes);
  const root2 = await merkleRoot(hashes.slice());
  assert.equal(root1, root2);
  assert.equal(typeof root1, "string");
  assert.equal(root1.length, 64);
});

test("merkleRoot of empty list is null", async () => {
  assert.equal(await merkleRoot([]), null);
});

test("averageHash64 requires exactly 64 samples", () => {
  assert.throws(() => averageHash64(new Array(10).fill(0)));
});

test("averageHash64 is stable for a uniform image and produces 16 hex chars", () => {
  const flat = new Array(64).fill(128);
  const hex = averageHash64(flat);
  assert.equal(hex.length, 16);
  // All values equal the mean -> every bit compares >= mean -> all 1s.
  assert.equal(hex, "ffffffffffffffff");
});

test("averageHash64 distinguishes a half-bright/half-dark image", () => {
  const half = [...new Array(32).fill(255), ...new Array(32).fill(0)];
  const hex = averageHash64(half);
  assert.notEqual(hex, "ffffffffffffffff");
  assert.notEqual(hex, "0000000000000000");
});

test("hexHammingDistance of identical hashes is 0", () => {
  assert.equal(hexHammingDistance("abcd1234", "abcd1234"), 0);
});

test("hexHammingDistance counts differing bits", () => {
  // 0x0 = 0000, 0xf = 1111 -> 4 bits differ.
  assert.equal(hexHammingDistance("0", "f"), 4);
});

test("hexHammingDistance rejects mismatched lengths", () => {
  assert.throws(() => hexHammingDistance("ab", "abcd"));
});

test("buildManifest computes a merkle root consistent with item order", async () => {
  const h1 = await sha256Hex(new TextEncoder().encode("img1"));
  const h2 = await sha256Hex(new TextEncoder().encode("img2"));
  const manifest = await buildManifest({
    items: [
      { filename: "one.png", byteHashHex: h1, pHashHex: "ffffffffffffffff", width: 10, height: 10 },
      { filename: "two.png", byteHashHex: h2, pHashHex: "0000000000000000", width: 20, height: 20 },
    ],
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    caseNotes: "test case",
  });
  assert.equal(manifest.tool, "Sealtrace");
  assert.equal(manifest.items.length, 2);
  assert.equal(manifest.items[0].filename, "one.png");
  assert.equal(manifest.merkleRoot, await merkleRoot([h1, h2]));
  assert.equal(manifest.createdAt, "2026-01-01T00:00:00.000Z");
});

test("buildManifest defaults redactions to an empty array", async () => {
  const h1 = await sha256Hex(new TextEncoder().encode("x"));
  const manifest = await buildManifest({ items: [{ filename: "x.png", byteHashHex: h1 }] });
  assert.deepEqual(manifest.items[0].redactions, []);
});

test("buildAnchorStatement includes the merkle root and item count", async () => {
  const h1 = await sha256Hex(new TextEncoder().encode("only-item"));
  const manifest = await buildManifest({
    items: [{ filename: "one.png", byteHashHex: h1 }],
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
  });
  const statement = buildAnchorStatement(manifest);
  assert.match(statement, /Merkle root \(sha256\): [0-9a-f]{64}/);
  assert.match(statement, /Items \(1\)/);
  assert.match(statement, /Sealtrace/);
});
