import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { scenes, cues, DURATION, FPS, publishFrames } from '../src/timeline.mjs';

let end = 0;
for (const scene of scenes) {
  assert.equal(scene.from, end, `${scene.id} must not have a gap or overlap`);
  assert(scene.duration > 0);
  end += scene.duration;
}
assert.equal(end, DURATION);
assert.equal(scenes[0].duration, 3 * FPS, 'Hook must land within three seconds');
assert(cues[0].frame < 3 * FPS);
assert(publishFrames.press < publishFrames.loading && publishFrames.loading < publishFrames.done && publishFrames.done < publishFrames.toast);
assert(cues.some(cue => cue.sound === 'success' && cue.frame === 300 + publishFrames.done), 'Publish confirmation must sound when the operation completes');
assert(!cues.some(cue => cue.sound === 'success' && cue.frame >= 300 && cue.frame < 300 + publishFrames.done), 'Do not play success while publishing is still in progress');
for (const cue of cues) {
  assert(cue.frame >= 0 && cue.frame < DURATION);
  assert(cue.gain > 0 && cue.gain <= 2);
}
const wav = await readFile(new URL('../public/audio/soundtrack.wav', import.meta.url));
assert.equal(wav.toString('ascii', 0, 4), 'RIFF');
assert.equal(wav.readUInt16LE(22), 2);
assert.equal(wav.readUInt32LE(24), 48000);
assert.equal(wav.readUInt32LE(40) / (48000 * 4), DURATION / FPS);
let peak = 0;
let firstSample = -1;
for (let i = 44; i < wav.length; i += 2) {
  const value = Math.abs(wav.readInt16LE(i));
  if (value > 0 && firstSample === -1) firstSample = (i - 44) / 4;
  peak = Math.max(peak, value);
}
assert(peak > 1000 && peak < 32767, 'Soundtrack must be audible without clipping');
const firstCue = cues[0].frame / FPS;
assert(firstSample / 48000 >= firstCue - 1 / FPS && firstSample / 48000 < firstCue + 0.04, 'First sound must stay synchronized with the hook');
console.log('Checks passed: publish lifecycle/success sync, timeline continuity, three-second hook, cue bounds, stereo audio duration, peak, and first-cue sync.');
