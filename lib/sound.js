// Small two-note chime generated with the Web Audio API, so there's no
// external mp3/wav asset to manage or fetch. A single AudioContext is
// reused across calls.

let ctx = null;

function getContext() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    ctx = new AudioCtx();
  }
  return ctx;
}

// Call from a click handler (e.g. a sound toggle button) so the browser's
// autoplay policy treats the audio context as user-initiated.
export function unlockAudio() {
  const audioCtx = getContext();
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
}

export function playChime() {
  const audioCtx = getContext();
  if (!audioCtx) return;

  // Browsers suspend AudioContext until a user gesture has happened on the
  // page; resume() is a no-op if it's already running.
  audioCtx.resume().catch(() => {});

  const now = audioCtx.currentTime;
  [880, 1175].forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;

    const start = now + i * 0.16;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.25, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);

    osc.connect(gain).connect(audioCtx.destination);
    osc.start(start);
    osc.stop(start + 0.4);
  });
}
