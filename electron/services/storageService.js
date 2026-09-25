const fs = require('fs');
const path = require('path');
const { app } = require('electron');

class StorageService {
  constructor() {
    this.configPath = null;
    this.data = null;
    this.defaultSettings = {
      folders: [],
      currentWallpaper: null,
      recentWallpapers: [],
      playback: {
        isPlaying: true,
        isMuted: true,
        volume: 0.5,
        loop: true,
        shuffle: false,
        intervalMinutes: 15,
        fitMode: 'cover',
        playOnlyWhenDesktopFocused: false // Continuous play by default; user can enable focus-pause in settings
      },
      general: {
        startWithWindows: false,
        startMinimized: false,
        startWallpaperAuto: true,
        rememberLastWallpaper: true
      },
      appearance: {
        theme: 'dark'
      },
      performance: {
        hardwareAcceleration: false,
        pauseWhenFullscreen: true,
        pauseOnBattery: true,
        reduceAnimations: false
      }
    };
  }

  init() {
    try {
      const userDataDir = app.getPath('userData');
      if (!fs.existsSync(userDataDir)) {
        fs.mkdirSync(userDataDir, { recursive: true });
      }
      this.configPath = path.join(userDataDir, 'wally-config.json');
      this.load();
    } catch (err) {
      console.error('Failed to initialize storage service:', err);
      this.data = JSON.parse(JSON.stringify(this.defaultSettings));
    }
  }

  load() {
    try {
      if (fs.existsSync(this.configPath)) {
        const raw = fs.readFileSync(this.configPath, 'utf8');
        const parsed = JSON.parse(raw);
        this.data = this.deepMerge(this.defaultSettings, parsed);
      } else {
        this.data = JSON.parse(JSON.stringify(this.defaultSettings));
        this.save();
      }
    } catch (err) {
      console.warn('Could not read existing config, using defaults:', err.message);
      this.data = JSON.parse(JSON.stringify(this.defaultSettings));
    }
  }

  save() {
    if (!this.configPath) return;
    try {
      const tempPath = `${this.configPath}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), 'utf8');
      fs.renameSync(tempPath, this.configPath);
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  }

  deepMerge(target, source) {
    const result = { ...target };
    for (const key of Object.keys(source)) {
      if (
        source[key] &&
        typeof source[key] === 'object' &&
        !Array.isArray(source[key]) &&
        target[key] &&
        typeof target[key] === 'object' &&
        !Array.isArray(target[key])
      ) {
        result[key] = this.deepMerge(target[key], source[key]);
      } else {
        result[key] = source[key];
      }
    }
    return result;
  }

  get(key) {
    if (!this.data) this.init();
    if (!key) return this.data;
    return this.data[key];
  }

  set(key, value) {
    if (!this.data) this.init();
    this.data[key] = value;
    this.save();
    return this.data;
  }

  update(patch) {
    if (!this.data) this.init();
    this.data = this.deepMerge(this.data, patch);
    this.save();
    return this.data;
  }

  addFolder(folderPath) {
    if (!this.data) this.init();
    const normalized = path.normalize(folderPath);
    if (!this.data.folders.includes(normalized)) {
      this.data.folders.push(normalized);
      this.save();
      return true;
    }
    return false;
  }

  removeFolder(folderPath) {
    if (!this.data) this.init();
    const normalized = path.normalize(folderPath);
    this.data.folders = this.data.folders.filter(f => path.normalize(f) !== normalized);
    this.save();
  }

  setCurrentWallpaper(filePath) {
    if (!this.data) this.init();
    this.data.currentWallpaper = filePath;
    if (filePath) {
      this.data.recentWallpapers = [
        filePath,
        ...this.data.recentWallpapers.filter(p => p !== filePath)
      ].slice(0, 10);
    }
    this.save();
  }

  reset() {
    this.data = JSON.parse(JSON.stringify(this.defaultSettings));
    this.save();
    return this.data;
  }
}

module.exports = new StorageService();
