/* ============================================================
   SigMod Visualizer — signal math, canvas drawing, event wiring.
   Vanilla ES2015+. No external libraries.
   ============================================================ */

(function () {
  'use strict';

  const TWO_PI = Math.PI * 2;
  const BIT_PATTERN = [1, 0, 1, 1, 0, 1, 0, 0]; // 8-bit pseudo-random

  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  // Bit value at time t (seconds, 0..1) given fm bits-per-second pacing.
  function bitAt(t, fm) {
    const idx = Math.floor(t * fm) % BIT_PATTERN.length;
    return BIT_PATTERN[idx];
  }

  // Each scheme: message/carrier/output return values nominally in [-1, 1].
  const SIGNALS = {
    AM: {
      message: (t, p) => Math.cos(TWO_PI * p.fm * t),
      carrier: (t, p) => Math.cos(TWO_PI * p.fc * t),
      // Normalize by (1+m) so peak magnitude stays within the 80% amplitude band.
      output:  (t, p) => ((1 + p.m * Math.cos(TWO_PI * p.fm * t)) * Math.cos(TWO_PI * p.fc * t)) / (1 + p.m),
      equation: 's(t) = [1 + m·cos(2π·fₘ·t)] · cos(2π·fc·t)',
      bandwidth: (p) => 2 * p.fm,
    },
    FM: {
      message: (t, p) => Math.cos(TWO_PI * p.fm * t),
      carrier: (t, p) => Math.cos(TWO_PI * p.fc * t),
      output:  (t, p) => Math.cos(TWO_PI * p.fc * t + p.m * Math.sin(TWO_PI * p.fm * t)),
      equation: 's(t) = cos(2π·fc·t + m·sin(2π·fₘ·t))',
      bandwidth: (p) => 2 * (p.m * p.fm + p.fm),
    },
    PM: {
      message: (t, p) => Math.cos(TWO_PI * p.fm * t),
      carrier: (t, p) => Math.cos(TWO_PI * p.fc * t),
      output:  (t, p) => Math.cos(TWO_PI * p.fc * t + p.m * Math.cos(TWO_PI * p.fm * t)),
      equation: 's(t) = cos(2π·fc·t + m·cos(2π·fₘ·t))',
      bandwidth: (p) => 2 * (p.m + 1) * p.fm,
    },
    ASK: {
      message: (t, p) => bitAt(t, p.fm) ? 1 : -1,
      carrier: (t, p) => Math.cos(TWO_PI * p.fc * t),
      output:  (t, p) => bitAt(t, p.fm) * Math.cos(TWO_PI * p.fc * t),
      equation: 's(t) = A(t) · cos(2π·fc·t),  A(t) ∈ {0, 1}',
      bandwidth: (p) => 2 * p.fm,
    },
    FSK: {
      message: (t, p) => bitAt(t, p.fm) ? 1 : -1,
      carrier: (t, p) => Math.cos(TWO_PI * p.fc * t),
      output:  (t, p) => {
        const f = bitAt(t, p.fm) ? (p.fc + p.fm) : (p.fc - p.fm);
        return Math.cos(TWO_PI * f * t);
      },
      equation: 's(t) = cos(2π·[fc ± Δf]·t),  Δf = fₘ',
      bandwidth: (p) => 4 * p.fm,
    },
    PSK: {
      message: (t, p) => bitAt(t, p.fm) ? 1 : -1,
      carrier: (t, p) => Math.cos(TWO_PI * p.fc * t),
      output:  (t, p) => {
        const phi = bitAt(t, p.fm) ? 0 : Math.PI;
        return Math.cos(TWO_PI * p.fc * t + phi);
      },
      equation: 's(t) = cos(2π·fc·t + φ),  φ ∈ {0, π}',
      bandwidth: (p) => 2 * p.fm,
    },
  };

  const state = { mod: 'AM', fc: 10, fm: 2, m: 0.5 };

  const dom = {
    tabs:           document.querySelectorAll('.tab'),
    sliderFc:       document.getElementById('slider-fc'),
    sliderFm:       document.getElementById('slider-fm'),
    sliderM:        document.getElementById('slider-m'),
    valueFc:        document.getElementById('value-fc'),
    valueFm:        document.getElementById('value-fm'),
    valueM:         document.getElementById('value-m'),
    metricFc:       document.getElementById('metric-fc'),
    metricFm:       document.getElementById('metric-fm'),
    metricM:        document.getElementById('metric-m'),
    metricBw:       document.getElementById('metric-bw'),
    canvasMessage:  document.getElementById('canvas-message'),
    canvasCarrier:  document.getElementById('canvas-carrier'),
    canvasOutput:   document.getElementById('canvas-output'),
    equation:       document.getElementById('equation'),
    themeToggle:    document.getElementById('theme-toggle'),
  };

  // Configure canvas backing store for sharp rendering on retina displays.
  function setupCanvas(canvas) {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.floor(rect.width));
    const h = Math.max(1, Math.floor(rect.height));
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w, h };
  }

  function drawWaveform(canvas, color, valueAt) {
    const { ctx, w, h } = setupCanvas(canvas);
    ctx.clearRect(0, 0, w, h);

    // Center axis.
    ctx.strokeStyle = cssVar('--axis') || '#d4d7dc';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();

    // Waveform.
    const N = Math.max(2, Math.floor(w * 2));
    const amp = (h / 2) * 0.8;
    ctx.strokeStyle = color || '#000';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const x = t * w;
      const y = h / 2 - valueAt(t) * amp;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  function render() {
    const sig = SIGNALS[state.mod];
    const params = { fc: state.fc, fm: state.fm, m: state.m };

    // Slider numeric labels.
    dom.valueFc.textContent = state.fc;
    dom.valueFm.textContent = state.fm;
    dom.valueM.textContent  = state.m.toFixed(2);

    // Metric cards.
    dom.metricFc.textContent = state.fc;
    dom.metricFm.textContent = state.fm;
    dom.metricM.textContent  = state.m.toFixed(2);
    dom.metricBw.textContent = sig.bandwidth(params).toFixed(1);

    // Equation.
    dom.equation.textContent = sig.equation;

    // Tab active state.
    dom.tabs.forEach((btn) => {
      const active = btn.dataset.mod === state.mod;
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });

    // Waveforms.
    drawWaveform(dom.canvasMessage, cssVar('--teal'),   (t) => sig.message(t, params));
    drawWaveform(dom.canvasCarrier, cssVar('--blue'),   (t) => sig.carrier(t, params));
    drawWaveform(dom.canvasOutput,  cssVar('--purple'), (t) => sig.output(t, params));
  }

  // ---- Wire events ----------------------------------------------------------

  dom.sliderFc.addEventListener('input', (e) => { state.fc = +e.target.value; render(); });
  dom.sliderFm.addEventListener('input', (e) => { state.fm = +e.target.value; render(); });
  dom.sliderM.addEventListener('input',  (e) => { state.m  = +e.target.value; render(); });

  dom.tabs.forEach((btn) => {
    btn.addEventListener('click', () => {
      state.mod = btn.dataset.mod;
      render();
    });
  });

  // ---- Theme toggle ---------------------------------------------------------
  // Cycles system → light → dark → system. Persists in localStorage.

  const THEME_KEY = 'sigmod-theme';

  function applyTheme(mode) {
    if (mode === 'light' || mode === 'dark') {
      document.documentElement.setAttribute('data-theme', mode);
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }

  function nextTheme(curr) {
    return curr === 'system' ? 'light' : curr === 'light' ? 'dark' : 'system';
  }

  let theme = localStorage.getItem(THEME_KEY) || 'system';
  applyTheme(theme);

  dom.themeToggle.addEventListener('click', () => {
    theme = nextTheme(theme);
    localStorage.setItem(THEME_KEY, theme);
    applyTheme(theme);
    render(); // recolor canvases against new CSS-var palette
  });

  // Re-render canvases when system theme flips, but only if user hasn't pinned a theme.
  if (window.matchMedia) {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => { if (theme === 'system') render(); };
    if (mq.addEventListener) mq.addEventListener('change', handler);
    else if (mq.addListener) mq.addListener(handler);
  }

  // ---- Resize (debounced) ---------------------------------------------------

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(render, 50);
  });

  // Initial paint after layout settles.
  requestAnimationFrame(render);
})();
