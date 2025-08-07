/**
 * AVN Player - Editor Tools Module
 * by Nftxv
 */
const NODE_WIDTH = 200;
const NODE_HEADER_HEIGHT = 45;
const NODE_CONTENT_ASPECT_RATIO = 9 / 16;
const NODE_CONTENT_HEIGHT = NODE_WIDTH * NODE_CONTENT_ASPECT_RATIO;


export default class EditorTools {
  constructor(graphData, renderer) {
    this.graphData = graphData;
    this.renderer = renderer;
    this.inspectedEntity = null;
    this.selectedEntities = [];
    this.decorationsLocked = false;
  }

  collapseAllNodes() {
    this.graphData.nodes.forEach(node => node.isCollapsed = true);
  }

  expandAllNodes() {
    this.graphData.nodes.forEach(node => node.isCollapsed = false);
  }

  toggleDecorationsLock() {
    this.decorationsLocked = !this.decorationsLocked;
    
    const lockBtn = document.getElementById('lockDecorationsBtn');
    const addRectBtn = document.getElementById('addRectBtn');
    const addTextBtn = document.getElementById('addTextBtn');
    
    lockBtn.textContent = this.decorationsLocked ? '🔒' : '🔓';
    lockBtn.classList.toggle('active', this.decorationsLocked);
    addRectBtn.disabled = this.decorationsLocked;
    addTextBtn.disabled = this.decorationsLocked;

    if (this.decorationsLocked) {
      const nonDecorationSelection = this.selectedEntities.filter(e => e.type !== 'rectangle' && e.type !== 'text');
      this.updateSelection(nonDecorationSelection, 'set');
    }
  }

  createNode() {
    const center = this.renderer.getViewportCenter();
    // A new node is expanded, so we account for the content height to center it visually.
    // node.y is the top of the header.
    const visualCenterOffset = (NODE_HEADER_HEIGHT - NODE_CONTENT_HEIGHT) / 2;

    const newNode = {
      id: `node-${Date.now()}`,
      title: 'New Node',
      x: center.x - NODE_WIDTH / 2,
      y: center.y - visualCenterOffset,
      isCollapsed: false,
      sourceType: 'audio',
      audioUrl: '', coverUrl: '', lyricsUrl: '', iframeUrl: '',
    };
    this.graphData.nodes.push(newNode);
    this.selectEntity(newNode);
  }
  
  createRectangle() {
    if (this.decorationsLocked) return;
    const center = this.renderer.getViewportCenter();
    const newRect = {
        id: `deco-rect-${Date.now()}`,
        type: 'rectangle',
        x: center.x - 150, y: center.y - 100,
        width: 300, height: 200,
        backgroundColor: '#2c3e50'
    };
    this.graphData.decorations.push(newRect);
    this.selectEntity(newRect);
  }

  createText() {
    if (this.decorationsLocked) return;
    const center = this.renderer.getViewportCenter();
    const newText = {
        id: `deco-text-${Date.now()}`,
        type: 'text',
        x: center.x, y: center.y,
        textContent: 'New Text Label',
        fontSize: 16,
        color: '#ecf0f1',
        textAlign: 'center',
        width: 250,
        lineHeight: 1.2,
    };
    this.graphData.decorations.push(newText);
    this.selectEntity(newText);
  }

  createEdge(sourceNode, targetNode) {
    if (sourceNode.id === targetNode.id) return;
    const newEdge = {
      id: `edge-${sourceNode.id}-${targetNode.id}-${Date.now()}`,
      source: sourceNode.id,
      target: targetNode.id,
      color: '#888888',
      lineWidth: 2,
      label: '',
      controlPoints: [],
    };
    this.graphData.edges.push(newEdge);
    this.selectEntity(newEdge);
  }

  deleteSelection() {
    if (this.selectedEntities.length === 0 || !confirm(`Are you sure you want to delete ${this.selectedEntities.length} item(s)?`)) {
        return;
    }
    this.closeInspector();

    const selectedIds = new Set(this.selectedEntities.map(e => e.id));
    const nodesToDelete = new Set(this.selectedEntities.filter(e => e.sourceType).map(n => n.id));
    
    this.graphData.nodes = this.graphData.nodes.filter(n => !selectedIds.has(n.id));
    this.graphData.edges = this.graphData.edges.filter(e => !selectedIds.has(e.id) && !nodesToDelete.has(e.source) && !nodesToDelete.has(e.target));
    this.graphData.decorations = this.graphData.decorations.filter(d => !selectedIds.has(d.id));

    this.updateSelection([], 'set');
  }
  
  selectEntity(entity) {
    this.updateSelection(entity ? [entity] : [], 'set');
  }

  updateSelection(entities, mode = 'set') {
      const entityToId = (e) => e.id || `${e.source}->${e.target}`;
      const newSelection = new Map(entities.map(e => [entityToId(e), e]));
      let finalSelection;
      
      if (mode === 'set') {
          finalSelection = Array.from(newSelection.values());
      } else {
          const currentSelection = new Map(this.selectedEntities.map(e => [entityToId(e), e]));
          if (mode === 'add') {
              newSelection.forEach((value, key) => {
                if (currentSelection.has(key)) currentSelection.delete(key); 
                else currentSelection.set(key, value);
              });
          } else if (mode === 'remove') {
              newSelection.forEach((value, key) => currentSelection.delete(key));
          }
          finalSelection = Array.from(currentSelection.values());
      }
      this.selectedEntities = finalSelection;
      const selectedIds = new Set(this.selectedEntities.map(e => entityToId(e)));
      
      this.graphData.nodes.forEach(n => n.selected = selectedIds.has(n.id));
      this.graphData.edges.forEach(e => e.selected = selectedIds.has(entityToId(e)));
      this.graphData.decorations.forEach(d => d.selected = selectedIds.has(d.id));
      
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
    let html = '';

    if (entity.sourceType) { // Node
        title.textContent = 'Node Properties';
        html = `
            <label for="nodeTitle">Title:</label>
            <input type="text" id="nodeTitle" value="${entity.title || ''}">
            <label>Source Type:</label>
            <div class="toggle-switch">
                <button id="type-audio" class="${entity.sourceType === 'audio' ? 'active' : ''}">Audio File</button>
                <button id="type-iframe" class="${entity.sourceType === 'iframe' ? 'active' : ''}">YouTube</button>
            </div>
            <div id="audio-fields" class="${entity.sourceType === 'audio' ? '' : 'hidden'}">
                <label for="audioUrl">Audio URL:</label>
                <input type="text" id="audioUrl" value="${entity.audioUrl || ''}" placeholder="https://.../track.mp3">
                <label for="coverUrl">Cover URL:</label>
                <input type="text" id="coverUrl" value="${entity.coverUrl || ''}" placeholder="https://.../cover.jpg">
                <label for="lyricsUrl">Lyrics URL:</label>
                <input type="text" id="lyricsUrl" value="${entity.lyricsUrl || ''}" placeholder="https://.../lyrics.txt">
            </div>
            <div id="iframe-fields" class="${entity.sourceType === 'iframe' ? '' : 'hidden'}">
                <label for="iframeUrl">YouTube URL or Video ID:</label>
                <input type="text" id="iframeUrlInput" value="${entity.iframeUrl || ''}" placeholder="dQw4w9WgXcQ">
            </div>
        `;
    } else if (entity.source) { // Edge
        title.textContent = 'Edge Properties';
        html = `
            <label for="edgeLabel">Label:</label>
            <input type="text" id="edgeLabel" value="${entity.label || ''}">
            <label for="edgeColor">Color:</label>
            <input type="color" id="edgeColor" value="${entity.color || '#888888'}">
            <label for="edgeWidth">Line Width:</label>
            <input type="number" id="edgeWidth" value="${entity.lineWidth || 2}" min="1" max="10">
        `;
    } else if (entity.type === 'rectangle') {
        title.textContent = 'Rectangle Properties';
        html = `
            <label for="rectColor">Background Color:</label>
            <input type="color" id="rectColor" value="${entity.backgroundColor}">
            <label for="rectWidth">Width:</label>
            <input type="number" id="rectWidth" value="${entity.width}" min="10">
            <label for="rectHeight">Height:</label>
            <input type="number" id="rectHeight" value="${entity.height}" min="10">
        `;
    } else if (entity.type === 'text') {
        title.textContent = 'Text Properties';
        html = `
            <label for="textContent">Text:</label>
            <textarea id="textContent" rows="4">${entity.textContent || ''}</textarea>
            <label for="textWidth">Width (px, 0=auto):</label>
            <input type="number" id="textWidth" value="${entity.width || 0}" min="0">
            <label for="textColor">Text Color:</label>
            <input type="color" id="textColor" value="${entity.color || '#FFFFFF'}">
            <label for="textSize">Font Size:</label>
            <input type="number" id="textSize" value="${entity.fontSize || 16}" min="8">
             <label for="textLineHeight">Line Height:</label>
            <input type="number" id="textLineHeight" value="${entity.lineHeight || 1.2}" step="0.1" min="0.8">
            <label for="textAlign">Alignment:</label>
            <select id="textAlign">
                <option value="left" ${entity.textAlign === 'left' ? 'selected' : ''}>Left</option>
                <option value="center" ${entity.textAlign === 'center' ? 'selected' : ''}>Center</option>
                <option value="right" ${entity.textAlign === 'right' ? 'selected' : ''}>Right</option>
            </select>
        `;
    }
    
    content.innerHTML = html;
    panel.classList.remove('hidden');
    if (entity.sourceType) this._setupInspectorLogic(entity);
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

  saveInspectorChanges() {
    if (!this.inspectedEntity) return;
    const entity = this.inspectedEntity;

    if (entity.sourceType) { // Node
        entity.title = document.getElementById('nodeTitle').value;
        if (entity.sourceType === 'audio') {
            entity.audioUrl = document.getElementById('audioUrl').value || null;
            entity.coverUrl = document.getElementById('coverUrl').value || null;
            entity.lyricsUrl = document.getElementById('lyricsUrl').value || null;
            entity.iframeUrl = null;
        } else if (entity.sourceType === 'iframe') {
            const userInput = document.getElementById('iframeUrlInput').value;
            entity.iframeUrl = this.graphData.parseYoutubeUrl(userInput) || null; // CORRECTED
            entity.audioUrl = null;
            entity.coverUrl = null;
            entity.lyricsUrl = null;
        }
    } else if (entity.source) { // Edge
        entity.label = document.getElementById('edgeLabel').value;
        entity.color = document.getElementById('edgeColor').value;
        entity.lineWidth = parseInt(document.getElementById('edgeWidth').value, 10);
    } else if (entity.type === 'rectangle') {
        entity.backgroundColor = document.getElementById('rectColor').value;
        entity.width = parseInt(document.getElementById('rectWidth').value, 10);
        entity.height = parseInt(document.getElementById('rectHeight').value, 10);
    } else if (entity.type === 'text') {
        entity.textContent = document.getElementById('textContent').value;
        entity.width = parseInt(document.getElementById('textWidth').value, 10);
        entity.color = document.getElementById('textColor').value;
        entity.fontSize = parseInt(document.getElementById('textSize').value, 10);
        entity.lineHeight = parseFloat(document.getElementById('textLineHeight').value);
        entity.textAlign = document.getElementById('textAlign').value;
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
      
      // The "center" for an edge connection is the middle of the header.
      const startPoint = { x: startNode.x + NODE_WIDTH / 2, y: startNode.y + NODE_HEADER_HEIGHT / 2 };
      const endPoint = { x: endNode.x + NODE_WIDTH / 2, y: endNode.y + NODE_HEADER_HEIGHT / 2 };

      const pathPoints = [ startPoint, ...edge.controlPoints, endPoint ];
      
      let closestSegmentIndex = 0; 
      let minDistance = Infinity;

      for (let i = 0; i < pathPoints.length - 1; i++) {
          const p1 = pathPoints[i], p2 = pathPoints[i+1];
          const len = Math.hypot(p2.x - p1.x, p2.y - p1.y);
          if (len === 0) continue;
          const dot = (((position.x - p1.x) * (p2.x - p1.x)) + ((position.y - p1.y) * (p2.y - p1.y))) / (len * len);
          
          if (dot >= 0 && dot <= 1) {
            const closestX = p1.x + (dot * (p2.x - p1.x)); 
            const closestY = p1.y + (dot * (p2.y - p1.y));
            const dist = Math.hypot(position.x - closestX, position.y - closestY);
            if (dist < minDistance) { 
              minDistance = dist; 
              closestSegmentIndex = i; 
            }
          }
      }
      edge.controlPoints.splice(closestSegmentIndex, 0, position);
  }

  exportGraph() {
    const viewport = this.renderer.getViewport();
    const graphJSON = JSON.stringify(this.graphData.getGraph(viewport), null, 2);
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