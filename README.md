# assetport

![assetport Logo](logo.png)

Export Figma assets directly to your VS Code workspace.

assetport has two parts that work together — install both:

<p>
  <a href="https://www.figma.com/community/plugin/1650765417453504141/assetport">
    <img src="https://img.shields.io/badge/Install_Figma_Plugin-F24E1E?style=for-the-badge&logo=figma&logoColor=white" alt="Install the Figma plugin" />
  </a>
  &nbsp;
  <a href="https://marketplace.visualstudio.com/items?itemName=kimlonghok.assetport-figma">
 <img src="https://img.shields.io/badge/Install_VS_Code_Extension-007ACC?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2ZmZiI+PHBhdGggZD0iTTIzLjE1IDIuNTg3IDE4LjIxLjIxYTEuNDk0IDEuNDk0IDAgMCAwLTEuNzA1LjI5bC05LjQ2IDguNjMtNC4xMi0zLjEyOGEuOTk5Ljk5OSAwIDAgMC0xLjI3Ni4wNTdMLjMyNyA3LjI2MUExIDEgMCAwIDAgLjMyNiA4Ljc0TDMuODk5IDEyIC4zMjYgMTUuMjZhMSAxIDAgMCAwIC4wMDEgMS40NzlMMS42NSAxNy45NGEuOTk5Ljk5OSAwIDAgMCAxLjI3Ni4wNTdsNC4xMi0zLjEyOCA5LjQ2IDguNjNhMS40OTIgMS40OTIgMCAwIDAgMS43MDQuMjlsNC45NDItMi4zNzdBMS41IDEuNSAwIDAgMCAyNCAyMC4wNlYzLjkzOWExLjUgMS41IDAgMCAwLS44NS0xLjM1MnptLTUuMTQ2IDE0Ljg2MUwxMC44MjYgMTJsNy4xNzgtNS40NDh2MTAuODk2eiIvPjwvc3ZnPg==&logoColor=white" alt="Install the VS Code extension" />  </a>
</p>

Select layers in Figma, hit export, and the files land straight in your open VS Code workspace — no drag-and-drop, no downloads folder, no cloud relay.

---

## ✨ Features

|     | Feature                        | What it does                                                                            |
| :-: | :----------------------------- | :-------------------------------------------------------------------------------------- |
| 🖼️  | **Multi-format export**        | Export selected Figma layers as PNG, SVG, or JPEG straight into your VS Code workspace. |
| 📚  | **Asset queue**                | Stage multiple layers at once and export them all in a single action.                   |
| 🔍  | **Live preview**               | Preview each queued asset at 1×, 2×, 3×, or 4× before committing to export.             |
| 🤖  | **AI-powered naming**          | Auto-rename assets with Gemini based on the visual content of each layer.               |
| 📁  | **Configurable output folder** | Set a custom relative path per session (e.g. `src/assets/icons`).                       |
| 🧬  | **Combine nodes**              | Flatten a multi-layer selection into a single exported asset.                           |
| ✂️  | **Ignore children**            | Skip child layers you don't want included in an export.                                 |
| 🛡️  | **Duplicate guard**            | Adding the same Figma node to the queue twice is blocked automatically.                 |
| 🗜️  | **Lossy compression**          | Configurable quality (0–100) for PNG/JPEG. SVG is always lossless.                      |
| 🔒  | **Fully local**                | No cloud relay — the plugin talks directly to a local server in your editor.            |

---

## 🗺️ Roadmap

| Status | Feature                           | Description                                                                        |
| :----: | :-------------------------------- | :--------------------------------------------------------------------------------- |
|   🚧   | **SVG → React component**         | Export SVG layers as `.jsx` / `.tsx` with the SVG inlined as a React component.    |
|   🚧   | **SVG → Vue component**           | Same as above, wrapped in a `.vue` single-file component.                          |
|   🚧   | **Workspace collision detection** | Detect existing files at the target path and prompt to overwrite, rename, or skip. |
|   🚧   | **Select same-size assets**       | Select one asset and automatically pick all sibling children under the same parent that share the same size, instead of selecting each one by hand. |

> 🚧 Planned · 🧪 In progress · ✅ Shipped

---

## 🛠️ Development

> This section is for contributors building assetport from source.

This repository is a pnpm monorepo with two parts that work together:

| Package             | Role       | Description                                                                  |
| :------------------ | :--------- | :--------------------------------------------------------------------------- |
| `apps/vscode`       | **Server** | VS Code extension running a local HTTP server on `http://localhost:32123`.   |
| `apps/figma-plugin` | **Client** | Figma plugin that exports the current selection and sends it to that server. |

### Prerequisites

- [Node.js](https://nodejs.org) v20+
- [pnpm](https://pnpm.io) v10+

### Running locally

```bash
# 1. Install dependencies
pnpm install

# 2. Start the Figma plugin in dev mode
pnpm dev:plugin
```

3. **Start the VS Code extension** — open this folder in VS Code and press **F5** to launch an Extension Development Host. In the new window, click the **assetport** icon in the activity bar to confirm the export server is running.
4. **Load the plugin in Figma** — go to **Plugins > Development > Import plugin from manifest** and select `apps/figma-plugin/dist/manifest.json`.

### Build & package

```bash
# Build both the Figma plugin and the VS Code extension
pnpm build

# Package the VS Code extension as a .vsix (current platform)
pnpm package:vscode

# Package for all platforms
pnpm package:vscode:all
```

---
