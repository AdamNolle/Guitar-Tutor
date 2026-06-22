import { h, Fragment } from 'preact';
import { AppLogic } from './logic.js';
import { MetronomeView } from './components/Metronome.jsx';

// Card / panel shells reused across sections (verbatim styles from the design).
const card = 'background:#fbf9f2;border:1px solid #e4dcc9;border-radius:16px;box-shadow:0 1px 2px rgba(80,66,40,.04);';
const kicker = 'font-size:11px;color:#736857;font-weight:700;letter-spacing:.06em;text-transform:uppercase;';
const h2style = "font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:27px;margin:0 0 5px;letter-spacing:-.02em;color:#2b2722;";
const leadP = 'margin:0;color:#6f6759;font-size:15px;line-height:1.5;max-width:580px;';

const GOOD_TO_KNOW = [
  { n: '1', bg: '#f0e2c4', fg: '#4a3810', text: 'Each fret raises the pitch by one half-step (a semitone). Twelve frets up is a full octave — the same note name again.' },
  { n: '2', bg: '#d7e4d2', fg: '#1f4527', text: "There's no sharp/flat between B–C or E–F, so those pairs are only one fret apart — every other natural note is two frets apart." },
  { n: '3', bg: '#f5e2d6', fg: '#a44f2c', text: 'Sharps (♯) raise a note by a fret; flats (♭) lower it. The black-key pitch between C and D can be called either C♯ or D♭.' },
  { n: '4', bg: '#e7e0ee', fg: '#5a4d75', text: 'The neck dots (3·5·7·9, then a double dot at 12) are signposts — learn them and you can find any fret at a glance.' },
];

export class App extends AppLogic {
  render() {
    const out = this.renderVals();
    const s = this.state;
    const M0 = s.isMobile;

    // Metronome tab button, styled to match the design's existing tabs.
    const metroTabStyle =
      (M0 ? 'flex:1;padding:12px 10px;font-size:14px;min-height:46px;' : 'padding:9px 18px;font-size:14px;') +
      'border-radius:9px;font-weight:600;cursor:pointer;font-family:Space Grotesk,sans-serif;transition:all .15s;border:none;white-space:nowrap;display:inline-flex;align-items:center;justify-content:center;' +
      (s.tab === 'metronome'
        ? 'background:#fbf9f2;color:#2b2722;box-shadow:0 1px 4px rgba(70,56,30,.16);'
        : 'background:transparent;color:#676154;');

    return (
      <div style="min-height:100vh;min-height:100dvh;background:#f3eee2;font-family:'Manrope',system-ui,sans-serif;color:#34302a;padding:0 max(20px,env(safe-area-inset-right)) calc(72px + env(safe-area-inset-bottom)) max(20px,env(safe-area-inset-left));">
        <a class="skip-link" href="#main-content">Skip to content</a>
        <header style="position:sticky;top:0;z-index:30;background:#f3eee2;margin:0 calc(-1*max(20px,env(safe-area-inset-right))) 0 calc(-1*max(20px,env(safe-area-inset-left)));padding:max(14px,env(safe-area-inset-top)) max(20px,env(safe-area-inset-right)) 12px max(20px,env(safe-area-inset-left));display:flex;justify-content:center;box-shadow:0 4px 14px -10px rgba(70,56,30,.4);">
          <h1 class="sr-only">Guitar Tutor — learn the fretboard, chords, and ear training</h1>
          <nav style={out.navStyle} aria-label="Sections">
            {out.tabBtns.map((b) => (
              <button key={b.key} onClick={b.onClick} style={b.style} aria-pressed={s.tab === b.key}>{b.label}</button>
            ))}
            <button onClick={() => this.setTab('metronome')} style={metroTabStyle} aria-pressed={s.tab === 'metronome'}>Metronome</button>
          </nav>
        </header>

        <main id="main-content" style="max-width:1080px;margin:0 auto;">
          {out.isFret && this.renderFretboard(out, s)}
          {out.isChords && this.renderChords(out, s)}
          {out.isQuiz && this.renderQuiz(out, s)}
          {s.tab === 'metronome' && (
            <MetronomeView isMobile={M0} getCtx={() => { this.ensureAudio(); return this.ctx; }} />
          )}
        </main>
      </div>
    );
  }

  // ---------------- Fretboard ----------------
  renderFretboard(out, s) {
    const numCell = "display:flex;justify-content:center;align-items:flex-end;font-size:12px;color:#6d6248;font-weight:700;font-family:'Space Grotesk',sans-serif;padding-bottom:4px;";
    const rowLabel = "display:flex;flex-direction:column;align-items:flex-end;justify-content:center;gap:1px;padding-right:12px;background:#ece1c9;line-height:1;";

    const cell = (c) => (
      <div key={c.f} style={c.cellStyle} onClick={c.onClick} onKeyDown={c.onKey} role="button" tabIndex={0} aria-label={c.aria} title={c.title}>
        <div style={c.chipStyle}>{c.name}</div>
      </div>
    );

    return (
      <section>
        <div style="margin:8px 0 18px;">
          <h2 style={h2style}>The fretboard</h2>
          <p style={leadP}>Tap any fret to hear it and see where it lands on the staff — or place a note on the staff to light up every spot it lives on the neck. Choose a key &amp; scale to highlight the notes that belong together.</p>
        </div>

        {/* controls */}
        <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;background:#fbf9f2;border:1px solid #e4dcc9;border-radius:15px;padding:12px 14px;margin-bottom:16px;box-shadow:0 1px 2px rgba(80,66,40,.04);">
          <div style="display:flex;gap:6px;align-items:center;">
            <span style="font-size:11.5px;color:#736857;font-weight:700;letter-spacing:.04em;text-transform:uppercase;margin-right:2px;">Spelling</span>
            <button onClick={out.setSharp} style={out.accSharpStyle}>Sharps ♯</button>
            <button onClick={out.setFlat} style={out.accFlatStyle}>Flats ♭</button>
          </div>
          <div style="width:1px;height:24px;background:#e4dcc9;"></div>
          <div style="display:flex;gap:6px;align-items:center;">
            <span style="font-size:11.5px;color:#736857;font-weight:700;letter-spacing:.04em;text-transform:uppercase;">Key</span>
            <select value={out.scaleKeyValue} onChange={out.onScaleKey} aria-label="Scale key" style={out.selectStyle}>
              {out.keyOptions.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}
            </select>
          </div>
          <div style="display:flex;gap:6px;align-items:center;">
            <span style="font-size:11.5px;color:#736857;font-weight:700;letter-spacing:.04em;text-transform:uppercase;">Scale</span>
            <select value={out.scaleTypeValue} onChange={out.onScaleType} aria-label="Scale type" style={out.selectStyle}>
              {out.typeOptions.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}
            </select>
          </div>
          <button onClick={out.toggleScaleOnly} style={out.scaleOnlyStyle} disabled={s.scaleType === 'none'} aria-disabled={s.scaleType === 'none'}>Dim off-scale</button>
          <button onClick={out.playScale} style={out.playScaleStyle} disabled={s.scaleType === 'none'} aria-disabled={s.scaleType === 'none'}>▶ Play scale</button>
        </div>

        {/* desktop board */}
        {out.notMobile && (
          <div style="background:#ece1c9;border:1px solid #d6c9aa;border-radius:16px;padding:16px 16px 10px;overflow-x:auto;box-shadow:inset 0 1px 3px rgba(120,100,60,.08);">
            <div style="min-width:600px;">
              <div style={out.numRowStyle}>
                <div></div>
                {out.fretNums.map((n, i) => <div key={i} style={numCell}>{n.label}</div>)}
              </div>
              {out.showInlays && (
                <div style={out.numRowStyle}>
                  <div></div>
                  {out.inlays.map((d, i) => (
                    <div key={i} style="display:flex;justify-content:center;gap:5px;padding-top:7px;">
                      <div style={d.dotStyle}></div>
                      <div style={d.dot2Style}></div>
                    </div>
                  ))}
                </div>
              )}
              {out.board.map((row, ri) => (
                <div key={ri} style={row.rowStyle}>
                  <div style={rowLabel}>
                    <span style="font-size:9.5px;color:#8a7d62;font-weight:600;font-family:'Space Grotesk',sans-serif;">{row.num}</span>
                    <span style="font-size:13px;color:#3b352c;font-weight:700;font-family:'Space Grotesk',sans-serif;">{row.label}</span>
                  </div>
                  {row.frets.map(cell)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* mobile (vertical) board */}
        {out.isMobile && (
          <div style="background:#ece1c9;border:1px solid #d6c9aa;border-radius:16px;padding:12px 12px 14px;box-shadow:inset 0 1px 3px rgba(120,100,60,.08);overflow-x:auto;">
            <div style={'display:grid;grid-template-columns:' + out.vGrid + ';align-items:end;margin-bottom:2px;'}>
              <div></div>
              {out.vHeaders.map((hd, i) => (
                <div key={i} style="display:flex;flex-direction:column;align-items:center;line-height:1.05;">
                  <span style="font-size:9.5px;color:#8a7d62;font-weight:600;font-family:'Space Grotesk',sans-serif;">{hd.num}</span>
                  <span style="font-size:13px;color:#3b352c;font-weight:700;font-family:'Space Grotesk',sans-serif;">{hd.label}</span>
                </div>
              ))}
            </div>
            {out.vRows.map((r) => (
              <div key={r.fret} style={'display:grid;grid-template-columns:' + out.vGrid + ';align-items:center;'}>
                <div style="display:flex;align-items:center;justify-content:flex-end;gap:4px;padding-right:7px;font-size:12px;color:#6d6248;font-weight:700;font-family:'Space Grotesk',sans-serif;">
                  {r.marker && <span style={'display:inline-block;width:5px;height:5px;border-radius:50%;background:#bcab85;' + (r.dbl ? 'box-shadow:-6px 0 0 #bcab85;' : '')}></span>}
                  {r.fretLabel}
                </div>
                {r.cells.map((c, ci) => (
                  <div key={ci} style={c.cellStyle} onClick={c.onClick} onKeyDown={c.onKey} role="button" tabIndex={0} aria-label={c.aria} title={c.title}>
                    <div style={c.chipStyle}>{c.name}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* selected note + staff */}
        <div style="display:flex;gap:14px;flex-wrap:wrap;align-items:stretch;margin-top:14px;">
          <div style={'flex:1 1 320px;padding:22px;display:flex;flex-direction:column;justify-content:center;' + card}>
            <div style={kicker + 'margin-bottom:8px;'}>Selected note</div>
            <div style="display:flex;align-items:baseline;gap:14px;">
              <div style={"font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:70px;line-height:.85;letter-spacing:-.03em;color:" + out.selColor + ';'}>{out.selName}</div>
              <div>
                <div style="font-family:'Space Grotesk',sans-serif;font-size:22px;color:#6f6759;font-weight:600;">{out.selOctaveLabel}</div>
                <div style="font-size:13px;color:#79705f;margin-top:2px;">{out.selFreq} Hz</div>
              </div>
            </div>
            <div style="margin-top:18px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
              <span style="font-size:13px;color:#5c5447;background:#efe7d4;padding:6px 12px;border-radius:999px;font-weight:600;">{out.selPosition}</span>
              <button onClick={out.playSelected} style="display:inline-flex;align-items:center;gap:7px;background:#34302a;color:#f6f1e4;border:none;padding:9px 17px;border-radius:999px;font-weight:700;font-size:13.5px;cursor:pointer;font-family:'Manrope',sans-serif;">▶ Hear it</button>
            </div>
            <div style="margin-top:16px;padding-top:14px;border-top:1px solid #ece3cf;font-size:13px;color:#6d6456;line-height:1.55;">{out.selInsight}</div>
          </div>

          <div style={'flex:1 1 360px;padding:18px 20px;' + card}>
            <div style="display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin-bottom:8px;">
              <div style={kicker + 'white-space:nowrap;'}>{out.staffTitle}</div>
              <div style="font-size:11px;color:#6e6553;white-space:nowrap;">sounds 8va lower</div>
            </div>
            <div style="background:#fffdf8;border:1px solid #ece3cf;border-radius:12px;padding:8px;display:flex;align-items:center;min-height:188px;">{out.staffEl}</div>
            {out.staffPickable && (
              <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:12px;">
                <span style="font-size:12px;color:#6f6759;font-weight:700;">Place a note</span>
                <button onClick={out.octDown} aria-label="Octave down" style="min-width:44px;min-height:44px;padding:8px 9px;border-radius:9px;background:#efe7d4;color:#4a4236;border:1px solid #e0d6bf;font-weight:700;cursor:pointer;font-family:'Manrope',sans-serif;">−8va</button>
                <button onClick={out.stepDown} aria-label="Down a semitone" style="min-width:44px;min-height:44px;padding:8px 9px;border-radius:9px;background:#efe7d4;color:#4a4236;border:1px solid #e0d6bf;font-weight:700;cursor:pointer;font-family:'Manrope',sans-serif;">−1</button>
                <button onClick={out.stepUp} aria-label="Up a semitone" style="min-width:44px;min-height:44px;padding:8px 9px;border-radius:9px;background:#efe7d4;color:#4a4236;border:1px solid #e0d6bf;font-weight:700;cursor:pointer;font-family:'Manrope',sans-serif;">+1</button>
                <button onClick={out.octUp} aria-label="Octave up" style="min-width:44px;min-height:44px;padding:8px 9px;border-radius:9px;background:#efe7d4;color:#4a4236;border:1px solid #e0d6bf;font-weight:700;cursor:pointer;font-family:'Manrope',sans-serif;">+8va</button>
              </div>
            )}
          </div>
        </div>

        {/* good to know */}
        <div style={'margin-top:14px;padding:18px;' + card}>
          <div style={kicker + 'margin-bottom:12px;'}>Good to know</div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;">
            {GOOD_TO_KNOW.map((g) => (
              <div key={g.n} style="display:flex;gap:10px;align-items:flex-start;">
                <span aria-hidden="true" style={'flex:none;width:24px;height:24px;border-radius:7px;display:grid;place-items:center;font-weight:700;font-family:\'Space Grotesk\',sans-serif;font-size:13px;background:' + g.bg + ';color:' + g.fg + ';'}>{g.n}</span>
                <p style="margin:0;font-size:13.5px;line-height:1.5;color:#5c5447;">{g.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // ---------------- Chords ----------------
  renderChords(out, s) {
    return (
      <section>
        <div style="margin:8px 0 16px;">
          <h2 style={h2style}>Chord library</h2>
          <p style={leadP}>See the shape, hear the strum, and learn which notes build each chord. Switch categories, then tap a chord to load it.</p>
        </div>

        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
          {out.catBtns.map((b) => <button key={b.key} onClick={b.onClick} style={b.style}>{b.label}</button>)}
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;">
          {out.chordList.map((c, i) => <button key={i} onClick={c.onClick} style={c.style}>{c.name}</button>)}
        </div>

        <div style="display:flex;gap:14px;flex-wrap:wrap;align-items:flex-start;">
          {/* diagram */}
          <div style={'flex:1 1 360px;min-width:280px;padding:20px;' + card}>
            <div style="display:flex;align-items:baseline;justify-content:space-between;gap:10px;flex-wrap:wrap;">
              <div style="font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:32px;color:#2b2722;letter-spacing:-.01em;">{out.chordName}</div>
              <div style="font-size:11px;color:#676154;background:#efe7d4;padding:5px 11px;border-radius:999px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;">{out.chordKind}</div>
            </div>
            <div style="background:#fffdf8;border:1px solid #ece3cf;border-radius:12px;padding:6px;margin-top:14px;">{out.chordDiagramEl}</div>
            <div style="display:flex;gap:8px;margin-top:14px;">
              <button onClick={out.replayFingers} style="flex:none;background:#efe7d4;color:#5c5447;border:1px solid #e0d6bf;padding:11px 14px;border-radius:11px;font-weight:700;font-size:13px;cursor:pointer;font-family:'Manrope',sans-serif;">☞ Fingering</button>
              <button onClick={out.playChord} style="flex:1;display:inline-flex;justify-content:center;align-items:center;gap:8px;background:#34302a;color:#f6f1e4;border:none;padding:11px;border-radius:11px;font-weight:800;font-size:14px;cursor:pointer;font-family:'Manrope',sans-serif;">▶ Strum chord</button>
            </div>
          </div>

          {/* right column */}
          <div style="flex:1 1 340px;min-width:262px;display:flex;flex-direction:column;gap:12px;">
            <div style={'padding:18px 18px 16px;' + card}>
              <div style={kicker + 'margin-bottom:12px;'}>How to strum it</div>
              <div style="overflow-x:auto;">{out.strumStripEl}</div>
              <p style="margin:12px 0 0;font-size:14px;line-height:1.55;color:#5c5447;">{out.chordStrumCaption}</p>
            </div>

            <div style={'padding:18px;' + card}>
              <div style="display:flex;align-items:baseline;justify-content:space-between;">
                <span style={kicker}>Chord tones</span>
                <span style="font-size:11px;color:#6e6553;">tap to hear</span>
              </div>
              <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;">
                {out.chordTones.map((t, i) => (
                  <button key={i} onClick={t.onClick} style={t.style}>
                    <span style={t.tagStyle}>{t.tag}</span>
                    <span style={t.noteStyle}>{t.note}</span>
                  </button>
                ))}
              </div>
            </div>

            <div style="background:#efe7d4;border:1px solid #e0d6bf;border-radius:14px;padding:15px 18px;">
              <div style={kicker + 'color:#6f6759;margin-bottom:7px;'}>How to practice</div>
              <p style="margin:0;font-size:13.5px;line-height:1.6;color:#6d6456;">{out.chordTip}</p>
            </div>
          </div>
        </div>

        <div style={'margin-top:14px;padding:18px;' + card}>
          <div style="display:flex;align-items:baseline;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
            <span style={kicker}>Practice progressions</span>
            <span style="font-size:11.5px;color:#676154;">tap to hear the chords change</span>
          </div>
          <div style="display:flex;gap:10px;flex-wrap:wrap;">
            {out.progressions.map((p, i) => (
              <button key={i} onClick={p.onClick} aria-label={p.aria} style="background:#fbf9f2;border:1px solid #e0d6bf;color:#34302a;padding:11px 16px;border-radius:11px;font-weight:700;font-size:14px;cursor:pointer;font-family:'Space Grotesk',sans-serif;">▶ {p.label}</button>
            ))}
          </div>
          <p style="margin:12px 0 0;font-size:13px;line-height:1.55;color:#6f6759;">These are some of the most common chord sequences in popular music — loop one slowly and focus on switching cleanly between the shapes.</p>
        </div>
      </section>
    );
  }

  // ---------------- Ear / fretboard trainer ----------------
  renderQuiz(out, s) {
    const statBig = (color) => "font-family:'Space Grotesk',sans-serif;font-size:34px;font-weight:700;line-height:1;color:" + color + ';';
    const statLabel = 'font-size:11.5px;color:#736857;margin-top:3px;';
    const row = 'display:flex;justify-content:space-between;font-size:13px;padding:8px 0;border-top:1px solid #ece3cf;';

    return (
      <section>
        <div style="margin:8px 0 16px;">
          <h2 style={h2style}>Ear &amp; fretboard trainer</h2>
          <p style={leadP}>Short, gentle drills. Listen, look, and lock the fretboard into memory.</p>
        </div>

        <div style="display:flex;gap:5px;background:#e7dfcd;padding:5px;border-radius:13px;width:max-content;max-width:100%;margin-bottom:18px;">
          <button onClick={out.setModeName} style={out.qNameStyle}>Name the note</button>
          <button onClick={out.setModeFind} style={out.qFindStyle}>Find the note</button>
        </div>

        <div style="display:flex;gap:14px;flex-wrap:wrap;align-items:flex-start;">
          <div style={'flex:1 1 420px;min-width:280px;padding:20px;' + card}>
            <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:14px;">
              <div style="font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:19px;color:#2b2722;">{out.qPrompt}</div>
              <button onClick={out.qReplay} style="display:inline-flex;align-items:center;gap:7px;background:#efe7d4;color:#5c5447;border:1px solid #e0d6bf;padding:8px 14px;border-radius:999px;font-weight:700;font-size:13px;cursor:pointer;font-family:'Manrope',sans-serif;">▶ Replay</button>
            </div>
            <div style="background:#efe7d4;border:1px solid #ddd2b8;border-radius:12px;padding:10px 6px;overflow-x:auto;">{out.qBoardEl}</div>

            {out.qIsName && (
              <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:16px;">
                {out.qChoices.map((ch, i) => <button key={i} onClick={ch.onClick} style={ch.style}>{ch.label}</button>)}
              </div>
            )}

            <div style={out.qFeedbackStyle} role="status" aria-live="polite">{out.qFeedbackText}</div>
            {out.qShowNext && (
              <button onClick={out.qNext} style="margin-top:14px;background:#34302a;color:#f6f1e4;border:none;padding:12px 22px;border-radius:12px;font-weight:800;font-size:14.5px;cursor:pointer;font-family:'Manrope',sans-serif;">Next question →</button>
            )}
          </div>

          <div style={'flex:1 1 240px;min-width:220px;padding:20px;' + card}>
            <div style={kicker + 'margin-bottom:14px;'}>Your progress</div>
            <div style="display:flex;gap:22px;">
              <div>
                <div style={statBig('#4f8568')}>{out.qScore}</div>
                <div style={statLabel}>correct</div>
              </div>
              <div>
                <div style={statBig('#3c372f')}>{out.qAccuracy}</div>
                <div style={statLabel}>accuracy</div>
              </div>
            </div>
            <div style="margin-top:14px;">
              <div style={row}><span style="color:#6f6759;">Current streak</span><strong style="color:#3c372f;">{out.qStreak}</strong></div>
              <div style={row}><span style="color:#6f6759;">Best streak</span><strong style="color:#3c372f;">{out.qBest}</strong></div>
            </div>
            <div style="margin-top:14px;padding:12px 14px;background:#efe7d4;border:1px solid #e0d6bf;border-radius:12px;font-size:13px;line-height:1.55;color:#6d6456;">
              <span style="font-weight:700;color:#6e6553;">Tip · </span>{out.qTip}
            </div>
          </div>
        </div>
      </section>
    );
  }
}
