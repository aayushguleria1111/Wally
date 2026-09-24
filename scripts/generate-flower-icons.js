const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const iconsDir = path.join(__dirname, '..', 'assets', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// 1. Minimalistic Vector Purple Flower SVG (Transparent background, freeform organic silhouette)
const flowerSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Outer Petal Gradients -->
    <linearGradient id="outerPetal" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="#4a044e" stop-opacity="0.85" />
      <stop offset="30%" stop-color="#7e22ce" stop-opacity="0.9" />
      <stop offset="70%" stop-color="#a855f7" />
      <stop offset="100%" stop-color="#f0abfc" />
    </linearGradient>

    <!-- Inner Petal Gradients (Brighter lavender/violet) -->
    <linearGradient id="innerPetal" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="#6b21a8" stop-opacity="0.9" />
      <stop offset="40%" stop-color="#9333ea" />
      <stop offset="80%" stop-color="#c084fc" />
      <stop offset="100%" stop-color="#fae8ff" />
    </linearGradient>

    <!-- Center Glowing Pistil Core -->
    <radialGradient id="centerCore" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="35%" stop-color="#f5d0fe" />
      <stop offset="70%" stop-color="#c084fc" />
      <stop offset="100%" stop-color="#7e22ce" />
    </radialGradient>

    <!-- Center Ambient Glow -->
    <radialGradient id="ambientGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#e879f9" stop-opacity="0.4" />
      <stop offset="60%" stop-color="#a855f7" stop-opacity="0.15" />
      <stop offset="100%" stop-color="#6b21a8" stop-opacity="0" />
    </radialGradient>

    <!-- Soft Drop Shadow for Organic Depth -->
    <filter id="organicShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="#2e1065" flood-opacity="0.45" />
    </filter>

    <filter id="bloomGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Ambient Glow Behind Flower -->
  <circle cx="256" cy="256" r="210" fill="url(#ambientGlow)" />

  <g filter="url(#organicShadow)">
    <!-- 1. Outer 6 Petals -->
    <!-- Base Petal Shape: starts at (256, 256), sweeps up to (256, 46) -->
    <g id="outerPetals">
      <!-- 0 deg -->
      <path d="M 256 256 C 196 210, 175 110, 256 46 C 337 110, 316 210, 256 256 Z" fill="url(#outerPetal)" opacity="0.94" />
      <!-- 60 deg -->
      <path d="M 256 256 C 196 210, 175 110, 256 46 C 337 110, 316 210, 256 256 Z" fill="url(#outerPetal)" opacity="0.94" transform="rotate(60 256 256)" />
      <!-- 120 deg -->
      <path d="M 256 256 C 196 210, 175 110, 256 46 C 337 110, 316 210, 256 256 Z" fill="url(#outerPetal)" opacity="0.94" transform="rotate(120 256 256)" />
      <!-- 180 deg -->
      <path d="M 256 256 C 196 210, 175 110, 256 46 C 337 110, 316 210, 256 256 Z" fill="url(#outerPetal)" opacity="0.94" transform="rotate(180 256 256)" />
      <!-- 240 deg -->
      <path d="M 256 256 C 196 210, 175 110, 256 46 C 337 110, 316 210, 256 256 Z" fill="url(#outerPetal)" opacity="0.94" transform="rotate(240 256 256)" />
      <!-- 300 deg -->
      <path d="M 256 256 C 196 210, 175 110, 256 46 C 337 110, 316 210, 256 256 Z" fill="url(#outerPetal)" opacity="0.94" transform="rotate(300 256 256)" />
    </g>

    <!-- 2. Inner 6 Translucent Blooming Petals (Offset by 30 deg, slightly smaller) -->
    <g id="innerPetals" transform="rotate(30 256 256)">
      <!-- 0 deg -->
      <path d="M 256 256 C 208 215, 192 135, 256 82 C 320 135, 304 215, 256 256 Z" fill="url(#innerPetal)" opacity="0.88" />
      <!-- 60 deg -->
      <path d="M 256 256 C 208 215, 192 135, 256 82 C 320 135, 304 215, 256 256 Z" fill="url(#innerPetal)" opacity="0.88" transform="rotate(60 256 256)" />
      <!-- 120 deg -->
      <path d="M 256 256 C 208 215, 192 135, 256 82 C 320 135, 304 215, 256 256 Z" fill="url(#innerPetal)" opacity="0.88" transform="rotate(120 256 256)" />
      <!-- 180 deg -->
      <path d="M 256 256 C 208 215, 192 135, 256 82 C 320 135, 304 215, 256 256 Z" fill="url(#innerPetal)" opacity="0.88" transform="rotate(180 256 256)" />
      <!-- 240 deg -->
      <path d="M 256 256 C 208 215, 192 135, 256 82 C 320 135, 304 215, 256 256 Z" fill="url(#innerPetal)" opacity="0.88" transform="rotate(240 256 256)" />
      <!-- 300 deg -->
      <path d="M 256 256 C 208 215, 192 135, 256 82 C 320 135, 304 215, 256 256 Z" fill="url(#innerPetal)" opacity="0.88" transform="rotate(300 256 256)" />
    </g>

    <!-- 3. Central Luminous Core / Stamen -->
    <circle cx="256" cy="256" r="42" fill="#581c87" opacity="0.6" />
    <circle cx="256" cy="256" r="32" fill="url(#centerCore)" filter="url(#bloomGlow)" />
    <circle cx="256" cy="256" r="16" fill="#ffffff" />
    
    <!-- Delicate central stamen pollen dots -->
    <circle cx="256" cy="228" r="4" fill="#fdf4ff" />
    <circle cx="280" cy="242" r="4" fill="#fdf4ff" />
    <circle cx="280" cy="270" r="4" fill="#fdf4ff" />
    <circle cx="256" cy="284" r="4" fill="#fdf4ff" />
    <circle cx="232" cy="270" r="4" fill="#fdf4ff" />
    <circle cx="232" cy="242" r="4" fill="#fdf4ff" />
  </g>
</svg>`;

// 2. High-Contrast System Tray Flower SVG (32x32, completely transparent background)
const trayFlowerSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <defs>
    <linearGradient id="trayPetalGrad" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="#7e22ce" />
      <stop offset="60%" stop-color="#c084fc" />
      <stop offset="100%" stop-color="#fdf4ff" />
    </linearGradient>
  </defs>

  <g id="trayFlower" transform="translate(16, 16)">
    <!-- 6 Petals -->
    <path d="M 0 0 C -4.5 -3.5, -4 -11, 0 -14.5 C 4 -11, 4.5 -3.5, 0 0 Z" fill="url(#trayPetalGrad)" />
    <path d="M 0 0 C -4.5 -3.5, -4 -11, 0 -14.5 C 4 -11, 4.5 -3.5, 0 0 Z" fill="url(#trayPetalGrad)" transform="rotate(60)" />
    <path d="M 0 0 C -4.5 -3.5, -4 -11, 0 -14.5 C 4 -11, 4.5 -3.5, 0 0 Z" fill="url(#trayPetalGrad)" transform="rotate(120)" />
    <path d="M 0 0 C -4.5 -3.5, -4 -11, 0 -14.5 C 4 -11, 4.5 -3.5, 0 0 Z" fill="url(#trayPetalGrad)" transform="rotate(180)" />
    <path d="M 0 0 C -4.5 -3.5, -4 -11, 0 -14.5 C 4 -11, 4.5 -3.5, 0 0 Z" fill="url(#trayPetalGrad)" transform="rotate(240)" />
    <path d="M 0 0 C -4.5 -3.5, -4 -11, 0 -14.5 C 4 -11, 4.5 -3.5, 0 0 Z" fill="url(#trayPetalGrad)" transform="rotate(300)" />

    <!-- Luminous Central Core -->
    <circle cx="0" cy="0" r="3.2" fill="#ffffff" />
    <circle cx="0" cy="0" r="1.8" fill="#fdf4ff" />
  </g>
</svg>`;

fs.writeFileSync(path.join(iconsDir, 'icon.svg'), flowerSvg, 'utf8');
fs.writeFileSync(path.join(iconsDir, 'tray.svg'), trayFlowerSvg, 'utf8');

// Pure Node.js Pixel Drawing for Organic Freeform Flower (Zero Square Boxes, 100% Transparent BG)
function blendPixel(buf, idx, r, g, b, a) {
  if (a <= 0) return;
  const srcA = a / 255;
  const dstA = buf[idx + 3] / 255;
  const outA = srcA + dstA * (1 - srcA);

  if (outA > 0) {
    buf[idx] = Math.round((b * srcA + buf[idx] * dstA * (1 - srcA)) / outA);         // Blue
    buf[idx + 1] = Math.round((g * srcA + buf[idx + 1] * dstA * (1 - srcA)) / outA); // Green
    buf[idx + 2] = Math.round((r * srcA + buf[idx + 2] * dstA * (1 - srcA)) / outA); // Red
    buf[idx + 3] = Math.round(outA * 255);
  }
}

// Distance from point to teardrop petal shape
// Petal extends along positive Y up to L, with maximum half-width W
function distToPetal(x, y, length, width) {
  if (y < 0) return Math.hypot(x, y);
  if (y > length) return Math.hypot(x, y - length);

  const t = y / length; // 0 at base, 1 at tip
  // Petal profile function: bulges smoothly in the middle
  const halfW = width * Math.sin(Math.PI * t) * (0.35 + 0.65 * Math.sqrt(t));
  const dx = Math.abs(x) - halfW;
  return dx;
}

// Render Freeform Purple Flower (No square frame, crisp alpha transparency)
function renderFlowerBuffer(size) {
  const buf = Buffer.alloc(size * size * 4); // All zeros = transparent
  const scale = size / 256;
  const cx = size / 2;
  const cy = size / 2;

  const outerLength = 108 * scale;
  const outerWidth = 44 * scale;

  const innerLength = 84 * scale;
  const innerWidth = 34 * scale;

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const idx = (py * size + px) * 4;
      const dx = px - cx;
      const dy = py - cy;
      const distCenter = Math.hypot(dx, dy);

      // 1. Draw 6 Outer Petals at 0, 60, 120, 180, 240, 300 degrees
      for (let i = 0; i < 6; i++) {
        const angle = (i * 60) * (Math.PI / 180);
        // Rotate coordinate so petal points along +Y
        const rx = dx * Math.cos(-angle) - dy * Math.sin(-angle);
        const ry = -(dx * Math.sin(-angle) + dy * Math.cos(-angle)); // -Y in screen coords is upward

        const d = distToPetal(rx, ry, outerLength, outerWidth);
        if (d <= 1.5) {
          const alpha = d <= 0 ? 245 : Math.round((1.5 - d) / 1.5 * 245);
          const t = Math.max(0, Math.min(1, ry / outerLength));

          // Gradient: deep purple (#6b21a8) at base to radiant lavender/pink (#f0abfc) at tip
          const r = Math.round(107 * (1 - t) + 240 * t);
          const g = Math.round(33 * (1 - t) + 171 * t);
          const b = Math.round(168 * (1 - t) + 252 * t);
          blendPixel(buf, idx, r, g, b, alpha);
        }
      }

      // 2. Draw 6 Inner Petals offset by 30 degrees (30, 90, 150, 210, 270, 330)
      for (let i = 0; i < 6; i++) {
        const angle = (i * 60 + 30) * (Math.PI / 180);
        const rx = dx * Math.cos(-angle) - dy * Math.sin(-angle);
        const ry = -(dx * Math.sin(-angle) + dy * Math.cos(-angle));

        const d = distToPetal(rx, ry, innerLength, innerWidth);
        if (d <= 1.5) {
          const alpha = d <= 0 ? 230 : Math.round((1.5 - d) / 1.5 * 230);
          const t = Math.max(0, Math.min(1, ry / innerLength));

          // Gradient: electric violet (#9333ea) to luminous light violet (#fae8ff)
          const r = Math.round(147 * (1 - t) + 250 * t);
          const g = Math.round(51 * (1 - t) + 232 * t);
          const b = Math.round(234 * (1 - t) + 255 * t);
          blendPixel(buf, idx, r, g, b, alpha);
        }
      }

      // 3. Central Glowing Pistil & Core
      const coreR = 18 * scale;
      if (distCenter <= coreR + 2) {
        const tCore = distCenter / coreR;
        if (distCenter <= coreR) {
          // Glow from pure white at center to rich purple
          const r = Math.round(255 * (1 - tCore) + 168 * tCore);
          const g = Math.round(255 * (1 - tCore) + 85 * tCore);
          const b = Math.round(255 * (1 - tCore) + 247 * tCore);
          blendPixel(buf, idx, r, g, b, 255);
        } else {
          const alpha = Math.round((coreR + 2 - distCenter) / 2 * 255);
          blendPixel(buf, idx, 245, 208, 254, alpha);
        }
      }

      // Bright white central jewel dot
      const jewelR = 6 * scale;
      if (distCenter <= jewelR) {
        blendPixel(buf, idx, 255, 255, 255, 255);
      }
    }
  }

  return buf;
}

// Render Freeform Minimalist System Tray Purple Flower (32x32)
function renderTrayFlowerBuffer() {
  const size = 32;
  const buf = Buffer.alloc(size * size * 4); // Transparent background
  const cx = 16;
  const cy = 16;

  const length = 12.5;
  const width = 5.2;

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const idx = (py * size + px) * 4;
      const dx = px - cx;
      const dy = py - cy;
      const distCenter = Math.hypot(dx, dy);

      // 6 Petals at 0, 60, 120, 180, 240, 300 degrees
      for (let i = 0; i < 6; i++) {
        const angle = (i * 60) * (Math.PI / 180);
        const rx = dx * Math.cos(-angle) - dy * Math.sin(-angle);
        const ry = -(dx * Math.sin(-angle) + dy * Math.cos(-angle));

        const d = distToPetal(rx, ry, length, width);
        if (d <= 1.2) {
          const alpha = d <= 0 ? 255 : Math.round((1.2 - d) / 1.2 * 255);
          const t = Math.max(0, Math.min(1, ry / length));

          // Radiant high-contrast violet to light lavender (#c084fc to #fdf4ff)
          const r = Math.round(192 * (1 - t) + 253 * t);
          const g = Math.round(132 * (1 - t) + 244 * t);
          const b = Math.round(252 * (1 - t) + 255 * t);
          blendPixel(buf, idx, r, g, b, alpha);
        }
      }

      // Luminous center dot
      if (distCenter <= 3.2) {
        blendPixel(buf, idx, 255, 255, 255, 255);
      } else if (distCenter <= 4.2) {
        const alpha = Math.round((4.2 - distCenter) * 255);
        blendPixel(buf, idx, 253, 244, 255, alpha);
      }
    }
  }

  return buf;
}

// Convert Raw RGBA Buffer to PNG Format
function encodePng(width, height, rgbaBuffer) {
  const rowBytes = width * 4 + 1;
  const raw = Buffer.alloc(rowBytes * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowBytes;
    raw[rowOffset] = 0; // Filter byte: None
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4;
      const dstIdx = rowOffset + 1 + x * 4;
      raw[dstIdx] = rgbaBuffer[srcIdx + 2];     // Red
      raw[dstIdx + 1] = rgbaBuffer[srcIdx + 1]; // Green
      raw[dstIdx + 2] = rgbaBuffer[srcIdx];     // Blue
      raw[dstIdx + 3] = rgbaBuffer[srcIdx + 3]; // Alpha
    }
  }

  const compressed = zlib.deflateSync(raw);
  const pngSig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const body = Buffer.concat([typeBuf, data]);
    const crc = crc32(body);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc >>> 0, 0);
    return Buffer.concat([len, body, crcBuf]);
  }

  function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c ^= buf[i];
      for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      }
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // 8-bit depth
  ihdr.writeUInt8(6, 9); // RGBA
  ihdr.writeUInt8(0, 10);
  ihdr.writeUInt8(0, 11);
  ihdr.writeUInt8(0, 12);

  return Buffer.concat([
    pngSig,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

// Convert RGBA to Windows BMP format for ICO
function createBmpFromRgba(width, height, rgbaBuffer) {
  const rowSize = Math.floor((32 * width + 31) / 32) * 4;
  const pixelArraySize = rowSize * height;
  const buf = Buffer.alloc(pixelArraySize);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4;
      const dstIdx = (height - 1 - y) * rowSize + x * 4;
      buf[dstIdx] = rgbaBuffer[srcIdx];         // Blue
      buf[dstIdx + 1] = rgbaBuffer[srcIdx + 1]; // Green
      buf[dstIdx + 2] = rgbaBuffer[srcIdx + 2]; // Red
      buf[dstIdx + 3] = rgbaBuffer[srcIdx + 3]; // Alpha
    }
  }
  return buf;
}

// Assemble multi-resolution Windows ICO
function createIcoFile(sizes) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(sizes.length, 4);

  let offset = 6 + (16 * sizes.length);
  const entries = [];
  const images = [];

  for (const s of sizes) {
    const rgba = renderFlowerBuffer(s);
    const bmpData = createBmpFromRgba(s, s, rgba);

    const bih = Buffer.alloc(40);
    bih.writeUInt32LE(40, 0);
    bih.writeInt32LE(s, 4);
    bih.writeInt32LE(s * 2, 8);
    bih.writeUInt16LE(1, 12);
    bih.writeUInt16LE(32, 14);
    bih.writeUInt32LE(0, 16);
    bih.writeUInt32LE(bmpData.length, 20);

    const imgBuf = Buffer.concat([bih, bmpData]);
    images.push(imgBuf);

    const entry = Buffer.alloc(16);
    entry.writeUInt8(s >= 256 ? 0 : s, 0);
    entry.writeUInt8(s >= 256 ? 0 : s, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(imgBuf.length, 8);
    entry.writeUInt32LE(offset, 12);

    entries.push(entry);
    offset += imgBuf.length;
  }

  return Buffer.concat([header, ...entries, ...images]);
}

// 1. Generate icon.png (256x256) - Freeform Organic Purple Flower
console.log('Generating freeform minimalistic purple flower app icon (icon.png)...');
const icon256Rgba = renderFlowerBuffer(256);
const icon256Png = encodePng(256, 256, icon256Rgba);
fs.writeFileSync(path.join(iconsDir, 'icon.png'), icon256Png);

// 2. Generate tray.png (32x32) - Freeform Minimalistic Purple Flower
console.log('Generating minimalistic purple flower system tray icon (tray.png)...');
const tray32Rgba = renderTrayFlowerBuffer();
const tray32Png = encodePng(32, 32, tray32Rgba);
fs.writeFileSync(path.join(iconsDir, 'tray.png'), tray32Png);

// 3. Generate icon.ico (16, 24, 32, 48, 64, 128, 256)
console.log('Generating multi-resolution Windows icon (icon.ico)...');
const icoData = createIcoFile([16, 24, 32, 48, 64, 128, 256]);
fs.writeFileSync(path.join(iconsDir, 'icon.ico'), icoData);

console.log('✓ Successfully created minimalistic purple flower logos:');
console.log('  - assets/icons/icon.png (Freeform purple flower, transparent BG)');
console.log('  - assets/icons/tray.png (Crisp purple flower for system tray)');
console.log('  - assets/icons/icon.ico (Windows desktop & taskbar flower icon)');
console.log('  - assets/icons/icon.svg (Scalable vector flower)');
console.log('  - assets/icons/tray.svg (Scalable vector tray flower)');
