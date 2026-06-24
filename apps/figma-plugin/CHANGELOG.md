# Changelog

All notable changes to the **assetport** Figma plugin are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.1] - 2026-06-22

### Added

- **Combine nodes** — Flatten a multi-layer selection into a single merged asset, with an editor to manage its source layers.
- **Ignore children** — Open a layer and exclude specific child nodes from the export.

## [0.1.0] - 2026-06-22

Initial release of the plugin UI for staging and sending Figma layers to VS Code.

### Added

- **Asset queue** — Stage multiple selected layers and export them in a single action.
- **Multi-format export** — Choose PNG, SVG, or JPEG per asset.
- **Live preview** — Preview each queued asset at 1×, 2×, 3×, or 4× before exporting.
- **AI-powered naming** — Optionally auto-name assets with Gemini based on each layer's visual content.
- **Output folder** — Set the relative workspace path each export is sent to (e.g. `src/assets/icons`).
- **Duplicate guard** — Adding the same node to the queue twice is now blocked automatically.
- **Quality control** — Pick a per-export compression quality (0–100) to send alongside each asset.

[0.1.1]: https://github.com/kimlonghok/assetport/releases/tag/v0.1.1
[0.1.0]: https://github.com/kimlonghok/assetport/releases/tag/v0.1.0
