import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";

import { AboutEngines } from "@/components/studio/AboutEngines";
import { AudioResult } from "@/components/studio/AudioResult";
import { GeneratePanel } from "@/components/studio/GeneratePanel";
import { ScriptEditor } from "@/components/studio/ScriptEditor";
import { VoicePicker } from "@/components/studio/VoicePicker";
import { useGenerate, usePreview } from "@/hooks/use-tts";
import { registerOfflineSupport } from "@/lib/offline";
import { isEngineCached } from "@/lib/tts/model-cache";
import {
  ENGINE_INFO,
  MAX_INPUT_CHARS,
  SPEED_DEFAULT,
  getLanguage,
  getVoice,
  type LanguageCode,
} from "@/lib/tts/voice-registry";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Local Voice Studio — Offline text to speech" },
      {
        name: "description",
        content:
          "Turn your text into speech entirely on your device. Male English, Urdu and Hindi voices, no cloud, no API keys.",
      },
      { property: "og:title", content: "Local Voice Studio — Offline text to speech" },
      {
        property: "og:description",
        content:
          "Paste text, pick a male voice, generate and download WAV audio — all on your own device.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Studio,
});

function Studio() {
  const [text, setText] = useState("");
  const [language, setLanguage] = useState<LanguageCode>("en");
  const [voiceId, setVoiceId] = useState("am_onyx");
  const [speed, setSpeed] = useState(SPEED_DEFAULT);
  const [engineCached, setEngineCached] = useState<boolean | null>(null);

  const lang = getLanguage(language);
  const voice = getVoice(voiceId);
  const { status, result, error, generate } = useGenerate();
  const preview = usePreview();

  useEffect(() => {
    registerOfflineSupport();
  }, []);

  useEffect(() => {
    if (!voice) return;
    let cancelled = false;
    isEngineCached(voice.engine, voice.id).then((v) => !cancelled && setEngineCached(v));
    return () => {
      cancelled = true;
    };
  }, [voice, result, preview.active]);

  const changeLanguage = (code: LanguageCode) => {
    preview.stop();
    setLanguage(code);
    setVoiceId(getLanguage(code).defaultVoiceId);
  };

  const onPreview = useCallback(
    (id: string) => {
      void preview.preview({ text: lang.sampleText, voiceId: id, language, speed });
    },
    [preview, lang.sampleText, language, speed],
  );

  const onGenerate = () => {
    preview.stop();
    void generate({ text, voiceId, language, speed });
  };

  const looksUrdu = language === "en" && /[\u0600-\u06FF]/.test(text);
  const looksHindi = language === "en" && /[\u0900-\u097F]/.test(text);
  const firstUseNote =
    voice && engineCached === false
      ? `First use of ${ENGINE_INFO[voice.engine].label} downloads ${ENGINE_INFO[voice.engine].approxDownloadMb.replace(" once", "")} and saves it on this device. After that it works offline.`
      : null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-3 px-5 py-6">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Local Voice Studio</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Turn your text into speech, entirely on your device.
            </p>
          </div>
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="size-1.5 rounded-full bg-foreground" />
            No cloud · No API keys · No credits
          </p>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-5 px-5 py-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-5">
          <ScriptEditor value={text} onChange={setText} language={lang} />
          {(looksUrdu || looksHindi) && (
            <p className="-mt-2 text-xs text-warning">
              This text looks like {looksUrdu ? "Urdu" : "Hindi"}. Switch the language to{" "}
              {looksUrdu ? "اردو" : "हिन्दी"} so it is pronounced correctly.
            </p>
          )}
          <GeneratePanel
            speed={speed}
            onSpeedChange={setSpeed}
            onGenerate={onGenerate}
            disabled={!text.trim() || text.length > MAX_INPUT_CHARS}
            status={status}
            error={error}
            firstUseNote={firstUseNote}
          />
          <AudioResult audio={result} />
        </div>

        <aside className="space-y-5">
          <VoicePicker
            language={language}
            onLanguageChange={changeLanguage}
            voiceId={voiceId}
            onVoiceChange={setVoiceId}
            onPreview={onPreview}
            preview={preview.active}
            onPreset={(p) => {
              setVoiceId(p.voiceId);
              setSpeed(p.speed);
            }}
          />
          {preview.status && preview.active?.phase === "loading" && (
            <p className="-mt-2 text-xs text-muted-foreground" aria-live="polite">
              Preparing preview…{" "}
              {preview.status.phase === "loading" ? "loading the voice engine" : ""}
            </p>
          )}
          {preview.error && (
            <p role="alert" className="-mt-2 text-xs text-destructive">
              {preview.error}
            </p>
          )}
          <AboutEngines />
        </aside>
      </main>
    </div>
  );
}
