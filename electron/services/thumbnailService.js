const fs = require('fs');
const path = require('path');
const { app, BrowserWindow } = require('electron');

class ThumbnailService {
  constructor() {
    this.cacheDir = null;
    this.postersDir = null;
    this.generatorWindow = null;
  }

  init() {
    try {
      const userData = app.getPath('userData');
      this.cacheDir = path.join(userData, 'thumbnails');
      this.postersDir = path.join(userData, 'posters');

      if (!fs.existsSync(this.cacheDir)) {
        fs.mkdirSync(this.cacheDir, { recursive: true });
      }
      if (!fs.existsSync(this.postersDir)) {
        fs.mkdirSync(this.postersDir, { recursive: true });
      }
    } catch (err) {
      console.error('Failed to initialize thumbnail/poster directories:', err);
    }
  }

  getThumbnailPath(videoId) {
    if (!this.cacheDir) this.init();
    return path.join(this.cacheDir, `${videoId}.jpg`);
  }

  getPosterPath(videoId) {
    if (!this.postersDir) this.init();
    return path.join(this.postersDir, `${videoId}.jpg`);
  }

  hasThumbnail(videoId) {
    const thumbPath = this.getThumbnailPath(videoId);
    return fs.existsSync(thumbPath);
  }

  hasPoster(videoId) {
    const posterPath = this.getPosterPath(videoId);
    return fs.existsSync(posterPath);
  }

  async getThumbnailUrl(videoId, videoPath) {
    if (!this.cacheDir) this.init();
    const thumbPath = this.getThumbnailPath(videoId);

    if (fs.existsSync(thumbPath)) {
      return `file://${thumbPath.replace(/\\/g, '/')}`;
    }

    return this.generateDefaultSvg(path.basename(videoPath));
  }

  generateDefaultSvg(filename) {
    const ext = path.extname(filename).toUpperCase().replace('.', '');
    const cleanName = path.parse(filename).name;
    const truncated = cleanName.length > 20 ? cleanName.substring(0, 18) + '...' : cleanName;

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1e1b4b" />
          <stop offset="50%" stop-color="#312e81" />
          <stop offset="100%" stop-color="#0f172a" />
        </linearGradient>
      </defs>
      <rect width="320" height="180" rx="8" fill="url(#grad)" />
      <circle cx="160" cy="80" r="28" fill="#6366f1" opacity="0.8" />
      <polygon points="152,68 174,80 152,92" fill="#ffffff" />
      <rect x="248" y="14" width="58" height="22" rx="4" fill="rgba(255,255,255,0.15)" />
      <text x="277" y="29" font-family="Segoe UI, sans-serif" font-size="11" font-weight="600" fill="#ffffff" text-anchor="middle">${ext || 'VIDEO'}</text>
      <text x="160" y="140" font-family="Segoe UI, sans-serif" font-size="13" font-weight="500" fill="#cbd5e1" text-anchor="middle">${truncated}</text>
    </svg>`;

    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }

  ensureGeneratorWindow() {
    if (this.generatorWindow && !this.generatorWindow.isDestroyed()) {
      return this.generatorWindow;
    }

    this.generatorWindow = new BrowserWindow({
      show: false,
      width: 800,
      height: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: false // Load local user video files
      }
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head><title>Thumbnail Worker</title></head>
      <body style="margin:0; background:#000;">
        <video id="v" muted playsinline style="display:none;"></video>
        <canvas id="cThumb" width="320" height="180" style="display:none;"></canvas>
        <canvas id="cPoster" width="1920" height="1080" style="display:none;"></canvas>
      </body>
      </html>
    `;

    this.generatorWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);
    return this.generatorWindow;
  }

  async captureThumbnailAndPoster(video) {
    if (!this.cacheDir) this.init();
    const thumbPath = this.getThumbnailPath(video.id);
    const posterPath = this.getPosterPath(video.id);

    // If both exist, return paths
    if (fs.existsSync(thumbPath) && fs.existsSync(posterPath)) {
      return {
        thumbnailUrl: `file://${thumbPath.replace(/\\/g, '/')}`,
        posterPath: posterPath
      };
    }

    return new Promise((resolve) => {
      const win = this.ensureGeneratorWindow();
      const cleanPath = video.path.replace(/\\/g, '/');
      const fileUrl = `file://${cleanPath}`;

      const script = `
        (function() {
          return new Promise((res) => {
            const video = document.getElementById('v');
            const cThumb = document.getElementById('cThumb');
            const cPoster = document.getElementById('cPoster');
            let timeout = setTimeout(() => {
              cleanup();
              res(null);
            }, 5000);

            function cleanup() {
              clearTimeout(timeout);
              video.onloadeddata = null;
              video.onseeked = null;
              video.onerror = null;
              video.src = '';
            }

            video.onerror = () => {
              cleanup();
              res(null);
            };

            video.onloadedmetadata = () => {
              const targetTime = Math.min(1.5, Math.max(0.1, video.duration * 0.1));
              video.currentTime = targetTime;
            };

            video.onseeked = () => {
              try {
                // 1. Generate 320x180 Thumbnail
                const ctxThumb = cThumb.getContext('2d');
                ctxThumb.drawImage(video, 0, 0, 320, 180);
                const thumbData = cThumb.toDataURL('image/jpeg', 0.85);

                // 2. Generate Full-Res Desktop Wallpaper Poster
                const vw = video.videoWidth || 1920;
                const vh = video.videoHeight || 1080;
                cPoster.width = vw;
                cPoster.height = vh;
                const ctxPoster = cPoster.getContext('2d');
                ctxPoster.drawImage(video, 0, 0, vw, vh);
                const posterData = cPoster.toDataURL('image/jpeg', 0.92);

                cleanup();
                res({ thumbData, posterData });
              } catch(err) {
                cleanup();
                res(null);
              }
            };

            video.src = ${JSON.stringify(fileUrl)};
            video.load();
          });
        })()
      `;

      win.webContents.executeJavaScript(script)
        .then((result) => {
          if (result && result.thumbData) {
            const thumbBase64 = result.thumbData.replace(/^data:image\/jpeg;base64,/, '');
            fs.writeFileSync(thumbPath, thumbBase64, 'base64');

            if (result.posterData) {
              const posterBase64 = result.posterData.replace(/^data:image\/jpeg;base64,/, '');
              fs.writeFileSync(posterPath, posterBase64, 'base64');
            }

            resolve({
              thumbnailUrl: `file://${thumbPath.replace(/\\/g, '/')}`,
              posterPath: posterPath
            });
          } else {
            resolve({
              thumbnailUrl: this.generateDefaultSvg(video.filename),
              posterPath: null
            });
          }
        })
        .catch(() => {
          resolve({
            thumbnailUrl: this.generateDefaultSvg(video.filename),
            posterPath: null
          });
        });
    });
  }

  async captureThumbnail(video) {
    const res = await this.captureThumbnailAndPoster(video);
    return res.thumbnailUrl;
  }

  async ensureWallpaperPoster(video) {
    if (!this.postersDir) this.init();
    const posterPath = this.getPosterPath(video.id);
    if (fs.existsSync(posterPath)) {
      return posterPath;
    }
    const res = await this.captureThumbnailAndPoster(video);
    return res.posterPath;
  }

  destroy() {
    if (this.generatorWindow && !this.generatorWindow.isDestroyed()) {
      this.generatorWindow.destroy();
      this.generatorWindow = null;
    }
  }
}

module.exports = new ThumbnailService();
