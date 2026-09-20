/**
 * The audio engine — synthesizes each sound live via the Web Audio API
 * on one shared, lazily created `AudioContext`. No audio files, no
 * dependencies. Every sound carries a gentle envelope (and often a soft
 * shimmer tail) instead of a hard transient, so nothing feels harsh.
 */
import { type SoundName } from "../sounds/recipes.js";
/** Enables or disables future playback. Preference storage stays with the app. */
export declare function setEnabled(value: boolean): void;
/** Sets the volume multiplier for future playback. Preference storage stays with the app. */
export declare function setVolume(value: number): void;
/**
 * Plays a sound immediately. Safe to call from anywhere — lazily creates
 * the shared `AudioContext` on first use, resumes it if the browser
 * started it suspended (e.g. before any user gesture), and is a no-op
 * when Web Audio is unavailable (SSR, old browsers).
 */
export declare function play(sound?: SoundName, options?: {
    volume?: number;
}): void;
/**
 * Creates and starts the shared `AudioContext` without playing anything.
 * Call it from a gesture handler (`click`, `touchend`, `keydown`) when the
 * first cue of a visit will come from somewhere the browser does not treat
 * as a gesture: a drag library's pointer callbacks, a frame callback, the
 * continuation after an `await`. Behind the same gates as `play()`: a no-op
 * before the first user activation, while disabled, and without Web Audio.
 */
export declare function prime(): void;
