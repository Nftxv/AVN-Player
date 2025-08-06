/**
 * AVN Player v2.8 - Editor Tools Module with Multi-Select
 * by Nftxv
 */
export default class EditorTools {
  constructor(graphData, renderer) {
    this.graphData = graphData;
    this.renderer = renderer;
    this.inspectedEntity = null; // The single entity shown in the inspector
    this.selectedEntities = []; // Now an array for multiple selections
  }

  createNode() {
    const center = this.renderer.getViewportCenter();
    const newNode = {
      id: `node-${Date.now()}`,
      title: 'New Node',
      x: center.x - 80, y: center.y - 45,
      audioSources: [], coverSources: [], lyricsSource: null,
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
  
  // MODIFIED: Renamed and updated for multi-selection
  deleteSelection() {
    if (this.selectedEntities.length === 0 || !confirm(`Are you sure you want to delete ${this.selectedEntities.length} item(s)?`)) {
        return;
    }
    
    this.closeInspector();

    const nodesToDelete = new Set();
    const edgesToDelete = new Set(this.selectedEntities.filter(e => e.source));

    this.selectedEntities.forEach(entity => {
        if (!entity.source) { // It's a node
            nodesToDelete.add(entity.id);
        }
    });

    // Delete edges connected to the deleted nodes
    this.graphData.edges.forEach(edge => {
        if (nodesToDelete.has(edge.source) || nodesToDelete.has(edge.target)) {
            edgesToDelete.add(edge);
        }
    });

    // Filter out the deleted entities from the main data arrays
    this.graphData.nodes = this.graphData.nodes.filter(n => !nodesToDelete.has(n.id));
    this.graphData.edges = this.graphData.edges.filter(e => !edgesToDelete.has(e));
    
    this.updateSelection([], 'set'); // Clear selection
  }
  
  // MODIFIED: Now handles single selection from a click
  selectEntity(entity) {
    // A single click always sets the selection to that one entity
    this.updateSelection(entity ? [entity] : [], 'set');
  }

  // NEW: Central logic for managing selections
  updateSelection(entities, mode = 'set') {
      const newSelection = new Map(entities.map(e => [e.id || `${e.source}-${e.target}`, e]));

      let finalSelection;

      if (mode === 'set') {
          finalSelection = Array.from(newSelection.values());
      } else {
          const currentSelection = new Map(this.selectedEntities.map(e => [e.id || `${e.source}-${e.target}`, e]));
          if (mode === 'add') { // CTRL
              newSelection.forEach((value, key) => currentSelection.set(key, value));
          } else if (mode === 'remove') { // SHIFT
              newSelection.forEach((value, key) => currentSelection.delete(key));
          }
          finalSelection = Array.from(currentSelection.values());
      }
      
      this.selectedEntities = finalSelection;

      // Update the 'selected' property on the actual graph data objects
      const selectedIds = new Set(this.selectedEntities.map(e => e.id || `${e.source}-${e.target}`));
      this.graphData.nodes.forEach(n => n.selected = selectedIds.has(n.id));
      this.graphData.edges.forEach(e => e.selected = selectedIds.has(`${e.source}-${e.target}`));
      
      this.updateUIState();
  }
  
  // NEW: Update UI elements based on selection state
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
        <label>Control Points: ${(entity.controlPoints || []).length}</label>
        <small>Double-click edge to add a point. Right-click a point to delete.</small>
      `;
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
        <input type="text" id="lyricsSource" value="${entity.lyricsSource?.value || ''}">
      `;
    }
    panel.classList.remove('hidden');
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
    this.inspectedEntity = null;
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