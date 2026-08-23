# Hilux Fokou Ngoumo — Portfolio

> **Security & technology for social good.**
> I build and secure technology that protects people — from disinformation and online harm to climate and humanitarian crises.

**Live:** [hiluxfokou.me](https://hiluxfokou.me/)

---

## About

I'm Hilux Fokou Ngoumo — a security researcher and full-stack builder from Cameroon, and a UN youth leader. My work sits where **code meets human safety**: cybersecurity, AI against disinformation, humanitarian platforms, and youth advocacy.

I hold a First Class with Distinction in Computer Applications from **GITAM University (India)** and am pursuing an **MSc in Information Security at ITMO University (Russia)** on the Open Doors Scholarship.

## The through-line: Build · Secure · Empower

| Pillar | What it means |
|--------|---------------|
| **Build** | Full-stack platforms & AI — KamerLark (student housing), GetRespondr (crisis coordination), EcoCityAdapt (climate & MIL education) |
| **Secure** | Cybersecurity research & tooling — PhishBlock, FakeAlert NLP, ProctoShield, CyberCraft Academy. CEH, ISC2 CC, CAP, SC-900, AZ-900, AI-900 |
| **Empower** | UN youth advocacy — IAWG co-chair, YOUNGO climate negotiator, trainer reaching 13,000+ adolescents across humanitarian settings |

## Site structure

| Page | Contents |
|------|----------|
| `index.html` | Home — thesis, three pillars, featured projects |
| `security.html` | Cybersecurity work, certifications, focus areas |
| `tech.html` | Projects, skills (grouped), certifications, badges |
| `case-fakealert.html` | Flagship engineering case study (FakeAlert / NLP) |
| `sealtrace.html` | Working tool — seal screenshots into self-verifying, offline evidence capsules |
| `case-sealtrace.html` | Case study — Sealtrace's design and threat model |
| `writeups.html` | Technical writeups &amp; insights |
| `social-impact.html` | UN forums, IAWG, community partnerships |
| `research.html` | Papers, training, reviewer roles |
| `about.html` | Bio and journey timeline |
| `professional-experience.html` | Roles & internships |
| `certifications.html` / `Awards.html` / `gallery.html` | Credentials, honors, media |
| `contact.html` | Contact form, chat assistant & résumé downloads |

Résumés (PDF + editable Word) live in `assets/` — `Hilux-Fokou-Ngoumo-Tech-Resume.*` and `Hilux-Fokou-Ngoumo-Community-Resume.*`.

## Tech

Static site — semantic HTML5, a shared design system in `assets/css/base.css` (design tokens, responsive nav, components), vanilla JS (`assets/js/nav.js`, `assets/js/contact.js`), and [AOS](https://michalsnik.github.io/aos/) for scroll animation. No build step.

Sealtrace (`sealtrace.html`) is the one page with real client-side logic: its hashing/Merkle-tree core lives in `assets/js/sealtrace-core.mjs` as a dependency-free ES module (Web Crypto only), with the DOM wiring in `assets/js/sealtrace.js`. Everything runs in the visitor's browser — no upload, no backend, no analytics call.

### Testing

The Sealtrace core logic has a Node test suite (uses Node's built-in test runner — no dependencies to install):

```bash
node --test test/sealtrace.core.test.mjs
```

## Local development

```bash
# 1. Clone
git clone https://github.com/hiluxfnh/portfolio.git
cd portfolio

# 2. Serve locally (pick one)
python3 -m http.server 8000      # then open http://localhost:8000
npx serve .                      # or use the Node "serve" package
# or: VS Code → Live Server extension → "Open with Live Server"

# 3. Edit → commit → push (GitHub Pages auto-deploys)
git add -A
git commit -m "your message"
git push origin main
```

> Serve the folder over HTTP — opening `index.html` directly with `file://`
> can break the shared nav/footer JS and relative asset paths.

**Windows note:** if `git` reports *"detected dubious ownership"*, run
`git config --global --add safe.directory <path-to-repo>` once, then retry.

## Contact

- Email: [hiluxfokou33@gmail.com](mailto:hiluxfokou33@gmail.com)
- [LinkedIn](https://www.linkedin.com/in/fokou/) · [GitHub](https://github.com/hiluxfnh) · [X](https://twitter.com/FOKOUHilux1) · [Credly](https://www.credly.com/users/hilux/badges)

---

© 2025 Hilux Fokou Ngoumo · Licensed under the [MIT License](LICENSE).
