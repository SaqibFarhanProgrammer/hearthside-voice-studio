import { AudioLines, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import type { GenerationStatus } from "@/lib/tts/tts.service";
import { SPEED_MAX, SPEED_MIN } from "@/lib/tts/voice-registry";
import { describeStatus } from "./status-text";

interface GeneratePanelProps {
  speed: number;
  onSpeedChange: (speed: number) => void;
  onGenerate: () => void;
  disabled: boolean;
  status: GenerationStatus | null;
  error: string | null;
  firstUseNote: string | null;
}

export function GeneratePanel({
  speed,
  onSpeedChange,
  onGenerate,
  disabled,
  status,
  error,
  firstUseNote,
}: GeneratePanelProps) {
  const described = status ? describeStatus(status) : null;

  return (
    <section className="rounded-lg border bg-card p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <div className="mb-3 flex items-center justify-between">
            <label htmlFor="speed" className="eyebrow">
              Narration speed
            </label>
            <span className="font-mono text-xs tabular-nums">{speed.toFixed(2)}×</span>
          </div>
          <Slider
            id="speed"
            min={SPEED_MIN}
            max={SPEED_MAX}
            step={0.05}
            value={[speed]}
            onValueChange={([v]) => v !== undefined && onSpeedChange(v)}
            aria-label="Narration speed"
          />
          <div className="mt-1.5 flex justify-between text-[0.6875rem] text-muted-foreground">
            <span>Slower</span>
            <span>Faster</span>
          </div>
        </div>
        <Button
          size="lg"
          onClick={onGenerate}
          disabled={disabled || !!status}
          className="h-11 sm:w-48"
        >
          {status ? <Loader2 className="animate-spin" /> : <AudioLines />}
          {status ? "Generating…" : "Generate audio"}
        </Button>
      </div>

      {described && (
        <div className="mt-4 space-y-2" aria-live="polite">
          <p className="text-sm text-muted-foreground">{described.label}</p>
          {described.fraction !== null && (
            <Progress value={described.fraction * 100} className="h-1" />
          )}
        </div>
      )}
      {!status && firstUseNote && (
        <p className="mt-3 text-xs text-muted-foreground">{firstUseNote}</p>
      )}
      {error && (
        <p
          role="alert"
          className="mt-3 rounded-md border border-destructive/30 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}
    </section>
  );
}
