# assetport

Export Figma assets directly to your VS Code workspace — no cloud relay, fully local.

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

## 🚀 Getting started

1. **Install this extension** from the VS Code Marketplace.
2. **Open a folder** in VS Code — exported assets are written relative to your workspace root.
3. The export server starts automatically on `http://localhost:32123` (look for **assetport** in the status bar / activity bar).
4. **Install the companion [Figma plugin](https://www.figma.com/community/plugin/1650765417453504141/assetport)** to send layers over.

---

## 🧩 Commands

| Command                          | Description                      |
| -------------------------------- | -------------------------------- |
| `assetport: Start Export Server` | Manually start the local server. |
| `assetport: Stop Export Server`  | Stop the local server.           |

---

## License

MIT
