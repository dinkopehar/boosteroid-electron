const { app, BrowserWindow } = require("electron");

var isFullScreen = false;
var isGameStreamingScreen = false;

function toggleFullscreen(state) {
  var window = BrowserWindow.getAllWindows()[0];
  var actualState = window.isFullScreen();
  if (isFullScreen != state || actualState != state) {
    if (state || !isGameStreamingScreen) {
      window.setFullScreen(state);
      isFullScreen = state;
      console.log("Fullscreen state changed to: " + state);

      if (state) {
        window.webContents
          .executeJavaScript("window.document.body.requestPointerLock();")
          .then(() => {
            console.log("pointer is locked");
          })
          .catch((err) => {
            console.log("error locking pointer", err);
          });
      } else {
        window.webContents.executeJavaScript(
          "window.document.exitPointerLock();",
        );
      }
    } else {
      window.setFullScreen(state);
      isFullScreen = state;
      console.log("Fullscreen state changed to: " + state);

      if (state) {
        focusWindow();
      } else {
        window.webContents.executeJavaScript(
          "window.document.body.exitPointerLock();",
        );
      }
    }
  }
}

function switchFullscreenState() {
  if (isFullScreen) {
    toggleFullscreen(false);
  } else {
    toggleFullscreen(true);
  }
}

function focusWindow() {
  BrowserWindow.getAllWindows()[0].focus();
}

app.on("browser-window-created", async function (event, window) {
  window.on("leave-full-screen", async function (event, window) {
    event.preventDefault();
    if (isGameStreamingScreen) {
      toggleFullscreen(true);
    }
  });
});

module.exports = { toggleFullscreen, switchFullscreenState };
