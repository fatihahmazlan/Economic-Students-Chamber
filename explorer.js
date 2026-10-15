/* Data hub: indicator explorer + list of data sources */
(() => {
  'use strict';
  const C = window.ESC_CONFIG || {};
  const ESC = (window.ESC = window.ESC || {});
  const $ = id => document.getElementById(id);

  const selI = $('ex-indicator'), selA = $('ex-country'), selB = $('ex-compare');
  if (!selI) return;

  C.indicators.forEach(i => selI.add(new Option(i.label, i.id)));
  selB.add(new Option('— none —', ''));
  C.countries.forEach(([code, name]) => { selA.add(new Option(name, code)); selB.add(new Option(name, code)); });
  selA.value = 'BRN';

  const nameOf = code => (C.countries.find(c => c[0] === code) || [code, code])[1];
  const show = v => v === null || v === undefined ? '—' : Math.abs(v) >= 1000 ? Math.round(v).toLocaleString('en') : (Math.round(v * 100) / 100).toLocaleString('en');

  let chart = null, current = null;
  const status = $('ex-status'), csvBtn = $('ex-csv');

  async function run() {
    const ind = selI.value, a = selA.value, b = selB.value;
    status.textContent = 'Loading…';
    csvBtn.disabled = true;
    try {
      const [sa, sb] = await Promise.all([ESC.wbSeries(a, ind), b ? ESC.wbSeries(b, ind) : Promise.resolve(null)]);
      const ma = new Map(sa.map(d => [d.year, d.value]));
      const mb = sb ? new Map(sb.map(d => [d.year, d.value])) : null;
      const years = [...new Set([...ma.keys(), ...(mb ? mb.keys() : [])])].sort((x, y) => x - y);
      const rows = years.map(y => ({ year: y, a: ma.has(y) ? ma.get(y) : null, b: mb ? (mb.has(y) ? mb.get(y) : null) : null }));
      if (!rows.length) throw new Error('No data available for this selection.');
      current = { rows, ind, a, b };

      // chart
      if (chart) chart.destroy();
      const datasets = [{ label: nameOf(a), data: rows.map(r => r.a), borderColor: '#62160d', backgroundColor: 'rgba(98,22,13,.10)', fill: !b, tension: .3, borderWidth: 2.5, pointRadius: 0, pointHoverRadius: 5, spanGaps: true }];
      if (b) datasets.push({ label: nameOf(b), data: rows.map(r => r.b), borderColor: '#e8a600', backgroundColor: 'rgba(255,197,73,.2)', tension: .3, borderWidth: 2.5, pointRadius: 0, pointHoverRadius: 5, spanGaps: true });
      chart = new Chart($('ex-chart'), {
        type: 'line',
        data: { labels: rows.map(r => r.year), datasets },
        options: {
          responsive: true, maintainAspectRatio: false,
          animation: { duration: 1100, easing: 'easeOutQuart' },
          interaction: { mode: 'index', intersect: false },
          scales: { x: { grid: { display: false }, ticks: { maxTicksLimit: 10 } }, y: { grid: { color: 'rgba(98,22,13,.08)' }, ticks: { callback: v => Math.abs(v) >= 1e4 ? ESC.fmt.compact.format(v) : v } } },
          plugins: { legend: { display: !!b }, tooltip: { callbacks: { label: c => ` ${c.dataset.label}: ${show(c.parsed.y)}` } } }
        }
      });

      // table (latest 15 years first)
      const label = C.indicators.find(i => i.id === ind).label;
      const recent = rows.slice(-15).reverse();
      $('ex-table').innerHTML =
        `<thead><tr><th>Year</th><th>${nameOf(a)}</th>${b ? `<th>${nameOf(b)}</th>` : ''}</tr></thead><tbody>` +
        recent.map(r => `<tr><td>${r.year}</td><td>${show(r.a)}</td>${b ? `<td>${show(r.b)}</td>` : ''}</tr>`).join('') + '</tbody>';
      status.textContent = `${label} · ${nameOf(a)}${b ? ' vs ' + nameOf(b) : ''} · ${rows[0].year}–${rows[rows.length - 1].year}. Source: World Bank.`;
      csvBtn.disabled = false;
    } catch (err) {
      status.textContent = 'Couldn’t load that data (' + err.message + '). Try another indicator or country.';
    }
  }

  $('ex-run').addEventListener('click', run);
  [selI, selA, selB].forEach(s => s.addEventListener('change', run));

  csvBtn.addEventListener('click', () => {
    if (!current) return;
    const { rows, a, b, ind } = current;
    const head = ['year', nameOf(a), ...(b ? [nameOf(b)] : [])].map(s => `"${s}"`).join(',');
    const lines = rows.map(r => [r.year, r.a ?? '', ...(b ? [r.b ?? ''] : [])].join(','));
    const blob = new Blob([head + '\n' + lines.join('\n')], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `esc-${ind}-${a}${b ? '-vs-' + b : ''}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  });

  // first load when the section is near the viewport
  new IntersectionObserver((entries, io) => {
    if (entries.some(e => e.isIntersecting)) { run(); io.disconnect(); }
  }, { rootMargin: '300px 0px' }).observe($('data'));

  /* ---------- Sources ---------- */
  const grid = $('source-grid');
  const renderSources = filter => {
    grid.innerHTML = C.dataSources
      .filter(s => filter === 'all' || s.tag === filter)
      .map(s => `<a class="card source" href="${s.url}" target="_blank" rel="noopener">
          <span class="tag">${s.tag}</span><h4>${s.name}</h4><p>${s.desc}</p><span class="go">Open source ↗</span></a>`).join('');
  };
  renderSources('all');
  $('source-filter').addEventListener('click', e => {
    const btn = e.target.closest('.chip'); if (!btn) return;
    document.querySelectorAll('#source-filter .chip').forEach(c => c.classList.toggle('active', c === btn));
    renderSources(btn.dataset.filter);
  });
})();
