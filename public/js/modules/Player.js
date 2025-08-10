/**
 * Manages audio playback and player UI updates.
 */
export default class Player {
  constructor(graphData, iframeContainer) {
    this.graphData = graphData;
    this.iframeContainer = iframeContainer;
    this.navigation = null;
    this.currentNode = null;
    
    this.audio = new Audio();
    
    this.ytPlayers = new Map(); 
    this.ytPlayersCreating = new Set(); 
    this.currentYtPlayer = null;

    this.setupEventListeners();
  }

  setNavigation(navigation) { this.navigation = navigation; }

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

    } else if (node.sourceType === 'iframe') {
        playBtn.disabled = false;
        playBtn.textContent = '⏸';
        progress.value = 0;
        progress.disabled = true;

        if (this.ytPlayers.has(node.id)) {
            this.currentYtPlayer = this.ytPlayers.get(node.id);
            if (this.currentYtPlayer.getPlayerState() === YT.PlayerState.ENDED) {
                this.currentYtPlayer.seekTo(0);
            }
            this.currentYtPlayer.playVideo();
        } else {
            this.currentYtPlayer = await this.createAndPlayYtPlayer(node);
        }
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
    document.getElementById('progress').value = 0;
    document.getElementById('currentTime').textContent = '0:00';
  }

  createAndPlayYtPlayer(node) {
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
                    this.ytPlayers.set(node.id, player);
                    this.ytPlayersCreating.delete(node.id);
                    event.target.playVideo();
                    resolve(player);
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
      this.ytPlayersCreating.delete(nodeId);
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
  }

  // Helper function for the renderer to check the state
  isCurrentlyPaused() {
    if (!this.currentNode) return true; // If nothing is playing, it's "paused"
    if (this.currentNode.sourceType === 'audio') {
      return this.audio.paused;
    }
    if (this.currentNode.sourceType === 'iframe' && this.currentYtPlayer) {
      const state = this.currentYtPlayer.getPlayerState();
      return state !== YT.PlayerState.PLAYING;
    }
    return true;
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