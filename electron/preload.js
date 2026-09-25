const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('wallyApi', {
  folders: {
    select: () => ipcRenderer.invoke('folders:select'),
    add: (folderPath) => ipcRenderer.invoke('folders:add', folderPath),
    remove: (folderPath) => ipcRenderer.invoke('folders:remove', folderPath),
    list: () => ipcRenderer.invoke('folders:list'),
    getStatuses: () => ipcRenderer.invoke('folders:get-statuses')
  },
  wallpapers: {
    list: () => ipcRenderer.invoke('wallpapers:list'),
    rescan: () => ipcRenderer.invoke('wallpapers:rescan'),
    set: (videoPath) => ipcRenderer.invoke('wallpapers:set', videoPath),
    reveal: (filePath) => ipcRenderer.invoke('wallpapers:reveal', filePath),
    getThumbnail: (video) => ipcRenderer.invoke('wallpapers:get-thumbnail', video)
  },
  playback: {
    getState: () => ipcRenderer.invoke('playback:get-state'),
    play: () => ipcRenderer.invoke('playback:play'),
    pause: () => ipcRenderer.invoke('playback:pause'),
    toggle: () => ipcRenderer.invoke('playback:toggle'),
    next: () => ipcRenderer.invoke('playback:next'),
    prev: () => ipcRenderer.invoke('playback:prev'),
    stop: () => ipcRenderer.invoke('playback:stop'),
    setVolume: (volume) => ipcRenderer.invoke('playback:set-volume', volume),
    setMuted: (isMuted) => ipcRenderer.invoke('playback:set-muted', isMuted),
    toggleMute: () => ipcRenderer.invoke('playback:toggle-mute'),
    setLoop: (loop) => ipcRenderer.invoke('playback:set-loop', loop),
    setShuffle: (shuffle) => ipcRenderer.invoke('playback:set-shuffle', shuffle),
    setFit: (fitMode) => ipcRenderer.invoke('playback:set-fit', fitMode),
    setInterval: (minutes) => ipcRenderer.invoke('playback:set-interval', minutes),
    changeNow: () => ipcRenderer.invoke('playback:change-now'),
    setPlayWhenFocused: (enabled) => ipcRenderer.invoke('playback:set-play-when-focused', enabled)
  },
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    save: (patch) => ipcRenderer.invoke('settings:save', patch),
    reset: () => ipcRenderer.invoke('settings:reset')
  },
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:is-maximized')
  },
  system: {
    openExternal: (url) => ipcRenderer.invoke('system:open-external', url),
    getInfo: () => ipcRenderer.invoke('system:get-info')
  },
  onStateChange: (callback) => {
    const handler = (event, state) => callback(state);
    ipcRenderer.on('wallpaper:state-changed', handler);
    return () => ipcRenderer.removeListener('wallpaper:state-changed', handler);
  },
  onNavigate: (callback) => {
    const handler = (event, viewName) => callback(viewName);
    ipcRenderer.on('navigation:go-to', handler);
    return () => ipcRenderer.removeListener('navigation:go-to', handler);
  }
});
