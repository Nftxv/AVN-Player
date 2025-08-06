/**
 * AVN Player v1.5.04
 * by Nftxv
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

    document.getElementById('songTitle').textContent = node.title;

    if (node.sourceType === 'iframe') {
        this.audio.pause();
        document.getElementById('currentCover').src = 'placeholder-youtube.svg'; // Or a generic video icon
        document.getElementById('playBtn').textContent = '▶';
        document.getElementById('playBtn').disabled = true; // Disable our controls for iframes
        document.getElementById('progress').value = 0;
        document.getElementById('currentTime').textContent = '0:00';
        return;
    }
    
    // Logic for 'audio' type
    document.getElementById('playBtn').disabled = false;
    const audioUrl = this.graphData.getSourceUrl(node.audioUrl);
    const coverUrl = this.graphData.getSourceUrl(node.coverUrl);

    document.getElementById('currentCover').src = coverUrl || 'placeholder.svg';
    
    if (!audioUrl) {
      alert(`Could not load audio for "${node.title}".`);
      document.getElementById('playBtn').textContent = '▶';
      return;
    }
    
    document.getElementById('playBtn').textContent = '⏸';
    if (this.audio.src !== audioUrl) this.audio.src = audioUrl;
    this.audio.play().catch(e => console.error("Playback error:", e));
    
    this.loadAndShowLyrics(node.lyricsUrl);
  }

  togglePlay() {
    if (!this.currentNode || this.currentNode.sourceType === 'iframe') return;
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
    this.currentNode = null;
    document.getElementById('playBtn').disabled = false;
    document.getElementById('playBtn').textContent = '▶';
    document.getElementById('songTitle').textContent = 'Select a node to begin...';
    document.getElementById('currentCover').src = 'placeholder.svg';
    document.getElementById('progress').value = 0;
    document.getElementById('currentTime').textContent = '0:00';
  }

  async loadAndShowLyrics(lyricsUrl) {
      const lyricsTextElem = document.getElementById('lyricsText');
      lyricsTextElem.textContent = 'Loading lyrics...';
      if (!lyricsUrl) {
          lyricsTextElem.textContent = 'No lyrics available for this track.';
          return;
      }
      
      const url = this.graphData.getSourceUrl(lyricsUrl);

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
        if (this.audio.duration && this.currentNode?.sourceType === 'audio') {
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
    if (this.audio.duration) {
      progress.value = (this.audio.currentTime / this.audio.duration) * 100;
      const mins = Math.floor(this.audio.currentTime / 60);
      const secs = Math.floor(this.audio.currentTime % 60);
      currentTimeElem.textContent = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
  }
}