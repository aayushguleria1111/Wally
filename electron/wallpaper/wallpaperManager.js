const { app, BrowserWindow, screen, ipcMain, powerMonitor } = require('electron');
const path = require('path');
const fs = require('fs');
const { execFile, spawn } = require('child_process');
const storageService = require('../services/storageService');
const scanService = require('../services/scanService');
const thumbnailService = require('../services/thumbnailService');

class WallpaperManager {
  constructor() {
    this.wallpaperWindow = null;
    this.attacherPath = null;
    this.isAttached = false;
    this.intervalTimer = null;
    this.history = [];
    this.currentIndex = -1;
    this.currentVideoMetadata = null;
    this.isDesktopFocused = false;
    this.focusWatcherProcess = null;
    this.onStateChangeCallbacks = new Set();
    this.recentCrashTimestamps = [];
    this.consecutivePlaybackErrors = 0;
    this.consecutiveMissingFiles = 0;
    this.isRecoveringCrash = false;
  }

  init() {
    this.resolveAttacherPath();
    this.backupOriginalWindowsWallpaper();
    this.setupPowerMonitor();
    this.setupDisplayListeners();
    this.setupIpc();
    this.startFocusWatcher();
  }

  resolveAttacherPath() {
    if (process.resourcesPath) {
      const packagedPath = path.join(process.resourcesPath, 'native', 'WallyAttacher.exe');
      if (fs.existsSync(packagedPath)) {
        this.attacherPath = packagedPath;
        return;
      }
    }

    if (app && typeof app.getAppPath === 'function') {
      const devPath = path.join(app.getAppPath(), 'bin', 'native', 'WallyAttacher.exe');
      if (fs.existsSync(devPath)) {
        this.attacherPath = devPath;
        return;
      }
    }

    const localPath = path.join(__dirname, '..', '..', 'bin', 'native', 'WallyAttacher.exe');
    if (fs.existsSync(localPath)) {
      this.attacherPath = localPath;
      return;
    }

    console.warn('WallyAttacher.exe not found at standard locations.');
  }

  setupPowerMonitor() {
    if (!powerMonitor) return;
    try {
      powerMonitor.on('on-battery', () => {
        const perf = storageService.get('performance') || {};
        if (perf.pauseOnBattery && this.wallpaperWindow) {
          console.log('Power on battery: Pausing live wallpaper');
          this.sendVideoPlayPause(false);
        }
      });

      powerMonitor.on('on-ac', () => {
        const perf = storageService.get('performance') || {};
        const playback = storageService.get('playback') || {};
        if (perf.pauseOnBattery && playback.isPlaying && this.wallpaperWindow) {
          if (!playback.playOnlyWhenDesktopFocused || this.isDesktopFocused) {
            console.log('Power on AC: Resuming live wallpaper');
            this.sendVideoPlayPause(true);
          }
        }
      });

      powerMonitor.on('suspend', () => {
        console.log('System suspending: Pausing wallpaper playback');
        this.sendVideoPlayPause(false);
      });

      powerMonitor.on('resume', () => {
        console.log('System resumed: Restoring wallpaper desktop parenting');
        setTimeout(() => {
          if (!app.isQuiting && this.wallpaperWindow && !this.wallpaperWindow.isDestroyed()) {
            const primary = screen.getPrimaryDisplay();
            this.attachToDesktop(primary.bounds);
            const playback = storageService.get('playback') || {};
            if (playback.isPlaying && (!playback.playOnlyWhenDesktopFocused || this.isDesktopFocused)) {
              this.sendVideoPlayPause(true);
            }
          }
        }, 1200);
      });

      powerMonitor.on('lock-screen', () => {
        console.log('Workstation locked: Pausing wallpaper');
        this.sendVideoPlayPause(false);
      });

      powerMonitor.on('unlock-screen', () => {
        console.log('Workstation unlocked: Resuming wallpaper');
        const playback = storageService.get('playback') || {};
        if (playback.isPlaying && (!playback.playOnlyWhenDesktopFocused || this.isDesktopFocused)) {
          this.sendVideoPlayPause(true);
        }
      });
    } catch (err) {
      console.warn('PowerMonitor setup warning:', err.message);
    }
  }

  setupDisplayListeners() {
    screen.on('display-metrics-changed', () => {
      this.handleDisplayMetricsChanged();
    });
  }

  handleDisplayMetricsChanged() {
    if (!this.wallpaperWindow || this.wallpaperWindow.isDestroyed()) return;
    try {
      const primary = screen.getPrimaryDisplay();
      const bounds = primary.bounds;
      this.wallpaperWindow.setBounds(bounds);
      this.attachToDesktop(bounds);
    } catch (err) {
      console.error('Error handling display metrics changed:', err);
    }
  }

  getHwndString(win) {
    if (!win || win.isDestroyed()) return '0';
    try {
      const handleBuffer = win.getNativeWindowHandle();
      return handleBuffer.length >= 8
        ? handleBuffer.readBigInt64LE().toString()
        : handleBuffer.readInt32LE().toString();
    } catch {
      return '0';
    }
  }

  startFocusWatcher() {
    if (process.platform !== 'win32') return;
    if (!this.attacherPath || !fs.existsSync(this.attacherPath)) {
      this.resolveAttacherPath();
      if (!this.attacherPath || !fs.existsSync(this.attacherPath)) return;
    }

    try {
      if (this.focusWatcherProcess) {
        this.focusWatcherProcess.kill();
        this.focusWatcherProcess = null;
      }

      const wallyPid = process.pid;
      const wallpaperHwnd = this.getHwndString(this.wallpaperWindow);

      this.focusWatcherProcess = spawn(
        this.attacherPath,
        ['loopfocus', String(wallyPid), String(wallpaperHwnd), '200'],
        {
          windowsHide: true,
          stdio: ['ignore', 'pipe', 'ignore']
        }
      );

      let buffer = '';

      this.focusWatcherProcess.stdout.on('data', (chunk) => {
        buffer += chunk.toString();
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop();

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed === 'DESKTOP_FOCUSED') {
            this.onDesktopFocusChanged(true);
          } else if (trimmed === 'DESKTOP_UNFOCUSED') {
            this.onDesktopFocusChanged(false);
          }
        }
      });

      this.focusWatcherProcess.on('error', (err) => {
        console.warn('Focus watcher process error:', err.message);
      });

      this.focusWatcherProcess.on('exit', () => {
        this.focusWatcherProcess = null;
        if (!app.isQuiting) {
          setTimeout(() => this.startFocusWatcher(), 1500);
        }
      });
    } catch (err) {
      console.warn('Failed to start focus watcher:', err.message);
    }
  }

  onDesktopFocusChanged(isFocused) {
    this.isDesktopFocused = isFocused;
    const playback = storageService.get('playback') || {};

    if (playback.playOnlyWhenDesktopFocused) {
      if (isFocused) {
        // User entered desktop in focus -> Play video!
        if (playback.isPlaying) {
          this.sendVideoPlayPause(true);
        }
      } else {
        // User left desktop or switched to another app -> Pause video!
        this.sendVideoPlayPause(false);
      }
    }
    this.broadcastState();
  }

  sendVideoPlayPause(shouldPlay) {
    if (this.wallpaperWindow && !this.wallpaperWindow.isDestroyed()) {
      this.wallpaperWindow.webContents.send('wallpaper:play-pause', shouldPlay);
    }
  }

  setupIpc() {
    ipcMain.on('wallpaper:video-ended', () => {
      const playback = storageService.get('playback') || {};
      if (!playback.loop) {
        this.next();
      }
    });

    ipcMain.on('wallpaper:video-loaded', (e, meta) => {
      this.currentVideoMetadata = meta;
      this.consecutivePlaybackErrors = 0;
      this.broadcastState();
    });

    ipcMain.on('wallpaper:video-error', (e, error) => {
      console.warn('Live wallpaper playback error, trying next:', error);
      this.consecutivePlaybackErrors++;
      const library = scanService.getCachedVideos();
      if (this.consecutivePlaybackErrors >= Math.max(3, library.length)) {
        console.warn('Consecutive video playback errors limit reached. Pausing wallpaper.');
        this.pause();
        this.consecutivePlaybackErrors = 0;
        return;
      }
      setTimeout(() => this.next(), 1000);
    });
  }

  subscribeStateChange(cb) {
    this.onStateChangeCallbacks.add(cb);
  }

  unsubscribeStateChange(cb) {
    this.onStateChangeCallbacks.delete(cb);
  }

  broadcastState() {
    const state = this.getState();
    for (const cb of this.onStateChangeCallbacks) {
      try {
        cb(state);
      } catch (err) {
        console.error('State callback error:', err);
      }
    }
  }

  getState() {
    const config = storageService.get();
    return {
      currentWallpaper: config.currentWallpaper,
      currentVideoMetadata: this.currentVideoMetadata,
      isActive: Boolean(this.wallpaperWindow && !this.wallpaperWindow.isDestroyed()),
      isDesktopFocused: this.isDesktopFocused,
      playback: config.playback,
      appearance: config.appearance,
      performance: config.performance
    };
  }

  createWindow() {
    if (this.wallpaperWindow && !this.wallpaperWindow.isDestroyed()) {
      return this.wallpaperWindow;
    }

    const primaryDisplay = screen.getPrimaryDisplay();
    const { x, y, width, height } = primaryDisplay.bounds;

    this.wallpaperWindow = new BrowserWindow({
      x,
      y,
      width,
      height,
      frame: false,
      transparent: false,
      show: false,
      resizable: false,
      movable: false,
      minimizable: false,
      maximizable: false,
      closable: true,
      focusable: false,
      skipTaskbar: true,
      type: 'desktop',
      backgroundColor: '#000000',
      webPreferences: {
        preload: path.join(__dirname, 'wallpaper-preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        webSecurity: false
      }
    });

    this.wallpaperWindow.loadFile(path.join(__dirname, 'wallpaper.html'));

    this.wallpaperWindow.once('ready-to-show', () => {
      this.wallpaperWindow.show();
      this.attachToDesktop(primaryDisplay.bounds);
      this.startFocusWatcher();
    });

    this.wallpaperWindow.webContents.on('render-process-gone', (event, details) => {
      console.warn(`Wallpaper render process gone: ${details.reason} (exitCode: ${details.exitCode})`);
      this.handleWallpaperCrash(details);
    });

    this.wallpaperWindow.on('unresponsive', () => {
      console.warn('Wallpaper window became unresponsive, reloading...');
      if (!this.wallpaperWindow.isDestroyed()) {
        this.wallpaperWindow.reload();
      }
    });

    this.wallpaperWindow.on('closed', () => {
      this.wallpaperWindow = null;
      this.isAttached = false;
      this.startFocusWatcher();
      this.broadcastState();
    });

    return this.wallpaperWindow;
  }

  handleWallpaperCrash(details) {
    if (app.isQuiting || this.isRecoveringCrash) return;
    this.isRecoveringCrash = true;

    const now = Date.now();
    this.recentCrashTimestamps = this.recentCrashTimestamps.filter(t => now - t < 60000);
    this.recentCrashTimestamps.push(now);

    if (this.recentCrashTimestamps.length > 3) {
      console.error('Too many wallpaper crashes within 60s. Halting automatic recovery.');
      this.pause();
      this.isRecoveringCrash = false;
      return;
    }

    console.log('Auto-recovering wallpaper window after crash in 1500ms...');
    setTimeout(() => {
      this.isRecoveringCrash = false;
      if (app.isQuiting) return;
      const current = storageService.get('currentWallpaper');
      if (current && fs.existsSync(current)) {
        this.setWallpaper(current);
      } else {
        this.next();
      }
    }, 1500);
  }

  attachToDesktop(bounds) {
    if (process.platform !== 'win32' || !this.wallpaperWindow || this.wallpaperWindow.isDestroyed()) {
      return;
    }

    if (!this.attacherPath || !fs.existsSync(this.attacherPath)) {
      this.resolveAttacherPath();
      if (!this.attacherPath || !fs.existsSync(this.attacherPath)) {
        console.warn('Cannot attach wallpaper: WallyAttacher.exe not found.');
        return;
      }
    }

    try {
      const handleBuffer = this.wallpaperWindow.getNativeWindowHandle();
      const rawHwnd = handleBuffer.length >= 8 
        ? handleBuffer.readBigInt64LE().toString()
        : handleBuffer.readInt32LE().toString();

      const { x, y, width, height } = bounds;

      execFile(this.attacherPath, ['attach', rawHwnd, String(x), String(y), String(width), String(height)], (err, stdout, stderr) => {
        if (err) {
          console.error('WallyAttacher attach error:', err.message, stderr);
        } else {
          this.isAttached = true;
          console.log('Wallpaper attached to desktop successfully:', stdout.trim());
        }
      });
    } catch (err) {
      console.error('Failed to invoke WallyAttacher:', err);
    }
  }

  detachFromDesktop() {
    if (process.platform !== 'win32' || !this.wallpaperWindow || this.wallpaperWindow.isDestroyed()) {
      return;
    }

    if (!this.attacherPath || !fs.existsSync(this.attacherPath)) return;

    try {
      const handleBuffer = this.wallpaperWindow.getNativeWindowHandle();
      const rawHwnd = handleBuffer.length >= 8 
        ? handleBuffer.readBigInt64LE().toString()
        : handleBuffer.readInt32LE().toString();

      execFile(this.attacherPath, ['detach', rawHwnd], (err, stdout) => {
        if (!err) {
          this.isAttached = false;
          console.log('Detached from desktop:', stdout.trim());
        }
      });
    } catch (err) {
      console.error('Failed to detach wallpaper:', err);
    }
  }

  backupOriginalWindowsWallpaper() {
    if (process.platform !== 'win32') return null;

    const stored = storageService.get('originalWindowsWallpaper');
    if (stored && fs.existsSync(stored) && !stored.toLowerCase().includes('wally')) {
      return stored;
    }

    if (!this.attacherPath || !fs.existsSync(this.attacherPath)) {
      this.resolveAttacherPath();
    }

    if (this.attacherPath && fs.existsSync(this.attacherPath)) {
      try {
        const { execFileSync } = require('child_process');
        const out = execFileSync(this.attacherPath, ['getwallpaper'], { encoding: 'utf8' }).trim();
        if (out && fs.existsSync(out) && !out.toLowerCase().includes('wally')) {
          console.log('Backed up original Windows desktop wallpaper:', out);
          storageService.set('originalWindowsWallpaper', out);
          return out;
        }
      } catch (err) {
        console.warn('Could not query current Windows wallpaper:', err.message);
      }
    }
    return null;
  }

  restoreOriginalWindowsWallpaper() {
    if (process.platform !== 'win32') return false;

    let original = storageService.get('originalWindowsWallpaper');
    if (!original || !fs.existsSync(original) || original.toLowerCase().includes('wally')) {
      original = this.backupOriginalWindowsWallpaper();
    }

    if (!this.attacherPath || !fs.existsSync(this.attacherPath)) {
      this.resolveAttacherPath();
    }

    if (original && fs.existsSync(original) && this.attacherPath && fs.existsSync(this.attacherPath)) {
      try {
        console.log('Restoring default Windows desktop wallpaper:', original);
        const { execFileSync } = require('child_process');
        execFileSync(this.attacherPath, ['setwallpaper', original], { encoding: 'utf8', timeout: 5000 });
        console.log('Successfully restored original Windows desktop wallpaper on exit/stop.');
        return true;
      } catch (err) {
        console.warn('Failed restoring original Windows wallpaper:', err.message);
      }
    }
    return false;
  }

  applySystemDesktopWallpaper(posterPath) {
    if (process.platform !== 'win32' || !posterPath || !fs.existsSync(posterPath)) return;
    if (!this.attacherPath || !fs.existsSync(this.attacherPath)) return;

    execFile(this.attacherPath, ['setwallpaper', posterPath], (err, stdout) => {
      if (err) {
        console.warn('Failed to set Windows desktop wallpaper:', err.message);
      } else {
        console.log('Windows system desktop wallpaper updated to video poster image:', stdout.trim());
      }
    });
  }

  async setWallpaper(videoPath) {
    if (!videoPath || !fs.existsSync(videoPath)) {
      console.warn('Video file not found or was deleted:', videoPath);
      this.consecutiveMissingFiles++;

      if (videoPath) {
        scanService.removeVideoFromCache(videoPath);
      }

      const library = scanService.getCachedVideos();
      if (library.length === 0 || this.consecutiveMissingFiles > 5) {
        console.warn('No valid video files remaining in library.');
        this.stop();
        this.consecutiveMissingFiles = 0;
        this.broadcastState();
        return false;
      }

      // Automatically advance to the next valid video without crashing
      setTimeout(() => this.next(), 300);
      return false;
    }

    this.consecutiveMissingFiles = 0;
    storageService.setCurrentWallpaper(videoPath);
    const playback = storageService.get('playback') || {};

    // 1. Asynchronously extract/set Windows desktop wallpaper to video thumbnail picture
    const videoObj = scanService.getCachedVideos().find(v => v.path === videoPath) || {
      id: scanService.getVideoId(videoPath),
      name: path.parse(videoPath).name,
      filename: path.basename(videoPath),
      path: videoPath
    };

    thumbnailService.ensureWallpaperPoster(videoObj).then(posterPath => {
      if (posterPath && fs.existsSync(posterPath)) {
        this.applySystemDesktopWallpaper(posterPath);
      }
    }).catch(err => {
      console.warn('Poster generation for system wallpaper error:', err.message);
    });

    if (!this.wallpaperWindow || this.wallpaperWindow.isDestroyed()) {
      this.createWindow();
    }

    // Determine initial play state: if playOnlyWhenDesktopFocused is true, play only if desktop is focused
    const shouldStartPlaying = playback.isPlaying && (!playback.playOnlyWhenDesktopFocused || this.isDesktopFocused);

    const payload = {
      videoPath,
      loop: playback.loop,
      fit: playback.fitMode,
      volume: playback.volume,
      isMuted: playback.isMuted,
      startPlaying: shouldStartPlaying
    };

    if (this.wallpaperWindow.webContents.isLoading()) {
      this.wallpaperWindow.webContents.once('did-finish-load', () => {
        this.wallpaperWindow.webContents.send('wallpaper:load-video', payload);
      });
    } else {
      this.wallpaperWindow.webContents.send('wallpaper:load-video', payload);
    }

    this.startIntervalTimer();
    this.broadcastState();
    return true;
  }

  play() {
    const playback = storageService.get('playback');
    playback.isPlaying = true;
    storageService.set('playback', playback);

    if (this.wallpaperWindow && !this.wallpaperWindow.isDestroyed()) {
      // If playOnlyWhenDesktopFocused is enabled, only send play if desktop is focused
      if (!playback.playOnlyWhenDesktopFocused || this.isDesktopFocused) {
        this.sendVideoPlayPause(true);
      }
    } else {
      const curr = storageService.get('currentWallpaper');
      if (curr) this.setWallpaper(curr);
    }
    this.broadcastState();
  }

  pause() {
    const playback = storageService.get('playback');
    playback.isPlaying = false;
    storageService.set('playback', playback);

    if (this.wallpaperWindow && !this.wallpaperWindow.isDestroyed()) {
      this.sendVideoPlayPause(false);
    }
    this.broadcastState();
  }

  togglePlay() {
    const playback = storageService.get('playback');
    if (playback.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  setVolume(volume) {
    const playback = storageService.get('playback');
    playback.volume = Math.max(0, Math.min(1, volume));
    storageService.set('playback', playback);

    if (this.wallpaperWindow && !this.wallpaperWindow.isDestroyed()) {
      this.wallpaperWindow.webContents.send('wallpaper:volume', {
        volume: playback.volume,
        isMuted: playback.isMuted
      });
    }
    this.broadcastState();
  }

  setMuted(isMuted) {
    const playback = storageService.get('playback');
    playback.isMuted = Boolean(isMuted);
    storageService.set('playback', playback);

    if (this.wallpaperWindow && !this.wallpaperWindow.isDestroyed()) {
      this.wallpaperWindow.webContents.send('wallpaper:volume', {
        volume: playback.volume,
        isMuted: playback.isMuted
      });
    }
    this.broadcastState();
  }

  toggleMute() {
    const playback = storageService.get('playback');
    this.setMuted(!playback.isMuted);
  }

  setLoop(loop) {
    const playback = storageService.get('playback');
    playback.loop = Boolean(loop);
    storageService.set('playback', playback);
    this.broadcastState();
  }

  setShuffle(shuffle) {
    const playback = storageService.get('playback');
    playback.shuffle = Boolean(shuffle);
    storageService.set('playback', playback);
    this.broadcastState();
  }

  setFitMode(fitMode) {
    const playback = storageService.get('playback');
    playback.fitMode = fitMode;
    storageService.set('playback', playback);

    if (this.wallpaperWindow && !this.wallpaperWindow.isDestroyed()) {
      this.wallpaperWindow.webContents.send('wallpaper:fit-mode', fitMode);
    }
    this.broadcastState();
  }

  setPlayOnlyWhenDesktopFocused(enabled) {
    const playback = storageService.get('playback');
    playback.playOnlyWhenDesktopFocused = Boolean(enabled);
    storageService.set('playback', playback);

    if (playback.playOnlyWhenDesktopFocused) {
      this.sendVideoPlayPause(this.isDesktopFocused && playback.isPlaying);
    } else if (playback.isPlaying) {
      this.sendVideoPlayPause(true);
    }
    this.broadcastState();
  }

  next() {
    const library = scanService.getCachedVideos();
    if (!library || library.length === 0) return;

    const playback = storageService.get('playback');
    let nextVideo = null;

    if (playback.shuffle) {
      const remaining = library.filter(v => v.path !== storageService.get('currentWallpaper'));
      if (remaining.length > 0) {
        const randIndex = Math.floor(Math.random() * remaining.length);
        nextVideo = remaining[randIndex];
      } else {
        nextVideo = library[0];
      }
    } else {
      const currentPath = storageService.get('currentWallpaper');
      const idx = library.findIndex(v => v.path === currentPath);
      const nextIdx = (idx + 1) % library.length;
      nextVideo = library[nextIdx];
    }

    if (nextVideo) {
      this.setWallpaper(nextVideo.path);
    }
  }

  prev() {
    const library = scanService.getCachedVideos();
    if (!library || library.length === 0) return;

    const currentPath = storageService.get('currentWallpaper');
    const idx = library.findIndex(v => v.path === currentPath);
    const prevIdx = (idx - 1 + library.length) % library.length;
    const prevVideo = library[prevIdx];

    if (prevVideo) {
      this.setWallpaper(prevVideo.path);
    }
  }

  stop(isExiting = false) {
    this.stopIntervalTimer();
    if (this.wallpaperWindow && !this.wallpaperWindow.isDestroyed()) {
      this.detachFromDesktop();
      try {
        this.wallpaperWindow.destroy();
      } catch {}
      this.wallpaperWindow = null;
    }
    this.restoreOriginalWindowsWallpaper();
    if (!isExiting) {
      const playback = storageService.get('playback');
      playback.isPlaying = false;
      storageService.set('playback', playback);
      this.broadcastState();
    }
  }

  setIntervalMinutes(minutes) {
    const playback = storageService.get('playback');
    playback.intervalMinutes = Math.max(0, minutes);
    storageService.set('playback', playback);
    this.startIntervalTimer();
    this.broadcastState();
  }

  startIntervalTimer() {
    this.stopIntervalTimer();
    const playback = storageService.get('playback');
    const mins = playback.intervalMinutes;

    if (mins > 0) {
      const ms = mins * 60 * 1000;
      this.intervalTimer = setInterval(() => {
        if (playback.isPlaying) {
          this.next();
        }
      }, ms);
    }
  }

  stopIntervalTimer() {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
  }

  destroy() {
    this.stopIntervalTimer();
    if (this.focusWatcherProcess) {
      try {
        this.focusWatcherProcess.kill();
      } catch {}
      this.focusWatcherProcess = null;
    }
    this.stop(true);
  }
}

module.exports = new WallpaperManager();
