const http = require("http");
const path = require("path");
const vscode = require("vscode");

const SERVER_HOST = "localhost";
const SERVER_PORT = 32123;
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function activate(context) {
  const exportServer = new FigmaExportServer();
  const sidebarProvider = new FigmaSidebarProvider(exportServer);

  context.subscriptions.push(exportServer);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      FigmaSidebarProvider.viewType,
      sidebarProvider,
    ),
  );
}

class FigmaSidebarProvider {
  static viewType = "figmaSidebarView";

  constructor(exportServer) {
    this.exportServer = exportServer;
    this.webviewView = undefined;
  }

  resolveWebviewView(webviewView) {
    this.webviewView = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
    };

    webviewView.webview.onDidReceiveMessage((message) => {
      if (message.type === "refreshStatus") {
        this.postStatus();
        return;
      }

      if (message.type === "startServer") {
        this.exportServer.start().catch((error) => {
          vscode.window.showErrorMessage(`Figma export server failed to start: ${error.message}`);
          this.postStatus();
        });
      }
    });

    webviewView.webview.html = getSidebarHtml();
    this.postStatus();

    this.exportServer.onStatusChange(() => {
      this.postStatus();
    });
  }

  postStatus() {
    if (!this.webviewView) {
      return;
    }

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    const workspacePath = workspaceFolder?.uri.fsPath ?? "Open a folder in VS Code";

    this.webviewView.webview.postMessage({
      type: "serverStatus",
      host: SERVER_HOST,
      port: SERVER_PORT,
      workspacePath,
      running: this.exportServer.isRunning(),
      endpoint: `http://${SERVER_HOST}:${SERVER_PORT}`,
    });
  }
}

class FigmaExportServer {
  constructor() {
    this.server = undefined;
    this.statusListeners = new Set();
  }

  onStatusChange(listener) {
    this.statusListeners.add(listener);
  }

  emitStatusChange() {
    for (const listener of this.statusListeners) {
      listener();
    }
  }

  isRunning() {
    return Boolean(this.server?.listening);
  }

  async start() {
    if (this.server) {
      return;
    }

    this.server = http.createServer(async (request, response) => {
      try {
        await this.handleRequest(request, response);
      } catch (error) {
        response.writeHead(500, {
          ...CORS_HEADERS,
          "Content-Type": "application/json",
        });
        response.end(JSON.stringify({ error: error.message }));
      }
    });

    this.server.on("error", (error) => {
      vscode.window.showErrorMessage(`Figma export server error: ${error.message}`);
      this.emitStatusChange();
    });

    await new Promise((resolve, reject) => {
      this.server.listen(SERVER_PORT, SERVER_HOST, () => {
        this.emitStatusChange();
        resolve();
      });
      this.server.once("error", reject);
    });
  }

  async handleRequest(request, response) {
    if (request.method === "OPTIONS") {
      response.writeHead(204, CORS_HEADERS);
      response.end();
      return;
    }

    if (request.method === "GET" && request.url === "/health") {
      response.writeHead(200, {
        ...CORS_HEADERS,
        "Content-Type": "application/json",
      });
      response.end(JSON.stringify({ ok: true, host: SERVER_HOST, port: SERVER_PORT }));
      return;
    }

    if (request.method === "GET" && request.url === "/settings") {
      const geminiApiKey = vscode.workspace.getConfiguration("figma").get("geminiApiKey", "");
      response.writeHead(200, {
        ...CORS_HEADERS,
        "Content-Type": "application/json",
      });
      response.end(JSON.stringify({ geminiApiKey }));
      return;
    }

    if (request.method !== "POST" || request.url !== "/export") {
      response.writeHead(404, {
        ...CORS_HEADERS,
        "Content-Type": "application/json",
      });
      response.end(JSON.stringify({ error: "Not found" }));
      return;
    }

    const body = await readJsonBody(request);
    const result = await saveExportedAsset(body);
    response.writeHead(200, {
      ...CORS_HEADERS,
      "Content-Type": "application/json",
    });
    response.end(JSON.stringify(result));
  }

  dispose() {
    if (this.server) {
      this.server.close();
      this.server = undefined;
      this.emitStatusChange();
    }
  }
}

function getSidebarHtml() {
  return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <style>
        body {
          font-family: var(--vscode-font-family);
          padding: 16px;
          color: var(--vscode-foreground);
        }

        .card {
          border: 1px solid var(--vscode-panel-border);
          border-radius: 10px;
          padding: 14px;
          background: var(--vscode-sideBar-background);
        }

        h2 {
          margin-top: 0;
        }

        p {
          line-height: 1.45;
        }

        code {
          display: block;
          margin: 10px 0;
          padding: 10px 12px;
          border-radius: 8px;
          background: var(--vscode-textCodeBlock-background);
          word-break: break-all;
        }

        .meta {
          margin: 12px 0;
          font-size: 12px;
          color: var(--vscode-descriptionForeground);
        }

        .hint {
          margin-top: 12px;
          font-size: 12px;
          color: var(--vscode-descriptionForeground);
        }

        button {
          width: 100%;
          margin-top: 14px;
          border: none;
          border-radius: 999px;
          padding: 10px 14px;
          background: var(--vscode-button-background);
          color: var(--vscode-button-foreground);
          font: inherit;
          cursor: pointer;
        }

        button:hover {
          background: var(--vscode-button-hoverBackground);
        }

        button[disabled] {
          opacity: 0.65;
          cursor: default;
        }
      </style>
    </head>
    <body>
      <div class="card">
        <h2>Figma</h2>
        <p>Start the local export server here, then connect from the Figma plugin.</p>
        <code id="endpoint">Server not started yet</code>
        <div class="meta">
          <div><strong>Workspace:</strong> <span id="workspacePath">Checking...</span></div>
          <div><strong>Status:</strong> <span id="status">Stopped</span></div>
        </div>
        <button id="startButton" type="button">Start Server</button>
        <div class="hint">Once the server is running, use the Figma plugin's Connect button before exporting.</div>
      </div>

      <script>
        const vscode = acquireVsCodeApi();
        const startButton = document.getElementById("startButton");

        window.addEventListener("message", (event) => {
          const message = event.data;

          if (message.type !== "serverStatus") {
            return;
          }

          document.getElementById("endpoint").textContent = message.running
            ? "POST " + message.endpoint + "/export"
            : "Server not started yet";
          document.getElementById("workspacePath").textContent = message.workspacePath;
          document.getElementById("status").textContent = message.running ? "Running" : "Stopped";
          startButton.disabled = message.running;
          startButton.textContent = message.running ? "Server Running" : "Start Server";
        });

        startButton.addEventListener("click", () => {
          vscode.postMessage({ type: "startServer" });
        });

        vscode.postMessage({ type: "refreshStatus" });
      </script>
    </body>
  </html>`;
}

function deactivate() {}

async function readJsonBody(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

async function saveExportedAsset(payload) {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];

  if (!workspaceFolder) {
    throw new Error("Open a folder in VS Code before exporting from Figma.");
  }

  const fileName = sanitizeFileName(payload.fileName || "figma-asset");
  const extension = sanitizeExtension(payload.extension || "png");
  const relativeDir = typeof payload.relativeDir === "string" ? payload.relativeDir.trim() : "figma-exports";
  const base64Data = payload.base64Data;

  if (!base64Data) {
    throw new Error("Missing asset data.");
  }

  const workspaceRoot = workspaceFolder.uri.fsPath;
  const targetDirectory = resolveInsideWorkspace(workspaceRoot, relativeDir);
  const targetFile = resolveInsideWorkspace(targetDirectory, `${fileName}.${extension}`);

  await vscode.workspace.fs.createDirectory(vscode.Uri.file(targetDirectory));
  await vscode.workspace.fs.writeFile(vscode.Uri.file(targetFile), Buffer.from(base64Data, "base64"));

  const relativePath = path.relative(workspaceRoot, targetFile);
  const fileSize = Buffer.byteLength(base64Data, "base64");

  vscode.window.setStatusBarMessage(`Figma export saved to ${relativePath}`, 4000);

  return {
    ok: true,
    relativePath,
    bytes: fileSize,
  };
}

function sanitizeFileName(value) {
  return String(value)
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "figma-asset";
}

function sanitizeExtension(value) {
  return String(value).trim().replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "png";
}

function resolveInsideWorkspace(rootPath, requestedPath) {
  const resolvedPath = path.resolve(rootPath, requestedPath);
  const relativePath = path.relative(rootPath, resolvedPath);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    throw new Error("Export path must stay inside the open workspace folder.");
  }

  return resolvedPath;
}

module.exports = {
  activate,
  deactivate,
};
