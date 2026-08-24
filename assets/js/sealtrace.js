// Sealtrace — client-side evidence capsule tool. DOM wiring layer.
// Everything here runs in the browser only: no fetch(), no XHR, no upload.
// Pure hashing/merkle logic lives in sealtrace-core.mjs (also used by the
// Node test suite), imported below as an ES module.
import {
  sha256Hex,
  averageHash64,
  buildManifest,
  buildAnchorStatement,
} from "./sealtrace-core.mjs";

const state = {
  items: [], // { id, filename, file, canvas, width, height, byteHashHex, pHashHex, notes, redactions: [{x,y,w,h,hash}] }
  nextId: 1,
};

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function bytesFromCanvas(canvas) {
  return new Promise((resolve) => {
    canvas.toBlob(async (blob) => {
      const buf = await blob.arrayBuffer();
      resolve({ bytes: new Uint8Array(buf), dataUrl: canvas.toDataURL("image/png") });
    }, "image/png");
  });
}

async function computePerceptualHash(canvas) {
  const small = document.createElement("canvas");
  small.width = 8;
  small.height = 8;
  const ctx = small.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(canvas, 0, 0, 8, 8);
  const { data } = ctx.getImageData(0, 0, 8, 8);
  const gray = [];
  for (let i = 0; i < data.length; i += 4) {
    gray.push(Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]));
  }
  return averageHash64(gray);
}

async function loadFileToCanvas(file) {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  canvas.getContext("2d").drawImage(bitmap, 0, 0);
  return canvas;
}

async function addFiles(fileList) {
  const statusEl = $("#st-status");
  for (const file of fileList) {
    if (!file.type.startsWith("image/")) continue;
    statusEl.textContent = `Reading ${file.name}…`;
    const canvas = await loadFileToCanvas(file);
    const { bytes } = await bytesFromCanvas(canvas);
    const byteHashHex = await sha256Hex(bytes);
    const pHashHex = await computePerceptualHash(canvas);
    state.items.push({
      id: state.nextId++,
      filename: file.name,
      canvas,
      width: canvas.width,
      height: canvas.height,
      byteHashHex,
      pHashHex,
      notes: "",
      redactions: [],
    });
  }
  statusEl.textContent = "";
  renderItems();
}

function renderItems() {
  const list = $("#st-items");
  list.innerHTML = "";
  if (state.items.length === 0) {
    $("#st-empty").style.display = "";
    $("#st-actions").style.display = "none";
    return;
  }
  $("#st-empty").style.display = "none";
  $("#st-actions").style.display = "";

  for (const item of state.items) {
    const card = document.createElement("div");
    card.className = "st-item";
    card.dataset.id = item.id;

    const preview = document.createElement("canvas");
    preview.className = "st-item-canvas";
    preview.width = item.canvas.width;
    preview.height = item.canvas.height;
    preview.getContext("2d").drawImage(item.canvas, 0, 0);

    card.innerHTML = `
      <div class="st-item-head">
        <strong>${escapeHtml(item.filename)}</strong>
        <button class="st-remove" type="button" aria-label="Remove ${escapeHtml(item.filename)}">&times;</button>
      </div>
      <div class="st-item-body">
        <div class="st-canvas-wrap"></div>
        <div class="st-item-meta">
          <div><span class="st-k">SHA-256</span><code class="st-hash">${item.byteHashHex}</code></div>
          <div><span class="st-k">Perceptual hash</span><code class="st-hash">${item.pHashHex}</code></div>
          <div><span class="st-k">Dimensions</span>${item.width}&times;${item.height}px</div>
          <label class="st-notes-label">Notes (kept in the capsule, e.g. "received via SMS from +237…")
            <textarea class="st-notes" rows="2" placeholder="Optional context for this item"></textarea>
          </label>
          <div class="st-redact-row">
            <button type="button" class="btn-ghost st-toggle-redact">Redact a region</button>
            <span class="st-redact-count"></span>
          </div>
        </div>
      </div>
    `;
    card.querySelector(".st-canvas-wrap").appendChild(preview);
    card.querySelector(".st-notes").addEventListener("input", (e) => {
      item.notes = e.target.value;
    });
    card.querySelector(".st-remove").addEventListener("click", () => {
      state.items = state.items.filter((it) => it.id !== item.id);
      renderItems();
    });
    card.querySelector(".st-toggle-redact").addEventListener("click", () => {
      startRedaction(item, preview, card);
    });
    updateRedactCount(card, item);
    list.appendChild(card);
  }
}

function updateRedactCount(card, item) {
  const el = card.querySelector(".st-redact-count");
  el.textContent = item.redactions.length
    ? `${item.redactions.length} region${item.redactions.length > 1 ? "s" : ""} redacted`
    : "";
}

function startRedaction(item, canvasEl, card) {
  let drawing = false;
  let start = null;
  canvasEl.style.cursor = "crosshair";
  const overlay = document.createElement("div");
  overlay.className = "st-redact-hint";
  overlay.textContent = "Drag on the image to blackout a region. Press Escape when done.";
  card.querySelector(".st-item-body").prepend(overlay);

  function toCanvasCoords(evt) {
    const rect = canvasEl.getBoundingClientRect();
    const scaleX = canvasEl.width / rect.width;
    const scaleY = canvasEl.height / rect.height;
    return {
      x: (evt.clientX - rect.left) * scaleX,
      y: (evt.clientY - rect.top) * scaleY,
    };
  }

  function onDown(evt) {
    drawing = true;
    start = toCanvasCoords(evt);
  }

  async function onUp(evt) {
    if (!drawing) return;
    drawing = false;
    const end = toCanvasCoords(evt);
    const x = Math.max(0, Math.round(Math.min(start.x, end.x)));
    const y = Math.max(0, Math.round(Math.min(start.y, end.y)));
    const w = Math.min(canvasEl.width - x, Math.round(Math.abs(end.x - start.x)));
    const h = Math.min(canvasEl.height - y, Math.round(Math.abs(end.y - start.y)));
    if (w < 2 || h < 2) return;
    await applyRedaction(item, canvasEl, x, y, w, h);
    updateRedactCount(card, item);
  }

  function onKey(evt) {
    if (evt.key === "Escape") stop();
  }

  function stop() {
    canvasEl.style.cursor = "";
    overlay.remove();
    canvasEl.removeEventListener("pointerdown", onDown);
    canvasEl.removeEventListener("pointerup", onUp);
    document.removeEventListener("keydown", onKey);
  }

  canvasEl.addEventListener("pointerdown", onDown);
  canvasEl.addEventListener("pointerup", onUp);
  document.addEventListener("keydown", onKey);
}

async function applyRedaction(item, canvasEl, x, y, w, h) {
  const ctx = canvasEl.getContext("2d", { willReadFrequently: true });
  // Commit to what was under the box (hash it) BEFORE destroying it, so a
  // dispute later can check "was this box drawn where they said" without
  // ever needing the original pixels back.
  const region = ctx.getImageData(x, y, w, h);
  const regionHash = await sha256Hex(new Uint8Array(region.data.buffer.slice(0)));
  ctx.fillStyle = "#000000";
  ctx.fillRect(x, y, w, h);
  // Mirror the redaction onto the source-of-truth canvas used for export
  // (canvasEl is the on-screen preview; item.canvas is what gets sealed).
  if (canvasEl !== item.canvas) drawBlackout(item.canvas, x, y, w, h);
  item.redactions.push({ x, y, w, h, regionHashSha256: regionHash });

  // Recompute hashes on the now-redacted image.
  const { bytes } = await bytesFromCanvas(item.canvas);
  item.byteHashHex = await sha256Hex(bytes);
  item.pHashHex = await computePerceptualHash(item.canvas);
  refreshHashDisplay(item);
}

function drawBlackout(canvas, x, y, w, h) {
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#000000";
  ctx.fillRect(x, y, w, h);
}

function refreshHashDisplay(item) {
  const card = $(`.st-item[data-id="${item.id}"]`);
  if (!card) return;
  const hashes = card.querySelectorAll(".st-hash");
  hashes[0].textContent = item.byteHashHex;
  hashes[1].textContent = item.pHashHex;
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

async function buildCurrentManifest() {
  const items = [];
  for (const it of state.items) {
    const { bytes, dataUrl } = await bytesFromCanvas(it.canvas);
    items.push({
      filename: it.filename,
      byteHashHex: it.byteHashHex,
      pHashHex: it.pHashHex,
      width: it.width,
      height: it.height,
      notes: it.notes,
      redactions: it.redactions,
      dataUrl,
      _bytesLength: bytes.length,
    });
  }
  const caseNotes = $("#st-case-notes").value;
  const manifest = await buildManifest({ items, caseNotes });
  return { manifest, items };
}

function capsuleHtml(manifest, items) {
  const manifestJson = JSON.stringify(manifest, null, 2);
  const itemsHtml = items
    .map(
      (it, i) => `
    <section class="cap-item" data-index="${i}">
      <h3>${escapeHtml(it.filename)}</h3>
      <img src="${it.dataUrl}" alt="${escapeHtml(it.filename)}" />
      <p class="cap-hash">SHA-256: <code>${it.byteHashHex}</code></p>
      ${it.notes ? `<p class="cap-notes">${escapeHtml(it.notes)}</p>` : ""}
      <p class="cap-verify" data-index="${i}">Verifying…</p>
    </section>`
    )
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Sealtrace evidence capsule — ${new Date(manifest.createdAt).toLocaleString()}</title>
<style>
  :root { color-scheme: light dark; }
  body { font-family: system-ui, -apple-system, "Segoe UI", sans-serif; max-width: 760px; margin: 0 auto; padding: 24px 16px 64px; line-height: 1.5; }
  header { border-bottom: 1px solid #8884; padding-bottom: 16px; margin-bottom: 24px; }
  .banner { padding: 14px 16px; border-radius: 10px; font-weight: 600; margin-bottom: 20px; }
  .banner.pass { background: #16a34a22; border: 1px solid #16a34a88; color: #15803d; }
  .banner.fail { background: #dc262622; border: 1px solid #dc262688; color: #b91c1c; }
  .banner.checking { background: #8884; }
  .cap-item { border: 1px solid #8884; border-radius: 12px; padding: 16px; margin-bottom: 20px; }
  .cap-item img { max-width: 100%; border-radius: 8px; display: block; margin: 10px 0; }
  code { word-break: break-all; font-size: 0.85em; }
  .cap-verify { font-weight: 600; }
  .cap-verify.ok { color: #15803d; }
  .cap-verify.bad { color: #b91c1c; }
  .meta-table { width: 100%; border-collapse: collapse; font-size: 0.9em; }
  .meta-table td { padding: 4px 0; vertical-align: top; }
  .meta-table td:first-child { color: #888; padding-right: 12px; white-space: nowrap; }
  footer { margin-top: 40px; font-size: 0.85em; color: #888; }
</style>
</head>
<body>
<header>
  <h1>Sealtrace evidence capsule</h1>
  <table class="meta-table">
    <tr><td>Sealed at</td><td>${manifest.createdAt}</td></tr>
    <tr><td>Merkle root</td><td><code>${manifest.merkleRoot || "(single item)"}</code></td></tr>
    <tr><td>Items</td><td>${manifest.items.length}</td></tr>
    ${manifest.caseNotes ? `<tr><td>Case notes</td><td>${escapeHtml(manifest.caseNotes)}</td></tr>` : ""}
  </table>
</header>
<div id="cap-banner" class="banner checking">Verifying capsule integrity in your browser…</div>
${itemsHtml}
<footer>
  <p>This file is self-contained: the images above are embedded directly in this HTML
  (as data URIs) and re-hashed by your browser when you open it, using the same
  SHA-256 algorithm noted in each item. A "verified" result means <em>this exact file's
  bytes match the hash recorded at sealing time</em> — it does not by itself prove the
  file wasn't replaced wholesale by someone with access to the original device.
  For that, check the sealer's separately-published anchor statement (merkle root
  above) against a copy they posted somewhere they don't control, before this file
  was shared with you.</p>
  <p>Generated by <a href="https://hiluxfokou.me/sealtrace.html">Sealtrace</a> — a free, offline, no-account tool. Nothing about this capsule ever touched a server.</p>
</footer>
<script>
(function() {
  const manifest = ${manifestJson};

  async function sha256HexOfDataUrl(dataUrl) {
    const res = await fetch(dataUrl);
    const buf = await res.arrayBuffer();
    const digest = await crypto.subtle.digest("SHA-256", buf);
    return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");
  }

  async function merkleRoot(hexes) {
    if (hexes.length === 0) return null;
    let level = hexes.slice();
    function hexToBytes(hex) {
      const out = new Uint8Array(hex.length / 2);
      for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
      return out;
    }
    while (level.length > 1) {
      const next = [];
      for (let i = 0; i < level.length; i += 2) {
        const left = level[i];
        const right = i + 1 < level.length ? level[i + 1] : level[i];
        const digest = await crypto.subtle.digest("SHA-256", hexToBytes(left + right));
        next.push(Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join(""));
      }
      level = next;
    }
    return level[0];
  }

  async function verify() {
    const banner = document.getElementById("cap-banner");
    const imgs = document.querySelectorAll(".cap-item img");
    const computed = [];
    let allOk = true;
    for (let i = 0; i < imgs.length; i++) {
      const expected = manifest.items[i].byteHash.hex;
      const actual = await sha256HexOfDataUrl(imgs[i].src);
      computed.push(actual);
      const ok = actual === expected;
      allOk = allOk && ok;
      const el = document.querySelector('.cap-verify[data-index="' + i + '"]');
      el.textContent = ok ? "✓ Verified — matches sealed hash" : "✗ MISMATCH — this image differs from the sealed hash";
      el.className = "cap-verify " + (ok ? "ok" : "bad");
    }
    const root = await merkleRoot(computed);
    const rootOk = manifest.items.length <= 1 ? true : root === manifest.merkleRoot;
    allOk = allOk && rootOk;
    banner.className = "banner " + (allOk ? "pass" : "fail");
    banner.textContent = allOk
      ? "✓ Capsule verified — all " + imgs.length + " item(s) match their sealed hashes and the merkle root."
      : "✗ Verification FAILED — this capsule's contents do not match what was sealed. Do not treat it as authentic.";
  }

  verify();
})();
</script>
</body>
</html>`;
}

function downloadText(filename, text, mime) {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

async function onExportCapsule() {
  const { manifest, items } = await buildCurrentManifest();
  const html = capsuleHtml(manifest, items);
  downloadText(`sealtrace-capsule-${stamp()}.html`, html, "text/html");
  $("#st-anchor-text").value = buildAnchorStatement(manifest);
  $("#st-anchor-wrap").style.display = "";
}

async function onExportManifest() {
  const { manifest } = await buildCurrentManifest();
  downloadText(`sealtrace-manifest-${stamp()}.json`, JSON.stringify(manifest, null, 2), "application/json");
}

function initDropzone() {
  const dz = $("#st-dropzone");
  const input = $("#st-file-input");
  dz.addEventListener("click", () => input.click());
  dz.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") input.click();
  });
  input.addEventListener("change", (e) => addFiles(e.target.files));
  ["dragenter", "dragover"].forEach((evt) =>
    dz.addEventListener(evt, (e) => {
      e.preventDefault();
      dz.classList.add("st-drag");
    })
  );
  ["dragleave", "drop"].forEach((evt) =>
    dz.addEventListener(evt, (e) => {
      e.preventDefault();
      dz.classList.remove("st-drag");
    })
  );
  dz.addEventListener("drop", (e) => addFiles(e.dataTransfer.files));
}

function initActions() {
  $("#st-export-capsule").addEventListener("click", onExportCapsule);
  $("#st-export-manifest").addEventListener("click", onExportManifest);
  $("#st-copy-anchor").addEventListener("click", async () => {
    await navigator.clipboard.writeText($("#st-anchor-text").value);
    const btn = $("#st-copy-anchor");
    const original = btn.textContent;
    btn.textContent = "Copied!";
    setTimeout(() => (btn.textContent = original), 1500);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initDropzone();
  initActions();
  renderItems();
});
