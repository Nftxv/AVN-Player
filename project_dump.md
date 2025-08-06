
## ./public/index.html

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AVN Player</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <canvas id="graphCanvas" title="Graph"></canvas>

  <!-- UNIFIED TOP TOOLBAR -->
  <div id="topToolbar">
    <!-- Mode Switcher (Always Visible) -->
    <label class="switch" title="Toggle Editor Mode">
      <input type="checkbox" id="editorModeToggle">
      <span class="slider"></span>
    </label>
    <span class="editor-mode-label">Editor Mode</span>
    <div class="divider"></div>

    <!-- Always Visible Buttons -->
    <button id="collapseAllBtn" title="Collapse All Nodes">Collapse All</button>
    <button id="expandAllBtn" title="Expand All Nodes">Expand All</button>
    <div class="divider"></div>

    <!-- Player Mode Controls -->
    <div id="playerModeControls">
      <button id="exportBtn">Export Graph</button>
      <button id="resetBtn">Reset</button>
    </div>

    <!-- Editor Mode Controls (hidden by default) -->
    <div id="editorModeControls">
      <button id="addNodeBtn" title="Add New Node">Add Node</button>
      <button id="deleteSelectionBtn" title="Delete Selected" disabled>Delete</button>
      <button id="settingsBtn" title="Global Settings">⚙️</button>
    </div>
  </div>

  <!-- Properties Inspector Panel (hidden) -->
  <div id="inspectorPanel" class="hidden">
      <h4>Node Properties</h4>
      <div id="inspectorContent"></div>
      <button id="saveNodeBtn">Save Changes</button>
      <button id="closeInspectorBtn">Close</button>
  </div>

  <!-- Global Settings Modal (hidden) -->
  <div id="settingsModal" class="hidden">
      <div class="modal-content">
          <h3>Global Settings</h3>
          <label for="ipfsGatewayInput">Default IPFS Gateway:</label>
          <input type="text" id="ipfsGatewayInput" placeholder="https://gateway.pinata.cloud/ipfs/">
          <div class="modal-buttons">
            <button id="saveSettingsBtn">Save</button>
            <button id="closeSettingsBtn">Cancel</button>
          </div>
      </div>
  </div>

  <!-- Main Player Interface -->
  <div id="player">
    <img id="currentCover" src="placeholder.svg" alt="Album cover">
    <div id="playerContent">
      <div id="songTitle">Select a node to begin...</div>
      <div id="playerControls">
        <button id="backBtn" title="Go Back">⏮</button>
        <button id="playBtn" title="Play/Pause">▶</button>
        <button id="nextBtn" title="Next">⏭</button>
        <input type="range" id="progress" value="0">
        <span id="currentTime">0:00</span>
        <button id="lyricsBtn" title="Show Lyrics">📜</button>
      </div>
    </div>
  </div>

  <!-- Lyrics Container (hidden) -->
  <div id="lyricsContainer" class="hidden">
    <pre id="lyricsText">Loading lyrics...</pre>
    <button id="closeLyricsBtn" title="Close">×</button>
  </div>

  <!-- Branching Choice Modal (hidden) -->
  <div id="choiceModal" class="hidden">
    <div class="modal-content">
      <h3>Choose the next step:</h3>
      <div id="choiceOptions"></div>
      <div id="choiceTimer" class="hidden">(Autoselecting in <span id="countdown">5</span>s)</div>
      <button id="closeModalBtn">Cancel</button>
    </div>
  </div>
  
  <script src="js/app.js" type="module"></script>

  <!-- Copyright Footer -->
  <footer id="copyright">
    AVN Player © 2025 Nftxv — <a href="https://AbyssVoid.com/" target="_blank">AbyssVoid.com</a>
  </footer>
</body>
</html>


## ./public/style.css

:root {
  --player-height: 80px;
  --primary-color: #4285f4;
  --primary-hover: #5a95f5;
  
  /* Цвета для темной темы */
  --dark-bg: #1e1e1e;
  --dark-surface: #2d2d2d;
  --dark-text: #e0e0e0;
  --dark-subtle-text: #9e9e9e;
  --dark-border: #424242;
}

body {
  margin: 0;
  overflow: hidden;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: var(--dark-bg); /* ИСПОЛЬЗУЕМ НОВЫЙ ФОН */
  color: var(--dark-text); /* Ставим светлый текст по умолчанию */
}

canvas {
  display: block;
  cursor: grab;
}
canvas:active {
  cursor: grabbing;
}

button, .button-like {
  padding: 8px 12px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  font-size: 14px;
}

button:hover, .button-like:hover {
  background: var(--primary-hover);
  transform: translateY(-1px);
}

#player {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: var(--player-height);
  background: rgba(45, 45, 45, 0.9); /* Темный фон для плеера */
  border-top: 1px solid var(--dark-border);
  padding: 10px 20px;
  display: flex;
  align-items: center;
  z-index: 100;
  gap: 15px;
}

#currentCover {
  width: 60px;
  height: 60px;
  border-radius: 5px;
  object-fit: cover;
  background-color: #333;
  flex-shrink: 0;
}

#playerContent {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  min-width: 0;
}

#songTitle {
  font-weight: 600;
  font-size: 1em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--dark-text); /* Светлый текст */
}

#playerControls {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

#progress { flex-grow: 1; }

#lyricsContainer {
  position: fixed;
  bottom: calc(var(--player-height) + 10px);
  left: 10px;
  right: 10px;
  max-height: 40vh;
  background: var(--dark-surface); /* Темный фон */
  border: 1px solid var(--dark-border);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
  z-index: 300;
  overflow-y: auto;
  padding: 20px;
  color: var(--dark-text); /* Светлый текст */
}
#closeLyricsBtn { color: var(--dark-text); }
#closeLyricsBtn:hover { color: #e74c3c; }


.hidden { display: none !important; }

/* Modal windows styling */
.modal-content {
  background: var(--dark-surface);
  padding: 25px;
  border-radius: 8px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 5px 25px rgba(0, 0, 0, 0.3);
  border: 1px solid var(--dark-border);
}
#choiceOptions button {
  background-color: #3c3c3c;
  color: var(--dark-text);
}
#choiceOptions button:hover {
  background-color: #4f4f4f;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  #player { height: auto; flex-direction: column; padding: 10px; gap: 10px; }
  #playerContent { width: 100%; }
  #songTitle { text-align: center; }
}

#copyright {
  position: fixed;
  bottom: 5px;
  right: 15px;
  font-size: 12px;
  color: var(--dark-subtle-text);
  z-index: 99;
}
#copyright a { color: var(--primary-color); text-decoration: none; }
#copyright a:hover { text-decoration: underline; }

/* Editor UI & Toolbar */
#topToolbar {
  position: fixed;
  top: 10px;
  left: 10px;
  background: rgba(45, 45, 45, 0.9); /* Темный фон */
  border: 1px solid var(--dark-border);
  padding: 8px;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.15);
  z-index: 200;
  display: flex;
  align-items: center;
  gap: 10px;
}
#playerModeControls, #editorModeControls { display: flex; gap: 10px; }
.editor-mode-label { user-select: none; font-size: 0.9em; color: var(--dark-subtle-text); }
.divider { width: 1px; height: 24px; background-color: var(--dark-border); margin: 0 5px; }

/* Switch Toggle */
.switch { position: relative; display: inline-block; width: 44px; height: 24px; }
.switch input { opacity: 0; width: 0; height: 0; }
.slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #424242; transition: .4s; border-radius: 24px; }
.slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: #e0e0e0; transition: .4s; border-radius: 50%; }
input:checked + .slider { background-color: var(--primary-color); }
input:checked + .slider:before { transform: translateX(20px); }

/* Properties Inspector Panel */
#inspectorPanel {
  position: fixed; top: 60px; right: 10px; width: 300px;
  max-height: calc(100vh - 80px); background: var(--dark-surface);
  border-radius: 8px; box-shadow: 0 5px 20px rgba(0,0,0,0.2);
  border: 1px solid var(--dark-border);
  z-index: 250; padding: 15px; overflow-y: auto;
  display: flex; flex-direction: column; gap: 10px;
}
#inspectorPanel h4 { margin-top: 0; }
#inspectorContent { display: flex; flex-direction: column; gap: 10px; }
#inspectorContent label { font-weight: bold; font-size: 0.9em; margin-bottom: -5px; }
#inspectorContent input {
  width: 95%; padding: 8px; border-radius: 4px;
  background-color: #3c3c3c;
  border: 1px solid #555;
  color: var(--dark-text);
}

/* Settings & Choice Modals */
#settingsModal, #choiceModal {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.6); z-index: 400; display: flex;
  justify-content: center; align-items: center; padding: 15px;
}
.modal-content {
  background: var(--dark-surface); padding: 25px; border-radius: 8px;
  border: 1px solid var(--dark-border);
  width: 100%; max-width: 400px; box-shadow: 0 5px 25px rgba(0,0,0,0.3);
}
.modal-content label { display: block; margin-bottom: 5px; }
.modal-content input {
  width: 95%; padding: 8px; margin-bottom: 15px;
  background-color: #3c3c3c; border: 1px solid #555; color: var(--dark-text);
}
.modal-buttons { display: flex; justify-content: flex-end; gap: 10px; }

/* Editor Mode Visibility Toggle LOGIC */
body:not(.editor-mode) #editorModeControls { display: none; }
body.editor-mode #playerModeControls { display: none; }
body.editor-mode #player { opacity: 0.5; pointer-events: none; }


## ./public/data/default.jsonld

{
  "@context": "https://schema.org/",
  "meta": {
    "gateways": [
      "https://cloudflare-ipfs.com/ipfs/"
    ]
  },
  "@graph": [
    {
      "@id": "node-1",
      "@type": "MusicRecording",
      "name": "Chapter 1: The Beginning",
      "position": { "x": 100, "y": 250 },
      "audioSources": [
        { "type": "ipfs", "value": "bafybeifx7yeb55armcsxwwitkymga5xf53dxiarykms3ygq42uhulbnnh4" }
      ],
      "coverSources": [
        { "type": "url", "value": "placeholder.svg" }
      ],
      "lyricsSource": { "type": "ipfs", "value": "bafkreifzjut3a2u7gy2g2l2ctrqkfdv3u4b2qkjk22p32d2c3k32y2y2yq" }
    },
    {
      "@id": "node-2",
      "@type": "MusicRecording",
      "name": "Chapter 2: The Choice",
      "position": { "x": 400, "y": 250 },
      "audioSources": [
        { "type": "ipfs", "value": "bafybeifx7yeb55armcsxwwitkymga5xf53dxiarykms3ygq42uhulbnnh4" }
      ],
      "coverSources": [
        { "type": "url", "value": "placeholder.svg" }
      ],
      "lyricsSource": null
    },
    {
      "@id": "node-3a",
      "@type": "MusicRecording",
      "name": "Ending A: The Bright Path",
      "position": { "x": 700, "y": 150 },
      "audioSources": [
        { "type": "ipfs", "value": "bafybeifx7yeb55armcsxwwitkymga5xf53dxiarykms3ygq42uhulbnnh4" }
      ],
      "coverSources": [
        { "type": "url", "value": "placeholder.svg" }
      ],
      "lyricsSource": null
    },
    {
      "@id": "node-3b",
      "@type": "MusicRecording",
      "name": "Ending B: The Dark Path",
      "position": { "x": 700, "y": 350 },
      "audioSources": [
        { "type": "ipfs", "value": "bafybeifx7yeb55armcsxwwitkymga5xf53dxiarykms3ygq42uhulbnnh4" }
      ],
      "coverSources": [
        { "type": "url", "value": "placeholder.svg" }
      ],
      "lyricsSource": null
    },
    {
      "@type": "Path",
      "source": "node-1",
      "target": "node-2",
      "label": "Continue the story"
    },
    {
      "@type": "Path",
      "source": "node-2",
      "target": "node-3a",
      "label": "Choose the light",
      "color": "#f1c40f"
    },
    {
      "@type": "Path",
      "source": "node-2",
      "target": "node-3b",
      "label": "Embrace the shadow",
      "color": "#9b59b6"
    }
  ]
}


## ./public/js/app.js

/**
 * AVN Player v1.5.03 - Main Application
 * by Nftxv
 */
import GraphData from './modules/GraphData.js';
import Renderer from './modules/Renderer.js';
import Player from './modules/Player.js';
import EditorTools from './modules/EditorTools.js';
import Navigation from './modules/Navigation.js';

class GraphApp {
  constructor() {
    this.graphData = new GraphData();
    this.renderer = new Renderer('graphCanvas');
    this.player = new Player(this.graphData);
    this.navigation = new Navigation(this.graphData, this.player, this.renderer);
    this.editorTools = new EditorTools(this.graphData, this.renderer);
    
    this.player.setNavigation(this.navigation);
    this.isEditorMode = false;
  }

  async init() {
    try {
      await this.graphData.load('data/default.jsonld');
      this.renderer.setData(this.graphData);
      await this.renderer.loadAndRenderAll();
      this.setupEventListeners();
      this.toggleEditorMode(false);
      console.log('Application initialized successfully.');
    } catch (error) {
      console.error('Initialization failed:', error);
      alert('Could not load the application.');
    }
  }

  toggleEditorMode(isEditor) {
    this.isEditorMode = isEditor;
    document.body.classList.toggle('editor-mode', isEditor);
    this.player.stop();
    this.navigation.reset();
    if (!isEditor) {
      this.editorTools.updateSelection([], 'set');
    }
  }

  setupEventListeners() {
    this.renderer.setupCanvasInteraction({
        getIsEditorMode: () => this.isEditorMode,
        onClick: (e) => this.handleCanvasClick(e),
        onDblClick: (e) => this.handleCanvasDblClick(e),
        onEdgeCreated: (source, target) => {
            if (this.isEditorMode) this.editorTools.createEdge(source, target);
        },
        onMarqueeSelect: (rect, ctrlKey, shiftKey) => {
            if (!this.isEditorMode) return;
            const nodes = this.renderer.getNodesInRect(rect);
            const edges = this.renderer.getEdgesInRect(rect, nodes);
            const mode = ctrlKey ? 'add' : (shiftKey ? 'remove' : 'set');
            this.editorTools.updateSelection([...nodes, ...edges], mode);
        },
        getSelection: () => this.editorTools.getSelection()
    });

    document.getElementById('editorModeToggle').addEventListener('change', (e) => this.toggleEditorMode(e.target.checked));
    
    document.getElementById('collapseAllBtn').addEventListener('click', () => this.editorTools.collapseAllNodes());
    document.getElementById('expandAllBtn').addEventListener('click', () => this.editorTools.expandAllNodes());

    document.getElementById('exportBtn').addEventListener('click', () => this.editorTools.exportGraph());
    document.getElementById('resetBtn').addEventListener('click', () => this.editorTools.resetGraph());
    
    document.getElementById('addNodeBtn').addEventListener('click', () => {
        const newNode = this.editorTools.createNode();
        this.editorTools.selectEntity(newNode);
    });
    document.getElementById('deleteSelectionBtn').addEventListener('click', () => {
        this.editorTools.deleteSelection();
    });
    
    document.getElementById('settingsBtn').addEventListener('click', () => this.editorTools.openSettings());
    document.getElementById('saveNodeBtn').addEventListener('click', () => this.editorTools.saveInspectorChanges());
    document.getElementById('closeInspectorBtn').addEventListener('click', () => this.editorTools.closeInspector());
    document.getElementById('saveSettingsBtn').addEventListener('click', () => this.editorTools.saveSettings());
    document.getElementById('closeSettingsBtn').addEventListener('click', () => this.editorTools.closeSettings());
    
    document.getElementById('playBtn').addEventListener('click', () => this.player.togglePlay());
    document.getElementById('backBtn').addEventListener('click', () => this.navigation.goBack());
    document.getElementById('nextBtn').addEventListener('click', () => this.navigation.advance());
  }

  handleCanvasClick(event) {
    if (this.renderer.wasDragged()) return;
    const coords = this.renderer.getCanvasCoords(event);
    const clicked = this.renderer.getClickableEntityAt(coords.x, coords.y);

    if (clicked && clicked.type === 'collapse_toggle') {
        clicked.entity.isCollapsed = !clicked.entity.isCollapsed;
        return;
    }

    if (this.isEditorMode) {
      const clickedEntity = clicked ? clicked.entity : null;
      let mode = 'set';
      if (event.ctrlKey) {
          mode = 'add';
      } else if (event.shiftKey) {
          mode = 'remove';
      }
      this.editorTools.updateSelection(clickedEntity ? [clickedEntity] : [], mode);

    } else { // Player mode
      if (clicked && clicked.type === 'node') {
        this.navigation.startFromNode(clicked.entity.id);
      }
    }
  }
  
  handleCanvasDblClick(event) {
    if (this.renderer.wasDragged()) return;
    const coords = this.renderer.getCanvasCoords(event);
    const clicked = this.renderer.getClickableEntityAt(coords.x, coords.y);
    
    if (clicked && clicked.type === 'node') {
        clicked.entity.isCollapsed = !clicked.entity.isCollapsed;
    } else if (this.isEditorMode && clicked && clicked.type === 'edge') {
        this.editorTools.addControlPointAt(clicked.entity, coords);
    }
  }
}

window.addEventListener('load', () => {
  const app = new GraphApp();
  app.init();
});


## ./public/js/modules/EditorTools.js

/**
 * AVN Player v1.5.01 - Editor Tools Module with Collapse/Expand
 * by Nftxv
 */
const NODE_WIDTH = 160;
const NODE_HEIGHT_EXPANDED = 180;

export default class EditorTools {
  constructor(graphData, renderer) {
    this.graphData = graphData;
    this.renderer = renderer;
    this.inspectedEntity = null;
    this.selectedEntities = [];
  }

  collapseAllNodes() {
    this.graphData.nodes.forEach(node => node.isCollapsed = true);
  }

  expandAllNodes() {
    this.graphData.nodes.forEach(node => node.isCollapsed = false);
  }

  createNode() {
    const center = this.renderer.getViewportCenter();
    const newNode = {
      id: `node-${Date.now()}`,
      title: 'New Node',
      x: center.x - NODE_WIDTH / 2,
      y: center.y - NODE_HEIGHT_EXPANDED / 2,
      isCollapsed: false, // Default to expanded
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

    this.graphData.edges.forEach(edge => {
        if (nodesToDelete.has(edge.source) || nodesToDelete.has(edge.target)) {
            edgesToDelete.add(edge);
        }
    });

    this.graphData.nodes = this.graphData.nodes.filter(n => !nodesToDelete.has(n.id));
    this.graphData.edges = this.graphData.edges.filter(e => !edgesToDelete.has(e));
    
    this.updateSelection([], 'set');
  }
  
  selectEntity(entity) {
    this.updateSelection(entity ? [entity] : [], 'set');
  }

  updateSelection(entities, mode = 'set') {
      const entityToId = (e) => e.source ? `${e.source}->${e.target}` : e.id;
      const newSelection = new Map(entities.map(e => [entityToId(e), e]));

      let finalSelection;

      if (mode === 'set') {
          finalSelection = Array.from(newSelection.values());
      } else {
          const currentSelection = new Map(this.selectedEntities.map(e => [entityToId(e), e]));
          if (mode === 'add') {
              newSelection.forEach((value, key) => {
                if (currentSelection.has(key)) { // If ctrl-clicking an already selected item, deselect it
                    currentSelection.delete(key);
                } else {
                    currentSelection.set(key, value);
                }
              });
          } else if (mode === 'remove') { // SHIFT
              newSelection.forEach((value, key) => currentSelection.delete(key));
          }
          finalSelection = Array.from(currentSelection.values());
      }
      
      this.selectedEntities = finalSelection;

      const selectedIds = new Set(this.selectedEntities.map(e => entityToId(e)));
      this.graphData.nodes.forEach(n => n.selected = selectedIds.has(entityToId(n)));
      this.graphData.edges.forEach(e => e.selected = selectedIds.has(entityToId(e)));
      
      this.updateUIState();
  }
  
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
    this.inspectedEntity = null;
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


## ./public/js/modules/GraphData.js

/**
 * Manages the graph's data, including loading, parsing, and providing access to nodes and edges.
 */
export default class GraphData {
  constructor() {
    this.nodes = [];
    this.edges = [];
    this.meta = {};
  }

  /**
   * Loads graph data from a given URL.
   * @param {string} url - The URL of the JSON/JSON-LD file.
   */
  async load(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to load graph: ${response.statusText}`);
    const data = await response.json();
    this.parseData(data);
  }

  /**
   * Parses the raw JSON-LD data and populates nodes, edges, and metadata.
   * @param {object} data - The raw data object from the JSON file.
   */
  parseData(data) {
    this.meta = data.meta || { gateways: ['https://cloudflare-ipfs.com/ipfs/'] };
    const graph = data['@graph'] || [];

    this.nodes = graph
      .filter(item => item['@type'] === 'MusicRecording')
      .map(node => ({
        id: node['@id'],
        title: node.name || 'Untitled',
        audioSources: node.audioSources || [],
        coverSources: node.coverSources || [],
        lyricsSource: node.lyricsSource,
        x: node.position?.x || Math.random() * 800,
        y: node.position?.y || Math.random() * 600,
        isCollapsed: node.isCollapsed === true, // Explicitly check for true
      }));

    this.edges = graph
      .filter(item => item['@type'] === 'Path')
      .map(edge => ({
        source: edge.source,
        target: edge.target,
        color: edge.color || '#888888',
        label: edge.label || '',
        lineWidth: edge.lineWidth || 2,
        controlPoints: edge.controlPoints || [],
      }));
  }

  /**
   * Serializes the current graph data back into a JSON-LD format for export.
   * @returns {object} - The complete graph object.
   */
  getGraph() {
    const graph = [
      ...this.nodes.map(n => ({
        '@id': n.id,
        '@type': 'MusicRecording',
        name: n.title,
        position: { x: n.x, y: n.y },
        isCollapsed: n.isCollapsed, // Save collapsed state
        audioSources: n.audioSources,
        coverSources: n.coverSources,
        lyricsSource: n.lyricsSource,
      })),
      ...this.edges.map(e => ({
        '@type': 'Path',
        source: e.source,
        target: e.target,
        color: e.color,
        label: e.label,
        lineWidth: e.lineWidth,
        controlPoints: e.controlPoints,
      }))
    ];
    return {
      '@context': 'https://schema.org/',
      meta: this.meta,
      '@graph': graph,
    };
  }

  getSourceUrl(source) {
    if (!source) return null;
    if (source.type === 'ipfs') {
      const gateway = this.meta.gateways?.[0] || 'https://ipfs.io/ipfs/';
      return `${gateway}${source.value}`;
    }
    return source.value;
  }

  getNodeById(id) {
    return this.nodes.find(node => node.id === id);
  }
  
  getEdgesFromNode(nodeId) {
    return this.edges.filter(edge => edge.source === nodeId);
  }
}


## ./public/js/modules/Navigation.js

/**
 * Manages the user's journey through the graph, handling history and branching choices.
 */
export default class Navigation {
  constructor(graphData, player, renderer) {
    this.graphData = graphData;
    this.player = player;
    this.renderer = renderer;
    this.reset();
  }

  reset() {
    this.currentNode = null;
    this.history = [];
    // Clear all highlights
    this.graphData.nodes.forEach(n => n.highlighted = false);
    this.graphData.edges.forEach(e => e.highlighted = false);
  }

  startFromNode(nodeId) {
    if(this.currentNode?.id === nodeId) return; // Don't restart if clicking the same node
    
    const node = this.graphData.getNodeById(nodeId);
    if (!node) return;
    
    const prevNodeId = this.currentNode?.id;
    this.currentNode = node;
    this.history = [nodeId]; // Start new history path
    
    this.renderer.highlight(nodeId, prevNodeId);
    this.player.play(node);
  }

  async advance() {
    if (!this.currentNode) return;
    
    const options = this.graphData.getEdgesFromNode(this.currentNode.id);
    if (options.length === 0) {
      console.log("End of path.");
      this.player.stop();
      this.renderer.highlight(null, this.currentNode.id);
      this.currentNode = null;
      return;
    }
    
    let nextEdge;
    if (options.length === 1) {
      nextEdge = options[0];
    } else {
      nextEdge = await this.promptForChoice(options);
      if (!nextEdge) return; // User canceled the choice
    }
    this.transitionToEdge(nextEdge);
  }
  
  goBack() {
    if (this.history.length < 2) return; // Can't go back from the first node
    
    this.history.pop(); // Remove current node
    const prevNodeId = this.history[this.history.length - 1]; // Get the new last node
    const prevNode = this.graphData.getNodeById(prevNodeId);

    if (prevNode) {
        const oldNodeId = this.currentNode.id;
        this.currentNode = prevNode;
        // Find the edge that led to the old node to highlight it
        const edge = this.graphData.getEdgesFromNode(prevNodeId).find(e => e.target === oldNodeId);
        this.renderer.highlight(prevNodeId, oldNodeId, edge);
        this.player.play(prevNode);
    }
  }

  transitionToEdge(edge) {
    const prevNodeId = this.currentNode.id;
    const nextNode = this.graphData.getNodeById(edge.target);
    this.currentNode = nextNode;
    this.history.push(nextNode.id);
    
    this.renderer.highlight(nextNode.id, prevNodeId, edge);
    this.player.play(nextNode);
  }

  promptForChoice(options) {
    return new Promise((resolve) => {
      const modal = document.getElementById('choiceModal');
      const optionsContainer = document.getElementById('choiceOptions');
      const closeModalBtn = document.getElementById('closeModalBtn');
      optionsContainer.innerHTML = ''; // Clear previous options

      const onChoose = (edge) => {
        cleanup();
        resolve(edge);
      };
      
      const closeHandler = () => {
        cleanup();
        resolve(null); // Resolve with null if closed/canceled
      };

      const cleanup = () => {
          modal.classList.add('hidden');
          closeModalBtn.removeEventListener('click', closeHandler);
          // Remove all created buttons and their listeners
          while (optionsContainer.firstChild) {
              optionsContainer.removeChild(optionsContainer.firstChild);
          }
      }
      
      options.forEach(edge => {
        const button = document.createElement('button');
        const targetNode = this.graphData.getNodeById(edge.target);
        button.textContent = edge.label || targetNode?.title || 'Untitled Path';
        button.onclick = () => onChoose(edge);
        optionsContainer.appendChild(button);
      });
      
      closeModalBtn.addEventListener('click', closeHandler);
      modal.classList.remove('hidden');
    });
  }
}


## ./public/js/modules/Player.js

/**
 * AVN Player v1.4
 * by Nftxv
 *
 * Copyright (c) 2025 Nftxv - https://AbyssVoid.com/
 *
 * This source code is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0
 * International License (CC BY-NC-SA 4.0).
 *
 * You can find the full license text at:
 * https://creativecommons.org/licenses/by-nc-sa/4.0/
 */

/**
 * Manages audio playback, player UI updates, and lyrics loading.
 */
export default class Player {
  constructor(graphData) {
    this.graphData = graphData;
    this.audio = new Audio();
    this.navigation = null;
    this.currentNode = null;
    this.setupEventListeners();
  }

  setNavigation(navigation) { this.navigation = navigation; }

  /**
   * Finds the first available URL from a list of sources.
   * @param {Array<object>} sources - Array of source objects ({type, value}).
   * @returns {Promise<string|null>} - A playable URL or null.
   */
  async findPlayableUrl(sources) {
    if (!sources || sources.length === 0) return null;
    for (const source of sources) {
      let url;
      if (source.type === 'ipfs') {
        const gateway = this.graphData.meta.gateways?.[0] || 'https://ipfs.io/ipfs/';
        url = `${gateway}${source.value}`;
      } else if (source.type === 'url') {
        url = source.value;
      } else continue;
      
      try {
        // Use a HEAD request to quickly check if the resource is available
        const response = await fetch(url, { method: 'HEAD', mode: 'cors' });
        if (response.ok) {
          console.log(`Source available: ${url}`);
          return url;
        }
      } catch (e) {
        console.warn(`Source failed: ${url}`, e.message);
      }
    }
    return null;
  }

  /**
   * Plays a given node.
   * @param {object} node - The graph node to play.
   */
  async play(node) {
    if (!node) return;
    this.currentNode = node;

    const audioUrl = await this.findPlayableUrl(node.audioSources);
    const coverUrl = await this.findPlayableUrl(node.coverSources);

    document.getElementById('songTitle').textContent = node.title;
    document.getElementById('currentCover').src = coverUrl || 'placeholder.svg';
    
    if (!audioUrl) {
      alert(`Could not load audio for "${node.title}".`);
      document.getElementById('playBtn').textContent = '▶';
      return;
    }
    
    document.getElementById('playBtn').textContent = '⏸';
    if (this.audio.src !== audioUrl) this.audio.src = audioUrl;
    this.audio.play().catch(e => console.error("Playback error:", e));
    
    // Asynchronously load lyrics
    this.loadAndShowLyrics(node.lyricsSource);
  }

  togglePlay() {
    if (!this.currentNode) return; // Don't do anything if no track is loaded
    if (this.audio.paused) {
      this.audio.play();
      document.getElementById('playBtn').textContent = '⏸';
    } else {
      this.audio.pause();
      document.getElementById('playBtn').textContent = '▶';
    }
  }

  stop() {
    this.audio.pause();
    this.audio.currentTime = 0;
    this.currentNode = null;
    document.getElementById('playBtn').textContent = '▶';
    document.getElementById('songTitle').textContent = 'Select a node to begin...';
    document.getElementById('currentCover').src = 'placeholder.svg';
    document.getElementById('progress').value = 0;
    document.getElementById('currentTime').textContent = '0:00';
  }

  /**
   * Loads lyrics from a source and populates the lyrics container.
   * @param {object} source - The source object for the lyrics file.
   */
  async loadAndShowLyrics(source) {
      const lyricsTextElem = document.getElementById('lyricsText');
      lyricsTextElem.textContent = 'Loading lyrics...'; // Reset text
      if (!source || !source.value) {
          lyricsTextElem.textContent = 'No lyrics available for this track.';
          return;
      }
      
      // We don't need findPlayableUrl here as it's just a text file
      const url = source.type === 'ipfs' 
        ? `${this.graphData.meta.gateways[0]}${source.value}` 
        : source.value;

      try {
          const response = await fetch(url);
          if(!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          const text = await response.text();
          lyricsTextElem.textContent = text;
      } catch (e) {
          lyricsTextElem.textContent = 'Could not load lyrics.';
          console.error('Lyrics loading failed:', e);
      }
  }

  setupEventListeners() {
    this.audio.addEventListener('timeupdate', () => this.updateProgress());
    this.audio.addEventListener('ended', () => {
      if (this.navigation) this.navigation.advance();
    });
    
    document.getElementById('progress').addEventListener('input', e => {
        if (this.audio.duration) {
            this.audio.currentTime = (e.target.value / 100) * this.audio.duration;
        }
    });

    const lyricsContainer = document.getElementById('lyricsContainer');
    document.getElementById('lyricsBtn').addEventListener('click', () => {
        lyricsContainer.classList.remove('hidden');
    });
    document.getElementById('closeLyricsBtn').addEventListener('click', () => {
        lyricsContainer.classList.add('hidden');
    });
  }
  
  updateProgress() {
    const progress = document.getElementById('progress');
    const currentTimeElem = document.getElementById('currentTime');
    if (this.audio.duration) {
      progress.value = (this.audio.currentTime / this.audio.duration) * 100;
      const mins = Math.floor(this.audio.currentTime / 60);
      const secs = Math.floor(this.audio.currentTime % 60);
      currentTimeElem.textContent = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
  }
}


## ./public/js/modules/Renderer.js

/**
 * AVN Player v1.5.03 - Renderer Module with Anchor Fixes
 * by Nftxv
 */
const NODE_WIDTH = 200;
const NODE_HEIGHT_COLLAPSED = 45;
const NODE_HEIGHT_EXPANDED = 225;
const TOGGLE_ICON_SIZE = 16;

export default class Renderer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    
    this.graphData = null; 
    this.images = {};

    this.offset = { x: 0, y: 0 };
    this.scale = 1.0;
    this.dragStart = { x: 0, y: 0 };
    this.dragged = false;
    this.dragging = false;
    this.draggingNode = null;
    this.dragNodeOffset = { x: 0, y: 0 };
    this.draggingControlPoint = null;
    this.isCreatingEdge = false;
    this.edgeCreationSource = null;
    this.mousePos = { x: 0, y: 0 };
    this.snapThreshold = 10;
    this.snapLines = [];
    this.isMarqueeSelecting = false;
    this.marqueeRect = { x: 0, y: 0, w: 0, h: 0 };
    this.isDraggingSelection = false;

    this.resizeCanvas();
    this.renderLoop = this.renderLoop.bind(this);
  }

  setData(graphData) {
    this.graphData = graphData;
  }

  async loadAndRenderAll() {
    if (!this.graphData) return;
    await this.loadImages();
    this.renderLoop();
  }

  async loadImages() {
    const promises = this.graphData.nodes.flatMap(node =>
      (node.coverSources || []).map(async source => {
        const url = this.getSourceUrl(source);
        if (url && !this.images[url]) {
          try {
            const img = new Image();
            img.src = url;
            await img.decode();
            this.images[url] = img;
          } catch (e) {
            console.warn(`Failed to load cover image: ${url}`, e);
          }
        }
      })
    );
    await Promise.all(promises);
  }

  getSourceUrl(source) {
    if (!source) return null;
    const gateway = this.graphData.meta.gateways?.[0] || 'https://ipfs.io/ipfs/';
    return source.type === 'ipfs' ? `${gateway}${source.value}` : source.value;
  }
  
  getViewportCenter() {
      const worldX = (this.canvas.width / 2 - this.offset.x) / this.scale;
      const worldY = (this.canvas.height / 2 - this.offset.y) / this.scale;
      return { x: worldX, y: worldY };
  }

  _getNodeVisualRect(node) {
      if (node.isCollapsed) {
          return {
              x: node.x,
              y: node.y,
              width: NODE_WIDTH,
              height: NODE_HEIGHT_COLLAPSED
          };
      } else {
          const y = node.y - (NODE_HEIGHT_EXPANDED - NODE_HEIGHT_COLLAPSED) / 2;
          return {
              x: node.x,
              y: y,
              width: NODE_WIDTH,
              height: NODE_HEIGHT_EXPANDED
          };
      }
  }
  
  getClickableEntityAt(x, y) {
    for (let i = this.graphData.nodes.length - 1; i >= 0; i--) {
        const node = this.graphData.nodes[i];
        const rect = this._getNodeVisualRect(node);
        
        const iconX = rect.x + NODE_WIDTH - TOGGLE_ICON_SIZE - 4;
        const iconY = rect.y + rect.height - TOGGLE_ICON_SIZE - 4;
        if (x > iconX && x < iconX + TOGGLE_ICON_SIZE && y > iconY && y < iconY + TOGGLE_ICON_SIZE) {
            return { type: 'collapse_toggle', entity: node };
        }

        if (x > rect.x && x < rect.x + rect.width && y > rect.y && y < rect.y + rect.height) {
            return { type: 'node', entity: node };
        }
    }

    const edge = this.getEdgeAt(x, y);
    if (edge) {
      return { type: 'edge', entity: edge };
    }

    return null;
  }
  
  getNodeAt(x, y) {
    for (let i = this.graphData.nodes.length - 1; i >= 0; i--) {
        const node = this.graphData.nodes[i];
        const rect = this._getNodeVisualRect(node);
        if (x > rect.x && x < rect.x + rect.width && y > rect.y && y < rect.y + rect.height) return node;
    }
    return null;
  }
  
  getNodesInRect(rect) {
    const normalizedRect = this.normalizeRect(rect);
    return this.graphData.nodes.filter(node => {
        const nodeRect = this._getNodeVisualRect(node);
        return (
            nodeRect.x >= normalizedRect.x &&
            nodeRect.y >= normalizedRect.y &&
            nodeRect.x + nodeRect.width <= normalizedRect.x + normalizedRect.w &&
            nodeRect.y + nodeRect.height <= normalizedRect.y + normalizedRect.h
        );
    });
  }

  getEdgesInRect(rect, nodesInRect) {
      const nodeIdsInRect = new Set(nodesInRect.map(n => n.id));
      return this.graphData.edges.filter(edge => {
          return nodeIdsInRect.has(edge.source) && nodeIdsInRect.has(edge.target);
      });
  }
  
  normalizeRect(rect) {
      return {
          x: rect.w < 0 ? rect.x + rect.w : rect.x,
          y: rect.h < 0 ? rect.y + rect.h : rect.y,
          w: Math.abs(rect.w),
          h: Math.abs(rect.h)
      };
  }

  getControlPointAt(x, y) {
      const tolerance = 8 / this.scale;
      for (const edge of this.graphData.edges) {
          for (let i = 0; i < (edge.controlPoints || []).length; i++) {
              const point = edge.controlPoints[i];
              if (Math.hypot(x - point.x, y - point.y) < tolerance) {
                  return { edge, pointIndex: i };
              }
          }
      }
      return null;
  }

  getEdgeAt(x, y) {
    const tolerance = 10 / this.scale;
    for (const edge of this.graphData.edges) {
        const src = this.graphData.nodes.find(n => n.id === edge.source);
        const trg = this.graphData.nodes.find(n => n.id === edge.target);
        if (!src || !trg) continue;
        
        const startPoint = { x: src.x + NODE_WIDTH / 2, y: src.y + NODE_HEIGHT_COLLAPSED / 2 };

        const controlPoints = edge.controlPoints || [];
        const lastPathPoint = controlPoints.length > 0 ? controlPoints.at(-1) : startPoint;
        const intersection = this._getIntersectionWithNodeRect(trg, lastPathPoint);
        const pathPoints = [startPoint, ...controlPoints, intersection];
        for (let i = 0; i < pathPoints.length - 1; i++) {
            const p1 = pathPoints[i], p2 = pathPoints[i + 1];
            const len = Math.hypot(p2.x - p1.x, p2.y - p1.y);
            if (len < 1) continue;
            const dot = (((x - p1.x) * (p2.x - p1.x)) + ((y - p1.y) * (p2.y - p1.y))) / (len * len);
            if (dot >= 0 && dot <= 1) {
                const closestX = p1.x + (dot * (p2.x - p1.x));
                const closestY = p1.y + (dot * (p2.y - p1.y));
                if (Math.hypot(x - closestX, y - closestY) < tolerance) return edge;
            }
        }
    }
    return null;
  }

  renderLoop() {
    if (!this.graphData) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.save();
    this.ctx.translate(this.offset.x, this.offset.y);
    this.ctx.scale(this.scale, this.scale);
    
    this.graphData.edges.forEach(edge => this.drawEdge(edge));
    this.graphData.nodes.forEach(node => this.drawNode(node));
    if (this.isCreatingEdge) this.drawTemporaryEdge();
    if (this.isMarqueeSelecting) this.drawMarquee();
    
    this._drawSnapGuides();
    this.ctx.restore();
    requestAnimationFrame(this.renderLoop);
  }

  drawEdge(edge) {
      const src = this.graphData.nodes.find(n => n.id === edge.source);
      const trg = this.graphData.nodes.find(n => n.id === edge.target);
      if (!src || !trg) return;
      const ctx = this.ctx; ctx.save();
      let color = edge.color || '#888888';
      if (edge.selected) color = '#e74c3c';
      if (edge.highlighted) color = '#FFD700';
      const edgeLineWidth = edge.lineWidth || 2;
      const lineWidth = edge.selected || edge.highlighted ? edgeLineWidth + 1 : edgeLineWidth;
      const arrowSize = 6 + edgeLineWidth * 2.5;
      const controlPoints = edge.controlPoints || [];
      
      const startPoint = { x: src.x + NODE_WIDTH / 2, y: src.y + NODE_HEIGHT_COLLAPSED / 2 };
      
      const lastPathPoint = controlPoints.length > 0 ? controlPoints.at(-1) : startPoint;
      const intersection = this._getIntersectionWithNodeRect(trg, lastPathPoint);
      const pathPoints = [startPoint, ...controlPoints, intersection];
      
      ctx.beginPath();
      ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
      for (let i = 1; i < pathPoints.length; i++) ctx.lineTo(pathPoints[i].x, pathPoints[i].y);
      ctx.strokeStyle = color; ctx.lineWidth = lineWidth; ctx.stroke();
      
      const midPointForArrow = pathPoints[pathPoints.length-1];
      const secondLastPoint = pathPoints.length > 1 ? pathPoints[pathPoints.length-2] : startPoint;
      const angle = Math.atan2(midPointForArrow.y - secondLastPoint.y, midPointForArrow.x - secondLastPoint.x);
      this._drawArrow(midPointForArrow.x, midPointForArrow.y, angle, color, arrowSize);

      controlPoints.forEach(point => {
          ctx.beginPath();
          ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
          ctx.fillStyle = color;
          ctx.fill();
      });
      if (edge.label) {
        const midIndex = Math.floor((pathPoints.length - 2) / 2);
        const p1 = pathPoints[midIndex], p2 = pathPoints[midIndex + 1];
        ctx.font = '12px Segoe UI'; ctx.fillStyle = '#FFFFFF'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        ctx.save();
        ctx.translate((p1.x + p2.x)/2, (p1.y + p2.y)/2);
        const rotationAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        if (rotationAngle > Math.PI / 2 || rotationAngle < -Math.PI / 2) ctx.rotate(rotationAngle + Math.PI); else ctx.rotate(rotationAngle);
        ctx.fillText(edge.label, 0, -8);
        ctx.restore();
      }
      ctx.restore();
  }
  
  _fitText(text, maxWidth) {
      if (this.ctx.measureText(text).width <= maxWidth) {
          return text;
      }
      while (this.ctx.measureText(text + '...').width > maxWidth && text.length > 0) {
          text = text.slice(0, -1);
      }
      return text + '...';
  }

  drawNode(node) {
    const ctx = this.ctx;
    const rect = this._getNodeVisualRect(node);
    
    ctx.save();
    
    // Node Body
    ctx.fillStyle = '#2d2d2d';
    ctx.beginPath();
    ctx.roundRect(rect.x, rect.y, rect.width, rect.height, 8);
    ctx.fill();
    
    // Border
    if (node.selected) { ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 3; }
    else if (node.highlighted) { ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 3; }
    else { ctx.strokeStyle = '#424242'; ctx.lineWidth = 1; }
    ctx.stroke();

    // Content Area
    if (!node.isCollapsed) {
        const coverUrl = this.getSourceUrl(node.coverSources?.[0]);
        const contentHeight = 150;
        if (coverUrl && this.images[coverUrl]) {
            ctx.drawImage(this.images[coverUrl], rect.x + 10, rect.y + 10, NODE_WIDTH - 20, contentHeight);
        } else {
            ctx.fillStyle = '#1e1e1e';
            ctx.fillRect(rect.x + 10, rect.y + 10, NODE_WIDTH - 20, contentHeight);
        }
    }
    
    // Title
    ctx.fillStyle = '#e0e0e0';
    ctx.font = '14px Segoe UI';
    ctx.textAlign = 'center';
    const titleMaxWidth = NODE_WIDTH - 30;
    const fittedTitle = this._fitText(node.title, titleMaxWidth);
    
    const titleY = node.isCollapsed 
        ? rect.y + rect.height / 2
        : rect.y + 175;
    ctx.textBaseline = node.isCollapsed ? 'middle' : 'top';
    ctx.fillText(fittedTitle, rect.x + NODE_WIDTH / 2, titleY);

    // Toggle Icon
    const iconX = rect.x + NODE_WIDTH - TOGGLE_ICON_SIZE - 6;
    const iconY = rect.y + rect.height - TOGGLE_ICON_SIZE - 6;
    ctx.strokeStyle = '#9e9e9e';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(iconX + 4, iconY + TOGGLE_ICON_SIZE / 2);
    ctx.lineTo(iconX + TOGGLE_ICON_SIZE - 4, iconY + TOGGLE_ICON_SIZE / 2);
    if (node.isCollapsed) {
      ctx.moveTo(iconX + TOGGLE_ICON_SIZE / 2, iconY + 4);
      ctx.lineTo(iconX + TOGGLE_ICON_SIZE / 2, iconY + TOGGLE_ICON_SIZE - 4);
    }
    ctx.stroke();

    ctx.restore();
  }
  
  drawMarquee() {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = 'rgba(70, 130, 180, 0.2)';
    ctx.fillRect(this.marqueeRect.x, this.marqueeRect.y, this.marqueeRect.w, this.marqueeRect.h);
    ctx.strokeStyle = 'rgba(70, 130, 180, 0.8)';
    ctx.lineWidth = 1 / this.scale;
    ctx.setLineDash([5 / this.scale, 3 / this.scale]);
    ctx.strokeRect(this.marqueeRect.x, this.marqueeRect.y, this.marqueeRect.w, this.marqueeRect.h);
    ctx.restore();
  }

  _drawArrow(x, y, angle, color, size) {
      this.ctx.save(); this.ctx.translate(x, y); this.ctx.rotate(angle);
      this.ctx.beginPath(); this.ctx.moveTo(0, 0); this.ctx.lineTo(-size, -size * 0.4);
      this.ctx.lineTo(-size, size * 0.4); this.ctx.closePath(); this.ctx.fillStyle = color; this.ctx.fill(); this.ctx.restore();
  }
  
  _getIntersectionWithNodeRect(node, externalPoint) {
      const rect = this._getNodeVisualRect(node);
      const halfW = rect.width / 2, halfH = rect.height / 2;
      const cx = rect.x + halfW, cy = rect.y + halfH;
      const dx = externalPoint.x - cx, dy = externalPoint.y - cy;
      if (dx === 0 && dy === 0) return {x: cx, y: cy};
      const angle = Math.atan2(dy, dx);
      const tan = Math.tan(angle); let x, y;
      if (Math.abs(halfH * dx) > Math.abs(halfW * dy)) { x = cx + Math.sign(dx) * halfW; y = cy + Math.sign(dx) * halfW * tan; }
      else { y = cy + Math.sign(dy) * halfH; x = cx + Math.sign(dy) * halfH / tan; }
      return { x, y };
  }
  
  drawTemporaryEdge() {
    const ctx = this.ctx;
    const startX = this.edgeCreationSource.x + NODE_WIDTH / 2;
    const startY = this.edgeCreationSource.y + NODE_HEIGHT_COLLAPSED / 2;
    ctx.save(); ctx.beginPath(); ctx.moveTo(startX, startY); ctx.lineTo(this.mousePos.x, this.mousePos.y);
    ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 3; ctx.setLineDash([5, 5]); ctx.stroke(); ctx.restore();
  }
  
  highlight(currentId, prevId = null, edge = null) {
      this.graphData.nodes.forEach(n => n.highlighted = false); this.graphData.edges.forEach(e => e.highlighted = false);
      if (currentId) { const node = this.graphData.nodes.find(n => n.id === currentId); if (node) node.highlighted = true; }
      if (edge) { const e = this.graphData.edges.find(i => i === edge); if (e) e.highlighted = true; }
  }
  
  getCanvasCoords({ clientX, clientY }) {
      const rect = this.canvas.getBoundingClientRect();
      const x = (clientX - rect.left - this.offset.x) / this.scale;
      const y = (clientY - rect.top - this.offset.y) / this.scale;
      return { x, y };
  }
  
  resizeCanvas() { this.canvas.width = window.innerWidth; this.canvas.height = window.innerHeight; }
  
  wasDragged() { return this.dragged; }
  
  _getSnappedPosition(pos, ignoredEntity = null) {
      let snappedPos = { ...pos }; this.snapLines = []; const threshold = this.snapThreshold / this.scale;
      const snapTargets = [];
      this.graphData.nodes.forEach(n => {
          if (n !== ignoredEntity && !n.selected) {
            const rect = this._getNodeVisualRect(n);
            snapTargets.push({ x: rect.x, y: rect.y, w: rect.width, h: rect.height, type: 'node' });
          }
      });
      this.graphData.edges.forEach(e => {
          (e.controlPoints || []).forEach(p => { if (p !== ignoredEntity) snapTargets.push({ x: p.x, y: p.y, type: 'point' }); });
      });
      let snapX = false, snapY = false;
      for (const target of snapTargets) {
          if (target.type === 'node') {
              const targetCenterX = target.x + target.w / 2;
              const targetCenterY = target.y + target.h / 2;
              if (Math.abs(pos.x - targetCenterX) < threshold) { snappedPos.x = targetCenterX; snapX = true; }
              if (Math.abs(pos.y - targetCenterY) < threshold) { snappedPos.y = targetCenterY; snapY = true; }
          } else {
              if (Math.abs(pos.x - target.x) < threshold) { snappedPos.x = target.x; snapX = true; }
              if (Math.abs(pos.y - target.y) < threshold) { snappedPos.y = target.y; snapY = true; }
          }
      }
      if (snapX) this.snapLines.push({ type: 'v', pos: snappedPos.x });
      if (snapY) this.snapLines.push({ type: 'h', pos: snappedPos.y });
      return snappedPos;
  }
  
  _drawSnapGuides() {
      const ctx = this.ctx; ctx.save(); ctx.strokeStyle = 'rgba(255, 0, 255, 0.7)'; ctx.lineWidth = 1 / this.scale;
      ctx.setLineDash([5 / this.scale, 5 / this.scale]);
      this.snapLines.forEach(line => {
          ctx.beginPath();
          if (line.type === 'v') { ctx.moveTo(line.pos, -this.offset.y / this.scale); ctx.lineTo(line.pos, (this.canvas.height - this.offset.y) / this.scale); }
          else { ctx.moveTo(-this.offset.x / this.scale, line.pos); ctx.lineTo((this.canvas.width - this.offset.x) / this.scale, line.pos); }
          ctx.stroke();
      });
      ctx.restore();
  }
  
  setupCanvasInteraction(callbacks) {
    const { getIsEditorMode, onClick, onDblClick, onEdgeCreated, onMarqueeSelect, getSelection } = callbacks;

    window.addEventListener('resize', () => this.resizeCanvas());
    this.canvas.addEventListener('contextmenu', e => e.preventDefault());
    
    this.canvas.addEventListener('mousedown', (e) => {
        const isEditor = getIsEditorMode();
        const mousePos = this.getCanvasCoords(e);
        this.dragged = false;

        if (!isEditor) {
            if (e.button === 0) {
                this.dragging = true;
                this.dragStart.x = e.clientX - this.offset.x;
                this.dragStart.y = e.clientY - this.offset.y;
                this.canvas.style.cursor = 'grabbing';
            }
            return;
        }
        
        if (e.button === 1) {
            this.dragging = true;
            this.dragStart.x = e.clientX - this.offset.x;
            this.dragStart.y = e.clientY - this.offset.y;
            this.canvas.style.cursor = 'grabbing';
            return;
        }

        if (e.button === 0) {
            const cp = this.getControlPointAt(mousePos.x, mousePos.y);
            if (cp) { this.draggingControlPoint = cp; return; }
            
            const clicked = this.getClickableEntityAt(mousePos.x, mousePos.y);
            if (clicked && clicked.type === 'node') {
                const node = clicked.entity;
                if (node.selected) this.isDraggingSelection = true;
                this.draggingNode = node;
                this.dragNodeOffset.x = mousePos.x - node.x;
                this.dragNodeOffset.y = mousePos.y - node.y;
                return;
            }

            if (!clicked) {
                this.isMarqueeSelecting = true;
                this.marqueeRect = { x: mousePos.x, y: mousePos.y, w: 0, h: 0 };
            }

        } else if (e.button === 2) {
            const cp = this.getControlPointAt(mousePos.x, mousePos.y);
            if (cp) { cp.edge.controlPoints.splice(cp.pointIndex, 1); }
            else { const node = this.getNodeAt(mousePos.x, mousePos.y); if (node) { this.isCreatingEdge = true; this.edgeCreationSource = node; } }
        }
    });

    this.canvas.addEventListener('mousemove', (e) => {
        this.mousePos = this.getCanvasCoords(e);
        if (e.buttons === 0) {
             this.dragging = this.draggingNode = this.draggingControlPoint = this.isCreatingEdge = this.isMarqueeSelecting = this.isDraggingSelection = false;
             this.canvas.style.cursor = 'grab'; this.snapLines = [];
             return;
        }
        this.dragged = true;

        if (this.dragging) {
            this.offset.x = e.clientX - this.dragStart.x;
            this.offset.y = e.clientY - this.dragStart.y;
        } else if (this.isDraggingSelection) {
            const primaryNode = this.draggingNode;
            const primaryNodeCenter = { x: this.mousePos.x - this.dragNodeOffset.x + NODE_WIDTH / 2, y: this.mousePos.y - this.dragNodeOffset.y + NODE_HEIGHT_COLLAPSED / 2 };
            const snappedCenter = this._getSnappedPosition(primaryNodeCenter, primaryNode);
            const snappedX = snappedCenter.x - NODE_WIDTH / 2;
            const snappedY = snappedCenter.y - NODE_HEIGHT_COLLAPSED / 2;
            const dx = snappedX - primaryNode.x;
            const dy = snappedY - primaryNode.y;

            getSelection().forEach(entity => {
                if (entity.x !== undefined) {
                    entity.x += dx;
                    entity.y += dy;
                } else if (entity.controlPoints) {
                    entity.controlPoints.forEach(point => {
                        point.x += dx;
                        point.y += dy;
                    });
                }
            });
        } else if (this.draggingNode) {
            const centerPos = { x: this.mousePos.x - this.dragNodeOffset.x + NODE_WIDTH / 2, y: this.mousePos.y - this.dragNodeOffset.y + NODE_HEIGHT_COLLAPSED / 2 };
            const snappedCenter = this._getSnappedPosition(centerPos, this.draggingNode);
            this.draggingNode.x = snappedCenter.x - NODE_WIDTH / 2;
            this.draggingNode.y = snappedCenter.y - NODE_HEIGHT_COLLAPSED / 2;
        } else if (this.draggingControlPoint) {
            const point = this.draggingControlPoint.edge.controlPoints[this.draggingControlPoint.pointIndex];
            const snappedPos = this._getSnappedPosition(this.mousePos, point);
            point.x = snappedPos.x; point.y = snappedPos.y;
        } else if (this.isMarqueeSelecting) {
            this.marqueeRect.w = this.mousePos.x - this.marqueeRect.x;
            this.marqueeRect.h = this.mousePos.y - this.marqueeRect.y;
        }
    });

    this.canvas.addEventListener('mouseup', (e) => {
        if (this.isMarqueeSelecting) {
            const normalizedRect = this.normalizeRect(this.marqueeRect);
            if (normalizedRect.w > 5 || normalizedRect.h > 5) {
                onMarqueeSelect(this.marqueeRect, e.ctrlKey, e.shiftKey);
            }
        }
        if (this.isCreatingEdge && e.button === 2) {
            const targetNode = this.getNodeAt(this.mousePos.x, this.mousePos.y);
            if (targetNode && this.edgeCreationSource && targetNode.id !== this.edgeCreationSource.id) {
                onEdgeCreated(this.edgeCreationSource, targetNode);
            }
        }
        this.dragging = this.draggingNode = this.draggingControlPoint = this.isCreatingEdge = this.isMarqueeSelecting = this.isDraggingSelection = false;
        this.canvas.style.cursor = 'grab'; this.snapLines = [];
        setTimeout(() => { this.dragged = false; }, 0);
    });

    this.canvas.addEventListener('mouseleave', () => {
        if (this.dragging || this.draggingNode || this.draggingControlPoint || this.isCreatingEdge || this.isMarqueeSelecting) {
            this.dragging = this.draggingNode = this.draggingControlPoint = this.isCreatingEdge = this.isMarqueeSelecting = this.isDraggingSelection = false;
            this.canvas.style.cursor = 'grab';
            this.snapLines = [];
        }
    });
    
    this.canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const zoomIntensity = 0.1;
        const wheel = e.deltaY < 0 ? 1 : -1;
        const zoom = Math.exp(wheel * zoomIntensity);
        const rect = this.canvas.getBoundingClientRect();
        this.offset.x -= (e.clientX - rect.left - this.offset.x) * (zoom - 1);
        this.offset.y -= (e.clientY - rect.top - this.offset.y) * (zoom - 1);
        this.scale *= zoom;
        this.scale = Math.max(0.1, Math.min(5, this.scale));
    });

    this.canvas.addEventListener('click', onClick);
    this.canvas.addEventListener('dblclick', onDblClick);
  }
}

