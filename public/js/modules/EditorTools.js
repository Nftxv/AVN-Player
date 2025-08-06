/**
 * AVN Player v2.8 - Editor Tools Module (with Multi-Select)
 * by Nftxv
 */
export default class EditorTools {
  constructor(graphData, renderer) {
    this.graphData = graphData;
    this.renderer = renderer;
    // ** FIX: From single entity to a Set for multi-selection **
    this.selectedEntities = new Set();
  }

  createNode() {
    const center = this.renderer.getViewportCenter();
    const newNode = {
      id: `node-${Date.now()}`,
      title: 'New Node',
      x: center.x - 80,
      y: center.y - 45,
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

  // --- NEW SELECTION LOGIC ---

  updateSelection(items, ctrlKey, shiftKey) {
    items = Array.isArray(items) ? items : [items].filter(Boolean);

    // Standard click without modifiers: set selection to new items
    if (!ctrlKey && !shiftKey) {
        this.setSelection(items);
    } 
    // Ctrl key: toggle items in selection
    else if (ctrlKey) {
        items.forEach(item => {
            if (this.selectedEntities.has(item)) {
                this.selectedEntities.delete(item);
            } else {
                this.selectedEntities.add(item);
            }
        });
    } 
    // Shift key: add items to selection
    else if (shiftKey) {
        items.forEach(item => this.selectedEntities.add(item));
    }
    
    this._postSelectionUpdate();
  }
  
  setSelection(items) {
      this.clearSelection(false); // Clear silently
      items.forEach(item => this.selectedEntities.add(item));
      this._postSelectionUpdate();
  }

  clearSelection(update = true) {
      this.selectedEntities.forEach(e => e.selected = false);
      this.selectedEntities.clear();
      if (update) this._postSelectionUpdate();
  }
  
  _postSelectionUpdate() {
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
              content.innerHTML = `<p>${selectionSize} items selected.</p>`;
              panel.classList.remove('hidden');
          }
      }
  }

  deleteSelection() {
    if (this.selectedEntities.size === 0 || !confirm(`Are you sure you want to delete ${this.selectedEntities.size} item(s)?`)) return;

    // Use a copy for safe iteration
    const toDelete = new Set(this.selectedEntities);
    
    // Separate nodes and edges
    const nodesToDelete = new Set();
    const edgesToDelete = new Set();
    toDelete.forEach(item => {
      if (item.source) edgesToDelete.add(item);
      else nodesToDelete.add(item.id);
    });

    // Filter out edges connected to deleted nodes or explicitly selected
    this.graphData.edges = this.graphData.edges.filter(edge => {
      return !edgesToDelete.has(edge) && !nodesToDelete.has(edge.source) && !nodesToDelete.has(edge.target);
    });
    
    // Filter out nodes
    this.graphData.nodes = this.graphData.nodes.filter(node => !nodesToDelete.has(node.id));

    this.clearSelection();
  }

  // --- INSPECTOR LOGIC ---

  openInspectorFor(entity) {
    if (!entity) { this.closeInspector(); return; }
    
    const panel = document.getElementById('inspectorPanel');
    const content = document.getElementById('inspectorContent');
    const title = panel.querySelector('h4');

    if (entity.source && entity.target) { // It's an EDGE
      title.textContent = 'Edge Properties';
      content.innerHTML = `...`; // Same as before
    } else { // It's a NODE
      title.textContent = 'Node Properties';
      content.innerHTML = `...`; // Same as before
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

  closeInspector() {
    document.getElementById('inspectorPanel').classList.add('hidden');
  }
    
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