/**
 * AVN Player v1.5.04 - Editor Tools Module with Source Types
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
      position: { 
        x: center.x - NODE_WIDTH / 2,
        y: center.y - NODE_HEIGHT_EXPANDED / 2
      },
      isCollapsed: false,
      sourceType: 'audio',
      audioUrl: '',
      coverUrl: '',
      lyricsUrl: '',
      iframeUrl: '',
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

    const nodesToDelete = new Set();
    const edgesToDelete = new Set(this.selectedEntities.filter(e => e.source));

    this.selectedEntities.forEach(entity => {
        if (!entity.source) {
            nodesToDelete.add(entity.id);
        }
    });

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
                if (currentSelection.has(key)) {
                    currentSelection.delete(key);
                } else {
                    currentSelection.set(key, value);
                }
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

  getSelection() {
      return this.selectedEntities;
  }

  openInspector(entity) {
    this.inspectedEntity = entity;
    const panel = document.getElementById('inspectorPanel');
    const content = document.getElementById('inspectorContent');
    const title = panel.querySelector('h4');

    if (entity.source && entity.target) {
      title.textContent = 'Edge Properties';
      content.innerHTML = `
        <label for="edgeLabel">Label:</label>
        <input type="text" id="edgeLabel" value="${entity.label || ''}">
        <label for="edgeColor">Color:</label>
        <input type="color" id="edgeColor" value="${entity.color || '#888888'}">
        <label for="edgeWidth">Line Width:</label>
        <input type="number" id="edgeWidth" value="${entity.lineWidth || 2}" min="1" max="10">
      `;
    } else {
      title.textContent = 'Node Properties';
      const isAudio = entity.sourceType === 'audio';
      content.innerHTML = `
        <label for="nodeTitle">Title:</label>
        <input type="text" id="nodeTitle" value="${entity.title || ''}">
        
        <label>Source Type:</label>
        <div class="radio-group">
            <label><input type="radio" name="sourceType" value="audio" ${isAudio ? 'checked' : ''}> Audio File</label>
            <label><input type="radio" name="sourceType" value="iframe" ${!isAudio ? 'checked' : ''}> YouTube</label>
        </div>

        <div id="audio-fields" class="${!isAudio ? 'hidden' : ''}">
            <label for="audioUrl">Audio URL or IPFS:</label>
            <input type="text" id="audioUrl" value="${entity.audioUrl || ''}">
            <label for="coverUrl">Cover URL or IPFS:</label>
            <input type="text" id="coverUrl" value="${entity.coverUrl || ''}">
            <label for="lyricsUrl">Lyrics URL or IPFS:</label>
            <input type="text" id="lyricsUrl" value="${entity.lyricsUrl || ''}">
        </div>

        <div id="iframe-fields" class="${isAudio ? 'hidden' : ''}">
            <label for="iframeUrl">YouTube URL or Video ID:</label>
            <input type="text" id="iframeUrl" value="${entity.iframeUrl || ''}">
        </div>
      `;

      // Add event listener for the radio buttons
      content.querySelectorAll('input[name="sourceType"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const isAudio = e.target.value === 'audio';
            document.getElementById('audio-fields').classList.toggle('hidden', !isAudio);
            document.getElementById('iframe-fields').classList.toggle('hidden', isAudio);
        });
      });
    }
    panel.classList.remove('hidden');
  }

  _parseYoutubeUrl(url) {
    if (!url) return null;
    // Check if it's already an embed link
    if (url.includes('youtube.com/embed/')) {
        return url;
    }
    let videoId;
    // Standard URL: https://www.youtube.com/watch?v=VIDEO_ID
    const urlParams = new URLSearchParams(new URL(url, 'https://www.youtube.com').search);
    videoId = urlParams.get('v');
    
    // Short URL: https://youtu.be/VIDEO_ID
    if (!videoId) {
        const match = url.match(/youtu\.be\/([^?&]+)/);
        if (match) videoId = match[1];
    }
    
    // Just the ID
    if (!videoId && !url.includes('/')) {
        videoId = url;
    }

    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  }

  saveInspectorChanges() {
    if (!this.inspectedEntity) return;
    const entity = this.inspectedEntity;
    
    if (entity.source && entity.target) {
        entity.label = document.getElementById('edgeLabel').value;
        entity.color = document.getElementById('edgeColor').value;
        entity.lineWidth = parseInt(document.getElementById('edgeWidth').value, 10);
    } else {
        entity.title = document.getElementById('nodeTitle').value;
        entity.sourceType = document.querySelector('input[name="sourceType"]:checked').value;

        if (entity.sourceType === 'audio') {
            entity.audioUrl = document.getElementById('audioUrl').value;
            entity.coverUrl = document.getElementById('coverUrl').value;
            entity.lyricsUrl = document.getElementById('lyricsUrl').value;
            entity.iframeUrl = null; // Clear unused field
        } else {
            const rawUrl = document.getElementById('iframeUrl').value;
            entity.iframeUrl = this._parseYoutubeUrl(rawUrl) || rawUrl; // Save embeddable or original if parse fails
            // Clear unused fields
            entity.audioUrl = null;
            entity.coverUrl = null;
            entity.lyricsUrl = null;
        }
        this.renderer.loadAndRenderAll(); // Reload images if cover changed
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
      const startPoint = { x: startNode.position.x + NODE_WIDTH / 2, y: startNode.position.y + NODE_HEIGHT_COLLAPSED / 2 };
      const endPoint = { x: endNode.position.x + NODE_WIDTH / 2, y: endNode.position.y + NODE_HEIGHT_COLLAPSED / 2 };
      const pathPoints = [ startPoint, ...edge.controlPoints, endPoint ];
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
    const gateway = this.graphData.meta.gateways?.[0] || '';
    document.getElementById('ipfsGatewayInput').value = gateway;
    document.getElementById('settingsModal').classList.remove('hidden');
  }

  saveSettings() {
    const gateway = document.getElementById('ipfsGatewayInput').value;
    this.graphData.meta.gateways = gateway ? [gateway] : [];
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