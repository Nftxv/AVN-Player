/**
 * AVN Player - Editor Tools Module
 * by Nftxv
 */
const NODE_WIDTH = 200;
const NODE_HEIGHT_EXPANDED = 225;

export default class EditorTools {
  constructor(graphData, renderer) {
    this.graphData = graphData;
    this.renderer = renderer;
    this.inspectedEntity = null;
    this.selectedEntities = [];
  }

  collapseAllNodes() {
    this.graphData.nodes.forEach(node => node.isCollapsed = true);
  }

  expandAllNodes() {
    this.graphData.nodes.forEach(node => node.isCollapsed = false);
  }

  createNode() {
    const center = this.renderer.getViewportCenter();
    const newNode = {
      id: `node-${Date.now()}`,
      title: 'New Node',
      x: center.x - NODE_WIDTH / 2,
      y: center.y - (NODE_HEIGHT_EXPANDED / 2),
      isCollapsed: false,
      sourceType: 'audio',
      audioUrl: '', coverUrl: '', lyricsUrl: '', iframeUrl: '',
    };
    this.graphData.nodes.push(newNode);
    return newNode;
  }
  
  createEdge(sourceNode, targetNode) {
    if (sourceNode.id === targetNode.id) return;
    const newEdge = {
      source: sourceNode.id,
      target: targetNode.id,
      color: '#888888',
      lineWidth: 2,
      label: '',
      controlPoints: [],
    };
    this.graphData.edges.push(newEdge);
  }

  deleteSelection() {
    if (this.selectedEntities.length === 0 || !confirm(`Are you sure you want to delete ${this.selectedEntities.length} item(s)?`)) {
        return;
    }
    this.closeInspector();
    const nodesToDelete = new Set(this.selectedEntities.filter(e => e.id).map(n => n.id));
    const edgesToDelete = new Set(this.selectedEntities.filter(e => e.source));
    this.graphData.edges.forEach(edge => {
        if (nodesToDelete.has(edge.source) || nodesToDelete.has(edge.target)) {
            edgesToDelete.add(edge);
        }
    });
    this.graphData.nodes = this.graphData.nodes.filter(n => !nodesToDelete.has(n.id));
    this.graphData.edges = this.graphData.edges.filter(e => !edgesToDelete.has(e));
    this.updateSelection([], 'set');
  }
  
  selectEntity(entity) {
    this.updateSelection(entity ? [entity] : [], 'set');
  }

  updateSelection(entities, mode = 'set') {
      const entityToId = (e) => e.source ? `${e.source}->${e.target}` : e.id;
      const newSelection = new Map(entities.map(e => [entityToId(e), e]));
      let finalSelection;
      if (mode === 'set') {
          finalSelection = Array.from(newSelection.values());
      } else {
          const currentSelection = new Map(this.selectedEntities.map(e => [entityToId(e), e]));
          if (mode === 'add') {
              newSelection.forEach((value, key) => {
                if (currentSelection.has(key)) { currentSelection.delete(key); } 
                else { currentSelection.set(key, value); }
              });
          } else if (mode === 'remove') {
              newSelection.forEach((value, key) => currentSelection.delete(key));
          }
          finalSelection = Array.from(currentSelection.values());
      }
      this.selectedEntities = finalSelection;
      const selectedIds = new Set(this.selectedEntities.map(e => entityToId(e)));
      this.graphData.nodes.forEach(n => n.selected = selectedIds.has(entityToId(n)));
      this.graphData.edges.forEach(e => e.selected = selectedIds.has(entityToId(e)));
      this.updateUIState();
  }
  
  updateUIState() {
      document.getElementById('deleteSelectionBtn').disabled = this.selectedEntities.length === 0;
      if (this.selectedEntities.length === 1) {
          this.openInspector(this.selectedEntities[0]);
      } else {
          this.closeInspector();
      }
  }

  getSelection() { return this.selectedEntities; }

  openInspector(entity) {
    this.inspectedEntity = entity;
    const panel = document.getElementById('inspectorPanel');
    const content = document.getElementById('inspectorContent');
    const title = panel.querySelector('h4');

    if (entity.source) { // Is an Edge
      title.textContent = 'Edge Properties';
      content.innerHTML = `
        <label for="edgeLabel">Label:</label>
        <input type="text" id="edgeLabel" value="${entity.label || ''}">
        <label for="edgeColor">Color:</label>
        <input type="color" id="edgeColor" value="${entity.color || '#888888'}">
        <label for="edgeWidth">Line Width:</label>
        <input type="number" id="edgeWidth" value="${entity.lineWidth || 2}" min="1" max="10">
      `;
    } else { // Is a Node
      title.textContent = 'Node Properties';
      content.innerHTML = `
        <label for="nodeTitle">Title:</label>
        <input type="text" id="nodeTitle" value="${entity.title || ''}">
        
        <label>Source Type:</label>
        <div class="toggle-switch">
            <button id="type-audio" class="${entity.sourceType === 'audio' ? 'active' : ''}">Audio File</button>
            <button id="type-iframe" class="${entity.sourceType === 'iframe' ? 'active' : ''}">YouTube</button>
        </div>

        <div id="audio-fields" class="inspector-group ${entity.sourceType === 'audio' ? '' : 'hidden'}">
            <label for="audioUrl">Audio URL:</label>
            <input type="text" id="audioUrl" value="${entity.audioUrl || ''}" placeholder="https://.../track.mp3">
            <label for="coverUrl">Cover URL:</label>
            <input type="text" id="coverUrl" value="${entity.coverUrl || ''}" placeholder="https://.../cover.jpg">
            <label for="lyricsUrl">Lyrics URL:</label>
            <input type="text" id="lyricsUrl" value="${entity.lyricsUrl || ''}" placeholder="https://.../lyrics.txt">
        </div>

        <div id="iframe-fields" class="inspector-group ${entity.sourceType === 'iframe' ? '' : 'hidden'}">
            <label for="iframeUrl">YouTube URL or Video ID:</label>
            <input type="text" id="iframeUrlInput" value="${entity.iframeUrl || ''}" placeholder="dQw4w9WgXcQ">
        </div>
      `;
      this._setupInspectorLogic(entity);
    }
    panel.classList.remove('hidden');
  }

  _setupInspectorLogic(node) {
      const audioBtn = document.getElementById('type-audio');
      const iframeBtn = document.getElementById('type-iframe');
      const audioFields = document.getElementById('audio-fields');
      const iframeFields = document.getElementById('iframe-fields');

      const setSourceType = (type) => {
          node.sourceType = type;
          audioBtn.classList.toggle('active', type === 'audio');
          iframeBtn.classList.toggle('active', type === 'iframe');
          audioFields.classList.toggle('hidden', type !== 'audio');
          iframeFields.classList.toggle('hidden', type !== 'iframe');
      }

      audioBtn.addEventListener('click', () => setSourceType('audio'));
      iframeBtn.addEventListener('click', () => setSourceType('iframe'));
  }
  
  _parseYoutubeUrl(input) {
      if (!input || typeof input !== 'string') return '';
      if (input.includes('youtube.com/embed/')) {
        return input;
      }
      let videoId = '';
      try {
        const url = new URL(input);
        if (url.hostname.includes('youtube.com')) {
          videoId = url.searchParams.get('v');
        } else if (url.hostname.includes('youtu.be')) {
          videoId = url.pathname.slice(1);
        }
      } catch (e) {
        videoId = input.trim();
      }
      if (videoId && /^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
      console.warn("Could not parse YouTube URL/ID:", input);
      return input;
  }

  saveInspectorChanges() {
    if (!this.inspectedEntity) return;
    const entity = this.inspectedEntity;
    if (entity.source) { // Is Edge
        entity.label = document.getElementById('edgeLabel').value;
        entity.color = document.getElementById('edgeColor').value;
        entity.lineWidth = parseInt(document.getElementById('edgeWidth').value, 10);
    } else { // Is Node
        entity.title = document.getElementById('nodeTitle').value;
        if (entity.sourceType === 'audio') {
            entity.audioUrl = document.getElementById('audioUrl').value || null;
            entity.coverUrl = document.getElementById('coverUrl').value || null;
            entity.lyricsUrl = document.getElementById('lyricsUrl').value || null;
            entity.iframeUrl = null;
        } else if (entity.sourceType === 'iframe') {
            const userInput = document.getElementById('iframeUrlInput').value;
            entity.iframeUrl = this._parseYoutubeUrl(userInput) || null;
            entity.audioUrl = null;
            entity.coverUrl = null;
            entity.lyricsUrl = null;
        }
        this.renderer.loadAndRenderAll();
    }
  }

  closeInspector() {
    this.inspectedEntity = null;
    document.getElementById('inspectorPanel').classList.add('hidden');
  }
  
  addControlPointAt(edge, position) {
      if (!edge || !position) return;
      if (!edge.controlPoints) edge.controlPoints = [];
      const startNode = this.graphData.getNodeById(edge.source);
      const endNode = this.graphData.getNodeById(edge.target);
      const pathPoints = [ { x: startNode.x + NODE_WIDTH/2, y: startNode.y + 45/2 }, ...edge.controlPoints, { x: endNode.x + NODE_WIDTH/2, y: endNode.y + 45/2 } ];
      let closestSegmentIndex = 0; let minDistance = Infinity;
      for (let i = 0; i < pathPoints.length - 1; i++) {
          const p1 = pathPoints[i], p2 = pathPoints[i+1];
          const len = Math.hypot(p2.x - p1.x, p2.y - p1.y);
          if (len === 0) continue;
          const dot = (((position.x - p1.x) * (p2.x - p1.x)) + ((position.y - p1.y) * (p2.y - p1.y))) / (len * len);
          if (dot >= 0 && dot <= 1) {
            const closestX = p1.x + (dot * (p2.x - p1.x)); const closestY = p1.y + (dot * (p2.y - p1.y));
            const dist = Math.hypot(position.x - closestX, position.y - closestY);
            if (dist < minDistance) { minDistance = dist; closestSegmentIndex = i; }
          }
      }
      edge.controlPoints.splice(closestSegmentIndex, 0, position);
  }

  openSettings() {
    document.getElementById('ipfsGatewayInput').value = ''; // Deprecated
    document.getElementById('settingsModal').classList.remove('hidden');
  }

  saveSettings() {
    // Deprecated
    this.closeSettings();
  }

  closeSettings() {
    document.getElementById('settingsModal').classList.add('hidden');
  }

  exportGraph() {
    const graphJSON = JSON.stringify(this.graphData.getGraph(), null, 2);
    const blob = new Blob([graphJSON], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'music-graph.jsonld'; a.click();
    URL.revokeObjectURL(url);
  }
  
  resetGraph() {
    if (confirm('Are you sure you want to reset the graph to its default state? All local changes will be lost.')) {
      window.location.reload();
    }
  }
}