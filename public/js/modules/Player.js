/**
 * Manages audio playback, player UI updates, and lyrics loading.
 * NEW: Implements "lazy loading" for YouTube players to handle large graphs.
 */
export default class Player {
  constructor(graphData, iframeContainer) {
    this.graphData = graphData;
    this.iframeContainer = iframeContainer;
    this.navigation = null;
    this.currentNode = null;
    
    // Audio player
    this.audio = new Audio();
    
    // --- YouTube Player Management ---
    // Stores the ready-to-use YT.Player objects
    this.ytPlayers = new Map(); 
    // Tracks nodes for which a player is currently being created, to prevent duplicates
    this.ytPlayersCreating = new Set(); 
    this.currentYtPlayer = null;

    this.setupEventListeners();
  }

  setNavigation(navigation) { this.navigation = navigation; }
  
  /**
   * This function is now gone. Players are created on-demand.
   * initializeAllYouTubePlayers() has been removed.
   */

  async play(node) {
    if (!node) return;
    
    const wasPlayingNode = this.currentNode;
    this.currentNode = node;
    
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
        progress.disabled = true;

        // NEW "LAZY" LOGIC
        if (this.ytPlayers.has(node.id)) {
            // Player already exists, just play it
            this.currentYtPlayer = this.ytPlayers.get(node.id);
            this.currentYtPlayer.playVideo();
        } else {
            // Player doesn't exist, create it on-demand
            this.currentYtPlayer = await this.createAndPlayYtPlayer(node);
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

  /**
   * Creates a new YouTube player on-demand.
   * Returns a promise that resolves with the player object once it's ready.
   * @param {object} node The node for which to create a player.
   * @returns {Promise<YT.Player>}
   */
  createAndPlayYtPlayer(node) {
    // If we are already in the process of creating this player, do nothing.
    if (this.ytPlayersCreating.has(node.id)) {
        console.warn(`Player creation for ${node.id} already in progress.`);
        return;
    }

    return new Promise((resolve) => {
        this.ytPlayersCreating.add(node.id);

        const wrapper = document.createElement('div');
        wrapper.id = `iframe-wrapper-${node.id}`;
        wrapper.className = 'iframe-wrapper';
        wrapper.style.display = 'none';
        
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
                'onReady': (event) => {
                    console.log(`Lazy-loaded player for ${node.id} is ready.`);
                    this.ytPlayers.set(node.id, player); // Add to the map of ready players
                    this.ytPlayersCreating.delete(node.id); // Remove from the "in-progress" set
                    event.target.playVideo(); // Play it immediately
                    resolve(player); // Resolve the promise with the new player object
                },
                'onStateChange': (event) => this.onPlayerStateChange(event, node)
            }
        });
    });
  }

  destroyYtPlayer(nodeId) {
      if (this.ytPlayers.has(nodeId)) {
          this.ytPlayers.get(nodeId).destroy();
          this.ytPlayers.delete(nodeId);
      }
      this.ytPlayersCreating.delete(nodeId); // Also clear from the creation set

      const wrapper = document.getElementById(`iframe-wrapper-${nodeId}`);
      if (wrapper) wrapper.remove();
      
      console.log(`Destroyed player and wrapper for node ${nodeId}`);
  }

  onPlayerStateChange(event, node) {
    if (this.currentNode?.id !== node.id) return;
    
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
    }
  }

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