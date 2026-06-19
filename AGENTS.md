# Repository Guidelines

## Project Structure & Module Organization

This repository is a VS Code extension with a nested Figma plugin workspace:

- Extension root: [`src/extension.js`](/Users/user/vscode-extension/figma/src/extension.js) registers the sidebar view and command, with static assets in `media/`.
- Nested plugin folder: `figma-plugin/` contains a Plugma + React Figma plugin. Main plugin code lives in `figma-plugin/src/main/`, UI code in `figma-plugin/src/ui/`, and metadata in `figma-plugin/manifest.json`.

Do not edit generated dependencies in `node_modules/`. Keep extension changes at the repository root and plugin changes inside `figma-plugin/`.

## Build, Test, and Development Commands

Run root commands for the extension, and `figma-plugin` commands only when working on the nested plugin.

- `npm install`: install root extension dependencies.
- `npm test`: placeholder command for the root extension; currently no automated tests are configured.
- `npm run lint`: placeholder command for the root extension; currently prints that lint is not configured.

user will handle build manually for figma plugin, so no build scripts are included.

FigmaPlugin

do not remove the localhost or add 127.0.0.1 in order for the dev work
"networkAccess": {
"allowedDomains": ["http://localhost:32123/"],
"devAllowedDomains": ["http://localhost:32123/"]
},

For the VS Code extension, press `F5` in VS Code to open an Extension Development Host.

## Coding Style & Naming Conventions

Match the existing style in each subproject.

- Root extension code uses CommonJS, double quotes, semicolons, and 2-space indentation inside template HTML/CSS.
- `figma-plugin/` uses ES modules/JSX, single quotes, semicolons, and tabs for indentation.
- Use `PascalCase` for React components like `Button.jsx`, and keep helper files descriptive (`main.js`, `ui.jsx`).

## Testing Guidelines

There is no committed automated test suite yet. Validate changes manually:

- Root extension: launch with `F5`, open the Figma sidebar, and run `Figma: Open Center View`.
- Figma plugin: run `npm run dev` in `figma-plugin/`, import `dist/manifest.json` into the Figma desktop app, and verify the UI updates.

When adding tests later, place them beside the relevant app and use `*.test.*` naming.

## Commit & Pull Request Guidelines

Git history is not available in this checkout, so no established commit pattern could be verified. Use short imperative commit subjects such as `Add plugin action button`.

Pull requests should include:

- A brief summary of user-visible changes.
- Manual test steps for the VS Code extension or Figma plugin.
- Screenshots or recordings for UI changes in the sidebar, webview, or plugin UI.
- Linked issues or follow-up notes when relevant.
