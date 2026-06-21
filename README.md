# Fretwise — Guitar Tutor

A warm, fast, offline-capable guitar tutor with **realistic plucked-string sound**.
Built with [Preact](https://preactjs.com/) + [Vite](https://vitejs.dev/), from a
design created in Claude Design.

### ▶ Live: **https://adamnolle.github.io/Guitar-Tutor/**

> Tap any fret, chord, or quiz answer to start the audio (browsers require a gesture
> before playing sound).

---

## Features

- **Fretboard** — tap any fret to hear it and see where it lands on the treble staff,
  or place a note on the staff to light up every spot it lives on the neck. Highlight any
  key & scale. Full-width desktop board and a phone-optimised vertical board.
- **Chord library** — open / 7th / power chords with finger diagrams, animated strum
  strips, chord-tone breakdowns, and common progressions you can play back.
- **Ear & fretboard trainer** — "name the note" and "find the note" drills with scoring,
  streaks, and rotating practice tips.
- **Metronome** — a sample-accurate Web Audio metronome with tap-tempo, time signatures
  (4/4, 3/4, 2/4, 6/8), quick tempos, and an accented downbeat.

## Under the hood

- **Realistic guitar synthesis** — a Karplus–Strong physical model with a guitar-body EQ
  chain, pluck-position comb filtering, a pick-attack transient, and a subtle convolution
  reverb. No samples; everything is synthesised live in the Web Audio API.
- **Staff notation** rendered with the [Bravura](https://github.com/steinbergmedia/bravura)
  SMuFL music font, **subset to the 4 glyphs used** (247 KB → 4.6 KB).
- **Tiny & fast** — ~72 KB of JS (Preact, not React) + 2 KB CSS, self-hosted preloaded
  fonts (no CDN round-trips), and a service worker for instant repeat loads and full
  offline use. Installable as a PWA.

## Accessibility

- **WCAG 2.1 AA** — audited with [axe-core](https://github.com/dequelabs/axe-core);
  **zero violations** across all four views (colour contrast, names/roles, landmarks).
- Keyboard accessible throughout: a **skip-to-content** link, logical focus order, visible
  `:focus-visible` rings, and Enter/Space activation on the interactive fretboards.
- Semantic landmarks (`header`/`nav`/`main`), a page `<h1>`, `aria-label`s on every SVG and
  control, `aria-pressed` on the tabs, and `aria-live` status updates in the ear trainer.
- Respects `prefers-reduced-motion`; every fret/chord/note carries a descriptive label for
  screen readers.

## Architecture

The original Claude Design ran on a React-based template runtime. Because Preact's
`Component` and `h()` are API-compatible with `React.Component`/`createElement`, the
design's entire engine — the audio synthesis, music theory, chord data, and SVG renderers —
is reused **verbatim** in [`src/logic.js`](src/logic.js) behind a small shim that adapts
React-style SVG attributes (`fontFamily` → `font-family`, etc.) for Preact. Only the JSX
view ([`src/Fretwise.jsx`](src/Fretwise.jsx)) and the metronome were authored fresh.

```
src/
  main.jsx                 # mount
  Fretwise.jsx             # JSX views (fretboard, chords, ear trainer) + tab shell
  logic.js                 # verbatim design engine: audio, theory, chords, staff, renderVals
  audio/metronome.js       # lookahead Web Audio scheduler
  components/Metronome.jsx # metronome UI
  styles.css               # global theme + a11y helpers
public/                    # fonts (self-hosted), icons, manifest, service worker
```

## Develop

```bash
npm install
npm run dev      # http://localhost:5173/Guitar-Tutor/
npm run build    # production build → dist/
npm run preview  # preview the production build
```

## Deploy (GitHub Pages)

Pushing to `main` runs [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml), which
builds the site and publishes `dist/` to GitHub Pages. The Vite `base` is `/Guitar-Tutor/`
to match the repo name; for a custom domain or root deploy, build with `BASE_PATH=/ npm run build`.

In the repo, set **Settings → Pages → Source** to **GitHub Actions** (already enabled here).

## Credits

Music font: [Bravura](https://github.com/steinbergmedia/bravura) by Steinberg (SIL OFL 1.1).
Built with [Preact](https://preactjs.com/) and [Vite](https://vitejs.dev/).
