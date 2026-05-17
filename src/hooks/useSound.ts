import { useCallback, useRef } from 'react';

export function useSound() {
  const ctxRef = useRef<AudioContext | null>(null);

  const ac = () => {
    if (!ctxRef.current) ctxRef.current = new AudioContext();
    return ctxRef.current;
  };

  const tone = useCallback(
    (freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.25, delay = 0) => {
      try {
        const ctx = ac();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
        gain.gain.setValueAtTime(vol, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + dur);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + dur);
      } catch { /* ignore – user hasn't interacted yet */ }
    },
    []
  );

  const playMove = useCallback(() => tone(700, 0.06, 'square', 0.12), [tone]);

  const playCorrect = useCallback(() => {
    tone(523, 0.14, 'sine', 0.22);
    tone(659, 0.18, 'sine', 0.22, 0.1);
  }, [tone]);

  const playWrong = useCallback(() => {
    tone(200, 0.22, 'sawtooth', 0.18);
    tone(140, 0.22, 'sawtooth', 0.16, 0.14);
  }, [tone]);

  const playSolved = useCallback(() => {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.5, 'sine', 0.18, i * 0.09));
  }, [tone]);

  return { playMove, playCorrect, playWrong, playSolved };
}
