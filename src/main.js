// Modules to control application life and create native browser window
const { app, BrowserWindow } = require("electron");
const electronLocalshortcut = require("electron-localshortcut");
const path = require("node:path");
const fs = require("fs");
const { switchFullscreenState } = require("./windowManager.js");

const homePage = "https://cloud.boosteroid.com/dashboard";
const userAgent =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

app.commandLine.appendSwitch(
  "enable-features",
  "VaapiVideoDecoder,WaylandWindowDecorations,RawDraw",
);

app.commandLine.appendSwitch(
  "disable-features",
  "UseChromeOSDirectVideoDecoder",
);
app.commandLine.appendSwitch("enable-accelerated-mjpeg-decode");
app.commandLine.appendSwitch("enable-accelerated-video");
app.commandLine.appendSwitch("ignore-gpu-blocklist");
app.commandLine.appendSwitch("enable-native-gpu-memory-buffers");
app.commandLine.appendSwitch("enable-gpu-rasterization");
app.commandLine.appendSwitch("enable-zero-copy");
app.commandLine.appendSwitch("enable-gpu-memory-buffer-video-frames");

const configPath = path.join(app.getPath("userData"), "config.json");
const config = fs.existsSync(configPath)
  ? JSON.parse(fs.readFileSync(configPath, "utf-8"))
  : { crashCount: 0 };

switch (config.crashCount) {
  case 0:
    app.commandLine.appendSwitch("use-gl", "angle");
    break;
  case 1:
    app.commandLine.appendSwitch("use-gl", "egl");
    break;
  default:
    app.disableHardwareAcceleration();
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    fullscreenable: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: false,
      userAgent: userAgent,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(() => {
    return { action: "deny" };
  });

  mainWindow.loadURL(homePage);
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  electronLocalshortcut.register("Super+F", async () => {
    switchFullscreenState();
  });

  electronLocalshortcut.register("F11", async () => {
    switchFullscreenState();
  });

  electronLocalshortcut.register("Alt+F4", async () => {
    app.quit();
  });

  electronLocalshortcut.register("F4", async () => {
    app.quit();
  });

  electronLocalshortcut.register("Control+Shift+I", () => {
    BrowserWindow.getFocusedWindow().webContents.toggleDevTools();
  });
});

app.on("browser-window-created", async function (e, window) {
  window.setBackgroundColor("#1A1D1F");
  window.setMenu(null);

  window.webContents.setUserAgent(userAgent);
});

app.on("child-process-gone", async (event, details) => {
  if (details.type === "GPU" && details.reason === "crashed") {
    config.crashCount++;
    fs.writeFileSync(configPath, JSON.stringify(config));

    console.log(
      "Initiating application restart with an alternative 'use-gl' switch implementation or with hardware acceleration disabled, aiming to improve stability or performance based on prior execution outcomes.",
    );

    app.relaunch();
    app.exit(0);
  }
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});
