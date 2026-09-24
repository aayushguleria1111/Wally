const { app, BrowserWindow, nativeTheme } = require('electron');
const fs = require('fs');
const path = require('path');
const storageService = require('./services/storageService');
const scanService = require('./services/scanService');
const thumbnailService = require('./services/thumbnailService');
const trayService = require('./services/trayService');
const wallpaperManager = require('./wallpaper/wallpaperManager');
const { registerIpcHandlers } = require('./ipc/handlers');

// Safe file logger for crashes
function logCrash(type, error) {
  try {
    const userData = app.getPath('userData');
    const logsDir = path.join(userData, 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    const logFile = path.join(logsDir, 'crash.log');
    const timestamp = new Date().toISOString();
    const details = error && error.stack ? error.stack : JSON.stringify(error);
    const line = `[${timestamp}] [${type}] ${details}\n`;
    fs.appendFileSync(logFile, line, 'utf8');
  } catch (logErr) {
    console.error('Failed writing to crash.log:', logErr.message);
  }
}

// Global process error handlers
process.on('uncaughtException', (err) => {
  console.error('CRITICAL: Uncaught Exception in Main Process:', err);
  logCrash('uncaughtException', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('CRITICAL: Unhandled Rejection in Main Process:', reason);
  logCrash('unhandledRejection', reason);
});

// Single instance enforcement
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

let mainWindow = null;
app.isQuiting = false;

// Pre-initialize storage to apply early flags like hardware acceleration
storageService.init();
const perfSettings = storageService.get('performance') || {};
if (perfSettings.hardwareAcceleration === false) {
  app.disableHardwareAcceleration();
}

async function createMainWindow() {
  const generalSettings = storageService.get('general') || {};
  const appearanceSettings = storageService.get('appearance') || {};

  mainWindow = new BrowserWindow({
    width: 1080,
    height: 720,
    minWidth: 880,
    minHeight: 580,
    show: false,
    frame: false, // Frameless for modern custom titlebar
    titleBarStyle: 'hidden',
    backgroundColor: '#0d0d14',
    icon: path.join(__dirname, '..', 'assets', 'icons', 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false // Allows loading local video file URLs for preview
    }
  });

  // Apply theme preference to nativeTheme
  const theme = appearanceSettings.theme || 'dark';
  nativeTheme.themeSource = theme === 'system' ? 'system' : (theme === 'light' ? 'light' : 'dark');

  // Register all IPC calls
  registerIpcHandlers(mainWindow);

  // Initialize services
  thumbnailService.init();
  wallpaperManager.init();
  trayService.init(mainWindow);

  // Load the UI
  mainWindow.loadFile(path.join(__dirname, '..', 'src', 'index.html'));

  mainWindow.once('ready-to-show', () => {
    if (!generalSettings.startMinimized) {
      mainWindow.show();
    }
  });

  // Renderer crash & unresponsiveness recovery
  mainWindow.webContents.on('render-process-gone', (event, details) => {
    console.warn(`Main window renderer crashed: ${details.reason} (exitCode: ${details.exitCode})`);
    logCrash('mainWindow-render-process-gone', details);
    if (!app.isQuiting && details.reason !== 'clean-exit') {
      setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          console.log('Attempting automatic reload of main window after crash...');
          mainWindow.reload();
        }
      }, 1000);
    }
  });

  mainWindow.on('unresponsive', () => {
    console.warn('Main window became unresponsive');
    logCrash('mainWindow-unresponsive', { message: 'Window unresponsive' });
  });

  // Intercept close: hide to tray unless user explicitly selected "Exit Wally"
  mainWindow.on('close', (event) => {
    if (!app.isQuiting) {
      event.preventDefault();
      mainWindow.hide();
    }
    return false;
  });

  // Initial video discovery & auto-start
  const folders = storageService.get('folders') || [];
  if (folders.length > 0) {
    scanService.scanAllFolders(folders).then(() => {
      // Auto-start wallpaper if configured
      if (generalSettings.startWallpaperAuto) {
        const lastWallpaper = storageService.get('currentWallpaper');
        if (lastWallpaper && scanService.isVideoAvailable(lastWallpaper)) {
          wallpaperManager.setWallpaper(lastWallpaper);
        } else {
          // Play first detected video
          wallpaperManager.next();
        }
      }
    }).catch(err => {
      console.warn('Error during initial video folder scan:', err);
    });
  }
}

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  }
});

app.whenReady().then(createMainWindow);

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  } else if (mainWindow) {
    mainWindow.show();
  }
});

// Comprehensive graceful application teardown
function handleGracefulExit() {
  if (app.isQuiting) return;
  app.isQuiting = true;
  console.log('Initiating graceful exit of Wally...');
  try {
    wallpaperManager.restoreOriginalWindowsWallpaper();
  } catch (err) {
    console.warn('Error restoring original wallpaper on exit:', err.message);
  }
  try {
    wallpaperManager.destroy();
  } catch (err) {
    console.error('Error during wallpaperManager destruction:', err);
  }
  try {
    thumbnailService.destroy();
  } catch (err) {}
  try {
    trayService.destroy();
  } catch (err) {}
  try {
    storageService.save();
  } catch (err) {}
}

app.on('before-quit', handleGracefulExit);
app.on('will-quit', handleGracefulExit);
process.on('SIGINT', () => {
  handleGracefulExit();
  app.quit();
});
process.on('SIGTERM', () => {
  handleGracefulExit();
  app.quit();
});
