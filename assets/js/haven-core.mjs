/**
 * Haven core logic — pure, dependency-free triage data and matching.
 * No DOM access, so this loads identically in the browser and in the
 * Node test suite (test/haven.core.test.mjs).
 *
 * Deliberately NOT a model: Haven does not classify free text, does not
 * diagnose, and does not "understand" anything. A person picks the
 * situations that apply from a fixed list, and this file maps that
 * selection to a fixed, inspectable list of resources. The whole point
 * is that anyone can read this file and see exactly why they were shown
 * what they were shown — see case-haven.html for why that trade-off
 * was chosen deliberately over a black-box classifier.
 */

export const CATEGORIES = [
  { id: "harassment", label: "Harassment or threats online" },
  { id: "scam", label: "Scam, phishing, or fraud" },
  { id: "crisis", label: "Emotional distress or crisis" },
  { id: "gbv", label: "Gender-based violence or abuse" },
  { id: "document", label: "I just want to document what happened" },
];

const CATEGORY_IDS = new Set(CATEGORIES.map((c) => c.id));

export const RESOURCES = {
  "emergency-banner": {
    id: "emergency-banner",
    kind: "safety-banner",
    title: "If you are in immediate physical danger",
    body: "Contact your local emergency number now. Everything below is for support and documentation once you're safe — it is not an emergency service.",
  },
  "find-a-helpline": {
    id: "find-a-helpline",
    kind: "external-directory",
    title: "Find A Helpline",
    body: "A vetted directory of crisis and support helplines (call, text, or chat) covering 130+ countries, run by ThroughLine.",
    url: "https://findahelpline.com/",
  },
  "befrienders": {
    id: "befrienders",
    kind: "external-directory",
    title: "Befrienders Worldwide",
    body: "A global network of confidential emotional-support helplines, active in 30+ countries.",
    url: "https://befrienders.org/",
  },
  "iasp-directory": {
    id: "iasp-directory",
    kind: "external-directory",
    title: "IASP Crisis Centres & Helplines",
    body: "The International Association for Suicide Prevention's directory of crisis centres by country.",
    url: "https://www.iasp.info/resources/Crisis_Centres/",
  },
  "sealtrace": {
    id: "sealtrace",
    kind: "internal-tool",
    title: "Sealtrace",
    body: "Seal screenshots of what happened into a self-verifying evidence capsule — entirely in your browser, before you report it anywhere.",
    url: "sealtrace.html",
  },
  "phishblock": {
    id: "phishblock",
    kind: "external-tool",
    title: "PhishBlock",
    body: "A phishing-detection tool to help you check a suspicious link before you click it.",
    url: "https://github.com/hiluxfnh/PhishBlock",
  },
};

/**
 * category id -> ordered list of resource ids relevant to it.
 * Order matters within a category; merging across categories preserves
 * first-seen order and de-duplicates (see getRecommendations).
 */
const CATEGORY_RESOURCES = {
  crisis: ["emergency-banner", "find-a-helpline", "befrienders", "iasp-directory"],
  gbv: ["emergency-banner", "find-a-helpline", "befrienders", "sealtrace"],
  harassment: ["sealtrace", "find-a-helpline"],
  scam: ["phishblock", "sealtrace"],
  document: ["sealtrace"],
};

/**
 * Given the ids of the situations someone selected, return an ordered,
 * de-duplicated list of resource objects. Unknown/invalid ids are
 * ignored rather than throwing, since this only ever runs against a
 * fixed set of checkboxes.
 */
export function getRecommendations(selectedCategoryIds) {
  const seen = new Set();
  const out = [];
  for (const catId of selectedCategoryIds) {
    if (!CATEGORY_IDS.has(catId)) continue;
    for (const resId of CATEGORY_RESOURCES[catId] || []) {
      if (seen.has(resId)) continue;
      seen.add(resId);
      out.push(RESOURCES[resId]);
    }
  }
  return out;
}

/** True if the emergency safety banner should be shown for this selection. */
export function needsEmergencyBanner(selectedCategoryIds) {
  return selectedCategoryIds.some((id) => id === "crisis" || id === "gbv");
}
