/// <reference lib="webworker" />
import { env } from "@huggingface/transformers";
import { KokoroTTS } from "kokoro-js";

import { KOKORO_MODEL_ID, ORT_WASM_URL, fetchCached } from "../model-cache";
import type { WorkerRequest, WorkerResponse } from "../worker-protocol";

declare const self: DedicatedWorkerGlobalScope;

let ttsPromise: Promise<KokoroTTS> | null = null;

function post(msg: WorkerResponse, transfer: Transferable[] = []) {
  self.postMessage(msg, transfer);
}

function load(id: number): Promise<KokoroTTS> {
  if (!ttsPromise) {
    ttsPromise = (async () => {
      // Keep the ONNX runtime on this device too, so English works offline after the first load.
      const onnx = env.backends.onnx as {
        wasm?: { wasmBinary?: ArrayBuffer; wasmPaths?: unknown };
      };
      if (onnx.wasm) {
        // transformers.js points the runtime at a CDN; clear it so the bundled runtime code is used
        // together with the locally cached binary below.
        delete onnx.wasm.wasmPaths;
        onnx.wasm.wasmBinary = await fetchCached(ORT_WASM_URL, (progress) =>
          post({ id, type: "progress", progress }),
        );
      }
      return KokoroTTS.from_pretrained(KOKORO_MODEL_ID, {
        dtype: "q8",
        device: "wasm", // CPU inference via WebAssembly
        progress_callback: (info) => {
          if (info.status === "progress") {
            post({
              id,
              type: "progress",
              progress: { file: info.file, loaded: info.loaded, total: info.total },
            });
          }
        },
      });
    })();
    ttsPromise.catch(() => {
      ttsPromise = null;
    });
  }
  return ttsPromise;
}

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const msg = event.data;
  try {
    const tts = await load(msg.id);
    if (msg.type === "load") {
      post({ id: msg.id, type: "loaded" });
      return;
    }
    const audio = await tts.generate(msg.text, {
      // The id was already checked against the male-only registry before reaching the worker.
      voice: msg.voiceId as "am_onyx",
      speed: msg.speed,
    });
    const samples = audio.audio as Float32Array;
    post({ id: msg.id, type: "audio", samples, sampleRate: audio.sampling_rate }, [samples.buffer]);
  } catch (err) {
    post({ id: msg.id, type: "error", message: err instanceof Error ? err.message : String(err) });
  }
};
