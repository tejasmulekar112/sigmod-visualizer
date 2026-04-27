# Full Signal-Processing Parameter Set — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the SigMod Visualizer's control panel from 3 sliders to the full 9-slider textbook parameter set (Ac, fc, Am, fm, DC, m, T, Fs, SNR), with `m` reinterpreted per-tab and Fs operating as a real sampling rate so dropping below Nyquist demonstrates aliasing.

**Architecture:** Pure additive changes to three files — `index.html`, `style.css`, `script.js`. Math edits are localized to the `SIGNALS` table; rendering is updated in `drawWaveform`; one new helper for Box–Muller Gaussian noise. No new files, no framework changes, no tests (repo has no test harness — verification is visual per the spec).

**Tech Stack:** Vanilla HTML5/CSS/ES2015+ JavaScript. No build step. Open `index.html` in any modern browser.

**Spec:** [docs/superpowers/specs/2026-04-25-full-parameters-design.md](../specs/2026-04-25-full-parameters-design.md)

---

## How to verify each task

There is no test runner. After every task that changes runtime behavior, the engineer must:

1. Open `index.html` in a browser (a fresh load — `Ctrl+Shift+R` to bypass cache).
2. Run the **Verification** steps listed at the bottom of that task.
3. Only commit if every check passes.

For Windows engineers: `start index.html` from a cmd shell opens the default browser. On any OS, double-clicking the file works because everything is a static asset (`file://` is fine — no fetch calls).

---

## Task 1: Extend state, add new sliders to the DOM, wire events

**Files:**
- Modify: `index.html` (the `.controls` section, lines 66–91)
- Modify: `script.js` (state, dom refs, event listeners — lines 75–94, 168–179)

The control panel currently holds three sliders inside a single `.controls` card. This task splits it into two cards (`Signal` and `DSP & channel`), adds six new sliders at their default values, extends the `state` object, adds DOM refs, and wires the new sliders to `render()`. Math is **unchanged** — defaults are picked so output looks identical to the current page.

### - [ ] Step 1: Replace the `.controls` section in `index.html`

In `index.html`, replace the entire block from the opening `<section class="controls" ...>` (line 66) through its closing `</section>` (line 91) with:

```html
    <section class="controls" aria-label="Signal parameters">
      <div class="control-card">
        <div class="control-card-title">Signal</div>
        <div class="control-grid">
          <div class="control">
            <div class="control-head">
              <label for="slider-ac">Carrier amplitude</label>
              <span class="control-value"><span id="value-ac">1.00</span></span>
            </div>
            <input id="slider-ac" type="range" min="0.1" max="2.0" step="0.05" value="1.0" />
            <div class="control-range"><span>0.1</span><span>2.0</span></div>
          </div>
          <div class="control">
            <div class="control-head">
              <label for="slider-fc">Carrier frequency</label>
              <span class="control-value"><span id="value-fc">10</span> Hz</span>
            </div>
            <input id="slider-fc" type="range" min="5" max="20" step="1" value="10" />
            <div class="control-range"><span>5</span><span>20</span></div>
          </div>
          <div class="control">
            <div class="control-head">
              <label for="slider-am">Message amplitude</label>
              <span class="control-value"><span id="value-am">1.00</span></span>
            </div>
            <input id="slider-am" type="range" min="0.1" max="2.0" step="0.05" value="1.0" />
            <div class="control-range"><span>0.1</span><span>2.0</span></div>
          </div>
          <div class="control">
            <div class="control-head">
              <label for="slider-fm">Message frequency</label>
              <span class="control-value"><span id="value-fm">2</span> Hz</span>
            </div>
            <input id="slider-fm" type="range" min="1" max="10" step="1" value="2" />
            <div class="control-range"><span>1</span><span>10</span></div>
          </div>
          <div class="control">
            <div class="control-head">
              <label for="slider-dc">Message DC offset</label>
              <span class="control-value"><span id="value-dc">0.00</span></span>
            </div>
            <input id="slider-dc" type="range" min="-1.0" max="1.0" step="0.05" value="0.0" />
            <div class="control-range"><span>-1.0</span><span>1.0</span></div>
          </div>
          <div class="control">
            <div class="control-head">
              <label for="slider-m"><span id="label-m">Modulation index</span></label>
              <span class="control-value"><span id="value-m">0.50</span></span>
            </div>
            <input id="slider-m" type="range" min="0" max="1.0" step="0.05" value="0.5" />
            <div class="control-range"><span>0</span><span>1.0</span></div>
          </div>
        </div>
      </div>
      <div class="control-card">
        <div class="control-card-title">DSP &amp; channel</div>
        <div class="control-grid">
          <div class="control">
            <div class="control-head">
              <label for="slider-tw">Time window</label>
              <span class="control-value"><span id="value-tw">1.00</span> s</span>
            </div>
            <input id="slider-tw" type="range" min="0.5" max="3.0" step="0.1" value="1.0" />
            <div class="control-range"><span>0.5</span><span>3.0</span></div>
          </div>
          <div class="control">
            <div class="control-head">
              <label for="slider-fs">Sampling rate</label>
              <span class="control-value"><span id="value-fs">200</span> sps</span>
            </div>
            <input id="slider-fs" type="range" min="20" max="1000" step="10" value="200" />
            <div class="control-range"><span>20</span><span>1000</span></div>
          </div>
          <div class="control">
            <div class="control-head">
              <label for="slider-snr">SNR</label>
              <span class="control-value"><span id="value-snr">30</span> dB</span>
            </div>
            <input id="slider-snr" type="range" min="5" max="40" step="1" value="30" />
            <div class="control-range"><span>5</span><span>40</span></div>
          </div>
        </div>
      </div>
    </section>
```

### - [ ] Step 2: Add `.control-card` styling to `style.css`

In `style.css`, find the existing `.controls` block (line 302 area). Replace just the `.controls` rule with these three rules — keep `.control`, `.control-head`, `input[type="range"]`, etc. exactly as they are:

```css
.controls {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.control-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px 20px 20px;
}

.control-card-title {
  font-family: var(--mono);
  font-size: 11px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 12px;
}

.control-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
}
```

Also update the mobile responsive block at the bottom of the file. Replace the `.controls { padding: 16px; gap: 16px; }` line inside `@media (max-width: 640px)` with:

```css
  .controls { gap: 12px; }
  .control-card { padding: 14px 16px 16px; }
  .control-grid { gap: 16px; }
```

### - [ ] Step 3: Extend the `state` object in `script.js`

In `script.js`, find the line `const state = { mod: 'AM', fc: 10, fm: 2, m: 0.5 };` (line 75) and replace it with:

```javascript
  const state = {
    mod: 'AM',
    fc: 10, fm: 2, m: 0.5,
    ac: 1.0, am: 1.0, dc: 0.0,
    tw: 1.0, fs: 200, snr: 30,
  };
```

### - [ ] Step 4: Extend the `dom` lookup table in `script.js`

In `script.js`, find the `const dom = { ... };` block (lines 77–94) and replace it with:

```javascript
  const dom = {
    tabs:           document.querySelectorAll('.tab'),

    sliderAc:       document.getElementById('slider-ac'),
    sliderFc:       document.getElementById('slider-fc'),
    sliderAm:       document.getElementById('slider-am'),
    sliderFm:       document.getElementById('slider-fm'),
    sliderDc:       document.getElementById('slider-dc'),
    sliderM:        document.getElementById('slider-m'),
    sliderTw:       document.getElementById('slider-tw'),
    sliderFs:       document.getElementById('slider-fs'),
    sliderSnr:      document.getElementById('slider-snr'),

    valueAc:        document.getElementById('value-ac'),
    valueFc:        document.getElementById('value-fc'),
    valueAm:        document.getElementById('value-am'),
    valueFm:        document.getElementById('value-fm'),
    valueDc:        document.getElementById('value-dc'),
    valueM:         document.getElementById('value-m'),
    valueTw:        document.getElementById('value-tw'),
    valueFs:        document.getElementById('value-fs'),
    valueSnr:       document.getElementById('value-snr'),

    labelM:         document.getElementById('label-m'),

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
```

### - [ ] Step 5: Wire event listeners and update slider value labels in `render()`

In `script.js`, find the existing `render()` function. In its body, find the section that begins `// Slider numeric labels.` and replace those three lines (`dom.valueFc.textContent = ...`, etc.) with:

```javascript
    // Slider numeric labels.
    dom.valueAc.textContent  = state.ac.toFixed(2);
    dom.valueFc.textContent  = state.fc;
    dom.valueAm.textContent  = state.am.toFixed(2);
    dom.valueFm.textContent  = state.fm;
    dom.valueDc.textContent  = state.dc.toFixed(2);
    dom.valueM.textContent   = state.m.toFixed(2);
    dom.valueTw.textContent  = state.tw.toFixed(2);
    dom.valueFs.textContent  = state.fs;
    dom.valueSnr.textContent = state.snr;
```

Then find the three existing `addEventListener` lines (currently `dom.sliderFc...`, `dom.sliderFm...`, `dom.sliderM...`) and replace them with:

```javascript
  dom.sliderAc.addEventListener('input',  (e) => { state.ac  = +e.target.value; render(); });
  dom.sliderFc.addEventListener('input',  (e) => { state.fc  = +e.target.value; render(); });
  dom.sliderAm.addEventListener('input',  (e) => { state.am  = +e.target.value; render(); });
  dom.sliderFm.addEventListener('input',  (e) => { state.fm  = +e.target.value; render(); });
  dom.sliderDc.addEventListener('input',  (e) => { state.dc  = +e.target.value; render(); });
  dom.sliderM.addEventListener('input',   (e) => { state.m   = +e.target.value; render(); });
  dom.sliderTw.addEventListener('input',  (e) => { state.tw  = +e.target.value; render(); });
  dom.sliderFs.addEventListener('input',  (e) => { state.fs  = +e.target.value; render(); });
  dom.sliderSnr.addEventListener('input', (e) => { state.snr = +e.target.value; render(); });
```

### - [ ] Step 6: Verify in browser

Open `index.html`. Expected:

- The page loads with no JavaScript console errors.
- The control area now shows two stacked cards titled **Signal** (6 sliders: Ac, fc, Am, fm, DC, m) and **DSP & channel** (3 sliders: T, Fs, SNR).
- The waveforms render exactly as before (defaults match prior behavior — math is unchanged).
- Moving any of the new sliders updates its number display next to the label. Output waveforms do not yet respond to the new sliders (math will be wired up in later tasks); existing fc/fm/m sliders still work.

### - [ ] Step 7: Commit

```bash
git add index.html style.css script.js
git commit -m "feat: add 6 new parameter sliders and split controls into two cards"
```

---

## Task 2: Wire `Ac`, `Am`, `DC`, and the `m` reinterpretation into AM / FM / PM

**Files:**
- Modify: `script.js` — the `SIGNALS.AM`, `SIGNALS.FM`, `SIGNALS.PM` entries (lines 24–45)

After this task, all three analog tabs respond to the new sliders. Bandwidth metrics use the new `m` mapping (β=5m for FM, kp=π·m for PM).

### - [ ] Step 1: Replace the AM, FM, PM blocks in `SIGNALS`

In `script.js`, locate the `const SIGNALS = { ... }` table. Replace the **AM**, **FM**, and **PM** entries (top three blocks) with:

```javascript
    AM: {
      message: (t, p) => p.am * Math.cos(TWO_PI * p.fm * t) + p.dc,
      carrier: (t, p) => p.ac * Math.cos(TWO_PI * p.fc * t),
      output:  (t, p) => {
        const env = 1 + p.m * (p.am * Math.cos(TWO_PI * p.fm * t) + p.dc);
        const norm = 1 + p.m * (p.am + Math.abs(p.dc));
        return p.ac * (env / norm) * Math.cos(TWO_PI * p.fc * t);
      },
      equation: 's(t) = Ac · [1 + m·(Am·cos(2π·fₘ·t) + DC)] · cos(2π·fc·t)',
      bandwidth: (p) => 2 * p.fm,
    },
    FM: {
      message: (t, p) => p.am * Math.cos(TWO_PI * p.fm * t),
      carrier: (t, p) => p.ac * Math.cos(TWO_PI * p.fc * t),
      output:  (t, p) => {
        const beta = 5 * p.m;
        return p.ac * Math.cos(TWO_PI * p.fc * t + beta * Math.sin(TWO_PI * p.fm * t));
      },
      equation: 's(t) = Ac · cos(2π·fc·t + β·sin(2π·fₘ·t)),  β = 5m',
      bandwidth: (p) => 2 * (5 * p.m + 1) * p.fm,
    },
    PM: {
      message: (t, p) => p.am * Math.cos(TWO_PI * p.fm * t),
      carrier: (t, p) => p.ac * Math.cos(TWO_PI * p.fc * t),
      output:  (t, p) => {
        const kp = Math.PI * p.m;
        return p.ac * Math.cos(TWO_PI * p.fc * t + kp * Math.cos(TWO_PI * p.fm * t));
      },
      equation: 's(t) = Ac · cos(2π·fc·t + kp·cos(2π·fₘ·t)),  kp = π·m',
      bandwidth: (p) => 2 * (Math.PI * p.m + 1) * p.fm,
    },
```

### - [ ] Step 2: Update the `params` object passed to signal functions

In `script.js`, inside `render()`, find the line:

```javascript
    const params = { fc: state.fc, fm: state.fm, m: state.m };
```

Replace it with:

```javascript
    const params = {
      fc: state.fc, fm: state.fm, m: state.m,
      ac: state.ac, am: state.am, dc: state.dc,
    };
```

### - [ ] Step 3: Verify in browser

Open `index.html` and select the **AM** tab. Expected:

- Sliding `Ac` from 0.1 → 2.0 visibly scales the output amplitude.
- Sliding `Am` changes the depth of the AM envelope.
- Sliding `DC` from 0 toward −1 (with `m = 1`, `Am = 1`) makes the envelope cross zero — a DSB-SC-like waveform.
- Bandwidth metric stays at `2·fm` (unchanged for AM).

Switch to **FM**:

- `Ac` scales the output.
- `Am` no longer affects FM output (it only scales the displayed message canvas).
- `m` slider now spans `β` from 0 → 5; at `m = 1` the FM output looks visibly more "spread."
- Bandwidth metric updates by Carson's rule.

Switch to **PM**:

- Similar `Ac` scaling.
- `m = 1` produces phase deviation up to π radians.

### - [ ] Step 4: Commit

```bash
git add script.js
git commit -m "feat: wire Ac/Am/DC and per-tab m mapping into AM/FM/PM math"
```

---

## Task 3: Wire `Ac`, `Am`, and the `m` reinterpretation into ASK / FSK / PSK

**Files:**
- Modify: `script.js` — the `SIGNALS.ASK`, `SIGNALS.FSK`, `SIGNALS.PSK` entries (lines 46–72)

### - [ ] Step 1: Replace the ASK, FSK, PSK blocks in `SIGNALS`

In `script.js`, replace the existing **ASK**, **FSK**, **PSK** entries with:

```javascript
    ASK: {
      message: (t, p) => p.am * (bitAt(t, p.fm) ? 1 : -1),
      carrier: (t, p) => p.ac * Math.cos(TWO_PI * p.fc * t),
      output:  (t, p) => {
        const b = bitAt(t, p.fm);
        const envelope = b ? p.am : p.am * (1 - p.m);
        return p.ac * envelope * Math.cos(TWO_PI * p.fc * t);
      },
      equation: 's(t) = Ac · A(t) · cos(2π·fc·t),  A∈{Am, Am·(1−m)}',
      bandwidth: (p) => 2 * p.fm,
    },
    FSK: {
      message: (t, p) => p.am * (bitAt(t, p.fm) ? 1 : -1),
      carrier: (t, p) => p.ac * Math.cos(TWO_PI * p.fc * t),
      output:  (t, p) => {
        const deltaF = p.m * p.fm;
        const f = bitAt(t, p.fm) ? (p.fc + deltaF) : (p.fc - deltaF);
        return p.ac * Math.cos(TWO_PI * f * t);
      },
      equation: 's(t) = Ac · cos(2π·[fc ± Δf]·t),  Δf = m·fₘ',
      bandwidth: (p) => 2 * p.fm * (1 + p.m),
    },
    PSK: {
      message: (t, p) => p.am * (bitAt(t, p.fm) ? 1 : -1),
      carrier: (t, p) => p.ac * Math.cos(TWO_PI * p.fc * t),
      output:  (t, p) => {
        const phi = bitAt(t, p.fm) ? p.m * Math.PI : 0;
        return p.ac * Math.cos(TWO_PI * p.fc * t + phi);
      },
      equation: 's(t) = Ac · cos(2π·fc·t + φ),  φ ∈ {0, m·π}',
      bandwidth: (p) => 2 * p.fm,
    },
```

### - [ ] Step 2: Verify in browser

Open `index.html`, select the **ASK** tab:

- `Ac` scales output. `Am` scales the message-canvas bipolar bitstream and the envelope of the modulated output.
- With `m = 1`: low bits collapse to zero amplitude (true OOK).
- With `m = 0`: output is a pure carrier (no modulation).

**FSK** tab:

- With `m = 0`: both bits map to `fc` (no separation — output looks like a continuous carrier).
- With `m = 1`: max separation `Δf = fm`; you can see two visibly different frequencies in the output.

**PSK** tab:

- With `m = 0`: no phase shift between bits (output is pure carrier).
- With `m = 1`: full π phase shift on bit 1 (BPSK).

### - [ ] Step 3: Commit

```bash
git add script.js
git commit -m "feat: wire Ac/Am and per-tab m mapping into ASK/FSK/PSK math"
```

---

## Task 4: Replace continuous render with `Fs`/`T`-based discrete sampling

**Files:**
- Modify: `script.js` — `drawWaveform()` and the three `drawWaveform` calls in `render()` (lines 109–136, 162–166)

The current renderer draws `N = 2 · w` "continuous-feel" samples over `t ∈ [0, 1]`. Replace with `N = max(2, round(Fs · T))` samples over `t ∈ [0, T]`. Below `Fs = 2·fc`, the output polyline visibly aliases.

### - [ ] Step 1: Replace `drawWaveform` to take `fs` and `tw`

In `script.js`, replace the entire `drawWaveform` function with:

```javascript
  function drawWaveform(canvas, color, valueAt, fs, tw) {
    const { ctx, w, h } = setupCanvas(canvas);
    ctx.clearRect(0, 0, w, h);

    // Center axis.
    ctx.strokeStyle = cssVar('--axis') || '#d4d7dc';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();

    // Discrete samples at the user-selected sampling rate Fs over time window tw.
    const N = Math.max(2, Math.round(fs * tw));
    const amp = (h / 2) * 0.8;
    ctx.strokeStyle = color || '#000';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    for (let i = 0; i <= N; i++) {
      const t = (i / N) * tw;
      const x = (i / N) * w;
      const y = h / 2 - valueAt(t) * amp;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
```

### - [ ] Step 2: Update the three `drawWaveform` calls in `render()`

In `script.js`, find the three `drawWaveform(...)` calls at the bottom of `render()` and replace them with:

```javascript
    // Waveforms.
    drawWaveform(dom.canvasMessage, cssVar('--teal'),   (t) => sig.message(t, params), state.fs, state.tw);
    drawWaveform(dom.canvasCarrier, cssVar('--blue'),   (t) => sig.carrier(t, params), state.fs, state.tw);
    drawWaveform(dom.canvasOutput,  cssVar('--purple'), (t) => sig.output(t, params),  state.fs, state.tw);
```

### - [ ] Step 3: Verify in browser

Open `index.html`. Expected:

- Default waveforms still look smooth (`Fs=200, T=1` gives 200 samples — plenty for `fc≤20`).
- Sliding `T` from 1.0 → 3.0 packs more cycles onto the canvas (you see more of each waveform horizontally).
- Sliding `Fs` down toward 50 with `fc=10`: still looks clean (5× Nyquist). Drop `Fs` to 20 (= 2·fc, exactly Nyquist) and the carrier looks ambiguous; bump `fc` up to 15 with `Fs=20` and you should see an obvious low-frequency aliased waveform on the carrier and output canvases. With `fc=20, Fs=20` (1× per cycle) aliasing is severe.
- All six tabs should respond consistently to `Fs` and `T`.

### - [ ] Step 4: Commit

```bash
git add script.js
git commit -m "feat: render canvases at user-selected Fs over time window T"
```

---

## Task 5: Add Box–Muller Gaussian noise to the output canvas

**Files:**
- Modify: `script.js` — add `drawNoisyWaveform()` helper, swap the output canvas's `drawWaveform` call

Noise is added to `s(t)` only. `σ² = signal_power / 10^(SNR/10)`, `signal_power = mean(s²)` over the visible window. Two-pass algorithm: gather samples, compute power, then redraw with noise added.

### - [ ] Step 1: Add `drawNoisyWaveform` helper

In `script.js`, add this function immediately after `drawWaveform()`:

```javascript
  // Box–Muller: two uniforms in (0,1] -> one standard-normal sample.
  function gaussian() {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(TWO_PI * v);
  }

  // Like drawWaveform, but adds Gaussian noise sized by SNR (in dB) computed
  // from the actual signal power over the visible window.
  function drawNoisyWaveform(canvas, color, valueAt, fs, tw, snrDb) {
    const { ctx, w, h } = setupCanvas(canvas);
    ctx.clearRect(0, 0, w, h);

    ctx.strokeStyle = cssVar('--axis') || '#d4d7dc';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();

    const N = Math.max(2, Math.round(fs * tw));
    const samples = new Array(N + 1);
    let power = 0;
    for (let i = 0; i <= N; i++) {
      const t = (i / N) * tw;
      const s = valueAt(t);
      samples[i] = s;
      power += s * s;
    }
    power /= (N + 1);
    const sigma = Math.sqrt(power / Math.pow(10, snrDb / 10));

    const amp = (h / 2) * 0.8;
    ctx.strokeStyle = color || '#000';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    for (let i = 0; i <= N; i++) {
      const x = (i / N) * w;
      const y = h / 2 - (samples[i] + sigma * gaussian()) * amp;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
```

### - [ ] Step 2: Use `drawNoisyWaveform` for the output canvas

In `script.js`, in `render()`, replace just the **output** canvas call (last of the three) with:

```javascript
    drawNoisyWaveform(dom.canvasOutput, cssVar('--purple'), (t) => sig.output(t, params), state.fs, state.tw, state.snr);
```

The message and carrier calls stay on the noise-free `drawWaveform`.

### - [ ] Step 3: Verify in browser

Open `index.html`. Expected:

- At `SNR = 40`, the output canvas looks visually identical to before (noise is negligible).
- At `SNR = 30` (default), noise is faintly visible as a slight thickening of the trace.
- At `SNR = 10`, noise is obvious — output is clearly fuzzier than message/carrier (which stay clean).
- At `SNR = 5`, noise dominates.
- Each render call produces fresh noise — you can see this by holding any other slider still and clicking on a tab; the noise pattern visibly changes.
- The message and carrier canvases remain perfectly clean at all SNR settings.

### - [ ] Step 4: Commit

```bash
git add script.js
git commit -m "feat: add Box-Muller Gaussian noise on the output canvas, controlled by SNR"
```

---

## Task 6: Per-tab metric card label, symbol, and value for the modulation strength

**Files:**
- Modify: `index.html` — the third metric card (the one labeled "Modulation index") at lines 54–58
- Modify: `script.js` — extend `SIGNALS` entries with `strength` config; update `render()`

The third metric card currently always shows "Modulation index / m / 0.50". After this task, it changes per tab to match the scheme's natural parameter (β for FM, kp for PM, etc.). The slider's label inside the Signal card also retitles.

### - [ ] Step 1: Update the third metric card markup

In `index.html`, find the metric card with `id="metric-m"` (currently labeled "Modulation index", lines 54–58). Replace the entire `<article>` with:

```html
      <article class="metric-card">
        <div class="metric-label" id="metric-m-label">Modulation index</div>
        <div class="metric-value"><span id="metric-m">0.50</span><span id="metric-m-unit" class="metric-unit"></span></div>
        <div class="metric-symbol" id="metric-m-symbol">m</div>
      </article>
```

### - [ ] Step 2: Add the new metric DOM refs in `script.js`

In `script.js`, in the `dom = { ... }` block, find the `metricM:` line and add two siblings right after it:

```javascript
    metricM:        document.getElementById('metric-m'),
    metricMLabel:   document.getElementById('metric-m-label'),
    metricMSymbol:  document.getElementById('metric-m-symbol'),
    metricMUnit:    document.getElementById('metric-m-unit'),
```

### - [ ] Step 3: Add a `strength` config to each `SIGNALS` entry

In `script.js`, extend each scheme's entry by adding a `strength` field. Append the field as the last property in each block (after `bandwidth`). The full set:

```javascript
    AM: {
      // ... existing fields ...
      strength: { sliderLabel: 'Modulation index', cardLabel: 'Modulation index', symbol: 'm',     unit: '',    value: (p) => p.m.toFixed(2) },
    },
    FM: {
      // ... existing fields ...
      strength: { sliderLabel: 'Modulation index', cardLabel: 'Modulation index', symbol: 'β',     unit: '',    value: (p) => (5 * p.m).toFixed(2) },
    },
    PM: {
      // ... existing fields ...
      strength: { sliderLabel: 'Phase deviation',  cardLabel: 'Phase deviation',  symbol: 'kp',    unit: 'rad', value: (p) => (Math.PI * p.m).toFixed(2) },
    },
    ASK: {
      // ... existing fields ...
      strength: { sliderLabel: 'Amplitude ratio',  cardLabel: 'Amplitude ratio',  symbol: 'A1/A0', unit: '',    value: (p) => p.m >= 0.999 ? '∞' : (1 / (1 - p.m)).toFixed(2) },
    },
    FSK: {
      // ... existing fields ...
      strength: { sliderLabel: 'Freq separation',  cardLabel: 'Freq separation',  symbol: 'Δf',    unit: 'Hz',  value: (p) => (p.m * p.fm).toFixed(2) },
    },
    PSK: {
      // ... existing fields ...
      strength: { sliderLabel: 'Phase shift',      cardLabel: 'Phase shift',      symbol: 'Δφ',    unit: 'rad', value: (p) => (Math.PI * p.m).toFixed(2) },
    },
```

(Important: don't delete or renumber any existing fields in those blocks — just append `strength` as one extra property to each.)

### - [ ] Step 4: Update `render()` to apply the strength config

In `script.js`, inside `render()`, find the line:

```javascript
    dom.metricM.textContent  = state.m.toFixed(2);
```

Replace that single line with this five-line block (which now drives the slider's label too):

```javascript
    const strength = sig.strength;
    dom.labelM.textContent       = strength.sliderLabel;
    dom.metricMLabel.textContent = strength.cardLabel;
    dom.metricMSymbol.textContent = strength.symbol;
    dom.metricMUnit.textContent  = strength.unit;
    dom.metricM.textContent      = strength.value(params);
```

### - [ ] Step 5: Verify in browser

Open `index.html`. Cycle through every tab and confirm the third metric card and the `m`-slider label both retitle:

| Tab | Slider label | Card label | Symbol | Sample value at m=0.5 |
|---|---|---|---|---|
| AM | Modulation index | Modulation index | `m` | `0.50` |
| FM | Modulation index | Modulation index | `β` | `2.50` |
| PM | Phase deviation | Phase deviation | `kp` | `1.57 rad` |
| ASK | Amplitude ratio | Amplitude ratio | `A1/A0` | `2.00` |
| FSK | Freq separation | Freq separation | `Δf` | `1.00 Hz` (with `fm=2`) |
| PSK | Phase shift | Phase shift | `Δφ` | `1.57 rad` |

Sliding `m` to 1.0 on the **ASK** tab should show `A1/A0 = ∞`.

### - [ ] Step 6: Commit

```bash
git add index.html script.js
git commit -m "feat: per-tab labels for the modulation-strength card and slider"
```

---

## Task 7: Final integration check

**Files:** none modified (verification only).

### - [ ] Step 1: Comprehensive walkthrough

Open `index.html` fresh (`Ctrl+Shift+R`). Run through this checklist; nothing here should produce a console error or visual glitch:

1. **AM, defaults**: waveform identical in shape to the pre-change page (envelope visible, normalized amplitude).
2. **AM, DC = -1, Am = 1, m = 1**: envelope goes negative (DSB-SC look — visible phase reversal).
3. **AM, Ac = 0.1**: output amplitude drops to ~10%.
4. **FM, m = 1**: visibly wideband — many sidebands' worth of "warble." Bandwidth metric reads ≈ `2·6·fm`.
5. **FM, m = 0**: output is pure carrier.
6. **PM, m = 1**: phase deviation up to π — output looks carrier-like but visibly modulated.
7. **ASK, m = 1**: low bits → zero amplitude (OOK).
8. **FSK, m = 1, fm = 2**: clearly two distinct frequencies in the output trace.
9. **PSK, m = 1**: visible π phase reversals at bit boundaries.
10. **Aliasing**: on **AM** with `fc = 20`, set `Fs = 30` → carrier and output traces look badly aliased; the message canvas stays clean (since `fm = 2` is well below Nyquist for `Fs = 30`).
11. **Time window**: `T = 3.0` shows 3× as many cycles per canvas as `T = 1.0`.
12. **SNR**: at `SNR = 5`, output is visibly fuzzy; message and carrier are not.
13. **Theme**: cycle the theme button (system → light → dark → system). Both new control cards inherit theming. New sliders work in all three modes.
14. **Resize**: shrink the window narrow (≤ 640 px). Both control cards reflow into a single column. No overflow or overlap.

### - [ ] Step 2: Tag the working build (optional)

If everything passes, tag the commit so it's easy to find later:

```bash
git tag full-parameters-v1
```

---

## Out of scope (per spec)

- Phase offsets `φc`, `φm`
- Bit-pattern editor — fixed 8-bit pattern stays
- Demodulation / receive-side processing
- Tests / test harness
- Build tooling, package.json, framework migration
