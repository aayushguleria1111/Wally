(function() {
  const videoA = document.getElementById('videoA');
  const videoB = document.getElementById('videoB');

  let currentVideo = null;
  let nextVideo = null;
  let isLooping = true;
  let isMuted = true;
  let volume = 0.5;
  let fitMode = 'cover';
  let isPlaying = true;

  function init() {
    videoA.volume = volume;
    videoA.muted = isMuted;
    videoB.volume = volume;
    videoB.muted = isMuted;

    [videoA, videoB].forEach((vid) => {
      vid.addEventListener('ended', onVideoEnded);
      vid.addEventListener('error', onVideoError);
      vid.addEventListener('loadedmetadata', onLoadedMetadata);
    });

    if (window.wallpaperApi) {
      window.wallpaperApi.onLoadVideo(loadVideo);
      window.wallpaperApi.onPlayPause(setPlayPause);
      window.wallpaperApi.onVolumeChange(setVolume);
      window.wallpaperApi.onFitModeChange(setFitMode);
    }
  }

  function setFitMode(mode) {
    fitMode = mode || 'cover';
    videoA.style.objectFit = fitMode;
    videoB.style.objectFit = fitMode;
  }

  function setVolume(data) {
    if (typeof data.volume === 'number') {
      volume = Math.max(0, Math.min(1, data.volume));
      videoA.volume = volume;
      videoB.volume = volume;
    }
    if (typeof data.isMuted === 'boolean') {
      isMuted = data.isMuted;
      videoA.muted = isMuted;
      videoB.muted = isMuted;
    }
  }

  function setPlayPause(play) {
    isPlaying = Boolean(play);
    const active = currentVideo;
    if (active) {
      if (isPlaying) {
        active.play().catch(err => console.warn('Play error:', err));
      } else {
        active.pause();
      }
    }
  }

  function onVideoEnded(e) {
    const video = e.target;
    if (video === currentVideo) {
      if (!isLooping) {
        if (window.wallpaperApi) {
          window.wallpaperApi.notifyVideoEnded();
        }
      }
    }
  }

  function onVideoError(e) {
    const video = e.target;
    if (video === currentVideo || video === nextVideo) {
      console.error('Wallpaper video playback error:', video.error);
      if (window.wallpaperApi) {
        window.wallpaperApi.notifyVideoError(video.error ? video.error.message : 'Unknown playback error');
      }
    }
  }

  function onLoadedMetadata(e) {
    const video = e.target;
    if (video === nextVideo) {
      if (window.wallpaperApi) {
        window.wallpaperApi.notifyVideoLoaded({
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight
        });
      }
    }
  }

  function loadVideo(options) {
    const { videoPath, loop, fit, volume: vol, isMuted: muted, startPlaying } = options;

    if (typeof loop === 'boolean') isLooping = loop;
    if (fit) setFitMode(fit);
    if (typeof vol === 'number' || typeof muted === 'boolean') {
      setVolume({ volume: vol, isMuted: muted });
    }
    if (typeof startPlaying === 'boolean') {
      isPlaying = startPlaying;
    }

    const targetVideo = (currentVideo === videoA) ? videoB : videoA;
    const oldVideo = currentVideo;

    nextVideo = targetVideo;
    targetVideo.loop = isLooping;
    targetVideo.muted = isMuted;
    targetVideo.volume = volume;
    targetVideo.style.objectFit = fitMode;

    const formattedPath = videoPath.replace(/\\/g, '/');
    const fileUrl = formattedPath.startsWith('file://') ? formattedPath : `file://${formattedPath}`;

    targetVideo.src = fileUrl;
    targetVideo.load();

    const playPromise = targetVideo.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        targetVideo.classList.remove('standby');
        targetVideo.classList.add('active');

        if (oldVideo) {
          oldVideo.classList.remove('active');
          oldVideo.classList.add('standby');
          setTimeout(() => {
            if (currentVideo !== oldVideo) {
              oldVideo.pause();
              oldVideo.removeAttribute('src');
              oldVideo.load();
            }
          }, 600);
        }

        currentVideo = targetVideo;
        nextVideo = null;

        // If it shouldn't be playing initially (e.g. desktop not in focus)
        if (!isPlaying) {
          targetVideo.pause();
        }
      }).catch(err => {
        console.warn('Autoplay failed or interrupted:', err);
        if (!targetVideo.muted) {
          targetVideo.muted = true;
          targetVideo.play().then(() => {
            if (!isPlaying) targetVideo.pause();
          }).catch(e => {
            if (window.wallpaperApi) {
              window.wallpaperApi.notifyVideoError(e.message);
            }
          });
        }
      });
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
