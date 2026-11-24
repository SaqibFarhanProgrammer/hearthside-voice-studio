import { formatBytes } from "@/lib/format";
import type { GenerationStatus } from "@/lib/tts/tts.service";

/** Only real numbers: downloaded bytes or finished chunks. Never invented percentages. */
export function describeStatus(status: GenerationStatus): {
  label: string;
  fraction: number | null;
} {
  if (status.phase === "queued") return { label: "Waiting for the current job…", fraction: null };
  if (status.phase === "loading") {
    const p = status.progress;
    if (p && p.total > 0 && p.loaded < p.total) {
      return {
        label: `Downloading ${p.file} — ${formatBytes(p.loaded)} of ${formatBytes(p.total)}`,
        fraction: p.loaded / p.total,
      };
    }
    return { label: "Starting the voice engine…", fraction: null };
  }
  return {
    label:
      status.totalChunks > 1
        ? `Generating part ${status.chunk} of ${status.totalChunks}`
        : "Generating speech…",
    fraction: status.totalChunks > 1 ? (status.chunk - 1) / status.totalChunks : null,
  };
}
