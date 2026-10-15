/* Small statistics library — simple OLS regression with t-tests.
   No dependencies. Works in the browser (window.ESCStats) and in Node (for testing). */
(function (root) {
  'use strict';

  const mean = a => a.reduce((s, v) => s + v, 0) / a.length;

  // log-gamma (Lanczos approximation)
  function lgamma(x) {
    const c = [76.18009172947146, -86.50532032941677, 24.01409824083091,
      -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
    let y = x, tmp = x + 5.5;
    tmp -= (x + 0.5) * Math.log(tmp);
    let ser = 1.000000000190015;
    for (let j = 0; j < 6; j++) { y += 1; ser += c[j] / y; }
    return -tmp + Math.log(2.5066282746310005 * ser / x);
  }

  // continued fraction for the incomplete beta function
  function betacf(a, b, x) {
    const MAXIT = 300, EPS = 3e-12, FPMIN = 1e-300;
    const qab = a + b, qap = a + 1, qam = a - 1;
    let c = 1, d = 1 - qab * x / qap;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    d = 1 / d;
    let h = d;
    for (let m = 1; m <= MAXIT; m++) {
      const m2 = 2 * m;
      let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
      c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d; h *= d * c;
      aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
      c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d;
      const del = d * c; h *= del;
      if (Math.abs(del - 1) < EPS) break;
    }
    return h;
  }

  // regularised incomplete beta I_x(a, b)
  function ibeta(x, a, b) {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    const bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
    if (x < (a + 1) / (a + b + 2)) return bt * betacf(a, b, x) / a;
    return 1 - bt * betacf(b, a, 1 - x) / b;
  }

  // two-sided p-value for a t statistic with df degrees of freedom
  function tTwoSidedP(t, df) {
    if (!Number.isFinite(t)) return 0;
    return ibeta(df / (df + t * t), df / 2, 0.5);
  }

  // critical t value for a two-sided test at significance level alpha
  function tCrit(df, alpha) {
    alpha = alpha || 0.05;
    let lo = 0, hi = 1000;
    for (let i = 0; i < 200; i++) {
      const mid = (lo + hi) / 2;
      if (tTwoSidedP(mid, df) > alpha) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  }

  // simple linear regression y = b0 + b1 x
  function ols(x, y) {
    const n = x.length;
    if (n !== y.length) throw new Error('X and Y must have the same length.');
    if (n < 3) throw new Error('Please provide at least 3 data points.');
    const mx = mean(x), my = mean(y);
    let sxx = 0, sxy = 0, syy = 0;
    for (let i = 0; i < n; i++) {
      const dx = x[i] - mx, dy = y[i] - my;
      sxx += dx * dx; sxy += dx * dy; syy += dy * dy;
    }
    if (sxx === 0) throw new Error('All X values are identical, so a line cannot be fitted.');
    const b1 = sxy / sxx, b0 = my - b1 * mx;
    const resid = [];
    let sse = 0;
    for (let i = 0; i < n; i++) {
      const e = y[i] - (b0 + b1 * x[i]);
      resid.push(e); sse += e * e;
    }
    const df = n - 2, sigma2 = sse / df;
    const seB1 = Math.sqrt(sigma2 / sxx);
    const seB0 = Math.sqrt(sigma2 * (1 / n + mx * mx / sxx));
    const tOf = (b, se) => se === 0 ? (b === 0 ? 0 : Infinity) : b / se;
    const t1 = tOf(b1, seB1), t0 = tOf(b0, seB0);
    const p1 = seB1 === 0 && b1 === 0 ? 1 : tTwoSidedP(t1, df);
    const p0 = seB0 === 0 && b0 === 0 ? 1 : tTwoSidedP(t0, df);
    const r2 = syy === 0 ? 1 : 1 - sse / syy;
    const tc = tCrit(df, 0.05);
    return {
      n, df, mx, my, b0, b1, seB0, seB1, t0, t1, p0, p1, r2,
      adjR2: 1 - (1 - r2) * (n - 1) / df,
      r: syy === 0 ? 0 : sxy / Math.sqrt(sxx * syy),
      sigma: Math.sqrt(sigma2),
      ci1: [b1 - tc * seB1, b1 + tc * seB1],
      resid
    };
  }

  const api = { mean, ols, tTwoSidedP, tCrit, ibeta, lgamma };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ESCStats = api;
})(typeof window !== 'undefined' ? window : globalThis);
