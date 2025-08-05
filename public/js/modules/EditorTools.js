/**
 * AVN Player v2.2 - Editor Tools Module
 * by Nftxv
 */
export default class EditorTools {
  constructor(graphData, renderer) {
    this.graphData = graphData;
    this.renderer = renderer;
    this.editingNode = null;
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
    const edgeExists = this.graphData.edges.some(
      e => e.source === sourceNode.id && e.target === targetNode.id
    );
    if (edgeExists || sourceNode.id === targetNode.id) return;

    const newEdge = { source: sourceNode.id, target: targetNode.id, color: '#4a86e8', label: '' };
    this.graphData.edges.push(newEdge);
  }

  deleteEntity(entity) {
    if (!entity || !confirm('Are you sure you want to delete this item?')) return;

    if (entity.source && entity.target) { // It's an edge
      const index = this.graphData.edges.findIndex(
        e => e.source === entity.source && e.target === entity.target
      );
      if (index > -1) {
        this.graphData.edges.splice(index, 1);
      }
    } else { // It's a node
      this.graphData.edges = this.graphData.edges.filter(
        e => e.source !== entity.id && e.target !== entity.id
      );
      const index = this.graphData.nodes.findIndex(n => n.id === entity.id);
      if (index > -1) {
        this.graphData.nodes.splice(index, 1);
      }
    }
    this.selectEntity(null);
  }

  selectEntity(entity) {
    if (this.selectedEntity) this.selectedEntity.selected = false;
    this.selectedEntity = entity;
    if (this.selectedEntity) this.selectedEntity.selected = true;
    document.getElementById('deleteSelectionBtn').disabled = !entity;
  }

  // --- Inspector Panel Logic ---

  openInspector(node) {
    this.editingNode = node;
    const panel = document.getElementById('inspectorPanel');
    const content = document.getElementById('inspectorContent');

    content.innerHTML = `
      <label for="nodeTitle">Title:</label>
      <input type="text" id="nodeTitle" value="${node.title}">
      
      <label for="audioSource">Audio (URL or IPFS hash):</label>
      <input type="text" id="audioSource" value="${node.audioSources?.[0]?.value || ''}">

      <label for="coverSource">Cover (URL or IPFS hash):</label>
      <input type="text" id="coverSource" value="${node.coverSources?.[0]?.value || ''}">

      <label for="lyricsSource">Lyrics (URL or IPFS hash):</label>
      <input type="text" id="lyricsSource" value="${node.lyricsSource?.value || ''}">
    `;
    panel.classList.remove('hidden');
  }

  saveInspectorChanges() {
    if (!this.editingNode) return;
    
    this.editingNode.title = document.getElementById('nodeTitle').value;

    const parseSource = (url) => {
      if (!url || url.trim() === '') return null;
      if (url.startsWith('Qm') || url.startsWith('bafy')) {
        return { type: 'ipfs', value: url };
      }
      return { type: 'url', value: url };
    };

    const audioSource = parseSource(document.getElementById('audioSource').value);
    this.editingNode.audioSources = audioSource ? [audioSource] : [];
    
    const coverSource = parseSource(document.getElementById('coverSource').value);
    this.editingNode.coverSources = coverSource ? [coverSource] : [];

    this.editingNode.lyricsSource = parseSource(document.getElementById('lyricsSource').value);

    this.closeInspector();
  }

  closeInspector() {
    document.getElementById('inspectorPanel').classList.add('hidden');
    this.editingNode = null;
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