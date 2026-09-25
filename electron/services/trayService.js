const { app, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const wallpaperManager = require('../wallpaper/wallpaperManager');
const storageService = require('./storageService');

class TrayService {
  constructor() {
    this.tray = null;
    this.mainWindow = null;
  }

  init(mainWindow) {
    this.mainWindow = mainWindow;
    this.createTray();

    wallpaperManager.subscribeStateChange(() => {
      this.updateContextMenu();
    });
  }

  getTrayIcon() {
    const customTrayPng = path.join(__dirname, '..', '..', 'assets', 'icons', 'tray.png');
    const customIconIco = path.join(__dirname, '..', '..', 'assets', 'icons', 'icon.ico');

    if (fs.existsSync(customTrayPng)) {
      return nativeImage.createFromPath(customTrayPng);
    }
    if (fs.existsSync(customIconIco)) {
      return nativeImage.createFromPath(customIconIco);
    }
    return nativeImage.createEmpty();
  }

  createTray() {
    if (this.tray) return;

    const icon = this.getTrayIcon();
    this.tray = new Tray(icon);
    this.tray.setToolTip('Wally-Live Wallpapers');

    this.tray.on('double-click', () => {
      this.toggleMainWindow();
    });

    this.updateContextMenu();
  }

  toggleMainWindow() {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) return;

    if (this.mainWindow.isVisible()) {
      if (this.mainWindow.isMinimized()) {
        this.mainWindow.restore();
        this.mainWindow.focus();
      } else {
        this.mainWindow.hide();
      }
    } else {
      this.mainWindow.show();
      this.mainWindow.focus();
    }
  }

  showSettings() {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) return;
    this.mainWindow.show();
    this.mainWindow.focus();
    this.mainWindow.webContents.send('navigation:go-to', 'settings');
  }

  updateContextMenu() {
    if (!this.tray) return;

    const state = wallpaperManager.getState();
    const isPlaying = state.playback.isPlaying && state.isActive;
    const isMuted = state.playback.isMuted;
    const currentName = state.currentWallpaper ? path.basename(state.currentWallpaper) : 'None';

    const contextMenu = Menu.buildFromTemplate([
      {
        label: `Wally-Live Wallpapers v1.0.1`,
        enabled: false
      },
      {
        label: `Now Playing: ${currentName}`,
        enabled: false
      },
      { type: 'separator' },
      {
        label: 'Show Wally',
        click: () => {
          if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.show();
            this.mainWindow.focus();
          }
        }
      },
      { type: 'separator' },
      {
        label: isPlaying ? 'Pause Wallpaper' : 'Resume Wallpaper',
        click: () => {
          wallpaperManager.togglePlay();
        }
      },
      {
        label: 'Next Wallpaper',
        click: () => {
          wallpaperManager.next();
        }
      },
      {
        label: 'Previous Wallpaper',
        click: () => {
          wallpaperManager.prev();
        }
      },
      {
        label: isMuted ? 'Unmute Audio' : 'Mute Audio',
        click: () => {
          wallpaperManager.toggleMute();
        }
      },
      {
        label: state.isActive ? 'Stop Wallpaper' : 'Start Wallpaper',
        click: () => {
          if (state.isActive) {
            wallpaperManager.stop();
          } else {
            const current = storageService.get('currentWallpaper');
            if (current) {
              wallpaperManager.setWallpaper(current);
            } else {
              wallpaperManager.next();
            }
          }
        }
      },
      { type: 'separator' },
      {
        label: 'Settings...',
        click: () => {
          this.showSettings();
        }
      },
      { type: 'separator' },
      {
        label: 'Exit Wally',
        click: () => {
          app.isQuiting = true;
          try {
            wallpaperManager.restoreOriginalWindowsWallpaper();
          } catch (err) {
            console.warn('Error restoring wallpaper on tray exit:', err.message);
          }
          wallpaperManager.destroy();
          app.quit();
        }
      }
    ]);

    this.tray.setContextMenu(contextMenu);
  }

  destroy() {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
  }
}

module.exports = new TrayService();
