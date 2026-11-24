import { ENGINE_INFO } from "@/lib/tts/voice-registry";

export function AboutEngines() {
  return (
    <details className="group rounded-lg border bg-card text-sm">
      <summary className="cursor-pointer list-none px-4 py-3 text-muted-foreground hover:text-foreground">
        <span className="eyebrow">How it works · Licences</span>
      </summary>
      <div className="space-y-4 border-t px-4 py-4 leading-relaxed text-muted-foreground">
        <p>
          Speech is generated inside this browser tab with open-source models running on your CPU.
          Your text is never sent to a speech service. Model files are downloaded once from Hugging
          Face and saved on this device; after that, generation works without internet.
        </p>
        <ul className="space-y-2">
          {Object.values(ENGINE_INFO).map((e) => (
            <li key={e.label}>
              <span className="font-medium text-foreground">{e.label}</span> — {e.model}.{" "}
              {e.license}. {e.approxDownloadMb}.
            </li>
          ))}
        </ul>
        <p>
          <span className="font-medium text-foreground">Licence warning:</span> the Urdu voice
          (Fasih) lists MIT on its model card, but its training chain includes earlier voices and
          the Lessac base, whose commercial use is restricted. The Hindi voices (Rohan, Pratham)
          also carry training-data restrictions. Treat all three as not cleared for commercial use
          until you have verified permissions. Kokoro-82M is Apache-2.0.
        </p>
        <p>
          These lightweight models do not do dramatic acting, emotion control or voice cloning.
          Speed is the only control, and it maps directly to each engine (Kokoro <code>speed</code>,
          Piper <code>length_scale</code>).
        </p>
      </div>
    </details>
  );
}
