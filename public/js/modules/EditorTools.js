/**
 * AVN Player v2.3 - Editor Tools Module
 * by Nftxv
 */
export default class EditorTools {
  constructor(graphData, renderer) {
    this.graphData = graphData;
    this.renderer = renderer;
    this.editingEntity = null; // Can be a node or an edge
    this.selectedEntity = null;
  }

  // --- Core Editor Functions ---

  createNode() {
    const newNode = {
      id: `node-${Date.now()}`,
      title: 'New Node',
      x: 100, y: 100, // Default position
      audioSources: [], coverSources: [], lyricsSource: null,
    };
    this.graphData.nodes.push(newNode);
    return newNode;
  }

  createEdge(sourceNode, targetNode) {
    if (sourceNode.id === targetNode.id) return; // Prevent self-loops
    const newEdge = {
      source: sourceNode.id,
      target: targetNode.id,
      color: '#4a86e8', // Default color
      lineWidth: 2,      // Default width
      label: '',
      controlPoints: [],
    };
    this.graphData.edges.push(newEdge);
  }
  
  deleteEntity(entity) {
    if (!entity || !confirm('Are you sure you want to delete this item?')) return;
    
    this.closeInspector(); // Close inspector before deleting

    if (entity.source && entity.target) { // It's an edge
      const index = this.graphData.edges.findIndex(
        e => e.source === entity.source && e.target === entity.target && e.label === entity.label
      );
      if (index > -1) this.graphData.edges.splice(index, 1);
    } else { // It's a node
      this.graphData.edges = this.graphData.edges.filter(
        e => e.source !== entity.id && e.target !== entity.id
      );
      const index = this.graphData.nodes.findIndex(n => n.id === entity.id);
      if (index > -1) this.graphData.nodes.splice(index, 1);
    }
    this.selectEntity(null);
  }

  selectEntity(entity) {
    if (this.selectedEntity === entity) return;

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

    if (entity.source && entity.target) { // It's an EDGE
      title.textContent = 'Edge Properties';
      content.innerHTML = `
        <label for="edgeLabel">Label:</label>
        <input type="text" id="edgeLabel" value="${entity.label || ''}">
        
        <label for="edgeColor">Color:</label>
        <input type="color" id="edgeColor" value="${entity.color || '#4a86e8'}">

        <label for="edgeWidth">Line Width:</label>
        <input type="number" id="edgeWidth" value="${entity.lineWidth || 2}" min="1" max="10">
        
        <label>Control Points: ${entity.controlPoints.length} (Right-click a point to delete)</label>
        <button id="addControlPointBtn">Add Control Point</button>
      `;
      document.getElementById('addControlPointBtn').onclick = () => {
          this.addControlPoint();
          this.openInspector(this.editingEntity); // Re-render inspector
      };
    } else { // It's a NODE
      title.textContent = 'Node Properties';
      content.innerHTML = `
        <label for="nodeTitle">Title:</label>
        <input type="text" id="nodeTitle" value="${entity.title}">
        
        <label for="audioSource">Audio (URL or IPFS hash):</label>
        <input type="text" id="audioSource" value="${entity.audioSources?.[0]?.value || ''}">

        <label for="coverSource">Cover (URL or IPFS hash):</label>
        <input type="text" id="coverSource" value="${entity.coverSources?.[0]?.value || ''}">

        <label for="lyricsSource">Lyrics (URL or IPFS hash):</label>
        <input type="text" id="lyricsSource" value="${entity.lyricsSource?.value || ''}">
      `;
    }
    panel.classList.remove('hidden');
  }

  saveInspectorChanges() {
    if (!this.editingEntity) return;
    
    const entity = this.editingEntity;

    if (entity.source && entity.target) { // Saving an EDGE
        entity.label = document.getElementById('edgeLabel').value;
        entity.color = document.getElementById('edgeColor').value;
        entity.lineWidth = parseInt(document.getElementById('edgeWidth').value, 10);
    } else { // Saving a NODE
        entity.title = document.getElementById('nodeTitle').value;

        const parseSource = (url) => {
            if (!url || url.trim() === '') return null;
            if (url.startsWith('Qm') || url.startsWith('bafy')) {
                return { type: 'ipfs', value: url };
            }
            return { type: 'url', value: url };
        };

        const audioSource = parseSource(document.getElementById('audioSource').value);
        entity.audioSources = audioSource ? [audioSource] : [];
        
        const coverSource = parseSource(document.getElementById('coverSource').value);
        entity.coverSources = coverSource ? [coverSource] : [];

        entity.lyricsSource = parseSource(document.getElementById('lyricsSource').value);
    }

    this.closeInspector();
  }

  closeInspector() {
    document.getElementById('inspectorPanel').classList.add('hidden');
    this.editingEntity = null;
    if (this.selectedEntity) {
        this.selectedEntity.selected = false;
        this.selectedEntity = null;
    }
    document.getElementById('deleteSelectionBtn').disabled = true;
  }
  
  // --- Edge Control Points ---
  addControlPoint() {
      if (!this.editingEntity || !this.editingEntity.source) return;

      const edge = this.editingEntity;
      const startNode = this.graphData.getNodeById(edge.source);
      const endNode = this.graphData.getNodeById(edge.target);

      const points = [
          { x: startNode.x + 80, y: startNode.y + 45 },
          ...edge.controlPoints,
          { x: endNode.x + 80, y: endNode.y + 45 }
      ];

      // Find the longest segment to split
      let maxDist = -1;
      let splitIndex = 0;
      for (let i = 0; i < points.length - 1; i++) {
          const dist = Math.hypot(points[i+1].x - points[i].x, points[i+1].y - points[i].y);
          if (dist > maxDist) {
              maxDist = dist;
              splitIndex = i;
          }
      }

      const newPoint = {
          x: (points[splitIndex].x + points[splitIndex+1].x) / 2,
          y: (points[splitIndex].y + points[splitIndex+1].y) / 2
      };

      edge.controlPoints.splice(splitIndex, 0, newPoint);
  }


  // --- Settings Modal Logic ---
  
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

  // --- Graph Management ---

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