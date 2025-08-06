/**
 * Manages audio playback, player UI updates, and lyrics loading.
 */
export default class Player {
  constructor(graphData) {
    this.graphData = graphData;
    this.audio = new Audio();
    this.navigation = null;
    this.currentNode = null;
    this.setupEventListeners();
  }

  setNavigation(navigation) { this.navigation = navigation; }

  async play(node) {
    if (!node) return;
    this.currentNode = node;
    
    this.audio.pause();
    this.audio.src = '';
    
    document.getElementById('songTitle').textContent = node.title;
    
    if (node.sourceType === 'audio') {
        const audioUrl = node.audioUrl;
        const coverUrl = node.coverUrl;

        document.getElementById('currentCover').src = coverUrl || 'placeholder.svg';
        
        if (!audioUrl) {
          alert(`Audio URL is missing for "${node.title}".`);
          this.stop();
          document.getElementById('songTitle').textContent = node.title;
          return;
        }
        
        document.getElementById('playBtn').textContent = '⏸';
        document.getElementById('playBtn').disabled = false;
        document.getElementById('progress').disabled = false;

        this.audio.src = audioUrl;
        this.audio.play().catch(e => console.error("Playback error:", e));
        
        this.loadAndShowLyrics(node.lyricsUrl);

    } else if (node.sourceType === 'iframe') {
        this.stop(); // Reset player state
        document.getElementById('songTitle').textContent = `${node.title} (External)`;
        document.getElementById('currentCover').src = 'placeholder.svg'; // Or a YouTube icon
        document.getElementById('playBtn').disabled = true;
        document.getElementById('progress').disabled = true;
        console.log(`Node is an iframe. URL: ${node.iframeUrl}. Playback via main controls is disabled.`);
    }
  }

  togglePlay() {
    if (!this.currentNode || this.currentNode.sourceType !== 'audio' || !this.audio.src) return;
    if (this.audio.paused) {
      this.audio.play();
      document.getElementById('playBtn').textContent = '⏸';
    } else {
      this.audio.pause();
      document.getElementById('playBtn').textContent = '▶';
    }
  }

  stop() {
    this.audio.pause();
    this.audio.currentTime = 0;
    this.audio.src = '';
    this.currentNode = null;
    document.getElementById('playBtn').textContent = '▶';
    document.getElementById('playBtn').disabled = false;
    document.getElementById('progress').disabled = false;
    document.getElementById('songTitle').textContent = 'Select a node to begin...';
    document.getElementById('currentCover').src = 'placeholder.svg';
    document.getElementById('progress').value = 0;
    document.getElementById('currentTime').textContent = '0:00';
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
        if (this.audio.duration && isFinite(this.audio.duration)) {
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