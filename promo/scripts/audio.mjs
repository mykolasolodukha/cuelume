import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { openBrowser } from '@remotion/renderer';
import { cues, DURATION, FPS } from '../src/timeline.mjs';

const repo = fileURLToPath(new URL('../../', import.meta.url));
const output = fileURLToPath(new URL('../public/audio/', import.meta.url));
const sampleRate = 48000;
execFileSync('npm', ['run', 'build'], { cwd: repo, stdio: 'inherit' });

// Serve only the three local modules needed to run the real library engine.
const routes = new Map([
  ['/engine.js', new URL('../../dist/audio/engine.js', import.meta.url)],
  ['/sounds/recipes.js', new URL('../../dist/sounds/recipes.js', import.meta.url)],
]);
const server = createServer(async (req, res) => {
  try {
    if (req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end('<!doctype html><title>Cuelume offline capture</title>');
    } else if (routes.has(req.url)) {
      res.writeHead(200, { 'Content-Type': 'application/javascript' });
      res.end(await readFile(routes.get(req.url)));
    } else { res.writeHead(404); res.end(); }
  } catch (error) { res.writeHead(500); res.end(String(error)); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser = await openBrowser('chrome');
  const page = await browser.newPage({ context: () => null, logLevel: 'error', indent: false, pageIndex: 0, onBrowserLog: null, onLog: () => {} });
  const sounds = {};
  for (const sound of new Set(cues.map(cue => cue.sound))) {
    await page.goto({ url: origin, timeout: 30000 });
    sounds[sound] = await page.evaluate(async (name, rate) => {
      const offline = new OfflineAudioContext(1, rate * 2, rate);
      // Adapt only the capture environment; the production engine is unmodified.
      Object.defineProperty(offline, 'state', { get: () => 'running' });
      Object.defineProperty(navigator, 'userActivation', { value: { hasBeenActive: true } });
      window.AudioContext = function () { return offline; };
      let seed = 271828;
      Math.random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
      const { play } = await import('/engine.js');
      play(name);
      const buffer = await offline.startRendering();
      return Array.from(buffer.getChannelData(0));
    }, sound, sampleRate);
    console.log(`Captured shipping cue: ${sound}`);
  }

  const total = Math.round(DURATION / FPS * sampleRate);
  const left = new Float64Array(total);
  const right = new Float64Array(total);
  for (const cue of cues) {
    const start = Math.round(cue.frame / FPS * sampleRate);
    const samples = sounds[cue.sound];
    for (let i = 0; i < samples.length && start + i < total; i++) {
      left[start + i] += samples[i] * cue.gain;
      right[start + i] += samples[i] * cue.gain;
    }
  }

  // Original 120 BPM score: rounded bass, short plucks, dry percussion.
  // This music is separate from the unchanged product-cue recordings above.
  let seed = 314159;
  const noise = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 2147483648 - 1; };
  const tau = Math.PI * 2;
  function voice(start, duration, level, synth, pan = 0) {
    const offset = Math.round(start * sampleRate);
    const length = Math.round(duration * sampleRate);
    for (let i = 0; i < length && offset + i < total; i++) {
      const t = i / sampleRate;
      const edge = Math.min(1, i / 96, (length - 1 - i) / 480);
      const value = synth(t) * level * edge;
      left[offset + i] += value * (1 - Math.max(0, pan) * 0.45);
      right[offset + i] += value * (1 + Math.min(0, pan) * 0.45);
    }
  }
  const chords = [
    [110, 138.59, 164.81],
    [92.5, 138.59, 185],
    [146.83, 185, 220],
    [82.41, 123.47, 164.81],
    [110, 138.59, 164.81],
  ];
  voice(0.4, 0.3, 0.036, t => Math.sin(tau * (65 * t + 0.9 * (1 - Math.exp(-35 * t)))) * Math.exp(-t * 17));
  for (let beat = 0; beat < 34; beat++) {
    const at = 3 + beat * 0.5;
    const notes = chords[Math.min(4, Math.floor((at - 3) / 4))];
    // Leave room around real UI cues; build back into the roadmap section.
    const energy = at >= 5 && at < 9 ? 0.4 : at >= 16 ? 0.9 : 0.75;
    if (beat % 4 === 0 || beat % 4 === 2) {
      voice(at, 0.27, 0.085 * energy, t => Math.sin(tau * (53 * t + 1.2 * (1 - Math.exp(-38 * t)))) * Math.exp(-t * 18));
    }
    const bass = notes[0];
    voice(at, 0.43, 0.038 * energy, t => (Math.sin(tau * bass * t) + Math.sin(tau * bass * 2 * t) * 0.2) * Math.exp(-t * 8));
    if (beat % 2 === 1) {
      voice(at, 0.1, 0.011 * energy, t => noise() * Math.exp(-t * 65));
    }
    voice(at + 0.25, 0.05, 0.009 * energy, t => (Math.sin(tau * 6200 * t) + Math.sin(tau * 8700 * t) * 0.6) * Math.exp(-t * 105), beat % 2 ? 0.6 : -0.6);
    const frequency = notes[[0, 2, 1, 2][beat % 4]] * 4;
    voice(at + 0.25, 0.62, 0.018 * energy, t => Math.sin(tau * frequency * t + Math.sin(tau * frequency * 2 * t) * Math.exp(-t * 22) * 0.35) * Math.exp(-t * 9), beat % 2 ? -0.45 : 0.45);
  }
  for (let i = 0; i < chords.length; i++) {
    const start = 3 + i * 4;
    const notes = chords[i];
    voice(start, Math.min(4.6, 24 - start), 0.011, t => {
      const envelope = Math.min(1, t / 0.28) * Math.min(1, (24 - start - t) / 1.2);
      return notes.reduce((sum, frequency) => sum + Math.sin(tau * frequency * 2 * t) / 3, 0) * envelope;
    }, 0.15);
  }
  // Soft air lifts lead into edits; final chord leaves a clean end-card hold.
  for (const end of [3, 9, 16, 20]) {
    voice(end - 0.32, 0.32, 0.012, t => noise() * (t / 0.32) ** 2 * Math.sin(Math.PI * t / 0.32));
  }
  for (const [i, note] of [440, 554.37, 659.25, 880].entries()) {
    voice(20 + i * 0.075, 3.7 - i * 0.075, 0.019, t => Math.sin(tau * note * t) * Math.exp(-t * 2.1), (i - 1.5) * 0.25);
  }

  let peak = 0;
  for (let i = 0; i < total; i++) peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]));
  if (peak < 0.01) throw new Error('Audio capture is unexpectedly silent');
  const gain = 0.79 / peak;
  const wav = Buffer.alloc(44 + total * 4);
  wav.write('RIFF', 0); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVEfmt ', 8);
  wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(2, 22);
  wav.writeUInt32LE(sampleRate, 24); wav.writeUInt32LE(sampleRate * 4, 28);
  wav.writeUInt16LE(4, 32); wav.writeUInt16LE(16, 34); wav.write('data', 36);
  wav.writeUInt32LE(total * 4, 40);
  for (let i = 0; i < total; i++) {
    const fade = Math.min(1, (total - 1 - i) / (sampleRate * 0.3));
    wav.writeInt16LE(Math.round(Math.max(-1, Math.min(1, left[i] * gain * fade)) * 32767), 44 + i * 4);
    wav.writeInt16LE(Math.round(Math.max(-1, Math.min(1, right[i] * gain * fade)) * 32767), 46 + i * 4);
  }
  // Loudness mastering raises the score without clipping short product transients.
  const mastered = execFileSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-f', 's16le', '-ar', String(sampleRate), '-ac', '2', '-i', 'pipe:0',
    '-af', 'loudnorm=I=-16:TP=-1.5:LRA=9', '-ar', String(sampleRate), '-ac', '2', '-f', 's16le', 'pipe:1',
  ], { input: wav.subarray(44), maxBuffer: 20 * 1024 * 1024 });
  if (mastered.length !== total * 4) throw new Error('Mastering changed soundtrack duration');
  const final = Buffer.concat([wav.subarray(0, 44), mastered]);
  await mkdir(output, { recursive: true });
  await writeFile(`${output}/soundtrack.wav`, final);
  console.log(`Wrote ${DURATION / FPS}s stereo master. Target: -16 LUFS / -1.5 dBTP. First cue: ${cues[0].frame / FPS}s.`);
} finally {
  await browser?.close({ silent: true });
  await new Promise(resolve => server.close(resolve));
}
