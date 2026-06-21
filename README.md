<div align="center">

# 🎸 Fretwise

### A warm, fast guitar tutor with realistic plucked-string sound.

Learn the fretboard, explore chords, train your ear, and keep time —
all in the browser, all offline-capable.

**[▶ Open the live app](https://adamnolle.github.io/Guitar-Tutor/)**

![Preact](https://img.shields.io/badge/Preact-10-673AB8?logo=preact&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![Web Audio](https://img.shields.io/badge/Web%20Audio-synthesis-FF6F3C)
![WCAG 2.1 AA](https://img.shields.io/badge/WCAG%202.1%20AA-0%20violations-2F8F5B)
![PWA](https://img.shields.io/badge/PWA-offline%20ready-5A4FCF)
![JS](https://img.shields.io/badge/bundle-~72%20KB%20JS-444)

</div>

> 🔊 Tap any fret, chord, or quiz answer to begin — browsers require a gesture before audio can play.

---

## ✨ Features

| | |
|---|---|
| 🎼 **Fretboard** | Tap a fret to hear it and see it on the treble staff — or place a note on the staff to light up every spot it lives on the neck. Highlight any key & scale. Desktop board + phone-optimised vertical board. |
| 🎵 **Chord library** | Open / 7th / power chords with finger diagrams, animated strum strips, chord-tone breakdowns, and common progressions you can play back. |
| 👂 **Ear & fretboard trainer** | "Name the note" and "find the note" drills with scoring, streaks, and rotating practice tips. |
| 🥁 **Metronome** | A sample-accurate Web Audio metronome with tap-tempo, time signatures (4/4, 3/4, 2/4, 6/8), quick tempos, and an accented downbeat. |

## 🔧 Under the hood

- **🎸 Realistic guitar synthesis** — a Karplus–Strong physical model with a guitar-body EQ chain, pluck-position comb filtering, a pick-attack transient, and a subtle convolution reverb. No samples; everything is synthesised live in the Web Audio API.
- **🎶 Staff notation** rendered with the [Bravura](https://github.com/steinbergmedia/bravura) SMuFL music font, subset to just the 4 glyphs used (**247 KB → 4.6 KB**).
- **⚡ Tiny & fast** — ~72 KB of JS (Preact, not React) + 2 KB CSS, self-hosted preloaded fonts (no CDN round-trips), and a service worker for instant repeat loads and full offline use. Installable as a PWA.

## ♿ Accessibility

- **WCAG 2.1 AA — zero violations** across all four views, audited with [axe-core](https://github.com/dequelabs/axe-core).
- **Keyboard-first**: skip-to-content link, logical focus order, visible `:focus-visible` rings, Enter/Space activation on the interactive fretboards.
- **Screen-reader ready**: semantic landmarks (`header` / `nav` / `main`), a page `<h1>`, `aria-label`s on every SVG and control, `aria-pressed` tabs, and `aria-live` status in the ear trainer.
- Respects `prefers-reduced-motion`; every fret, chord, and note carries a descriptive label.

## 🏗️ Architecture

The original design (from [Claude Design](https://claude.ai/design)) ran on a React-based template runtime. Because Preact's `Component` and `h()` are API-compatible with `React.Component` / `createElement`, the design's entire engine — audio synthesis, music theory, chord data, and SVG renderers — is reused **verbatim** in [`src/logic.js`](src/logic.js), behind a small shim that adapts React-style SVG attributes (`fontFamily` → `font-family`, …) for Preact. Only the JSX view and the metronome were authored fresh.

```text
src/
├─ main.jsx                  # mount
├─ Fretwise.jsx              # JSX views (fretboard, chords, ear trainer) + tab shell
├─ logic.js                  # verbatim design engine: audio, theory, chords, staff
├─ audio/metronome.js        # lookahead Web Audio scheduler
├─ components/Metronome.jsx  # metronome UI
└─ styles.css                # global theme + a11y helpers
public/                      # fonts, icons, manifest, service worker
```

## 🚀 Getting started

```bash
npm install
npm run dev       # → http://localhost:5173/Guitar-Tutor/
npm run build     # production build → dist/
npm run preview   # preview the production build
```

## 📦 Deploy (GitHub Pages)

Every push to `main` runs [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml), which builds the site and publishes `dist/` to GitHub Pages.

- Vite `base` is `/Guitar-Tutor/` to match the repo name.
- For a custom domain or root deploy: `BASE_PATH=/ npm run build`.
- In the repo: **Settings → Pages → Source → GitHub Actions** (already enabled).

## 🙏 Credits

- Music font — [Bravura](https://github.com/steinbergmedia/bravura) by Steinberg (SIL OFL 1.1)
- Framework & tooling — [Preact](https://preactjs.com/) · [Vite](https://vitejs.dev/)

---

<div align="center">

Designed in **Claude Design** · built with **[Claude](https://claude.com/claude-code)** 🤖🎸

</div>
