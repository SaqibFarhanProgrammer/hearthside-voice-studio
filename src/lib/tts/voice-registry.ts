/**
 * Single source of truth for every voice the studio exposes.
 * Male-only is a hard requirement: never add a voice whose gender is not "male",
 * and never invent IDs that do not exist in the upstream model repositories.
 */

export type VoiceGender = "male";
export type EngineId = "kokoro" | "piper";
export type LanguageCode = "en" | "ur" | "hi";

export interface VoiceDefinition {
  id: string;
  name: string;
  language: LanguageCode;
  accent: string;
  gender: VoiceGender;
  engine: EngineId;
  description: string;
  /** True when the voice must not be treated as cleared for commercial use. */
  licenseNeedsReview: boolean;
}

export interface LanguageDefinition {
  code: LanguageCode;
  label: string;
  nativeLabel: string;
  dir: "ltr" | "rtl";
  /** The same audition sentence is used for every voice in a language. */
  sampleText: string;
  defaultVoiceId: string;
}

export const LANGUAGES: readonly LanguageDefinition[] = [
  {
    code: "en",
    label: "English",
    nativeLabel: "English",
    dir: "ltr",
    sampleText:
      "The story begins with a simple question. What happens when one decision changes everything?",
    defaultVoiceId: "am_onyx",
  },
  {
    code: "ur",
    label: "Urdu",
    nativeLabel: "اردو",
    dir: "rtl",
    sampleText:
      "کہانی ایک سادہ سے سوال سے شروع ہوتی ہے۔ جب ایک فیصلہ سب کچھ بدل دے تو کیا ہوتا ہے؟",
    defaultVoiceId: "ur_PK-fasih-medium",
  },
  {
    code: "hi",
    label: "Hindi",
    nativeLabel: "हिन्दी",
    dir: "ltr",
    sampleText:
      "कहानी एक सीधे से सवाल से शुरू होती है। जब एक फ़ैसला सब कुछ बदल दे, तो क्या होता है?",
    defaultVoiceId: "hi_IN-rohan-medium",
  },
];

export const VOICES: readonly VoiceDefinition[] = [
  // Kokoro-82M — American male
  {
    id: "am_onyx",
    name: "Onyx",
    language: "en",
    accent: "American",
    gender: "male",
    engine: "kokoro",
    description: "Deepest measured voice. First pick for documentary narration.",
    licenseNeedsReview: false,
  },
  {
    id: "am_echo",
    name: "Echo",
    language: "en",
    accent: "American",
    gender: "male",
    engine: "kokoro",
    description: "Dark, resonant timbre.",
    licenseNeedsReview: false,
  },
  {
    id: "am_michael",
    name: "Michael",
    language: "en",
    accent: "American",
    gender: "male",
    engine: "kokoro",
    description: "Audition for documentary narration.",
    licenseNeedsReview: false,
  },
  {
    id: "am_adam",
    name: "Adam",
    language: "en",
    accent: "American",
    gender: "male",
    engine: "kokoro",
    description: "Audition for general narration.",
    licenseNeedsReview: false,
  },
  {
    id: "am_eric",
    name: "Eric",
    language: "en",
    accent: "American",
    gender: "male",
    engine: "kokoro",
    description: "Audition for conversational narration.",
    licenseNeedsReview: false,
  },
  {
    id: "am_fenrir",
    name: "Fenrir",
    language: "en",
    accent: "American",
    gender: "male",
    engine: "kokoro",
    description: "Compare for serious narration.",
    licenseNeedsReview: false,
  },
  {
    id: "am_liam",
    name: "Liam",
    language: "en",
    accent: "American",
    gender: "male",
    engine: "kokoro",
    description: "General-purpose comparison voice.",
    licenseNeedsReview: false,
  },
  {
    id: "am_puck",
    name: "Puck",
    language: "en",
    accent: "American",
    gender: "male",
    engine: "kokoro",
    description: "Lighter, character-style voice.",
    licenseNeedsReview: false,
  },
  {
    id: "am_santa",
    name: "Santa",
    language: "en",
    accent: "American",
    gender: "male",
    engine: "kokoro",
    description: "Character voice.",
    licenseNeedsReview: false,
  },
  // Kokoro-82M — British male
  {
    id: "bm_george",
    name: "George",
    language: "en",
    accent: "British",
    gender: "male",
    engine: "kokoro",
    description: "British narrator audition.",
    licenseNeedsReview: false,
  },
  {
    id: "bm_daniel",
    name: "Daniel",
    language: "en",
    accent: "British",
    gender: "male",
    engine: "kokoro",
    description: "British male audition option.",
    licenseNeedsReview: false,
  },
  {
    id: "bm_fable",
    name: "Fable",
    language: "en",
    accent: "British",
    gender: "male",
    engine: "kokoro",
    description: "British male audition option.",
    licenseNeedsReview: false,
  },
  {
    id: "bm_lewis",
    name: "Lewis",
    language: "en",
    accent: "British",
    gender: "male",
    engine: "kokoro",
    description: "British male audition option.",
    licenseNeedsReview: false,
  },
  // Piper — Urdu
  {
    id: "ur_PK-fasih-medium",
    name: "Fasih",
    language: "ur",
    accent: "Pakistani",
    gender: "male",
    engine: "piper",
    description:
      "The only Urdu male voice available. Medium quality — listen before relying on it.",
    licenseNeedsReview: true,
  },
  // Piper — Hindi
  {
    id: "hi_IN-rohan-medium",
    name: "Rohan",
    language: "hi",
    accent: "Indian",
    gender: "male",
    engine: "piper",
    description: "Hindi male voice, medium quality.",
    licenseNeedsReview: true,
  },
  {
    id: "hi_IN-pratham-medium",
    name: "Pratham",
    language: "hi",
    accent: "Indian",
    gender: "male",
    engine: "piper",
    description: "Hindi male voice, medium quality.",
    licenseNeedsReview: true,
  },
];

export interface VoicePreset {
  id: string;
  label: string;
  voiceId: string;
  speed: number;
}

/** Presets only pick a voice and a speed; the engines have no emotion controls. */
export const PRESETS: readonly VoicePreset[] = [
  { id: "deep", label: "Deep narration", voiceId: "am_onyx", speed: 0.9 },
  { id: "resonant", label: "Resonant narration", voiceId: "am_echo", speed: 1 },
];

export const SPEED_MIN = 0.7;
export const SPEED_MAX = 1.3;
export const SPEED_DEFAULT = 0.95;
export const MAX_INPUT_CHARS = 5000;

export function getVoice(id: string): VoiceDefinition | undefined {
  return VOICES.find((v) => v.id === id);
}

export function getLanguage(code: LanguageCode): LanguageDefinition {
  const lang = LANGUAGES.find((l) => l.code === code);
  if (!lang) throw new Error(`Unknown language: ${code}`);
  return lang;
}

export function voicesForLanguage(code: LanguageCode): VoiceDefinition[] {
  return VOICES.filter((v) => v.language === code);
}

/** Download sizes, for honest "what will be downloaded" labels. */
export const ENGINE_INFO: Record<
  EngineId,
  { label: string; model: string; license: string; approxDownloadMb: string }
> = {
  kokoro: {
    label: "Kokoro-82M",
    model: "onnx-community/Kokoro-82M-v1.0-ONNX (q8)",
    license: "Apache-2.0",
    approxDownloadMb: "≈ 92 MB once",
  },
  piper: {
    label: "Piper",
    model: "rhasspy/piper-voices (medium)",
    license: "Engine GPL-3.0-or-later · per-voice licences",
    approxDownloadMb: "≈ 63–65 MB per voice + 18 MB pronunciation data",
  },
};
