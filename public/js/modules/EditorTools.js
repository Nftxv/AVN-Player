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

toggleAllNodes() {
    // Check if at least one node is currently expanded
    const isAnyNodeExpanded = this.graphData.nodes.some(node => !node.isCollapsed);
    const btn = document.getElementById('toggleAllNodesBtn');

    if (isAnyNodeExpanded) {
      // If any node is expanded, the action is to collapse all
      this.collapseAllNodes();
      btn.textContent = '➕';
      btn.title = 'Expand All Nodes';
    } else {
      // Otherwise, all are collapsed, so the action is to expand all
      this.expandAllNodes();
      btn.textContent = '➖';
      btn.title = 'Collapse All Nodes';
    }
  }
  
  toggleDecorationsLock() {
    this.decorationsLocked = !this.decorationsLocked;
    this.initLockState();

    if (this.decorationsLocked) {
      const nonDecorationSelection = this.selectedEntities.filter(e => e.sourceType || e.source);
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
        backgroundColor: '#2c3e50',
        parentId: null, attachedToNodeId: null,
    };
    this.graphData.decorations.push(newRect);
    this.selectEntity(newRect);
  }

  createText() {
    if (this.decorationsLocked) return;
    const center = this.renderer.getViewportCenter();
    const newText = {
        id: `deco-text-${Date.now()}`,
        type: 'markdown',
        x: center.x - 150, y: center.y - 50,
        width: 300, height: 100,
        textContent: '### New Block\n\nEdit content in the inspector.',
        fontSize: 14,
        backgroundColor: 'rgba(45, 45, 45, 0.85)',
        parentId: null,
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
  
  // REVISED: New intuitive grouping logic
  groupOrUngroupSelection() {
      const groupBtn = document.getElementById('groupSelectionBtn');
      const isUngroupAction = groupBtn.textContent === 'Ungroup';
      const decorations = this.selectedEntities.filter(e => e.type);

      if (isUngroupAction) {
          const container = decorations[0];
          if (!container) return;

          const children = this.graphData.decorations.filter(d => d.parentId === container.id);
          children.forEach(child => child.parentId = null);

          // Remove the container itself
          const index = this.graphData.decorations.findIndex(d => d.id === container.id);
          if(index > -1) this.graphData.decorations.splice(index, 1);
          
          this.updateSelection(children, 'set');
          console.log(`Ungrouped items. Container ${container.id} removed.`);

      } else { // Group action
          if (decorations.length < 2) {
              alert('To group, select at least two decorations.');
              return;
          }
          let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
          decorations.forEach(deco => {
              minX = Math.min(minX, deco.x);
              minY = Math.min(minY, deco.y);
              maxX = Math.max(maxX, deco.x + deco.width);
              maxY = Math.max(maxY, deco.y + deco.height);
          });
          const padding = 20;
          const container = {
              id: `deco-rect-group-${Date.now()}`,
              type: 'rectangle',
              x: minX - padding, y: minY - padding,
              width: (maxX - minX) + padding * 2,
              height: (maxY - minY) + padding * 2,
              backgroundColor: 'transparent',
              parentId: null,
              attachedToNodeId: null,
          };
          this.graphData.decorations.push(container);
          decorations.forEach(deco => deco.parentId = container.id);
          
          this.updateSelection([container], 'set');
          console.log(`Grouped ${decorations.length} items into new container ${container.id}`);
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

    const selectedIds = new Set(this.selectedEntities.map(e => e.id));
    const nodesToDelete = new Set(this.selectedEntities.filter(e => e.sourceType).map(n => n.id));
    
    // Ungroup children of deleted containers
    this.graphData.decorations.forEach(deco => {
        if (selectedIds.has(deco.parentId)) deco.parentId = null;
        if (nodesToDelete.has(deco.attachedToNodeId)) deco.attachedToNodeId = null;
    });

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
      const newSelectionMap = new Map();
      entities.forEach(e => { if(e) newSelectionMap.set(entityToId(e), e)});

      let finalSelection;
      
      if (mode === 'set') {
          finalSelection = Array.from(newSelectionMap.values());
      } else {
          const currentSelection = new Map(this.selectedEntities.map(e => [entityToId(e), e]));
          if (mode === 'add') {
              newSelectionMap.forEach((value, key) => {
                if (currentSelection.has(key)) currentSelection.delete(key); 
                else currentSelection.set(key, value);
              });
          } else if (mode === 'remove') {
              newSelectionMap.forEach((_value, key) => currentSelection.delete(key));
          }
          finalSelection = Array.from(currentSelection.values());
      }
      
      this.graphData.nodes.forEach(n => n.selected = false);
      this.graphData.edges.forEach(e => e.selected = false);
      this.graphData.decorations.forEach(d => d.selected = false);

      this.selectedEntities = finalSelection;
      const selectedIds = new Set(this.selectedEntities.map(e => entityToId(e)));
      
      this.selectedEntities.forEach(entity => {
          if (entity.sourceType) this.graphData.getNodeById(entity.id).selected = true;
          else if (entity.source) { /* Edge selection is tricky, handle via direct prop */ }
          else if (entity.type) this.graphData.getDecorationById(entity.id).selected = true;
      });
      this.graphData.edges.forEach(e => e.selected = selectedIds.has(entityToId(e)));
      
      this.updateUIState();
  }
  
  updateUIState() {
      document.getElementById('deleteSelectionBtn').disabled = this.selectedEntities.length === 0;

      const groupBtn = document.getElementById('groupSelectionBtn');
      const attachBtn = document.getElementById('attachToNodeBtn');
      const decos = this.selectedEntities.filter(e => e.type);
      const nodes = this.selectedEntities.filter(e => e.sourceType);
      
      const isSingleGroupSelected = decos.length === 1 && this.graphData.decorations.some(d => d.parentId === decos[0].id);

      if (isSingleGroupSelected) {
          groupBtn.textContent = 'Ungroup';
          groupBtn.disabled = false;
          groupBtn.title = 'Ungroup all items from this container';
      } else {
          groupBtn.textContent = 'Group';
          groupBtn.disabled = decos.length < 2;
          groupBtn.title = 'Group selected decorations into a new container';
      }
      
      const container = decos.find(e => e.type === 'rectangle' && !e.parentId);

      if (container && container.attachedToNodeId) {
          attachBtn.textContent = 'Detach';
          attachBtn.disabled = this.selectedEntities.length > 1;
          attachBtn.title = 'Detach this container from its node';
      } else {
          attachBtn.textContent = 'Attach';
          attachBtn.disabled = !(nodes.length === 1 && container);
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

    if (entity.sourceType) { // Node
        title.textContent = 'Node Properties';
        html = `<label for="nodeTitle">Title:</label><input type="text" id="nodeTitle" value="${entity.title||''}"><label>Source Type:</label><div class="toggle-switch"><button id="type-audio" class="${entity.sourceType==='audio'?'active':''}">Audio File</button><button id="type-iframe" class="${entity.sourceType==='iframe'?'active':''}">YouTube</button></div><div id="audio-fields" class="${entity.sourceType==='audio'?'':'hidden'}"><label for="audioUrl">Audio URL:</label><input type="text" id="audioUrl" value="${entity.audioUrl||''}" placeholder="https://.../track.mp3"><label for="coverUrl">Cover URL (Data only):</label><input type="text" id="coverUrl" value="${entity.coverUrl||''}" placeholder="https://.../cover.jpg"></div><div id="iframe-fields" class="${entity.sourceType==='iframe'?'':'hidden'}"><label for="iframeUrl">YouTube URL or Video ID:</label><input type="text" id="iframeUrlInput" value="${entity.iframeUrl||''}" placeholder="dQw4w9WgXcQ"></div>`;
    } else if (entity.source) { // Edge
        title.textContent = 'Edge Properties';
        html = `<label for="edgeLabel">Label:</label><input type="text" id="edgeLabel" value="${entity.label||''}"><label for="edgeColor">Color:</label><input type="color" id="edgeColor" value="${entity.color||'#888888'}"><label for="edgeWidth">Line Width:</label><input type="number" id="edgeWidth" value="${entity.lineWidth||2}" min="1" max="10">`;
    } else if (entity.type === 'rectangle') {
        const isTransparent = entity.backgroundColor === 'transparent';
        title.textContent = 'Rectangle Properties';
        html = `<label for="rectColor">Background Color:</label><input type="color" id="rectColor" value="${isTransparent ? '#2d2d2d' : entity.backgroundColor}"><button id="rectTransparentBtn" class="button-like" style="width:100%; margin-top: 5px; background-color: #555;">Set Transparent</button><label for="rectWidth">Width:</label><input type="number" id="rectWidth" value="${entity.width}" min="10"><label for="rectHeight">Height:</label><input type="number" id="rectHeight" value="${entity.height}" min="10">`;
    } else if (entity.type === 'markdown') {
        title.textContent = 'Markdown Block Properties';
        html = `
            <div class="markdown-toolbar">
                <button id="md-bold" title="Bold">B</button>
                <button id="md-italic" title="Italic" class="italic">I</button>
                <button id="md-link" title="Link">Link</button>
                <button id="md-image" title="Image">Img</button>
            </div>
            <label for="textContent">Markdown Content:</label>
            <textarea id="textContent" rows="8">${entity.textContent || ''}</textarea>
            <label for="fontSize">Font Size (px):</label>
            <input type="number" id="fontSize" value="${entity.fontSize || 14}" min="1">
            <label for="rectWidth">Width:</label>
            <input type="number" id="rectWidth" value="${entity.width}" min="10">
            <label for="rectHeight">Height:</label>
            <input type="number" id="rectHeight" value="${entity.height}" min="10">
            <label for="bgColor">Background Color:</label>
            <input type="text" id="bgColor" value="${entity.backgroundColor}" placeholder="e.g., #333 or rgba(45,45,45,0.8)">
        `;
    }

    content.innerHTML = html;
    panel.classList.remove('hidden');
    this._setupInspectorLogic(entity);
  }
  
  _setupInspectorLogic(entity) {
      if (entity.sourceType) {
          const audioBtn = document.getElementById('type-audio');
          const iframeBtn = document.getElementById('type-iframe');
          const audioFields = document.getElementById('audio-fields');
          const iframeFields = document.getElementById('iframe-fields');
          const setSourceType = (type) => {
              entity.sourceType = type;
              audioBtn.classList.toggle('active', type === 'audio');
              iframeBtn.classList.toggle('active', type === 'iframe');
              audioFields.classList.toggle('hidden', type !== 'audio');
              iframeFields.classList.toggle('hidden', type !== 'iframe');
          };
          audioBtn.addEventListener('click', () => setSourceType('audio'));
          iframeBtn.addEventListener('click', () => setSourceType('iframe'));
      } else if (entity.type === 'rectangle') {
          document.getElementById('rectTransparentBtn').addEventListener('click', () => {
              entity.backgroundColor = 'transparent';
              this.renderer.render();
          });
      } else if (entity.type === 'markdown') {
          const textarea = document.getElementById('textContent');
          const wrapSelection = (wrapper) => {
              const start = textarea.selectionStart, end = textarea.selectionEnd;
              const text = textarea.value;
              const selectedText = text.substring(start, end);
              const newText = `${text.substring(0, start)}${wrapper[0]}${selectedText}${wrapper[1]}${text.substring(end)}`;
              textarea.value = newText;
              textarea.focus();
              textarea.setSelectionRange(start + wrapper[0].length, end + wrapper[0].length);
          };
          const insertAtCursor = (content, selOffset = 0) => {
              const start = textarea.selectionStart;
              const text = textarea.value;
              textarea.value = text.substring(0, start) + content + text.substring(start);
              textarea.focus();
              textarea.setSelectionRange(start + selOffset, start + selOffset);
          };

          document.getElementById('md-bold').onclick = () => wrapSelection(['**', '**']);
          document.getElementById('md-italic').onclick = () => wrapSelection(['*', '*']);
          document.getElementById('md-link').onclick = () => {
              const url = prompt("Enter link URL:", "https://");
              if (url) {
                  const start = textarea.selectionStart, end = textarea.selectionEnd;
                  if (start !== end) wrapSelection([`[`, `](${url})`]);
                  else insertAtCursor(`[link text](${url})`, 1);
              }
          };
          document.getElementById('md-image').onclick = () => {
              const url = prompt("Enter image URL:", "https://");
              if (url) insertAtCursor(`\n![alt text](${url})\n`);
          };
      }
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
        this.renderer.updateMarkdownOverlay(entity.id);
    }
  }

  closeInspector() {
    if (this.inspectedEntity) {
        this.inspectedEntity.selected = false;
        this.inspectedEntity = null;
    }
    document.getElementById('inspectorPanel').classList.add('hidden');
  }
  
  addControlPointAt(edge, position) {
      if (!edge || !position) return;
      if (!edge.controlPoints) edge.controlPoints = [];

      const startNode = this.graphData.getNodeById(edge.source);
      const endNode = this.graphData.getNodeById(edge.target);
      
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