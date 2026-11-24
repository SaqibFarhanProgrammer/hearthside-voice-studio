import { Check, Loader2, Play, Square } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  LANGUAGES,
  PRESETS,
  voicesForLanguage,
  type LanguageCode,
  type VoicePreset,
} from "@/lib/tts/voice-registry";
import type { PreviewPhase } from "@/hooks/use-tts";

interface VoicePickerProps {
  language: LanguageCode;
  onLanguageChange: (code: LanguageCode) => void;
  voiceId: string;
  onVoiceChange: (id: string) => void;
  onPreview: (id: string) => void;
  preview: { voiceId: string; phase: PreviewPhase } | null;
  onPreset: (preset: VoicePreset) => void;
}

export function VoicePicker({
  language,
  onLanguageChange,
  voiceId,
  onVoiceChange,
  onPreview,
  preview,
  onPreset,
}: VoicePickerProps) {
  const voices = voicesForLanguage(language);

  return (
    <section aria-labelledby="voice-label" className="rounded-lg border bg-card">
      <div className="border-b px-4 py-2.5">
        <h2 id="voice-label" className="eyebrow">
          Language & voice
        </h2>
      </div>

      <div className="space-y-4 p-4">
        <div
          role="radiogroup"
          aria-label="Language"
          className="grid grid-cols-3 gap-1 rounded-md bg-muted p-1"
        >
          {LANGUAGES.map((lang) => {
            const selected = lang.code === language;
            return (
              <button
                key={lang.code}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onLanguageChange(lang.code)}
                className={cn(
                  "rounded px-2 py-1.5 text-sm transition-colors",
                  selected
                    ? "bg-background font-medium text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span className={lang.code === "en" ? "" : `script-${lang.code} leading-none`}>
                  {lang.nativeLabel}
                </span>
              </button>
            );
          })}
        </div>

        {language === "en" && (
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => onPreset(preset)}
                className="rounded-full border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
              >
                {preset.label} · <span className="font-mono">{preset.voiceId}</span> ·{" "}
                {preset.speed}×
              </button>
            ))}
          </div>
        )}

        <ul
          role="radiogroup"
          aria-label="Male voice"
          className="max-h-[420px] space-y-1 overflow-y-auto pr-1"
        >
          {voices.map((voice) => {
            const selected = voice.id === voiceId;
            const previewing = preview?.voiceId === voice.id ? preview.phase : null;
            return (
              <li key={voice.id}>
                <div
                  className={cn(
                    "group flex items-start gap-3 rounded-md border px-3 py-2.5 transition-colors",
                    selected ? "border-foreground bg-accent" : "border-transparent hover:bg-muted",
                  )}
                >
                  <button
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => onVoiceChange(voice.id)}
                    className="flex min-w-0 flex-1 items-start gap-3 text-left"
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border",
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input",
                      )}
                    >
                      {selected && <Check className="size-3" strokeWidth={3} />}
                    </span>
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-baseline gap-x-2">
                        <span className="text-sm font-medium">{voice.name}</span>
                        <span className="font-mono text-[0.6875rem] text-muted-foreground">
                          {voice.id}
                        </span>
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {voice.accent} · Male · {voice.description}
                      </span>
                      {voice.licenseNeedsReview && (
                        <span className="mt-1 inline-block rounded bg-warning-soft px-1.5 py-0.5 text-[0.6875rem] text-warning">
                          Licence needs review before commercial use
                        </span>
                      )}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onPreview(voice.id)}
                    aria-label={
                      previewing === "playing" ? `Stop ${voice.name}` : `Preview ${voice.name}`
                    }
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-full border transition-colors",
                      previewing
                        ? "border-foreground bg-foreground text-background"
                        : "bg-background text-foreground hover:border-foreground",
                    )}
                  >
                    {previewing === "loading" ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : previewing === "playing" ? (
                      <Square className="size-3" fill="currentColor" />
                    ) : (
                      <Play className="size-3.5 translate-x-px" fill="currentColor" />
                    )}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
        {language !== "en" && (
          <p className="text-xs text-muted-foreground">
            Only{" "}
            {voices.length === 1 ? "one male voice exists" : `${voices.length} male voices exist`}{" "}
            for this language in the local engines. No extra voices are faked.
          </p>
        )}
      </div>
    </section>
  );
}
