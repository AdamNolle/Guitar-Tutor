import { h, Fragment } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { Metronome } from '../audio/metronome.js';

const card = 'background:#fbf9f2;border:1px solid #e4dcc9;border-radius:16px;box-shadow:0 1px 2px rgba(80,66,40,.04);';
const kicker = 'font-size:11px;color:#736857;font-weight:700;letter-spacing:.06em;text-transform:uppercase;';

function tempoName(bpm) {
  if (bpm < 60) return 'Largo';
  if (bpm < 76) return 'Adagio';
  if (bpm < 108) return 'Andante';
  if (bpm < 120) return 'Moderato';
  if (bpm < 156) return 'Allegro';
  if (bpm < 176) return 'Vivace';
  return 'Presto';
}

const TIME_SIGS = [
  { label: '4/4', beats: 4 },
  { label: '3/4', beats: 3 },
  { label: '2/4', beats: 2 },
  { label: '6/8', beats: 6 },
];

export function MetronomeView({ getCtx, isMobile }) {
  const engineRef = useRef(null);
  if (!engineRef.current) engineRef.current = new Metronome(getCtx);
  const engine = engineRef.current;

  const [bpm, setBpm] = useState(100);
  const [beats, setBeats] = useState(4);
  const [running, setRunning] = useState(false);
  const [activeBeat, setActiveBeat] = useState(-1);
  const tapsRef = useRef([]);

  // Keep the audio engine in sync with UI state.
  useEffect(() => { engine.setBpm(bpm); }, [bpm]);
  useEffect(() => { engine.setBeatsPerMeasure(beats); }, [beats]);

  useEffect(() => {
    engine.onBeat = (idx) => setActiveBeat(idx);
    return () => { engine.stop(); engine.onBeat = null; };
  }, []);

  const toggle = () => {
    engine.toggle();
    const now = engine.isRunning;
    setRunning(now);
    if (!now) setActiveBeat(-1);
  };

  const nudge = (d) => setBpm((b) => Math.max(30, Math.min(300, b + d)));

  const tap = () => {
    const t = (engine.getCtx() || { currentTime: performance.now() / 1000 }).currentTime;
    const taps = tapsRef.current;
    taps.push(t);
    if (taps.length > 4) taps.shift();
    if (taps.length >= 2) {
      const intervals = [];
      for (let i = 1; i < taps.length; i++) intervals.push(taps[i] - taps[i - 1]);
      const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      if (avg > 0.2 && avg < 2) setBpm(Math.round(60 / avg));
    }
    // Reset the tap window if the user pauses.
    clearTimeout(tap._to);
    tap._to = setTimeout(() => { tapsRef.current = []; }, 2200);
  };

  const playBtn = 'display:inline-flex;align-items:center;justify-content:center;gap:9px;border:none;border-radius:14px;font-weight:800;cursor:pointer;font-family:\'Manrope\',sans-serif;';
  const ctrlBtn = 'background:#efe7d4;color:#4a4236;border:1px solid #e0d6bf;border-radius:11px;font-weight:700;cursor:pointer;font-family:\'Manrope\',sans-serif;';

  return (
    <section>
      <div style="margin:8px 0 16px;">
        <h2 style="font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:27px;margin:0 0 5px;letter-spacing:-.02em;color:#2b2722;">Metronome</h2>
        <p style="margin:0;color:#6f6759;font-size:15px;line-height:1.5;max-width:580px;">Keep time while you practice. Set the tempo, pick a feel, and lock in — the first beat of each bar is accented.</p>
      </div>

      <div style="display:flex;gap:14px;flex-wrap:wrap;align-items:flex-start;">
        {/* main panel */}
        <div style={'flex:1 1 420px;min-width:280px;padding:26px 24px;display:flex;flex-direction:column;align-items:center;' + card}>
          {/* beat lights */}
          <div style="display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap;justify-content:center;">
            {Array.from({ length: beats }, (_, i) => {
              const on = running && activeBeat === i;
              const accent = i === 0;
              const base = accent ? '#c15f37' : '#9aa389';
              return (
                <span key={i} aria-hidden="true" style={
                  'width:' + (accent ? 18 : 15) + 'px;height:' + (accent ? 18 : 15) + 'px;border-radius:50%;transition:transform .08s,background .08s;' +
                  'background:' + (on ? base : '#e2d8c2') + ';' +
                  (on ? 'transform:scale(1.35);box-shadow:0 0 0 5px ' + base + '22;' : '')
                }></span>
              );
            })}
          </div>

          {/* big BPM readout */}
          <div style="display:flex;align-items:baseline;gap:8px;">
            <div style="font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:88px;line-height:.82;letter-spacing:-.04em;color:#2b2722;">{bpm}</div>
            <div style="font-family:'Space Grotesk',sans-serif;font-size:18px;color:#676154;font-weight:600;">bpm</div>
          </div>
          <div style="font-size:13px;color:#a44f2c;font-weight:700;letter-spacing:.05em;text-transform:uppercase;margin-top:4px;">{tempoName(bpm)}</div>

          {/* slider + nudge */}
          <div style="display:flex;align-items:center;gap:12px;width:100%;max-width:380px;margin-top:20px;">
            <button onClick={() => nudge(-1)} aria-label="Slower" style={ctrlBtn + 'width:44px;height:44px;font-size:22px;flex:none;'}>−</button>
            <input type="range" min="30" max="300" value={bpm} aria-label="Tempo in beats per minute"
              onInput={(e) => setBpm(Number(e.target.value))}
              style="flex:1;accent-color:#c15f37;height:6px;cursor:pointer;" />
            <button onClick={() => nudge(1)} aria-label="Faster" style={ctrlBtn + 'width:44px;height:44px;font-size:22px;flex:none;'}>+</button>
          </div>

          {/* transport */}
          <div style="display:flex;gap:10px;margin-top:22px;width:100%;max-width:380px;">
            <button onClick={toggle} style={playBtn + 'flex:1;padding:15px;font-size:16px;' + (running ? 'background:#efe7d4;color:#a44f2c;box-shadow:inset 0 0 0 1px #e6c4ad;' : 'background:#34302a;color:#f6f1e4;')}>
              {running ? '◼ Stop' : '▶ Start'}
            </button>
            <button onClick={tap} style={ctrlBtn + 'padding:15px 20px;font-size:15px;'}>Tap tempo</button>
          </div>
        </div>

        {/* settings panel */}
        <div style={'flex:1 1 240px;min-width:220px;padding:20px;' + card}>
          <div style={kicker + 'margin-bottom:12px;'}>Feel</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            {TIME_SIGS.map((ts) => {
              const sel = beats === ts.beats;
              return (
                <button key={ts.label} onClick={() => setBeats(ts.beats)} style={
                  'min-width:58px;padding:11px 14px;border-radius:11px;font-family:\'Space Grotesk\',sans-serif;font-weight:700;font-size:16px;cursor:pointer;transition:all .15s;' +
                  (sel ? 'background:#34302a;color:#f6f1e4;border:1px solid #34302a;' : 'background:#fbf9f2;color:#5c5447;border:1px solid #e0d6bf;')
                }>{ts.label}</button>
              );
            })}
          </div>

          <div style={kicker + 'margin:18px 0 10px;'}>Quick tempos</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            {[60, 80, 100, 120, 160].map((v) => (
              <button key={v} onClick={() => setBpm(v)} style={
                'padding:9px 13px;border-radius:10px;font-weight:700;font-size:13px;cursor:pointer;font-family:\'Manrope\',sans-serif;' +
                (bpm === v ? 'background:#efe7d4;color:#a44f2c;border:1px solid #e6c4ad;' : 'background:#fbf9f2;color:#6d6456;border:1px solid #e0d6bf;')
              }>{v}</button>
            ))}
          </div>

          <div style="margin-top:18px;padding:12px 14px;background:#efe7d4;border:1px solid #e0d6bf;border-radius:12px;font-size:13px;line-height:1.55;color:#6d6456;">
            <span style="font-weight:700;color:#6e6553;">Tip · </span>Start slow enough to play every note cleanly, then raise the tempo by 5 bpm once it feels easy.
          </div>
        </div>
      </div>
    </section>
  );
}
