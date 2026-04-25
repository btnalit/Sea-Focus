# Focus Input Tone Logo Polish Spec

Date: 2026-04-25

## Goal

Polish the focus experience by making custom duration input easier to edit, adding an audible completion cue, and improving the Android app icon style.

## Scope

- Fix focus custom minute input so users can clear the field before typing a new value.
- Keep custom duration bounded to 1-240 minutes when committed.
- Play a short, calm completion tone when pomodoro/countdown reaches zero.
- Prime the audio context from a user gesture so Android WebView can play the tone later.
- Redesign Android adaptive icon vector resources with a more elegant natural Sea Focus style.
- The icon must avoid tomato imagery and use the approved C direction: garden leaf plus focus ring.
- Do not add a settings page or sound selector in this change.

## Custom Duration Rules

- While editing, an empty custom minute input remains empty and does not immediately become `1`.
- Valid numeric typing updates the active custom timer preview.
- Invalid or empty values are committed to `1` on blur.
- Values above 240 are committed to 240.
- Existing 25/50 preset behavior remains unchanged.

## Completion Tone Rules

- Play a short tone only when countdown or pomodoro naturally finishes.
- Do not play a tone when users reset the timer.
- Do not play a tone when users manually stop a stopwatch.
- Tone playback must be best-effort and must not block saving the focus record.

## Icon Rules

- Preserve the natural/sea/focus identity.
- Use a calmer, more elegant adaptive icon composition.
- Do not use a tomato as the central object.
- Use a simple garden leaf as the central object and keep the focus ring visible.
- Avoid small decorative objects that make the launcher icon feel cluttered.
- Avoid red/coral circular fruit-like shapes so the icon cannot read as a tomato.
- Delete the old `ic_launcher*` launcher resources and point Android Manifest to fresh `sea_focus_launcher*` bitmap resources generated from the exact approved professional logo source without color or corner edits.
- Store the approved source logo under `assets/brand/sea-focus-logo-source.png` for future regeneration.
- Keep XML vector resources valid for Android.

## Acceptance Criteria

- Unit tests cover custom minute draft normalization and commit behavior.
- Unit tests cover the completion tone pattern shape.
- `FocusPage` allows clearing custom duration input while typing.
- Countdown/pomodoro completion saves the focus record and plays the completion tone.
- Android icon foreground/background resources are updated.
- `npm run test:unit` passes.
- `npm run lint` passes.
- `npm run build` passes.
- `npx cap sync android` passes.
- Android XML parse scan passes.
