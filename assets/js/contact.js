// assets/js/contact.js

// ---------------------------------------------------------------------------
// 1. Dynamic form fields based on purpose
// ---------------------------------------------------------------------------
const dynamicMap = {
  research: `
      <label for="institution">Institution</label>
      <input id="institution" name="institution" required>`,
  social: `
      <label for="organization">Organization</label>
      <input id="organization" name="organization" required>`,
  tech: `
      <label for="company">Company/Project</label>
      <input id="company" name="company" required>`
};

const purposeSelect = document.getElementById('purpose');
const dynamicFieldsContainer = document.getElementById('dynamicFields');
if (purposeSelect && dynamicFieldsContainer) {
  purposeSelect.addEventListener('change', (e) => {
    dynamicFieldsContainer.innerHTML = dynamicMap[e.target.value] || '';
  });
}

// ---------------------------------------------------------------------------
// 2. AJAX form submission via Formspree
// ---------------------------------------------------------------------------
const form = document.getElementById('contactForm');
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    const original = submitBtn ? submitBtn.textContent : '';
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending…'; }
    try {
      const res = await fetch(form.action, {
        method: form.method,
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      });
      if (!res.ok) throw new Error('Network response was not OK');
      alert('Thank you! Your message has been sent.');
      form.reset();
      if (dynamicFieldsContainer) dynamicFieldsContainer.innerHTML = '';
    } catch (err) {
      console.error('Form submission error:', err);
      alert('Oops! There was a problem sending your message. You can also email hiluxfokou33@gmail.com directly.');
    } finally {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = original || 'Send Message'; }
    }
  });
}

// ---------------------------------------------------------------------------
// 3. HiluxBot — lightweight, privacy-friendly assistant (no backend)
// ---------------------------------------------------------------------------
(function initBot() {
  const fab = document.createElement('button');
  fab.className = 'hbot-fab';
  fab.type = 'button';
  fab.innerHTML = '<i class="fas fa-comment-dots"></i> Ask HiluxBot';

  const panel = document.createElement('div');
  panel.className = 'hbot';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Chat assistant');
  panel.innerHTML = `
    <div class="hbot-head">
      <span class="av"><i class="fas fa-robot"></i></span>
      <div><h4>HiluxBot</h4><small>Here to point you in the right direction</small></div>
      <button class="x" type="button" aria-label="Close chat">&times;</button>
    </div>
    <div class="hbot-log" id="hbotLog" aria-live="polite"></div>
    <div class="hbot-quick" id="hbotQuick"></div>
    <form class="hbot-input" id="hbotForm">
      <input id="hbotInput" type="text" autocomplete="off" placeholder="Type a question…" aria-label="Your message">
      <button type="submit" aria-label="Send"><i class="fas fa-paper-plane"></i></button>
    </form>`;

  document.body.appendChild(panel);
  document.body.appendChild(fab);

  const log = panel.querySelector('#hbotLog');
  const quick = panel.querySelector('#hbotQuick');
  const inputForm = panel.querySelector('#hbotForm');
  const input = panel.querySelector('#hbotInput');

  const QUICK = ['Security work', 'Social impact', 'Projects', 'Collaborate', 'Contact details'];

  const INTENTS = [
    { k: ['security', 'cyber', 'hacking', 'ceh', 'phish', 'cert'],
      a: `My security work spans anti-phishing, NLP against disinformation, and exam integrity — backed by CEH, ISC2 CC, SC-900 and an MSc in Information Security. See the <a href="security.html">Security page</a>.` },
    { k: ['impact', 'social', 'un', 'advocacy', 'climate', 'youth', 'iawg', 'asrhr'],
      a: `On the impact side I co-chaired IAWG's youth ASRHR group, negotiated climate with YOUNGO at COP27/28, and trained 36+ orgs reaching 13,000+ adolescents. See <a href="social-impact.html">Impact</a>.` },
    { k: ['project', 'build', 'work', 'portfolio', 'app', 'kamerlark', 'getrespondr', 'code'],
      a: `Selected projects: KamerLark (student housing), GetRespondr (crisis coordination), PhishBlock, and FakeAlert NLP. Browse them on the <a href="tech.html">Work page</a> or my <a href="https://github.com/hiluxfnh" target="_blank" rel="noopener">GitHub</a>.` },
    { k: ['research', 'paper', 'publication', 'nlp'],
      a: `I've published on data-driven youth climate action and on NLP against fake news & hate speech. See <a href="research.html">Research</a>.` },
    { k: ['collaborate', 'hire', 'work with', 'available', 'opportunity', 'job', 'role'],
      a: `I'm open to security research, trust & safety, and digital-protection roles or collaborations. Use the form on this page, or email <a href="mailto:hiluxfokou33@gmail.com">hiluxfokou33@gmail.com</a>.` },
    { k: ['contact', 'email', 'reach', 'linkedin', 'phone', 'details'],
      a: `Email <a href="mailto:hiluxfokou33@gmail.com">hiluxfokou33@gmail.com</a> · <a href="https://www.linkedin.com/in/fokou" target="_blank" rel="noopener">LinkedIn</a> · <a href="https://github.com/hiluxfnh" target="_blank" rel="noopener">GitHub</a>.` },
    { k: ['cv', 'resume'],
      a: `You can <a href="assets/Hilux-Fokou-CV.pdf" target="_blank" rel="noopener">download my CV</a> (PDF).` },
    { k: ['hi', 'hello', 'hey', 'who'],
      a: `Hi! I'm HiluxBot. Ask me about Hilux's security work, social impact, projects, or how to collaborate.` }
  ];

  function add(text, who) {
    const m = document.createElement('div');
    m.className = 'hbot-msg ' + (who || 'bot');
    m.innerHTML = text;
    log.appendChild(m);
    log.scrollTop = log.scrollHeight;
  }

  function answer(q) {
    const t = q.toLowerCase();
    const hit = INTENTS.find(i => i.k.some(k => t.includes(k)));
    return hit ? hit.a
      : `I'm not sure about that one — but you can email <a href="mailto:hiluxfokou33@gmail.com">hiluxfokou33@gmail.com</a>, or try one of the quick options above.`;
  }

  function renderQuick() {
    quick.innerHTML = '';
    QUICK.forEach(label => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = label;
      b.addEventListener('click', () => { add(label, 'user'); setTimeout(() => add(answer(label)), 250); });
      quick.appendChild(b);
    });
  }

  let greeted = false;
  function openBot() {
    panel.classList.add('open');
    if (!greeted) {
      add(`👋 Hi, I'm <strong>HiluxBot</strong>. What brings you here today?`);
      renderQuick();
      greeted = true;
    }
    input.focus();
  }
  function closeBot() { panel.classList.remove('open'); }

  fab.addEventListener('click', openBot);
  panel.querySelector('.x').addEventListener('click', closeBot);
  inputForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = input.value.trim();
    if (!q) return;
    add(q, 'user');
    input.value = '';
    setTimeout(() => add(answer(q)), 300);
  });

  // Wire up the existing "Chat with Bot" link if present
  const legacyToggle = document.getElementById('chatbotToggle');
  if (legacyToggle) legacyToggle.addEventListener('click', (e) => { e.preventDefault(); openBot(); });
})();
