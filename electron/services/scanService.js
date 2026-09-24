const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SUPPORTED_EXTENSIONS = new Set(['.mp4', '.webm', '.mkv', '.mov', '.m4v', '.avi']);

class ScanService {
  constructor() {
    this.cachedVideos = [];
  }

  formatBytes(bytes, decimals = 1) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  getVideoId(filePath) {
    return crypto.createHash('md5').update(path.normalize(filePath).toLowerCase()).digest('hex');
  }

  async scanFolder(folderPath, maxDepth = 2, currentDepth = 0) {
    const results = [];
    if (!fs.existsSync(folderPath)) {
      return results;
    }

    try {
      const entries = await fs.promises.readdir(folderPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(folderPath, entry.name);

        if (entry.isDirectory()) {
          if (currentDepth < maxDepth && !entry.name.startsWith('.')) {
            const subResults = await this.scanFolder(fullPath, maxDepth, currentDepth + 1);
            results.push(...subResults);
          }
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (SUPPORTED_EXTENSIONS.has(ext)) {
            try {
              const stats = await fs.promises.stat(fullPath);
              const nameWithoutExt = path.parse(entry.name).name;
              results.push({
                id: this.getVideoId(fullPath),
                name: nameWithoutExt,
                filename: entry.name,
                path: fullPath,
                folder: folderPath,
                ext: ext,
                format: ext.replace('.', '').toUpperCase(),
                sizeBytes: stats.size,
                sizeFormatted: this.formatBytes(stats.size),
                mtime: stats.mtimeMs,
                mtimeDate: stats.mtime.toLocaleDateString()
              });
            } catch (statErr) {
              // File could be temporarily locked or removed
              console.warn(`Could not read stats for ${fullPath}:`, statErr.message);
            }
          }
        }
      }
    } catch (err) {
      console.warn(`Could not scan directory ${folderPath}:`, err.message);
    }

    return results;
  }

  async scanAllFolders(folders) {
    const allVideos = [];
    const seenPaths = new Set();

    for (const folder of folders) {
      try {
        const videos = await this.scanFolder(folder);
        for (const video of videos) {
          const norm = path.normalize(video.path).toLowerCase();
          if (!seenPaths.has(norm)) {
            seenPaths.add(norm);
            allVideos.push(video);
          }
        }
      } catch (err) {
        console.warn(`Skipping folder ${folder}:`, err.message);
      }
    }

    // Sort by name by default
    allVideos.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
    this.cachedVideos = allVideos;
    return allVideos;
  }

  getCachedVideos() {
    // Return only videos whose files still exist on disk
    this.cachedVideos = this.cachedVideos.filter(v => this.isVideoAvailable(v.path));
    return this.cachedVideos;
  }

  removeVideoFromCache(filePath) {
    if (!filePath) return;
    const targetNorm = path.normalize(filePath).toLowerCase();
    this.cachedVideos = this.cachedVideos.filter(v => path.normalize(v.path).toLowerCase() !== targetNorm);
  }

  getFolderStatuses(folders = []) {
    return folders.map(folder => {
      let exists = false;
      try {
        exists = fs.existsSync(folder);
      } catch {
        exists = false;
      }
      return {
        path: folder,
        name: path.basename(folder) || folder,
        exists,
        count: this.cachedVideos.filter(v => v.folder === folder).length
      };
    });
  }

  isVideoAvailable(filePath) {
    if (!filePath) return false;
    try {
      return fs.existsSync(filePath);
    } catch {
      return false;
    }
  }

  validateLibrary(videos) {
    // Purges missing files
    return videos.filter(v => this.isVideoAvailable(v.path));
  }
}

module.exports = new ScanService();
