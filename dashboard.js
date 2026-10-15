/* Dashboard: live Brunei indicators from the World Bank open API */
(() => {
  'use strict';
  const ESC = (window.ESC = window.ESC || {});
  const $ = id => document.getElementById(id);
  const MAROON = '#62160d', AMBER = '#FFC549';

  const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 2 });
  const one = new Intl.NumberFormat('en', { maximumFractionDigits: 1 });
  const zero = new Intl.NumberFormat('en', { maximumFractionDigits: 0 });

  /* ---------- World Bank helpers (shared with the other scripts) ---------- */
  const cache = new Map();
  ESC.wbSeries = (country, indicator) => {
    const key = country + '|' + indicator;
    if (cache.has(key)) return cache.get(key);
    const url = `https://api.worldbank.org/v2/country/${country}/indicator/${indicator}?format=json&per_page=100`;
    const p = fetch(url)
      .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(j => {
        if (!Array.isArray(j) || !Array.isArray(j[1])) throw new Error('No data returned');
        return j[1].filter(d => d.value !== null)
          .map(d => ({ year: +d.date, value: d.value }))
          .sort((a, b) => a.year - b.year);
      });
    cache.set(key, p);
    p.catch(() => cache.delete(key));
    return p;
  };

  // most recent non-empty value for several countries at once
  ESC.wbLatest = (codes, indicator) => {
    const url = `https://api.worldbank.org/v2/country/${codes.join(';')}/indicator/${indicator}?format=json&mrnev=1&per_page=100`;
    return fetch(url)
      .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(j => {
        if (!Array.isArray(j) || !Array.isArray(j[1])) throw new Error('No data returned');
        return j[1].filter(d => d.value !== null)
          .map(d => ({ code: d.countryiso3code, name: d.country.value, year: +d.date, value: d.value }));
      });
  };

  ESC.fmt = { compact, one, zero };

  /* ---------- Chart defaults ---------- */
  if (window.Chart) {
    Chart.defaults.font.family = "'Space Grotesk', system-ui, sans-serif";
    Chart.defaults.color = '#6f5a52';
    Chart.defaults.plugins.legend.display = false;
  }
  const fmtVal = (v, unit) =>
    unit === '%' ? one.format(v) + '%' :
    unit === 'US$' ? 'US$ ' + zero.format(v) : zero.format(v);
  const fmtAxis = (v, unit) =>
    unit === '%' ? one.format(v) + '%' :
    unit === 'US$' ? compact.format(v) : v;

  const charts = {};
  function seriesChart(id, series, { unit = '%', bar = false } = {}) {
    const el = $(id);
    if (!el || !window.Chart) return;
    if (charts[id]) charts[id].destroy();
    const data = series.map(d => d.value);
    charts[id] = new Chart(el, {
      type: bar ? 'bar' : 'line',
      data: {
        labels: series.map(d => d.year),
        datasets: [{
          data,
          borderColor: MAROON,
          backgroundColor: bar ? data.map(v => v >= 0 ? AMBER : MAROON) : 'rgba(255,197,73,.30)',
          borderWidth: bar ? 0 : 2.5,
          fill: !bar, tension: .3, pointRadius: 0, pointHoverRadius: 5,
          pointHoverBackgroundColor: AMBER, pointHoverBorderColor: MAROON, borderRadius: 4
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        animation: { duration: 1300, easing: 'easeOutQuart' },
        interaction: { mode: 'index', intersect: false },
        scales: {
          x: { grid: { display: false }, ticks: { maxTicksLimit: 8 } },
          y: { grid: { color: 'rgba(98,22,13,.08)' }, ticks: { callback: v => fmtAxis(v, unit) } }
        },
        plugins: { tooltip: { callbacks: { label: c => ' ' + fmtVal(c.parsed.y, unit) } } }
      }
    });
  }

  function sparkline(canvas, values) {
    if (!window.Chart) return;
    new Chart(canvas, {
      type: 'line',
      data: { labels: values.map((_, i) => i), datasets: [{ data: values, borderColor: '#FFC549', backgroundColor: 'rgba(255,197,73,.22)', fill: true, tension: .35, borderWidth: 2, pointRadius: 0 }] },
      options: {
        responsive: true, maintainAspectRatio: false, animation: { duration: 1500 },
        scales: { x: { display: false }, y: { display: false } },
        plugins: { tooltip: { enabled: false } }, events: []
      }
    });
  }

  /* ---------- KPI cards ---------- */
  const KPIS = [
    { key: 'gdp', ind: 'NY.GDP.MKTP.CD', label: 'GDP', note: 'current US$', fmt: v => 'US$ ' + compact.format(v) },
    { key: 'growth', ind: 'NY.GDP.MKTP.KD.ZG', label: 'Real GDP growth', note: 'annual %', fmt: v => one.format(v) + '%' },
    { key: 'inflation', ind: 'FP.CPI.TOTL.ZG', label: 'Inflation', note: 'consumer prices', fmt: v => one.format(v) + '%' },
    { key: 'unemployment', ind: 'SL.UEM.TOTL.ZS', label: 'Unemployment', note: '% of labour force', fmt: v => one.format(v) + '%' },
    { key: 'population', ind: 'NE.POP.PLACEHOLDER', label: 'Population', note: 'total people', fmt: v => compact.format(v) }
  ];
  KPIS[4].ind = 'SP.POP.TOTL';

  async function loadKPIs() {
    const grid = $('kpi-grid');
    grid.innerHTML = KPIS.map(k => `
      <article class="kpi">
        <p class="kpi-label">${k.label}</p>
        <p class="kpi-value" id="kv-${k.key}">—</p>
        <p class="kpi-meta">${k.note} · <span id="ky-${k.key}">loading…</span></p>
        <div class="kpi-spark"><canvas id="ks-${k.key}"></canvas></div>
      </article>`).join('');

    const results = await Promise.allSettled(KPIS.map(k => ESC.wbSeries('BRN', k.ind)));
    const ticker = [];
    ESC.kpis = {};
    results.forEach((r, i) => {
      const k = KPIS[i];
      if (r.status !== 'fulfilled' || !r.value.length) { $('ky-' + k.key).textContent = 'unavailable'; return; }
      const s = r.value, last = s[s.length - 1], prev = s[s.length - 2];
      ESC.kpis[k.key] = { label: k.label, value: k.fmt(last.value), year: last.year };
      ESC.countTo($('kv-' + k.key), last.value, k.fmt);
      $('ky-' + k.key).textContent = last.year;
      sparkline($('ks-' + k.key), s.slice(-15).map(d => d.value));
      ticker.push({
        label: k.label + ' ', value: k.fmt(last.value) + ' (' + last.year + ')',
        dir: prev ? (last.value > prev.value ? 'up' : last.value < prev.value ? 'down' : 'flat') : 'flat'
      });
    });
    if (ticker.length) ESC.buildTicker(ticker);
    return results.some(r => r.status === 'fulfilled');
  }

  /* ---------- Charts ---------- */
  const CHARTS = [
    { id: 'chart-growth', ind: 'NY.GDP.MKTP.KD.ZG', unit: '%' },
    { id: 'chart-inflation', ind: 'FP.CPI.TOTL.ZG', unit: '%', bar: true },
    { id: 'chart-gdppc', ind: 'NY.GDP.PCAP.CD', unit: 'US$' },
    { id: 'chart-oil', ind: 'NY.GDP.PETR.RT.ZS', unit: '%' },
    { id: 'chart-unemp', ind: 'SL.UEM.TOTL.ZS', unit: '%' }
  ];

  async function loadCharts() {
    const results = await Promise.allSettled(CHARTS.map(c => ESC.wbSeries('BRN', c.ind)));
    results.forEach((r, i) => {
      if (r.status === 'fulfilled' && r.value.length) seriesChart(CHARTS[i].id, r.value.slice(-30), CHARTS[i]);
    });
    await loadPeers().catch(() => {});
    return results.some(r => r.status === 'fulfilled');
  }

  async function loadPeers() {
    const rows = (await ESC.wbLatest(['BRN', 'SGP', 'MYS', 'THA', 'IDN', 'VNM', 'PHL', 'KHM', 'LAO'], 'NY.GDP.PCAP.CD'))
      .sort((a, b) => b.value - a.value);
    const el = $('chart-peers');
    if (!el || !window.Chart || !rows.length) return;
    if (charts['chart-peers']) charts['chart-peers'].destroy();
    charts['chart-peers'] = new Chart(el, {
      type: 'bar',
      data: {
        labels: rows.map(r => `${r.name} (${r.year})`),
        datasets: [{ data: rows.map(r => r.value), backgroundColor: rows.map(r => r.code === 'BRN' ? AMBER : MAROON), borderColor: MAROON, borderWidth: rows.map(r => r.code === 'BRN' ? 2 : 0), borderRadius: 6 }]
      },
      options: {
        indexAxis: 'y', responsive: true, maintainAspectRatio: false,
        animation: { duration: 1300, easing: 'easeOutQuart' },
        scales: { x: { grid: { color: 'rgba(98,22,13,.08)' }, ticks: { callback: v => compact.format(v) } }, y: { grid: { display: false } } },
        plugins: { tooltip: { callbacks: { label: c => ' US$ ' + zero.format(c.parsed.x) } } }
      }
    });
  }

  /* ---------- Orchestrate (load when the section scrolls into view) ---------- */
  const status = $('dash-status');
  async function loadAll() {
    status.hidden = true;
    const [kOk, cOk] = await Promise.all([loadKPIs(), loadCharts()]);
    if (!kOk && !cOk) {
      status.hidden = false;
      status.innerHTML = '<span>Couldn’t reach the World Bank data service. Check your connection and try again.</span><button class="btn btn-outline btn-small" id="dash-retry" type="button">Retry</button>';
      $('dash-retry').addEventListener('click', loadAll);
    }
  }

  const section = $('dashboard');
  if (section) {
    let started = false;
    const start = () => { if (!started) { started = true; loadAll(); } };
    new IntersectionObserver((entries, io) => {
      if (entries.some(e => e.isIntersecting)) { start(); io.disconnect(); }
    }, { rootMargin: '300px 0px' }).observe(section);
    // load KPIs/ticker early so the top-of-page ticker fills in too
    setTimeout(start, 1200);
  }
})();
