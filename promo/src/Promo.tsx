import type { CSSProperties, ReactNode } from 'react';
import { AbsoluteFill, Audio, Easing, interpolate, interpolateColors, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { scenes, typingFrames, publishFrames } from './timeline.mjs';

// Tokens mirror cuelume-site/src/styles/global.css at 1.6x (a 30px site button is 48px here).
const light = { canvas: '#fbfaf9', surface: '#ffffff', sand: '#f6f4ef', stone: '#f2f0ed', fill: '#e0dcd5', tick: '#c8c5bf', edge: 'rgba(18,18,18,0.07)', ink: '#121212', charcoal: '#343433', muted: '#7e7e7d', faint: '#a9a7a3', key: '#121212', keyText: '#fbfaf9' };
const dark: Theme = { canvas: '#121212', surface: '#1c1c1b', sand: '#262625', stone: '#2e2e2d', fill: '#3d3d3b', tick: '#4a4a48', edge: 'rgba(255,255,255,0.09)', ink: '#fbfaf9', charcoal: '#e8e6e2', muted: '#8a8a88', faint: '#5f5f5d', key: '#fbfaf9', keyText: '#121212' };
type Theme = typeof light;
const accent = { ember: '#ff3e00', blue: '#0086fc', grass: '#00c978', sun: '#ffcd6c' };
// Radius follows element size: control 9, panel 12, card 14, window 16 on the site, times 1.6.
const R = { control: 14, panel: 19, card: 22, window: 26, tag: 13, tok: 10 };
const cueDots = [['tap', '#ffbb26'], ['type', '#64c6ff'], ['select', '#d48f00'], ['toggle', '#9f4fff'], ['open', '#ff58ae'], ['close', '#00b2ff'], ['success', '#00c978'], ['error', '#ff6b5f'], ['navigate', '#d9a066']] as const;

// Two curves. --ease for everything; --spring only where a settle should overshoot.
const ease = Easing.bezier(0.2, 0, 0, 1);
const springy = Easing.bezier(0.34, 1.56, 0.64, 1);
// Durations by job at 60fps: press 120ms, colour 160ms, morph 220ms, entrance 640ms, stagger 70ms after an 80ms lead.
const D = { press: 7, colour: 10, morph: 13, enter: 38, stagger: 4, lead: 5, morphDelay: 8 };
const clamp = { extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const };
const at = (f: number, start: number, frames: number, from = 0, to = 1, curve = ease) => interpolate(f, [start, start + frames], [from, to], { ...clamp, easing: curve });
const linear = (f: number, start: number, frames: number) => interpolate(f, [start, start + frames], [0, 1], clamp);
const press = (f: number, t: number) => interpolate(f, [t - 3, t, t + 3, t + 3 + D.press], [0, 1, 1, 0], clamp);
const rise = (f: number, t: number): CSSProperties => ({ opacity: at(f, t, D.enter), transform: `translateY(${(1 - at(f, t, D.enter)) * 16}px)` });
const mix = (p: number, a: string, b: string) => interpolateColors(p, [0, 1], [a, b]);
const mixTheme = (p: number): Theme => Object.fromEntries((Object.keys(light) as (keyof Theme)[]).map(k => [k, mix(p, light[k], dark[k])])) as Theme;

function Stage({ children, t }: { children: ReactNode; t: Theme }) {
  return <AbsoluteFill style={{ background: t.canvas, color: t.ink, overflow: 'hidden' }}>{children}</AbsoluteFill>;
}

function Icon({ name, size = 24, color = 'currentColor' }: { name: string; size?: number; color?: string }) {
  const paths: Record<string, ReactNode> = {
    sound: <><path d="M5 12h5l6-5v18l-6-5H5z" /><path d="M21 11c4 3 4 7 0 10m5-14c6 5 6 13 0 18" /></>,
    arrow: <path d="M7 16h19M18 8l8 8-8 8" />,
    note: <><path d="M8 4h12l5 5v19H8zM19 4v6h6M12 16h9m-9 5h7" /></>,
    copy: <><rect x="10" y="10" width="16" height="17" rx="3" /><path d="M21 10V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h4" /></>,
    send: <path d="m5 5 23 11-23 11 4-11zm4 11h19" />,
    type: <path d="M7 7h18M16 7v19m-5 0h10" />,
    close: <path d="m9 9 14 14m0-14L9 23" />,
    check: <path d="m7 16 6 6L25 9" />,
  };
  return <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

// The logo mark from cuelume-site/public/cuelume-mark.svg.
function Mark({ size, color, style }: { size: number; color: string; style?: CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 64 64" style={style}><path fill={color} fillRule="evenodd" d="M17.10 19.27A15 15 0 0 1 46.90 19.27A9 9 0 0 0 50.48 25.46A15 15 0 0 1 35.57 51.26A9 9 0 0 0 28.42 51.27A15 15 0 0 1 13.53 25.46A9 9 0 0 0 17.10 19.27ZM32 24.5A7.5 7.5 0 1 0 32 39.5A7.5 7.5 0 1 0 32 24.5Z" /></svg>;
}

function Spinner({ f, color }: { f: number; color: string }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" style={{ transform: `rotate(${f * 10}deg)` }}><circle cx="12" cy="12" r="8" stroke={color} strokeOpacity="0.25" fill="none" strokeWidth="2.2" /><circle cx="12" cy="12" r="8" stroke={color} fill="none" strokeWidth="2.2" strokeDasharray="14 37" strokeLinecap="round" /></svg>;
}

function CheckDraw({ f, t, size = 26, color }: { f: number; t: number; size?: number; color: string }) {
  return <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m7 16 6 6L25 9" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - at(f, t, D.morph)} /></svg>;
}

function Cursor({ x, y, pressed = 0 }: { x: number; y: number; pressed?: number }) {
  return <svg width="38" height="46" viewBox="0 0 38 46" style={{ position: 'absolute', left: 0, top: 0, transform: `translate(${x}px, ${y}px) scale(${1 - pressed * 0.12})`, transformOrigin: 'top left' }}><path d="M5 3v31l8-8 6 14 7-3-6-13 12-1z" fill="#121212" stroke="#ffffff" strokeWidth="2.5" strokeLinejoin="round" /></svg>;
}

// State morph: the outgoing face blurs out, the incoming one waits 140ms and blurs in. Icons also shrink to 0.25.
function Faces({ f, steps, scale = false }: { f: number; steps: { t: number; node: ReactNode }[]; scale?: boolean }) {
  return <div style={{ display: 'grid', placeItems: 'center' }}>{steps.map((s, i) => {
    const inn = i === 0 ? 1 : at(f, s.t + D.morphDelay, D.morph);
    const out = i === steps.length - 1 ? 0 : at(f, steps[i + 1].t, D.morph);
    const v = inn * (1 - out);
    return <div key={i} style={{ gridArea: '1 / 1', opacity: v, filter: `blur(${(1 - v) * 4}px)`, transform: `scale(${scale ? 0.25 + 0.75 * v : 1})`, display: 'flex', alignItems: 'center', gap: 11, whiteSpace: 'nowrap' }}>{s.node}</div>;
  })}</div>;
}

function Card({ children, t, radius = R.card, style }: { children: ReactNode; t: Theme; radius?: number; style?: CSSProperties }) {
  return <div style={{ background: t.surface, border: `1px solid ${t.edge}`, borderRadius: radius, color: t.charcoal, ...style }}>{children}</div>;
}

// The one deliberate pill. Stone at rest, grass when on, a plain white knob.
function Switch({ f, on, t }: { f: number; on: number; t: Theme }) {
  const p = press(f, on);
  return <div style={{ width: 64, height: 36, padding: 3, borderRadius: 9999, background: mix(at(f, on, D.colour), t.stone, accent.grass), transform: `scale(${1 - p * 0.04})` }}>
    <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#ffffff', transform: `translateX(${at(f, on, 11) * 28}px)` }} />
  </div>;
}

function Button({ f, pressAt, children, t, quiet = false, style }: { f: number; pressAt: number; children: ReactNode; t: Theme; quiet?: boolean; style?: CSSProperties }) {
  const p = press(f, pressAt);
  return <div style={{ height: 48, padding: '0 21px', borderRadius: R.panel, background: quiet ? 'transparent' : t.key, border: quiet ? `1px solid ${t.edge}` : 'none', color: quiet ? t.charcoal : t.keyText, fontSize: 19, fontWeight: quiet ? 500 : 600, letterSpacing: '-0.009em', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${1 - p * 0.04}) translateY(${p * 1.6}px)`, ...style }}>{children}</div>;
}

// Volume: the row fills as the value rises, dots mark the rest, a thin bar rides the edge of the fill.
function Volume({ value, t, width }: { value: number; t: Theme; width: number }) {
  return <div style={{ position: 'relative', width, height: 54, borderRadius: R.panel, background: t.sand, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px' }}>
    <div style={{ position: 'absolute', inset: 0, background: t.fill, transform: `scaleX(${value})`, transformOrigin: 'left' }} />
    {Array.from({ length: Math.floor(width / 38) }, (_, i) => <div key={i} style={{ position: 'absolute', left: 3 + i * 38, top: 26, width: 2, height: 2, borderRadius: '50%', background: t.tick }} />)}
    <div style={{ position: 'absolute', left: `calc(${value * 100}% - 1.5px)`, top: 14, bottom: 14, width: 3, borderRadius: 2, background: t.charcoal, opacity: 0.7 }} />
    <span style={{ position: 'relative', fontSize: 19, color: t.muted }}>Volume</span>
    <span className="mono" style={{ position: 'relative', fontSize: 18, color: t.ink }}>{Math.round(value * 100)}%</span>
  </div>;
}

function Trace({ f, width, height, energy, t }: { f: number; width: number; height: number; energy: number; t: Theme }) {
  return <div style={{ width, height, display: 'flex', gap: 4, alignItems: 'center', position: 'relative' }}>
    <div style={{ position: 'absolute', top: height / 2, width, height: 1, background: t.fill }} />
    {Array.from({ length: 61 }, (_, i) => {
      const envelope = Math.exp(-(((i - 30) / 19) ** 2));
      const pulse = Math.sin(i * 0.68 - f * 0.12) ** 2;
      return <div key={i} style={{ width: (width - 240) / 61, height, flexShrink: 0, borderRadius: 4, background: t.charcoal, opacity: (0.35 + envelope * 0.65) * Math.min(1, energy * 2.5), transform: `scaleY(${0.035 + energy * envelope * (0.12 + pulse * 0.82)})` }} />;
    })}
  </div>;
}

// Palette chip: a dot carries the cue's identity; the selected chip lifts out of the list as a white hairline tile.
function Chip({ name, color, on = 0, hit = -100, f, t }: { name: string; color: string; on?: number; hit?: number; f: number; t: Theme }) {
  const p = at(f, hit, 24);
  const pop = p < 0.3 ? 1 + 0.7 * (p / 0.3) : 1.7 - 0.7 * ((p - 0.3) / 0.7);
  return <div style={{ display: 'flex', alignItems: 'center', gap: 14, height: 42, padding: '0 16px', borderRadius: R.control, background: mix(on, 'rgba(255,255,255,0)', t.surface), border: `1px solid rgba(18,18,18,${0.07 * on})`, color: mix(on, t.muted, t.ink), fontSize: 19, transform: `scale(${1 - press(f, hit) * 0.015})` }}>
    <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, transform: `scale(${pop})` }} /><span>{name}</span>
  </div>;
}

function Tab({ label, active, t }: { label: string; active: number; t: Theme }) {
  return <div className="mono" style={{ padding: '8px 19px', borderRadius: R.control, fontSize: 18, background: mix(active, 'rgba(255,255,255,0)', t.sand), color: mix(active, t.muted, t.ink) }}>{label}</div>;
}

function Tok({ children, t, pressed = 0 }: { children: ReactNode; t: Theme; pressed?: number }) {
  return <div className="mono" style={{ fontSize: 17, lineHeight: 1.45, padding: '4px 10px', borderRadius: R.tok, background: mix(pressed, t.surface, t.sand), border: `1px solid ${t.edge}`, color: t.ink, transform: `translateY(${pressed * 2}px)` }}>{children}</div>;
}

function Marker({ t }: { t: Theme }) {
  return <div style={{ position: 'absolute', top: 150, width: '100%', display: 'flex', justifyContent: 'center' }}><span className="marker" style={{ padding: '8px 14px', borderRadius: R.tag, border: `1px solid ${t.edge}`, color: t.muted }}>Coming next · concept</span></div>;
}

function Headline({ children, f, t, at: start = 0, size = 86 }: { children: ReactNode; f: number; t: Theme; at?: number; size?: number }) {
  return <div style={{ position: 'absolute', top: 822, left: 150, right: 150, textAlign: 'center', ...rise(f, start) }}><h1 className="headline" style={{ fontSize: size, color: t.ink }}>{children}</h1></div>;
}

function SoundCard({ f, on, energy, t, width }: { f: number; on: number; energy: number; t: Theme; width: number }) {
  const inner = width - 48;
  return <Card t={t} style={{ width, padding: 24 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, height: 36 }}><Icon name="sound" size={26} color={mix(at(f, on, D.colour), t.muted, t.ink)} /><span style={{ fontSize: 25, flex: 1 }}>Sound</span><Switch f={f} on={on} t={t} /></div>
    <div style={{ height: 1, background: t.stone, margin: '20px 0 16px' }} />
    <Trace f={f} width={inner} height={64} energy={energy} t={t} />
    <div style={{ marginTop: 16, opacity: at(f, on, D.colour, 0.45, 1) }}><Volume value={0.7} t={t} width={inner} /></div>
  </Card>;
}

function Hook() {
  const f = useCurrentFrame();
  const t = light;
  const on = 24;
  const exit = at(f, 160, 20);
  const swap = at(f, 32, D.morph);
  const swapIn = at(f, 32 + D.morphDelay, D.morph);
  return <Stage t={t}>
    <div style={{ position: 'absolute', inset: 0, transform: `scale(${1 + exit * 0.1}) translateY(${-exit * 35}px)`, opacity: 1 - exit }}>
      <div style={{ position: 'absolute', left: 680, top: 340, transform: `perspective(1400px) rotateY(${at(f, 0, 110, -14, 3)}deg) rotateX(${at(f, 0, 110, 6, 0)}deg) rotateZ(${at(f, 0, 110, -4, 1)}deg) scale(${at(f, 0, 130, 1.62, 1.45)})` }}>
        <SoundCard f={f} on={on} energy={at(f, on, 20)} t={t} width={560} />
        <div style={{ opacity: 1 - at(f, 42, 15) }}><Cursor x={at(f, 0, 23, 660, 499)} y={at(f, 0, 23, 300, 39)} pressed={press(f, on)} /></div>
      </div>
      <div style={{ position: 'absolute', left: 960, top: 704, transform: `translateX(-50%) scale(1.25)`, transformOrigin: 'top center' }}>
        <div style={rise(f, 84)}><Card t={t} radius={R.panel} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 22px', fontSize: 22 }}><CheckDraw f={f} t={84 + D.lead} color={accent.grass} />Sound on</Card></div>
      </div>
      <div style={{ position: 'absolute', left: 150, right: 150, top: 812, textAlign: 'center', ...rise(f, 0) }}>
        <div style={{ display: 'grid', placeItems: 'center' }}>
          <h1 className="headline" style={{ gridArea: '1 / 1', fontSize: 96, color: t.ink, opacity: 1 - swap, filter: `blur(${swap * 4}px)` }}>Looks good.</h1>
          <h1 className="headline" style={{ gridArea: '1 / 1', fontSize: 96, color: t.ink, opacity: swapIn, filter: `blur(${(1 - swapIn) * 4}px)` }}>Feels <em>better</em>.</h1>
        </div>
      </div>
    </div>
  </Stage>;
}

function Lockup({ f, t, spin = false }: { f: number; t: Theme; spin?: boolean }) {
  return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 36 }}>
    <Mark size={150} color={t.charcoal} style={{ transform: spin ? `rotate(${at(f, D.lead, 30, -120, 0, springy)}deg)` : undefined }} />
    <div className="wordmark" style={{ fontSize: 190, color: t.ink }}>cuelume</div>
  </div>;
}

function Brand() {
  const f = useCurrentFrame();
  const t = light;
  const chips = [{ x: -520, y: -180, i: 0 }, { x: 470, y: -168, i: 3 }, { x: -480, y: 190, i: 6 }, { x: 470, y: 180, i: 1 }];
  const gone = at(f, 92, 27);
  return <Stage t={t}>
    {chips.map((c, n) => <div key={n} style={{ position: 'absolute', left: 960, top: 480, opacity: 1 - gone, transform: `translate(${c.x}px, ${c.y + Math.sin(f * 0.04 + n) * 6}px) scale(1.2)` }}>
      <div style={rise(f, D.lead + (3 + n) * D.stagger)}><Chip name={cueDots[c.i][0]} color={cueDots[c.i][1]} on={1} f={f} t={t} /></div>
    </div>)}
    <div style={{ position: 'absolute', top: 400, width: '100%', ...rise(f, D.lead) }}><Lockup f={f} t={t} spin /></div>
    <div style={{ position: 'absolute', top: 638, width: '100%', textAlign: 'center', fontSize: 34, color: t.muted, ...rise(f, D.lead + D.stagger) }}>Sound for the web.</div>
  </Stage>;
}

function Interactions() {
  const f = useCurrentFrame();
  const t = light;
  const { press: pressAt, loading, done, toast } = publishFrames;
  const progress = linear(f, loading, done - loading);
  const resolve = at(f, toast, 24);
  const doneP = at(f, done, D.colour);
  return <Stage t={t}>
    <Headline f={f} t={t} at={8}>Every detail, <em>felt</em>.</Headline>
    <div style={{ position: 'absolute', left: 660, top: 300, opacity: 1 - resolve, transform: `perspective(1500px) rotateY(${at(f, 0, 140, -9, 3)}deg) rotateZ(${at(f, 0, 140, -2, 1)}deg) translateY(${-resolve * 28}px) scale(${1.42 - resolve * 0.06})` }}>
      <Card t={t} radius={R.window} style={{ width: 600, padding: 20, position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 32, fontSize: 21 }}><Icon name="note" size={23} color={t.muted} /><span style={{ flex: 1 }}>Release notes</span><div style={{ width: 8, height: 8, borderRadius: '50%', background: mix(doneP, t.faint, accent.grass) }} /></div>
        <div style={{ position: 'relative', margin: '16px 0', height: 150, borderRadius: 8, background: t.sand, overflow: 'hidden' }}>
          {[2, 1, 0].map(i => <div key={i} style={{ position: 'absolute', width: 142, height: 170, left: 207 + i * 28, top: 22 + i * 3, borderRadius: 8, background: t.surface, border: `1px solid ${t.edge}`, transform: `translateX(${-progress * i * 15}px) rotate(${(i - 1) * 9 * (1 - progress * 0.8)}deg)` }}>
            <div style={{ height: 52, margin: 14, borderRadius: 4, background: i === 0 ? t.ink : t.stone, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i === 0 && <Mark size={30} color={t.canvas} />}</div>
            {[90, 65, 80].map((w, j) => <div key={j} style={{ margin: '8px 14px', width: w, height: 4, borderRadius: 2, background: t.stone }} />)}
          </div>)}
          <div style={{ position: 'absolute', left: 20, top: 20, width: 56, height: 56, borderRadius: R.control, background: t.surface, border: `1px solid ${t.edge}`, display: 'flex', alignItems: 'center', justifyContent: 'center', ...rise(f, done) }}><CheckDraw f={f} t={done + D.lead} size={30} color={accent.grass} /></div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ width: 160, height: 3, borderRadius: 2, background: t.stone, overflow: 'hidden' }}><div style={{ width: '100%', height: '100%', background: accent.blue, transform: `scaleX(${progress})`, transformOrigin: 'left' }} /></div>
          <Button f={f} pressAt={pressAt} t={t} style={{ width: 190 }}>
            <Faces f={f} steps={[
              { t: -100, node: <><Icon name="arrow" size={22} color={t.keyText} />Publish</> },
              { t: loading, node: <><Spinner f={f} color={t.keyText} />Publishing</> },
              { t: done, node: <span style={{ display: 'flex', alignItems: 'center', gap: 11, color: accent.sun }}><CheckDraw f={f} t={done + D.morphDelay} size={22} color={accent.sun} />Published</span> },
            ]} />
          </Button>
        </div>
        <div style={{ opacity: 1 - at(f, 45, 15) }}><Cursor x={at(f, 0, 30, 700, 480)} y={at(f, 0, 30, 360, 255)} pressed={press(f, pressAt)} /></div>
      </Card>
    </div>
    <div style={{ position: 'absolute', left: 960, top: 470, transform: 'translateX(-50%) scale(1.34)', transformOrigin: 'top center' }}>
      <div style={rise(f, toast + D.stagger)}>
        <Card t={t} radius={R.panel} style={{ width: 520, display: 'flex', alignItems: 'center', gap: 14, padding: '16px 22px' }}>
          <CheckDraw f={f} t={toast + D.stagger + D.lead} color={accent.grass} /><span style={{ fontSize: 22, flex: 1 }}>Published.</span><Icon name="close" size={20} color={t.faint} />
        </Card>
      </div>
    </div>
  </Stage>;
}

function Palette() {
  const f = useCurrentFrame();
  const t = light;
  const hits = [{ i: 0, at: 80 }, { i: 3, at: 101 }, { i: 6, at: 122 }];
  const target = (k: number) => ({ x: 93, y: 28 + hits[k].i / 3 * 48 });
  const cx = f < 88 ? at(f, 0, 78, 640, target(0).x) : f < 109 ? at(f, 88, 11, target(0).x, target(1).x) : at(f, 109, 11, target(1).x, target(2).x);
  const cy = f < 88 ? at(f, 0, 78, 200, target(0).y) : f < 109 ? at(f, 88, 11, target(0).y, target(1).y) : at(f, 109, 11, target(1).y, target(2).y);
  const pressed = hits.reduce((m, h) => Math.max(m, press(f, h.at)), 0);
  return <Stage t={t}>
    <Marker t={t} /><Headline f={f} t={t} at={3}>Nine. <em>Just right</em>.</Headline>
    <div style={{ position: 'absolute', left: 680, top: 401, transform: `perspective(1600px) rotateY(${at(f, 0, 150, -12, 5)}deg) rotateX(${at(f, 0, 150, 8, 0)}deg) rotateZ(${at(f, 0, 150, -5, 1)}deg) scale(1.6)` }}>
      <Card t={t} radius={R.window} style={{ width: 560, padding: 10, background: t.sand, display: 'grid', gridTemplateColumns: 'repeat(3, 176px)', gap: 6, position: 'relative' }}>
        {cueDots.map(([name, color], i) => {
          const k = hits.findIndex(h => h.i === i);
          const on = k < 0 ? 0 : at(f, hits[k].at, D.colour) * (k + 1 < hits.length ? 1 - at(f, hits[k + 1].at, D.colour) : 1);
          return <div key={name} style={rise(f, 8 + i * D.stagger)}><Chip name={name} color={color} on={on} hit={k < 0 ? -100 : hits[k].at} f={f} t={t} /></div>;
        })}
        <div style={{ opacity: 1 - at(f, 140, 15) }}><Cursor x={cx} y={cy} pressed={pressed} /></div>
      </Card>
    </div>
  </Stage>;
}

function Adaptive() {
  const f = useCurrentFrame();
  const t = light;
  const submit = 198;
  const typed = typingFrames.filter(a => f >= a).length;
  const latest = typingFrames.filter(a => f >= a).at(-1) ?? -100;
  const pulse = 1 - at(f, latest, 12);
  return <Stage t={t}>
    <Marker t={t} /><Headline f={f} t={t}>In your <em>rhythm</em>.</Headline>
    <div style={{ position: 'absolute', left: 620, top: 400, transform: `perspective(1400px) rotateY(${at(f, 0, 239, -9, 5)}deg) rotateZ(${at(f, 0, 239, -3, 1)}deg) scale(1.42)` }}>
      <div style={rise(f, 0)}><Card t={t} style={{ width: 680, padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', height: 60, gap: 18 }}>
          <Icon name="type" size={25} color={t.muted} />
          <div style={{ fontSize: 27, letterSpacing: '-0.02em', color: t.ink, display: 'flex', alignItems: 'center', flex: 1 }}>
            {'Make it feel right.'.slice(0, typed)}<div style={{ width: 2, height: 30, background: t.ink, marginLeft: 2, opacity: f >= submit ? 0 : typed < 19 || Math.floor(f / 25) % 2 === 0 ? 1 : 0 }} />
          </div>
          <Button f={f} pressAt={submit} t={t} style={{ width: 48, padding: 0, borderRadius: R.control }}>
            <Faces f={f} scale steps={[{ t: -100, node: <Icon name="send" size={22} color={t.keyText} /> }, { t: submit, node: <CheckDraw f={f} t={submit + D.morphDelay} size={24} color={accent.sun} /> }]} />
          </Button>
        </div>
        <div style={{ height: 1, background: t.stone, margin: '12px 0 16px' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Trace f={f} width={470} height={36} energy={typed === 0 ? 0 : f >= submit ? 0.1 : 0.3 + pulse * 0.5} t={t} />
          <div style={{ display: 'flex', gap: 6 }}><Tok t={t} pressed={press(f, submit - 3)}>⌘</Tok><Tok t={t} pressed={press(f, submit)}>↵</Tok></div>
        </div>
      </Card></div>
    </div>
  </Stage>;
}

function Mech() {
  const f = useCurrentFrame();
  const flip = 48;
  const t = mixTheme(at(f, flip, 14));
  const mech = at(f, flip, D.colour);
  return <Stage t={t}>
    <Marker t={t} /><Headline f={f} t={t}>A different <em>character</em>.</Headline>
    <div style={{ position: 'absolute', left: 640, top: 290, transform: `perspective(1400px) rotateY(${at(f, 0, 220, -9, 5)}deg) rotateZ(${at(f, 0, 220, -3, 1)}deg) scale(1.38)` }}>
      <div style={rise(f, 0)}><Card t={t} radius={R.window} style={{ width: 640, padding: 24, position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 2 }}><Tab label="Default" active={1 - mech} t={t} /><Tab label="mech" active={mech} t={t} /></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, height: 36, marginTop: 20 }}><Icon name="sound" size={26} color={t.ink} /><span style={{ fontSize: 25, flex: 1 }}>Sound</span><Switch f={f} on={-100} t={t} /></div>
        <div style={{ marginTop: 16 }}><Trace f={f} width={592} height={52} energy={0.4 + mech * 0.25} t={t} /></div>
        <div style={{ margin: '16px 0' }}><Volume value={0.7} t={t} width={592} /></div>
        <div style={{ height: 1, background: t.stone, marginBottom: 18 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 4px' }}>{cueDots.map(([name, color], i) => <div key={name} style={{ width: 12, height: 12, borderRadius: '50%', background: color, opacity: 0.45 + Math.sin(f * 0.06 - i * 0.7) ** 2 * 0.55 }} />)}</div>
        {f < 88 && <div style={{ opacity: 1 - at(f, 65, 23) }}><Cursor x={at(f, 0, 46, 700, 372)} y={at(f, 0, 46, 330, 40)} pressed={press(f, flip)} /></div>}
      </Card></div>
    </div>
  </Stage>;
}

function Close() {
  const f = useCurrentFrame();
  const t = dark;
  const copy = 90;
  return <Stage t={t}>
    <div style={{ position: 'absolute', top: 360, width: '100%', ...rise(f, 0) }}><Lockup f={f} t={t} /></div>
    <div style={{ position: 'absolute', top: 619, width: '100%', textAlign: 'center', fontSize: 36, color: t.muted, ...rise(f, D.stagger) }}>Make the web <em className="serif">feel</em> something.</div>
    <div style={{ position: 'absolute', left: 960, top: 760, transform: 'translateX(-50%)' }}>
      <div style={rise(f, 37)}><Card t={light} radius={R.panel} style={{ width: 620, display: 'flex', alignItems: 'center', gap: 16, padding: '13px 13px 13px 22px', position: 'relative' }}>
        <span className="mono" style={{ fontSize: 20, color: light.faint }}>$</span>
        <div className="mono" style={{ flex: 1, fontSize: 20, display: 'flex' }}>
          <Faces f={f} steps={[
            { t: -100, node: <span><span style={{ color: accent.ember }}>npm</span> <span style={{ color: light.ink }}>install</span> <span style={{ color: accent.blue }}>cuelume</span></span> },
            { t: copy, node: <span style={{ color: light.ink }}>copied to clipboard</span> },
          ]} />
        </div>
        <div style={{ width: 42, height: 42, borderRadius: R.control, background: mix(press(f, copy), 'rgba(255,255,255,0)', light.sand), display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${1 - press(f, copy) * 0.08})` }}>
          <Faces f={f} scale steps={[{ t: -100, node: <Icon name="copy" size={21} color={light.muted} /> }, { t: copy, node: <CheckDraw f={f} t={copy + D.morphDelay} size={22} color={accent.grass} /> }]} />
        </div>
        <div style={{ opacity: 1 - at(f, 104, 15) }}><Cursor x={at(f, 50, 38, 760, 581)} y={at(f, 50, 38, 200, 31)} pressed={press(f, copy)} /></div>
      </Card></div>
    </div>
  </Stage>;
}

const components = { hook: Hook, brand: Brand, interactions: Interactions, palette: Palette, adaptive: Adaptive, mech: Mech, close: Close };

export function Promo() {
  return <AbsoluteFill className="film">
    <Audio src={staticFile('audio/soundtrack.wav')} />
    {scenes.map(scene => {
      const Component = components[scene.id as keyof typeof components];
      return <Sequence key={scene.id} from={scene.from} durationInFrames={scene.duration} name={scene.id}><Component /></Sequence>;
    })}
  </AbsoluteFill>;
}
