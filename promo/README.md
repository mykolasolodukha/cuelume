# Cuelume — compact launch film

**V5: 24 seconds, 1920 × 1080, 60 fps, stereo sound.**

The Apple/Notion-inspired direction requested by Daniel: compact interface components, monochrome surfaces, fine borders, small radii, decisive cuts, pointer choreography, spring transitions, and more energetic music. Large floating hardware from v2 is gone. Short copy stays; the code panel, feature lists, and release chart do not return.

V4 gave the components more attention: closer camera framing, layered surface edges, precision slider markings, animated waveform previews, keyboard feedback, and drawn confirmation icons. The publish sequence runs through a complete press → processing → completion → toast cycle rather than jumping immediately to success.

V5 rebuilds every component on the cuelume site's design system (`cuelume-site/src/styles/global.css`, scaled 1.6x). Flat colour only: white surfaces with a 1px hairline, no shadows, no gradients, no glow. Radius follows element size (control 14, panel 19, card 22, window 26, tag 13). Ink is the five-step ramp; accents stay dots and single marks: grass for the switch and confirmations, blue for in-flight progress, ember for the italic serif in each caption, sun for a solid button's done face. Two easing curves, durations by job (press 120ms, colour 160ms, morph 220ms, entrance 640ms, stagger 70ms). Type is Inter with Instrument Serif italics, as on the site.

Components are the site's: the pill switch (stone to grass, plain white knob), the solid button with blur-morph faces, the volume row that fills as the value rises, the cue chip with an identity dot that lifts out of the list when selected, mono tabs, token-badge keycaps, and the install command with npm in ember and cuelume in blue. Every pointer move ends on a control, every press has a 0.96 scale, and every state change morphs rather than swaps. Components sit about 18% closer to camera than v4 and captions run 86px so the film reads at phone width.

## Watch

- Final: `out/cuelume-promo-v5.mp4`
- Smaller preview: `out/cuelume-preview-v5.mp4`
- Poster: `out/poster-v5.png`
- Storyboard: `out/storyboard-v5.jpg`

Earlier MP4s remain in `out/` for comparison. Exports are ignored by Git. The editable source and current WAV soundtrack are included; the library’s source and published dependencies remain unchanged.

## Edit / render

From `promo/`, with Node.js 22+:

```sh
npm ci
npm run studio
```

```sh
npm run check           # TypeScript, lifecycle ordering, timeline, WAV duration/peak/sync
npm run render          # Full-resolution v5 MP4
npm run render:preview  # Half-resolution v5 MP4
npm run stills          # Review frames in out/stills-v5/
```

Chrome Headless Shell downloads on first use. Fonts are bundled locally, with no remote image or font requests during rendering. See [Remotion’s license](https://www.remotion.dev/license) for usage terms.

### Source

- `src/Promo.tsx`: seven scenes, compact UI components, copy, and frame-driven animation.
- `src/style.css`: the reduced type system.
- `src/timeline.mjs`: scene lengths, sound cues, shared publish lifecycle frames, typing synchronization, review frames.
- `scripts/audio.mjs`: current-library cue capture, original 120 BPM score, and loudness mastering.

After changing sound timing or duration:

```sh
npm run audio
npm run check
npm run render
```

Audio regeneration requires **FFmpeg on PATH**, builds the parent library (install root dependencies first), and runs the unmodified `play()` engine inside Chromium with an `OfflineAudioContext`. Noise is seeded for reproducible capture. The original score adds rounded bass, plucks, dry percussion, short transition lifts, and a final chord. Music ducks during the real interaction demonstrations. The combined mix is mastered with FFmpeg loudnorm: the current WAV measures **-18.1 LUFS integrated / -1.5 dBTP**, targeting -16 LUFS while limiting peaks. No stock music is used.

## Cut

| Time | Picture | Copy |
| --- | --- | --- |
| 0–3s | Close-up sound control wakes at 0.4s; waveform and slider respond; “Sound on” toast doubles as the unmute prompt | “Looks good.” → “Feels better.” |
| 3–5s | Brand lockup with four small interaction tokens | Cuelume / Sound for the web. |
| 5–9s | Document artwork, publish press, progress, completion, stacked toast | “Every detail, felt.” |
| 9–12s | Nine cue chips; the pointer selects tap, toggle, success in turn | “Nine. Just right.” |
| 12–16s | Detailed composer, cadence visualization, keyboard hints, submit confirmation | “In your rhythm.” |
| 16–20s | Theme panel; the mech tab flips every token to the dark material in 14 frames | “A different character.” |
| 20–24s | Mark, wordmark, install command; copy morphs to a check and the line to “copied to clipboard” | Cuelume / npm install cuelume |

## Posting on X

The film is built for X's muted autoplay feed, so the cut has to work with the sound off and reward turning it on.

- Upload the MP4 natively. Never link a YouTube or hosted player; native video is what the ranking rewards.
- The first frame is the thumbnail. It is “Looks good.” with the muted card, so the caption should set up the same beat, not explain the product.
- Caption: one line, no link. Something like “Looks good. Feels better. Sound on 🔊”. Put `npm install cuelume` and the site link in the first reply. Links in the post itself are suppressed.
- Reply to every comment in the first hour. Replies and conversations weigh far more than likes, and the first 30 to 60 minutes decide distribution.
- Post when your audience is awake (US morning, EU afternoon). Quote-post it yourself the next day with one detail (the toggle stretch, the publish cycle) as a second push.
- Keep it under 30 seconds. It loops; the last frame cuts back to the hook, so watch it twice before posting.
- Optional second cut: a 1:1 or 4:5 crop fills more of the phone feed. The 16:9 layout is centred within about 1300px, so a square cut needs its own composition, not a crop.

## Accuracy and accessibility

The future scenes have a small **“Coming next · concept”** marker. They represent the nine-cue palette, adaptive interactions, and `mech` from the August 18, 2026 roadmap proposal, not shipped functionality or release-date promises. All product cues are captured from the current 0.2.2 engine, including those under future concepts; the music is a separate original composition. Demo controls represent a host app integrating Cuelume, not UI shipped by the library. The theme change is a visual metaphor, not a claim that Cuelume changes CSS themes.

Waveforms, the volume row and miniature document artwork are art-directed graphics, not measurements or screenshots of a published release. Publish success audio follows the completion frame; a runnable check rejects success cues during processing.

The story is carried by the visuals and brief on-screen copy, without voiceover. All animation is deterministic and frame-driven. A fixed video cannot respond to OS motion preferences; provide playback and sound controls when embedding, and avoid autoplay for reduced-motion users.
