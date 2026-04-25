# SigMod Visualizer

An interactive **Signal Modulation Dashboard** for Electronics & Communication Engineering students. Visualize the six classical modulation schemes — **AM, FM, PM, ASK, FSK, PSK** — in real time as you tune carrier frequency, message frequency, and modulation index.

Built as a zero-dependency, single-page web app. Open `index.html` in any modern browser and it just works.

## Features

- **Six modulation schemes** — three analog (AM, FM, PM) and three digital (ASK, FSK, PSK) under one tabbed UI.
- **Live waveform rendering** — message m(t), carrier c(t), and modulated output s(t) drawn on HTML5 canvas at native pixel density.
- **Three interactive sliders** — carrier freq (5–20 Hz), message freq (1–5 Hz), modulation index (0.1–1.0). Everything updates in real time on every input.
- **Live metric cards** — instantaneous readout of fc, fm, m, and computed bandwidth.
- **Equation panel** — mathematical expression for the active scheme, in monospace.
- **Light / dark mode** — follows the OS preference by default. Footer toggle cycles `system → light → dark → system`, choice persisted in `localStorage`.
- **Mobile responsive** — CSS grid `auto-fit minmax` re-flows cards and controls on small screens.
- **Zero dependencies** — pure HTML / CSS / JavaScript. No build step. No frameworks. No external libraries.

## Tech stack

- **HTML5** — semantic structure
- **CSS** — custom properties for theming, grid layout, monospace typography
- **Vanilla JavaScript (ES2015+)** — signal math, canvas drawing, event handlers
- **HTML5 Canvas API** — waveform rendering with `devicePixelRatio` scaling

## Run locally

Just open `index.html` in any modern browser. No server. No build step.

If you prefer serving over HTTP (some browsers restrict file:// in subtle ways):

```sh
# pick whichever you have installed
python -m http.server 8000
# or
npx serve .
```

Then visit <http://localhost:8000>.

## Deploy on GitHub Pages

1. Push this repository to GitHub.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, set:
   - **Source**: `Deploy from a branch`
   - **Branch**: `main` (or whichever branch holds the code), folder: `/ (root)`
4. Save. Your site publishes at `https://<username>.github.io/<repo-name>/` within a minute.

All paths in this project are relative, so it works whether served from the root domain or a subpath.

## Signal definitions

| Scheme | Output s(t)                                    | Bandwidth         |
|--------|------------------------------------------------|-------------------|
| AM     | `[1 + m·cos(2π·fₘ·t)] · cos(2π·fc·t)`          | `2·fₘ`            |
| FM     | `cos(2π·fc·t + m·sin(2π·fₘ·t))`                | `2·(m·fₘ + fₘ)`   |
| PM     | `cos(2π·fc·t + m·cos(2π·fₘ·t))`                | `2·(m+1)·fₘ`      |
| ASK    | `A(t) · cos(2π·fc·t),  A(t) ∈ {0,1}`           | `2·fₘ`            |
| FSK    | `cos(2π·[fc ± Δf]·t),  Δf = fₘ`                | `4·fₘ`            |
| PSK    | `cos(2π·fc·t + φ),  φ ∈ {0, π}`                | `2·fₘ`            |

For digital schemes, bits are paced at **fₘ bits per second** using the pseudo-random pattern `10110100`.

## Project structure

```
sigmod-visualizer/
├── index.html       semantic markup
├── style.css        theme variables, grid layout, responsive rules
├── script.js        signal math, canvas drawing, event handlers
├── README.md        this file
└── docs/superpowers/specs/2026-04-25-sigmod-visualizer-design.md
```

## License

MIT — free to use, modify, and adapt for coursework, learning, and projects.
