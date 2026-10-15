/* Site-wide behaviour: nav, scroll reveal, counters, hero animation, ticker, contact form */
(() => {
  'use strict';
  const C = window.ESC_CONFIG || {};
  const ESC = (window.ESC = window.ESC || {});
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.documentElement.classList.add('js');

  /* ---------- Nav ---------- */
  const nav = $('.nav'), toggle = $('.nav-toggle'), links = $('#nav-links');
  toggle.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  links.addEventListener('click', e => {
    if (e.target.closest('a')) { links.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); }
  });
  addEventListener('scroll', () => nav.classList.toggle('scrolled', scrollY > 10), { passive: true });

  /* ---------- Scroll reveal ---------- */
  const revealIO = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); revealIO.unobserve(e.target); } });
  }, { threshold: 0.12 });
  $$('.reveal').forEach(el => revealIO.observe(el));

  /* ---------- Counting numbers ---------- */
  ESC.countTo = (el, to, fmt, dur = 1400) => {
    fmt = fmt || (v => Math.round(v).toLocaleString());
    if (reduce) { el.textContent = fmt(to); return; }
    const start = performance.now();
    const step = now => {
      const p = Math.min((now - start) / dur, 1);
      el.textContent = fmt(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step); else el.textContent = fmt(to);
    };
    requestAnimationFrame(step);
  };

  const counts = $$('[data-count]');
  counts.forEach(el => {
    const key = el.dataset.key;
    if (key && Array.isArray(C[key])) el.dataset.count = C[key].length;
  });
  const countIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { ESC.countTo(e.target, +e.target.dataset.count); countIO.unobserve(e.target); }
    });
  });
  counts.forEach(el => countIO.observe(el));

  /* ---------- Hero animation: drifting trend lines ---------- */
  const cv = $('#hero-canvas');
  if (cv && cv.getContext) {
    const ctx = cv.getContext('2d');
    let w = 0, h = 0, raf = 0, visible = true;
    const lines = [
      { c: 'rgba(255,197,73,.95)', lw: 2.8, base: .60, amp: .10, f: 1.1, sp: .00045, ph: 0,   tr: .24 },
      { c: 'rgba(255,197,73,.45)', lw: 1.8, base: .70, amp: .08, f: 1.7, sp: -.00035, ph: 1.4, tr: .16 },
      { c: 'rgba(255,248,234,.28)', lw: 1.4, base: .80, amp: .07, f: .8, sp: .00025, ph: 2.6, tr: .10 }
    ];
    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = w * dpr; cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (reduce) draw(0);
    };
    const draw = t => {
      ctx.clearRect(0, 0, w, h);
      // grid
      ctx.strokeStyle = 'rgba(255,197,73,.06)'; ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 64) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      for (let y = 0; y < h; y += 64) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
      // rising bars
      const bars = Math.max(10, Math.floor(w / 70)), bw = w / bars;
      ctx.fillStyle = 'rgba(255,197,73,.07)';
      for (let i = 0; i < bars; i++) {
        const bh = h * .22 * (0.55 + 0.45 * Math.sin(i * .7 + t * .0012)) * (0.4 + i / bars);
        ctx.fillRect(i * bw + 6, h - bh, bw - 12, bh);
      }
      // trend lines
      lines.forEach((l, i) => {
        ctx.beginPath(); ctx.strokeStyle = l.c; ctx.lineWidth = l.lw;
        let lx = 0, ly = 0;
        for (let x = 0; x <= w; x += 5) {
          const n = x / w;
          const y = h * (l.base - l.tr * n)
            + Math.sin(n * Math.PI * 2 * l.f + t * l.sp * 3 + l.ph) * h * l.amp
            + Math.sin(n * 21 + t * .0009 * (i + 1)) * h * .008;
          x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
          lx = x; ly = y;
        }
        ctx.stroke();
        ctx.fillStyle = l.c; ctx.beginPath(); ctx.arc(lx - 3, ly, i === 0 ? 5 : 3.5, 0, 7); ctx.fill();
      });
    };
    const loop = now => { draw(now); raf = (visible && !reduce) ? requestAnimationFrame(loop) : 0; };
    addEventListener('resize', resize);
    resize();
    if (!reduce) {
      raf = requestAnimationFrame(loop);
      new IntersectionObserver(([e]) => {
        visible = e.isIntersecting;
        if (visible && !raf) raf = requestAnimationFrame(loop);
      }).observe(cv);
    }
  }

  /* ---------- Ticker (filled by dashboard.js) ---------- */
  ESC.buildTicker = items => {
    const track = $('#ticker-track');
    if (!track || !items.length) return;
    const html = items.map(i =>
      `<span class="tick"><b>${i.label}</b>${i.value}<i>${i.dir === 'up' ? '▲' : i.dir === 'down' ? '▼' : '●'}</i></span>`).join('');
    track.innerHTML = html + html;
  };

  /* ---------- Socials + contact form ---------- */
  const ct = C.contact || {};
  const soc = $('#socials');
  if (soc) {
    const bits = [];
    if (ct.instagram) bits.push(`<a href="${ct.instagram}" target="_blank" rel="noopener">Instagram</a>`);
    if (ct.linkedin) bits.push(`<a href="${ct.linkedin}" target="_blank" rel="noopener">LinkedIn</a>`);
    if (ct.telegram) bits.push(`<a href="${ct.telegram}" target="_blank" rel="noopener">Telegram</a>`);
    if (ct.email) bits.push(`<a href="mailto:${ct.email}">${ct.email}</a>`);
    soc.innerHTML = bits.join('');
  }
  const form = $('#contact-form');
  if (form) form.addEventListener('submit', e => {
    e.preventDefault();
    const d = new FormData(form);
    const body = `${d.get('message')}\n\n— ${d.get('name')} (${d.get('email')})`;
    location.href = `mailto:${ct.email || ''}?subject=${encodeURIComponent('Message to ESC from ' + d.get('name'))}&body=${encodeURIComponent(body)}`;
  });

  $('#year').textContent = new Date().getFullYear();
})();
