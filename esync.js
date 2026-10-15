/* Esync — ESC's assistant.
   Works out of the box with the built-in answers in config.js (kb).
   Optionally set ESC_CONFIG.esyncApiUrl to your own backend for a full AI model. */
(() => {
  'use strict';
  const C = window.ESC_CONFIG || {};
  const ESC = (window.ESC = window.ESC || {});

  const root = document.createElement('div');
  root.className = 'esync';
  root.innerHTML = `
    <button class="esync-fab" type="button" aria-label="Open Esync assistant" aria-expanded="false">
      <span class="esync-orb">E</span><span class="esync-fab-label">Ask Esync</span>
    </button>
    <section class="esync-panel" role="dialog" aria-label="Esync assistant" hidden>
      <header>
        <span class="esync-orb">E</span>
        <div><strong>Esync</strong><small>ESC’s assistant</small></div>
        <button class="esync-close" type="button" aria-label="Close">×</button>
      </header>
      <div class="esync-log" aria-live="polite"></div>
      <div class="esync-chips"></div>
      <form class="esync-form">
        <input type="text" placeholder="Ask about ESC, data or regression…" aria-label="Message Esync" autocomplete="off" maxlength="300">
        <button type="submit" aria-label="Send">➤</button>
      </form>
    </section>`;
  document.body.appendChild(root);

  const fab = root.querySelector('.esync-fab'), panel = root.querySelector('.esync-panel');
  const log = root.querySelector('.esync-log'), form = root.querySelector('form');
  const input = form.querySelector('input'), chips = root.querySelector('.esync-chips');
  const history = [];
  let greeted = false;

  /* ---------- rendering ---------- */
  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const md = s => esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+|#[\w-]+)\)/g, (m, t, u) =>
      u.startsWith('#') ? `<a href="${u}" data-local>${t}</a>` : `<a href="${u}" target="_blank" rel="noopener">${t}</a>`)
    .replace(/\n/g, '<br>');

  function add(text, who) {
    const el = document.createElement('div');
    el.className = 'msg ' + who;
    el.innerHTML = who === 'bot' ? md(text) : esc(text);
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
    return el;
  }

  /* ---------- brains ---------- */
  const LIVE = [
    { re: /gdp growth|economic growth|growth rate|growing/, key: 'growth' },
    { re: /inflation|\bcpi\b/, key: 'inflation' },
    { re: /unemploy|jobless/, key: 'unemployment' },
    { re: /population|how many people/, key: 'population' },
    { re: /\bgdp\b|size of the economy|economy size/, key: 'gdp' }
  ];
  const LIVE_TRIGGER = /brunei|latest|current|currently|right now|today|how (big|large|much)|our /;

  const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const has = (msg, phrase) => new RegExp('(^|[^a-z0-9])' + escRe(phrase) + '([^a-z0-9]|$)').test(msg);

  function localAnswer(raw) {
    const msg = raw.toLowerCase().replace(/[?!.,]/g, ' ').replace(/\s+/g, ' ').trim();

    // live figures from the dashboard
    if (LIVE_TRIGGER.test(msg)) {
      const hit = LIVE.find(l => l.re.test(msg));
      if (hit) {
        const k = ESC.kpis && ESC.kpis[hit.key];
        return k
          ? `Latest available figure for Brunei — **${k.label}: ${k.value}** (${k.year}, World Bank). See the full picture on the [dashboard](#dashboard).`
          : 'I can’t see the live figures right now (they may still be loading, or you may be offline). Try the [dashboard](#dashboard) in a moment.';
      }
    }

    // best matching knowledge-base entry (longer phrases score higher)
    let best = null, bestScore = 0;
    (C.kb || []).forEach(entry => {
      const score = entry.keys.reduce((s, k) => s + (has(msg, k) ? 1 + k.split(' ').length : 0), 0);
      if (score > bestScore) { best = entry; bestScore = score; }
    });
    if (best) return best.answer;

    return 'I’m not sure about that one yet. 🤔 I can help with **ESC**, **joining**, the **dashboard**, **data sources**, the **regression lab** and basic **economics concepts** (GDP, inflation, R², p-values…). You can also reach the team in the [Join us section](#contact).';
  }

  async function remoteAnswer(msg) {
    const r = await fetch(C.esyncApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg, history: history.slice(-10) })
    });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const j = await r.json();
    if (!j.reply) throw new Error('Empty reply');
    return String(j.reply);
  }

  async function ask(text) {
    text = text.trim();
    if (!text) return;
    add(text, 'me');
    history.push({ role: 'user', content: text });
    const typing = add('', 'bot');
    typing.innerHTML = '<span class="typing"><i></i><i></i><i></i></span>';
    let reply;
    try {
      reply = C.esyncApiUrl ? await remoteAnswer(text) : await new Promise(res => setTimeout(() => res(localAnswer(text)), 450 + Math.random() * 350));
    } catch (e) {
      reply = localAnswer(text);   // fall back to built-in answers
    }
    typing.innerHTML = md(reply);
    history.push({ role: 'assistant', content: reply });
    log.scrollTop = log.scrollHeight;
  }

  /* ---------- open / close ---------- */
  function open() {
    panel.hidden = false;
    fab.setAttribute('aria-expanded', 'true');
    if (!greeted) {
      greeted = true;
      add('Hi! 👋 I’m **Esync**, the Economics Students’ Chamber assistant. What would you like to know?', 'bot');
      ['What is ESC?', 'How do I join?', 'Brunei GDP growth', 'Explain R²', 'Where can I find Brunei data?'].forEach(q => {
        const b = document.createElement('button');
        b.type = 'button'; b.textContent = q;
        b.addEventListener('click', () => ask(q));
        chips.appendChild(b);
      });
    }
    setTimeout(() => input.focus(), 50);
  }
  function close() { panel.hidden = true; fab.setAttribute('aria-expanded', 'false'); }

  fab.addEventListener('click', () => (panel.hidden ? open() : close()));
  root.querySelector('.esync-close').addEventListener('click', close);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden) close(); });
  document.querySelectorAll('[data-open-esync]').forEach(b => b.addEventListener('click', open));
  log.addEventListener('click', e => { if (e.target.closest('a[data-local]') && window.innerWidth < 780) close(); });

  form.addEventListener('submit', e => {
    e.preventDefault();
    const v = input.value; input.value = '';
    ask(v);
  });
})();
