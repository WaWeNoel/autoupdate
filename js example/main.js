const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const { exec } = require('child_process');

let mainWindow;

function createWindow() {
  // Létrehozzuk az Electron ablakot
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: path.join(__dirname, 'icon.png'), // Új ikon beállítása
    webPreferences: {
      nodeIntegration: true
    }
  });

  // Távolítsuk el az alapértelmezett menüt
  Menu.setApplicationMenu(null);

  // Betöltjük az üdvözlő HTML-t
  mainWindow.loadFile('index.html');

  // Események figyelése, például az ablak bezárása
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App események figyelése
app.on('ready', () => {
  // Indítsuk az updater.js-t
  const updaterPath = path.join(__dirname, 'updater.js');
  exec(`node ${updaterPath}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Hiba az updater.js elindítása során: ${error}`);
      return;
    }
    console.log(`Az updater.js kimenete: ${stdout}`);
  });

  // Hozzuk létre az ablakot
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
