// UI Rendering and DOM Manipulation for Wally
const UI = {
  elements: {},

  init() {
    this.cacheElements();
    this.setupModal();
  },

  cacheElements() {
    this.elements = {
      // Views
      views: document.querySelectorAll('.view'),
      navItems: document.querySelectorAll('.nav-item'),
      navWallpaperCount: document.getElementById('navWallpaperCount'),

      // Titlebar
      btnMinimize: document.getElementById('btnMinimize'),
      btnMaximize: document.getElementById('btnMaximize'),
      btnClose: document.getElementById('btnClose'),
      titlebarStatusBadge: document.getElementById('titlebarStatusBadge'),

      // Home Hero
      heroVideo: document.getElementById('heroVideo'),
      heroPlaceholder: document.getElementById('heroPlaceholder'),
      heroTitle: document.getElementById('heroTitle'),
      heroSubtitle: document.getElementById('heroSubtitle'),
      heroStatusBadge: document.getElementById('heroStatusBadge'),
      heroStatusText: document.getElementById('heroStatusText'),
      btnRevealFile: document.getElementById('btnRevealFile'),
      btnSelectFromLibrary: document.getElementById('btnSelectFromLibrary'),

      // Home Controls
      btnShuffle: document.getElementById('btnShuffle'),
      btnPrev: document.getElementById('btnPrev'),
      btnPlay: document.getElementById('btnPlay'),
      heroPlayIcon: document.getElementById('heroPlayIcon'),
      btnNext: document.getElementById('btnNext'),
      btnLoop: document.getElementById('btnLoop'),
      btnMute: document.getElementById('btnMute'),
      heroMuteIcon: document.getElementById('heroMuteIcon'),
      volumeSlider: document.getElementById('volumeSlider'),
      volumeText: document.getElementById('volumeText'),
      btnStopWallpaper: document.getElementById('btnStopWallpaper'),

      // Quick Settings & Auto-Advance Timer
      quickIntervalSelect: document.getElementById('quickIntervalSelect'),
      quickCustomRow: document.getElementById('quickCustomRow'),
      quickCustomMins: document.getElementById('quickCustomMins'),
      btnQuickApplyCustom: document.getElementById('btnQuickApplyCustom'),
      timerCountdownBadge: document.getElementById('timerCountdownBadge'),
      btnQuickChangeNow: document.getElementById('btnQuickChangeNow'),
      settingsTimerBadge: document.getElementById('settingsTimerBadge'),
      quickFitSelect: document.getElementById('quickFitSelect'),
      quickFocusModeSelect: document.getElementById('quickFocusModeSelect'),
      statVideoCount: document.getElementById('statVideoCount'),
      statFolderCount: document.getElementById('statFolderCount'),

      // Sidebar Mini Player
      miniStatusText: document.getElementById('miniStatusText'),
      miniPlayerTitle: document.getElementById('miniPlayerTitle'),
      miniBtnPrev: document.getElementById('miniBtnPrev'),
      miniBtnPlay: document.getElementById('miniBtnPlay'),
      miniPlayIcon: document.getElementById('miniPlayIcon'),
      miniBtnNext: document.getElementById('miniBtnNext'),
      miniBtnMute: document.getElementById('miniBtnMute'),
      miniMuteIcon: document.getElementById('miniMuteIcon'),

      // Library
      folderChips: document.getElementById('folderChips'),
      searchInput: document.getElementById('searchInput'),
      folderFilter: document.getElementById('folderFilter'),
      sortSelect: document.getElementById('sortSelect'),
      wallpaperGrid: document.getElementById('wallpaperGrid'),
      libraryEmptyState: document.getElementById('libraryEmptyState'),
      btnAddFolder: document.getElementById('btnAddFolder'),
      btnRescan: document.getElementById('btnRescan'),
      rescanIcon: document.getElementById('rescanIcon'),
      btnQuickAddFolder: document.getElementById('btnQuickAddFolder'),
      btnBrowseLibrary: document.getElementById('btnBrowseLibrary'),
      btnEmptyAddFolder: document.getElementById('btnEmptyAddFolder'),

      // Settings Inputs
      setStartWithWindows: document.getElementById('setStartWithWindows'),
      setStartMinimized: document.getElementById('setStartMinimized'),
      setStartAuto: document.getElementById('setStartAuto'),
      setRememberLast: document.getElementById('setRememberLast'),
      setIntervalMins: document.getElementById('setIntervalMins'),
      customIntervalRow: document.getElementById('customIntervalRow'),
      setCustomMins: document.getElementById('setCustomMins'),
      setFitMode: document.getElementById('setFitMode'),
      setMuteByDefault: document.getElementById('setMuteByDefault'),
      setShuffleDefault: document.getElementById('setShuffleDefault'),
      setPlayOnlyFocused: document.getElementById('setPlayOnlyFocused'),
      setTheme: document.getElementById('setTheme'),
      setHwAccel: document.getElementById('setHwAccel'),
      setPauseBattery: document.getElementById('setPauseBattery'),
      setReduceAnim: document.getElementById('setReduceAnim'),
      btnSaveSettings: document.getElementById('btnSaveSettings'),
      btnResetSettings: document.getElementById('btnResetSettings'),

      // About
      specPlatform: document.getElementById('specPlatform'),
      specElectron: document.getElementById('specElectron'),
      specNode: document.getElementById('specNode'),
      btnOpenGitHub: document.getElementById('btnOpenGitHub'),

      // Modal
      previewModal: document.getElementById('previewModal'),
      modalVideoTitle: document.getElementById('modalVideoTitle'),
      modalVideoMeta: document.getElementById('modalVideoMeta'),
      modalVideo: document.getElementById('modalVideo'),
      btnModalClose: document.getElementById('btnModalClose'),
      btnModalSetWallpaper: document.getElementById('btnModalSetWallpaper'),

      // Toasts
      toastContainer: document.getElementById('toastContainer')
    };
  },

  switchView(viewName) {
    this.elements.views.forEach(view => {
      view.classList.toggle('active', view.id === `view-${viewName}`);
    });
    this.elements.navItems.forEach(item => {
      item.classList.toggle('active', item.dataset.view === viewName);
    });
    State.setActiveView(viewName);
  },

  formatTimerSeconds(totalSeconds) {
    const s = Math.max(0, Math.floor(totalSeconds));
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  },

  updateDashboard() {
    const current = State.getCurrentWallpaperObject();
    const playback = State.playback;
    const isActive = State.isActive;

    // Update Counts
    const videoCount = State.wallpapers.length;
    const folderCount = State.folders.length;
    this.elements.navWallpaperCount.textContent = videoCount;
    this.elements.statVideoCount.textContent = videoCount;
    this.elements.statFolderCount.textContent = folderCount;

    // Hero Media Card
    if (current && current.path) {
      this.elements.heroPlaceholder.style.display = 'none';
      this.elements.heroVideo.style.display = 'block';

      const fileUrl = `file://${current.path.replace(/\\/g, '/')}`;
      if (this.elements.heroVideo.dataset.currentSrc !== fileUrl) {
        this.elements.heroVideo.src = fileUrl;
        this.elements.heroVideo.dataset.currentSrc = fileUrl;
      }

      this.elements.heroVideo.style.objectFit = playback.fitMode || 'cover';
      this.elements.heroVideo.loop = playback.loop;

      const isPlaying = isActive && playback.isPlaying;
      const isVideoRunning = isPlaying && (!playback.playOnlyWhenDesktopFocused || State.isDesktopFocused);

      if (isVideoRunning) {
        this.elements.heroVideo.play().catch(() => {});
      } else {
        this.elements.heroVideo.pause();
      }

      this.elements.heroTitle.textContent = current.name;
      const metaParts = [];
      if (current.format) metaParts.push(current.format);
      if (current.sizeFormatted) metaParts.push(current.sizeFormatted);
      if (State.currentVideoMetadata) {
        metaParts.push(`${State.currentVideoMetadata.width}x${State.currentVideoMetadata.height}`);
      }
      this.elements.heroSubtitle.textContent = metaParts.join(' • ') || current.path;

      // Status Badge
      this.elements.heroStatusBadge.className = 'status-badge';
      if (!isActive) {
        this.elements.heroStatusBadge.classList.add('stopped');
        this.elements.heroStatusText.textContent = 'STOPPED';
      } else if (isPlaying) {
        if (playback.playOnlyWhenDesktopFocused && !State.isDesktopFocused) {
          this.elements.heroStatusBadge.classList.add('paused');
          this.elements.heroStatusText.textContent = 'STANDBY (APP IN FOCUS)';
        } else {
          this.elements.heroStatusBadge.classList.add('live');
          this.elements.heroStatusText.textContent = 'LIVE (DESKTOP IN FOCUS)';
        }
      } else {
        this.elements.heroStatusBadge.classList.add('paused');
        this.elements.heroStatusText.textContent = 'PAUSED';
      }

      this.elements.miniPlayerTitle.textContent = current.name;
      this.elements.miniStatusText.textContent = isVideoRunning ? 'Playing' : 'Standby';
    } else {
      this.elements.heroPlaceholder.style.display = 'flex';
      this.elements.heroVideo.style.display = 'none';
      this.elements.heroVideo.pause();
      this.elements.heroVideo.removeAttribute('src');
      delete this.elements.heroVideo.dataset.currentSrc;

      this.elements.heroTitle.textContent = 'No Wallpaper Selected';
      this.elements.heroSubtitle.textContent = 'Choose a video to display as your animated live wallpaper';

      this.elements.heroStatusBadge.className = 'status-badge stopped';
      this.elements.heroStatusText.textContent = 'NO ACTIVE WALLPAPER';

      this.elements.miniPlayerTitle.textContent = 'No Wallpaper Selected';
      this.elements.miniStatusText.textContent = 'Ready';
    }

    // Controls
    const isPlaying = isActive && playback.isPlaying;
    const playIconSvg = isPlaying
      ? `<rect x="6" y="4" width="4" height="16" fill="currentColor"/><rect x="14" y="4" width="4" height="16" fill="currentColor"/>`
      : `<polygon points="5 3 19 12 5 21 5 3"/>`;

    this.elements.heroPlayIcon.innerHTML = playIconSvg;
    this.elements.miniPlayIcon.innerHTML = playIconSvg;

    this.elements.btnShuffle.classList.toggle('active', playback.shuffle);
    this.elements.btnLoop.classList.toggle('active', playback.loop);

    // Mute & Volume
    const volPercent = Math.round(playback.volume * 100);
    this.elements.volumeSlider.value = volPercent;
    this.elements.volumeText.textContent = `${volPercent}%`;

    const muteIconSvg = playback.isMuted
      ? `<path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>`
      : `<path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>`;

    this.elements.heroMuteIcon.innerHTML = muteIconSvg;
    this.elements.miniMuteIcon.innerHTML = muteIconSvg;

    // Synchronize Interval Selectors and Live Countdown
    const intervalVal = playback.intervalMinutes !== undefined ? playback.intervalMinutes : 15;
    const presetValues = [0, 0.5, 1, 2, 5, 10, 15, 30, 60];
    const isPreset = presetValues.includes(intervalVal);

    if (this.elements.quickIntervalSelect) {
      this.elements.quickIntervalSelect.value = isPreset ? String(intervalVal) : 'custom';
    }
    if (this.elements.setIntervalMins) {
      this.elements.setIntervalMins.value = isPreset ? String(intervalVal) : 'custom';
    }
    if (this.elements.quickCustomRow) {
      this.elements.quickCustomRow.style.display = isPreset ? 'none' : 'flex';
    }
    if (this.elements.customIntervalRow) {
      this.elements.customIntervalRow.style.display = isPreset ? 'none' : 'flex';
    }
    if (!isPreset) {
      if (this.elements.quickCustomMins) this.elements.quickCustomMins.value = intervalVal;
      if (this.elements.setCustomMins) this.elements.setCustomMins.value = intervalVal;
    }

    // Update Live Countdown Badges
    const timerInfo = State.timer || {};
    let badgeClass = 'timer-pill off';
    let badgeText = '⏱ Auto-Change: Off';

    if (intervalVal <= 0 || !isActive) {
      badgeClass = 'timer-pill off';
      badgeText = '⏱ Auto-Change: Off';
    } else if (!playback.isPlaying) {
      badgeClass = 'timer-pill paused';
      badgeText = '⏱ Auto-Change: Paused';
    } else {
      badgeClass = 'timer-pill';
      const remaining = typeof timerInfo.remainingSeconds === 'number' ? timerInfo.remainingSeconds : Math.round(intervalVal * 60);
      badgeText = `⏱ Next change in: ${this.formatTimerSeconds(remaining)}`;
    }

    if (this.elements.timerCountdownBadge) {
      this.elements.timerCountdownBadge.className = badgeClass;
      this.elements.timerCountdownBadge.textContent = badgeText;
    }
    if (this.elements.settingsTimerBadge) {
      this.elements.settingsTimerBadge.className = badgeClass;
      this.elements.settingsTimerBadge.textContent = badgeText;
    }

    if (this.elements.quickFitSelect) {
      this.elements.quickFitSelect.value = playback.fitMode || 'cover';
    }
    if (this.elements.quickFocusModeSelect) {
      this.elements.quickFocusModeSelect.value = playback.playOnlyWhenDesktopFocused ? 'focus' : 'always';
    }
  },

  renderFolderChips() {
    this.elements.folderChips.innerHTML = '';
    const folders = State.folders || [];
    const statuses = State.folderStatuses || [];

    if (folders.length === 0) {
      this.elements.folderChips.style.display = 'none';
      return;
    }

    this.elements.folderChips.style.display = 'flex';

    // Populate Folder Filter Dropdown
    this.elements.folderFilter.innerHTML = '<option value="all">All Folders</option>';

    folders.forEach(folder => {
      const statusObj = statuses.find(s => s.path === folder);
      const isMissing = statusObj ? !statusObj.exists : false;
      const chip = document.createElement('div');
      chip.className = `folder-chip ${isMissing ? 'missing' : ''}`;
      const folderName = folder.split(/[\\/]/).pop() || folder;
      const count = State.wallpapers.filter(w => w.folder === folder).length;

      const iconSvg = isMissing
        ? `<svg viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`
        : `<svg viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`;

      chip.innerHTML = `
        ${iconSvg}
        <span title="${folder}${isMissing ? ' (Folder deleted or moved on disk)' : ''}">${folderName} ${isMissing ? '<span style="font-weight:600;font-size:11px;opacity:0.9;">[Missing]</span>' : `(${count})`}</span>
        <button class="folder-chip-remove" title="Remove Folder from Library" data-folder="${folder}">×</button>
      `;

      this.elements.folderChips.appendChild(chip);

      const option = document.createElement('option');
      option.value = folder;
      option.textContent = `${folderName} ${isMissing ? '[Missing on disk]' : `(${count})`}`;
      this.elements.folderFilter.appendChild(option);
    });

    this.elements.folderFilter.value = State.filter.folder || 'all';
  },

  renderWallpaperGrid() {
    const grid = this.elements.wallpaperGrid;
    grid.innerHTML = '';

    let list = [...State.wallpapers];

    // Filter by Folder
    if (State.filter.folder && State.filter.folder !== 'all') {
      list = list.filter(w => w.folder === State.filter.folder);
    }

    // Filter by Query
    if (State.filter.query && State.filter.query.trim()) {
      const q = State.filter.query.toLowerCase().trim();
      list = list.filter(w => w.name.toLowerCase().includes(q) || w.filename.toLowerCase().includes(q));
    }

    // Sort
    if (State.filter.sort === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    } else if (State.filter.sort === 'date') {
      list.sort((a, b) => (b.mtime || 0) - (a.mtime || 0));
    } else if (State.filter.sort === 'size') {
      list.sort((a, b) => (b.sizeBytes || 0) - (a.sizeBytes || 0));
    }

    // Show empty state if nothing to display
    if (list.length === 0) {
      grid.style.display = 'none';
      this.elements.libraryEmptyState.style.display = 'flex';
      return;
    }

    grid.style.display = 'grid';
    this.elements.libraryEmptyState.style.display = 'none';

    const currentPath = State.currentWallpaper;

    list.forEach(video => {
      const card = document.createElement('div');
      card.className = `wallpaper-card ${video.path === currentPath ? 'current' : ''}`;
      card.dataset.id = video.id;
      card.dataset.path = video.path;

      card.innerHTML = `
        <div class="card-thumbnail-wrapper">
          <img class="card-thumbnail" id="thumb-${video.id}" src="" alt="${video.name}">
          <span class="card-format-tag">${video.format || 'VIDEO'}</span>
          ${video.path === currentPath ? '<span class="card-active-tag"><span>●</span> LIVE</span>' : ''}
          <div class="card-overlay-actions">
            <button class="overlay-btn primary btn-set-wallpaper" title="Set as Live Wallpaper" data-path="${video.path}">
              <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            </button>
            <button class="overlay-btn btn-preview-video" title="Preview Video" data-path="${video.path}">
              <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </button>
            <button class="overlay-btn btn-reveal-video" title="Show in File Explorer" data-path="${video.path}">
              <svg viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
            </button>
          </div>
        </div>
        <div class="card-body">
          <span class="card-title" title="${video.name}">${video.name}</span>
          <div class="card-meta">
            <span>${video.sizeFormatted || ''}</span>
            <span>${video.mtimeDate || ''}</span>
          </div>
        </div>
      `;

      grid.appendChild(card);

      // Lazy load thumbnail via IPC
      if (window.wallyApi && window.wallyApi.wallpapers.getThumbnail) {
        window.wallyApi.wallpapers.getThumbnail(video).then(thumbUrl => {
          const img = document.getElementById(`thumb-${video.id}`);
          if (img && thumbUrl) {
            img.src = thumbUrl;
          }
        }).catch(() => {});
      }
    });
  },

  populateSettingsForm(settings) {
    if (!settings) return;
    const general = settings.general || {};
    const playback = settings.playback || {};
    const appearance = settings.appearance || {};
    const perf = settings.performance || {};

    if (this.elements.setStartWithWindows) this.elements.setStartWithWindows.checked = Boolean(general.startWithWindows);
    if (this.elements.setStartMinimized) this.elements.setStartMinimized.checked = Boolean(general.startMinimized);
    if (this.elements.setStartAuto) this.elements.setStartAuto.checked = Boolean(general.startWallpaperAuto);
    if (this.elements.setRememberLast) this.elements.setRememberLast.checked = Boolean(general.rememberLastWallpaper);

    const intervalVal = playback.intervalMinutes !== undefined ? playback.intervalMinutes : 15;
    const presets = [0, 0.5, 1, 2, 5, 10, 15, 30, 60];
    if (presets.includes(intervalVal)) {
      if (this.elements.setIntervalMins) this.elements.setIntervalMins.value = String(intervalVal);
      if (this.elements.customIntervalRow) this.elements.customIntervalRow.style.display = 'none';
    } else {
      if (this.elements.setIntervalMins) this.elements.setIntervalMins.value = 'custom';
      if (this.elements.setCustomMins) this.elements.setCustomMins.value = intervalVal;
      if (this.elements.customIntervalRow) this.elements.customIntervalRow.style.display = 'flex';
    }

    if (this.elements.setFitMode) this.elements.setFitMode.value = playback.fitMode || 'cover';
    if (this.elements.setMuteByDefault) this.elements.setMuteByDefault.checked = Boolean(playback.isMuted);
    if (this.elements.setShuffleDefault) this.elements.setShuffleDefault.checked = Boolean(playback.shuffle);
    if (this.elements.setPlayOnlyFocused) {
      this.elements.setPlayOnlyFocused.checked = playback.playOnlyWhenDesktopFocused !== false;
    }

    if (this.elements.setTheme) this.elements.setTheme.value = appearance.theme || 'dark';
    if (this.elements.setHwAccel) this.elements.setHwAccel.checked = perf.hardwareAcceleration !== false;
    if (this.elements.setPauseBattery) this.elements.setPauseBattery.checked = perf.pauseOnBattery !== false;
    if (this.elements.setReduceAnim) this.elements.setReduceAnim.checked = Boolean(perf.reduceAnimations);

    this.applyTheme(appearance.theme || 'dark');
  },

  getSettingsFromForm() {
    const intervalSelection = this.elements.setIntervalMins ? this.elements.setIntervalMins.value : '15';
    let intervalMinutes = 15;
    if (intervalSelection === 'custom') {
      intervalMinutes = Math.max(0.1, parseFloat(this.elements.setCustomMins ? this.elements.setCustomMins.value : '15') || 15);
    } else {
      intervalMinutes = parseFloat(intervalSelection) || 0;
    }

    return {
      general: {
        startWithWindows: this.elements.setStartWithWindows ? this.elements.setStartWithWindows.checked : false,
        startMinimized: this.elements.setStartMinimized ? this.elements.setStartMinimized.checked : false,
        startWallpaperAuto: this.elements.setStartAuto ? this.elements.setStartAuto.checked : true,
        rememberLastWallpaper: this.elements.setRememberLast ? this.elements.setRememberLast.checked : true
      },
      playback: {
        intervalMinutes: intervalMinutes,
        fitMode: this.elements.setFitMode ? this.elements.setFitMode.value : 'cover',
        isMuted: this.elements.setMuteByDefault ? this.elements.setMuteByDefault.checked : true,
        shuffle: this.elements.setShuffleDefault ? this.elements.setShuffleDefault.checked : false,
        playOnlyWhenDesktopFocused: this.elements.setPlayOnlyFocused ? this.elements.setPlayOnlyFocused.checked : true
      },
      appearance: {
        theme: this.elements.setTheme ? this.elements.setTheme.value : 'dark'
      },
      performance: {
        hardwareAcceleration: this.elements.setHwAccel ? this.elements.setHwAccel.checked : true,
        pauseOnBattery: this.elements.setPauseBattery ? this.elements.setPauseBattery.checked : true,
        reduceAnimations: this.elements.setReduceAnim ? this.elements.setReduceAnim.checked : false
      }
    };
  },

  applyTheme(theme) {
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      document.documentElement.setAttribute('data-theme', theme || 'dark');
    }
  },

  setupModal() {
    this.elements.btnModalClose.addEventListener('click', () => this.closePreviewModal());
    this.elements.previewModal.addEventListener('click', (e) => {
      if (e.target === this.elements.previewModal) {
        this.closePreviewModal();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.elements.previewModal.classList.contains('active')) {
        this.closePreviewModal();
      }
    });
  },

  openPreviewModal(videoPath) {
    const video = State.wallpapers.find(w => w.path === videoPath) || {
      name: videoPath.split(/[\\/]/).pop(),
      path: videoPath,
      format: (videoPath.split('.').pop() || '').toUpperCase()
    };

    State.previewVideo = video;
    this.elements.modalVideoTitle.textContent = video.name;
    this.elements.modalVideoMeta.textContent = `${video.format || 'VIDEO'} • ${video.sizeFormatted || 'Local File'}`;

    const fileUrl = `file://${video.path.replace(/\\/g, '/')}`;
    this.elements.modalVideo.src = fileUrl;
    this.elements.modalVideo.play().catch(() => {});

    this.elements.previewModal.classList.add('active');
  },

  closePreviewModal() {
    this.elements.modalVideo.pause();
    this.elements.modalVideo.removeAttribute('src');
    this.elements.previewModal.classList.remove('active');
    State.previewVideo = null;
  },

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let iconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
    if (type === 'success') {
      iconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
    } else if (type === 'error') {
      iconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
    }

    toast.innerHTML = `${iconSvg}<span>${message}</span>`;
    this.elements.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }
};
