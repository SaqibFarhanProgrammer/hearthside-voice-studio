import { z } from "zod";

import { MAX_INPUT_CHARS, SPEED_MAX, SPEED_MIN, getVoice } from "./voice-registry";

export const generateRequestSchema = z
  .object({
    text: z
      .string()
      .trim()
      .min(1, "Paste some text first.")
      .max(MAX_INPUT_CHARS, `Text is longer than ${MAX_INPUT_CHARS} characters.`),
    voiceId: z.string().refine((id) => getVoice(id) !== undefined, "Unknown voice."),
    language: z.enum(["en", "ur", "hi"]),
    speed: z.number().min(SPEED_MIN).max(SPEED_MAX),
  })
  .refine((req) => getVoice(req.voiceId)?.language === req.language, {
    message: "This voice does not speak the selected language.",
    path: ["voiceId"],
  });

export type GenerateRequest = z.infer<typeof generateRequestSchema>;

/** Piper controls pace through length_scale (bigger = slower), so speed maps inversely. */
export function piperLengthScale(speed: number, modelLengthScale = 1): number {
  return modelLengthScale / speed;
}
