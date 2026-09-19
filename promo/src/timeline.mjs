export const FPS = 60;
export const DURATION = 1440;

export const scenes = [
  { id: 'hook', from: 0, duration: 180 },
  { id: 'brand', from: 180, duration: 120 },
  { id: 'interactions', from: 300, duration: 240 },
  { id: 'palette', from: 540, duration: 180 },
  { id: 'adaptive', from: 720, duration: 240 },
  { id: 'mech', from: 960, duration: 240 },
  { id: 'close', from: 1200, duration: 240 },
];

export const typingFrames = [24, 36, 48, 60, 70, 80, 90, 99, 108, 116, 124, 132, 140, 147, 154, 161, 168, 175, 182];
export const publishFrames = { press: 32, release: 38, loading: 40, done: 106, toast: 142 };

// Product cues remain unmodified. Future UI is conceptual, not unreleased audio.
export const cues = [
  { frame: 24, sound: 'toggle', gain: 1.5 },
  { frame: 32, sound: 'release', gain: 1.2 },
  { frame: 84, sound: 'success', gain: 1.1 },
  { frame: 180, sound: 'arrival', gain: 0.9 },
  { frame: 300 + publishFrames.press, sound: 'press', gain: 1.8 },
  { frame: 300 + publishFrames.release, sound: 'release', gain: 1.7 },
  { frame: 300 + publishFrames.loading, sound: 'loading', gain: 0.7 },
  { frame: 300 + publishFrames.done, sound: 'success', gain: 1.3 },
  { frame: 540, sound: 'page', gain: 0.9 },
  { frame: 620, sound: 'tick', gain: 0.9 },
  { frame: 641, sound: 'toggle', gain: 0.9 },
  { frame: 662, sound: 'scan', gain: 0.65 },
  ...typingFrames.map((frame, i) => ({ frame: 720 + frame, sound: 'press', gain: 1.2 - i * 0.024 })),
  { frame: 918, sound: 'ready', gain: 0.8 },
  { frame: 960, sound: 'page', gain: 0.8 },
  { frame: 1008, sound: 'toggle', gain: 1.2 },
  { frame: 1200, sound: 'arrival', gain: 0.8 },
  { frame: 1290, sound: 'success', gain: 1.0 },
];

export const stillFrames = [0, 115, 240, 320, 366, 420, 500, 677, 850, 940, 1048, 1350];
