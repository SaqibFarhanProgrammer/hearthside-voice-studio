import type { DownloadProgress, WorkerRequest, WorkerResponse } from "../worker-protocol";
import type { EngineId } from "../voice-registry";

export interface SynthesisResult {
  samples: Float32Array;
  sampleRate: number;
}

/** Every engine implements this, so the studio never depends on engine internals. */
export interface TtsProvider {
  readonly engine: EngineId;
  /** Text longer than this is split into sentence-aware chunks before synthesis. */
  readonly maxChunkChars: number;
  load(voiceId: string, onProgress?: (p: DownloadProgress) => void): Promise<void>;
  synthesize(text: string, voiceId: string, speed: number): Promise<SynthesisResult>;
  dispose(): void;
}

type Pending = {
  resolve: (value: SynthesisResult | null) => void;
  reject: (err: Error) => void;
  onProgress?: ((p: DownloadProgress) => void) | undefined;
};

type DistributiveOmit<T, K extends keyof T> = T extends unknown ? Omit<T, K> : never;

/** Runs an engine inside a Web Worker so the page stays responsive during inference. */
export abstract class WorkerProvider implements TtsProvider {
  abstract readonly engine: EngineId;
  abstract readonly maxChunkChars: number;
  protected abstract createWorker(): Worker;

  private worker: Worker | null = null;
  private nextId = 1;
  private pending = new Map<number, Pending>();

  private getWorker(): Worker {
    if (this.worker) return this.worker;
    const worker = this.createWorker();
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const msg = event.data;
      const entry = this.pending.get(msg.id);
      if (!entry) return;
      if (msg.type === "progress") {
        entry.onProgress?.(msg.progress);
        return;
      }
      this.pending.delete(msg.id);
      if (msg.type === "error") entry.reject(new Error(msg.message));
      else if (msg.type === "audio")
        entry.resolve({ samples: msg.samples, sampleRate: msg.sampleRate });
      else entry.resolve(null);
    };
    worker.onerror = (event) => {
      const err = new Error(event.message || `The ${this.engine} engine crashed.`);
      this.pending.forEach((p) => p.reject(err));
      this.pending.clear();
      this.dispose();
    };
    this.worker = worker;
    return worker;
  }

  private request(
    body: DistributiveOmit<WorkerRequest, "id">,
    onProgress?: (p: DownloadProgress) => void,
  ): Promise<SynthesisResult | null> {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject, onProgress });
      this.getWorker().postMessage({ ...body, id } as WorkerRequest);
    });
  }

  async load(voiceId: string, onProgress?: (p: DownloadProgress) => void): Promise<void> {
    await this.request({ type: "load", voiceId }, onProgress);
  }

  async synthesize(text: string, voiceId: string, speed: number): Promise<SynthesisResult> {
    const result = await this.request({ type: "synthesize", voiceId, text, speed });
    if (!result) throw new Error("No audio was produced.");
    return result;
  }

  dispose(): void {
    this.worker?.terminate();
    this.worker = null;
  }
}
