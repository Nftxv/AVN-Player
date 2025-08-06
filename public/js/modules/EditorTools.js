/**
 * AVN Player v2.9 - Editor Tools Module (Multi-Select & Drag)
 * by Nftxv
 */
export default class EditorTools {
  constructor(graphData, renderer) {
    this.graphData = graphData;
    this.renderer = renderer;
    this.selectedEntities = new Set();
    this.dragStartPositions = new Map(); // For group dragging
  }

  // --- Entity Creation ---
  createNode() {
    const center = this.renderer.getViewportCenter();
    const newNode = {
      id: `node-${Date.now()}`,
      title: 'New Node',
      x: center.x - 80, // (160 / 2)
      y: center.y - 45, // (90 / 2)
      audioSources: [], coverSources: [], lyricsSource: null,
    };
    this.graphData.nodes.push(newNode);
    return newNode;
  }
  
  createEdge(sourceNode, targetNode) {
    if (sourceNode.id === targetNode.id) return;
    const newEdge = { source: sourceNode.id, target: targetNode.id, color: '#888888', lineWidth: 2, label: '', controlPoints: [] };
    this.graphData.edges.push(newEdge);
  }

  // --- Selection Logic ---

  updateSelection(items, ctrlKey, shiftKey) {
    items = Array.isArray(items) ? items : [items].filter(Boolean);

    // Shift key REMOVES items from selection
    if (shiftKey) {
        items.forEach(item => this.selectedEntities.delete(item));
    } 
    // Ctrl key ADDS items to selection (without removing others)
    else if (ctrlKey) {
        items.forEach(item => {
            // This effectively makes Ctrl a toggle for single items or an add for many
            if (this.selectedEntities.has(item) && items.length === 1) {
                this.selectedEntities.delete(item);
            } else {
                this.selectedEntities.add(item);
            }
        });
    } 
    // No modifier: set selection to new items
    else {
        this.setSelection(items);
    }
    
    this._postSelectionUpdate();
  }
  
  setSelection(items) {
      this.clearSelection(false); // Clear silently
      items.forEach(item => this.selectedEntities.add(item));
      this._postSelectionUpdate();
  }

  clearSelection(update = true) {
      // De-select all graph entities first
      this.graphData.nodes.forEach(e => e.selected = false);
      this.graphData.edges.forEach(e => e.selected = false);
      this.selectedEntities.clear();
      if (update) this._postSelectionUpdate();
  }
  
  _postSelectionUpdate() {
      // Mark all entities in the current set as selected
      this.selectedEntities.forEach(e => e.selected = true);
      
      const selectionSize = this.selectedEntities.size;
      document.getElementById('deleteSelectionBtn').disabled = selectionSize === 0;

      if (selectionSize === 1) {
          this.openInspectorFor(this.selectedEntities.values().next().value);
      } else {
          this.closeInspector();
          if (selectionSize > 1) {
              const panel = document.getElementById('inspectorPanel');
              const title = panel.querySelector('h4');
              const content = document.getElementById('inspectorContent');
              title.textContent = "Multiple Selection";
              content.innerHTML = `<p>${selectionSize} items selected.</p><small>Drag to move the group.</small>`;
              panel.classList.remove('hidden');
          }
      }
  }

  deleteSelection() {
    if (this.selectedEntities.size === 0 || !confirm(`Are you sure you want to delete ${this.selectedEntities.size} item(s)?`)) return;
    const toDelete = new Set(this.selectedEntities);
    const nodesToDelete = new Set();
    const edgesToDelete = new Set();
    toDelete.forEach(item => {
      if (item.source) edgesToDelete.add(item);
      else nodesToDelete.add(item.id);
    });
    this.graphData.edges = this.graphData.edges.filter(edge => !edgesToDelete.has(edge) && !nodesToDelete.has(edge.source) && !nodesToDelete.has(edge.target));
    this.graphData.nodes = this.graphData.nodes.filter(node => !nodesToDelete.has(node.id));
    this.clearSelection();
  }

  // --- Dragging Logic ---
  
  startDragging() {
    this.dragStartPositions.clear();
    this.selectedEntities.forEach(entity => {
      if (!entity.source) { // Only nodes can be dragged
        this.dragStartPositions.set(entity, { x: entity.x, y: entity.y });
      }
    });
  }

  dragSelection(dx, dy) {
    this.dragStartPositions.forEach((startPos, entity) => {
      entity.x = startPos.x + dx;
      entity.y = startPos.y + dy;
    });
  }

  // --- Inspector & Other Methods ---

  openInspectorFor(entity) {
    if (!entity) { this.closeInspector(); return; }
    
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
        <label>Control Points: ${(entity.controlPoints || []).length}</label>
        <small>Double-click edge to add a point. Right-click a point to delete.</small>`;
    } else {
      title.textContent = 'Node Properties';
      content.innerHTML = `
        <label for="nodeTitle">Title:</label>
        <input type="text" id="nodeTitle" value="${entity.title || ''}">
        <label for="audioSource">Audio (URL or IPFS):</label>
        <input type="text" id="audioSource" value="${entity.audioSources?.[0]?.value || ''}">
        <label for="coverSource">Cover (URL or IPFS):</label>
        <input type="text" id="coverSource" value="${entity.coverSources?.[0]?.value || ''}">
        <label for="lyricsSource">Lyrics (URL or IPFS):</label>
        <input type="text" id="lyricsSource" value="${entity.lyricsSource?.value || ''}">`;
    }
    panel.classList.remove('hidden');
  }

  saveInspectorChanges() {
    if (this.selectedEntities.size !== 1) return;
    const entity = this.selectedEntities.values().next().value;
    if (entity.source && entity.target) {
        entity.label = document.getElementById('edgeLabel').value;
        entity.color = document.getElementById('edgeColor').value;
        entity.lineWidth = parseInt(document.getElementById('edgeWidth').value, 10);
    } else {
        entity.title = document.getElementById('nodeTitle').value;
        const parseSource = (url) => {
            if (!url || url.trim() === '') return null;
            if (url.startsWith('Qm') || url.startsWith('bafy')) return { type: 'ipfs', value: url };
            return { type: 'url', value: url };
        };
        entity.audioSources = [parseSource(document.getElementById('audioSource').value)].filter(Boolean);
        entity.coverSources = [parseSource(document.getElementById('coverSource').value)].filter(Boolean);
        entity.lyricsSource = parseSource(document.getElementById('lyricsSource').value);
        this.renderer.loadAndRenderAll();
    }
  }
  
  closeInspector() { document.getElementById('inspectorPanel').classList.add('hidden'); }

  addControlPointAt(edge, position) {
      if (!edge || !position) return;
      if (!edge.controlPoints) edge.controlPoints = [];
      const startNode = this.graphData.getNodeById(edge.source);
      const endNode = this.graphData.getNodeById(edge.target);
      const pathPoints = [ { x: startNode.x + 80, y: startNode.y + 45 }, ...edge.controlPoints, { x: endNode.x + 80, y: endNode.y + 45 } ];
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