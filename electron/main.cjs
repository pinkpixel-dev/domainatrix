"use strict";

const { app, BrowserWindow, shell, Menu } = require("electron");
const Database = require('better-sqlite3');
const path = require("path");
const { spawn } = require("child_process");
const http = require("http");
const fs = require("fs");

// ── Constants ─────────────────────────────────────────────────────────────────

const PORT = 3741; // Internal port; unlikely to clash with dev servers
const IS_PACKAGED = app.isPackaged;

// In packaged mode, resources live in process.resourcesPath.
// In dev, they live at the project root.
const ROOT = IS_PACKAGED ? process.resourcesPath : path.join(__dirname, "..");

// The Next.js standalone server entrypoint
const SERVER_JS = IS_PACKAGED
  ? path.join(ROOT, "app", "server.js")
  : path.join(ROOT, ".next", "standalone", "server.js");

// Migrations folder (bundled as an extra resource in packaged builds)
const MIGRATIONS_FOLDER = IS_PACKAGED
  ? path.join(ROOT, "drizzle")
  : path.join(ROOT, "drizzle");

// Data directory — writable userData in packaged builds, local ./data in dev
const DATA_DIR = IS_PACKAGED
  ? path.join(app.getPath("userData"), "data")
  : path.join(ROOT, "data");

const DB_PATH = path.join(DATA_DIR, "domainatrix.sqlite");

// ── State ─────────────────────────────────────────────────────────────────────

let mainWindow = null;
let serverProcess = null;

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Poll localhost until the Next.js server responds, then resolve.
 */
function waitForServer(port, maxMs = 30000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();

    function attempt() {
      http
        .get(`http://localhost:${port}`, (res) => {
          resolve();
        })
        .on("error", () => {
          if (Date.now() - start > maxMs) {
            reject(new Error(`Server did not start within ${maxMs}ms`));
          } else {
            setTimeout(attempt, 250);
          }
        });
    }

    attempt();
  });
}

// ── Server lifecycle ──────────────────────────────────────────────────────────

function startServer() {
  // Ensure data dir exists
  fs.mkdirSync(DATA_DIR, { recursive: true });

  const env = {
    ...process.env,
    ELECTRON_RUN_AS_NODE: "1",
    PORT: String(PORT),
    HOSTNAME: "127.0.0.1",
    DB_FILE_NAME: DB_PATH,
    MIGRATIONS_FOLDER: MIGRATIONS_FOLDER,
    NODE_ENV: "production",
  };

  // In packaged builds the standalone output uses __dirname-relative statics.
  // We tell Next where its static files are.
  if (IS_PACKAGED) {
    env.NEXT_PUBLIC_URL = `http://localhost:${PORT}`;
  }

  serverProcess = spawn(process.execPath, [SERVER_JS], {
    env,
    stdio: ["ignore", "pipe", "pipe"],
    cwd: IS_PACKAGED ? path.dirname(SERVER_JS) : ROOT,
  });

  serverProcess.stdout.on("data", (d) =>
    process.stdout.write(`[server] ${d}`)
  );
  serverProcess.stderr.on("data", (d) =>
    process.stderr.write(`[server] ${d}`)
  );

  serverProcess.on("exit", (code) => {
    if (mainWindow && !app.isQuitting) {
      console.error(`Server exited with code ${code}`);
    }
  });
}

function stopServer() {
  if (serverProcess) {
    serverProcess.kill("SIGTERM");
    serverProcess = null;
  }
}

// ── Window ────────────────────────────────────────────────────────────────────

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: "Domainatrix",
    icon: IS_PACKAGED
      ? path.join(ROOT, "icons", "linux", "256x256.png")
      : path.join(__dirname, "..", "build", "icons", "linux", "256x256.png"),
    backgroundColor: "#0f0f11",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    show: false,
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  // Open external links in the system browser, not inside Electron
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith(`http://localhost:${PORT}`)) {
      shell.openExternal(url);
      return { action: "deny" };
    }
    return { action: "allow" };
  });

  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (!url.startsWith(`http://localhost:${PORT}`)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  mainWindow.loadURL(`http://localhost:${PORT}`);
}

// ── App menu (minimal) ────────────────────────────────────────────────────────

function buildMenu() {
  const template = [
    {
      label: "Domainatrix",
      submenu: [
        { role: "about" },
        { type: "separator" },
        { role: "quit" },
      ],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectAll" },
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ── App lifecycle ─────────────────────────────────────────────────────────────

app.on("before-quit", () => {
  app.isQuitting = true;
  stopServer();
});

app.whenReady().then(async () => {
  buildMenu();
  startServer();

  try {
    await waitForServer(PORT);
    createWindow();
  } catch (err) {
    console.error("Failed to start server:", err);
    app.quit();
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
