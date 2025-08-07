/**
 * Manages audio playback, player UI updates, and lyrics loading.
 * NEW: Also manages the entire lifecycle of YouTube IFrame players.
 */
export default class Player {
  constructor(graphData, iframeContainer) {
    this.graphData = graphData;
    this.iframeContainer = iframeContainer; // The container for all iframes
    this.navigation = null;
    this.currentNode = null;
    
    // Audio player
    this.audio = new Audio();
    
    // YouTube players
    this.ytPlayers = new Map(); // Stores the YT.Player objects
    this.ytPlayerReady = new Map(); // Tracks which players have fired 'onReady'
    this.ytPlayQueue = new Set(); // Stores node IDs that should play once ready
    this.currentYtPlayer = null;

    this.setupEventListeners();
  }

  setNavigation(navigation) { this.navigation = navigation; }
  
  /**
   * Creates all YouTube player instances at the beginning.
   * They are created hidden and managed by this module.
   */
  initializeAllYouTubePlayers() {
      this.graphData.nodes.forEach(node => {
          if (node.sourceType === 'iframe' && node.iframeUrl) {
              this.createYtPlayer(node);
          }
      });
  }

  play(node) {
    if (!node) return;
    
    const wasPlayingNode = this.currentNode;
    this.currentNode = node;
    
    // Stop whatever was playing before
    if (wasPlayingNode?.id !== node.id) {
        this.audio.pause();
        if (this.currentYtPlayer) {
          this.currentYtPlayer.pauseVideo();
        }
        this.currentYtPlayer = null;
    }
    
    document.getElementById('songTitle').textContent = node.title;
    const playBtn = document.getElementById('playBtn');
    const progress = document.getElementById('progress');

    if (node.sourceType === 'audio') {
        document.getElementById('currentCover').src = node.coverUrl || 'placeholder.svg';
        if (!node.audioUrl) {
          console.warn(`Audio URL is missing for "${node.title}".`);
          this.stop();
          document.getElementById('songTitle').textContent = node.title;
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
        playBtn.disabled = false;
        playBtn.textContent = '⏸';
        progress.value = 0;
        progress.disabled = true; // YouTube controls its own progress

        this.currentYtPlayer = this.ytPlayers.get(node.id);
        if (this.ytPlayerReady.get(node.id)) {
            this.currentYtPlayer.playVideo();
        } else {
            // Player is not ready yet, queue it to be played
            console.log(`Player for ${node.id} not ready. Queuing for playback.`);
            this.ytPlayQueue.add(node.id);
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
        } else {
            this.currentYtPlayer.playVideo();
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
    document.getElementById('playBtn').disabled = true;
    document.getElementById('progress').disabled = true;
    document.getElementById('songTitle').textContent = 'Select a node to begin...';
    document.getElementById('currentCover').src = 'placeholder.svg';
    document.getElementById('progress').value = 0;
    document.getElementById('currentTime').textContent = '0:00';
  }

  // --- YouTube Player Management ---

  createYtPlayer(node) {
      if (this.ytPlayers.has(node.id) || !node.iframeUrl) return;

      const wrapper = document.createElement('div');
      wrapper.id = `iframe-wrapper-${node.id}`;
      wrapper.className = 'iframe-wrapper';
      wrapper.style.display = 'none'; // Initially hidden
      
      const playerDiv = document.createElement('div');
      playerDiv.id = `yt-player-${node.id}`;

      const dragOverlay = document.createElement('div');
      dragOverlay.className = 'drag-overlay';

      wrapper.appendChild(playerDiv);
      wrapper.appendChild(dragOverlay);
      this.iframeContainer.appendChild(wrapper);

      const player = new YT.Player(playerDiv.id, {
          height: '100%',
          width: '100%',
          videoId: node.iframeUrl,
          playerVars: { 'playsinline': 1, 'controls': 0, 'disablekb': 1 },
          events: {
              'onReady': (event) => this.onPlayerReady(event, node),
              'onStateChange': (event) => this.onPlayerStateChange(event, node)
          }
      });
      this.ytPlayers.set(node.id, player);
      this.ytPlayerReady.set(node.id, false);
  }

  destroyYtPlayer(nodeId) {
      if (this.ytPlayers.has(nodeId)) {
          const player = this.ytPlayers.get(nodeId);
          if (player && typeof player.destroy === 'function') {
            player.destroy();
          }
          this.ytPlayers.delete(nodeId);
          this.ytPlayerReady.delete(nodeId);
          this.ytPlayQueue.delete(nodeId);

          const wrapper = document.getElementById(`iframe-wrapper-${nodeId}`);
          if (wrapper) wrapper.remove();
          
          console.log(`Destroyed player for node ${nodeId}`);
      }
  }
  
  onPlayerReady(event, node) {
    console.log(`YouTube player ready for node: ${node.id}`);
    this.ytPlayerReady.set(node.id, true);
    // If this node was queued for playback, play it now
    if (this.ytPlayQueue.has(node.id)) {
        console.log(`Playing queued node: ${node.id}`);
        // Ensure this is the currently active node before playing
        if(this.currentNode?.id === node.id) {
            event.target.playVideo();
        }
        this.ytPlayQueue.delete(node.id);
    }
  }

  onPlayerStateChange(event, node) {
    if (this.currentNode?.id !== node.id) return; // Only react to the current node
    
    const playBtn = document.getElementById('playBtn');
    switch(event.data) {
        case YT.PlayerState.ENDED:
            if (this.navigation) this.navigation.advance();
            break;
        case YT.PlayerState.PLAYING:
            playBtn.textContent = '⏸';
            break;
        case YT.PlayerState.PAUSED:
            playBtn.textContent = '▶';
            break;
        case YT.PlayerState.BUFFERING:
        case YT.PlayerState.UNSTARTED:
            // You can add visual feedback for these states if desired
            break;
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
    } else {
      progress.value = 0;
      currentTimeElem.textContent = '0:00';
    }
  }
}