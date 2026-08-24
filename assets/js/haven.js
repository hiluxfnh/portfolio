// Haven — DOM wiring layer. Everything runs client-side; the only
// network activity is the external links a visitor chooses to click.
import { CATEGORIES, getRecommendations, needsEmergencyBanner } from "./haven-core.mjs";

const $ = (sel, root = document) => root.querySelector(sel);

const ICONS = {
  "safety-banner": "fa-triangle-exclamation",
  "external-directory": "fa-up-right-from-square",
  "internal-tool": "fa-box-archive",
  "external-tool": "fa-shield-halved",
};

function renderCheckboxes() {
  const wrap = $("#hv-categories");
  wrap.innerHTML = CATEGORIES.map(
    (c) => `
    <label class="hv-check">
      <input type="checkbox" name="hv-cat" value="${c.id}">
      <span>${c.label}</span>
    </label>`
  ).join("");
}

function resourceCard(res) {
  const icon = ICONS[res.kind] || "fa-circle-info";
  const isBanner = res.kind === "safety-banner";
  const linkHtml = res.url
    ? `<a class="hv-res-link" href="${res.url}" ${res.url.startsWith("http") ? 'target="_blank" rel="noopener"' : ""}>
         ${res.kind === "internal-tool" ? "Open" : "Visit"} <i class="fas fa-arrow-right"></i>
       </a>`
    : "";
  return `
    <div class="hv-res ${isBanner ? "hv-res-banner" : ""}">
      <i class="fas ${icon}" aria-hidden="true"></i>
      <div class="hv-res-body">
        <h3>${res.title}</h3>
        <p>${res.body}</p>
        ${linkHtml}
      </div>
    </div>`;
}

function render() {
  const selected = Array.from(document.querySelectorAll('input[name="hv-cat"]:checked')).map(
    (el) => el.value
  );
  const resultsWrap = $("#hv-results");
  const emptyState = $("#hv-empty");

  if (selected.length === 0) {
    resultsWrap.innerHTML = "";
    emptyState.style.display = "";
    return;
  }
  emptyState.style.display = "none";

  const recs = getRecommendations(selected);
  resultsWrap.innerHTML = recs.map(resourceCard).join("");

  // Emergency banner, if present, is visually distinct and always first —
  // getRecommendations already orders it first for crisis/gbv, this just
  // asserts the invariant stays visible even if categories are reordered later.
  if (needsEmergencyBanner(selected)) {
    resultsWrap.classList.add("hv-has-emergency");
  } else {
    resultsWrap.classList.remove("hv-has-emergency");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  renderCheckboxes();
  document.getElementById("hv-categories").addEventListener("change", render);
  render();
});
