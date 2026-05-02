import { useRef, useCallback } from "react";

export function useAudioBuzzer() {
  const audioCtxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback(() => {
    if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
      audioCtxRef.current = new AudioContext();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const beep = useCallback(
    (
      ctx: AudioContext,
      freq: number,
      startTime: number,
      duration: number,
      type: OscillatorType = "square",
      gain = 0.25
    ) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.connect(g);
      g.connect(ctx.destination);
      osc.type = type;
      osc.frequency.value = freq;
      g.gain.setValueAtTime(gain, startTime);
      g.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.start(startTime);
      osc.stop(startTime + duration + 0.01);
    },
    []
  );

  const playAlert = useCallback(
    (type: "helmet" | "alcohol" | "drowsy" | "distance") => {
      const ctx = getCtx();
      const t = ctx.currentTime + 0.05;

      if (type === "helmet") {
        // 3 sharp ascending high-pitch beeps — urgent "wear your helmet!"
        beep(ctx, 880, t, 0.12, "square", 0.3);
        beep(ctx, 1100, t + 0.18, 0.12, "square", 0.3);
        beep(ctx, 1320, t + 0.36, 0.18, "square", 0.35);
        // repeat once for emphasis
        beep(ctx, 880, t + 0.65, 0.12, "square", 0.28);
        beep(ctx, 1100, t + 0.83, 0.12, "square", 0.28);
        beep(ctx, 1320, t + 1.01, 0.18, "square", 0.32);
      }

      if (type === "alcohol") {
        // Rapid alternating two-tone alarm — police-siren style
        const pairs = 5;
        for (let i = 0; i < pairs; i++) {
          beep(ctx, 960, t + i * 0.28, 0.12, "sawtooth", 0.28);
          beep(ctx, 660, t + i * 0.28 + 0.14, 0.12, "sawtooth", 0.28);
        }
      }

      if (type === "drowsy") {
        // 3 slow deep pulsing tones — heavy, low frequency warning
        beep(ctx, 280, t, 0.4, "sine", 0.35);
        beep(ctx, 260, t + 0.55, 0.4, "sine", 0.32);
        beep(ctx, 240, t + 1.1, 0.5, "sine", 0.3);
      }

      if (type === "distance") {
        // Short quick chirps — proximity warning
        for (let i = 0; i < 4; i++) {
          beep(ctx, 1500, t + i * 0.15, 0.08, "triangle", 0.22);
        }
      }
    },
    [getCtx, beep]
  );

  const playTestSound = useCallback(
    (type: "helmet" | "alcohol" | "drowsy" | "distance") => {
      playAlert(type);
    },
    [playAlert]
  );

  return { playAlert, playTestSound };
}
