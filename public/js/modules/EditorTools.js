/**
 * AVN Player v1.5.0 - Editor Tools Module
 * by Nftxv
 */
export default class EditorTools {
  constructor(graphData, renderer) {
    this.graphData = graphData;
    this.renderer = renderer;
    this.editingNode = null;
    this.selectedEntity = null;
  }

  createNode() {
    const newNode = {
      id: `node-${Date.now()}`,
      title: 'New Node',
      x: 100, y: 100,
      audioSources: [], coverSources: [], lyricsSource: null,
      isCollapsed: false, customLinks: []
    };
    this.graphData.nodes.push(newNode);
    return newNode;
  }

  createEdge(sourceNode, targetNode) {
    const edgeExists = this.graphData.edges.some(e => e.source === sourceNode.id && e.target === targetNode.id);
    if (edgeExists || sourceNode.id === targetNode.id) return;
    const newEdge = { source: sourceNode.id, target: targetNode.id, label: '' };
    this.graphData.edges.push(newEdge);
  }

  deleteEntity(entity) {
    if (!entity || !confirm('Are you sure you want to delete this item?')) return;
    if (entity.source) {
      const index = this.graphData.edges.findIndex(e => e === entity);
      if (index > -1) this.graphData.edges.splice(index, 1);
    } else {
      this.graphData.edges = this.graphData.edges.filter(e => e.source !== entity.id && e.target !== entity.id);
      const index = this.graphData.nodes.findIndex(n => n.id === entity.id);
      if (index > -1) this.graphData.nodes.splice(index, 1);
    }
    this.selectEntity(null);
  }

  selectEntity(entity) {
    if (this.selectedEntity) this.selectedEntity.selected = false;
    this.selectedEntity = entity;
    if (this.selectedEntity) this.selectedEntity.selected = true;
    document.getElementById('deleteSelectionBtn').disabled = !entity;
  }

  openInspector(node) {
    this.editingNode = node;
    const content = document.getElementById('inspectorContent');
    const linksAsText = (node.customLinks || []).join('\n');
    content.innerHTML = `
      <label for="nodeTitle">Title:</label>
      <input type="text" id="nodeTitle" value="${node.title}">
      <label for="audioSource">Audio (URL/IPFS):</label>
      <input type="text" id="audioSource" value="${node.audioSources?.[0]?.value || ''}">
      <label for="coverSource">Cover (URL/IPFS):</label>
      <input type="text" id="coverSource" value="${node.coverSources?.[0]?.value || ''}">
      <label for="lyricsSource">Lyrics (URL/IPFS):</label>
      <input type="text" id="lyricsSource" value="${node.lyricsSource?.value || ''}">
      <label for="customLinks">Custom Links (one per line):</label>
      <textarea id="customLinks" rows="4">${linksAsText}</textarea>
    `;
    document.getElementById('inspectorPanel').classList.remove('hidden');
  }

  saveInspectorChanges() {
    if (!this.editingNode) return;
    this.editingNode.title = document.getElementById('nodeTitle').value;
    const parse = (url) => url ? (url.startsWith('Qm') || url.startsWith('bafy') ? { type: 'ipfs', value: url } : { type: 'url', value: url }) : null;
    this.editingNode.audioSources = [parse(document.getElementById('audioSource').value)].filter(Boolean);
    this.editingNode.coverSources = [parse(document.getElementById('coverSource').value)].filter(Boolean);
    this.editingNode.lyricsSource = parse(document.getElementById('lyricsSource').value);
    this.editingNode.customLinks = document.getElementById('customLinks').value.split('\n').map(l => l.trim()).filter(Boolean);
    this.closeInspector();
  }

  closeInspector() {
    document.getElementById('inspectorPanel').classList.add('hidden');
    this.editingNode = null;
  }
  
  openSettings() {
    document.getElementById('ipfsGatewayInput').value = this.graphData.meta.gateways?.[0] || '';
    document.getElementById('settingsModal').classList.remove('hidden');
  }
  
  saveSettings() {
    this.graphData.meta.gateways = [document.getElementById('ipfsGatewayInput').value];
    this.closeSettings();
  }
  
  closeSettings() {
    document.getElementById('settingsModal').classList.add('hidden');
  }

  exportGraph() {
    const graphJSON = JSON.stringify(this.graphData.getGraph(), null, 2);
    const blob = new Blob([graphJSON], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'music-graph.jsonld';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  resetGraph() {
    if (confirm('Are you sure you want to reset?')) window.location.reload();
  }
}