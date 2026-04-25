export interface FocusCompletionToneStep {
  frequency: number;
  durationMs: number;
  gain: number;
}

type AudioContextWindow = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };

let sharedAudioContext: AudioContext | null = null;

/**
 * Builds the audible multi-step completion tone used when a timed focus session ends.
 *
 * @returns ordered Web Audio tone steps
 */
export function buildFocusCompletionToneSteps(): FocusCompletionToneStep[] {
  return [
    { frequency: 740, durationMs: 420, gain: 0.15 },
    { frequency: 932, durationMs: 420, gain: 0.18 },
    { frequency: 1175, durationMs: 620, gain: 0.16 },
  ];
}

/**
 * Primes the browser audio context during a user gesture so the completion tone
 * can play later in Android WebView after the timer finishes.
 */
export function primeFocusCompletionTone(): void {
  const audioContext = getAudioContext();
  if (!audioContext) return;

  void resumeAudioContext(audioContext);
}

/**
 * Plays the focus completion tone as a best-effort local sound.
 */
export function playFocusCompletionTone(): void {
  const audioContext = getAudioContext();
  if (!audioContext) return;

  void resumeAudioContext(audioContext)
    .then(() => scheduleFocusCompletionTone(audioContext))
    .catch(() => undefined);
}

function scheduleFocusCompletionTone(audioContext: AudioContext): void {
  try {
    let startAt = audioContext.currentTime + 0.04;
    buildFocusCompletionToneSteps().forEach((step) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      const endAt = startAt + step.durationMs / 1000;

      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(step.frequency, startAt);
      gainNode.gain.setValueAtTime(0.0001, startAt);
      gainNode.gain.linearRampToValueAtTime(step.gain, startAt + 0.04);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, endAt);

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.start(startAt);
      oscillator.stop(endAt + 0.03);

      startAt = endAt + 0.07;
    });
  } catch {
    // Audio should never block saving the focus record.
  }
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  if (sharedAudioContext) return sharedAudioContext;

  const browserWindow = window as AudioContextWindow;
  const AudioContextConstructor = browserWindow.AudioContext ?? browserWindow.webkitAudioContext;
  if (!AudioContextConstructor) return null;

  try {
    sharedAudioContext = new AudioContextConstructor();
    return sharedAudioContext;
  } catch {
    return null;
  }
}

function resumeAudioContext(audioContext: AudioContext): Promise<void> {
  if (audioContext.state !== 'suspended') return Promise.resolve();

  return audioContext.resume().then(() => undefined);
}
