/**
 * AVN Player - Editor Tools Module
 * by Nftxv
 */
const NODE_WIDTH = 200;
const NODE_HEADER_HEIGHT = 45;
const NODE_CONTENT_ASPECT_RATIO = 9 / 16;
const NODE_CONTENT_HEIGHT = NODE_WIDTH * NODE_CONTENT_ASPECT_RATIO;


export default class EditorTools {
  constructor(graphData, renderer, app) {
    this.graphData = graphData;
    this.renderer = renderer;
    this.app = app;
    this.inspectedEntity = null;
    this.selectedEntities = [];
    this.decorationsLocked = true; 
    this.initLockState();
  }
    
  initLockState() {
      const lockBtn = document.getElementById('lockDecorationsBtn');
      lockBtn.textContent = this.decorationsLocked ? '🔒' : '🔓';
      lockBtn.classList.toggle('active', this.decorationsLocked);
      lockBtn.title = this.decorationsLocked ? 'Decorations Locked (Click to Unlock)' : 'Decorations Unlocked (Click to Lock)';
      document.getElementById('addRectBtn').disabled = this.decorationsLocked;
      document.getElementById('addTextBtn').disabled = this.decorationsLocked;
  }

  collapseAllNodes() {
    this.graphData.nodes.forEach(node => node.isCollapsed = true);
  }

  expandAllNodes() {
    this.graphData.nodes.forEach(node => node.isCollapsed = false);
  }

  toggleDecorationsLock() {
    this.decorationsLocked = !this.decorationsLocked;
    this.initLockState(); 

    if (this.decorationsLocked) {
      // If locking, deselect all decorations
      const nonDecorationSelection = this.selectedEntities.filter(e => !e.type);
      this.updateSelection(nonDecorationSelection, 'set');
    }
  }

  createNode() {
    const center = this.renderer.getViewportCenter();
    const visualCenterOffset = (NODE_HEADER_HEIGHT - NODE_CONTENT_HEIGHT) / 2;

    const newNode = {
      id: `node-${Date.now()}`,
      title: 'New Node',
      x: center.x - NODE_WIDTH / 2,
      y: center.y - visualCenterOffset,
      isCollapsed: false,
      sourceType: 'audio',
      audioUrl: '', coverUrl: '', iframeUrl: '',
    };
    this.graphData.addNode(newNode);
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
        backgroundColor: '#2c3e50',
        parentId: null, attachedToNodeId: null,
    };
    this.graphData.addDecoration(newRect);
    this.selectEntity(newRect);
  }

  createText() {
    if (this.decorationsLocked) return;
    const center = this.renderer.getViewportCenter();
    const newText = {
        id: `deco-text-${Date.now()}`,
        type: 'markdown',
        x: center.x - 150, y: center.y - 100,
        width: 300, height: 200,
        textContent: '### New Block\n\nEdit content in the inspector.',
        fontSize: 14,
        backgroundColor: 'rgba(45, 45, 45, 0.85)',
        parentId: null,
    };
    this.graphData.addDecoration(newText);
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
    this.graphData.addEdge(newEdge);
    this.selectEntity(newEdge);
  }
  
  groupOrUngroupSelection() {
      const groupBtn = document.getElementById('groupSelectionBtn');
      const isUngroupAction = groupBtn.textContent === 'Ungroup';

      if (isUngroupAction) {
          const container = this.selectedEntities.find(e => e.type === 'rectangle');
          if (!container) return;
          const releasedItems = [container];
          this.graphData.decorations.forEach(deco => {
              if (deco.parentId === container.id) {
                  deco.parentId = null;
                  releasedItems.push(deco);
              }
          });
          console.log(`Ungrouped items from parent ${container.id}`);
          this.updateSelection(releasedItems, 'set'); // Select all released items
      } else {
          const decorations = this.selectedEntities.filter(e => e.type === 'rectangle' || e.type === 'markdown');
          const parent = decorations.find(d => d.type === 'rectangle');
          if (!parent || decorations.length < 2 || parent.parentId) {
            alert('To group, select one non-grouped rectangle (as container) and at least one other decoration.');
            return;
          }
          decorations.forEach(deco => {
              if (deco.id !== parent.id) {
                  deco.parentId = parent.id;
              }
          });
          console.log(`Grouped ${decorations.length - 1} items under parent ${parent.id}`);
          this.updateSelection([parent], 'set');
      }
      this.updateUIState();
  }

  attachOrDetachSelection() {
      const attachBtn = document.getElementById('attachToNodeBtn');
      const isDetachAction = attachBtn.textContent === 'Detach';
      const container = this.selectedEntities.find(e => e.type === 'rectangle' && !e.parentId);

      if (isDetachAction) {
          if (container) {
              container.attachedToNodeId = null;
              container.attachOffsetX = null;
              container.attachOffsetY = null;
              console.log(`Detached container ${container.id}`);
          }
      } else {
          const node = this.selectedEntities.find(e => e.sourceType);
          if (!node || !container) {
            alert('To attach, select one node and one parent container (a rectangle).');
            return;
          }
          container.attachedToNodeId = node.id;
          container.attachOffsetX = container.x - node.x;
          container.attachOffsetY = container.y - node.y;
          console.log(`Attached container ${container.id} to node ${node.id}`);
          this.updateSelection([node, container], 'set');
      }
      this.updateUIState();
  }


  deleteSelection() {
    if (this.selectedEntities.length === 0 || !confirm(`Are you sure you want to delete ${this.selectedEntities.length} item(s)?`)) {
        return;
    }
    this.closeInspector();
    this.graphData.deleteEntities(this.selectedEntities);
    this.updateSelection([], 'set');
  }
  
  selectEntity(entity) {
    this.updateSelection(entity ? [entity] : [], 'set');
  }

  updateSelection(entities, mode = 'set') {
      const entityToId = (e) => e.id || e.source && `${e.source}->${e.target}` || `control-${e.edge.id}-${e.pointIndex}`;
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
      
      this.graphData.nodes.forEach(n => n.selected = false);
      this.graphData.edges.forEach(e => e.selected = false);
      this.graphData.decorations.forEach(d => d.selected = false);

      this.selectedEntities = finalSelection;
      const selectedIds = new Set(this.selectedEntities.map(e => entityToId(e)));
      
      this.selectedEntities.forEach(entity => {
          const underlyingEntity = entity.edge ? entity.edge : entity;
          if (underlyingEntity && 'id' in underlyingEntity) {
              const item = this.graphData.getEntityById(underlyingEntity.id);
              if (item) item.selected = true;
          } else if (underlyingEntity && 'source' in underlyingEntity) {
             underlyingEntity.selected = true;
          }
      });
      
      this.updateUIState();
  }
  
  updateUIState() {
      document.getElementById('deleteSelectionBtn').disabled = this.selectedEntities.length === 0;

      const groupBtn = document.getElementById('groupSelectionBtn');
      const attachBtn = document.getElementById('attachToNodeBtn');
      const decos = this.selectedEntities.filter(e => e.type);
      const nodes = this.selectedEntities.filter(e => e.sourceType);
      const container = this.selectedEntities.find(e => e.type === 'rectangle' && !e.parentId);
      
      // Grouping logic
      if (container && this.selectedEntities.length === 1 && this.graphData.decorations.some(d => d.parentId === container.id)) {
          groupBtn.textContent = 'Ungroup';
          groupBtn.disabled = this.decorationsLocked;
          groupBtn.title = 'Ungroup all items from this container';
      } else {
          groupBtn.textContent = 'Group';
          groupBtn.disabled = this.decorationsLocked || !(decos.length > 1 && container);
          groupBtn.title = 'To group, select one non-grouped rectangle and other decorations';
      }

      // Attaching logic
      if (container && container.attachedToNodeId) {
          attachBtn.textContent = 'Detach';
          attachBtn.disabled = this.decorationsLocked || this.selectedEntities.length > 1;
          attachBtn.title = 'Detach this container from its node';
      } else {
          attachBtn.textContent = 'Attach';
          attachBtn.disabled = this.decorationsLocked || !(nodes.length === 1 && container);
          attachBtn.title = 'Attach selected container to the selected node';
      }

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

    // Delegate HTML generation
    if (entity.sourceType) { // Node
        title.textContent = 'Node Properties';
        html = this._getNodeInspectorHtml(entity);
    } else if (entity.source) { // Edge
        title.textContent = 'Edge Properties';
        html = this._getEdgeInspectorHtml(entity);
    } else if (entity.type === 'rectangle') {
        title.textContent = 'Rectangle Properties';
        html = this._getRectangleInspectorHtml(entity);
    } else if (entity.type === 'markdown') {
        title.textContent = 'Markdown Block Properties';
        html = this._getMarkdownInspectorHtml(entity);
    }

    content.innerHTML = html;
    panel.classList.remove('hidden');
    
    // Setup dynamic logic after injecting HTML
    if (entity.sourceType) this._setupNodeInspectorLogic(entity);
    if (entity.type === 'markdown') this._setupMarkdownInspectorLogic(entity);
  }
  
  _getNodeInspectorHtml(entity) {
      return `<label for="nodeTitle">Title:</label><input type="text" id="nodeTitle" value="${entity.title||''}">
      <label>Source Type:</label><div class="toggle-switch"><button id="type-audio" class="${entity.sourceType==='audio'?'active':''}">Audio File</button><button id="type-iframe" class="${entity.sourceType==='iframe'?'active':''}">YouTube</button></div>
      <div id="audio-fields" class="${entity.sourceType==='audio'?'':'hidden'}"><label for="audioUrl">Audio URL:</label><input type="text" id="audioUrl" value="${entity.audioUrl||''}" placeholder="https://.../track.mp3"><label for="coverUrl">Cover URL (Data only):</label><input type="text" id="coverUrl" value="${entity.coverUrl||''}" placeholder="https://.../cover.jpg"></div>
      <div id="iframe-fields" class="${entity.sourceType==='iframe'?'':'hidden'}"><label for="iframeUrl">YouTube URL or Video ID:</label><input type="text" id="iframeUrlInput" value="${entity.iframeUrl||''}" placeholder="dQw4w9WgXcQ"></div>`;
  }
  
  _getEdgeInspectorHtml(entity) {
      return `<label for="edgeLabel">Label:</label><input type="text" id="edgeLabel" value="${entity.label||''}"><label for="edgeColor">Color:</label><input type="color" id="edgeColor" value="${entity.color||'#888888'}"><label for="edgeWidth">Line Width:</label><input type="number" id="edgeWidth" value="${entity.lineWidth||2}" min="1" max="10">`;
  }

  _getRectangleInspectorHtml(entity) {
      return `<label for="rectColor">Background Color:</label><input type="color" id="rectColor" value="${entity.backgroundColor}"><label for="rectWidth">Width:</label><input type="number" id="rectWidth" value="${entity.width}" min="10"><label for="rectHeight">Height:</label><input type="number" id="rectHeight" value="${entity.height}" min="10">`;
  }

  _getMarkdownInspectorHtml(entity) {
      return `
          <label for="textContent">Markdown Content:</label>
          <div class="markdown-toolbar">
              <button data-md="bold"><b>B</b></button>
              <button data-md="italic"><i>I</i></button>
              <button data-md="link">Link</button>
              <button data-md="image">Image</button>
          </div>
          <textarea id="textContent" rows="8">${entity.textContent || ''}</textarea>
          <label for="fontSize">Base Font Size (px):</label>
          <input type="number" id="fontSize" value="${entity.fontSize || 14}" min="8">
          <label for="rectWidth">Width:</label>
          <input type="number" id="rectWidth" value="${entity.width}" min="10">
          <label for="rectHeight">Height:</label>
          <input type="number" id="rectHeight" value="${entity.height}" min="10">
          <label for="bgColor">Background Color (CSS value):</label>
          <input type="text" id="bgColor" value="${entity.backgroundColor}" placeholder="e.g., #333 or rgba(45,45,45,0.8)">
      `;
  }

  _setupNodeInspectorLogic(node) {
      const audioBtn = document.getElementById('type-audio');
      const iframeBtn = document.getElementById('type-iframe');
      const audioFields = document.getElementById('audio-fields');
      const iframeFields = document.getElementById('iframe-fields');

      const setSourceType = (type) => {
          node.sourceType = type; // Temporarily update state for UI
          audioBtn.classList.toggle('active', type === 'audio');
          iframeBtn.classList.toggle('active', type === 'iframe');
          audioFields.classList.toggle('hidden', type !== 'audio');
          iframeFields.classList.toggle('hidden', type !== 'iframe');
      }

      audioBtn.addEventListener('click', () => setSourceType('audio'));
      iframeBtn.addEventListener('click', () => setSourceType('iframe'));
  }
  
  _setupMarkdownInspectorLogic() {
      const textarea = document.getElementById('textContent');
      document.querySelector('.markdown-toolbar').addEventListener('click', (e) => {
          if (e.target.tagName !== 'BUTTON') return;
          const type = e.target.dataset.md;
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const selectedText = textarea.value.substring(start, end);
          let replacement = '';

          switch (type) {
              case 'bold':
                  replacement = `**${selectedText || 'bold text'}**`;
                  break;
              case 'italic':
                  replacement = `*${selectedText || 'italic text'}*`;
                  break;
              case 'link':
                  const url = prompt('Enter link URL:', 'https://');
                  if (url) replacement = `[${selectedText || 'link text'}](${url})`;
                  break;
              case 'image':
                  const imgUrl = prompt('Enter image URL:', 'https://');
                  if (imgUrl) replacement = `![${selectedText || 'alt text'}](${imgUrl})`;
                  break;
          }
          if (replacement) {
              textarea.setRangeText(replacement, start, end, 'select');
              textarea.focus();
          }
      });
  }

  saveInspectorChanges() {
    if (!this.inspectedEntity) return;
    const entity = this.inspectedEntity;

    if (entity.sourceType) { // Node
        entity.title = document.getElementById('nodeTitle').value;
        const sourceType = document.querySelector('.toggle-switch button.active').id.split('-')[1];
        entity.sourceType = sourceType;
        if (sourceType === 'audio') {
            entity.audioUrl = document.getElementById('audioUrl').value || null;
            entity.coverUrl = document.getElementById('coverUrl').value || null;
            entity.iframeUrl = null;
        } else if (sourceType === 'iframe') {
            const userInput = document.getElementById('iframeUrlInput').value;
            entity.iframeUrl = this.graphData.parseYoutubeUrl(userInput) || null;
            entity.audioUrl = null;
            entity.coverUrl = null;
        }
    } else if (entity.source) { // Edge
        entity.label = document.getElementById('edgeLabel').value;
        entity.color = document.getElementById('edgeColor').value;
        entity.lineWidth = parseInt(document.getElementById('edgeWidth').value, 10);
    } else if (entity.type === 'rectangle') {
        entity.backgroundColor = document.getElementById('rectColor').value;
        entity.width = parseInt(document.getElementById('rectWidth').value, 10);
        entity.height = parseInt(document.getElementById('rectHeight').value, 10);
    } else if (entity.type === 'markdown') {
        entity.textContent = document.getElementById('textContent').value;
        entity.fontSize = parseInt(document.getElementById('fontSize').value, 10);
        entity.width = parseInt(document.getElementById('rectWidth').value, 10);
        entity.height = parseInt(document.getElementById('rectHeight').value, 10);
        entity.backgroundColor = document.getElementById('bgColor').value;
        this.renderer.refreshMarkdownOverlay(entity.id);
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
      
      const startPoint = this.renderer._getIntersectionWithNodeRect(startNode, position);
      const endPoint = this.renderer._getIntersectionWithNodeRect(endNode, position);

      const pathPoints = [ startPoint, ...edge.controlPoints, endPoint ];
      
      let closestSegmentIndex = 0; 
      let minDistance = Infinity;

      for (let i = 0; i < pathPoints.length - 1; i++) {
          const p1 = pathPoints[i], p2 = pathPoints[i+1];
          const len = Math.hypot(p2.x - p1.x, p2.y - p1.y);
          if (len === 0) continue;
          const dot = (((position.x - p1.x) * (p2.x - p1.x)) + ((position.y - p1.y) * (p2.y - p1.y))) / (len * len);
          
          const clampedDot = Math.max(0, Math.min(1, dot));
          const closestX = p1.x + (clampedDot * (p2.x - p1.x)); 
          const closestY = p1.y + (clampedDot * (p2.y - p1.y));
          const dist = Math.hypot(position.x - closestX, position.y - closestY);
          
          if (dist < minDistance) { 
            minDistance = dist; 
            closestSegmentIndex = i; 
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