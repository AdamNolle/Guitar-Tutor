// A rock-solid metronome built on the Web Audio clock using the lookahead
// scheduler pattern (Chris Wilson, "A Tale of Two Clocks"): a coarse JS timer
// schedules precise sample-accurate clicks slightly ahead of time, so tempo
// stays steady even when the main thread is busy.

const LOOKAHEAD_MS = 25;        // how often the scheduler wakes up
const SCHEDULE_AHEAD = 0.12;    // seconds of audio scheduled in advance

export class Metronome {
  constructor(getCtx) {
    this.getCtx = getCtx;       // () => AudioContext (shared with the guitar engine)
    this.ctx = null;
    this.bpm = 100;
    this.beatsPerMeasure = 4;
    this.isRunning = false;
    this.currentBeat = 0;       // beat about to be scheduled
    this.nextNoteTime = 0;
    this.timer = null;
    this.onBeat = null;         // (beatIndex, isAccent, when) => void  (UI sync)
  }

  setBpm(v) {
    this.bpm = Math.max(30, Math.min(300, Math.round(v)));
  }

  setBeatsPerMeasure(n) {
    this.beatsPerMeasure = Math.max(1, Math.min(12, n | 0));
    if (this.currentBeat >= this.beatsPerMeasure) this.currentBeat = 0;
  }

  _scheduleClick(beat, time) {
    const ctx = this.ctx;
    const accent = beat === 0;

    // Two-oscillator wood-block-ish click: a short pitched blip with a fast decay.
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = accent ? 1500 : 1000;

    const peak = accent ? 0.5 : 0.32;
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(peak, time + 0.001);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.045);

    // Gentle band-limiting so the click is crisp, not harsh.
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = accent ? 3600 : 2600;

    osc.connect(gain);
    gain.connect(lp);
    lp.connect(ctx.destination);
    osc.start(time);
    osc.stop(time + 0.06);

    if (this.onBeat) {
      const delay = Math.max(0, (time - ctx.currentTime) * 1000);
      const idx = beat;
      setTimeout(() => { if (this.isRunning && this.onBeat) this.onBeat(idx, accent); }, delay);
    }
  }

  _advance() {
    const secondsPerBeat = 60.0 / this.bpm;
    this.nextNoteTime += secondsPerBeat;
    this.currentBeat = (this.currentBeat + 1) % this.beatsPerMeasure;
  }

  _tick() {
    const ctx = this.ctx;
    while (this.nextNoteTime < ctx.currentTime + SCHEDULE_AHEAD) {
      this._scheduleClick(this.currentBeat, this.nextNoteTime);
      this._advance();
    }
  }

  start() {
    if (this.isRunning) return;
    this.ctx = this.getCtx();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    this.isRunning = true;
    this.currentBeat = 0;
    this.nextNoteTime = this.ctx.currentTime + 0.06;
    this._tick();
    this.timer = setInterval(() => this._tick(), LOOKAHEAD_MS);
  }

  stop() {
    this.isRunning = false;
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
  }

  toggle() {
    this.isRunning ? this.stop() : this.start();
  }
}
