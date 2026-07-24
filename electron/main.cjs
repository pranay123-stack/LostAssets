const { app, BrowserWindow, dialog } = require("electron");
const { fork } = require("child_process");
const fs = require("fs");
const http = require("http");
const path = require("path");

const PORT = Number(process.env.LA_PLUS_PORT || 3210);
let apiProcess;

function desktopConfig() {
  const configPath = path.join(app.getPath("userData"), "la-plus-desktop.json");
  try { return JSON.parse(fs.readFileSync(configPath, "utf8")); } catch { return {}; }
}

function databasePath() {
  const config = desktopConfig();
  return process.env.LA_PLUS_DATABASE_PATH || process.env.DATABASE_PATH || config.databasePath || path.join(app.getPath("userData"), "data.sqlite");
}

function waitForApi(remaining = 40) {
  return new Promise((resolve, reject) => {
    const request = http.get(`http://127.0.0.1:${PORT}/api/health`, response => {
      response.resume();
      if (response.statusCode === 200) resolve();
      else reject(new Error(`API health check returned ${response.statusCode}`));
    });
    request.on("error", () => {
      if (remaining <= 0) reject(new Error("LA Plus API did not start."));
      else setTimeout(() => waitForApi(remaining - 1).then(resolve).catch(reject), 500);
    });
    request.setTimeout(1000, () => request.destroy());
  });
}

function startApi() {
  const serverPath = path.join(app.getAppPath(), "dist", "server.cjs");
  apiProcess = fork(serverPath, [], {
    cwd: app.getAppPath(),
    execPath: process.execPath,
    execArgv: [],
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: "1",
      NODE_ENV: "production",
      PORT: String(PORT),
      DATABASE_PATH: databasePath(),
    },
  });
  apiProcess.on("error", error => console.error("Could not launch LA Plus API:", error));
}

async function openWindow() {
  startApi();
  try {
    await waitForApi();
  } catch (error) {
    dialog.showErrorBox("LA Plus could not start", `${error.message}\n\nSet LA_PLUS_DATABASE_PATH or create %APPDATA%\\LA Plus\\la-plus-desktop.json with a databasePath value.`);
    app.quit();
    return;
  }
  const window = new BrowserWindow({
    width: 1600,
    height: 1000,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: "#050911",
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  await window.loadURL(process.env.LA_PLUS_DESKTOP_URL || `http://127.0.0.1:${PORT}`);
}

app.whenReady().then(openWindow);
app.on("window-all-closed", () => app.quit());
app.on("before-quit", () => { if (apiProcess && !apiProcess.killed) apiProcess.kill(); });
