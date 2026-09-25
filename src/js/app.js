// Main Application Controller for Wally Desktop App
document.addEventListener('DOMContentLoaded', async () => {
  UI.init();

  // 1. Titlebar Controls
  UI.elements.btnMinimize.addEventListener('click', () => {
    window.wallyApi.window.minimize();
  });

  UI.elements.btnMaximize.addEventListener('click', async () => {
    await window.wallyApi.window.maximize();
  });

  UI.elements.btnClose.addEventListener('click', () => {
    window.wallyApi.window.close();
  });

  // 2. Navigation
  UI.elements.navItems.forEach(item => {
    item.addEventListener('click', () => {
      const view = item.dataset.view;
      UI.switchView(view);
    });
  });

  UI.elements.btnBrowseLibrary.addEventListener('click', () => {
    UI.switchView('wallpapers');
  });

  UI.elements.btnSelectFromLibrary.addEventListener('click', () => {
    UI.switchView('wallpapers');
  });

  // 3. Playback Controls (Dashboard Hero)
  UI.elements.btnPlay.addEventListener('click', async () => {
    const res = await window.wallyApi.playback.toggle();
    State.setPlaybackState(res);
  });

  UI.elements.btnNext.addEventListener('click', async () => {
    const res = await window.wallyApi.playback.next();
    if (res) State.setPlaybackState(res);
  });

  UI.elements.btnPrev.addEventListener('click', async () => {
    const res = await window.wallyApi.playback.prev();
    if (res) State.setPlaybackState(res);
  });

  UI.elements.btnShuffle.addEventListener('click', async () => {
    const newVal = !State.playback.shuffle;
    const res = await window.wallyApi.playback.setShuffle(newVal);
    State.setPlaybackState(res);
    UI.showToast(newVal ? 'Shuffle enabled' : 'Shuffle disabled', 'info');
  });

  UI.elements.btnLoop.addEventListener('click', async () => {
    const newVal = !State.playback.loop;
    const res = await window.wallyApi.playback.setLoop(newVal);
    State.setPlaybackState(res);
    UI.showToast(newVal ? 'Looping current wallpaper' : 'Auto-advancing on video end', 'info');
  });

  UI.elements.btnMute.addEventListener('click', async () => {
    const res = await window.wallyApi.playback.toggleMute();
    State.setPlaybackState(res);
  });

  UI.elements.volumeSlider.addEventListener('input', async (e) => {
    const vol = parseFloat(e.target.value) / 100;
    const res = await window.wallyApi.playback.setVolume(vol);
    State.setPlaybackState(res);
  });

  UI.elements.btnStopWallpaper.addEventListener('click', async () => {
    const res = await window.wallyApi.playback.stop();
    State.setPlaybackState(res);
    UI.showToast('Live wallpaper stopped', 'info');
  });

  UI.elements.btnRevealFile.addEventListener('click', () => {
    if (State.currentWallpaper) {
      window.wallyApi.wallpapers.reveal(State.currentWallpaper);
    }
  });

  // 4. Mini Player (Sidebar)
  UI.elements.miniBtnPlay.addEventListener('click', async () => {
    const res = await window.wallyApi.playback.toggle();
    State.setPlaybackState(res);
  });

  UI.elements.miniBtnNext.addEventListener('click', async () => {
    const res = await window.wallyApi.playback.next();
    if (res) State.setPlaybackState(res);
  });

  UI.elements.miniBtnPrev.addEventListener('click', async () => {
    const res = await window.wallyApi.playback.prev();
    if (res) State.setPlaybackState(res);
  });

  UI.elements.miniBtnMute.addEventListener('click', async () => {
    const res = await window.wallyApi.playback.toggleMute();
    State.setPlaybackState(res);
  });

  // 5. Quick Settings & Timer on Dashboard
  async function handleIntervalChange(rawVal) {
    if (rawVal === 'custom') {
      if (UI.elements.quickCustomRow) UI.elements.quickCustomRow.style.display = 'flex';
      if (UI.elements.customIntervalRow) UI.elements.customIntervalRow.style.display = 'flex';
      return;
    }
    if (UI.elements.quickCustomRow) UI.elements.quickCustomRow.style.display = 'none';
    if (UI.elements.customIntervalRow) UI.elements.customIntervalRow.style.display = 'none';

    const val = parseFloat(rawVal) || 0;
    const res = await window.wallyApi.playback.setInterval(val);
    State.setPlaybackState(res);
    UI.updateDashboard();

    const desc = val === 0 ? 'Auto-change disabled' : (val < 1 ? `Changing wallpaper every ${Math.round(val * 60)} seconds` : `Changing wallpaper every ${val} minutes`);
    UI.showToast(desc, 'info');
  }

  if (UI.elements.quickIntervalSelect) {
    UI.elements.quickIntervalSelect.addEventListener('change', (e) => {
      handleIntervalChange(e.target.value);
    });
  }

  if (UI.elements.btnQuickApplyCustom) {
    UI.elements.btnQuickApplyCustom.addEventListener('click', async () => {
      const customVal = Math.max(0.1, parseFloat(UI.elements.quickCustomMins.value) || 1);
      const res = await window.wallyApi.playback.setInterval(customVal);
      State.setPlaybackState(res);
      UI.updateDashboard();
      UI.showToast(`Custom interval set: every ${customVal} minutes`, 'success');
    });
  }

  if (UI.elements.btnQuickChangeNow) {
    UI.elements.btnQuickChangeNow.addEventListener('click', async () => {
      const res = await window.wallyApi.playback.changeNow();
      State.setPlaybackState(res);
      UI.updateDashboard();
      UI.showToast('Advanced to next wallpaper', 'info');
    });
  }

  if (UI.elements.quickFitSelect) {
    UI.elements.quickFitSelect.addEventListener('change', async (e) => {
      const mode = e.target.value;
      const res = await window.wallyApi.playback.setFit(mode);
      State.setPlaybackState(res);
      UI.showToast(`Wallpaper fit set to ${mode}`, 'info');
    });
  }

  if (UI.elements.quickFocusModeSelect) {
    UI.elements.quickFocusModeSelect.addEventListener('change', async (e) => {
      const isFocusMode = e.target.value === 'focus';
      const res = await window.wallyApi.playback.setPlayWhenFocused(isFocusMode);
      State.setPlaybackState(res);
      if (UI.elements.setPlayOnlyFocused) {
        UI.elements.setPlayOnlyFocused.checked = isFocusMode;
      }
      UI.showToast(isFocusMode ? 'Smart Pause enabled (video plays when desktop/Wally is viewed)' : 'Always Play enabled (continuous wallpaper playback)', 'info');
    });
  }

  // 6. Folder & Video Actions
  async function refreshFolderStatuses() {
    try {
      const statuses = await window.wallyApi.folders.getStatuses();
      State.setFolderStatuses(statuses);
    } catch (err) {
      console.warn('Could not refresh folder statuses:', err);
    }
  }

  async function handleAddFolder() {
    try {
      const res = await window.wallyApi.folders.select();
      if (res && res.success) {
        State.setFolders(res.folders);
        State.setWallpapers(res.videos);
        await refreshFolderStatuses();
        UI.renderFolderChips();
        UI.renderWallpaperGrid();
        UI.updateDashboard();
        UI.showToast(`Added folder: ${res.folder.split(/[\\/]/).pop()}`, 'success');
      }
    } catch (err) {
      UI.showToast('Failed to select folder', 'error');
    }
  }

  UI.elements.btnAddFolder.addEventListener('click', handleAddFolder);
  UI.elements.btnQuickAddFolder.addEventListener('click', handleAddFolder);
  UI.elements.btnEmptyAddFolder.addEventListener('click', handleAddFolder);

  UI.elements.btnRescan.addEventListener('click', async () => {
    UI.elements.rescanIcon.style.animation = 'spin 1s linear infinite';
    try {
      const videos = await window.wallyApi.wallpapers.rescan();
      State.setWallpapers(videos);
      await refreshFolderStatuses();
      UI.renderFolderChips();
      UI.renderWallpaperGrid();
      UI.updateDashboard();

      const missing = (State.folderStatuses || []).filter(s => !s.exists);
      if (missing.length > 0) {
        UI.showToast(`Rescan complete (${videos.length} videos). ${missing.length} folder(s) not found on disk.`, 'warning');
      } else {
        UI.showToast(`Found ${videos.length} wallpapers`, 'success');
      }
    } catch (err) {
      UI.showToast('Rescan failed', 'error');
    } finally {
      setTimeout(() => {
        UI.elements.rescanIcon.style.animation = '';
      }, 500);
    }
  });

  // Delegated events for folder chips remove
  UI.elements.folderChips.addEventListener('click', async (e) => {
    const removeBtn = e.target.closest('.folder-chip-remove');
    if (removeBtn) {
      const folder = removeBtn.dataset.folder;
      const res = await window.wallyApi.folders.remove(folder);
      State.setFolders(res.folders);
      State.setWallpapers(res.videos);
      await refreshFolderStatuses();
      UI.renderFolderChips();
      UI.renderWallpaperGrid();
      UI.updateDashboard();
      UI.showToast('Removed folder from library', 'info');
    }
  });

  // Delegated events for wallpaper grid actions
  UI.elements.wallpaperGrid.addEventListener('click', async (e) => {
    const setBtn = e.target.closest('.btn-set-wallpaper');
    const prevBtn = e.target.closest('.btn-preview-video');
    const revealBtn = e.target.closest('.btn-reveal-video');
    const card = e.target.closest('.wallpaper-card');

    if (setBtn) {
      e.stopPropagation();
      const path = setBtn.dataset.path;
      await activateWallpaper(path);
      return;
    }

    if (prevBtn) {
      e.stopPropagation();
      const path = prevBtn.dataset.path;
      UI.openPreviewModal(path);
      return;
    }

    if (revealBtn) {
      e.stopPropagation();
      const path = revealBtn.dataset.path;
      const revealed = await window.wallyApi.wallpapers.reveal(path);
      if (!revealed) {
        UI.showToast('File was deleted or cannot be located in Explorer', 'warning');
      }
      return;
    }

    if (card) {
      const path = card.dataset.path;
      await activateWallpaper(path);
    }
  });

  async function activateWallpaper(videoPath) {
    try {
      const res = await window.wallyApi.wallpapers.set(videoPath);
      if (res && res.success) {
        State.setPlaybackState(res.state);
        UI.updateDashboard();
        UI.renderWallpaperGrid();
        UI.showToast('Live wallpaper activated on Windows desktop!', 'success');
      } else if (res && res.error === 'FILE_NOT_FOUND') {
        UI.showToast('Video file was deleted or moved on disk', 'warning');
        const videos = await window.wallyApi.wallpapers.rescan();
        State.setWallpapers(videos);
        UI.renderWallpaperGrid();
      } else {
        UI.showToast('Could not load wallpaper video', 'error');
      }
    } catch (err) {
      UI.showToast('Failed to set live wallpaper', 'error');
    }
  }

  // Modal Set Wallpaper
  UI.elements.btnModalSetWallpaper.addEventListener('click', async () => {
    if (State.previewVideo && State.previewVideo.path) {
      await activateWallpaper(State.previewVideo.path);
      UI.closePreviewModal();
    }
  });

  // Filter & Search Controls
  UI.elements.searchInput.addEventListener('input', (e) => {
    State.filter.query = e.target.value;
    UI.renderWallpaperGrid();
  });

  UI.elements.folderFilter.addEventListener('change', (e) => {
    State.filter.folder = e.target.value;
    UI.renderWallpaperGrid();
  });

  UI.elements.sortSelect.addEventListener('change', (e) => {
    State.filter.sort = e.target.value;
    UI.renderWallpaperGrid();
  });

  // 7. Settings Handlers
  if (UI.elements.setIntervalMins) {
    UI.elements.setIntervalMins.addEventListener('change', (e) => {
      handleIntervalChange(e.target.value);
    });
  }

  if (UI.elements.setPlayOnlyFocused) {
    UI.elements.setPlayOnlyFocused.addEventListener('change', async (e) => {
      const val = e.target.checked;
      const res = await window.wallyApi.playback.setPlayWhenFocused(val);
      State.setPlaybackState(res);
      UI.showToast(val ? 'Video will play only when desktop is in focus' : 'Continuous wallpaper playback enabled', 'info');
    });
  }

  if (UI.elements.btnSaveSettings) {
    UI.elements.btnSaveSettings.addEventListener('click', async () => {
      try {
        UI.elements.btnSaveSettings.disabled = true;
        const origText = UI.elements.btnSaveSettings.textContent;
        UI.elements.btnSaveSettings.textContent = 'Saving...';

        const patch = UI.getSettingsFromForm();
        const updated = await window.wallyApi.settings.save(patch);
        State.setSettings(updated);

        // Sync fresh playback & timer state
        const curState = await window.wallyApi.playback.getState();
        State.setPlaybackState(curState);
        UI.updateDashboard();

        UI.elements.btnSaveSettings.textContent = 'Saved! ✓';
        UI.showToast('Settings saved successfully', 'success');

        setTimeout(() => {
          UI.elements.btnSaveSettings.disabled = false;
          UI.elements.btnSaveSettings.textContent = origText;
        }, 1200);
      } catch (err) {
        console.error('Save settings error:', err);
        UI.elements.btnSaveSettings.disabled = false;
        UI.elements.btnSaveSettings.textContent = 'Save Changes';
        UI.showToast('Failed to save settings: ' + err.message, 'error');
      }
    });
  }

  if (UI.elements.btnResetSettings) {
    UI.elements.btnResetSettings.addEventListener('click', async () => {
      try {
        const defaults = await window.wallyApi.settings.reset();
        State.setSettings(defaults);
        UI.populateSettingsForm(defaults);
        const curState = await window.wallyApi.playback.getState();
        State.setPlaybackState(curState);
        UI.updateDashboard();
        UI.showToast('Reset to default settings', 'info');
      } catch (err) {
        UI.showToast('Failed to reset settings', 'error');
      }
    });
  }

  // Theme switch live preview
  UI.elements.setTheme.addEventListener('change', (e) => {
    UI.applyTheme(e.target.value);
  });

  // External Links
  UI.elements.btnOpenGitHub.addEventListener('click', () => {
    window.wallyApi.system.openExternal('https://github.com/aayushguleria1111/Wally');
  });

  // 8. Reactive Subscriptions & IPC Sync
  State.subscribe((event, data) => {
    if (event === 'playback:changed') {
      UI.updateDashboard();
      UI.renderWallpaperGrid();
    } else if (event === 'wallpapers:updated') {
      UI.renderFolderChips();
      UI.renderWallpaperGrid();
      UI.updateDashboard();
    } else if (event === 'folders:updated') {
      UI.renderFolderChips();
    }
  });

  window.wallyApi.onStateChange((state) => {
    State.setPlaybackState(state);
    UI.updateDashboard();
  });

  window.wallyApi.onNavigate((view) => {
    UI.switchView(view);
  });

  // 9. Initial Data Bootstrap
  try {
    const [settings, folders, folderStatuses, wallpapers, playbackState, sysInfo] = await Promise.all([
      window.wallyApi.settings.get(),
      window.wallyApi.folders.list(),
      window.wallyApi.folders.getStatuses ? window.wallyApi.folders.getStatuses() : Promise.resolve([]),
      window.wallyApi.wallpapers.list(),
      window.wallyApi.playback.getState(),
      window.wallyApi.system.getInfo()
    ]);

    State.setSettings(settings);
    State.setFolders(folders);
    State.setFolderStatuses(folderStatuses);
    State.setWallpapers(wallpapers);
    State.setPlaybackState(playbackState);

    UI.populateSettingsForm(settings);
    UI.renderFolderChips();
    UI.renderWallpaperGrid();
    UI.updateDashboard();

    // Check for missing folders
    const missing = (folderStatuses || []).filter(s => !s.exists);
    if (missing.length > 0) {
      UI.showToast(`${missing.length} folder(s) not found or deleted on disk`, 'warning');
    }

    if (sysInfo) {
      if (UI.elements.specElectron) UI.elements.specElectron.textContent = sysInfo.electron || 'v33';
      if (UI.elements.specNode) UI.elements.specNode.textContent = sysInfo.node || 'v24';
      if (UI.elements.specPlatform) UI.elements.specPlatform.textContent = sysInfo.os || 'Windows 11 x64';
    }

    // 10. Client-side Smooth 1-Second Countdown Ticker
    setInterval(() => {
      if (State.timer && State.timer.isRunning && State.timer.remainingSeconds > 0) {
        State.timer.remainingSeconds--;
        const timeStr = UI.formatTimerSeconds(State.timer.remainingSeconds);
        if (UI.elements.timerCountdownBadge) {
          UI.elements.timerCountdownBadge.className = 'timer-pill';
          UI.elements.timerCountdownBadge.textContent = `⏱ Next change in: ${timeStr}`;
        }
        if (UI.elements.settingsTimerBadge) {
          UI.elements.settingsTimerBadge.className = 'timer-pill';
          UI.elements.settingsTimerBadge.textContent = `⏱ Next change in: ${timeStr}`;
        }
      }
    }, 1000);
  } catch (err) {
    console.error('Initialization error:', err);
  }
});

