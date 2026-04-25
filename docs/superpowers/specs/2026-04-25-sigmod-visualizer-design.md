---
title: SigMod Visualizer — Design Spec
date: 2026-04-25
status: approved
---

# SigMod Visualizer — Design Spec

## Overview

An interactive Signal Modulation Dashboard for Electronics & Communication
Engineering students. Visualizes the six classical modulation schemes
(AM, FM, PM, ASK, FSK, PSK) with live-rendered waveforms responding to
slider changes in real time.

Single-page web application. Zero dependencies. Opens directly in a browser.
GitHub Pages ready.

## Layout

Top-to-bottom sections:

1. **Top bar** — brand `SigMod Visualizer` + waveform SVG icon, subtitle
   `ECE mini-project`, green `Live rendering` status pill on the right.
2. **Modulation tab switcher** — two pill-button groups labeled `ANALOG`
   (AM, FM, PM) and `DIGITAL` (ASK, FSK, PSK), separated by a vertical
   divider. Active tab highlighted in the primary blue.
3. **Metric cards row** — 4 cards: carrier freq (fc), message freq (fm),
   modulation index (m), bandwidth. CSS-grid `auto-fit minmax(180px, 1fr)`.
4. **Slider controls row** — 3 sliders: fc (5–20 Hz), fm (1–5 Hz),
   m (0.1–1.0). Each shows a live numeric value.
5. **Three waveform canvases** stacked: m(t) teal, c(t) blue, s(t) purple.
   Output canvas has a blue-tinted background and accent border.
6. **Equation card** — monospace expression for the active modulation.
7. **Footer** — credits left, theme-toggle action button right.

## Signal math

| Scheme | Output s(t)                                  | Bandwidth        |
|--------|----------------------------------------------|------------------|
| AM     | `[1 + m·cos(2π·fₘ·t)] · cos(2π·fc·t)`        | `2·fₘ`           |
| FM     | `cos(2π·fc·t + m·sin(2π·fₘ·t))`              | `2·(m·fₘ + fₘ)`  |
| PM     | `cos(2π·fc·t + m·cos(2π·fₘ·t))`              | `2·(m+1)·fₘ`     |
| ASK    | `A(t) · cos(2π·fc·t),  A(t) ∈ {0, 1}`        | `2·fₘ`           |
| FSK    | `cos(2π·[fc ± Δf]·t),  Δf = fₘ`              | `4·fₘ`           |
| PSK    | `cos(2π·fc·t + φ),  φ ∈ {0, π}`              | `2·fₘ`           |

## Canvas rendering

- HTML5 Canvas API only — no Chart.js, no library.
- `devicePixelRatio` scaling for sharp rendering on retina displays.
- Center axis line drawn before each waveform.
- Sample count `N = canvas_width × 2` across `t ∈ [0, 1]`.
- Amplitude scaled to 80% of half canvas height.
- Re-render on every slider input, tab switch, theme change, and resize.

## File structure

```
sigmod-visualizer/
├── index.html       semantic markup
├── style.css        CSS variables (light + dark), responsive grid
├── script.js        signal math, canvas drawing, event handlers
├── README.md        project info + GitHub Pages deploy steps
└── docs/superpowers/specs/2026-04-25-sigmod-visualizer-design.md
```

## Resolved interpretation decisions

- **Project location:** `C:\Users\tejas\projects\sigmod-visualizer\`
- **Footer button:** theme toggle. Cycles `system → light → dark → system`,
  persisted in `localStorage` under key `sigmod-theme`. Triangle/half-moon
  glyph + label.
- **Default state on load:** active tab `AM`; sliders fc=10, fm=2, m=0.5.
- **Digital bit pacing:** bit duration = `1/fm` seconds (so the message-
  frequency slider also controls bit-rate). Pattern: `10110100` (8-bit
  pseudo-random). Indexed by `floor(t·fm) mod 8`.
- **Digital message canvas:** rendered as a NRZ ±1 square wave for visual
  consistency across ASK/FSK/PSK.
- **AM normalization:** divide AM output by `(1+m)` so the modulated
  waveform always fits within the 80% amplitude band regardless of m.
- **Color palette:** blue/teal/purple primary set. Dark mode via
  `prefers-color-scheme` with `[data-theme="light|dark"]` manual override.
- **No build step / no server required:** all paths relative; works
  whether served from filesystem or GitHub Pages subpath.

## Constraints

- Zero external JS libraries.
- Zero CSS frameworks. No gradients. No shadows.
- All colors via CSS variables.
- Mobile responsive via CSS grid `auto-fit minmax`.
- Monospace font for labels, values, equations.
