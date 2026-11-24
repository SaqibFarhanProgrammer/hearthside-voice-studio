import type { DownloadProgress } from "./worker-protocol";

/**
 * Downloads a file once and keeps it in the browser's Cache Storage, so later
 * generations (and offline use) read it from this device instead of the network.
 */
export const MODEL_CACHE = "local-voice-studio-models-v1";

/** Same ONNX Runtime build that kokoro-js / transformers.js bundles. */
export const ORT_VERSION = "1.22.0-dev.20250409-89f8206ba4";
export const ORT_WASM_URL = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ORT_VERSION}/dist/ort-wasm-simd-threaded.jsep.wasm`;

export const PIPER_PHONEMIZE_WASM_URL =
  "https://cdn.jsdelivr.net/npm/@diffusionstudio/piper-wasm@1.0.0/build/piper_phonemize.wasm";
export const PIPER_PHONEMIZE_DATA_URL =
  "https://cdn.jsdelivr.net/npm/@diffusionstudio/piper-wasm@1.0.0/build/piper_phonemize.data";

export const KOKORO_MODEL_ID = "onnx-community/Kokoro-82M-v1.0-ONNX";
export const KOKORO_MODEL_FILE_URL = `https://huggingface.co/${KOKORO_MODEL_ID}/resolve/main/onnx/model_quantized.onnx`;

/** ur_PK-fasih-medium → ur/ur_PK/fasih/medium/ur_PK-fasih-medium.onnx on rhasspy/piper-voices */
export function piperModelUrl(voiceId: string): string {
  const match = /^([a-z]{2,3})_([A-Z]{2})-(.+)-(x_low|low|medium|high)$/.exec(voiceId);
  if (!match) throw new Error(`Not a Piper voice id: ${voiceId}`);
  const [, lang, region, name, quality] = match;
  return `https://huggingface.co/rhasspy/piper-voices/resolve/main/${lang}/${lang}_${region}/${name}/${quality}/${voiceId}.onnx`;
}

async function openCache(): Promise<Cache | null> {
  try {
    return await caches.open(MODEL_CACHE);
  } catch {
    return null;
  }
}

export async function fetchCached(
  url: string,
  onProgress?: (p: DownloadProgress) => void,
): Promise<ArrayBuffer> {
  const cache = await openCache();
  const hit = await cache?.match(url);
  if (hit) return hit.arrayBuffer();

  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    throw new Error(
      "Could not download model files. Connect to the internet once so they can be saved on this device.",
    );
  }
  if (!res.ok) throw new Error(`Model download failed (${res.status}) for ${url.split("/").pop()}`);

  const total = Number(res.headers.get("content-length") ?? 0);
  const file = url.split("/").pop() ?? url;
  const reader = res.body?.getReader();
  const parts: Uint8Array[] = [];
  let loaded = 0;
  while (reader) {
    const { done, value } = await reader.read();
    if (done) break;
    parts.push(value);
    loaded += value.length;
    onProgress?.({ file, loaded, total });
  }
  const bytes = new Uint8Array(loaded);
  let offset = 0;
  for (const part of parts) {
    bytes.set(part, offset);
    offset += part.length;
  }
  try {
    await cache?.put(
      url,
      new Response(bytes, {
        headers: { "content-type": res.headers.get("content-type") ?? "application/octet-stream" },
      }),
    );
  } catch {
    // Storage full or unavailable: generation still works, it just will not be offline.
  }
  return bytes.buffer;
}

/** Whether every file an engine needs is already saved on this device. */
export async function isEngineCached(
  engine: "kokoro" | "piper",
  voiceId?: string,
): Promise<boolean> {
  if (typeof caches === "undefined") return false;
  try {
    const ours = await caches.open(MODEL_CACHE);
    const hasRuntime = !!(await ours.match(ORT_WASM_URL));
    if (engine === "kokoro") {
      const names = await caches.keys();
      if (!names.includes("transformers-cache")) return false;
      const tf = await caches.open("transformers-cache");
      return hasRuntime && !!(await tf.match(KOKORO_MODEL_FILE_URL));
    }
    if (!voiceId) return false;
    return (
      hasRuntime &&
      !!(await ours.match(PIPER_PHONEMIZE_DATA_URL)) &&
      !!(await ours.match(piperModelUrl(voiceId)))
    );
  } catch {
    return false;
  }
}
