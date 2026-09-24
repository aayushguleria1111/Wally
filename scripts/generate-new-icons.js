const fs = require('fs');
const path = require('path');
const { app, BrowserWindow } = require('electron');

const iconsDir = path.join(__dirname, '..', 'assets', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// 1. High-End Modern Wally App Icon SVG (512x512)
const mainSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Background Gradients -->
    <radialGradient id="bgGlow" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#2a2254" />
      <stop offset="60%" stop-color="#131126" />
      <stop offset="100%" stop-color="#0a0914" />
    </radialGradient>

    <!-- Vibrant Ribbon Gradients -->
    <linearGradient id="streamLeft" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#06b6d4" />
      <stop offset="100%" stop-color="#3b82f6" />
    </linearGradient>

    <linearGradient id="streamCenter" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#6366f1" />
      <stop offset="50%" stop-color="#a855f7" />
      <stop offset="100%" stop-color="#ec4899" />
    </linearGradient>

    <linearGradient id="streamRight" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ec4899" />
      <stop offset="100%" stop-color="#f43f5e" />
    </linearGradient>

    <linearGradient id="borderGlow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="rgba(255, 255, 255, 0.28)" />
      <stop offset="50%" stop-color="rgba(168, 85, 247, 0.4)" />
      <stop offset="100%" stop-color="rgba(255, 255, 255, 0.05)" />
    </linearGradient>

    <linearGradient id="screenGlass" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="rgba(255, 255, 255, 0.08)" />
      <stop offset="100%" stop-color="rgba(255, 255, 255, 0.01)" />
    </linearGradient>

    <!-- Glow Filters -->
    <filter id="neonGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="14" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>

    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="#000000" flood-opacity="0.6" />
    </filter>
  </defs>

  <!-- Squircle Base with Soft Shadow -->
  <rect x="24" y="24" width="464" height="464" rx="112" fill="url(#bgGlow)" filter="url(#softShadow)" />
  <rect x="24" y="24" width="464" height="464" rx="112" fill="none" stroke="url(#borderGlow)" stroke-width="3" />

  <!-- Ambient Light Disk Behind Monitor -->
  <circle cx="256" cy="240" r="140" fill="#6366f1" opacity="0.22" filter="url(#neonGlow)" />

  <!-- Desktop Monitor Outline (Floating Glass) -->
  <rect x="96" y="96" width="320" height="206" rx="20" fill="url(#screenGlass)" stroke="rgba(255, 255, 255, 0.16)" stroke-width="3" />
  
  <!-- Monitor Stand Base -->
  <path d="M226 304 L216 352 L296 352 L286 304 Z" fill="rgba(255, 255, 255, 0.12)" />
  <rect x="196" y="352" width="120" height="12" rx="6" fill="rgba(255, 255, 255, 0.2)" />

  <!-- Iconic Ribbon 'W' Live Waves -->
  <!-- Left Wing -->
  <path d="M128 150 L174 278 C178 288 190 294 200 290 L216 284 C226 280 232 268 228 258 L196 172 C192 162 180 156 170 160 Z" 
        fill="url(#streamLeft)" filter="url(#neonGlow)" />

  <!-- Right Wing -->
  <path d="M384 150 L338 278 C334 288 322 294 312 290 L296 284 C286 280 280 268 284 258 L316 172 C320 162 332 156 342 160 Z" 
        fill="url(#streamRight)" filter="url(#neonGlow)" />

  <!-- Central Dynamic Crest -->
  <path d="M192 284 L244 140 C248 130 264 130 268 140 L320 284 C324 294 314 304 304 300 L264 284 C258 282 254 282 248 284 L208 300 C198 304 188 294 192 284 Z" 
        fill="url(#streamCenter)" filter="url(#neonGlow)" />

  <!-- Glossy Highlights on Ribbon Peaks -->
  <path d="M246 142 L256 166 L266 142 C262 136 250 136 246 142 Z" fill="#ffffff" opacity="0.9" />

  <!-- Central Play / Live Wallpaper Pulse Core -->
  <circle cx="256" cy="226" r="34" fill="#0d0c18" stroke="rgba(255, 255, 255, 0.2)" stroke-width="2" />
  <circle cx="256" cy="226" r="28" fill="url(#streamCenter)" />
  <polygon points="248,212 272,226 248,240" fill="#ffffff" />
  
  <!-- Subtle sparkles / ambient stars -->
  <circle cx="360" cy="120" r="3" fill="#38bdf8" filter="url(#neonGlow)" />
  <circle cx="140" cy="126" r="2.5" fill="#c084fc" filter="url(#neonGlow)" />
  <circle cx="370" cy="240" r="2" fill="#f43f5e" />
</svg>`;

// 2. High-Contrast, Minimalist System Tray Icon SVG (32x32)
// Designed for extreme clarity on Windows 10 & 11 taskbars (both dark & light modes)
const traySvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <defs>
    <linearGradient id="trayGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="50%" stop-color="#818cf8" />
      <stop offset="100%" stop-color="#f43f5e" />
    </linearGradient>
  </defs>

  <!-- Sleek Modern Desktop Frame -->
  <rect x="2" y="3" width="28" height="19" rx="3.5" fill="none" stroke="#ffffff" stroke-width="2.2" />
  <path d="M11 26 L21 26" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" />
  <path d="M16 22 L16 26" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" />

  <!-- Stylized Geometric 'W' Inside Screen -->
  <path d="M6 8 L10.5 17 L16 9 L21.5 17 L26 8" fill="none" stroke="url(#trayGrad)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" />
  
  <!-- Live Wallpaper Play / Pulse Indicator -->
  <circle cx="16" cy="13" r="2.2" fill="#ffffff" />
</svg>`;

// Write the SVGs to disk
fs.writeFileSync(path.join(iconsDir, 'icon.svg'), mainSvg, 'utf8');
fs.writeFileSync(path.join(iconsDir, 'tray.svg'), traySvg, 'utf8');

console.log('Saved vector SVGs: icon.svg and tray.svg');

// Helper to assemble Windows ICO file from PNG buffers
function createIcoFromPngs(pngBuffers) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // 1 = ICO
  header.writeUInt16LE(pngBuffers.length, 4); // Number of images

  let offset = 6 + (16 * pngBuffers.length);
  const entries = [];

  for (const item of pngBuffers) {
    const s = item.size;
    const buf = item.buffer;

    const entry = Buffer.alloc(16);
    entry.writeUInt8(s >= 256 ? 0 : s, 0); // Width
    entry.writeUInt8(s >= 256 ? 0 : s, 1); // Height
    entry.writeUInt8(0, 2); // Colors
    entry.writeUInt8(0, 3); // Reserved
    entry.writeUInt16LE(1, 4); // Planes
    entry.writeUInt16LE(32, 6); // Bits per pixel
    entry.writeUInt32LE(buf.length, 8); // Size of image data
    entry.writeUInt32LE(offset, 12); // Offset of image data

    entries.push(entry);
    offset += buf.length;
  }

  return Buffer.concat([header, ...entries, ...pngBuffers.map(p => p.buffer)]);
}

// Rasterize SVGs using headless Electron BrowserWindow
app.whenReady().then(async () => {
  const win = new BrowserWindow({
    show: false,
    width: 600,
    height: 600,
    webPreferences: {
      offscreen: true,
      contextIsolation: false,
      nodeIntegration: false
    }
  });

  async function renderSvgToPngBuffer(svgString, width, height) {
    const html = `
      <!DOCTYPE html>
      <html>
      <body style="margin:0; padding:0; background:transparent; overflow:hidden;">
        <div id="container" style="width:${width}px; height:${height}px; display:flex;">
          ${svgString}
        </div>
      </body>
      </html>
    `;
    win.setContentSize(width, height);
    await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
    const image = await win.webContents.capturePage({ x: 0, y: 0, width, height });
    return image.toPNG();
  }

  console.log('Rendering 512x512 app icon...');
  const icon512Png = await renderSvgToPngBuffer(mainSvg, 512, 512);
  fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), icon512Png);

  console.log('Rendering 256x256 app icon...');
  const icon256Png = await renderSvgToPngBuffer(mainSvg, 256, 256);
  fs.writeFileSync(path.join(iconsDir, 'icon.png'), icon256Png);

  console.log('Rendering 32x32 high-contrast system tray icon...');
  const tray32Png = await renderSvgToPngBuffer(traySvg, 32, 32);
  fs.writeFileSync(path.join(iconsDir, 'tray.png'), tray32Png);

  console.log('Rendering multi-size Windows icon (.ico)...');
  const sizes = [16, 24, 32, 48, 64, 128, 256];
  const pngEntries = [];

  for (const s of sizes) {
    const buf = await renderSvgToPngBuffer(mainSvg, s, s);
    pngEntries.push({ size: s, buffer: buf });
  }

  const icoBuffer = createIcoFromPngs(pngEntries);
  fs.writeFileSync(path.join(iconsDir, 'icon.ico'), icoBuffer);

  console.log('✓ Successfully generated all high-resolution modern icons in assets/icons/!');
  win.destroy();
  app.quit();
});
