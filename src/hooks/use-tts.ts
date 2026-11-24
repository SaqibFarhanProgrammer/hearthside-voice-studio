import { useCallback, useEffect, useRef, useState } from "react";

import { getTtsService, type GeneratedAudio, type GenerationStatus } from "@/lib/tts/tts.service";
import type { GenerateRequest } from "@/lib/tts/validation";

export function useGenerate() {
  const [status, setStatus] = useState<GenerationStatus | null>(null);
  const [result, setResult] = useState<GeneratedAudio | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (req: GenerateRequest) => {
    setError(null);
    try {
      const audio = await getTtsService().generate(req, setStatus);
      setResult((prev) => {
        if (prev) URL.revokeObjectURL(prev.url);
        return audio;
      });
      return audio;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return null;
    } finally {
      setStatus(null);
    }
  }, []);

  return { status, result, error, generate, busy: status !== null };
}

export type PreviewPhase = "loading" | "playing";

/** Voice auditions: same sample sentence per language, cached per voice + speed. */
export function usePreview() {
  const cache = useRef(new Map<string, GeneratedAudio>());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [active, setActive] = useState<{ voiceId: string; phase: PreviewPhase } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<GenerationStatus | null>(null);

  const stop = useCallback(() => {
    audioRef.current?.pause();
    setActive(null);
  }, []);

  useEffect(() => {
    const map = cache.current;
    return () => {
      audioRef.current?.pause();
      map.forEach((a) => URL.revokeObjectURL(a.url));
    };
  }, []);

  const preview = useCallback(
    async (req: GenerateRequest) => {
      if (active?.voiceId === req.voiceId) {
        stop();
        return;
      }
      audioRef.current?.pause();
      setError(null);
      const key = `${req.voiceId}@${req.speed}`;
      let audio = cache.current.get(key);
      if (!audio) {
        setActive({ voiceId: req.voiceId, phase: "loading" });
        try {
          audio = await getTtsService().generate(req, setStatus);
          cache.current.set(key, audio);
        } catch (err) {
          setError(err instanceof Error ? err.message : String(err));
          setActive(null);
          return;
        } finally {
          setStatus(null);
        }
      }
      const el = audioRef.current ?? new Audio();
      audioRef.current = el;
      el.src = audio.url;
      el.onended = () => setActive(null);
      setActive({ voiceId: req.voiceId, phase: "playing" });
      await el.play().catch(() => setActive(null));
    },
    [active, stop],
  );

  return { active, preview, stop, error, status };
}
