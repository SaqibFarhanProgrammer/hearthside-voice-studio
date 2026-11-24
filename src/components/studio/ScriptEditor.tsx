import { Eraser } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { MAX_INPUT_CHARS, type LanguageDefinition } from "@/lib/tts/voice-registry";

interface ScriptEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: LanguageDefinition;
}

export function ScriptEditor({ value, onChange, language }: ScriptEditorProps) {
  const count = value.length;
  const over = count > MAX_INPUT_CHARS;

  return (
    <section aria-labelledby="script-label" className="rounded-lg border bg-card">
      <div className="flex items-center justify-between border-b px-4 py-2.5">
        <label id="script-label" htmlFor="script" className="eyebrow">
          Script
        </label>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange("")}
          disabled={!value}
          className="text-muted-foreground"
        >
          <Eraser /> Clear
        </Button>
      </div>
      <Textarea
        id="script"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste your script here..."
        dir={language.dir}
        lang={language.code}
        spellCheck={language.code === "en"}
        className={cn(
          "min-h-[320px] resize-y rounded-none border-0 px-4 py-4 text-base shadow-none focus-visible:ring-0 md:text-[1.0625rem]",
          `script-${language.code}`,
        )}
      />
      <div className="flex items-center justify-between border-t px-4 py-2 text-xs text-muted-foreground">
        <span>Line breaks and punctuation are kept as natural pauses.</span>
        <span className={cn("font-mono tabular-nums", over && "text-destructive")}>
          {count.toLocaleString()} / {MAX_INPUT_CHARS.toLocaleString()}
        </span>
      </div>
    </section>
  );
}
