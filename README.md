# Wally — Modern Windows Live Wallpaper Application

<div align="center">
  <img src="assets/icons/icon.png" width="96" height="96" alt="Wally Logo" />
  <h3>Wally</h3>
  <p><strong>A modern, lightweight Windows live wallpaper application built from scratch.</strong></p>
</div>

---

## 🌟 Overview

**Wally** is a genuine Windows live wallpaper program that allows you to turn your favorite video clips (`.mp4`, `.webm`, `.mkv`, `.mov`) into animated desktop backgrounds.

Unlike tools that merely float an application window over your desktop, Wally uses a dedicated native Win32 attacher to parent an Electron hardware-accelerated video canvas directly into the Windows Shell hierarchy (`WorkerW` behind `SHELLDLL_DefView`). Your desktop icons remain **100% clickable**, normal windows stay on top, the Windows taskbar is never covered, and video rendering consumes minimal CPU/GPU.

---

## ✨ Features

- **🏠 Interactive Home Dashboard**:
  - Live video preview with desktop active/paused/stopped indicator badge.
  - Full playback controls: Play, Pause, Next, Previous, Stop.
  - Shuffle playlist mode and single-video loop toggle.
  - Mute/Unmute audio toggle and smooth volume percentage slider.
  - Quick access to change auto-advance intervals and display fit modes.

- **🎬 Wallpaper Library & Folder Management**:
  - Add and monitor any number of folders on your PC.
  - High-performance asynchronous folder scanning with zero memory bloat.
  - Support for `.mp4`, `.webm`, `.mkv`, `.mov`, `.m4v`.
  - Automatic thumbnail extraction and disk caching.
  - Real-time search, folder filtering, and sorting (by name, date, size).
  - In-app video preview modal with scrubber before applying.
  - "Show in File Explorer" shortcut.
  - Graceful handling of moved, locked, or deleted files.

- **🪟 Genuine Windows Live Wallpaper (Win32 WorkerW)**:
  - Reparents directly behind Windows desktop icons using the native `WallyAttacher.exe` utility.
  - Desktop icons remain fully interactive and clickable.
  - Preserves standard window z-order (browser, games, and apps sit on top).
  - Automatic adaptation to screen resolution and display metric changes.
  - Smooth dual-buffer crossfade transitions when switching wallpapers.

- **🖼️ Desktop Peek (Aero Peek) & Static Background Sync**:
  - Automatically sets the Windows system desktop background (`SystemParametersInfo`) to a high-resolution frame of the active video wallpaper.
  - When you hover the taskbar peek button or press **Win + comma**, the desktop wallpaper displays the matching picture seamlessly.

- **🎯 Focus-Aware Video Playback**:
  - Plays the live video **only when the desktop is actually in focus** (e.g. pressing Win+D, minimizing windows, or clicking the desktop).
  - Automatically pauses video playback when working inside normal applications (browsers, IDEs, office apps, games), eliminating unnecessary CPU/GPU usage and extending battery life.
  - Automatically resumes playing the live video the instant you return to the desktop.

- **⚙️ Configurable Playback & Interval System**:
  - Automatically advance wallpapers at configurable intervals: 5m, 10m, 15m, 30m, 1 hour, or custom minutes.
  - Customizable fit modes:
    - **Cover**: Zoom to fill entire screen without black bars.
    - **Contain**: Preserve aspect ratio with clean borders.
    - **Fill**: Stretch to fit desktop resolution.

- **🔔 Windows System Tray Integration**:
  - Runs quietly in the background without cluttering the taskbar.
  - Tray context menu: Show/Hide, Play/Pause, Next, Previous, Mute/Unmute, Start/Stop, Settings, Exit.
  - Closing the main window keeps the live wallpaper playing smoothly in the background.

- **🎨 Modern Windows 11 Fluent Interface**:
  - Sleek custom title bar with window controls and live status badge.
  - Dark mode (primary) and Light mode themes.
  - Responsive cards, smooth micro-animations, and clean typography.

- **⚡ Performance & Battery Optimization**:
  - Hardware-accelerated GPU decoding via Chromium.
  - Option to automatically pause playback when running on battery power.
  - Low idle memory footprint (<50MB RAM).
  - Reusable video elements with automatic resource cleanup.

- **🔒 Security & Offline**:
  - Context isolation enabled, Node integration disabled in renderers.
  - Validated IPC message handlers via `contextBridge`.
  - Zero cloud accounts, telemetry, or external server requirements.

---

## 📂 Project Structure

```
peaceful-euclid/
├── package.json                   # Scripts, dependencies, electron-builder config
├── assets/
│   └── icons/                     # Application & system tray icons (.ico, .png, .svg)
├── bin/
│   └── native/
│       └── WallyAttacher.exe      # Compiled native 64-bit Win32 WorkerW attacher
├── electron/
│   ├── main.js                    # Main Electron process & window lifecycle
│   ├── preload.js                 # Secure ContextBridge API (wallyApi)
│   ├── ipc/
│   │   └── handlers.js            # Safe IPC channel dispatchers
│   ├── services/
│   │   ├── storageService.js      # Local config persistence (wally-config.json)
│   │   ├── scanService.js         # Video scanner & metadata extractor
│   │   ├── thumbnailService.js    # Offscreen thumbnail generation & cache
│   │   └── trayService.js         # Windows system tray menu and controls
│   └── wallpaper/
│       ├── wallpaperManager.js    # Wallpaper window lifecycle & Win32 attachment
│       ├── wallpaper-preload.js   # Secure bridge for wallpaper window
│       ├── wallpaper.html         # Hardware-accelerated dual-video DOM container
│       ├── wallpaper-renderer.js  # Crossfading, audio, loop, and playback engine
│       └── native/
│           ├── Program.cs         # C# Win32 P/Invoke source code
│           └── WallyAttacher.csproj # C# project specification
├── src/
│   ├── index.html                 # Main dashboard UI structure
│   ├── css/
│   │   ├── main.css               # Windows Fluent design system & themes
│   │   └── components.css         # UI components, cards, controls, modal
│   └── js/
│       ├── state.js               # Reactive frontend state store
│       ├── ui.js                  # View renderer and DOM managers
│       └── app.js                 # Event listeners and IPC controller
├── scripts/
│   ├── build-native.js            # Automated native attacher compiler script
│   └── generate-icons.js          # Standalone asset/icon generator
├── test/
│   └── test-suite.js              # Automated test suite for services and binaries
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Windows 10** or **Windows 11** (x64)
- **Node.js** (v18, v20, v22, or v24)
- **npm** (v9, v10, or v11)

### 1. Install Dependencies

Open PowerShell in the project directory:

```powershell
npm install
```

### 2. Build the Native Windows Attacher (Optional - Precompiled in `bin/native/`)

Wally comes with `WallyAttacher.exe` already compiled. If you want to recompile it at any time:

```powershell
npm run build:native
```

*(This compiles using either standard Windows `csc.exe` or `dotnet build` automatically).*

### 3. Run in Development Mode

```powershell
npm start
```
or with verbose logging:
```powershell
npm run dev
```

---

## 📦 Building the Windows Installer (.exe)

To build a production Windows installer (`.exe`) and portable executable:

```powershell
npm run dist
```

This will run Electron Builder to generate:
- **`dist/Wally Setup 1.0.0.exe`**: Complete Windows NSIS installer with desktop and start menu shortcuts.
- **`dist/Wally 1.0.0.exe`**: Standalone portable Windows executable.

---

## 🛠️ How It Works (Win32 WorkerW Architecture)

1. Windows Explorer hosts desktop icons in `Progman` -> `SHELLDLL_DefView`.
2. When Wally sets a wallpaper, it sends undocumented message `0x052C` to `Progman` using `SendMessageTimeout`.
3. Windows Explorer creates a `WorkerW` window directly behind `SHELLDLL_DefView`.
4. `WallyAttacher.exe` locates this `WorkerW` handle and calls `SetParent(wallpaperHwnd, workerwHwnd)` with `WS_CHILD | WS_VISIBLE | WS_CLIPSIBLINGS`.
5. The Electron video player is now situated behind desktop icons.
6. When Wally is closed or the live wallpaper is stopped, `WallyAttacher.exe detach <HWND>` cleanly releases the desktop hierarchy.

---

## ❓ Troubleshooting

- **Wallpaper appears in front of icons**:
  Make sure you run Wally on Windows 10 or 11. `WallyAttacher.exe` automatically positions behind icons. If icons are hidden by Windows settings, right-click desktop -> **View** -> **Show desktop icons**.
- **Video has no sound**:
  Wally mutes live wallpapers by default to avoid disturbing you. Click the **Mute/Unmute** speaker icon on the Dashboard or System Tray to enable audio.
- **Videos with unsupported codecs**:
  Standard MP4 (H.264/AAC), WebM (VP8/VP9/AV1), and MKV are supported. For exotic codecs, re-encode using HandBrake or ffmpeg (`ffmpeg -i input.mkv -c:v libx264 -c:a aac output.mp4`).

---

## 📄 License

MIT License — free for personal and commercial use.
