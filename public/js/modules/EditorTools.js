/**
 * AVN Player v2.5 - Editor Tools Module
 * by Nftxv
 */
export default class EditorTools {
  constructor(graphData, renderer) {
    this.graphData = graphData;
    this.renderer = renderer;
    this.editingEntity = null;
    this.selectedEntity = null;
  }

  // --- Core Editor Functions (createNode, deleteEntity, selectEntity are mostly unchanged) ---

  createNode() {
    const newNode = {
      id: `node-${Date.now()}`,
      title: 'New Node',
      x: 100, y: 100,
      audioSources: [], coverSources: [], lyricsSource: null,
    };
    this.graphData.nodes.push(newNode);
    this.renderer.loadAndRenderAll();
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

  deleteEntity(entity) {
    if (!entity || !confirm('Are you sure you want to delete this item?')) return;
    
    this.closeInspector();

    if (entity.source && entity.target) {
      const index = this.graphData.edges.findIndex(
        e => e.source === entity.source && e.target === entity.target && e.label === entity.label
      );
      if (index > -1) this.graphData.edges.splice(index, 1);
    } else {
      this.graphData.edges = this.graphData.edges.filter(
        e => e.source !== entity.id && e.target !== entity.id
      );
      const index = this.graphData.nodes.findIndex(n => n.id === entity.id);
      if (index > -1) this.graphData.nodes.splice(index, 1);
    }
    this.selectEntity(null);
  }

  selectEntity(entity) {
    if (this.selectedEntity === entity) {
      if (entity && this.editingEntity !== entity) {
        this.openInspector(entity);
      }
      return;
    }
    if (this.selectedEntity) this.selectedEntity.selected = false;
    this.selectedEntity = entity;
    if (this.selectedEntity) this.selectedEntity.selected = true;
    
    document.getElementById('deleteSelectionBtn').disabled = !entity;
    
    if (entity) {
      this.openInspector(entity);
    } else {
      this.closeInspector();
    }
  }


  // --- Inspector Panel Logic ---

  openInspector(entity) {
    this.editingEntity = entity;
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
      // REMOVED BUTTON AND ONCLICK HANDLER
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
    if (!this.editingEntity) return;
    
    const entity = this.editingEntity;

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
    this.editingEntity = null;
    if (this.selectedEntity) {
        this.selectedEntity.selected = false;
        this.selectedEntity = null;
    }
    if (document.getElementById('deleteSelectionBtn')) {
      document.getElementById('deleteSelectionBtn').disabled = true;
    }
  }
  
  // --- Edge Control Points ---

  addControlPointAt(edge, position) {
      if (!edge || !position) return;
      if (!edge.controlPoints) edge.controlPoints = [];

      const startNode = this.graphData.getNodeById(edge.source);
      const endNode = this.graphData.getNodeById(edge.target);

      const pathPoints = [
          { x: startNode.x + 80, y: startNode.y + 45 },
          ...edge.controlPoints,
          { x: endNode.x + 80, y: endNode.y + 45 }
      ];

      // Find the closest segment to the clicked position
      let closestSegmentIndex = 0;
      let minDistance = Infinity;

      for (let i = 0; i < pathPoints.length - 1; i++) {
          const p1 = pathPoints[i];
          const p2 = pathPoints[i+1];
          const len = Math.hypot(p2.x - p1.x, p2.y - p1.y);
          if (len === 0) continue;
          const dot = (((position.x - p1.x) * (p2.x - p1.x)) + ((position.y - p1.y) * (p2.y - p1.y))) / (len * len);
          const closestX = p1.x + (dot * (p2.x - p1.x));
          const closestY = p1.y + (dot * (p2.y - p1.y));
          
          if (dot >= 0 && dot <= 1) { // Is the projection on the segment?
            const dist = Math.hypot(position.x - closestX, position.y - closestY);
            if (dist < minDistance) {
                minDistance = dist;
                closestSegmentIndex = i;
            }
          }
      }

      // Insert the new point into the controlPoints array at the correct position
      edge.controlPoints.splice(closestSegmentIndex, 0, position);
  }

  // --- Settings & Graph Management (no changes) ---
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
    const a = document.createElement('a');
    a.href = url;
    a.download = 'music-graph.jsonld';
    a.click();
    URL.revokeObjectURL(url);
  }
  resetGraph() {
    if (confirm('Are you sure you want to reset the graph to its default state? All local changes will be lost.')) {
      window.location.reload();
    }
  }
}