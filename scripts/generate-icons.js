const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const iconsDir = path.join(__dirname, '..', 'assets', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// 1. Ultra-clean Minimalist Purple Flower SVG (5 petals, single smooth gradient, crisp center disc)
const flowerSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="petalGrad" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="#7c3aed" />
      <stop offset="55%" stop-color="#a855f7" />
      <stop offset="100%" stop-color="#c084fc" />
    </linearGradient>
  </defs>

  <g id="flower" transform="translate(256, 256)">
    <!-- 5 Clean Minimalist Petals -->
    <path d="M 0 0 C -70 -50, -60 -195, 0 -220 C 60 -195, 70 -50, 0 0 Z" fill="url(#petalGrad)" />
    <path d="M 0 0 C -70 -50, -60 -195, 0 -220 C 60 -195, 70 -50, 0 0 Z" fill="url(#petalGrad)" transform="rotate(72)" />
    <path d="M 0 0 C -70 -50, -60 -195, 0 -220 C 60 -195, 70 -50, 0 0 Z" fill="url(#petalGrad)" transform="rotate(144)" />
    <path d="M 0 0 C -70 -50, -60 -195, 0 -220 C 60 -195, 70 -50, 0 0 Z" fill="url(#petalGrad)" transform="rotate(216)" />
    <path d="M 0 0 C -70 -50, -60 -195, 0 -220 C 60 -195, 70 -50, 0 0 Z" fill="url(#petalGrad)" transform="rotate(288)" />

    <!-- Clean Crisp Center Core -->
    <circle cx="0" cy="0" r="44" fill="#ffffff" />
  </g>
</svg>`;

// 2. High-Contrast System Tray Flower SVG (32x32, ultra clean)
const trayFlowerSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <defs>
    <linearGradient id="trayPetalGrad" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="#8b5cf6" />
      <stop offset="100%" stop-color="#c084fc" />
    </linearGradient>
  </defs>

  <g id="trayFlower" transform="translate(16, 16)">
    <path d="M 0 0 C -4.4 -3.2, -3.8 -12, 0 -13.8 C 3.8 -12, 4.4 -3.2, 0 0 Z" fill="url(#trayPetalGrad)" />
    <path d="M 0 0 C -4.4 -3.2, -3.8 -12, 0 -13.8 C 3.8 -12, 4.4 -3.2, 0 0 Z" fill="url(#trayPetalGrad)" transform="rotate(72)" />
    <path d="M 0 0 C -4.4 -3.2, -3.8 -12, 0 -13.8 C 3.8 -12, 4.4 -3.2, 0 0 Z" fill="url(#trayPetalGrad)" transform="rotate(144)" />
    <path d="M 0 0 C -4.4 -3.2, -3.8 -12, 0 -13.8 C 3.8 -12, 4.4 -3.2, 0 0 Z" fill="url(#trayPetalGrad)" transform="rotate(216)" />
    <path d="M 0 0 C -4.4 -3.2, -3.8 -12, 0 -13.8 C 3.8 -12, 4.4 -3.2, 0 0 Z" fill="url(#trayPetalGrad)" transform="rotate(288)" />

    <circle cx="0" cy="0" r="3.2" fill="#ffffff" />
  </g>
</svg>`;

fs.writeFileSync(path.join(iconsDir, 'icon.svg'), flowerSvg, 'utf8');
fs.writeFileSync(path.join(iconsDir, 'tray.svg'), trayFlowerSvg, 'utf8');

// Pure Node.js Pixel Drawing for Clean Minimalist 5-Petal Flower
function blendPixel(buf, idx, r, g, b, a) {
  if (a <= 0) return;
  const srcA = a / 255;
  const dstA = buf[idx + 3] / 255;
  const outA = srcA + dstA * (1 - srcA);

  if (outA > 0) {
    buf[idx] = Math.round((b * srcA + buf[idx] * dstA * (1 - srcA)) / outA);
    buf[idx + 1] = Math.round((g * srcA + buf[idx + 1] * dstA * (1 - srcA)) / outA);
    buf[idx + 2] = Math.round((r * srcA + buf[idx + 2] * dstA * (1 - srcA)) / outA);
    buf[idx + 3] = Math.round(outA * 255);
  }
}

function distToPetal(x, y, length, width) {
  if (y < 0) return Math.hypot(x, y);
  if (y > length) return Math.hypot(x, y - length);

  const t = y / length;
  // Smooth tear-drop petal curve: bulges near 65% out, tapers smoothly at tip and base
  const halfW = width * Math.sin(Math.PI * t) * (0.4 + 0.6 * Math.sqrt(t));
  return Math.abs(x) - halfW;
}

function renderFlowerBuffer(size) {
  const buf = Buffer.alloc(size * size * 4);
  const cx = size / 2;
  const cy = size / 2;

  const length = size * 0.42;
  const width = size * 0.17;
  const centerRadius = size * 0.088;
  const numPetals = 5;
  const angleStep = 360 / numPetals;

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const idx = (py * size + px) * 4;
      const dx = px - cx;
      const dy = py - cy;
      const distCenter = Math.hypot(dx, dy);

      // Render 5 smooth minimalist petals
      for (let i = 0; i < numPetals; i++) {
        const angle = (i * angleStep) * (Math.PI / 180);
        const rx = dx * Math.cos(-angle) - dy * Math.sin(-angle);
        const ry = -(dx * Math.sin(-angle) + dy * Math.cos(-angle));

        const d = distToPetal(rx, ry, length, width);
        if (d <= 1.2) {
          const alpha = d <= 0 ? 255 : Math.round((1.2 - d) / 1.2 * 255);
          const t = Math.max(0, Math.min(1, ry / length));

          // Clean, modern purple-to-lavender gradient: #7c3aed (124, 58, 237) -> #c084fc (192, 132, 252)
          const r = Math.round(124 * (1 - t) + 192 * t);
          const g = Math.round(58 * (1 - t) + 132 * t);
          const b = Math.round(237 * (1 - t) + 252 * t);
          blendPixel(buf, idx, r, g, b, alpha);
        }
      }

      // Clean crisp white center circle
      if (distCenter <= centerRadius + 1.2) {
        if (distCenter <= centerRadius - 0.5) {
          blendPixel(buf, idx, 255, 255, 255, 255);
        } else {
          const alpha = Math.max(0, Math.min(255, Math.round((centerRadius + 1.2 - distCenter) / 1.7 * 255)));
          blendPixel(buf, idx, 255, 255, 255, alpha);
        }
      }
    }
  }

  return buf;
}

function renderTrayFlowerBuffer() {
  const size = 32;
  const buf = Buffer.alloc(size * size * 4);
  const cx = 16;
  const cy = 16;

  const length = 13.5;
  const width = 5.2;
  const centerRadius = 2.8;
  const numPetals = 5;
  const angleStep = 360 / numPetals;

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const idx = (py * size + px) * 4;
      const dx = px - cx;
      const dy = py - cy;
      const distCenter = Math.hypot(dx, dy);

      for (let i = 0; i < numPetals; i++) {
        const angle = (i * angleStep) * (Math.PI / 180);
        const rx = dx * Math.cos(-angle) - dy * Math.sin(-angle);
        const ry = -(dx * Math.sin(-angle) + dy * Math.cos(-angle));

        const d = distToPetal(rx, ry, length, width);
        if (d <= 1.0) {
          const alpha = d <= 0 ? 255 : Math.round((1.0 - d) * 255);
          const t = Math.max(0, Math.min(1, ry / length));

          // High visibility for dark/light Windows taskbars
          const r = Math.round(139 * (1 - t) + 216 * t);
          const g = Math.round(92 * (1 - t) + 160 * t);
          const b = Math.round(246 * (1 - t) + 254 * t);
          blendPixel(buf, idx, r, g, b, alpha);
        }
      }

      // Crisp center
      if (distCenter <= centerRadius + 0.8) {
        if (distCenter <= centerRadius) {
          blendPixel(buf, idx, 255, 255, 255, 255);
        } else {
          const alpha = Math.max(0, Math.min(255, Math.round((centerRadius + 0.8 - distCenter) / 0.8 * 255)));
          blendPixel(buf, idx, 255, 255, 255, alpha);
        }
      }
    }
  }

  return buf;
}

function encodePng(width, height, rgbaBuffer) {
  const rowBytes = width * 4 + 1;
  const raw = Buffer.alloc(rowBytes * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowBytes;
    raw[rowOffset] = 0;
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4;
      const dstIdx = rowOffset + 1 + x * 4;
      raw[dstIdx] = rgbaBuffer[srcIdx + 2];
      raw[dstIdx + 1] = rgbaBuffer[srcIdx + 1];
      raw[dstIdx + 2] = rgbaBuffer[srcIdx];
      raw[dstIdx + 3] = rgbaBuffer[srcIdx + 3];
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
  ihdr.writeUInt8(8, 8);
  ihdr.writeUInt8(6, 9);
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

function createBmpFromRgba(width, height, rgbaBuffer) {
  const rowSize = Math.floor((32 * width + 31) / 32) * 4;
  const pixelArraySize = rowSize * height;
  const buf = Buffer.alloc(pixelArraySize);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4;
      const dstIdx = (height - 1 - y) * rowSize + x * 4;
      buf[dstIdx] = rgbaBuffer[srcIdx];
      buf[dstIdx + 1] = rgbaBuffer[srcIdx + 1];
      buf[dstIdx + 2] = rgbaBuffer[srcIdx + 2];
      buf[dstIdx + 3] = rgbaBuffer[srcIdx + 3];
    }
  }
  return buf;
}

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

console.log('Generating clean minimalistic purple flower app icon (icon.png)...');
const icon256Rgba = renderFlowerBuffer(256);
const icon256Png = encodePng(256, 256, icon256Rgba);
fs.writeFileSync(path.join(iconsDir, 'icon.png'), icon256Png);

console.log('Generating clean minimalistic purple flower system tray icon (tray.png)...');
const tray32Rgba = renderTrayFlowerBuffer();
const tray32Png = encodePng(32, 32, tray32Rgba);
fs.writeFileSync(path.join(iconsDir, 'tray.png'), tray32Png);

console.log('Generating multi-resolution Windows icon (icon.ico)...');
const icoData = createIcoFile([16, 24, 32, 48, 64, 128, 256]);
fs.writeFileSync(path.join(iconsDir, 'icon.ico'), icoData);

console.log('✓ Successfully created ultra-clean minimalistic purple flower logos in assets/icons/');
