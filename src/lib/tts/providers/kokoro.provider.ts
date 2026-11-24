import { WorkerProvider } from "./worker-provider";

export class KokoroProvider extends WorkerProvider {
  readonly engine = "kokoro" as const;
  // Kokoro truncates around 510 phoneme tokens; ~280 characters stays safely below that.
  readonly maxChunkChars = 280;

  protected createWorker(): Worker {
    return new Worker(new URL("../workers/kokoro.worker.ts", import.meta.url), { type: "module" });
  }
}
