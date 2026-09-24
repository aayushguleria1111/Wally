const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('wallpaperApi', {
  onLoadVideo: (callback) => ipcRenderer.on('wallpaper:load-video', (e, data) => callback(data)),
  onPlayPause: (callback) => ipcRenderer.on('wallpaper:play-pause', (e, isPlaying) => callback(isPlaying)),
  onVolumeChange: (callback) => ipcRenderer.on('wallpaper:volume', (e, data) => callback(data)),
  onFitModeChange: (callback) => ipcRenderer.on('wallpaper:fit-mode', (e, mode) => callback(mode)),
  notifyVideoLoaded: (metadata) => ipcRenderer.send('wallpaper:video-loaded', metadata),
  notifyVideoEnded: () => ipcRenderer.send('wallpaper:video-ended'),
  notifyVideoError: (error) => ipcRenderer.send('wallpaper:video-error', error)
});
