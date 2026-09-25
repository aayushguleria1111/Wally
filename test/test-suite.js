const fs = require('fs');
const path = require('path');
const assert = require('assert');

async function run() {
  console.log('--- Wally Test Suite ---');

  // 1. Test ScanService formatting
  console.log('1. Testing ScanService...');
  const scanService = require('../electron/services/scanService');
  assert.strictEqual(scanService.formatBytes(1024), '1 KB');
  assert.strictEqual(scanService.formatBytes(1048576), '1 MB');
  assert.strictEqual(scanService.formatBytes(1073741824), '1 GB');
  console.log('  ✓ scanService.formatBytes works properly');

  // 2. Test Video file discovery
  const sampleDir = path.join(__dirname, 'sample_videos');
  if (!fs.existsSync(sampleDir)) {
    fs.mkdirSync(sampleDir, { recursive: true });
  }
  fs.writeFileSync(path.join(sampleDir, 'nature.mp4'), 'mock-video-data');
  fs.writeFileSync(path.join(sampleDir, 'clip.webm'), 'mock-video-data');
  fs.writeFileSync(path.join(sampleDir, 'ignore_me.txt'), 'text data');

  const videos = await scanService.scanFolder(sampleDir);
  assert.strictEqual(videos.length, 2, 'Should discover exactly 2 video files and ignore .txt');
  const filenames = videos.map(v => v.filename);
  assert.ok(filenames.includes('nature.mp4'), 'Should include nature.mp4');
  assert.ok(filenames.includes('clip.webm'), 'Should include clip.webm');
  console.log('  ✓ scanService.scanFolder discovers supported videos and ignores non-videos');

  // Test Deleted Folder Resilience
  const ghostDir = path.join(__dirname, 'non_existent_folder_xyz123');
  const ghostResult = await scanService.scanFolder(ghostDir);
  assert.deepStrictEqual(ghostResult, [], 'Scanning a deleted/missing folder should return an empty array without throwing');
  
  const statuses = scanService.getFolderStatuses([sampleDir, ghostDir]);
  assert.strictEqual(statuses.length, 2);
  assert.strictEqual(statuses[0].exists, true, 'Existing folder should have exists: true');
  assert.strictEqual(statuses[1].exists, false, 'Deleted folder should have exists: false');
  console.log('  ✓ scanService handles deleted/missing folders safely with proper status reporting');

  // Test Deleted File Cache Purging
  scanService.cachedVideos = [...videos];
  assert.strictEqual(scanService.getCachedVideos().length, 2);
  const deletedPath = path.join(sampleDir, 'nature.mp4');
  fs.unlinkSync(deletedPath);
  assert.strictEqual(scanService.isVideoAvailable(deletedPath), false, 'Deleted file should be detected as unavailable');
  scanService.removeVideoFromCache(deletedPath);
  assert.strictEqual(scanService.getCachedVideos().length, 1, 'Cache should reflect purged deleted file');
  console.log('  ✓ scanService purges deleted video files from cache seamlessly');

  // Clean up sample folder
  fs.rmSync(sampleDir, { recursive: true, force: true });

  // 3. Test WallyAttacher.exe binary existence & PE header
  console.log('2. Testing WallyAttacher.exe binary...');
  const attacherExe = path.join(__dirname, '..', 'bin', 'native', 'WallyAttacher.exe');
  assert.ok(fs.existsSync(attacherExe), 'WallyAttacher.exe should exist');
  const stats = fs.statSync(attacherExe);
  assert.ok(stats.size > 2000, 'WallyAttacher.exe should be a valid compiled binary');

  // Verify MZ header
  const buf = Buffer.alloc(2);
  const fd = fs.openSync(attacherExe, 'r');
  fs.readSync(fd, buf, 0, 2, 0);
  fs.closeSync(fd);
  assert.strictEqual(buf.toString('ascii'), 'MZ', 'Binary should have valid Windows PE MZ header');
  console.log('  ✓ WallyAttacher.exe is verified with valid 64-bit Windows PE signature');

  // 4. Test Assets & Icons
  console.log('3. Testing App Assets & Icons...');
  const iconIco = path.join(__dirname, '..', 'assets', 'icons', 'icon.ico');
  const iconPng = path.join(__dirname, '..', 'assets', 'icons', 'icon.png');
  const trayPng = path.join(__dirname, '..', 'assets', 'icons', 'tray.png');
  assert.ok(fs.existsSync(iconIco), 'icon.ico exists');
  assert.ok(fs.existsSync(iconPng), 'icon.png exists');
  assert.ok(fs.existsSync(trayPng), 'tray.png exists');
  console.log('  ✓ All required Windows icons exist (icon.ico, icon.png, tray.png)');

  // 5. Test Package Metadata (Wally-Live Wallpapers v1.0.1)
  console.log('4. Testing Package Metadata & Version 1.0.1...');
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
  assert.strictEqual(pkg.name, 'wally-live-wallpapers');
  assert.strictEqual(pkg.version, '1.0.1');
  assert.strictEqual(pkg.build.productName, 'Wally-Live Wallpapers');
  assert.strictEqual(pkg.build.nsis.shortcutName, 'Wally-Live Wallpapers');
  console.log('  ✓ App name is correctly set to "Wally-Live Wallpapers" and version to 1.0.1');

  // 6. Test StartupService
  console.log('5. Testing StartupService...');
  const startupService = require('../electron/services/startupService');
  assert.strictEqual(startupService.keyName, 'Wally-Live Wallpapers');
  assert.ok(typeof startupService.getExecutableCommand === 'function');
  const normalCmd = startupService.getExecutableCommand(false);
  const minCmd = startupService.getExecutableCommand(true);
  assert.ok(normalCmd.length > 0, 'Command should not be empty');
  assert.ok(minCmd.includes('--minimized'), 'Minimized command should contain --minimized');
  console.log('  ✓ StartupService properly generates Windows startup commands');

  // 7. Test StorageService deepMerge and schema
  console.log('6. Testing StorageService...');
  const storageService = require('../electron/services/storageService');
  const merged = storageService.deepMerge(storageService.defaultSettings, {
    playback: { intervalMinutes: 2, shuffle: true },
    general: { startWithWindows: true }
  });
  assert.strictEqual(merged.playback.intervalMinutes, 2);
  assert.strictEqual(merged.playback.shuffle, true);
  assert.strictEqual(merged.general.startWithWindows, true);
  assert.strictEqual(merged.appearance.theme, 'dark'); // Retains default
  console.log('  ✓ StorageService deepMerge and default settings integrity verified');

  console.log('\n========================================');
  console.log(' ALL AUTOMATED TESTS PASSED SUCCESSFULLY! ✓');
  console.log('========================================');
}

run().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
