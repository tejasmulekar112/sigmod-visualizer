# Design — Expose full signal-processing parameter set

**Date:** 2026-04-25
**Scope:** SigMod Visualizer dashboard (`index.html`, `style.css`, `script.js`)

## Goal

Extend the dashboard's control panel from 3 sliders (`fc`, `fm`, `m`) to the
textbook-complete set of parameters that govern the six modulation schemes
(AM, FM, PM, ASK, FSK, PSK) plus the sampling and channel parameters that
turn the demo into a faithful DSP playground.

## Final parameter set (9 sliders)

| Slider | Label | Range | Default | Role |
|---|---|---|---|---|
| `Ac` | Carrier amplitude | 0.1 – 2.0 | 1.0 | scales `c(t)` and final `s(t)` |
| `fc` | Carrier frequency | 5 – 20 Hz | 10 | *unchanged from current* |
| `Am` | Message amplitude | 0.1 – 2.0 | 1.0 | scales `m(t)` (and AM/ASK envelope) |
| `fm` | Message frequency / bit rate | 1 – 10 Hz | 2 | *range widened from current 1–5* |
| `DC` | Message DC offset | −1.0 – 1.0 | 0.0 | toggles DSB-SC vs full-carrier AM; ignored by FM/PM/FSK/PSK |
| `m` | Modulation strength (per-scheme) | 0 – 1 | 0.5 | unified knob, see "Per-scheme `m` mapping" |
| `T` | Time window | 0.5 – 3.0 s | 1.0 | how many seconds of waveform are drawn |
| `Fs` | Sampling rate | 20 – 1000 sps | 200 | actual discrete sample rate; below `2·fc` shows aliasing (min is 20 so users can drop below Nyquist for any reachable `fc`) |
| `SNR` | Channel SNR | 5 – 40 dB | 30 | Gaussian noise added to `s(t)` only |

Phase offsets `φc`, `φm` are explicitly **out of scope** — they are visually
indistinguishable from small time shifts and add clutter without pedagogical
value.

## Per-scheme `m` mapping

`m` is a unified 0–1 strength knob whose label and effect change per tab:

| Scheme | Label shown | Effect of `m` |
|---|---|---|
| AM | modulation index `m` | classic AM: `(1 + m · message) · carrier` |
| FM | modulation index `β` | `β_eff = m · 5`, used in `cos(2π·fc·t + β_eff·sin(2π·fm·t))` |
| PM | phase deviation `kp` | `kp_eff = m · π`, used in `cos(2π·fc·t + kp_eff·cos(2π·fm·t))` |
| ASK | amplitude ratio | low-state amplitude `= (1 − m)`. m=1 is OOK |
| FSK | freq separation `Δf` | `Δf = m · fm`. m=0 collapses both tones onto fc |
| PSK | phase shift `Δφ` | bit 1 → phase `m · π`, bit 0 → phase 0. m=1 is BPSK |

Bandwidth metric formulas keep their current shape but use the new `m`:

- AM, ASK, PSK: `BW = 2 · fm`
- FM: `BW = 2 · (β_eff + 1) · fm` (Carson's rule, with `β_eff = 5m`)
- PM: `BW = 2 · (kp_eff + 1) · fm` (with `kp_eff = π·m`)
- FSK: `BW = 2 · (Δf + fm) = 2 · fm · (1 + m)`

## Math changes per scheme

All schemes' `output(t, p)` are scaled by `Ac`. `Am` and `DC` enter only where
they are physically meaningful:

- **AM** — `s(t) = Ac · (1 + m · (Am · cos(2π·fm·t) + DC)) · cos(2π·fc·t) / (1 + m · (Am + |DC|))` (denominator keeps peak in 80% band)
- **FM** — `s(t) = Ac · cos(2π·fc·t + (5m) · sin(2π·fm·t))`
- **PM** — `s(t) = Ac · cos(2π·fc·t + (π·m) · cos(2π·fm·t))`
- **ASK** — bit `b ∈ {0,1}`; envelope `= b · Am + (1 − b) · Am · (1 − m)`; `s(t) = Ac · envelope · cos(2π·fc·t)`
- **FSK** — `f = fc + (2b − 1) · m · fm`; `s(t) = Ac · cos(2π·f·t)`
- **PSK** — `φ = b · m · π`; `s(t) = Ac · cos(2π·fc·t + φ)`

`message(t, p)` and `carrier(t, p)` get `Am` and `Ac` scaling respectively;
`message` for AM/ASK adds the `DC` term.

## Sampling & rendering

The current renderer draws `N = 2·w` "continuous-feel" samples over `t ∈ [0, 1]`.
Replace with a discrete sampling model:

```
N = max(2, round(Fs · T))
sample i in [0..N]:  t_i = (i / N) · T
plot polyline through (x_i, y_i) where x_i = (t_i / T) · w
```

This is applied to **all three canvases** (message, carrier, output) so the
sampling effect is visible everywhere, not just on the modulated signal.
When `Fs < 2 · fc`, the carrier polyline visibly breaks — the aliasing demo.

## Noise model

For each output sample after computing `s_i`:

```
σ² = mean(s_i²) / 10^(SNR/10)        # computed once per render
n_i = sqrt(σ²) · z_i                  # z_i ~ N(0, 1) via Box–Muller
y_i = s_i + n_i
```

Noise is **only** added to the output canvas. Message and carrier are noise-free.
Box–Muller is implemented inline (two uniforms `→` one normal); no external lib.

## UI layout

`.controls` (currently one card with a CSS auto-fit grid) splits into two cards:

1. **Signal** card — `Ac, fc, Am, fm, DC, m` (6 sliders)
2. **DSP & channel** card — `T, Fs, SNR` (3 sliders)

Each card uses the existing `.control` styling unchanged. The `.controls`
class becomes a wrapper holding two `.control-card` children, each with its
own `.control-card-title` (small uppercase mono label matching the existing
`.metric-label` style) and its own auto-fit grid of `.control` items.

The metric-cards row is unchanged — still 4 cards (`fc`, `fm`, modulation
strength, `BW`). The third card's label, symbol, and **displayed value**
update per tab so what's shown is the scheme's natural parameter rather than
the raw `m`:

| Tab | Card label | Symbol | Value displayed |
|---|---|---|---|
| AM | Modulation index | `m` | `m` (0.00–1.00) |
| FM | Modulation index | `β` | `5m` (0.0–5.0) |
| PM | Phase deviation | `kp` | `π·m` rad (0.00–3.14) |
| ASK | Amplitude ratio | `A1/A0` | when m<1: `1/(1−m)`; when m=1: `∞` (OOK) |
| FSK | Freq separation | `Δf` | `m·fm` Hz |
| PSK | Phase shift | `Δφ` | `π·m` rad |

The equation card text per scheme is updated to reflect `Ac`, `Am`, and `DC`
where relevant (AM equation gains the `DC` term explicitly).

## State shape

```
state = {
  mod: 'AM',      // unchanged
  fc:  10,        // unchanged
  fm:  2,         // unchanged
  m:   0.5,       // unchanged
  ac:  1.0,       // new
  am:  1.0,       // new
  dc:  0.0,       // new
  tw:  1.0,       // new (time window in seconds)
  fs:  200,       // new (sampling rate)
  snr: 30,        // new (SNR in dB)
}
```

All new sliders wire identically to the existing three: `input` event →
mutate the corresponding state field → call `render()`.

## Out of scope

- Carrier and message phase offsets (`φc`, `φm`) — low pedagogical value.
- Bit-pattern editor — the current 8-bit pseudo-random pattern stays fixed.
- Non-Gaussian noise types.
- Demodulation / receive-side processing.
- Any new tests or test harness — repo currently has none.
- `package.json`, build tooling, or framework migration — vanilla JS stays.

## Verification

Manual, visual:

1. Open `index.html` in a browser. Default render matches the current page (modulo the new sliders being present and at defaults that produce identical output to today).
2. Sweep each new slider through its range on each of the 6 tabs and confirm the waveforms respond as expected:
   - `Ac` scales output amplitude on every scheme.
   - `Am` scales the message canvas on every scheme; affects envelope on AM/ASK only.
   - `DC` shifts the message canvas baseline; on AM, makes the modulated wave asymmetric (DSB-SC at DC = −1 with m = 1).
   - `T` changes how many cycles fit on screen.
   - `Fs` below `2·fc` shows visible aliasing on the carrier and output canvases.
   - `SNR = 5` shows obvious noise; `SNR = 40` shows almost none.
   - `m` reinterpretation produces the documented per-scheme effect.
3. Toggle theme; confirm new cards inherit theming correctly.
4. Resize the window; confirm the two new control cards reflow without overlap.
