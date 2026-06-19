# Figma to VS Code Export

This repository now has two parts that work together:

- A VS Code extension that starts a local HTTP server on `http://localhost:32123`
- A Figma plugin that exports the current selection as a PNG and posts it to that server

The extension is the server. The Figma plugin is the client.

## Run locally

1. Open this folder in VS Code.
2. Run `npm install`.
3. Press `F5` to launch an Extension Development Host.
4. In the new window, click the **Figma** activity bar icon and confirm the export server is running.
5. In `figma-plugin/`, run `npm install` and `npm run dev`.
6. Import `figma-plugin/dist/manifest.json` into the Figma desktop app.
7. Select one layer in Figma, choose an output folder like `assets/figma`, and export.

## What gets written

Exports are written inside the first workspace folder open in VS Code. The extension rejects paths that try to escape that workspace.
