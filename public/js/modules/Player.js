/**
 * Manages audio playback, player UI updates, and lyrics loading.
 * Manages YouTube IFrame player instances with robust state management.
 * by Nftxv
 */
export default class Player {
  constructor(graphData) {
    this.graphData = graphData;
    this.navigation = null;
    this.currentNode = null;
    
    this.audio = new Audio();
    
    this.ytPlayers = new Map();
    this.currentYtPlayer = null;
    this.isYtApiReady = false;
    this.pendingYtPlayerCreations = new Set();

    this.setupEventListeners();
  }

  setNavigation(navigation) { this.navigation = navigation; }

  setYtApiReady() {
    this.isYtApiReady = true;
    this.pendingYtPlayerCreations.forEach(node => this.createYtPlayer(node));
    this.pendingYtPlayerCreations.clear();
  }

  play(node) {
    if (!node) return;
    this.currentNode = node;

    this.audio.pause();
    this.ytPlayers.forEach((player, playerId) => {
        if (playerId !== node.id) {
            this.pauseYtPlayer(playerId);
        }
    });
    this.currentYtPlayer = null;
    
    document.getElementById('songTitle').textContent = node.title;
    const playBtn = document.getElementById('playBtn');
    const progress = document.getElementById('progress');

    if (node.sourceType === 'audio') {
        document.getElementById('currentCover').src = node.coverUrl || 'placeholder.svg';
        if (!node.audioUrl) {
          this.stop();
          document.getElementById('songTitle').textContent = `Error: No audio source for "${node.title}"`;
          return;
        }
        playBtn.textContent = '⏸';
        playBtn.disabled = false;
        progress.disabled = false;
        this.audio.src = node.audioUrl;
        this.audio.play().catch(e => console.error("Playback error:", e));
        this.loadAndShowLyrics(node.lyricsUrl);

    } else if (node.sourceType === 'iframe') {
        document.getElementById('currentCover').src = `https://i.ytimg.com/vi/${node.iframeUrl}/mqdefault.jpg`;
        playBtn.textContent = '⏸';
        playBtn.disabled = false;
        progress.value = 0;
        progress.disabled = true;

        this.currentYtPlayer = this.ytPlayers.get(node.id);
        if (this.currentYtPlayer && typeof this.currentYtPlayer.playVideo === 'function') {
           this.currentYtPlayer.playVideo();
        }
        this.loadAndShowLyrics(null);
    }
  }

  togglePlay() {
    if (!this.currentNode) return;
    const playBtn = document.getElementById('playBtn');

    if (this.currentNode.sourceType === 'audio') {
        if (this.audio.paused) {
            this.audio.play();
            playBtn.textContent = '⏸';
        } else {
            this.audio.pause();
            playBtn.textContent = '▶';
        }
    } else if (this.currentNode.sourceType === 'iframe') {
        const player = this.ytPlayers.get(this.currentNode.id);
        if (player && typeof player.getPlayerState === 'function') {
            const state = player.getPlayerState();
            if (state === YT.PlayerState.PLAYING || state === YT.PlayerState.BUFFERING) {
                player.pauseVideo();
            } else {
                player.playVideo();
            }
        }
    }
  }

  stop() {
    this.audio.pause();
    this.audio.currentTime = 0;
    this.audio.src = '';
    
    this.ytPlayers.forEach((player, playerId) => this.pauseYtPlayer(playerId));
    this.currentYtPlayer = null;

    this.currentNode = null;
    document.getElementById('playBtn').textContent = '▶';
    document.getElementById('playBtn').disabled = false;
    document.getElementById('progress').disabled = false;
    document.getElementById('songTitle').textContent = 'Select a node to begin...';
    document.getElementById('currentCover').src = 'placeholder.svg';
    document.getElementById('progress').value = 0;
    document.getElementById('currentTime').textContent = '0:00';
  }

  // --- YouTube Player Management ---

  createYtPlayer(node) {
      if (this.ytPlayers.has(node.id) || !node.iframeUrl) return;

      if (!this.isYtApiReady || typeof YT === 'undefined' || typeof YT.Player === 'undefined') {
          this.pendingYtPlayerCreations.add(node);
          return;
      }

      const player = new YT.Player(`yt-player-${node.id}`, {
          height: '100%', width: '100%', videoId: node.iframeUrl,
          playerVars: { 'playsinline': 1, 'controls': 0, 'disablekb': 1 },
          events: {
              'onReady': (event) => this.onPlayerReady(event, node),
              'onStateChange': (event) => this.onPlayerStateChange(event, node)
          }
      });
      // Store the player instance immediately.
      // Don't set this.currentYtPlayer here.
      this.ytPlayers.set(node.id, player);
  }
  
  onPlayerReady(event, node) {
      // If this node is the one we're supposed to be playing, update the current player and start it.
      if (this.currentNode && this.currentNode.id === node.id) {
          this.currentYtPlayer = event.target;
          event.target.playVideo();
      }
  }
  
  pauseYtPlayer(nodeId) {
      const player = this.ytPlayers.get(nodeId);
      if (player && typeof player.pauseVideo === 'function' && typeof player.getPlayerState === 'function') {
          const state = player.getPlayerState();
          if (state === YT.PlayerState.PLAYING || state === YT.PlayerState.BUFFERING) {
              player.pauseVideo();
          }
      }
  }

  destroyYtPlayer(nodeId) {
      const player = this.ytPlayers.get(nodeId);
      if (player) {
        if (typeof player.destroy === 'function') player.destroy();
        this.ytPlayers.delete(nodeId);
      }
  }

  onPlayerStateChange(event, node) {
    if (this.currentNode?.id !== node.id) return;
    
    const playBtn = document.getElementById('playBtn');
    if (event.data === YT.PlayerState.ENDED) {
        if (this.navigation) this.navigation.advance();
    } else if (event.data === YT.PlayerState.PLAYING) {
        playBtn.textContent = '⏸';
    } else if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.CUED) {
        playBtn.textContent = '▶';
    }
  }

  // --- Lyrics and Progress ---

  async loadAndShowLyrics(url) {
      const lyricsTextElem = document.getElementById('lyricsText');
      lyricsTextElem.textContent = 'Loading lyrics...';
      if (!url) {
          lyricsTextElem.textContent = 'No lyrics available for this track.';
          return;
      }
      try {
          const response = await fetch(url);
          if(!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          const text = await response.text();
          lyricsTextElem.textContent = text;
      } catch (e) {
          lyricsTextElem.textContent = 'Could not load lyrics.';
          console.error('Lyrics loading failed:', e);
      }
  }

  setupEventListeners() {
    this.audio.addEventListener('timeupdate', () => this.updateProgress());
    this.audio.addEventListener('ended', () => {
      if (this.navigation) this.navigation.advance();
    });
    
    document.getElementById('progress').addEventListener('input', e => {
        if (this.currentNode?.sourceType === 'audio' && this.audio.duration && isFinite(this.audio.duration)) {
            this.audio.currentTime = (e.target.value / 100) * this.audio.duration;
        }
    });

    const lyricsContainer = document.getElementById('lyricsContainer');
    document.getElementById('lyricsBtn').addEventListener('click', () => {
        lyricsContainer.classList.toggle('hidden');
    });
    document.getElementById('closeLyricsBtn').addEventListener('click', () => {
        lyricsContainer.classList.add('hidden');
    });
  }
  
  updateProgress() {
    const progress = document.getElementById('progress');
    const currentTimeElem = document.getElementById('currentTime');
    if (this.audio.duration && isFinite(this.audio.duration)) {
      progress.value = (this.audio.currentTime / this.audio.duration) * 100;
      const mins = Math.floor(this.audio.currentTime / 60);
      const secs = Math.floor(this.audio.currentTime % 60);
      currentTimeElem.textContent = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
  }
}