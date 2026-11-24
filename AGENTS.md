<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Local Voice Studio rules

- All speech is synthesized in the browser (Web Workers + ONNX Runtime WASM), never on the server or a cloud TTS API — the app's promise is on-device, offline-capable TTS with no keys.
- Voices live only in `src/lib/tts/voice-registry.ts` and must be real upstream IDs; the male-only and licence flags are enforced by `src/lib/tts/tts-rules.test.ts`.
- Engines implement `TtsProvider` (`src/lib/tts/providers/`); `tts.service.ts` keeps one engine worker alive at a time and runs one job at a time to limit RAM.
- Model and runtime binaries are cached via Cache Storage (`model-cache.ts`) and passed to ONNX Runtime as `wasmBinary` with CDN `wasmPaths` cleared, so generation works with the network blocked after first use.
- `src/lib/tts/vendor/piper-phonemize.js` is vendored MIT Emscripten glue (piper-phonemize + espeak-ng); do not edit it by hand.
