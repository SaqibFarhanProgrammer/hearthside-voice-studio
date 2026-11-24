import { KokoroProvider } from "./providers/kokoro.provider";
import { PiperProvider } from "./providers/piper.provider";
import type { TtsProvider } from "./providers/worker-provider";
import { splitIntoChunks } from "./text-chunker";
import { generateRequestSchema, type GenerateRequest } from "./validation";
import { getVoice, type EngineId, type VoiceDefinition } from "./voice-registry";
import { concatPcm, encodeWav } from "./wav";
import type { DownloadProgress } from "./worker-protocol";

export type GenerationStatus =
  | { phase: "queued" }
  | { phase: "loading"; progress: DownloadProgress | null }
  | { phase: "synthesizing"; chunk: number; totalChunks: number };

export interface GeneratedAudio {
  id: string;
  url: string;
  blob: Blob;
  voice: VoiceDefinition;
  speed: number;
  sizeBytes: number;
  durationSeconds: number;
  createdAt: Date;
}

const factories: Record<EngineId, () => TtsProvider> = {
  kokoro: () => new KokoroProvider(),
  piper: () => new PiperProvider(),
};

/**
 * Lazily starts one engine at a time (the other is shut down to free memory)
 * and runs one generation at a time.
 */
class TtsService {
  private active: TtsProvider | null = null;
  private queue: Promise<unknown> = Promise.resolve();

  private provider(engine: EngineId): TtsProvider {
    if (this.active?.engine === engine) return this.active;
    this.active?.dispose();
    this.active = factories[engine]();
    return this.active;
  }

  generate(
    input: GenerateRequest,
    onStatus?: (s: GenerationStatus) => void,
  ): Promise<GeneratedAudio> {
    const parsed = generateRequestSchema.safeParse(input);
    if (!parsed.success) {
      return Promise.reject(new Error(parsed.error.issues[0]?.message ?? "Invalid request."));
    }
    const req = parsed.data;
    onStatus?.({ phase: "queued" });
    const job = this.queue.then(() => this.run(req, onStatus));
    this.queue = job.catch(() => undefined);
    return job;
  }

  private async run(req: GenerateRequest, onStatus?: (s: GenerationStatus) => void) {
    const voice = getVoice(req.voiceId);
    if (!voice) throw new Error("Unknown voice.");
    const provider = this.provider(voice.engine);

    onStatus?.({ phase: "loading", progress: null });
    await provider.load(voice.id, (progress) => onStatus?.({ phase: "loading", progress }));

    const chunks = splitIntoChunks(req.text, provider.maxChunkChars);
    const pcm: Float32Array[] = [];
    let sampleRate = 0;
    for (let i = 0; i < chunks.length; i++) {
      onStatus?.({ phase: "synthesizing", chunk: i + 1, totalChunks: chunks.length });
      const result = await provider.synthesize(chunks[i] as string, voice.id, req.speed);
      sampleRate = result.sampleRate;
      pcm.push(result.samples);
    }

    const samples = concatPcm(pcm, sampleRate);
    const blob = new Blob([encodeWav(samples, sampleRate)], { type: "audio/wav" });
    return {
      id: crypto.randomUUID(),
      url: URL.createObjectURL(blob),
      blob,
      voice,
      speed: req.speed,
      sizeBytes: blob.size,
      durationSeconds: samples.length / sampleRate,
      createdAt: new Date(),
    } satisfies GeneratedAudio;
  }
}

let instance: TtsService | null = null;

/** Browser-only singleton; never call during server rendering. */
export function getTtsService(): TtsService {
  instance ??= new TtsService();
  return instance;
}
