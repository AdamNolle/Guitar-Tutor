# Fretwise — Guitar Tutor

A warm, fast, offline-capable guitar tutor with **realistic plucked-string sound**.
Built with [Preact](https://preactjs.com/) + [Vite](https://vitejs.dev/), originally
designed in Claude Design.

## Features

- **Fretboard** — tap any fret to hear it and see it on the staff, place notes on the
  staff to light up the neck, and highlight any key & scale. Desktop and a phone-optimised
  vertical board.
- **Chord library** — open / 7th / power chords with finger diagrams, animated strum
  strips, chord-tone breakdowns, and common progressions you can play back.
- **Ear & fretboard trainer** — "name the note" and "find the note" drills with scoring,
  streaks, and rotating tips.
- **Metronome** — a sample-accurate Web Audio metronome with tap-tempo, time signatures,
  and an accented downbeat.

### Under the hood

- **Realistic guitar synthesis** — a Karplus–Strong physical model with a guitar-body EQ
  chain, pluck-position comb filtering, a pick-attack transient, and a subtle convolution
  reverb. No samples; everything is synthesised in the Web Audio API.
- **Staff notation** rendered with the [Bravura](https://github.com/steinbergmedia/bravura)
  music font.
- **Fast & offline** — ~70 KB of JS, self-hosted fonts, and a service worker for instant
  repeat loads and offline use. Respects `prefers-reduced-motion` and is keyboard accessible.

## Develop

```bash
npm install
npm run dev      # http://localhost:5173/Guitar-Tutor/
npm run build    # production build → dist/
npm run preview  # preview the production build
```

## Deploy (GitHub Pages)

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds the site and
publishes `dist/` to GitHub Pages. The Vite `base` is `/Guitar-Tutor/` to match the repo
name; for a custom domain or a root deploy, build with `BASE_PATH=/ npm run build`.

In the repository settings, set **Settings → Pages → Source** to **GitHub Actions**.
