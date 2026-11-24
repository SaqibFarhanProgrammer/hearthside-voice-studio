export interface DownloadProgress {
  file: string;
  loaded: number;
  total: number;
}

export type WorkerRequest =
  | { id: number; type: "load"; voiceId: string }
  | { id: number; type: "synthesize"; voiceId: string; text: string; speed: number };

export type WorkerResponse =
  | { id: number; type: "progress"; progress: DownloadProgress }
  | { id: number; type: "loaded" }
  | { id: number; type: "audio"; samples: Float32Array; sampleRate: number }
  | { id: number; type: "error"; message: string };
