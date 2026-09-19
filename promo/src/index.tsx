import { Composition, registerRoot } from 'remotion';
import { Promo } from './Promo';
import { DURATION, FPS } from './timeline.mjs';
import '@fontsource-variable/inter';
import '@fontsource/instrument-serif/400-italic.css';
import '@fontsource-variable/geist-mono';
import './style.css';

const Root = () => (
  <Composition
    id="CuelumePromo"
    component={Promo}
    width={1920}
    height={1080}
    fps={FPS}
    durationInFrames={DURATION}
  />
);

registerRoot(Root);
