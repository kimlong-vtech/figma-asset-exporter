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

      if (message.type === "stopServer") {
        this.exportServer.stop();
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
      workspacePath,
      running: this.exportServer.isRunning(),
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

  async stop() {
    if (!this.server) {
      return;
    }

    await new Promise((resolve) => {
      this.server.close(() => {
        this.server = undefined;
        this.emitStatusChange();
        resolve();
      });
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

        .info {
          margin: 12px 0;
          font-size: 13px;
          color: var(--vscode-foreground);
        }

        .info strong {
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

        .stop-btn {
          background: #d32f2f;
          color: #ffffff;
        }

        .stop-btn:hover {
          background: #b71c1c;
        }
      </style>
    </head>
    <body>
      <div class="info">
        <div><strong>Workspace:</strong> <span id="workspacePath">Checking...</span></div>
        <div><strong>Status:</strong> <span id="status">Stopped</span></div>
      </div>
      <div>
        <button id="startButton" type="button">Start</button>
        <button id="stopButton" type="button" class="stop-btn" style="display: none;">Stop</button>
      </div>

      <script>
        const vscode = acquireVsCodeApi();
        const startButton = document.getElementById("startButton");
        const stopButton = document.getElementById("stopButton");

        window.addEventListener("message", (event) => {
          const message = event.data;

          if (message.type !== "serverStatus") {
            return;
          }

          document.getElementById("workspacePath").textContent = message.workspacePath;
          document.getElementById("status").textContent = message.running ? "Running" : "Stopped";
          startButton.style.display = message.running ? "none" : "block";
          stopButton.style.display = message.running ? "block" : "none";
        });

        startButton.addEventListener("click", () => {
          vscode.postMessage({ type: "startServer" });
        });

        stopButton.addEventListener("click", () => {
          vscode.postMessage({ type: "stopServer" });
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
