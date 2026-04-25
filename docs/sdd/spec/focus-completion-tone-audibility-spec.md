# Focus Completion Tone Audibility Spec

Date: 2026-04-25

## Goal

Make the focus completion sound clearly audible on Android phone speakers while keeping it calm and non-blocking.

## Scope

- Increase the completion tone volume from the previous quiet test pattern.
- Extend the completion tone duration so it is noticeable when a pomodoro/countdown ends.
- Keep playback best-effort and never block focus record saving.
- Schedule Web Audio playback only after a suspended Android WebView audio context resumes.
- Do not add a settings page or selectable sound library in this change.

## Rules

- The completion tone pattern must contain at least three tone steps.
- Total tone-step duration must be at least 1400ms.
- At least one step must reach a gain of 0.14 or higher.
- Every step must remain below clipping risk with gain at or below 0.22.
- Playback failure must be swallowed so completion record saving still works.

## Acceptance Criteria

- Unit tests cover the louder and longer tone pattern.
- `npm run test:unit -- src/features/focus/completionTone.test.ts` passes.
- `npm run lint` passes.
- `npm run build` passes.
