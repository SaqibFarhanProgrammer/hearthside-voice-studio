import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatBytes, formatDuration } from "@/lib/format";
import type { GeneratedAudio } from "@/lib/tts/tts.service";
import { getLanguage } from "@/lib/tts/voice-registry";

export function AudioResult({ audio }: { audio: GeneratedAudio | null }) {
  if (!audio) {
    return (
      <section className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        Your generated audio will appear here.
      </section>
    );
  }

  const fileName = `voice-${audio.voice.id}-${audio.id.slice(0, 8)}.wav`;
  const meta = [
    ["Voice", `${audio.voice.name} (${audio.voice.id})`],
    ["Language", getLanguage(audio.voice.language).label],
    ["Length", formatDuration(audio.durationSeconds)],
    ["File size", formatBytes(audio.sizeBytes)],
  ] as const;

  return (
    <section aria-labelledby="result-label" className="rounded-lg border bg-card">
      <div className="flex items-center justify-between border-b px-4 py-2.5">
        <h2 id="result-label" className="eyebrow">
          Generated audio
        </h2>
        <span className="flex items-center gap-1.5 text-xs text-success">
          <span className="size-1.5 rounded-full bg-success" /> Ready
        </span>
      </div>
      <div className="space-y-4 p-4">
        <audio key={audio.id} controls src={audio.url} className="w-full" />
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
          {meta.map(([k, v]) => (
            <div key={k}>
              <dt className="text-xs text-muted-foreground">{k}</dt>
              <dd className="mt-0.5 truncate">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <span className="font-mono text-xs text-muted-foreground">{fileName}</span>
          <Button asChild>
            <a href={audio.url} download={fileName}>
              <Download /> Download WAV
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
