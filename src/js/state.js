// State Management for Wally Frontend
const State = {
  activeView: 'home',
  folders: [],
  folderStatuses: [],
  wallpapers: [],
  currentWallpaper: null,
  currentVideoMetadata: null,
  isActive: false,
  isDesktopFocused: false,
  playback: {
    isPlaying: true,
    isMuted: true,
    volume: 0.5,
    loop: true,
    shuffle: false,
    intervalMinutes: 15,
    fitMode: 'cover',
    playOnlyWhenDesktopFocused: true
  },
  timer: {
    intervalMinutes: 15,
    remainingSeconds: 0,
    isRunning: false
  },
  settings: null,
  filter: {
    query: '',
    folder: 'all',
    sort: 'name'
  },
  previewVideo: null,
  listeners: new Set(),

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  },

  notify(event, data) {
    for (const listener of this.listeners) {
      try {
        listener(event, data, this);
      } catch (err) {
        console.error('State listener error:', err);
      }
    }
  },

  setPlaybackState(patch) {
    if (patch.currentWallpaper !== undefined) this.currentWallpaper = patch.currentWallpaper;
    if (patch.currentVideoMetadata !== undefined) this.currentVideoMetadata = patch.currentVideoMetadata;
    if (patch.isActive !== undefined) this.isActive = patch.isActive;
    if (patch.isDesktopFocused !== undefined) this.isDesktopFocused = patch.isDesktopFocused;
    if (patch.timer !== undefined) this.timer = { ...this.timer, ...patch.timer };
    if (patch.playback) {
      this.playback = { ...this.playback, ...patch.playback };
    }
    this.notify('playback:changed', this.playback);
  },

  setWallpapers(list) {
    this.wallpapers = Array.isArray(list) ? list : [];
    this.notify('wallpapers:updated', this.wallpapers);
  },

  setFolders(list) {
    this.folders = Array.isArray(list) ? list : [];
    this.notify('folders:updated', this.folders);
  },

  setFolderStatuses(statuses) {
    this.folderStatuses = Array.isArray(statuses) ? statuses : [];
    this.notify('folders:updated', this.folders);
  },

  setSettings(settings) {
    this.settings = settings;
    if (settings.playback) {
      this.playback = { ...this.playback, ...settings.playback };
    }
    if (settings.folders) {
      this.folders = settings.folders;
    }
    if (settings.currentWallpaper) {
      this.currentWallpaper = settings.currentWallpaper;
    }
    this.notify('settings:updated', this.settings);
  },

  setActiveView(view) {
    this.activeView = view;
    this.notify('view:changed', view);
  },

  getCurrentWallpaperObject() {
    if (!this.currentWallpaper) return null;
    return this.wallpapers.find(w => w.path === this.currentWallpaper) || {
      name: this.currentWallpaper.split(/[\\/]/).pop(),
      path: this.currentWallpaper,
      sizeFormatted: 'Unknown',
      format: (this.currentWallpaper.split('.').pop() || '').toUpperCase()
    };
  }
};
