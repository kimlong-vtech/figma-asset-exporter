# Changelog

All notable changes to the **assetport** VS Code extension are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.1] - 2026-06-22

### Added

- **Combined-asset support** — Correctly receives and saves merged, multi-layer assets sent from the Figma plugin.

## [0.1.0] - 2026-06-22

Initial release. Runs a local server that receives Figma assets and writes them into your open workspace — nothing leaves your machine.

### Added

- **Local export server** — Listens on `http://localhost:32123` for assets sent from the Figma plugin.
- **Save into workspace** — Writes each export to a relative path inside the open folder, with path-traversal protection so files stay inside the workspace.
- **Lossy compression** — Compresses PNG (palette quantization + lossless oxipng repass) and JPEG (mozjpeg) on the way in; SVG passes through untouched, and an asset is never made larger.
- **Status bar control** — Start, stop, and see server status from a status bar item; `assetport.startServer` / `assetport.stopServer` commands.

[0.1.1]: https://github.com/kimlonghok/assetport/releases/tag/v0.1.1
[0.1.0]: https://github.com/kimlonghok/assetport/releases/tag/v0.1.0
