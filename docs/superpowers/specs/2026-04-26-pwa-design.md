# Design — Make the SigMod Visualizer an installable PWA

**Date:** 2026-04-26
**Scope:** SigMod Visualizer (`index.html`, `style.css`, `script.js`)

## Goal

Turn the existing static site into a Progressive Web App so a phone user can
"Add to Home Screen" and run it full-screen, offline-capable, with no browser
chrome. Bare-minimum PWA only — no iOS-specific polish, no install button,
no splash screen, no gestures.

## Files

**New (2 source + 2 user-provided assets):**

- `manifest.json` (site root) — Web App Manifest
- `sw.js` (site root) — service worker
- `icon-192.png` (site root) — *user provides*, 192×192
- `icon-512.png` (site root) — *user provides*, 512×512

**Modified (1):**

- `index.html` — add manifest link, theme-color meta, and an inline service-worker registration script

## `manifest.json`

```json
{
  "name": "SigMod Visualizer",
  "short_name": "SigMod",
  "description": "Interactive visualizer for AM, FM, PM, ASK, FSK, PSK modulation.",
  "start_url": "./index.html",
  "scope": "./",
  "display": "standalone",
  "orientation": "any",
  "background_color": "#f4f6f9",
  "theme_color": "#2563eb",
  "icons": [
    { "src": "icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

Color choices reuse existing CSS:
- `background_color` matches `--bg` in light mode (`#f4f6f9`) — shown on the
  splash before the first paint.
- `theme_color` matches `--primary` (`#2563eb`) — used by Android for the
  status bar tint.

## `sw.js`

Cache-first strategy. Pre-caches the seven assets (root URL + 3 source
files + manifest + 2 icons) on `install`; serves from cache on `fetch` and
falls back to network. Versioned cache name so a future release that bumps
`CACHE_VERSION` evicts the old cache on activation.

```javascript
const CACHE_VERSION = 'sigmod-v1';
const PRECACHE = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
```

`'./'` is included in `PRECACHE` so navigations to the bare URL also work
offline (some servers serve `index.html` from `/` only at runtime).

## `index.html` changes

Two additions to `<head>` (right after the existing `<link rel="stylesheet">`):

```html
<link rel="manifest" href="manifest.json" />
<meta name="theme-color" content="#2563eb" />
```

One inline `<script>` at the very end of `<body>` (after `<script src="script.js"></script>`):

```html
<script>
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => { /* SW unavailable; app still works online */ });
    });
  }
</script>
```

The `catch` swallows errors silently — service workers fail on `file://` and
on insecure origins; we don't want a console error to scare anyone reading
the page.

## Out of scope

Explicitly NOT included in this design:
- Apple-specific meta tags (`apple-mobile-web-app-capable`, `apple-touch-icon`)
- iOS splash-screen images
- A custom "Install app" button (browsers show their own prompt)
- Push notifications, background sync, periodic sync
- Touch-target enlargement on sliders
- Swipe-between-tabs gesture
- Update-prompt UI ("a new version is available")
- Workbox or any other tooling — hand-rolled SW only

If iOS support feels poor after first install, the natural follow-up
(Option B from the brainstorm) is a separate spec.

## Constraints and gotchas

**Service workers require a secure context.** They will not register on
`file://` URLs. Local testing must use a server:
```
python -m http.server 8000
```
then visit `http://localhost:8000/`. `localhost` is treated as secure even
without HTTPS, so this is enough for development. Production deployment
must be over HTTPS.

**Caching is permanent until version bump.** Once `sw.js` registers, every
subsequent visit serves from cache first. Editing `index.html`, `style.css`,
or `script.js` and reloading will *not* show the new version until
`CACHE_VERSION` is bumped (e.g., `'sigmod-v2'`). For active development,
either (a) bump the version per change, or (b) toggle "Update on reload" in
DevTools → Application → Service Workers.

**The 192/512 PNG icons must exist at the named paths** before the manifest
is loaded; otherwise the install prompt is suppressed by the browser.

## Verification

Manual:

1. Start a local server (`python -m http.server 8000`).
2. Open `http://localhost:8000/` in Chrome.
3. DevTools → Application → Manifest: confirms manifest loaded, icons
   resolve, no errors.
4. DevTools → Application → Service Workers: confirms `sw.js` is "activated
   and running."
5. DevTools → Network → check "Offline" → reload: page still renders fully.
6. Chrome's address bar shows an "Install" icon; clicking installs the PWA.
   Launching from the OS app drawer shows the page in a standalone window
   with no browser chrome and the blue theme color in the title bar.
7. On Android Chrome (over LAN or via deployed HTTPS): "Add to Home
   Screen" produces an installable app.

## Future follow-ups (not in this spec)

- iOS-specific meta tags + apple-touch-icon (separate spec, "Option B")
- Touch UX polish (separate spec, "Option C")
- Auto-deploy pipeline to GitHub Pages or Netlify so the PWA is publicly
  reachable over HTTPS
