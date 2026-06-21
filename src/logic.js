import { Component, h, Fragment } from 'preact';

// The design's SVG renderers were written for React, which auto-translates
// camelCase SVG presentation attributes (fontFamily → font-family, etc.).
// Preact passes them through verbatim, so we translate them here. Without this,
// SVG <text> ignores font-family/size and music glyphs render as tofu boxes.
const SVG_ATTR_MAP = {
  fontFamily: 'font-family', fontSize: 'font-size', fontWeight: 'font-weight',
  fontStyle: 'font-style', textAnchor: 'text-anchor', letterSpacing: 'letter-spacing',
  strokeWidth: 'stroke-width', strokeLinecap: 'stroke-linecap', strokeLinejoin: 'stroke-linejoin',
  strokeDasharray: 'stroke-dasharray', strokeOpacity: 'stroke-opacity', fillOpacity: 'fill-opacity',
  dominantBaseline: 'dominant-baseline', textTransform: 'text-transform', clipPath: 'clip-path',
};
function createElement(type, props, ...children) {
  if (props && typeof type === 'string') {
    let mapped = null;
    for (const k in props) {
      if (SVG_ATTR_MAP[k]) {
        if (!mapped) { mapped = {}; for (const j in props) mapped[j] = props[j]; }
        delete mapped[k];
        mapped[SVG_ATTR_MAP[k]] = props[k];
      }
    }
    if (mapped) props = mapped;
  }
  return h(type, props, ...children);
}

// Shim so the design's verbatim React.createElement-based SVG renderers run on Preact.
const React = { createElement, Fragment };

export class FretwiseLogic extends Component {
  constructor(props){
    super(props);
    this.SHARP=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
    this.FLAT =['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
    this.OPEN=[40,45,50,55,59,64];
    this.ORD=['6th','5th','4th','3rd','2nd','1st'];
    this.SCALES={
      none:{name:'No scale',iv:null},
      major:{name:'Major',iv:[0,2,4,5,7,9,11]},
      minor:{name:'Natural minor',iv:[0,2,3,5,7,8,10]},
      majPent:{name:'Major pentatonic',iv:[0,2,4,7,9]},
      minPent:{name:'Minor pentatonic',iv:[0,3,5,7,10]},
      blues:{name:'Blues',iv:[0,3,5,6,7,10]}
    };
    this.CHORDS={
      basic:[
        {name:'C',frets:[null,3,2,0,1,0],root:0},
        {name:'D',frets:[null,null,0,2,3,2],root:2},
        {name:'E',frets:[0,2,2,1,0,0],root:4},
        {name:'G',frets:[3,2,0,0,0,3],root:7},
        {name:'A',frets:[null,0,2,2,2,0],root:9},
        {name:'Am',frets:[null,0,2,2,1,0],root:9},
        {name:'Dm',frets:[null,null,0,2,3,1],root:2},
        {name:'Em',frets:[0,2,2,0,0,0],root:4},
        {name:'F',frets:[1,3,3,2,1,1],root:5},
        {name:'Bm',frets:[null,2,4,4,3,2],root:11}
      ],
      seventh:[
        {name:'Cmaj7',frets:[null,3,2,0,0,0],root:0},
        {name:'Am7',frets:[null,0,2,0,1,0],root:9},
        {name:'Dm7',frets:[null,null,0,2,1,1],root:2},
        {name:'Em7',frets:[0,2,2,0,3,0],root:4},
        {name:'G7',frets:[3,2,0,0,0,1],root:7},
        {name:'C7',frets:[null,3,2,3,1,0],root:0},
        {name:'D7',frets:[null,null,0,2,1,2],root:2},
        {name:'E7',frets:[0,2,0,1,0,0],root:4},
        {name:'A7',frets:[null,0,2,0,2,0],root:9},
        {name:'B7',frets:[null,2,1,2,0,2],root:11},
        {name:'Cadd9',frets:[null,3,2,0,3,0],root:0},
        {name:'Asus2',frets:[null,0,2,2,0,0],root:9},
        {name:'Dsus4',frets:[null,null,0,2,3,3],root:2}
      ],
      power:[
        {name:'E5',frets:[0,2,2,null,null,null],root:4},
        {name:'A5',frets:[null,0,2,2,null,null],root:9},
        {name:'D5',frets:[null,null,0,2,3,null],root:2},
        {name:'G5',frets:[3,5,5,null,null,null],root:7},
        {name:'C5',frets:[null,3,5,5,null,null],root:0},
        {name:'F5',frets:[1,3,3,null,null,null],root:5},
        {name:'B5',frets:[null,2,4,4,null,null],root:11}
      ]
    };
    this.CATS=[['basic','Major & minor'],['seventh','7ths & color'],['power','Power chords']];
    this.state={
      tab:(props&&props.defaultTab)||'fretboard',
      accidental:'sharp', scaleRoot:0, scaleType:'none', scaleOnly:false,
      sel:{i:1,f:3,midi:48},
      chordCat:'basic', chordIdx:0, animTick:1, strumId:0, scalePlayId:0,
      qMode:'name', qPos:null, qChoices:[], qAnswer:null, qTarget:null,
      qResult:null, qWrong:null, qWrongNote:null, qReveal:[],
      qScore:0, qTotal:0, qStreak:0, qBest:0,
      isMobile:(typeof window!=='undefined' && window.innerWidth<=640)
    };
  }
  componentDidMount(){ if(this.state.tab==='quiz') this.newQuestion(); this._onResize=()=>{ const m=window.innerWidth<=640; if(m!==this.state.isMobile) this.setState({isMobile:m}); }; window.addEventListener('resize',this._onResize); this._onResize(); }
  componentWillUnmount(){ if(this._onResize) window.removeEventListener('resize',this._onResize); }

  // ---------- audio ----------
  ensureAudio(){
    if(!this.ctx){
      const AC=window.AudioContext||window.webkitAudioContext, ctx=this.ctx=new AC();
      this.master=ctx.createGain(); this.master.gain.value=0.62;
      const comp=ctx.createDynamicsCompressor(); comp.threshold.value=-8; comp.knee.value=3; comp.ratio.value=14; comp.attack.value=0.003; comp.release.value=0.2;
      this.master.connect(comp); comp.connect(ctx.destination);
      this.voices=[];
      // shared acoustic-body tone chain (models a real guitar's resonances)
      this.toneIn=ctx.createGain();
      const hp=ctx.createBiquadFilter(); hp.type='highpass'; hp.frequency.value=66;
      const air=ctx.createBiquadFilter(); air.type='peaking'; air.frequency.value=108; air.Q.value=1.1; air.gain.value=2.5;
      const body=ctx.createBiquadFilter(); body.type='peaking'; body.frequency.value=212; body.Q.value=0.8; body.gain.value=3;
      const scoop=ctx.createBiquadFilter(); scoop.type='peaking'; scoop.frequency.value=420; scoop.Q.value=1.0; scoop.gain.value=-2.5;
      const pres=ctx.createBiquadFilter(); pres.type='peaking'; pres.frequency.value=3200; pres.Q.value=0.7; pres.gain.value=2;
      const tame=ctx.createBiquadFilter(); tame.type='lowpass'; tame.frequency.value=7200; tame.Q.value=0.5;
      this.toneIn.connect(hp); hp.connect(air); air.connect(body); body.connect(scoop); scoop.connect(pres); pres.connect(tame); tame.connect(this.master);
      // subtle room reverb for realism
      const conv=ctx.createConvolver(); conv.buffer=this.makeIR(1.5,3.4);
      const wet=ctx.createGain(); wet.gain.value=0.085;
      tame.connect(conv); conv.connect(wet); wet.connect(this.master);
      this.bufs={};
    }
    if(this.ctx.state==='suspended') this.ctx.resume();
  }
  makeIR(dur,decay){
    const ctx=this.ctx, sr=ctx.sampleRate, len=Math.floor(sr*dur), buf=ctx.createBuffer(2,len,sr);
    for(let c=0;c<2;c++){ const d=buf.getChannelData(c); for(let i=0;i<len;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/len,decay); }
    return buf;
  }
  freq(m){ return 440*Math.pow(2,(m-69)/12); }
  buffer(midi){
    if(this.bufs[midi]) return this.bufs[midi];
    const ctx=this.ctx, sr=ctx.sampleRate, f=this.freq(midi);
    const T60=Math.max(1.6, 4.2 - (midi-40)*0.055), dur=Math.min(4.8, T60+0.5);
    const N=Math.max(2,Math.round(sr/f)), len=Math.floor(sr*dur);
    const buf=ctx.createBuffer(1,len,sr), out=buf.getChannelData(0);
    // excitation: gently lowpassed noise burst (a soft fingerstyle pluck)
    const noise=new Float32Array(N); let lp=0;
    for(let i=0;i<N;i++){ const w=Math.random()*2-1; lp=lp+0.28*(w-lp); noise[i]=lp; }
    // pluck-position comb: a real string struck ~1/5 from the bridge loses the harmonics that have a node there
    const D=Math.max(1,Math.round(0.19*N)), dl=new Float32Array(N);
    for(let i=0;i<N;i++) dl[i]=noise[i]-noise[(i-D+N)%N];
    let mean=0; for(let i=0;i<N;i++) mean+=dl[i]; mean/=N;
    let pk=1e-6; for(let i=0;i<N;i++){ dl[i]-=mean; if(Math.abs(dl[i])>pk) pk=Math.abs(dl[i]); }
    for(let i=0;i<N;i++) dl[i]/=pk;
    // Karplus-Strong with one-pole damping; R sets the sustain (long, like a real string)
    const R=Math.exp(Math.log(0.001)/(T60*sr)), damp=0.5;
    let idx=0, last=0;
    for(let i=0;i<len;i++){ const cur=dl[idx]; out[i]=cur; const filt=damp*cur+(1-damp)*last; last=filt; dl[idx]=R*filt; idx=(idx+1)%N; }
    // pick / finger attack transient — a short filtered-noise click at the onset
    const atkN=Math.floor(sr*0.011); let an=0;
    for(let i=0;i<atkN;i++){ const w=Math.random()*2-1; an=an+0.45*(w-an); out[i]+= an*0.16*(1-i/atkN); }
    const ramp=Math.floor(sr*0.004); for(let i=0;i<ramp;i++) out[i]*= i/ramp;
    const fade=Math.floor(sr*0.10); for(let i=0;i<fade;i++) out[len-1-i]*= i/fade;
    let mx=1e-6; for(let i=0;i<len;i++) if(Math.abs(out[i])>mx) mx=Math.abs(out[i]);
    const g=0.92/mx; for(let i=0;i<len;i++) out[i]*=g;
    this.bufs[midi]=buf; return buf;
  }
  pluck(midi,delay=0,gain=0.82){
    this.ensureAudio();
    const ctx=this.ctx, now=ctx.currentTime, t=now+delay;
    if(!this.voices) this.voices=[];
    // a real string only rings once — cut any current ring of the same note
    for(const v of this.voices.slice()){ if(v.midi===midi){ try{ v.g.gain.cancelScheduledValues(now); v.g.gain.setTargetAtTime(0.0001, now, 0.012); v.src.stop(now+0.08); }catch(e){} const k=this.voices.indexOf(v); if(k>=0) this.voices.splice(k,1); } }
    const src=ctx.createBufferSource(); src.buffer=this.buffer(midi);
    const g=ctx.createGain(), peak=gain*(midi<48?0.82:1);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t+0.005);
    src.connect(g); g.connect(this.toneIn); src.start(t);
    const voice={src,g,midi}; this.voices.push(voice);
    src.onended=()=>{ const k=this.voices.indexOf(voice); if(k>=0) this.voices.splice(k,1); };
    // cap polyphony so spamming can't pile up — fade out the oldest voices
    const MAX=8;
    while(this.voices.length>MAX){ const old=this.voices.shift(); try{ old.g.gain.cancelScheduledValues(now); old.g.gain.setTargetAtTime(0.0001, now, 0.05); old.src.stop(now+0.3); }catch(e){} }
  }
  strum(midis,gain=0.6,base=0){ this.ensureAudio(); midis.forEach((m,i)=> this.pluck(m, base+i*0.05, gain)); }
  findChord(name){ for(const cat in this.CHORDS){ const d=this.CHORDS[cat].find(c=>c.name===name); if(d) return d; } return null; }
  playProgression(names){ this.ensureAudio(); this._progToken=(this._progToken||0)+1; const token=this._progToken; names.forEach((nm,k)=>{ setTimeout(()=>{ if(token!==this._progToken) return; const def=this.findChord(nm); if(def) this.strum(this.buildChord(def).playOrder, 0.5); }, k*1000); }); }

  // ---------- note helpers ----------
  pc(m){ return ((m%12)+12)%12; }
  noteName(m){ return (this.state.accidental==='flat'?this.FLAT:this.SHARP)[this.pc(m)]; }
  octave(m){ return Math.floor(m/12)-1; }
  fretCount(){ return ((this.props&&this.props.maxFret)||12)+1; }

  // ---------- staff ----------
  staffNote(midi){
    const written=midi+12, p=this.pc(written), flat=this.state.accidental==='flat';
    const sL=[0,0,1,1,2,3,3,4,4,5,5,6], sA=[0,1,0,1,0,0,1,0,1,0,1,0];
    const fL=[0,1,1,2,2,3,4,4,5,5,6,6], fA=[0,-1,0,-1,0,0,-1,0,-1,0,-1,0];
    const letter=flat?fL[p]:sL[p], acc=flat?fA[p]:sA[p];
    const oct=Math.floor(written/12)-1, step=oct*7+letter, y=108-(step-34)*7;
    return {y,acc: acc===1?'\uE262': acc===-1?'\uE260': null};
  }
  ledgers(y){ const a=[]; for(let ly=66; ly>=18; ly-=14) if(y<=ly+0.5) a.push(ly); for(let ly=150; ly<=224; ly+=14) if(y>=ly-0.5) a.push(ly); return a; }
  staffElement(){
    const h=React.createElement, s=this.state, W=520, H=250;
    const lineYs=[80,94,108,122,136], active=s.scaleType!=='none';
    let show=[];
    if(active){ const iv=this.SCALES[s.scaleType].iv, rootMidi=60+s.scaleRoot; iv.forEach(d=> show.push({midi:rootMidi+d, root:d===0})); show.push({midi:rootMidi+12, root:true}); }
    else { show.push({midi:s.sel.midi, sel:true}); }
    const els=[];
    lineYs.forEach((y,i)=> els.push(h('line',{key:'l'+i,x1:14,x2:W-14,y1:y,y2:y,stroke:'#c3b89e',strokeWidth:1})));
    els.push(h('text',{key:'clef',x:20,y:122,fontFamily:'Bravura',fontSize:56,fill:'#33302a'},'\uE052'));
    const startX=150, span=Math.min(46,Math.max(40,(W-196)/Math.max(1,show.length)));
    const playing=s.scalePlayId>0 && active;
    show.forEach((n,idx)=>{
      const nx=active? startX+idx*span : 232;
      const info=this.staffNote(n.midi), y=info.y, color=n.root?'#c15f37':'#33302a';
      const inner=[];
      this.ledgers(y).forEach((ly,li)=> inner.push(h('line',{key:'ld'+li,x1:nx-13,x2:nx+13,y1:ly,y2:ly,stroke:'#9c9079',strokeWidth:1.4})));
      inner.push(h('text',{key:'nh',x:nx-11,y:y,fontFamily:'Bravura',fontSize:56,fill:color},'\uE0A2'));
      // accidental: right-anchored so it always clears the notehead's left edge
      if(info.acc) inner.push(h('text',{key:'ac',x:nx-16,y:y,textAnchor:'end',fontFamily:'Bravura',fontSize:46,fill:color},info.acc));
      els.push(h('g',{key:'n'+idx,style: playing?{animation:'notePop .45s ease both', animationDelay:(idx*0.32)+'s'}:null}, inner));
    });
    const slbl= active? (this.SHARP[s.scaleRoot]+' '+this.SCALES[s.scaleType].name+' scale shown on the treble staff') : ('Pick a note on the treble staff. Currently '+this.noteName(s.sel.midi)+this.octave(s.sel.midi));
    const sp={key:'staff'+(playing?s.scalePlayId:'x'),role:'img','aria-label':slbl,viewBox:'0 0 '+W+' '+H,width:'100%',style:{maxWidth:W,display:'block',margin:'0 auto',cursor:active?'default':'pointer'}};
    if(!active) sp.onClick=(e)=>{ const r=e.currentTarget.getBoundingClientRect(); this.pickFromStaffY((e.clientY-r.top)/r.height*H); };
    return h('svg',sp,els);
  }

  // ---------- chords ----------
  buildChord(c){
    const midis=c.frets.map((f,i)=> f==null? null : this.OPEN[i]+f);
    const present=[]; for(let i=0;i<6;i++) if(c.frets[i]!=null) present.push(i);
    const strumFrom=present[0];
    let rootIdx=present.find(i=> this.pc(this.OPEN[i]+c.frets[i])===c.root); if(rootIdx==null) rootIdx=strumFrom;
    const rootMidi=this.OPEN[rootIdx]+c.frets[rootIdx];
    const fifthPc=(c.root+7)%12; let fifthMidi=null;
    for(let i=0;i<6;i++) if(midis[i]!=null && this.pc(midis[i])===fifthPc){ fifthMidi=midis[i]; break; }
    if(fifthMidi==null) fifthMidi=rootMidi+7;
    const strings=[];
    for(let i=0;i<6;i++){
      const f=c.frets[i];
      if(f==null){ strings.push({i,muted:true,open:false,fret:null,label:'',name:''}); continue; }
      const iv=(this.pc(this.OPEN[i]+f)-c.root+12)%12;
      const lab= iv===0?'R': iv===7?'5': iv===4?'3': iv===3?'\u266D3': iv===5?'4': iv===9?'6': iv===10?'\u266D7': iv===11?'7': iv===2?'9': this.noteName(this.OPEN[i]+f);
      strings.push({i,muted:false,open:f===0,fret:f,label:lab,name:this.noteName(this.OPEN[i]+f)});
    }
    const notes=[]; for(let i=0;i<6;i++) if(midis[i]!=null) notes.push(this.noteName(midis[i]));
    const pos=c.frets.filter(f=>f!=null&&f>0);
    const start= pos.length && Math.max.apply(null,pos)>4 ? Math.min.apply(null,pos) : 1;
    const mutedAll=[0,1,2,3,4,5].filter(i=>!present.includes(i));
    const rw=this.noteName(rootMidi);
    let strumText;
    if(present.length===6){ strumText='Strum all six strings — the root, '+rw+', sits on the 6th string, so a full downstroke from the top sounds great.'; }
    else { const rc=rootIdx===strumFrom?'The root, '+rw+', is your lowest note, on the '+this.ORD[rootIdx]+' string.':'The root, '+rw+', sits on the '+this.ORD[rootIdx]+' string.'; strumText=rc+' Strum only the '+present.map(i=>this.ORD[i]).join(', ')+' strings — keep the '+mutedAll.map(i=>this.ORD[i]).join(', ')+' string'+(mutedAll.length>1?'s':'')+' silent (\u2715), by not striking them or muting lightly with your hand.'; }
    const ml=mutedAll.map(i=>this.ORD[i]), mlStr= ml.length<=1? ml.join('') : ml.slice(0,-1).join(', ')+' and '+ml[ml.length-1];
    const lastOrd=this.ORD[present[present.length-1]];
    const strumCaption = present.length===6
      ? 'One smooth downstroke across all six strings — the root is right there on the low E.'
      : 'Begin on the '+this.ORD[strumFrom]+' string (the root) and strum down through the '+lastOrd+' string. Leave the '+mlStr+' string'+(ml.length>1?'s':'')+' silent (\u2715).';
    return {name:c.name, strings, notes:notes.join('  '), rootName:rw, fifthName:this.noteName(fifthMidi),
      rootMidi, fifthMidi, strumText, strumCaption, start, playOrder:midis.filter(m=>m!=null), strumStrings:present.map(i=>6-i).join('–')+' strings', present};
  }
  chordDiagram(v, diagKey, strumId){
    const h=React.createElement, x0=44, dx=30, fh=38, rows=5, padT=46;
    const W=x0+5*dx+30, H=padT+rows*fh+34, base=[];
    // strings (flash on strum) — keyed by strumId so a strum remounts & replays
    const strEls=[];
    for(let i=0;i<6;i++){ const x=x0+i*dx; const ord=v.present.indexOf(i); const st={x1:x,x2:x,y1:padT,y2:padT+rows*fh,stroke:'#c4b89d',strokeWidth:1+(5-i)*0.25}; if(strumId>0 && ord>=0){ st.style={animation:'strumString .5s ease both', animationDelay:(ord*0.05)+'s'}; } strEls.push(h('line',Object.assign({key:'st'+i},st))); }
    base.push(h('g',{key:'strings'+strumId},strEls));
    for(let r=0;r<=rows;r++){ const y=padT+r*fh, nut=(v.start===1&&r===0); base.push(h('line',{key:'fr'+r,x1:x0,x2:x0+5*dx,y1:y,y2:y,stroke:nut?'#897b5d':'#d3c7ab',strokeWidth:nut?5:1})); }
    if(v.start>1) base.push(h('text',{key:'sf',x:x0-12,y:padT+fh-13,textAnchor:'end',fontFamily:'Space Grotesk',fontSize:12,fill:'#9a9080'},v.start+'fr'));
    // markers above + bottom names (static)
    v.strings.forEach(st=>{
      const x=x0+st.i*dx, col=this.dotColor(st.label);
      if(st.muted) base.push(h('text',{key:'m'+st.i,x:x,y:padT-16,textAnchor:'middle',fontSize:15,fontFamily:'Space Grotesk',fill:'#b3a890'},'\u2715'));
      else if(st.open) base.push(h('circle',{key:'o'+st.i,cx:x,cy:padT-20,r:6.5,fill:'none',stroke:col,strokeWidth:2}));
      const bn= st.muted?'\u2715': st.name, bc= st.muted?'#b3a890':col;
      base.push(h('text',{key:'bn'+st.i,x:x,y:padT+rows*fh+20,textAnchor:'middle',fontFamily:'Space Grotesk',fontSize:11,fontWeight:600,fill:bc},bn));
    });
    // finger dots — keyed by diagKey so changing chord / replay re-animates
    const fingered=v.strings.filter(st=>!st.muted && st.fret>0);
    const dotEls=fingered.map((st,order)=>{
      const x=x0+st.i*dx, rel=st.fret-v.start+1, y=padT+(rel-0.5)*fh, col=this.dotColor(st.label);
      return h('g',{key:'d'+st.i,style:{animation:'fingerDrop .5s cubic-bezier(.2,.7,.3,1) both', animationDelay:(order*0.13)+'s'}},[
        h('circle',{key:'c',cx:x,cy:y,r:12.5,fill:col}),
        h('text',{key:'t',x:x,y:y+4,textAnchor:'middle',fontFamily:'Space Grotesk',fontSize:11,fontWeight:700,fill:'#fff'},st.label)
      ]);
    });
    base.push(h('g',{key:'fingers'+diagKey},dotEls));
    // strum pick sweep — keyed by strumId
    if(strumId>0){
      const fX=x0+v.present[0]*dx, lX=x0+v.present[v.present.length-1]*dx, sweep=(lX-fX)+10;
      base.push(h('g',{key:'pick'+strumId,style:{animation:'pickAcross .55s ease both','--sweep':sweep+'px'}},[
        h('line',{key:'pl',x1:fX,x2:fX,y1:padT-8,y2:padT+rows*fh+8,stroke:'#c15f37',strokeWidth:2.5,opacity:0.55}),
        h('path',{key:'pp',d:'M'+fX+' '+(padT-14)+' l-5 -8 l10 0 z',fill:'#c15f37'})
      ]));
    }
    return h('svg',{role:'img','aria-label':v.name+' chord shape diagram',viewBox:'0 0 '+W+' '+H,width:'100%',style:{maxWidth:W,display:'block',margin:'0 auto'}},base);
  }
  dotColor(lab){ return lab==='R'?'#c15f37': lab==='5'?'#4f8568': (lab==='3'||lab==='\u266D3')?'#b07d2e': '#6a6f86'; }
  toneTag(lab){ const m={'R':'ROOT','5':'5TH','3':'3RD','\u266D3':'\u266D3','7':'7TH','\u266D7':'\u266D7','9':'9TH','4':'4TH','6':'6TH'}; return m[lab]||lab; }
  // WCAG-AA darkened variants of dotColor for small tag TEXT on light cards
  // (the saturated dotColor stays for fills/dots, which carry white text).
  toneInk(lab){ return lab==='R'?'#9f4e2d': lab==='5'?'#426f57': (lab==='3'||lab==='♭3')?'#865f23': '#6a6f86'; }
  strumStrip(cv){
    const h=React.createElement, padX=16, cw=46, W=padX*2+6*cw, H=120, els=[];
    cv.strings.forEach(st=>{
      const cx=padX+st.i*cw+cw/2;
      els.push(h('text',{key:'sn'+st.i,x:cx,y:14,textAnchor:'middle',fontFamily:'Space Grotesk',fontSize:10.5,fontWeight:600,fill:'#79705f'}, String(6-st.i)));
      if(st.muted){
        els.push(h('rect',{key:'mc'+st.i,x:cx-18,y:24,width:36,height:34,rx:9,fill:'#f1ead8',stroke:'#d8ccb2',strokeDasharray:'3 3'}));
        els.push(h('text',{key:'mx'+st.i,x:cx,y:46,textAnchor:'middle',fontFamily:'Space Grotesk',fontSize:15,fill:'#b3a890'},'\u2715'));
      } else {
        const col=this.dotColor(st.label);
        els.push(h('rect',{key:'pc'+st.i,x:cx-18,y:24,width:36,height:34,rx:9,fill:col}));
        els.push(h('text',{key:'pn'+st.i,x:cx,y:46,textAnchor:'middle',fontFamily:'Space Grotesk',fontSize:14,fontWeight:700,fill:'#fff'},st.name));
        const tag=this.toneTag(st.label);
        els.push(h('text',{key:'rt'+st.i,x:cx,y:73,textAnchor:'middle',fontFamily:'Space Grotesk',fontSize:9,fontWeight:700,letterSpacing:'.05em',fill:this.toneInk(st.label)}, tag));
      }
    });
    const p=cv.present, fx=padX+p[0]*cw+cw/2, lx=padX+p[p.length-1]*cw+cw/2, ay=96;
    els.push(h('line',{key:'arl',x1:fx,x2:lx+6,y1:ay,y2:ay,stroke:'#a89a78',strokeWidth:2}));
    els.push(h('path',{key:'arh',d:'M'+(lx+5)+' '+(ay-5)+' L'+(lx+14)+' '+ay+' L'+(lx+5)+' '+(ay+5)+' Z',fill:'#a89a78'}));
    els.push(h('circle',{key:'sd',cx:fx,cy:ay,r:4.5,fill:'#c15f37',stroke:'#fff',strokeWidth:1.5}));
    els.push(h('text',{key:'sl',x:fx,y:ay+18,textAnchor:'middle',fontFamily:'Space Grotesk',fontSize:10,fontWeight:700,fill:'#c15f37'},'start here'));
    els.push(h('text',{key:'dd',x:lx,y:ay+18,textAnchor:'middle',fontFamily:'Manrope',fontSize:10,fontWeight:600,fill:'#79705f'},'downstroke'));
    return h('svg',{role:'img','aria-label':'Which strings to strum for '+cv.name+' — start on the root',viewBox:'0 0 '+W+' '+H,width:'100%',style:{maxWidth:W,display:'block',margin:'0 auto'}},els);
  }

  // ---------- quiz ----------
  miniBoard(opts){
    const h=React.createElement, padL=46, padT=18, cw=30, ch=24, frets=this.fretCount();
    const W=padL+frets*cw+12, H=padT+6*ch+24, els=[];
    for(let i=0;i<6;i++){ const y=padT+i*ch+ch/2; els.push(h('line',{key:'s'+i,x1:padL,x2:padL+frets*cw,y1:y,y2:y,stroke:'rgba(120,108,84,'+(0.3+(5-i)*0.05)+')',strokeWidth:1+(5-i)*0.35})); els.push(h('text',{key:'sl'+i,x:padL-9,y:y+4,textAnchor:'end',fontFamily:'Space Grotesk',fontSize:12.5,fontWeight:700,fill:'#3b352c'},this.noteName(this.OPEN[i]))); }
    for(let f=0;f<=frets;f++){ const x=padL+f*cw, nut=f===1; els.push(h('line',{key:'f'+f,x1:x,x2:x,y1:padT,y2:padT+6*ch,stroke:nut?'#897b5d':'#d3c7ab',strokeWidth:nut?3:1})); }
    [3,5,7,9].forEach(f=>{ if(f<frets) els.push(h('circle',{key:'in'+f,cx:padL+f*cw-cw/2,cy:padT+6*ch+10,r:2.6,fill:'#cabd9f'})); });
    if(12<frets){ els.push(h('circle',{key:'in12a',cx:padL+12*cw-cw/2-4,cy:padT+6*ch+10,r:2.6,fill:'#cabd9f'})); els.push(h('circle',{key:'in12b',cx:padL+12*cw-cw/2+4,cy:padT+6*ch+10,r:2.6,fill:'#cabd9f'})); }
    const dot=(i,f,fill,label,glow)=>{ const x=padL+f*cw-cw/2, y=padT+i*ch+ch/2; els.push(h('circle',{key:'k'+i+'_'+f,cx:x,cy:y,r:10.5,fill:fill,stroke:'#fffdf8',strokeWidth:1.4,style:glow?{filter:'drop-shadow(0 1px 3px rgba(120,90,40,.4))'}:null})); if(label) els.push(h('text',{key:'kl'+i+'_'+f,x:x,y:y+4,textAnchor:'middle',fontFamily:'Space Grotesk',fontSize:11,fontWeight:700,fill:'#fff'},label)); };
    (opts.reveal||[]).forEach(key=>{ const p=key.split('_'); dot(+p[0],+p[1],'#4f8568',null,false); });
    if(opts.highlight) dot(opts.highlight.i,opts.highlight.f,'#b07d2e','?',true);
    if(opts.wrong){ const x=padL+opts.wrong.f*cw-cw/2, y=padT+opts.wrong.i*ch+ch/2; els.push(h('circle',{key:'wr',cx:x,cy:y,r:11.5,fill:'none',stroke:'#c0533a',strokeWidth:2.5})); }
    if(opts.clickable){ for(let i=0;i<6;i++)for(let f=0;f<frets;f++){ const ii=i,ff=f; els.push(h('rect',{key:'r'+i+'_'+f,x:padL+f*cw,y:padT+i*ch,width:cw,height:ch,fill:'transparent',tabIndex:0,role:'button','aria-label':this.noteName(this.OPEN[ii]+ff)+', '+this.ORD[ii]+' string '+(ff===0?'open':'fret '+ff),style:{cursor:'pointer'},onClick:()=>opts.onCell(ii,ff),onKeyDown:(e)=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();opts.onCell(ii,ff);}}})); } }
    return h('svg',{role:'img','aria-label': opts.clickable?'Tap or select a fret to place your answer':'Practice fretboard',viewBox:'0 0 '+W+' '+H,width:'100%',style:{maxWidth:W,display:'block'}},els);
  }
  newQuestion(){
    const fc=this.fretCount();
    if(this.state.qMode==='name'){
      const i=Math.floor(Math.random()*6), f=Math.floor(Math.random()*fc), midi=this.OPEN[i]+f, correct=this.noteName(midi);
      const names=this.state.accidental==='flat'?this.FLAT:this.SHARP, opts=new Set([correct]);
      while(opts.size<4) opts.add(names[Math.floor(Math.random()*12)]);
      this.setState({qPos:{i,f,midi}, qChoices:Array.from(opts).sort(()=>Math.random()-0.5), qAnswer:correct, qResult:null, qWrong:null, qWrongNote:null, qReveal:[]});
      this.pluck(midi);
    } else { const t=Math.floor(Math.random()*12); this.setState({qTarget:t, qResult:null, qWrong:null, qWrongNote:null, qReveal:[]}); this.pluck(48+t); }
  }
  answerName(choice){ if(this.state.qResult) return; const ok=choice===this.state.qAnswer; this.score(ok); this.setState({qResult: ok?'correct':'wrong', qWrongNote: ok?null:choice}); }
  answerFind(i,f){ if(this.state.qResult) return; const midi=this.OPEN[i]+f, ok=this.pc(midi)===this.state.qTarget; const reveal=[]; for(let s=0;s<6;s++)for(let ff=0;ff<this.fretCount();ff++) if(this.pc(this.OPEN[s]+ff)===this.state.qTarget) reveal.push(s+'_'+ff); this.score(ok); this.setState({qResult: ok?'correct':'wrong', qWrong: ok?null:{i,f}, qWrongNote:this.noteName(midi), qReveal:reveal}); this.pluck(midi); }
  score(ok){ this.setState(s=>{ const streak=ok?s.qStreak+1:0; return {qScore:s.qScore+(ok?1:0), qTotal:s.qTotal+1, qStreak:streak, qBest:Math.max(s.qBest,streak)}; }); }

  // ---------- actions ----------
  selectFret(i,f){ const midi=this.OPEN[i]+f; this.setState({sel:{i,f,midi}}); this.pluck(midi); }
  pickStaffMidi(m){ const lo=40, hi=64+this.fretCount()-1; m=Math.max(lo,Math.min(hi,m)); this.setState({sel:{i:null,f:null,midi:m}}); this.pluck(m); }
  pickFromStaffY(yv){ const step=Math.round(34+(108-yv)/7); const li=((step%7)+7)%7, oct=(step-li)/7; const semis=[0,2,4,5,7,9,11][li]; const written=(oct+1)*12+semis; this.pickStaffMidi(written-12); }
  stepNote(d){ this.pickStaffMidi(this.state.sel.midi+d); }
  setTab(t){ this.setState({tab:t}); if(t==='quiz' && !this.state.qPos && this.state.qMode==='name') this.newQuestion(); }
  playScaleNow(){ if(this.state.scaleType==='none') return; const iv=this.SCALES[this.state.scaleType].iv, root=60+this.state.scaleRoot; iv.map(d=>root+d).concat([root+12]).forEach((m,k)=> this.pluck(m, k*0.32, 0.8)); this.setState(st=>({scalePlayId:st.scalePlayId+1})); }

  renderVals(){
    const s=this.state, self=this;
    const M0=s.isMobile;
    const segBase='padding:'+(M0?'12px 18px':'9px 16px')+';border-radius:'+(M0?'11px':'9px')+';font-weight:600;font-size:'+(M0?'14.5px':'13px')+';cursor:pointer;font-family:Manrope,sans-serif;transition:all .15s;white-space:nowrap;'+(M0?'min-height:46px;display:inline-flex;align-items:center;justify-content:center;':'');
    const seg=(on)=> segBase+(on? 'background:#fbf9f2;color:#34302a;border:1px solid #e4dcc9;box-shadow:0 1px 3px rgba(70,56,30,.12);' : 'background:transparent;color:#676154;border:1px solid transparent;');
    const ctrl=(on,accent)=> 'padding:'+(M0?'11px 15px':'8px 13px')+';border-radius:'+(M0?'11px':'9px')+';font-weight:700;font-size:'+(M0?'14px':'12.5px')+';cursor:pointer;font-family:Manrope,sans-serif;transition:all .15s;white-space:nowrap;'+(M0?'min-height:44px;display:inline-flex;align-items:center;':'')+(on? 'background:'+accent.bg+';color:'+accent.fg+';border:1px solid '+accent.bd+';' : 'background:#fbf9f2;color:#7a7163;border:1px solid #e0d6bf;');
    const INK={bg:'#34302a',fg:'#f6f1e4',bd:'#34302a'}, TERRA={bg:'#f5e2d6',fg:'#a44f2c',bd:'#e6c4ad'}, SAGEA={bg:'#dceadb',fg:'#3a6e54',bd:'#c2dcc0'};
    const selectStyle='background:#fbf9f2;color:#34302a;border:1px solid #ddd2b8;border-radius:9px;padding:'+(M0?'11px 12px':'8px 10px')+';font-family:Manrope,sans-serif;font-size:'+(M0?'15px':'13px')+';font-weight:600;cursor:pointer;'+(M0?'flex:1;min-width:0;':'');

    const tabDef=[['fretboard','Fretboard'],['chords','Chords'],['quiz','Ear Trainer']];
    const tabBtns=tabDef.map(([k,l])=>({key:k,label:l,onClick:()=>self.setTab(k),
      style:(M0?'flex:1;padding:12px 10px;font-size:14px;min-height:46px;':'padding:9px 18px;font-size:14px;')+'border-radius:9px;font-weight:600;cursor:pointer;font-family:Space Grotesk,sans-serif;transition:all .15s;border:none;white-space:nowrap;display:inline-flex;align-items:center;justify-content:center;'+(s.tab===k?'background:#fbf9f2;color:#2b2722;box-shadow:0 1px 4px rgba(70,56,30,.16);':'background:transparent;color:#676154;')}));
    const navStyle=(M0?'display:flex;width:100%;':'display:inline-flex;')+'gap:5px;background:#e7dfcd;padding:5px;border-radius:13px;';

    const out={ tabBtns, navStyle, selectStyle, isFret:s.tab==='fretboard', isChords:s.tab==='chords', isQuiz:s.tab==='quiz', showInlays:(self.props&&self.props.showInlays)!==false };

    // ----- fretboard -----
    const fc=self.fretCount(), active=s.scaleType!=='none', iv=active?self.SCALES[s.scaleType].iv:null;
    const gridCols='52px repeat('+fc+',minmax(30px,1fr))';
    out.numRowStyle='display:grid;grid-template-columns:'+gridCols+';align-items:center;';
    out.fretNums=Array.from({length:fc},(_,n)=>({label:String(n)}));
    out.inlays=Array.from({length:fc},(_,f)=>{ const single=[3,5,7,9,15,17,19,21].includes(f), dbl=(f===12||f===24); const ds='width:7px;height:7px;border-radius:50%;background:#cabd9f;'; return {dotStyle:(single||dbl)?ds:'width:0;', dot2Style:dbl?ds:'width:0;'}; });
    const RING='0 0 0 2.5px #2b2722, 0 2px 7px rgba(50,38,16,.32)';
    const M=s.isMobile; out.isMobile=M; out.notMobile=!M;
    const chipPx=M?42:33, chipFs=M?16:13;
    const mkChip=(i,f)=>{
      const midi=self.OPEN[i]+f, p=self.pc(midi);
      const inScale=active? iv.includes(((p-s.scaleRoot)%12+12)%12):false, isRoot=active? p===s.scaleRoot:false;
      const here=(midi===s.sel.midi), exact=(s.sel.i!=null && i===s.sel.i && f===s.sel.f);
      let bg='#f7f0de', bd='#e1d5b9', color='#3b352c', ring='none', op=1, tf='none';
      if(active){ if(isRoot){bg='#c15f37';bd='#a44f2c';color='#fff';} else if(inScale){bg='#b9d4ac';bd='#94bd85';color='#1f4527';} else {bg='#f3ecd9';bd='#e8dec7';color='#79705f'; if(s.scaleOnly) op=0.32;} if(exact){ring=RING;tf='scale(1.1)';} }
      else { if(here){bg='#f4cf86';bd='#dcae54';color='#4a3810';} if(exact||(here&&s.sel.i==null)){ring=RING;tf='scale(1.1)';} }
      const chipStyle='min-width:'+chipPx+'px;height:'+chipPx+'px;padding:0 6px;border-radius:9px;display:grid;place-items:center;font-family:Space Grotesk,sans-serif;font-weight:700;font-size:'+chipFs+'px;background:'+bg+';border:1px solid '+bd+';color:'+color+';box-shadow:'+ring+';opacity:'+op+';transform:'+tf+';transition:transform .12s ease;';
      const aria=self.noteName(midi)+self.octave(midi)+', '+self.ORD[i]+' string, '+(f===0?'open':'fret '+f);
      return {midi,name:self.noteName(midi),onClick:()=>self.selectFret(i,f),onKey:(e)=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();self.selectFret(i,f);}},aria,title:self.noteName(midi)+self.octave(midi),chipStyle};
    };
    out.board=[0,1,2,3,4,5].map(i=>{
      const t=(6-i)*0.55+0.8, half=t/2;
      const frets=Array.from({length:fc},(_,f)=>{ const c=mkChip(i,f); const cellStyle='position:relative;height:46px;display:flex;align-items:center;justify-content:center;cursor:pointer;'+(f===0?'':(f===1?'border-left:4px solid #82734f;':'border-left:1px solid #c9ba98;')); return Object.assign({f,cellStyle},c); });
      const rowStyle='display:grid;grid-template-columns:'+gridCols+';align-items:center;background:linear-gradient(to bottom, transparent calc(50% - '+half+'px), #aa9b7c calc(50% - '+half+'px), #aa9b7c calc(50% + '+half+'px), transparent calc(50% + '+half+'px));';
      return {label:self.noteName(self.OPEN[i]), num:String(6-i), rowStyle, frets};
    });
    // vertical board for phones: columns = strings (low E left), rows = frets (0 at top)
    if(M){
      out.vGrid='34px repeat(6,1fr)';
      out.vHeaders=[0,1,2,3,4,5].map(i=>({num:String(6-i), label:self.noteName(self.OPEN[i])}));
      out.vRows=Array.from({length:fc},(_,f)=>{
        const marker=[3,5,7,9,12].includes(f), dbl=(f===12);
        const cells=[0,1,2,3,4,5].map(i=>{ const c=mkChip(i,f); const th=(6-i)*0.4+0.9, half=th/2;
          const cellStyle='position:relative;height:54px;display:flex;align-items:center;justify-content:center;cursor:pointer;background:linear-gradient(to right, transparent calc(50% - '+half+'px), #aa9b7c calc(50% - '+half+'px), #aa9b7c calc(50% + '+half+'px), transparent calc(50% + '+half+'px));'+(f===0?'':(f===1?'border-top:4px solid #82734f;':'border-top:1px solid #c9ba98;'));
          return Object.assign({cellStyle},c); });
        return {fret:f, fretLabel:String(f), marker, dbl, cells};
      });
    }
    out.setSharp=()=>self.setState({accidental:'sharp'}); out.setFlat=()=>self.setState({accidental:'flat'});
    out.accSharpStyle=ctrl(s.accidental==='sharp',INK); out.accFlatStyle=ctrl(s.accidental==='flat',INK);
    out.keyOptions=Array.from({length:12},(_,p)=>({v:String(p),label:(s.accidental==='flat'?self.FLAT:self.SHARP)[p]}));
    out.scaleKeyValue=String(s.scaleRoot); out.onScaleKey=e=>self.setState({scaleRoot:Number(e.target.value)});
    out.typeOptions=Object.keys(self.SCALES).map(k=>({v:k,label:self.SCALES[k].name}));
    out.scaleTypeValue=s.scaleType; out.onScaleType=e=>self.setState({scaleType:e.target.value});
    out.toggleScaleOnly=()=>self.setState({scaleOnly:!s.scaleOnly});
    out.scaleOnlyStyle=ctrl(s.scaleOnly&&active,{bg:'#e7ddf0',fg:'#6a4f8a',bd:'#d6c6e6'});
    out.playScale=()=>self.playScaleNow(); out.playScaleStyle=ctrl(false,INK)+(active?'':'opacity:.4;pointer-events:none;');
    out.selName=self.noteName(s.sel.midi);
    out.selColor=active?(self.pc(s.sel.midi)===s.scaleRoot?'#c15f37':(iv.includes(((self.pc(s.sel.midi)-s.scaleRoot)%12+12)%12)?'#4f8568':'#34302a')):'#34302a';
    out.selOctaveLabel='Octave '+self.octave(s.sel.midi); out.selFreq=self.freq(s.sel.midi).toFixed(2);
    if(s.sel.i!=null){ out.selPosition=(s.sel.f===0?'Open string':'Fret '+s.sel.f)+' · '+self.ORD[s.sel.i]+' string ('+self.noteName(self.OPEN[s.sel.i])+')'; }
    else { const ps=[]; for(let bi=0;bi<6;bi++)for(let bf=0;bf<fc;bf++) if(self.OPEN[bi]+bf===s.sel.midi) ps.push(self.ORD[bi]+' '+(bf===0?'open':'fret '+bf)); out.selPosition= ps.length? 'On the neck: '+ps.join('  ·  ') : 'Above the 12th fret'; }
    out.playSelected=()=>self.pluck(s.sel.midi);
    out.staffPickable=!active; out.stepUp=()=>self.stepNote(1); out.stepDown=()=>self.stepNote(-1); out.octUp=()=>self.stepNote(12); out.octDown=()=>self.stepNote(-12);
    const selPc=self.pc(s.sel.midi); let ins='';
    if(self.SHARP[selPc]!==self.FLAT[selPc]) ins=self.SHARP[selPc]+' and '+self.FLAT[selPc]+' name the same pitch (enharmonic). ';
    if(active){ const semi=((selPc-s.scaleRoot)%12+12)%12; const dm={0:'root (1)',1:'\u266D2nd',2:'2nd',3:'\u266D3rd',4:'3rd',5:'4th',6:'\u266D5th',7:'5th',8:'\u266D6th',9:'6th',10:'\u266D7th',11:'7th'};
      ins+= iv.includes(semi)? 'In '+self.SHARP[s.scaleRoot]+' '+self.SCALES[s.scaleType].name+' it is the '+dm[semi]+'.' : 'It sits outside '+self.SHARP[s.scaleRoot]+' '+self.SCALES[s.scaleType].name+' — a chromatic passing tone.'; }
    else ins+='The very same note repeats 12 frets higher, one octave up.';
    out.selInsight=ins;
    out.staffTitle=active? self.SHARP[s.scaleRoot]+' '+self.SCALES[s.scaleType].name : 'On the staff';
    out.staffEl=self.staffElement();

    // ----- chords -----
    const list=self.CHORDS[s.chordCat], idx=Math.min(s.chordIdx,list.length-1);
    out.catBtns=self.CATS.map(([k,l])=>({key:k,label:l,onClick:()=>self.setState({chordCat:k,chordIdx:0,animTick:s.animTick+1}),style:seg(s.chordCat===k)}));
    out.chordList=list.map((c,k)=>({name:c.name,onClick:()=>self.setState({chordIdx:k,animTick:s.animTick+1}),
      style:(M0?'min-width:50px;padding:11px 16px;min-height:46px;font-size:16px;':'min-width:52px;padding:9px 15px;font-size:15px;')+'border-radius:11px;font-family:Space Grotesk,sans-serif;font-weight:700;cursor:pointer;transition:all .15s;display:inline-flex;align-items:center;justify-content:center;'+(k===idx?'background:#34302a;color:#f6f1e4;border:1px solid #34302a;':'background:#fbf9f2;color:#5c5447;border:1px solid #e0d6bf;')}));
    const cv=self.buildChord(list[idx]);
    out.chordName=cv.name; out.chordKind=s.chordCat==='power'?'root + 5th':(s.chordCat==='seventh'?'seventh / colour':'open chord');
    out.chordDiagramEl=self.chordDiagram(cv, s.chordCat+'-'+idx+'-'+s.animTick, s.strumId);
    out.chordStrumCaption=cv.strumCaption; out.strumStripEl=self.strumStrip(cv);
    const rootPc=list[idx].root, seen={}, tones=[];
    cv.strings.forEach(st=>{ if(st.muted) return; const ivv=(self.pc(self.OPEN[st.i]+st.fret)-rootPc+12)%12; if(seen[ivv]) return; seen[ivv]=true; tones.push({iv:ivv, midi:self.OPEN[st.i]+st.fret, label:st.label, name:st.name}); });
    tones.sort((a,b)=>a.iv-b.iv);
    out.chordTones=tones.map(t=>{ const col=self.dotColor(t.label);
      const soft= t.label==='R'?['#f5e2d6','#e6c4ad']: t.label==='5'?['#dceadb','#c2dcc0']: (t.label==='3'||t.label==='\u266D3')?['#f3e7d0','#e2d2ad']:['#eae9ef','#d9d8e2'];
      return {tag:self.toneTag(t.label), note:t.name, onClick:()=>self.pluck(t.midi),
        style:'flex:0 0 auto;min-width:62px;padding:9px 14px;border-radius:13px;cursor:pointer;display:flex;flex-direction:column;gap:1px;align-items:center;background:'+soft[0]+';border:1px solid '+soft[1]+';font-family:Space Grotesk,sans-serif;transition:transform .12s;',
        tagStyle:'font-size:9.5px;font-weight:700;letter-spacing:.06em;color:'+self.toneInk(t.label)+';',
        noteStyle:'font-size:21px;font-weight:700;color:#3c372f;line-height:1.05;'}; });
    const PROG={ basic:[['G','C','D'],['Em','C','G','D'],['Am','F','C','G'],['C','G','Am','F']], seventh:[['Am7','Dm7','G7','Cmaj7'],['G7','C','D7'],['E7','A7','B7']], power:[['E5','A5','B5'],['G5','C5','D5'],['E5','G5','A5']] };
    out.progressions=(PROG[s.chordCat]||[]).map(seq=>({label:seq.join('   \u00b7   '), aria:'Play progression '+seq.join(', '), onClick:()=>self.playProgression(seq)}));
    out.replayFingers=()=>self.setState({animTick:self.state.animTick+1});
    out.playChord=()=>{ self.setState(st=>({strumId:st.strumId+1})); self.strum(cv.playOrder); };
    out.playRoot=()=>self.pluck(cv.rootMidi); out.playFifth=()=>self.pluck(cv.fifthMidi);
    out.chordTip= (cv.name==='F'||cv.name==='Bm')
      ? 'This is a barre chord: lay your first finger flat across the strings so it presses several at once, then add the remaining fingers. Roll your finger slightly onto its bony side and press near the fret — it takes practice, so go slowly.'
      : s.chordCat==='power'
      ? 'A power chord is only the root and the 5th (plus the octave). With no 3rd it\u2019s neither major nor minor, which is why the same shape slides anywhere on the neck. Mute the strings you\u2019re not playing by resting your strumming hand lightly across them.'
      : 'Press the dots firmly just behind the metal fret, then pick each string one at a time to check every note rings clearly before you strum. Tap Root and 5th to hear the two notes that anchor the chord.';

    // ----- quiz -----
    out.qIsName=s.qMode==='name';
    out.setModeName=()=>{ self.setState({qMode:'name'},()=>self.newQuestion()); };
    out.setModeFind=()=>{ self.setState({qMode:'find'},()=>self.newQuestion()); };
    out.qNameStyle=seg(s.qMode==='name'); out.qFindStyle=seg(s.qMode==='find');
    if(s.qMode==='name'){
      out.qPrompt='Which note is highlighted?';
      out.qBoardEl=self.miniBoard({highlight:s.qPos?{i:s.qPos.i,f:s.qPos.f}:null});
      out.qChoices=(s.qChoices||[]).map(ch=>{
        let bgc='background:#fbf9f2;color:#34302a;border:1px solid #ddd2b8;';
        if(s.qResult){ if(ch===s.qAnswer) bgc='background:#dceadb;color:#3a6e54;border:1px solid #b9d6b6;'; else if(ch===s.qWrongNote) bgc='background:#f3dcd2;color:#b5532f;border:1px solid #e6c0ad;'; else bgc='background:#f1ece0;color:#79705f;border:1px solid #e4dcc9;'; }
        return {label:ch,onClick:()=>self.answerName(ch),style:'min-width:66px;padding:14px 20px;border-radius:12px;font-family:Space Grotesk,sans-serif;font-weight:700;font-size:18px;cursor:pointer;transition:all .15s;'+bgc};
      });
      out.qReplay=()=> s.qPos&&self.pluck(s.qPos.midi);
    } else {
      const tn=(s.accidental==='flat'?self.FLAT:self.SHARP)[s.qTarget||0];
      out.qPrompt='Find an "'+tn+'" on the neck';
      out.qBoardEl=self.miniBoard({clickable:!s.qResult, onCell:(i,f)=>self.answerFind(i,f), reveal:s.qReveal, wrong:s.qWrong});
      out.qChoices=[]; out.qReplay=()=> self.pluck(48+(s.qTarget||0));
    }
    out.qShowNext=!!s.qResult; out.qNext=()=>self.newQuestion();
    if(s.qResult==='correct'){ out.qFeedbackText= s.qMode==='name'?'Correct — that\u2019s '+s.qAnswer+'. \uD83C\uDF89':'Nice! \uD83C\uDF89'; out.qFeedbackStyle='margin-top:16px;font-weight:700;font-size:15px;color:#3f7d5e;'; }
    else if(s.qResult==='wrong'){ out.qFeedbackText= s.qMode==='name'?'Not quite — it\u2019s '+s.qAnswer+'.':'That\u2019s '+s.qWrongNote+'. The green dots show every match.'; out.qFeedbackStyle='margin-top:16px;font-weight:700;font-size:15px;color:#b5532f;'; }
    else { out.qFeedbackText=''; out.qFeedbackStyle='margin-top:0;height:0;'; }
    out.qScore=s.qScore; out.qAccuracy=s.qTotal?Math.round(s.qScore/s.qTotal*100)+'%':'—'; out.qStreak=s.qStreak; out.qBest=s.qBest;
    const nameTips=['Anchor on the open-string names (E A D G B E) and count up in semitones — every fret is one step.','There is no sharp between B–C or E–F, so those notes are just one fret apart.','The 12th fret is one octave up, so its note matches the open string of the same line.','The thick low string and thin high string are both E — they mirror each other.','Dots on the neck mark frets 3, 5, 7 and 9; the double dot is the 12th (octave).'];
    const findTips=['The same note repeats every 12 frets — find the closest one first.','Each string is tuned a 4th above the one below it (except B, a 3rd above G).','Octave trick: go up 2 strings and across 2 frets to find the same note name.','Natural notes (no sharp/flat) sit a whole step apart, except B–C and E–F.','Open strings count too — they are the note at "fret 0".'];
    const pool= s.qMode==='name'? nameTips : findTips;
    out.qTip= pool[s.qTotal % pool.length];
    return out;
  }
}
