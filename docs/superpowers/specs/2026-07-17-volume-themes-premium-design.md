# Cuelume: Compact Adaptive Cues, Event-Aware Bindings, `mech`, and 1.0

**Updated:** 2026-08-18 · **Status:** Revised proposal · **Target:** `v0.3` → `v0.4` → `v0.5` → `v1.0`

## Decision

Cuelume will finalize a smaller semantic palette and its adaptive behavior
before work begins on the `mech` theme.

The release order is:

1. Replace the broad 17-sound palette with nine semantic interaction cues.
2. Add first-class declarative bindings for typing and selection.
3. Validate the new default sounds in real interfaces.
4. Turn each static cue into a bounded, context-aware cue family.
5. Design `mech` only after cue names, jobs, bindings, and adaptation rules are
   stable.
6. Graduate the proven API and two finished themes to `1.0`.

No `mech` recipes should be implemented against the current 17-sound palette
or against an unfinished adaptive model. Doing so would multiply sound-design
work for cues and variations that may still change.

## Product direction

Cuelume is a compact interaction-sound system for web interfaces. It is not a
large sound-effects collection and not a general-purpose audio engine.

The palette should prioritize cues that are:

- Common in product interfaces.
- Semantically clear to developers.
- Distinct from one another when heard without visual context.
- Pleasant under repeated use.
- Difficult to replace with a generic click or notification tone.

Apps choose:

- Which semantic cue plays.
- How loud playback is.
- Whether sound is enabled.
- Whether an action has subtle, normal, or strong emphasis.
- Which finished theme is active, once themes ship.

Cuelume decides how each cue responds to interaction cadence, input method,
selection direction, key role, and repetition. Recipes, oscillators,
frequencies, envelopes, layers, filters, variation logic, and custom theme
authoring remain implementation details.

## 1. Finalize the compact cue palette

The canonical palette will contain nine cues:

| Cue | Semantic job | Default-theme character |
| --- | --- | --- |
| `tap` | Buttons, links, and direct activation | Compact tactile pop |
| `type` | Text-entry feedback | Soft rounded keycap with subtle variation |
| `select` | Dropdown, menu, and list selection | Short precise pluck/detent |
| `toggle` | Switching between states | Clear two-part state change |
| `open` | Opening menus, drawers, dialogs, and disclosures | Gooey elastic stretch/pop |
| `close` | Closing or dismissing UI | Short soft suction/collapse |
| `success` | Confirmed successful completion | Warm restrained resolve |
| `error` | Recoverable failure or refusal | Calm descending interruption |
| `navigate` | Route, page, carousel, or gallery movement | Brief directional transition |

Names describe interface jobs rather than synthesis styles. A theme may change
the material of a cue, but not its meaning. For example, `open` may sound
organic and gooey in `default` and like a precise latch in `mech`.

### Sounds removed or combined

The current names migrate as follows during `v0.3`:

| Existing name | Canonical replacement |
| --- | --- |
| `chime` | `success` |
| `sparkle` | `success` |
| `droplet` | `close` |
| `bloom` | `open` |
| `whisper` | `select` |
| `tick` | `select` |
| `press` | `tap` |
| `release` | `tap` |
| `toggle` | `toggle` |
| `success` | `success` |
| `error` | `error` |
| `page` | `navigate` |
| `loading` | `open` |
| `ready` | `success` |
| `pulse` | `tap` |
| `scan` | `select` |
| `arrival` | `navigate` |

The mapping is for migration compatibility, not a claim that every old cue has
an exact semantic equivalent.

### Palette release gate

Before the palette is considered final:

- All nine cues must be distinguishable in blind listening checks.
- `tap`, `type`, `select`, and `toggle` must remain pleasant during rapid use.
- `open` and `close` must feel related but clearly directional.
- `success` and `error` must communicate outcomes without becoming alerts or
  fanfares.
- `navigate` must work for both route changes and smaller gallery movement.
- Every cue must remain clear at global volume `0.3`.
- Listening checks must cover laptop speakers, a phone speaker, and earbuds.

## 2. Add event-aware declarative bindings

The imperative API remains intentionally small:

```ts
play(name?, options?);
bind(root?);
setEnabled(enabled);
setVolume(volume);
sounds;
```

`bind()` gains useful behavior through explicit data attributes rather than a
larger configuration object.

| Attribute | Fires on | Default cue |
| --- | --- | --- |
| `data-cuelume-tap` | `click` | `tap` |
| `data-cuelume-type` | eligible `keydown` | `type` |
| `data-cuelume-select` | native `change`, otherwise `click` | `select` |
| `data-cuelume-toggle` | `click` | `toggle` |
| `data-cuelume-open` | `click` | `open` |
| `data-cuelume-close` | `click` | `close` |
| `data-cuelume-navigate` | `click` | `navigate` |

Outcome cues should normally remain imperative because they must follow the
actual result of an operation:

```ts
try {
  await save();
  play("success");
} catch {
  play("error");
}
```

As today, an empty attribute uses its default cue and an explicit value may
select any canonical cue:

```html
<button data-cuelume-tap>Save</button>
<input data-cuelume-type>
<select data-cuelume-select>...</select>
<button data-cuelume-open>Open menu</button>
<button data-cuelume-tap="open">Show details</button>
```

### Typing behavior

Typing sound must be deliberately constrained:

- Only elements explicitly marked with `data-cuelume-type` participate.
- Password fields never produce typing sounds.
- Modifier-only keys, shortcut chords, composition events, and held-key repeats
  are ignored.
- Printable editing input may include Backspace, Delete, Enter, and Space when
  appropriate.
- Rapid input is rate-limited to avoid clipping and excessive node creation.
- Several subtle internal variants prevent a mechanical machine-gun effect.
- Variation is curated internally and is not exposed as API configuration.

### Selection behavior

- A marked native `<select>` plays on `change`, not when merely opened.
- A marked custom option or menu item plays on its activation `click`.
- Correctly implemented keyboard activation therefore receives the same sound.
- Delegation must continue to support dynamically added and replaced elements.
- One user action must never produce duplicate cues.

### Hover behavior

Hover is not part of the canonical binding system. Passive exploration is too
frequent and too easy to make noisy. Developers may still call `play()` from a
custom hover interaction when their product genuinely benefits from it.

## 3. Provide one migration release

`v0.3` is the palette and binding transition release.

For `v0.3` only:

- Existing sound names remain accepted by `play()` as deprecated aliases to
  the canonical replacements above.
- Existing `data-cuelume-hover`, `data-cuelume-press`, and
  `data-cuelume-release` bindings continue to work for migration.
- `sounds` documents and returns the nine canonical names, not deprecated
  aliases.
- Documentation leads with the new API and includes a concise migration table.
- No new feature should use a deprecated name or binding.

The deprecated aliases and bindings are removed when the contract is finalized
for `1.0`. This gives existing users a release window without carrying the old
palette into the stable API.

## 4. Keep sound preferences host-owned

The existing preference APIs remain sufficient:

```ts
import { setEnabled, setVolume } from "cuelume";

setEnabled(soundEnabled);
setVolume(0.7);
```

The host app owns controls, labels, and persistence. Cuelume starts enabled and
does not read storage, cookies, account settings, or operating-system
preferences.

Apps with recurring or non-essential sound should expose a discoverable Sound
toggle. Cuelume must not infer this preference from `prefers-reduced-motion`;
motion and sound preferences are not equivalent.

No new preference API is planned.

## 5. Build context-aware adaptive synthesis

Adaptive synthesis becomes the focus of `v0.4`, after the `v0.3` palette and
bindings have been validated.

The governing model is:

```text
semantic cue + theme + interaction context = rendered sound
```

A cue must remain recognizably itself while its duration, intensity, pitch,
envelope, and layer balance respond within curated limits. Adaptation should
make repeated interaction less fatiguing and communicate useful differences;
it must not create novelty for its own sake.

### Context model

Cuelume may infer context that is directly available from the current
interaction:

| Context | Source | Example use |
| --- | --- | --- |
| Input method | Pointer or keyboard event | Related mouse, touch, pen, and keyboard variants |
| Cadence | Recent same-cue timing | Shorter, quieter rapid typing and tapping |
| Repetition | Recent local playback | Reduce fatigue and prevent stacked transients |
| Key role | Current keyboard event | Lower Backspace, resolved Enter, varied printable keys |
| Selection direction | Previous and current selected index | Subtle upward or downward pitch movement |
| Open/closed direction | Explicit cue or control state | Preserve the relationship between `open` and `close` |

Business meaning cannot be inferred reliably. Importance therefore remains an
explicit, small public option:

```ts
type Emphasis = "subtle" | "normal" | "strong";

play("success", { emphasis: "subtle" });
play("success", { emphasis: "strong" });
```

Per-call volume remains available and composes with emphasis:

```ts
play("success", { volume: 0.5, emphasis: "strong" });
```

Declarative bindings may provide the same context:

```html
<button data-cuelume-tap data-cuelume-emphasis="subtle">
  Secondary action
</button>
```

Rules:

- `normal` is the default emphasis.
- Invalid runtime emphasis values fall back to `normal`.
- Emphasis selects a curated expression; it is not merely another volume
  control.
- Raw pitch, duration, filter, oscillator, envelope, and randomness controls
  are not public API.
- Automatic context remains best-effort. The semantic cue must still sound
  correct when context is unavailable.
- Adaptation never changes one semantic cue into another.

### Initial adaptive proof

Before converting the whole palette, prototype the three most repeated cues:

- `type`: respond to cadence and key role while avoiding repetitive playback.
- `select`: respond subtly to movement direction and repeated navigation.
- `tap`: respond to input method and rapid repetition without losing impact.

Proceed with all nine cue families only if listening tests show that these
adaptations improve clarity or comfort rather than merely sounding different.

For less repetitive cues:

- `toggle` may distinguish its two state directions when state is available.
- `open` and `close` retain a shared material but opposite motion.
- `success` and `error` use explicit emphasis for action importance.
- `navigate` may express forward and backward direction when available.

### Privacy and product boundaries

Adaptive means responsive to the current interaction, not personalized through
surveillance.

- No AI or machine-learning model is required.
- No interaction history leaves the page.
- No cross-session or cross-site behavioral profile is built.
- No adaptive state is persisted by Cuelume.
- No network request is made for adaptation.
- Cuelume does not guess importance from class names, visual size, copy, or DOM
  structure.
- The host remains responsible for explicit business meaning such as emphasis.

### Adaptive release gate

- Every variant remains identifiable as its parent semantic cue.
- Rapid `type`, `select`, and `tap` interactions are less fatiguing than fixed
  repetition in comparative listening tests.
- Adaptation never creates unexpected loudness jumps.
- Selection and navigation direction are perceptible when useful but not
  melodic or distracting.
- Explicit emphasis is distinguishable at all three levels without becoming a
  raw loudness switch.
- Missing context and invalid runtime emphasis values fall back safely.
- Adaptation adds no storage, network access, dependency, or audio files.
- Performance remains stable during sustained typing on supported browsers.

## 6. Add `mech` only after the adaptive default palette is stable

`mech` becomes the second and final planned built-in theme in `v0.5`.

```ts
import { setTheme } from "cuelume";

setTheme("mech");
setTheme("default");
```

Proposed additions:

```ts
type ThemeName = "default" | "mech";

declare const themes: readonly ThemeName[];
declare function setTheme(theme: ThemeName): void;
```

Theme rules:

- Both themes implement exactly the same nine canonical cues.
- `default` is tactile, warm, and lightly organic.
- `mech` is dry, precise, and mechanical without becoming harsh, industrial,
  retro-computer, or generic sci-fi.
- Themes change sonic material, not cue semantics.
- Initial theme is `default`.
- Theme changes affect future playback only.
- Cuelume does not persist theme selection.
- Unknown runtime theme names are silent no-ops.
- `bind()` needs no theme-specific behavior.
- `play()` keeps per-call volume and emphasis as its only options.
- Every supported context produces a curated expression in both themes; themes
  must not disable adaptation.
- No third theme is planned without evidence of a materially different need.

### `mech` implementation gate

Work on `mech` starts only when:

- The nine canonical cue names are approved.
- The new binding behavior is implemented and tested.
- Every default-theme cue passes the palette release gate.
- The context model and `Emphasis` API pass the adaptive release gate.
- All nine default-theme cue families have stable adaptation boundaries.
- Real interface testing reveals no missing high-frequency semantic cue.

### `mech` release gate

- All nine cue families exist in both themes.
- Cue meaning remains recognizable when switching themes.
- Related pairs remain coherent: `open`/`close` and `success`/`error`.
- Repeated cues remain pleasant under fast typing and selection.
- Adaptive behavior remains useful and bounded in both sonic materials.
- Themes are level-matched and clear at global volume `0.3`.
- Both themes pass listening checks on laptop speakers, a phone speaker, and
  earbuds.

## 7. Graduate to `1.0`

After the compact palette, event-aware bindings, adaptive behavior, and `mech`
have been used in real applications, publish `1.0`.

The stable public surface is:

```ts
play(name?, options?);
bind(root?);
setEnabled(enabled);
setVolume(volume);
setTheme(theme);
sounds;
themes;
```

Alongside `SoundName`, `ThemeName`, and `Emphasis`, `1.0` guarantees:

- The nine canonical cue names remain available and keep their semantic jobs.
- `default` and `mech` remain valid built-in themes.
- Both themes cover every canonical cue and supported adaptive context.
- `subtle`, `normal`, and `strong` remain valid emphasis levels.
- Existing SSR, autoplay, invalid-name, volume, adaptation fallback, and
  delegated-binding behavior remains compatible.
- Removing or repurposing a cue, emphasis level, adaptive semantic, or theme,
  or breaking a function signature requires a major release.
- Recipes and exact synthesis values remain implementation details.

`1.0` means the compact API is dependable. It does not require more features.

## Documentation plan

For `v0.3`:

- Rewrite the README around the nine canonical cues.
- Lead with `tap`, `type`, and `select` examples.
- Document typing and native/custom selection behavior.
- Add the old-to-new migration table.
- Document a host-owned Sound toggle.
- Explain why sound does not follow `prefers-reduced-motion`.
- Do not document adaptive behavior or `mech` before they exist.
- Do not expose or teach recipe authoring.

For `v0.4`:

- Explain context-aware synthesis in plain language.
- Document inferred context and its privacy boundaries.
- Document `Emphasis` and `data-cuelume-emphasis`.
- Include typing, selection direction, repeated tap, and outcome-emphasis
  examples.
- Clearly distinguish emphasis from volume and theme.

For `v0.5`:

- Add one `setTheme("mech")` example.
- Document `themes` and `ThemeName`.
- Add a `Default / Mech` switcher to the website soundboard.
- Let the soundboard demonstrate cadence, direction, and emphasis in both
  themes.

## Verification

Automated tests for `v0.3` should confirm:

- `sounds` contains exactly the nine canonical cue names.
- Every canonical cue plays through the existing shared audio engine.
- Deprecated names resolve to the documented canonical cues.
- New declarative bindings are delegated, dynamic, and idempotent.
- Typing filters modifiers, repeats, composition, and password fields.
- Typing rate limiting prevents excessive playback.
- Native selection plays once on `change`.
- Custom selection plays once on activation.
- `setEnabled(false)` blocks imperative and delegated playback.
- Existing volume, SSR, autoplay, invalid-name, and blocked-audio behavior
  remains safe.

Automated tests for `v0.4` should additionally confirm:

- `normal` emphasis is the default.
- All three emphasis values reach every cue family safely.
- Invalid runtime emphasis falls back to `normal`.
- Per-call volume composes with emphasis without exceeding output protection.
- Typing context distinguishes eligible key roles and cadence bands.
- Selection direction derives from previous and current selection safely.
- Rapid repeated cues use bounded adaptation and do not create duplicate
  playback.
- Missing context falls back to the canonical expression.
- Adaptive state is ephemeral and scoped to the current page.

Automated tests for `v0.5` should additionally confirm:

- `themes` contains exactly `default` and `mech`.
- Both themes contain exactly the nine canonical cue families.
- Every supported context and emphasis level renders in both themes.
- `setTheme()` changes future playback.
- Unknown theme names do not change the active theme.

Sound character, loudness, cadence, adaptation quality, and device translation
require listening checks rather than tests of internal synthesis values.

## Rollout

1. **`v0.3` — Palette reset:** ship nine canonical cues, event-aware bindings,
   migration aliases, and updated documentation.
2. Validate the default palette in real buttons, text fields, native selects,
   custom menus, dialogs, async actions, and route transitions.
3. **`v0.4` — Adaptive cues:** prototype `type`, `select`, and `tap`, validate
   the benefit, then ship bounded cue families for all nine cues with emphasis.
4. Validate cadence, direction, repetition, input method, and emphasis in real
   interfaces without storing or transmitting behavioral data.
5. **`v0.5` — Themes:** ship the complete adaptive `mech` palette and theme
   API.
6. Validate both themes in real applications and make only
   compatibility-safe refinements.
7. **`v1.0` — Stable contract:** remove migration-only names and bindings,
   freeze the nine-cue/adaptive/two-theme API, and publish the stable release.

Nothing should be implemented for `mech` until the palette, bindings, and
adaptive model have all passed their release gates.
