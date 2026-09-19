import { mkdir } from 'node:fs/promises';
import { bundle } from '@remotion/bundler';
import { openBrowser, selectComposition, renderStill } from '@remotion/renderer';
import { stillFrames } from '../src/timeline.mjs';

await mkdir('out/stills-v5', { recursive: true });
const serveUrl = await bundle({ entryPoint: 'src/index.tsx' });
const browser = await openBrowser('chrome');
try {
  const composition = await selectComposition({ serveUrl, id: 'CuelumePromo', puppeteerInstance: browser });
  for (const frame of stillFrames) {
    await renderStill({ serveUrl, composition, frame, output: `out/stills-v5/${String(frame).padStart(4, '0')}.png`, puppeteerInstance: browser });
    console.log(`Rendered frame ${frame}`);
  }
} finally { await browser.close({ silent: true }); }
