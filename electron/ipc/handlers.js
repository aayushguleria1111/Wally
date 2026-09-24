const { ipcMain, dialog, shell, app } = require('electron');
const fs = require('fs');
const storageService = require('../services/storageService');
const scanService = require('../services/scanService');
const thumbnailService = require('../services/thumbnailService');
const wallpaperManager = require('../wallpaper/wallpaperManager');

function registerIpcHandlers(mainWindow) {
  // Folder Operations
  ipcMain.handle('folders:select', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Select Wallpaper Folder',
      properties: ['openDirectory']
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const selected = result.filePaths[0];
      storageService.addFolder(selected);
      const videos = await scanService.scanAllFolders(storageService.get('folders'));
      return { success: true, folder: selected, folders: storageService.get('folders'), videos };
    }
    return { success: false };
  });

  ipcMain.handle('folders:add', async (e, folderPath) => {
    storageService.addFolder(folderPath);
    const videos = await scanService.scanAllFolders(storageService.get('folders'));
    return { folders: storageService.get('folders'), videos };
  });

  ipcMain.handle('folders:remove', async (e, folderPath) => {
    storageService.removeFolder(folderPath);
    const videos = await scanService.scanAllFolders(storageService.get('folders'));
    return { folders: storageService.get('folders'), videos };
  });

  ipcMain.handle('folders:list', () => {
    return storageService.get('folders') || [];
  });

  ipcMain.handle('folders:get-statuses', () => {
    const folders = storageService.get('folders') || [];
    return scanService.getFolderStatuses(folders);
  });

  // Wallpaper & Library Operations
  ipcMain.handle('wallpapers:list', async () => {
    const folders = storageService.get('folders') || [];
    const cached = scanService.getCachedVideos();
    if (cached.length > 0) {
      return cached;
    }
    return await scanService.scanAllFolders(folders);
  });

  ipcMain.handle('wallpapers:rescan', async () => {
    const folders = storageService.get('folders') || [];
    return await scanService.scanAllFolders(folders);
  });

  ipcMain.handle('wallpapers:set', async (e, videoPath) => {
    if (!videoPath || !fs.existsSync(videoPath)) {
      return { success: false, error: 'FILE_NOT_FOUND', state: wallpaperManager.getState() };
    }
    const ok = await wallpaperManager.setWallpaper(videoPath);
    return { success: ok, state: wallpaperManager.getState() };
  });

  ipcMain.handle('wallpapers:reveal', (e, filePath) => {
    if (filePath && fs.existsSync(filePath)) {
      shell.showItemInFolder(filePath);
      return true;
    }
    return false;
  });

  ipcMain.handle('wallpapers:get-thumbnail', async (e, video) => {
    if (!video || !video.id) return null;
    return await thumbnailService.captureThumbnail(video);
  });

  // Playback Operations
  ipcMain.handle('playback:get-state', () => {
    return wallpaperManager.getState();
  });

  ipcMain.handle('playback:play', () => {
    wallpaperManager.play();
    return wallpaperManager.getState();
  });

  ipcMain.handle('playback:pause', () => {
    wallpaperManager.pause();
    return wallpaperManager.getState();
  });

  ipcMain.handle('playback:toggle', () => {
    wallpaperManager.togglePlay();
    return wallpaperManager.getState();
  });

  ipcMain.handle('playback:next', () => {
    wallpaperManager.next();
    return wallpaperManager.getState();
  });

  ipcMain.handle('playback:prev', () => {
    wallpaperManager.prev();
    return wallpaperManager.getState();
  });

  ipcMain.handle('playback:stop', () => {
    wallpaperManager.stop();
    return wallpaperManager.getState();
  });

  ipcMain.handle('playback:set-volume', (e, volume) => {
    wallpaperManager.setVolume(volume);
    return wallpaperManager.getState();
  });

  ipcMain.handle('playback:set-muted', (e, isMuted) => {
    wallpaperManager.setMuted(isMuted);
    return wallpaperManager.getState();
  });

  ipcMain.handle('playback:toggle-mute', () => {
    wallpaperManager.toggleMute();
    return wallpaperManager.getState();
  });

  ipcMain.handle('playback:set-loop', (e, loop) => {
    wallpaperManager.setLoop(loop);
    return wallpaperManager.getState();
  });

  ipcMain.handle('playback:set-shuffle', (e, shuffle) => {
    wallpaperManager.setShuffle(shuffle);
    return wallpaperManager.getState();
  });

  ipcMain.handle('playback:set-fit', (e, fitMode) => {
    wallpaperManager.setFitMode(fitMode);
    return wallpaperManager.getState();
  });

  ipcMain.handle('playback:set-interval', (e, minutes) => {
    wallpaperManager.setIntervalMinutes(minutes);
    return wallpaperManager.getState();
  });

  ipcMain.handle('playback:set-play-when-focused', (e, enabled) => {
    wallpaperManager.setPlayOnlyWhenDesktopFocused(enabled);
    return wallpaperManager.getState();
  });

  // Settings
  ipcMain.handle('settings:get', () => {
    return storageService.get();
  });

  ipcMain.handle('settings:save', (e, patch) => {
    const updated = storageService.update(patch);

    if (patch.general && typeof patch.general.startWithWindows === 'boolean') {
      try {
        app.setLoginItemSettings({
          openAtLogin: patch.general.startWithWindows,
          openAsHidden: patch.general.startMinimized || false
        });
      } catch (err) {
        console.warn('Failed to configure login item settings:', err.message);
      }
    }

    if (patch.playback) {
      if (patch.playback.fitMode) wallpaperManager.setFitMode(patch.playback.fitMode);
      if (typeof patch.playback.intervalMinutes === 'number') {
        wallpaperManager.setIntervalMinutes(patch.playback.intervalMinutes);
      }
      if (typeof patch.playback.playOnlyWhenDesktopFocused === 'boolean') {
        wallpaperManager.setPlayOnlyWhenDesktopFocused(patch.playback.playOnlyWhenDesktopFocused);
      }
    }

    return updated;
  });

  ipcMain.handle('settings:reset', () => {
    return storageService.reset();
  });

  // Window Controls
  ipcMain.handle('window:minimize', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.minimize();
    }
  });

  ipcMain.handle('window:maximize', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
      return mainWindow.isMaximized();
    }
    return false;
  });

  ipcMain.handle('window:close', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.hide();
    }
  });

  ipcMain.handle('window:is-maximized', () => {
    return mainWindow && !mainWindow.isDestroyed() ? mainWindow.isMaximized() : false;
  });

  ipcMain.handle('system:open-external', (e, url) => {
    if (url && (url.startsWith('https://') || url.startsWith('http://'))) {
      shell.openExternal(url);
    }
  });

  ipcMain.handle('system:get-info', () => {
    return {
      version: app.getVersion(),
      electron: process.versions.electron,
      chrome: process.versions.chrome,
      node: process.versions.node,
      os: `${process.platform} ${process.arch}`
    };
  });

  wallpaperManager.subscribeStateChange((state) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('wallpaper:state-changed', state);
    }
  });
}

module.exports = { registerIpcHandlers };
