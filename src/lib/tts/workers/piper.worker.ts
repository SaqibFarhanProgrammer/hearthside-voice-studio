/// <reference lib="webworker" />
import * as ort from "onnxruntime-web";

import {
  ORT_WASM_URL,
  PIPER_PHONEMIZE_DATA_URL,
  PIPER_PHONEMIZE_WASM_URL,
  fetchCached,
  piperModelUrl,
} from "../model-cache";
import { piperLengthScale } from "../validation";
import { createPiperPhonemize } from "../vendor/piper-phonemize.js";
import type { WorkerRequest, WorkerResponse } from "../worker-protocol";

declare const self: DedicatedWorkerGlobalScope;

interface PiperConfig {
  audio: { sample_rate: number };
  espeak: { voice: string };
  inference: { noise_scale: number; length_scale: number; noise_w: number };
  speaker_id_map: Record<string, number>;
}

interface LoadedVoice {
  voiceId: string;
  config: PiperConfig;
  session: ort.InferenceSession;
}

let runtimeReady: Promise<{ wasmUrl: string; dataUrl: string }> | null = null;
let current: LoadedVoice | null = null;

function post(msg: WorkerResponse, transfer: Transferable[] = []) {
  self.postMessage(msg, transfer);
}

function prepareRuntime(id: number) {
  if (!runtimeReady) {
    runtimeReady = (async () => {
      const onProgress = (progress: { file: string; loaded: number; total: number }) =>
        post({ id, type: "progress", progress });
      ort.env.wasm.wasmBinary = await fetchCached(ORT_WASM_URL, onProgress);
      const [wasm, data] = await Promise.all([
        fetchCached(PIPER_PHONEMIZE_WASM_URL, onProgress),
        fetchCached(PIPER_PHONEMIZE_DATA_URL, onProgress),
      ]);
      return {
        wasmUrl: URL.createObjectURL(new Blob([wasm], { type: "application/wasm" })),
        dataUrl: URL.createObjectURL(new Blob([data])),
      };
    })();
    runtimeReady.catch(() => {
      runtimeReady = null;
    });
  }
  return runtimeReady;
}

async function loadVoice(id: number, voiceId: string): Promise<LoadedVoice> {
  if (current?.voiceId === voiceId) return current;
  await prepareRuntime(id);
  const url = piperModelUrl(voiceId);
  const configBuf = await fetchCached(`${url}.json`);
  const config = JSON.parse(new TextDecoder().decode(configBuf)) as PiperConfig;
  const model = await fetchCached(url, (progress) => post({ id, type: "progress", progress }));
  // Only one Piper voice stays in memory at a time.
  await current?.session.release();
  current = null;
  const session = await ort.InferenceSession.create(model, { executionProviders: ["wasm"] });
  current = { voiceId, config, session };
  return current;
}

async function phonemize(text: string, espeakVoice: string): Promise<number[]> {
  const { wasmUrl, dataUrl } = await (runtimeReady as NonNullable<typeof runtimeReady>);
  return new Promise<number[]>((resolve, reject) => {
    createPiperPhonemize({
      print: (data) => {
        try {
          resolve((JSON.parse(data) as { phoneme_ids: number[] }).phoneme_ids);
        } catch (e) {
          reject(e);
        }
      },
      printErr: (message) => reject(new Error(message)),
      locateFile: (file) =>
        file.endsWith(".wasm") ? wasmUrl : file.endsWith(".data") ? dataUrl : file,
    })
      .then((module) =>
        module.callMain([
          "-l",
          espeakVoice,
          "--input",
          JSON.stringify([{ text }]),
          "--espeak_data",
          "/espeak-ng-data",
        ]),
      )
      .catch(reject);
  });
}

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const msg = event.data;
  try {
    const voice = await loadVoice(msg.id, msg.voiceId);
    if (msg.type === "load") {
      post({ id: msg.id, type: "loaded" });
      return;
    }
    const ids = await phonemize(msg.text.trim(), voice.config.espeak.voice);
    const { noise_scale, length_scale, noise_w } = voice.config.inference;
    const feeds: Record<string, ort.Tensor> = {
      input: new ort.Tensor("int64", BigInt64Array.from(ids.map(BigInt)), [1, ids.length]),
      input_lengths: new ort.Tensor("int64", BigInt64Array.from([BigInt(ids.length)]), [1]),
      scales: new ort.Tensor(
        "float32",
        Float32Array.from([noise_scale, piperLengthScale(msg.speed, length_scale), noise_w]),
        [3],
      ),
    };
    if (Object.keys(voice.config.speaker_id_map ?? {}).length) {
      feeds["sid"] = new ort.Tensor("int64", BigInt64Array.from([0n]), [1]);
    }
    const result = await voice.session.run(feeds);
    const output = result["output"];
    if (!output) throw new Error("Piper returned no audio.");
    const samples = new Float32Array(output.data as Float32Array);
    post({ id: msg.id, type: "audio", samples, sampleRate: voice.config.audio.sample_rate }, [
      samples.buffer,
    ]);
  } catch (err) {
    post({ id: msg.id, type: "error", message: err instanceof Error ? err.message : String(err) });
  }
};
