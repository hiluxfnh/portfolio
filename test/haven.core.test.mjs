import test from "node:test";
import assert from "node:assert/strict";
import {
  CATEGORIES,
  RESOURCES,
  getRecommendations,
  needsEmergencyBanner,
} from "../assets/js/haven-core.mjs";

test("every category has a stable id and label", () => {
  assert.ok(CATEGORIES.length >= 5);
  for (const c of CATEGORIES) {
    assert.equal(typeof c.id, "string");
    assert.equal(typeof c.label, "string");
    assert.ok(c.id.length > 0 && c.label.length > 0);
  }
});

test("every resource referenced anywhere exists in RESOURCES", () => {
  const ids = CATEGORIES.map((c) => c.id);
  for (const id of ids) {
    for (const res of getRecommendations([id])) {
      assert.ok(RESOURCES[res.id], `resource ${res.id} should exist in RESOURCES`);
    }
  }
});

test("external directories have a real https url", () => {
  for (const res of Object.values(RESOURCES)) {
    if (res.kind === "external-directory" || res.kind === "external-tool") {
      assert.match(res.url, /^https:\/\//, `${res.id} should have an https url`);
    }
  }
});

test("internal tool links point at real site-relative pages", () => {
  const sealtrace = RESOURCES["sealtrace"];
  assert.equal(sealtrace.url, "sealtrace.html");
});

test("getRecommendations returns nothing for an empty selection", () => {
  assert.deepEqual(getRecommendations([]), []);
});

test("getRecommendations ignores unknown category ids", () => {
  assert.deepEqual(getRecommendations(["not-a-real-category"]), []);
});

test("getRecommendations for crisis leads with the emergency banner", () => {
  const recs = getRecommendations(["crisis"]);
  assert.equal(recs[0].id, "emergency-banner");
  assert.ok(recs.some((r) => r.id === "find-a-helpline"));
});

test("getRecommendations for gbv includes both crisis support and Sealtrace", () => {
  const recs = getRecommendations(["gbv"]);
  const ids = recs.map((r) => r.id);
  assert.ok(ids.includes("emergency-banner"));
  assert.ok(ids.includes("sealtrace"));
});

test("getRecommendations for scam includes PhishBlock and Sealtrace, no emergency banner", () => {
  const recs = getRecommendations(["scam"]);
  const ids = recs.map((r) => r.id);
  assert.ok(ids.includes("phishblock"));
  assert.ok(ids.includes("sealtrace"));
  assert.ok(!ids.includes("emergency-banner"));
});

test("getRecommendations de-duplicates across overlapping categories and preserves first-seen order", () => {
  const recs = getRecommendations(["crisis", "gbv"]);
  const ids = recs.map((r) => r.id);
  assert.equal(new Set(ids).size, ids.length, "no duplicate resource ids");
  // crisis is listed first, so its order should win for shared resources.
  assert.deepEqual(
    ids,
    ["emergency-banner", "find-a-helpline", "befrienders", "iasp-directory", "sealtrace"]
  );
});

test("needsEmergencyBanner is true only for crisis/gbv selections", () => {
  assert.equal(needsEmergencyBanner(["crisis"]), true);
  assert.equal(needsEmergencyBanner(["gbv"]), true);
  assert.equal(needsEmergencyBanner(["crisis", "scam"]), true);
  assert.equal(needsEmergencyBanner(["scam", "harassment", "document"]), false);
  assert.equal(needsEmergencyBanner([]), false);
});
