/* Regression lab UI (maths lives in stats.js) */
(() => {
  'use strict';
  const C = window.ESC_CONFIG || {};
  const ESC = (window.ESC = window.ESC || {});
  const S = window.ESCStats;
  const $ = id => document.getElementById(id);
  if (!$('reg-run') || !S) return;

  let chart = null, last = null;

  /* ---------- Tabs ---------- */
  document.querySelectorAll('.tab').forEach(tab => tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t === tab));
    $('tab-paste').hidden = tab.dataset.tab !== 'paste';
    $('tab-wb').hidden = tab.dataset.tab !== 'wb';
  }));

  /* ---------- World Bank loader ---------- */
  C.countries.forEach(([c, n]) => $('wb-country').add(new Option(n, c)));
  C.indicators.forEach(i => { $('wb-x').add(new Option(i.label, i.id)); $('wb-y').add(new Option(i.label, i.id)); });
  $('wb-country').value = 'BRN';
  $('wb-x').value = 'NY.GDP.PCAP.CD';
  $('wb-y').value = 'SL.UEM.TOTL.ZS';

  $('wb-run').addEventListener('click', async () => {
    const st = $('wb-status'), country = $('wb-country').value;
    const xi = $('wb-x').value, yi = $('wb-y').value;
    if (xi === yi) { st.textContent = 'Please choose two different indicators.'; return; }
    st.textContent = 'Loading…';
    try {
      const [sx, sy] = await Promise.all([ESC.wbSeries(country, xi), ESC.wbSeries(country, yi)]);
      const my = new Map(sy.map(d => [d.year, d.value]));
      const pairs = sx.filter(d => my.has(d.year)).map(d => [d.value, my.get(d.year)]);
      if (pairs.length < 3) throw new Error('fewer than 3 overlapping years');
      $('reg-data').value = pairs.map(p => p.join(', ')).join('\n');
      $('reg-xname').value = C.indicators.find(i => i.id === xi).label;
      $('reg-yname').value = C.indicators.find(i => i.id === yi).label;
      st.textContent = `Loaded ${pairs.length} matched years. Switch to “Paste data” to see or edit them.`;
      run();
    } catch (err) {
      st.textContent = 'Couldn’t load that data (' + err.message + ').';
    }
  });

  /* ---------- Parsing ---------- */
  function parse(text) {
    const rows = [];
    text.split(/\r?\n/).forEach(line => {
      const parts = line.trim().split(/[\s,;\t]+/).filter(Boolean);
      if (parts.length < 2) return;
      const x = parseFloat(parts[0]), y = parseFloat(parts[1]);
      if (Number.isFinite(x) && Number.isFinite(y)) rows.push([x, y]);
    });
    return rows;
  }

  const sig = (v, d = 4) => {
    if (!Number.isFinite(v)) return String(v);
    if (v === 0) return '0';
    const a = Math.abs(v);
    return (a >= 1e5 || a < 1e-3) ? v.toExponential(2) : String(Math.round(v * 10 ** d) / 10 ** d);
  };
  const pfmt = p => p < 0.0001 ? '< 0.0001' : p.toFixed(4);
  const stars = p => p < 0.01 ? '***' : p < 0.05 ? '**' : p < 0.1 ? '*' : '';

  function message(text, error) {
    const m = $('reg-msg');
    m.textContent = text; m.classList.toggle('error', !!error);
    m.hidden = false; $('reg-results').hidden = true;
  }

  /* ---------- Run ---------- */
  function run() {
    const form = $('reg-form').value;
    const xn = $('reg-xname').value.trim() || 'X', yn = $('reg-yname').value.trim() || 'Y';
    const raw = parse($('reg-data').value);
    const lnX = form === 'lnx' || form === 'log', lnY = form === 'lny' || form === 'log';

    let rows = raw, dropped = 0;
    if (lnX || lnY) {
      rows = raw.filter(([x, y]) => (!lnX || x > 0) && (!lnY || y > 0));
      dropped = raw.length - rows.length;
    }
    if (rows.length < 3) { message(dropped ? 'Log forms need positive values — too few valid rows remain.' : 'Please enter at least 3 valid “x, y” pairs.', true); return; }

    const tx = rows.map(r => lnX ? Math.log(r[0]) : r[0]);
    const ty = rows.map(r => lnY ? Math.log(r[1]) : r[1]);
    let res;
    try { res = S.ols(tx, ty); } catch (e) { message(e.message, true); return; }
    last = { res, form, xn, yn, lnX, lnY, rows, tx, ty, dropped };

    const X = lnX ? `ln(${xn})` : xn, Y = lnY ? `ln(${yn})` : yn;
    const sign = res.b1 < 0 ? '−' : '+';
    $('reg-eq').textContent = `${Y} = ${sig(res.b0)} ${sign} ${sig(Math.abs(res.b1))} × ${X}`;

    const tiles = [
      ['Slope (b)', sig(res.b1), `SE ${sig(res.seB1)} ${stars(res.p1)}`],
      ['p-value (slope)', pfmt(res.p1), `t = ${sig(res.t1, 3)}`],
      ['R²', sig(res.r2, 4), `adj. ${sig(res.adjR2, 4)}`],
      ['Intercept (a)', sig(res.b0), `SE ${sig(res.seB0)}`],
      ['Observations', String(res.n), `df = ${res.df}`],
      ['95% CI (slope)', `${sig(res.ci1[0], 3)} to ${sig(res.ci1[1], 3)}`, `σ̂ = ${sig(res.sigma, 3)}`]
    ];
    $('reg-stats').innerHTML = tiles.map(([k, v, s]) => `<div class="stat"><small>${k}</small><b>${v}</b><span>${s}</span></div>`).join('');

    // plain-English reading
    const b = res.b1, mag = sig(Math.abs(b), 3), dir = b >= 0 ? 'higher' : 'lower';
    let reading;
    if (form === 'lin') reading = `Each 1-unit increase in ${xn} is associated with a ${mag} unit ${dir} ${yn}, on average.`;
    else if (form === 'lnx') reading = `A 1% increase in ${xn} is associated with about a ${sig(Math.abs(b) / 100, 3)} unit ${dir} ${yn}.`;
    else if (form === 'lny') reading = `Each 1-unit increase in ${xn} is associated with about a ${sig(Math.abs(b) * 100, 3)}% ${b >= 0 ? 'increase' : 'decrease'} in ${yn}.`;
    else reading = `Elasticity: a 1% increase in ${xn} is associated with about a ${sig(Math.abs(b), 3)}% ${b >= 0 ? 'increase' : 'decrease'} in ${yn}.`;
    const verdict = res.p1 < 0.05
      ? `The slope is statistically significant at the 5% level (p ${res.p1 < 0.0001 ? '< 0.0001' : '= ' + res.p1.toFixed(4)}).`
      : `The slope is not statistically significant at the 5% level (p = ${res.p1.toFixed(4)}), so the data can’t rule out no relationship.`;
    $('reg-interp').innerHTML = `<strong>In plain English:</strong> ${reading} ${verdict} ` +
      `<em>This shows association, not causation.</em>` +
      (dropped ? ` <em>${dropped} row(s) with non-positive values were skipped for the log transform.</em>` : '');

    // chart
    if (chart) chart.destroy();
    const xs = tx, minX = Math.min(...xs), maxX = Math.max(...xs);
    chart = new Chart($('reg-chart'), {
      type: 'scatter',
      data: {
        datasets: [
          { label: 'Data', data: tx.map((x, i) => ({ x, y: ty[i] })), backgroundColor: '#FFC549', borderColor: '#62160d', borderWidth: 1.5, pointRadius: 6, pointHoverRadius: 8 },
          { label: 'Fitted line', type: 'line', data: [{ x: minX, y: res.b0 + res.b1 * minX }, { x: maxX, y: res.b0 + res.b1 * maxX }], borderColor: '#62160d', borderWidth: 3, pointRadius: 0, fill: false }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false, animation: { duration: 900 },
        scales: {
          x: { title: { display: true, text: X }, grid: { color: 'rgba(98,22,13,.08)' } },
          y: { title: { display: true, text: Y }, grid: { color: 'rgba(98,22,13,.08)' } }
        },
        plugins: { legend: { display: true, labels: { usePointStyle: true } } }
      }
    });

    $('reg-msg').hidden = true;
    $('reg-results').hidden = false;
    predict();
  }

  /* ---------- Prediction ---------- */
  function predict() {
    const out = $('reg-pred-out'), v = parseFloat($('reg-pred-x').value);
    if (!last || !Number.isFinite(v)) { out.textContent = ''; return; }
    if (last.lnX && v <= 0) { out.textContent = 'X must be positive for this form.'; return; }
    const x = last.lnX ? Math.log(v) : v;
    let y = last.res.b0 + last.res.b1 * x;
    if (last.lnY) y = Math.exp(y);
    out.textContent = '→ predicted ' + last.yn + ' ≈ ' + sig(y, 4);
  }
  $('reg-pred-x').addEventListener('input', predict);

  /* ---------- Buttons ---------- */
  $('reg-run').addEventListener('click', run);
  $('reg-form').addEventListener('change', () => { if ($('reg-data').value.trim()) run(); });

  $('reg-sample').addEventListener('click', () => {
    $('reg-xname').value = 'Income (B$ thousand)';
    $('reg-yname').value = 'Consumption (B$ thousand)';
    $('reg-data').value = '10, 9\n15, 12.5\n20, 15.8\n25, 18.6\n30, 22.9\n35, 25.1\n40, 28.8\n45, 31.2\n50, 35.6\n55, 38.1';
    $('reg-form').value = 'lin';
    run();
  });
  $('reg-clear').addEventListener('click', () => {
    $('reg-data').value = ''; $('reg-pred-x').value = '';
    if (chart) { chart.destroy(); chart = null; }
    last = null;
    message('Run a regression to see your results here.', false);
  });

  $('reg-copy').addEventListener('click', async () => {
    if (!last) return;
    const { res, xn, yn } = last;
    const text = `Regression of ${yn} on ${xn} (n = ${res.n})\n${$('reg-eq').textContent}\n` +
      `slope = ${sig(res.b1)} (SE ${sig(res.seB1)}, p = ${pfmt(res.p1)}), intercept = ${sig(res.b0)}, R² = ${sig(res.r2)}\n` +
      `95% CI for slope: ${sig(res.ci1[0], 3)} to ${sig(res.ci1[1], 3)}`;
    const btn = $('reg-copy');
    try { await navigator.clipboard.writeText(text); btn.textContent = 'Copied ✓'; }
    catch { btn.textContent = 'Copy failed'; }
    setTimeout(() => { btn.textContent = 'Copy summary'; }, 1800);
  });
})();
