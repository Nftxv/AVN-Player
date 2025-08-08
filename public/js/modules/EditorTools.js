/**
 * AVN Player - Editor Tools Module v2.0
 * by Nftxv
 */
const NODE_WIDTH = 200;
const NODE_HEADER_HEIGHT = 45;

export default class EditorTools {
  constructor(graphData, renderer) {
    this.graphData = graphData;
    this.renderer = renderer;
    this.inspectedEntity = null;
    this.selectedEntities = [];
    this.decorationsLocked = false;
  }

  collapseAllNodes() { this.graphData.nodes.forEach(node => node.isCollapsed = true); }
  expandAllNodes() { this.graphData.nodes.forEach(node => node.isCollapsed = false); }

  toggleDecorationsLock() {
    this.decorationsLocked = !this.decorationsLocked;
    const lockBtn = document.getElementById('lockDecorationsBtn');
    lockBtn.textContent = this.decorationsLocked ? '🔒' : '🔓';
    lockBtn.classList.toggle('active', this.decorationsLocked);
    document.getElementById('addRectBtn').disabled = this.decorationsLocked;
    document.getElementById('addTextBtn').disabled = this.decorationsLocked;
    if (this.decorationsLocked) {
      const nonDecorationSelection = this.selectedEntities.filter(e => e.type !== 'rectangle' && e.type !== 'text');
      this.updateSelection(nonDecorationSelection, 'set');
    }
  }

  createNode() {
    const center = this.renderer.getViewportCenter();
    const newNode = {
      id: `node-${Date.now()}`,
      title: 'New Node',
      x: center.x - NODE_WIDTH / 2,
      y: center.y - NODE_HEADER_HEIGHT / 2,
      isCollapsed: false,
      sourceType: 'audio',
      audioUrl: '', coverUrl: '', iframeUrl: '',
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
        x: center.x - 150, y: center.y - 75,
        width: 300, height: 150,
        textContent: '### New Text\n\nYour content here. *Markdown* is supported.',
    };
    this.graphData.decorations.push(newText);
    this.selectEntity(newText);
  }

  createEdge(sourceNode, targetNode) {
    if (sourceNode.id === targetNode.id) return;
    const newEdge = {
      id: `edge-${sourceNode.id}-${targetNode.id}-${Date.now()}`,
      source: sourceNode.id, target: targetNode.id,
      color: '#888888', lineWidth: 2, label: '', controlPoints: [],
    };
    this.graphData.edges.push(newEdge);
    this.selectEntity(newEdge);
  }
  
  groupSelection() {
      const selection = this.selectedEntities;
      const container = selection.find(e => e.type === 'rectangle');
      const children = selection.filter(e => e.id !== container?.id);

      if (!container || children.length === 0) {
          alert('To group, select one container (rectangle) and one or more other items.');
          return;
      }
      
      children.forEach(child => {
          child.parentId = container.id;
      });
      alert(`Grouped ${children.length} item(s) into container.`);
      this.updateSelection(this.selectedEntities, 'set'); // Refresh UI
  }

  attachToNode() {
      const selection = this.selectedEntities;
      const container = selection.find(e => e.type === 'rectangle');
      const node = selection.find(e => e.sourceType); // A node
      
      if (!container || !node) {
          alert('To attach, select exactly one container and one node.');
          return;
      }
      
      container.attachedToNodeId = node.id;
      alert(`Attached container to node "${node.title}".`);
      this.updateSelection(this.selectedEntities, 'set'); // Refresh UI
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
  
  selectEntity(entity) { this.updateSelection(entity ? [entity] : [], 'set'); }

  updateSelection(entities, mode = 'set') {
      const entityToId = (e) => e.id || `${e.source}->${e.target}`;
      const newSelection = new Map(entities.map(e => [entityToId(e), e]));
      let finalSelection;
      
      if (mode === 'set') {
          finalSelection = Array.from(newSelection.values());
      } else {
          const currentSelection = new Map(this.selectedEntities.map(e => [entityToId(e), e]));
          if (mode === 'add') {
              newSelection.forEach((value, key) => { currentSelection.has(key) ? currentSelection.delete(key) : currentSelection.set(key, value); });
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
      const selection = this.selectedEntities;
      document.getElementById('deleteSelectionBtn').disabled = selection.length === 0;
      
      const hasRect = selection.some(e => e.type === 'rectangle');
      const hasNode = selection.some(e => e.sourceType);
      const hasOther = selection.some(e => e.type === 'text' || (e.source && !e.sourceType));

      document.getElementById('groupSelectionBtn').disabled = !(hasRect && hasOther);
      document.getElementById('attachToNodeBtn').disabled = !(selection.length === 2 && hasRect && hasNode);

      if (selection.length === 1) {
          this.openInspector(selection[0]);
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
                <label for="audioUrl">Audio URL:</label> <input type="text" id="audioUrl" value="${entity.audioUrl || ''}">
                <label for="coverUrl">Cover URL:</label> <input type="text" id="coverUrl" value="${entity.coverUrl || ''}">
            </div>
            <div id="iframe-fields" class="${entity.sourceType === 'iframe' ? '' : 'hidden'}">
                <label for="iframeUrl">YouTube URL or ID:</label> <input type="text" id="iframeUrlInput" value="${entity.iframeUrl || ''}">
            </div>`;
    } else if (entity.source) { // Edge
        title.textContent = 'Edge Properties';
        html = `
            <label for="edgeLabel">Label:</label> <input type="text" id="edgeLabel" value="${entity.label || ''}">
            <label for="edgeColor">Color:</label> <input type="color" id="edgeColor" value="${entity.color || '#888888'}">
            <label for="edgeWidth">Line Width:</label> <input type="number" id="edgeWidth" value="${entity.lineWidth || 2}" min="1" max="10">`;
    } else if (entity.type === 'rectangle') {
        title.textContent = 'Container Properties';
        html = `
            <label for="rectColor">BG Color:</label> <input type="color" id="rectColor" value="${entity.backgroundColor}">
            <label for="rectWidth">Width:</label> <input type="number" id="rectWidth" value="${entity.width}" min="10">
            <label for="rectHeight">Height:</label> <input type="number" id="rectHeight" value="${entity.height}" min="10">
            <label for="parentId">Parent ID:</label> <input type="text" id="parentId" value="${entity.parentId || ''}" title="Group membership">
            <label for="attachedId">Attached to Node ID:</label> <input type="text" id="attachedId" value="${entity.attachedToNodeId || ''}" title="Link to node">`;
    } else if (entity.type === 'text') {
        title.textContent = 'Text Block Properties';
        html = `
            <label for="textContent">Markdown Content:</label>
            <div id="md-toolbar">
                <button data-md="bold"><b>B</b></button> <button data-md="italic"><i>I</i></button>
                <button data-md="h3">H3</button> <button data-md="link">Link</button>
                <button data-md="image">Img</button> <button data-md="ul">List</button>
            </div>
            <textarea id="textContent" rows="6">${entity.textContent || ''}</textarea>
            <label for="rectWidth">Width:</label> <input type="number" id="rectWidth" value="${entity.width}" min="10">
            <label for="rectHeight">Height:</label> <input type="number" id="rectHeight" value="${entity.height}" min="10">
            <label for="parentId">Parent ID:</label> <input type="text" id="parentId" value="${entity.parentId || ''}" title="Group membership">`;
    }
    
    content.innerHTML = html;
    panel.classList.remove('hidden');
    if (entity.sourceType) this._setupInspectorLogic(entity);
    if (entity.type === 'text') this._setupMarkdownHelpers();
  }
  
  _setupInspectorLogic(node) {
      const audioBtn = document.getElementById('type-audio'), iframeBtn = document.getElementById('type-iframe');
      const audioFields = document.getElementById('audio-fields'), iframeFields = document.getElementById('iframe-fields');
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

  _setupMarkdownHelpers() {
      const textarea = document.getElementById('textContent');
      document.getElementById('md-toolbar').addEventListener('click', e => {
          if (e.target.tagName !== 'BUTTON') return;
          const mdType = e.target.dataset.md;
          const s = textarea.selectionStart, f = textarea.selectionEnd, v = textarea.value;
          const selected = v.substring(s, f);
          let replacement = '';
          switch (mdType) {
              case 'bold': replacement = `**${selected}**`; break;
              case 'italic': replacement = `*${selected}*`; break;
              case 'h3': replacement = `### ${selected}`; break;
              case 'ul': replacement = `\n- ${selected.replace(/\n/g, '\n- ')}`; break;
              case 'link': replacement = `[${selected}](url)`; break;
              case 'image': replacement = `![${selected}](url)`; break;
          }
          textarea.value = v.substring(0, s) + replacement + v.substring(f);
          textarea.focus();
      });
  }

  saveInspectorChanges() {
    if (!this.inspectedEntity) return;
    const entity = this.inspectedEntity;

    if (entity.sourceType) { // Node
        entity.title = document.getElementById('nodeTitle').value;
        if (entity.sourceType === 'audio') {
            entity.audioUrl = document.getElementById('audioUrl').value || null;
            entity.coverUrl = document.getElementById('coverUrl').value || null;
            entity.iframeUrl = null;
        } else if (entity.sourceType === 'iframe') {
            entity.iframeUrl = this.graphData.parseYoutubeUrl(document.getElementById('iframeUrlInput').value) || null;
            entity.audioUrl = null; entity.coverUrl = null;
        }
    } else if (entity.source) { // Edge
        entity.label = document.getElementById('edgeLabel').value;
        entity.color = document.getElementById('edgeColor').value;
        entity.lineWidth = parseInt(document.getElementById('edgeWidth').value, 10);
    } else if (entity.type === 'rectangle') {
        entity.backgroundColor = document.getElementById('rectColor').value;
        entity.width = parseInt(document.getElementById('rectWidth').value, 10);
        entity.height = parseInt(document.getElementById('rectHeight').value, 10);
        entity.parentId = document.getElementById('parentId').value || null;
        entity.attachedToNodeId = document.getElementById('attachedId').value || null;
    } else if (entity.type === 'text') {
        entity.textContent = document.getElementById('textContent').value;
        entity.width = parseInt(document.getElementById('rectWidth').value, 10);
        entity.height = parseInt(document.getElementById('rectHeight').value, 10);
        entity.parentId = document.getElementById('parentId').value || null;
    }
  }

  closeInspector() { this.inspectedEntity = null; document.getElementById('inspectorPanel').classList.add('hidden'); }
  
  addControlPointAt(edge, position) {
      if (!edge || !position) return;
      if (!edge.controlPoints) edge.controlPoints = [];
      const startNode = this.graphData.getNodeById(edge.source), endNode = this.graphData.getNodeById(edge.target);
      const startPoint = { x: startNode.x + NODE_WIDTH / 2, y: startNode.y + NODE_HEADER_HEIGHT / 2 };
      const endPoint = { x: endNode.x + NODE_WIDTH / 2, y: endNode.y + NODE_HEADER_HEIGHT / 2 };
      const pathPoints = [ startPoint, ...edge.controlPoints, endPoint ];
      let closestSegmentIndex = 0, minDistance = Infinity;
      for (let i = 0; i < pathPoints.length - 1; i++) {
          const p1 = pathPoints[i], p2 = pathPoints[i+1];
          const len = Math.hypot(p2.x - p1.x, p2.y - p1.y);
          if (len === 0) continue;
          const dot = (((position.x - p1.x) * (p2.x - p1.x)) + ((position.y - p1.y) * (p2.y - p1.y))) / (len * len);
          if (dot >= 0 && dot <= 1) {
            const dist = Math.hypot(position.x - (p1.x + (dot * (p2.x - p1.x))), position.y - (p1.y + (dot * (p2.y - p1.y))));
            if (dist < minDistance) { minDistance = dist; closestSegmentIndex = i; }
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
    if (confirm('Are you sure? This will reset the graph to default and discard all changes.')) {
      window.location.reload();
    }
  }
}