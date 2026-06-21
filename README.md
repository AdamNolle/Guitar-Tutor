<div align="center">

# Guitar Tutor

A warm, fast guitar tutor with realistic plucked-string sound.
Learn the fretboard, explore chords, train your ear, and keep time —
all in the browser, all offline-capable.

**[Open the live app →](https://adamnolle.github.io/Guitar-Tutor/)**

![Preact](https://img.shields.io/badge/Preact-10-673AB8?logo=preact&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![WCAG 2.1 AA](https://img.shields.io/badge/WCAG%202.1%20AA-0%20violations-2F8F5B)
![PWA](https://img.shields.io/badge/PWA-offline%20ready-5A4FCF)
![Bundle](https://img.shields.io/badge/bundle-~72%20KB%20JS-444)

</div>

> Tap any fret, chord, or quiz answer to begin — browsers require a gesture before audio can play.

---

## Features

| Section | What it does |
| --- | --- |
| **Fretboard** | Tap a fret to hear it and see it on the treble staff, or place a note on the staff to light up every spot it lives on the neck. Highlight any key and scale. Includes a phone-optimised vertical board. |
| **Chord library** | Open, 7th, and power chords with finger diagrams, animated strum strips, chord-tone breakdowns, and common progressions you can play back. |
| **Ear & fretboard trainer** | "Name the note" and "find the note" drills with scoring, streaks, and rotating practice tips. |
| **Metronome** | A sample-accurate Web Audio metronome with tap-tempo, time signatures (4/4, 3/4, 2/4, 6/8), quick tempos, and an accented downbeat. |

## Under the hood

- **Realistic guitar synthesis** — a Karplus–Strong physical model with a guitar-body EQ chain, pluck-position comb filtering, a pick-attack transient, and a subtle convolution reverb. No samples; everything is synthesised live in the Web Audio API.
- **Staff notation** rendered with the [Bravura](https://github.com/steinbergmedia/bravura) SMuFL music font, subset to just the four glyphs used (247 KB to 4.6 KB).
- **Tiny and fast** — about 72 KB of JS (Preact, not React) plus 2 KB of CSS, self-hosted preloaded fonts, and a service worker for instant repeat loads and full offline use. Installable as a PWA.

## Accessibility

- **WCAG 2.1 AA — zero violations** across all four views, audited with [axe-core](https://github.com/dequelabs/axe-core).
- Keyboard-first: skip-to-content link, logical focus order, visible focus rings, and Enter/Space activation on the interactive fretboards.
- Screen-reader ready: semantic landmarks, a page heading, labels on every control and SVG, `aria-pressed` tabs, and live status updates in the ear trainer.
- Respects `prefers-reduced-motion`; every fret, chord, and note carries a descriptive label.

## Architecture

The original design ran on a React-based template runtime. Because Preact's `Component` and `h()` are API-compatible with `React.Component` and `createElement`, the design's entire engine — audio synthesis, music theory, chord data, and SVG renderers — is reused verbatim in [`src/logic.js`](src/logic.js), behind a small shim that adapts React-style SVG attributes (`fontFamily` to `font-family`, and so on) for Preact. Only the view and the metronome were authored fresh.

```text
src/
  main.jsx                  mount
  App.jsx                   views (fretboard, chords, ear trainer) and tab shell
  logic.js                  engine: audio, theory, chords, staff
  audio/metronome.js        lookahead Web Audio scheduler
  components/Metronome.jsx  metronome UI
  styles.css                global theme and a11y helpers
public/                     fonts, icons, manifest, service worker
```

## Getting started

```bash
npm install
npm run dev       # http://localhost:5173/Guitar-Tutor/
npm run build     # production build to dist/
npm run preview   # preview the production build
```

## Deploy (GitHub Pages)

Every push to `main` runs [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml), which builds the site and publishes `dist/` to GitHub Pages.

- Vite `base` is `/Guitar-Tutor/` to match the repo name.
- For a custom domain or root deploy: `BASE_PATH=/ npm run build`.
- In the repo: **Settings → Pages → Source → GitHub Actions**.

## Credits

- Music font — [Bravura](https://github.com/steinbergmedia/bravura) by Steinberg (SIL OFL 1.1)
- Framework and tooling — [Preact](https://preactjs.com/) and [Vite](https://vitejs.dev/)

---

<div align="center">

Built with [Claude](https://claude.com/claude-code)

</div>
