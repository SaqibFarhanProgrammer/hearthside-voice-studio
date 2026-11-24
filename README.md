# Local Voice Studio

Offline text-to-speech that runs entirely in your browser: paste text → pick a male voice → generate → preview → download WAV.

- **English:** Kokoro-82M (q8 ONNX, Apache-2.0) — 13 male voices.
- **Urdu:** Piper `ur_PK-fasih-medium`. **Hindi:** Piper `hi_IN-rohan-medium`, `hi_IN-pratham-medium`.
- Inference runs on the CPU via WebAssembly in a Web Worker. No cloud TTS, no API keys.
- First use of an engine downloads its model once (Kokoro ≈ 92 MB; each Piper voice ≈ 63–65 MB plus 18 MB pronunciation data, plus a ≈ 21 MB runtime) and stores it in the browser's Cache Storage. After that, generation works offline.
- Clearing site data in the browser removes the saved models.

**Licences:** Piper's engine is GPL-3.0-or-later and each voice has its own licence chain. Fasih's model card says MIT, but its training chain includes Lessac-derived voices (commercial use restricted); the Hindi voices also have training-data restrictions. Treat them as not cleared for commercial use until verified.

---

# Welcome to your Lovable project

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Open your project in the [Lovable editor](https://lovable.dev) and keep building.

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: connect the project to GitHub and every change made in Lovable is committed straight to your repository.
- **Full ownership**: this code is yours. Push to your repository and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS
