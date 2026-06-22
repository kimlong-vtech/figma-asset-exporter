# Changelog

All notable changes to AssetPort are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.1] - 2026-06-22

Initial release. Export Figma assets directly into your VS Code workspace — no cloud relay.

### Added

- **Multi-format export** — Export selected Figma layers as PNG, SVG, or JPEG directly into your VS Code workspace.
- **Asset queue** — Stage multiple layers at once and export them all in a single action.
- **Live preview** — Preview each queued asset at 1×, 2×, 3×, or 4× before exporting.
- **AI-powered naming** — Optionally auto-rename assets using Gemini based on the visual content of each layer.
- **Configurable output folder** — Set a custom relative path per export session (e.g. `src/assets/icons`).
- **Lossy compression** — Configurable quality (0–100) for PNG/JPEG exports; SVG is always lossless.
- **Combine nodes** — Flatten a multi-layer selection into a single exported asset.
- **Ignore children** — Skip child layers you don't want included in an export.
- **Duplicate guard** — Adding the same Figma node to the queue twice is blocked automatically.
- **Fully local** — The Figma plugin talks directly to a local HTTP server (`http://localhost:32123`) in the VS Code extension. Nothing leaves your machine.

### Settings

- `assetport.geminiApiKey` — Gemini API key for AI-powered asset naming.
- `assetport.compressionQuality` — Fallback quality target (0–100) for PNG/JPEG compression. Default `75`.

[0.0.1]: https://github.com/kimlonghok/assetport/releases/tag/v0.0.1
