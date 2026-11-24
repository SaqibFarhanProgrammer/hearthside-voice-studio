import { describe, expect, it } from "vitest";

import { splitIntoChunks } from "./text-chunker";
import { generateRequestSchema, piperLengthScale } from "./validation";
import { MAX_INPUT_CHARS, VOICES, voicesForLanguage } from "./voice-registry";
import { concatPcm, encodeWav } from "./wav";

describe("voice registry", () => {
  it("only contains male voices", () => {
    expect(VOICES.every((v) => v.gender === "male")).toBe(true);
  });

  it("exposes exactly the 13 Kokoro male English voices", () => {
    expect(
      voicesForLanguage("en")
        .map((v) => v.id)
        .sort(),
    ).toEqual(
      [
        "am_adam",
        "am_echo",
        "am_eric",
        "am_fenrir",
        "am_liam",
        "am_michael",
        "am_onyx",
        "am_puck",
        "am_santa",
        "bm_daniel",
        "bm_fable",
        "bm_george",
        "bm_lewis",
      ].sort(),
    );
  });

  it("has a single Urdu voice (Fasih) and two Hindi voices", () => {
    expect(voicesForLanguage("ur").map((v) => v.id)).toEqual(["ur_PK-fasih-medium"]);
    expect(
      voicesForLanguage("hi")
        .map((v) => v.id)
        .sort(),
    ).toEqual(["hi_IN-pratham-medium", "hi_IN-rohan-medium"]);
  });

  it("flags Piper voices as needing licence review", () => {
    expect(VOICES.filter((v) => v.engine === "piper").every((v) => v.licenseNeedsReview)).toBe(
      true,
    );
  });
});

describe("generate request validation", () => {
  const ok = { text: "Hello there.", voiceId: "am_onyx", language: "en", speed: 0.95 } as const;

  it("accepts a valid request", () => {
    expect(generateRequestSchema.safeParse(ok).success).toBe(true);
  });
  it("rejects empty text", () => {
    expect(generateRequestSchema.safeParse({ ...ok, text: "   " }).success).toBe(false);
  });
  it("rejects text over the character limit", () => {
    expect(
      generateRequestSchema.safeParse({ ...ok, text: "a".repeat(MAX_INPUT_CHARS + 1) }).success,
    ).toBe(false);
  });
  it("rejects female or unknown voice ids", () => {
    expect(generateRequestSchema.safeParse({ ...ok, voiceId: "af_heart" }).success).toBe(false);
  });
  it("rejects a voice that does not match the language", () => {
    expect(generateRequestSchema.safeParse({ ...ok, language: "ur" }).success).toBe(false);
  });
});

describe("speed mapping", () => {
  it("maps Piper speed inversely to length_scale", () => {
    expect(piperLengthScale(2, 1)).toBe(0.5);
    expect(piperLengthScale(0.8, 1)).toBeCloseTo(1.25);
  });
});

describe("sentence chunking", () => {
  it("splits on Urdu and Hindi sentence endings", () => {
    expect(splitIntoChunks("پہلا جملہ۔ دوسرا جملہ۔", 12)).toEqual(["پہلا جملہ۔", "دوسرا جملہ۔"]);
    expect(splitIntoChunks("पहला वाक्य। दूसरा वाक्य।", 12)).toEqual([
      "पहला वाक्य।",
      "दूसरा वाक्य।",
    ]);
  });
  it("never returns a chunk longer than the limit", () => {
    const text = "word ".repeat(300) + ". Another sentence here.";
    expect(splitIntoChunks(text, 100).every((c) => c.length <= 100)).toBe(true);
  });
  it("keeps paragraphs separate", () => {
    expect(splitIntoChunks("One\n\nTwo", 500)).toEqual(["One", "Two"]);
  });
});

describe("wav output", () => {
  it("writes a valid header with the engine's sample rate", () => {
    const buf = encodeWav(new Float32Array(100), 24000);
    const view = new DataView(buf);
    expect(String.fromCharCode(...new Uint8Array(buf, 0, 4))).toBe("RIFF");
    expect(view.getUint32(24, true)).toBe(24000);
    expect(view.getUint32(40, true)).toBe(200);
    expect(buf.byteLength).toBe(244);
  });
  it("joins chunks with a silence gap", () => {
    const out = concatPcm([new Float32Array([1, 1]), new Float32Array([0.5])], 10, 0.2);
    expect(Array.from(out)).toEqual([1, 1, 0, 0, 0.5]);
  });
});
