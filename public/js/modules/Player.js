/**
 * Manages audio playback, player UI updates, and lyrics loading.
 * NEW: Also manages YouTube IFrame player instances.
 */
export default class Player {
  constructor(graphData) {
    this.graphData = graphData;
    this.navigation = null;
    this.currentNode = null;
    
    // Audio player
    this.audio = new Audio();
    
    // YouTube players
    this.ytPlayers = new Map();
    this.currentYtPlayer = null;

    this.setupEventListeners();
  }

  setNavigation(navigation) { this.navigation = navigation; }

  play(node) {
    if (!node) return;
    this.currentNode = node;
    
    // Reset both players first
    this.audio.pause();
    if (this.currentYtPlayer) {
      this.currentYtPlayer.pauseVideo();
      this.currentYtPlayer = null;
    }
    
    document.getElementById('songTitle').textContent = node.title;
    const playBtn = document.getElementById('playBtn');
    const progress = document.getElementById('progress');

    if (node.sourceType === 'audio') {
        const audioUrl = node.audioUrl;
        document.getElementById('currentCover').src = node.coverUrl || 'placeholder.svg';
        
        if (!audioUrl) {
          console.warn(`Audio URL is missing for "${node.title}".`);
          this.stop();
          document.getElementById('songTitle').textContent = node.title;
          return;
        }
        
        playBtn.textContent = '⏸';
        playBtn.disabled = false;
        progress.disabled = false;
        this.audio.src = audioUrl;
        this.audio.play().catch(e => console.error("Playback error:", e));
        this.loadAndShowLyrics(node.lyricsUrl);

    } else if (node.sourceType === 'iframe') {
        document.getElementById('currentCover').src = `https://i.ytimg.com/vi/${node.iframeUrl}/mqdefault.jpg`;
        playBtn.textContent = '⏸';
        playBtn.disabled = false;
        progress.value = 0;
        progress.disabled = true; // YouTube controls its own progress

        this.currentYtPlayer = this.ytPlayers.get(node.id);
        if (this.currentYtPlayer && typeof this.currentYtPlayer.playVideo === 'function') {
           this.currentYtPlayer.playVideo();
        } else {
            console.warn(`YouTube player for node ${node.id} not ready yet.`);
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
    } else if (this.currentNode.sourceType === 'iframe' && this.currentYtPlayer) {
        const state = this.currentYtPlayer.getPlayerState();
        if (state === YT.PlayerState.PLAYING) {
            this.currentYtPlayer.pauseVideo();
            playBtn.textContent = '▶';
        } else {
            this.currentYtPlayer.playVideo();
            playBtn.textContent = '⏸';
        }
    }
  }

  stop() {
    this.audio.pause();
    this.audio.currentTime = 0;
    this.audio.src = '';
    
    if(this.currentYtPlayer) {
      this.currentYtPlayer.stopVideo();
      this.currentYtPlayer = null;
    }

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

      const player = new YT.Player(`yt-player-${node.id}`, {
          height: '100%',
          width: '100%',
          videoId: node.iframeUrl,
          playerVars: {
              'playsinline': 1,
              'controls': 0, // We use our own controls
              'disablekb': 1
          },
          events: {
              'onStateChange': (event) => this.onPlayerStateChange(event, node)
          }
      });
      this.ytPlayers.set(node.id, player);
  }

  destroyYtPlayer(nodeId) {
      if (this.ytPlayers.has(nodeId)) {
          const player = this.ytPlayers.get(nodeId);
          if (player && typeof player.destroy === 'function') {
            player.destroy();
          }
          this.ytPlayers.delete(nodeId);
      }
  }

  onPlayerStateChange(event, node) {
    if (this.currentNode?.id !== node.id) return; // Only react to the current node
    
    const playBtn = document.getElementById('playBtn');
    if (event.data === YT.PlayerState.ENDED) {
        if (this.navigation) this.navigation.advance();
    } else if (event.data === YT.PlayerState.PLAYING) {
        playBtn.textContent = '⏸';
    } else if (event.data === YT.PlayerState.PAUSED) {
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
        lyricsContainer.classList.remove('hidden');
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