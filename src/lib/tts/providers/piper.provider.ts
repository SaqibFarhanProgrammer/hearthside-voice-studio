import { WorkerProvider } from "./worker-provider";

export class PiperProvider extends WorkerProvider {
  readonly engine = "piper" as const;
  readonly maxChunkChars = 400;

  protected createWorker(): Worker {
    return new Worker(new URL("../workers/piper.worker.ts", import.meta.url), { type: "module" });
  }
}
