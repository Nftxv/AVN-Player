
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
  <!-- Container for HTML overlays (iframes) -->
  <div id="iframe-container"></div>

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

    <!-- Player Mode Controls (now empty) -->
    <div id="playerModeControls">
    </div>

    <!-- Editor Mode Controls (hidden by default) -->
    <div id="editorModeControls">
      <button id="addNodeBtn" title="Add New Node">Add Node</button>
      <div class="divider"></div>
      <button id="addRectBtn" title="Add Rectangle Shape">Add Rect</button>
      <button id="addTextBtn" title="Add Text Label">Add Text</button>
      <button id="lockDecorationsBtn" title="Lock/Unlock Decorations">🔓</button>
      <div class="divider"></div>
      <button id="exportBtn">Export Graph</button>
      <button id="resetBtn">Reset</button>
      <div class="divider"></div>
      <button id="deleteSelectionBtn" title="Delete Selected" disabled>Delete</button>
    </div>
  </div>

  <!-- Properties Inspector Panel (hidden) -->
  <div id="inspectorPanel" class="hidden">
      <h4>Properties</h4>
      <div id="inspectorContent"></div>
      <button id="saveNodeBtn">Save Changes</button>
      <button id="closeInspectorBtn">Close</button>
  </div>

  <!-- Player and other UI -->
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
  <div id="lyricsContainer" class="hidden">
    <pre id="lyricsText">Loading lyrics...</pre>
    <button id="closeLyricsBtn" title="Close">×</button>
  </div>
  <div id="choiceModal" class="hidden">
    <div class="modal-content">
      <h3>Choose the next step:</h3>
      <div id="choiceOptions"></div>
      <div id="choiceTimer" class="hidden">(Autoselecting in <span id="countdown">5</span>s)</div>
      <button id="closeModalBtn">Cancel</button>
    </div>
  </div>
  
  <!-- YouTube API Scripts -->
  <script src="https://www.youtube.com/iframe_api"></script>
  <script>
    // This function is required by the YouTube IFrame Player API.
    // It will be called automatically when the API is loaded.
    // We use it to notify our application module that it's safe to initialize.
    function onYouTubeIframeAPIReady() {
      window.dispatchEvent(new Event('youtubeApiReady'));
    }
  </script>
  
  <script src="js/app.js" type="module"></script>

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
  --dark-bg: #1e1e1e;
  --dark-surface: #2d2d2d;
  --dark-text: #e0e0e0;
  --dark-subtle-text: #9e9e9e;
  --dark-border: #424242;
  --danger-color: #e74c3c;
  --danger-hover: #c0392b;
}

body {
  margin: 0;
  overflow: hidden;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: var(--dark-bg);
  color: var(--dark-text);
}

canvas {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1; /* Canvas is the base layer */
  display: block;
  cursor: grab;
}
canvas:active {
  cursor: grabbing;
}

#iframe-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2; /* Higher than canvas */
  pointer-events: none; /* Click-through by default */
  overflow: hidden;
}

.iframe-wrapper {
  position: absolute;
  box-sizing: border-box;
  background-color: #000;
  border: 1px solid #444;
}

.iframe-wrapper iframe {
  width: 100%;
  height: 100%;
  border: none;
  pointer-events: auto; /* Iframes are clickable */
}

.iframe-wrapper .drag-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 10;
  display: none; /* Hidden by default */
}

body.is-dragging .drag-overlay {
  display: block;
  pointer-events: auto; /* It catches the click */
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

button:disabled {
    background: #555;
    cursor: not-allowed;
    transform: none;
}

/* NEW: Style for the active lock button */
button#lockDecorationsBtn.active {
    background-color: var(--danger-color);
}
button#lockDecorationsBtn.active:hover {
    background-color: var(--danger-hover);
}

#player {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: var(--player-height);
  background: rgba(45, 45, 45, 0.9);
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
  color: var(--dark-text);
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
  background: var(--dark-surface);
  border: 1px solid var(--dark-border);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
  z-index: 300;
  overflow-y: auto;
  padding: 20px;
  color: var(--dark-text);
}
#closeLyricsBtn { color: var(--dark-text); }
#closeLyricsBtn:hover { color: #e74c3c; }


.hidden { display: none !important; }

#choiceModal {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.6); z-index: 400; display: flex;
  justify-content: center; align-items: center; padding: 15px;
}

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

#topToolbar {
  position: fixed;
  top: 10px;
  left: 10px;
  background: rgba(45, 45, 45, 0.9);
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

.switch { position: relative; display: inline-block; width: 44px; height: 24px; }
.switch input { opacity: 0; width: 0; height: 0; }
.slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #424242; transition: .4s; border-radius: 24px; }
.slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: #e0e0e0; transition: .4s; border-radius: 50%; }
input:checked + .slider { background-color: var(--primary-color); }
input:checked + .slider:before { transform: translateX(20px); }

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
#inspectorContent input, #inspectorContent select, #inspectorContent textarea {
  width: 95%; padding: 8px; border-radius: 4px;
  background-color: #3c3c3c;
  border: 1px solid #555;
  color: var(--dark-text);
  margin-top: 2px;
}
#inspectorContent input[type="color"]{
    width: 100%;
    height: 30px;
    padding: 2px;
}
#inspectorContent textarea {
    resize: vertical;
    min-height: 60px;
}
.toggle-switch {
    display: flex;
    border: 1px solid #555;
    border-radius: 6px;
    overflow: hidden;
    margin-top: 5px;
}
.toggle-switch button {
    flex: 1;
    background: transparent;
    border: none;
    border-radius: 0;
    padding: 8px;
}
.toggle-switch button.active {
    background: var(--primary-color);
    color: white;
}

body:not(.editor-mode) #editorModeControls { display: none; }
body.editor-mode #playerModeControls { display: none; }
body.editor-mode #player { opacity: 0.5; pointer-events: none; z-index: 0; }


## ./public/data/default.jsonld

{
  "@context": "https://schema.org/",
  "@graph": [
    {
      "@id": "deco-rect-1",
      "@type": "RectangleAnnotation",
      "position": { "x": 50, "y": 80 },
      "size": { "width": 950, "height": 350 },
      "backgroundColor": "#2c3e50"
    },
    {
      "@id": "deco-text-1",
      "@type": "TextAnnotation",
      "position": { "x": 525, "y": 60 },
      "textContent": "Act I: The Journey Begins",
      "fontSize": 24,
      "color": "#ecf0f1",
      "textAlign": "center",
      "width": 400,
      "lineHeight": 1.2
    },
    {
      "@id": "node-1",
      "@type": "MusicRecording",
      "name": "Chapter 1: The Beginning",
      "position": { "x": 100, "y": 250 },
      "isCollapsed": false,
      "sourceType": "iframe",
      "iframeUrl": "PaASWGWif34"
    },
    {
      "@id": "node-2",
      "@type": "MusicRecording",
      "name": "Chapter 2: YouTube Video",
      "position": { "x": 400, "y": 250 },
      "isCollapsed": false,
      "sourceType": "iframe",
      "iframeUrl": "dQw4w9WgXcQ"
    },
    {
      "@id": "node-3a",
      "@type": "MusicRecording",
      "name": "Ending A: The Bright Path",
      "position": { "x": 700, "y": 150 },
      "isCollapsed": true,
      "sourceType": "audio",
      "audioUrl": "https://cloudflare-ipfs.com/ipfs/bafybeifx7yeb55armcsxwwitkymga5xf53dxiarykms3ygq42uhulbnnh4",
      "coverUrl": null,
      "lyricsUrl": null
    },
    {
      "@id": "node-3b",
      "@type": "MusicRecording",
      "name": "Ending B: The Dark Path",
      "position": { "x": 700, "y": 350 },
      "isCollapsed": true,
      "sourceType": "audio",
      "audioUrl": "https://cloudflare-ipfs.com/ipfs/bafybeifx7yeb55armcsxwwitkymga5xf53dxiarykms3ygq42uhulbnnh4",
      "coverUrl": null,
      "lyricsUrl": null
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
 * AVN Player - Main Application
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
    this.renderer.setPlayer(this.player);
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
        getIsDecorationsLocked: () => this.editorTools.decorationsLocked,
        onClick: (e) => this.handleCanvasClick(e),
        onDblClick: (e) => this.handleCanvasDblClick(e),
        onEdgeCreated: (source, target) => {
            if (this.isEditorMode) this.editorTools.createEdge(source, target);
        },
        onMarqueeSelect: (rect, ctrlKey, shiftKey) => {
            if (!this.isEditorMode) return;
            const nodes = this.renderer.getNodesInRect(rect);
            const edges = this.renderer.getEdgesInRect(rect, nodes);
            const decorations = this.editorTools.decorationsLocked ? [] : this.renderer.getDecorationsInRect(rect);
            const mode = ctrlKey ? 'add' : (shiftKey ? 'remove' : 'set');
            this.editorTools.updateSelection([...nodes, ...edges, ...decorations], mode);
        },
        getSelection: () => this.editorTools.getSelection()
    });

    document.getElementById('editorModeToggle').addEventListener('change', (e) => this.toggleEditorMode(e.target.checked));
    
    document.getElementById('collapseAllBtn').addEventListener('click', () => this.editorTools.collapseAllNodes());
    document.getElementById('expandAllBtn').addEventListener('click', () => this.editorTools.expandAllNodes());

    document.getElementById('exportBtn').addEventListener('click', () => this.editorTools.exportGraph());
    document.getElementById('resetBtn').addEventListener('click', () => this.editorTools.resetGraph());
    
    document.getElementById('addNodeBtn').addEventListener('click', () => this.editorTools.createNode());
    document.getElementById('addRectBtn').addEventListener('click', () => this.editorTools.createRectangle());
    document.getElementById('addTextBtn').addEventListener('click', () => this.editorTools.createText());
    document.getElementById('lockDecorationsBtn').addEventListener('click', () => this.editorTools.toggleDecorationsLock());

    document.getElementById('deleteSelectionBtn').addEventListener('click', () => this.editorTools.deleteSelection());
    
    document.getElementById('saveNodeBtn').addEventListener('click', () => this.editorTools.saveInspectorChanges());
    document.getElementById('closeInspectorBtn').addEventListener('click', () => this.editorTools.closeInspector());
    
    document.getElementById('playBtn').addEventListener('click', () => this.player.togglePlay());
    document.getElementById('backBtn').addEventListener('click', () => this.navigation.goBack());
    document.getElementById('nextBtn').addEventListener('click', () => this.navigation.advance());
  }

  handleCanvasClick(event) {
    if (this.renderer.wasDragged()) return;
    const coords = this.renderer.getCanvasCoords(event);
    const clicked = this.renderer.getClickableEntityAt(coords.x, coords.y, { isDecorationsLocked: this.editorTools.decorationsLocked });

    if (clicked && clicked.type === 'collapse_toggle') {
        clicked.entity.isCollapsed = !clicked.entity.isCollapsed;
        return;
    }

    if (this.isEditorMode) {
      const clickedEntity = clicked ? clicked.entity : null;
      let mode = 'set';
      if (event.ctrlKey) mode = 'add';
      else if (event.shiftKey) mode = 'remove';
      
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
    const clicked = this.renderer.getClickableEntityAt(coords.x, coords.y, { isDecorationsLocked: this.editorTools.decorationsLocked });
    
    if (clicked && clicked.type === 'node') {
        clicked.entity.isCollapsed = !clicked.entity.isCollapsed;
    } else if (this.isEditorMode && clicked && clicked.type === 'edge') {
        this.editorTools.addControlPointAt(clicked.entity, coords);
    }
  }
}

// Start the application only after the YouTube API is ready.
window.addEventListener('youtubeApiReady', () => {
  const app = new GraphApp();
  app.init();
});


## ./public/js/modules/EditorTools.js

/**
 * AVN Player - Editor Tools Module
 * by Nftxv
 */
const NODE_WIDTH = 200;
const NODE_HEADER_HEIGHT = 45;
const NODE_CONTENT_ASPECT_RATIO = 9 / 16;
const NODE_CONTENT_HEIGHT = NODE_WIDTH * NODE_CONTENT_ASPECT_RATIO;


export default class EditorTools {
  constructor(graphData, renderer) {
    this.graphData = graphData;
    this.renderer = renderer;
    this.inspectedEntity = null;
    this.selectedEntities = [];
    this.decorationsLocked = false;
  }

  collapseAllNodes() {
    this.graphData.nodes.forEach(node => node.isCollapsed = true);
  }

  expandAllNodes() {
    this.graphData.nodes.forEach(node => node.isCollapsed = false);
  }

  toggleDecorationsLock() {
    this.decorationsLocked = !this.decorationsLocked;
    
    const lockBtn = document.getElementById('lockDecorationsBtn');
    const addRectBtn = document.getElementById('addRectBtn');
    const addTextBtn = document.getElementById('addTextBtn');
    
    lockBtn.textContent = this.decorationsLocked ? '🔒' : '🔓';
    lockBtn.classList.toggle('active', this.decorationsLocked);
    addRectBtn.disabled = this.decorationsLocked;
    addTextBtn.disabled = this.decorationsLocked;

    if (this.decorationsLocked) {
      const nonDecorationSelection = this.selectedEntities.filter(e => e.type !== 'rectangle' && e.type !== 'text');
      this.updateSelection(nonDecorationSelection, 'set');
    }
  }

  createNode() {
    const center = this.renderer.getViewportCenter();
    // A new node is expanded, so we account for the content height to center it visually.
    // node.y is the top of the header.
    const visualCenterOffset = (NODE_HEADER_HEIGHT - NODE_CONTENT_HEIGHT) / 2;

    const newNode = {
      id: `node-${Date.now()}`,
      title: 'New Node',
      x: center.x - NODE_WIDTH / 2,
      y: center.y - visualCenterOffset,
      isCollapsed: false,
      sourceType: 'audio',
      audioUrl: '', coverUrl: '', lyricsUrl: '', iframeUrl: '',
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
        x: center.x, y: center.y,
        textContent: 'New Text Label',
        fontSize: 16,
        color: '#ecf0f1',
        textAlign: 'center',
        width: 250,
        lineHeight: 1.2,
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
  
  selectEntity(entity) {
    this.updateSelection(entity ? [entity] : [], 'set');
  }

  updateSelection(entities, mode = 'set') {
      const entityToId = (e) => e.id || `${e.source}->${e.target}`;
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
      this.selectedEntities = finalSelection;
      const selectedIds = new Set(this.selectedEntities.map(e => entityToId(e)));
      
      this.graphData.nodes.forEach(n => n.selected = selectedIds.has(n.id));
      this.graphData.edges.forEach(e => e.selected = selectedIds.has(entityToId(e)));
      this.graphData.decorations.forEach(d => d.selected = selectedIds.has(d.id));
      
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
                <label for="audioUrl">Audio URL:</label>
                <input type="text" id="audioUrl" value="${entity.audioUrl || ''}" placeholder="https://.../track.mp3">
                <label for="coverUrl">Cover URL:</label>
                <input type="text" id="coverUrl" value="${entity.coverUrl || ''}" placeholder="https://.../cover.jpg">
                <label for="lyricsUrl">Lyrics URL:</label>
                <input type="text" id="lyricsUrl" value="${entity.lyricsUrl || ''}" placeholder="https://.../lyrics.txt">
            </div>
            <div id="iframe-fields" class="${entity.sourceType === 'iframe' ? '' : 'hidden'}">
                <label for="iframeUrl">YouTube URL or Video ID:</label>
                <input type="text" id="iframeUrlInput" value="${entity.iframeUrl || ''}" placeholder="dQw4w9WgXcQ">
            </div>
        `;
    } else if (entity.source) { // Edge
        title.textContent = 'Edge Properties';
        html = `
            <label for="edgeLabel">Label:</label>
            <input type="text" id="edgeLabel" value="${entity.label || ''}">
            <label for="edgeColor">Color:</label>
            <input type="color" id="edgeColor" value="${entity.color || '#888888'}">
            <label for="edgeWidth">Line Width:</label>
            <input type="number" id="edgeWidth" value="${entity.lineWidth || 2}" min="1" max="10">
        `;
    } else if (entity.type === 'rectangle') {
        title.textContent = 'Rectangle Properties';
        html = `
            <label for="rectColor">Background Color:</label>
            <input type="color" id="rectColor" value="${entity.backgroundColor}">
            <label for="rectWidth">Width:</label>
            <input type="number" id="rectWidth" value="${entity.width}" min="10">
            <label for="rectHeight">Height:</label>
            <input type="number" id="rectHeight" value="${entity.height}" min="10">
        `;
    } else if (entity.type === 'text') {
        title.textContent = 'Text Properties';
        html = `
            <label for="textContent">Text:</label>
            <textarea id="textContent" rows="4">${entity.textContent || ''}</textarea>
            <label for="textWidth">Width (px, 0=auto):</label>
            <input type="number" id="textWidth" value="${entity.width || 0}" min="0">
            <label for="textColor">Text Color:</label>
            <input type="color" id="textColor" value="${entity.color || '#FFFFFF'}">
            <label for="textSize">Font Size:</label>
            <input type="number" id="textSize" value="${entity.fontSize || 16}" min="8">
             <label for="textLineHeight">Line Height:</label>
            <input type="number" id="textLineHeight" value="${entity.lineHeight || 1.2}" step="0.1" min="0.8">
            <label for="textAlign">Alignment:</label>
            <select id="textAlign">
                <option value="left" ${entity.textAlign === 'left' ? 'selected' : ''}>Left</option>
                <option value="center" ${entity.textAlign === 'center' ? 'selected' : ''}>Center</option>
                <option value="right" ${entity.textAlign === 'right' ? 'selected' : ''}>Right</option>
            </select>
        `;
    }
    
    content.innerHTML = html;
    panel.classList.remove('hidden');
    if (entity.sourceType) this._setupInspectorLogic(entity);
  }
  
  _setupInspectorLogic(node) {
      const audioBtn = document.getElementById('type-audio');
      const iframeBtn = document.getElementById('type-iframe');
      const audioFields = document.getElementById('audio-fields');
      const iframeFields = document.getElementById('iframe-fields');

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

  saveInspectorChanges() {
    if (!this.inspectedEntity) return;
    const entity = this.inspectedEntity;

    if (entity.sourceType) { // Node
        entity.title = document.getElementById('nodeTitle').value;
        if (entity.sourceType === 'audio') {
            entity.audioUrl = document.getElementById('audioUrl').value || null;
            entity.coverUrl = document.getElementById('coverUrl').value || null;
            entity.lyricsUrl = document.getElementById('lyricsUrl').value || null;
            entity.iframeUrl = null;
        } else if (entity.sourceType === 'iframe') {
            const userInput = document.getElementById('iframeUrlInput').value;
            entity.iframeUrl = this.graphData.parseYoutubeUrl(userInput) || null; // CORRECTED
            entity.audioUrl = null;
            entity.coverUrl = null;
            entity.lyricsUrl = null;
        }
    } else if (entity.source) { // Edge
        entity.label = document.getElementById('edgeLabel').value;
        entity.color = document.getElementById('edgeColor').value;
        entity.lineWidth = parseInt(document.getElementById('edgeWidth').value, 10);
    } else if (entity.type === 'rectangle') {
        entity.backgroundColor = document.getElementById('rectColor').value;
        entity.width = parseInt(document.getElementById('rectWidth').value, 10);
        entity.height = parseInt(document.getElementById('rectHeight').value, 10);
    } else if (entity.type === 'text') {
        entity.textContent = document.getElementById('textContent').value;
        entity.width = parseInt(document.getElementById('textWidth').value, 10);
        entity.color = document.getElementById('textColor').value;
        entity.fontSize = parseInt(document.getElementById('textSize').value, 10);
        entity.lineHeight = parseFloat(document.getElementById('textLineHeight').value);
        entity.textAlign = document.getElementById('textAlign').value;
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
      
      // The "center" for an edge connection is the middle of the header.
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
 * Manages the graph's data, including loading, parsing, and providing access to all entities.
 */
export default class GraphData {
  constructor() {
    this.nodes = [];
    this.edges = [];
    this.decorations = [];
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
   * Parses the raw JSON-LD data and populates nodes, edges, and decorations.
   * @param {object} data - The raw data object from the JSON file.
   */
  parseData(data) {
    this.meta = data.meta || {};
    const graph = data['@graph'] || [];

    // Clear existing data
    this.nodes = [];
    this.edges = [];
    this.decorations = [];

    graph.forEach(item => {
      switch (item['@type']) {
        case 'MusicRecording':
          this.nodes.push({
            id: item['@id'],
            title: item.name || 'Untitled',
            x: item.position?.x || 0,
            y: item.position?.y || 0,
            isCollapsed: item.isCollapsed === true,
            sourceType: item.sourceType || 'audio',
            audioUrl: item.audioUrl || null,
            coverUrl: item.coverUrl || null,
            lyricsUrl: item.lyricsUrl || null,
            iframeUrl: item.sourceType === 'iframe' ? this.parseYoutubeUrl(item.iframeUrl) : null,
          });
          break;
        case 'Path':
          this.edges.push({
            source: item.source,
            target: item.target,
            color: item.color || '#888888',
            label: item.label || '',
            lineWidth: item.lineWidth || 2,
            controlPoints: item.controlPoints || [],
          });
          break;
        case 'RectangleAnnotation':
          this.decorations.push({
            id: item['@id'],
            type: 'rectangle',
            x: item.position?.x || 0,
            y: item.position?.y || 0,
            width: item.size?.width || 200,
            height: item.size?.height || 100,
            backgroundColor: item.backgroundColor || '#333333',
          });
          break;
        case 'TextAnnotation':
          this.decorations.push({
            id: item['@id'],
            type: 'text',
            x: item.position?.x || 0,
            y: item.position?.y || 0,
            textContent: item.textContent || '',
            fontSize: item.fontSize || 16,
            color: item.color || '#FFFFFF',
            textAlign: item.textAlign || 'left',
            width: item.width,
            lineHeight: item.lineHeight || 1.2,
          });
          break;
      }
    });
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
        isCollapsed: n.isCollapsed,
        sourceType: n.sourceType,
        audioUrl: n.audioUrl,
        coverUrl: n.coverUrl,
        lyricsUrl: n.lyricsUrl,
        iframeUrl: n.iframeUrl,
      })),
      ...this.edges.map(e => ({
        '@type': 'Path',
        source: e.source,
        target: e.target,
        color: e.color,
        label: e.label,
        lineWidth: e.lineWidth,
        controlPoints: e.controlPoints,
      })),
      ...this.decorations.map(d => {
        const common = { '@id': d.id, position: { x: d.x, y: d.y } };
        if (d.type === 'rectangle') {
          return {
            ...common,
            '@type': 'RectangleAnnotation',
            size: { width: d.width, height: d.height },
            backgroundColor: d.backgroundColor,
          };
        }
        if (d.type === 'text') {
          return {
            ...common,
            '@type': 'TextAnnotation',
            textContent: d.textContent,
            fontSize: d.fontSize,
            color: d.color,
            textAlign: d.textAlign,
            width: d.width,
            lineHeight: d.lineHeight,
          };
        }
        return null;
      }).filter(Boolean),
    ];
    return {
      '@context': 'https://schema.org/',
      ...(Object.keys(this.meta).length > 0 && { meta: this.meta }),
      '@graph': graph,
    };
  }
  
  /**
   * Parses various YouTube URL formats and returns only the video ID.
   * @param {string} input - The URL or ID provided by the user.
   * @returns {string|null} - The 11-character video ID or null.
   */
  parseYoutubeUrl(input) {
      if (!input || typeof input !== 'string') return null;
      
      // Regular expression to find the YouTube video ID in various URL formats
      const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
      const match = input.match(regex);
      
      if (match && match[1]) {
          return match[1];
      }
      
      // If no match from URL, check if the input itself is a valid ID
      if (/^[a-zA-Z0-9_-]{11}$/.test(input.trim())) {
          return input.trim();
      }
      
      console.warn("Could not parse YouTube URL/ID:", input);
      return null;
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
    this.graphData.nodes.forEach(n => n.highlighted = false);
    this.graphData.edges.forEach(e => e.highlighted = false);
  }

  startFromNode(nodeId) {
    if(this.currentNode?.id === nodeId) return;
    
    const node = this.graphData.getNodeById(nodeId);
    if (!node) return;
    
    const prevNodeId = this.currentNode?.id;
    this.currentNode = node;
    this.history = [nodeId];
    
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
      if (!nextEdge) return;
    }
    this.transitionToEdge(nextEdge);
  }
  
  goBack() {
    if (this.history.length < 2) return;
    
    this.history.pop();
    const prevNodeId = this.history[this.history.length - 1];
    const prevNode = this.graphData.getNodeById(prevNodeId);

    if (prevNode) {
        const oldNodeId = this.currentNode.id;
        this.currentNode = prevNode;
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
      optionsContainer.innerHTML = '';

      const onChoose = (edge) => {
        cleanup();
        resolve(edge);
      };
      
      const closeHandler = () => {
        cleanup();
        resolve(null);
      };

      const cleanup = () => {
          modal.classList.add('hidden');
          closeModalBtn.removeEventListener('click', closeHandler);
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
 * Manages audio playback, player UI updates, and lyrics loading.
 * NEW: Also manages YouTube IFrame player instances.
 */
export default class Player {
  constructor(graphData) {
    this.graphData = graphData;
    this.navigation = null;
    this.currentNode = null;
    
    // Audio player
    this.audio = new Audio();
    
    // YouTube players
    this.ytPlayers = new Map();
    this.currentYtPlayer = null;

    this.setupEventListeners();
  }

  setNavigation(navigation) { this.navigation = navigation; }

  play(node) {
    if (!node) return;
    this.currentNode = node;
    
    // Reset both players first
    this.audio.pause();
    if (this.currentYtPlayer) {
      this.currentYtPlayer.pauseVideo();
      this.currentYtPlayer = null;
    }
    
    document.getElementById('songTitle').textContent = node.title;
    const playBtn = document.getElementById('playBtn');
    const progress = document.getElementById('progress');

    if (node.sourceType === 'audio') {
        const audioUrl = node.audioUrl;
        document.getElementById('currentCover').src = node.coverUrl || 'placeholder.svg';
        
        if (!audioUrl) {
          console.warn(`Audio URL is missing for "${node.title}".`);
          this.stop();
          document.getElementById('songTitle').textContent = node.title;
          return;
        }
        
        playBtn.textContent = '⏸';
        playBtn.disabled = false;
        progress.disabled = false;
        this.audio.src = audioUrl;
        this.audio.play().catch(e => console.error("Playback error:", e));
        this.loadAndShowLyrics(node.lyricsUrl);

    } else if (node.sourceType === 'iframe') {
        document.getElementById('currentCover').src = `https://i.ytimg.com/vi/${node.iframeUrl}/mqdefault.jpg`;
        playBtn.textContent = '⏸';
        playBtn.disabled = false;
        progress.value = 0;
        progress.disabled = true; // YouTube controls its own progress

        this.currentYtPlayer = this.ytPlayers.get(node.id);
        if (this.currentYtPlayer && typeof this.currentYtPlayer.playVideo === 'function') {
           this.currentYtPlayer.playVideo();
        } else {
            console.warn(`YouTube player for node ${node.id} not ready yet.`);
        }
        this.loadAndShowLyrics(null);
    }
  }

  togglePlay() {
    if (!this.currentNode) return;
    const playBtn = document.getElementById('playBtn');

    if (this.currentNode.sourceType === 'audio') {
        if (this.audio.paused) {
            this.audio.play();
            playBtn.textContent = '⏸';
        } else {
            this.audio.pause();
            playBtn.textContent = '▶';
        }
    } else if (this.currentNode.sourceType === 'iframe' && this.currentYtPlayer) {
        const state = this.currentYtPlayer.getPlayerState();
        if (state === YT.PlayerState.PLAYING) {
            this.currentYtPlayer.pauseVideo();
            playBtn.textContent = '▶';
        } else {
            this.currentYtPlayer.playVideo();
            playBtn.textContent = '⏸';
        }
    }
  }

  stop() {
    this.audio.pause();
    this.audio.currentTime = 0;
    this.audio.src = '';
    
    if(this.currentYtPlayer) {
      this.currentYtPlayer.stopVideo();
      this.currentYtPlayer = null;
    }

    this.currentNode = null;
    document.getElementById('playBtn').textContent = '▶';
    document.getElementById('playBtn').disabled = false;
    document.getElementById('progress').disabled = false;
    document.getElementById('songTitle').textContent = 'Select a node to begin...';
    document.getElementById('currentCover').src = 'placeholder.svg';
    document.getElementById('progress').value = 0;
    document.getElementById('currentTime').textContent = '0:00';
  }

  // --- YouTube Player Management ---

  createYtPlayer(node) {
      if (this.ytPlayers.has(node.id) || !node.iframeUrl) return;

      const player = new YT.Player(`yt-player-${node.id}`, {
          height: '100%',
          width: '100%',
          videoId: node.iframeUrl,
          playerVars: {
              'playsinline': 1,
              'controls': 0, // We use our own controls
              'disablekb': 1
          },
          events: {
              'onStateChange': (event) => this.onPlayerStateChange(event, node)
          }
      });
      this.ytPlayers.set(node.id, player);
  }

  destroyYtPlayer(nodeId) {
      if (this.ytPlayers.has(nodeId)) {
          const player = this.ytPlayers.get(nodeId);
          if (player && typeof player.destroy === 'function') {
            player.destroy();
          }
          this.ytPlayers.delete(nodeId);
      }
  }

  onPlayerStateChange(event, node) {
    if (this.currentNode?.id !== node.id) return; // Only react to the current node
    
    const playBtn = document.getElementById('playBtn');
    if (event.data === YT.PlayerState.ENDED) {
        if (this.navigation) this.navigation.advance();
    } else if (event.data === YT.PlayerState.PLAYING) {
        playBtn.textContent = '⏸';
    } else if (event.data === YT.PlayerState.PAUSED) {
        playBtn.textContent = '▶';
    }
  }

  // --- Lyrics and Progress ---

  async loadAndShowLyrics(url) {
      const lyricsTextElem = document.getElementById('lyricsText');
      lyricsTextElem.textContent = 'Loading lyrics...';
      if (!url) {
          lyricsTextElem.textContent = 'No lyrics available for this track.';
          return;
      }
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
        if (this.currentNode?.sourceType === 'audio' && this.audio.duration && isFinite(this.audio.duration)) {
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
    if (this.audio.duration && isFinite(this.audio.duration)) {
      progress.value = (this.audio.currentTime / this.audio.duration) * 100;
      const mins = Math.floor(this.audio.currentTime / 60);
      const secs = Math.floor(this.audio.currentTime % 60);
      currentTimeElem.textContent = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
  }
}


## ./public/js/modules/Renderer.js

/**
 * AVN Player - Renderer Module with Editable & Lockable Decorative Layers
 * by Nftxv
 */
const NODE_WIDTH = 200;
const NODE_HEADER_HEIGHT = 45; // Was NODE_HEIGHT_COLLAPSED
const NODE_CONTENT_ASPECT_RATIO = 9 / 16; // Standard 16:9 aspect ratio
const NODE_CONTENT_HEIGHT = NODE_WIDTH * NODE_CONTENT_ASPECT_RATIO; // Approx 112.5px

export default class Renderer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.iframeContainer = document.getElementById('iframe-container');
    
    this.graphData = null; 
    this.player = null; // NEW: Reference to the player
    this.images = {};

    this.offset = { x: 0, y: 0 };
    this.scale = 1.0;
    this.dragStart = { x: 0, y: 0 };
    this.dragged = false;
    this.dragging = false;
    this.draggingEntity = null; // Generic dragging target
    this.dragOffset = { x: 0, y: 0 };
    this.isDraggingSelection = false;
    
    this.draggingControlPoint = null;
    this.isCreatingEdge = false;
    this.edgeCreationSource = null;
    this.mousePos = { x: 0, y: 0 };
    this.snapThreshold = 10;
    this.snapLines = [];
    this.isMarqueeSelecting = false;

    this.resizeCanvas();
    this.renderLoop = this.renderLoop.bind(this);
  }

  setData(graphData) { this.graphData = graphData; }
  setPlayer(player) { this.player = player; } // NEW

  async loadAndRenderAll() {
    if (!this.graphData) return;
    await this.loadImages();
    this.renderLoop();
  }

  async loadImages() {
    const promises = this.graphData.nodes
      .filter(node => node.sourceType === 'audio' && node.coverUrl)
      .map(async node => {
        const url = node.coverUrl;
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
      });
    await Promise.all(promises);
  }

  renderLoop() {
    if (!this.graphData) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.save();
    this.ctx.translate(this.offset.x, this.offset.y);
    this.ctx.scale(this.scale, this.scale);

    // Layer 1: Decorations
    this.graphData.decorations.forEach(deco => this.drawDecoration(deco));
    
    // Layer 2: Node content (drawn first, to be under header if overlap occurs)
    this.graphData.nodes.forEach(node => this._drawNodeContent(node));
    
    // Layer 3: Edges
    this.graphData.edges.forEach(edge => this.drawEdge(edge));
    
    // Layer 4: Node headers (shape + text)
    this.graphData.nodes.forEach(node => this._drawNodeHeader(node));

    // Overlays for editor tools
    if (this.isCreatingEdge) this.drawTemporaryEdge();
    if (this.isMarqueeSelecting) this.drawMarquee();
    this._drawSnapGuides();
    
    this.ctx.restore();
    
    this.updateIframes();
    requestAnimationFrame(this.renderLoop);
  }

  // --- START Drawing Methods ---

  drawDecoration(deco) {
    if (deco.type === 'rectangle') {
      this.drawRectangle(deco);
    } else if (deco.type === 'text') {
      this.drawText(deco);
    }
  }

  drawRectangle(rect) {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = rect.backgroundColor;
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
    
    if (rect.selected) {
        ctx.restore(); // Restore from globalAlpha change
        ctx.save(); // Save before clipping
        ctx.beginPath();
        ctx.rect(rect.x, rect.y, rect.width, rect.height);
        ctx.clip(); // Clip to the rect path
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = (2 / this.scale) * 2; // Double width for inside stroke
        ctx.stroke();
    }
    ctx.restore();
  }

  drawText(text) {
      const ctx = this.ctx;
      ctx.save();
      ctx.font = `${text.fontSize}px 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif`;
      ctx.fillStyle = text.color;
      ctx.textAlign = text.textAlign;
      ctx.textBaseline = 'top';

      const lines = this._getWrappedLines(text);
      const bounds = this._getTextBounds(text, lines);

      const topLeftX = text.x - bounds.width / 2;
      const topLeftY = text.y - bounds.height / 2;

      let drawX;
      if (text.textAlign === 'left') {
          drawX = topLeftX;
      } else if (text.textAlign === 'center') {
          drawX = text.x;
      } else { // right
          drawX = topLeftX + bounds.width;
      }

      let currentY = topLeftY;
      for (const line of lines) {
          ctx.fillText(line, drawX, currentY);
          currentY += text.fontSize * text.lineHeight;
      }

      if (text.selected) {
          const rectX = topLeftX - 2;
          const rectY = topLeftY - 2;
          const rectW = bounds.width + 4;
          const rectH = bounds.height + 4;
          
          ctx.save();
          ctx.beginPath();
          ctx.rect(rectX, rectY, rectW, rectH);
          ctx.clip();
          ctx.strokeStyle = '#e74c3c';
          ctx.lineWidth = (1 / this.scale) * 2; // Double width
          ctx.stroke();
          ctx.restore();
      }
      ctx.restore();
  }

  drawEdge(edge) {
      const src = this.graphData.getNodeById(edge.source);
      const trg = this.graphData.getNodeById(edge.target);
      if (!src || !trg) return;

      const controlPoints = edge.controlPoints || [];
      const srcRect = this._getNodeVisualRect(src);
      const trgRect = this._getNodeVisualRect(trg);
      
      const targetPointForAngle = controlPoints.length > 0 ? controlPoints[0] : { x: trgRect.x + trgRect.width / 2, y: trgRect.y + trgRect.height / 2 };
      const startPoint = this._getIntersectionWithNodeRect(src, targetPointForAngle);

      const sourcePointForAngle = controlPoints.length > 0 ? controlPoints.at(-1) : { x: srcRect.x + srcRect.width / 2, y: srcRect.y + srcRect.height / 2 };
      const endPoint = this._getIntersectionWithNodeRect(trg, sourcePointForAngle);

      const pathPoints = [startPoint, ...controlPoints, endPoint];
      
      const ctx = this.ctx; ctx.save();
      let color = edge.color || '#888888';
      if (edge.selected) color = '#e74c3c';
      if (edge.highlighted) color = '#FFD700';
      const edgeLineWidth = edge.lineWidth || 2;
      const lineWidth = edge.selected || edge.highlighted ? edgeLineWidth + 1 : edgeLineWidth;
      const arrowSize = 6 + edgeLineWidth * 2.5;

      ctx.beginPath();
      ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
      for (let i = 1; i < pathPoints.length; i++) ctx.lineTo(pathPoints[i].x, pathPoints[i].y);
      ctx.strokeStyle = color; ctx.lineWidth = lineWidth; ctx.stroke();
      
      const pForArrow = pathPoints.at(-1);
      const pBeforeArrow = pathPoints.length > 1 ? pathPoints.at(-2) : startPoint;
      const angle = Math.atan2(pForArrow.y - pBeforeArrow.y, pForArrow.x - pBeforeArrow.x);
      this._drawArrow(pForArrow.x, pForArrow.y, angle, color, arrowSize);

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
  
  _drawNodeContent(node) {
    if (node.isCollapsed) return;
    const ctx = this.ctx;
    
    // Define the content container
    const containerX = node.x;
    const containerY = node.y - NODE_CONTENT_HEIGHT;
    const containerW = NODE_WIDTH;
    const containerH = NODE_CONTENT_HEIGHT;

    // Draw a background for the content area
    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(containerX, containerY, containerW, containerH);

    if (node.sourceType === 'audio') {
        const img = this.images[node.coverUrl];
        if (img) {
            // Calculate aspect ratios
            const containerRatio = containerW / containerH;
            const imgRatio = img.naturalWidth / img.naturalHeight;
            
            let drawW, drawH, drawX, drawY;

            if (imgRatio > containerRatio) {
                // Image is wider than container (fit to width)
                drawW = containerW;
                drawH = drawW / imgRatio;
                drawX = containerX;
                drawY = containerY + (containerH - drawH) / 2; // Center vertically
            } else {
                // Image is taller than or same as container (fit to height)
                drawH = containerH;
                drawW = drawH * imgRatio;
                drawY = containerY;
                drawX = containerX + (containerW - drawW) / 2; // Center horizontally
            }
            ctx.drawImage(img, drawX, drawY, drawW, drawH);
        }
        // If no image, the background serves as a placeholder
    } else if (node.sourceType === 'iframe') {
        // The iframe will be placed here. We draw a placeholder.
        ctx.fillStyle = '#000000';
        ctx.fillRect(containerX, containerY, containerW, containerH);
        ctx.font = '12px Segoe UI';
        ctx.fillStyle = '#666';
        ctx.textAlign = 'center';
        ctx.fillText('Loading Video...', containerX + containerW / 2, containerY + containerH / 2);
    }
  }

  _drawNodeHeader(node) {
    const ctx = this.ctx;
    ctx.save();

    // 1. Define path and fill header background
    ctx.fillStyle = '#2d2d2d';
    ctx.beginPath();
    ctx.roundRect(node.x, node.y, NODE_WIDTH, NODE_HEADER_HEIGHT, [0, 0, 8, 8]);
    ctx.fill();
    
    // 2. Draw stroke (selection/highlight or default)
    if (node.selected || node.highlighted) {
        ctx.save();
        ctx.clip();
        ctx.strokeStyle = node.selected ? '#e74c3c' : '#FFD700';
        ctx.lineWidth = 3 * 2;
        ctx.stroke();
        ctx.restore();
    } else {
        ctx.strokeStyle = '#424242';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    // 3. Draw header text
    ctx.fillStyle = '#e0e0e0';
    ctx.font = '14px Segoe UI';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const fittedTitle = this._fitText(node.title, NODE_WIDTH - 20); 
    const titleX = node.x + NODE_WIDTH / 2;
    const titleY = node.y + NODE_HEADER_HEIGHT / 2;
    ctx.fillText(fittedTitle, titleX, titleY);

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

  // --- END Drawing Methods ---

  // --- START Helper & Interaction Methods ---
  
  updateIframes() {
    if (!this.player) return;
    const visibleNodeIds = new Set();
    
    this.graphData.nodes.forEach(node => {
        if (node.sourceType !== 'iframe' || node.isCollapsed || !this._isNodeInView(node)) {
            return;
        }

        visibleNodeIds.add(node.id);
        const wrapperId = `iframe-wrapper-${node.id}`;
        let wrapper = document.getElementById(wrapperId);

        if (!wrapper) {
            wrapper = this._createIframeWrapper(node);
            this.iframeContainer.appendChild(wrapper);
            this.player.createYtPlayer(node);
        }

        const screenX = (node.x) * this.scale + this.offset.x;
        const screenY = (node.y - NODE_CONTENT_HEIGHT) * this.scale + this.offset.y;
        const screenWidth = NODE_WIDTH * this.scale;
        const screenHeight = NODE_CONTENT_HEIGHT * this.scale;

        wrapper.style.transform = `translate(${screenX}px, ${screenY}px)`;
        wrapper.style.width = `${screenWidth}px`;
        wrapper.style.height = `${screenHeight}px`;
    });

    const existingIframes = this.iframeContainer.querySelectorAll('.iframe-wrapper');
    existingIframes.forEach(wrapper => {
        const nodeId = wrapper.dataset.nodeId;
        if (!visibleNodeIds.has(nodeId)) {
            this.player.destroyYtPlayer(nodeId);
            wrapper.remove();
        }
    });
  }

  _createIframeWrapper(node) {
      const wrapper = document.createElement('div');
      wrapper.id = `iframe-wrapper-${node.id}`;
      wrapper.dataset.nodeId = node.id;
      wrapper.className = 'iframe-wrapper';

      const playerDiv = document.createElement('div');
      playerDiv.id = `yt-player-${node.id}`;

      const dragOverlay = document.createElement('div');
      dragOverlay.className = 'drag-overlay';

      wrapper.appendChild(playerDiv);
      wrapper.appendChild(dragOverlay);
      return wrapper;
  }

  _getWrappedLines(textObj) {
      const { ctx } = this;
      const { textContent, fontSize, width } = textObj;
      ctx.font = `${fontSize}px 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif`;

      const paragraphs = (textContent || "").split('\n');
      const allLines = [];

      for (const paragraph of paragraphs) {
          if (!width || width <= 0) {
              allLines.push(paragraph);
          } else {
              const words = paragraph.split(' ');
              let currentLine = '';
              for (const word of words) {
                  const testLine = currentLine ? `${currentLine} ${word}` : word;
                  if (ctx.measureText(testLine).width > width && currentLine) {
                      allLines.push(currentLine);
                      currentLine = word;
                  } else {
                      currentLine = testLine;
                  }
              }
              allLines.push(currentLine);
          }
      }
      return allLines;
  }
  
  _getTextBounds(textObj, renderedLines) {
      const { fontSize, width, lineHeight } = textObj;
      let maxWidth = 0;
      if (width > 0) {
        maxWidth = width;
      } else {
        this.ctx.font = `${fontSize}px 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif`;
        renderedLines.forEach(line => {
            maxWidth = Math.max(maxWidth, this.ctx.measureText(line).width);
        });
      }
      
      const totalHeight = (renderedLines.length > 0) 
        ? (renderedLines.length * fontSize * lineHeight) - (fontSize * (lineHeight - 1))
        : 0;

      return { width: maxWidth, height: totalHeight };
  }

  _fitText(text, maxWidth) {
      if(this.ctx.measureText(text).width <= maxWidth) return text;
      while (this.ctx.measureText(text + '...').width > maxWidth && text.length > 0) text = text.slice(0, -1);
      return text + '...';
  }
  
  _isNodeInView(node) {
      const rect = this._getNodeVisualRect(node);
      const screenRect = {
        x: rect.x * this.scale + this.offset.x,
        y: rect.y * this.scale + this.offset.y,
        width: rect.width * this.scale,
        height: rect.height * this.scale
      };
      return screenRect.x < this.canvas.width && screenRect.x + screenRect.width > 0 &&
             screenRect.y < this.canvas.height && screenRect.y + screenRect.height > 0;
  }

  getViewportCenter() {
      const worldX = (this.canvas.width / 2 - this.offset.x) / this.scale;
      const worldY = (this.canvas.height / 2 - this.offset.y) / this.scale;
      return { x: worldX, y: worldY };
  }

  _getNodeVisualRect(node) {
      const contentHeight = node.isCollapsed ? 0 : NODE_CONTENT_HEIGHT;
      const totalHeight = NODE_HEADER_HEIGHT + contentHeight;
      return { 
        x: node.x, 
        y: node.y - contentHeight, 
        width: NODE_WIDTH, 
        height: totalHeight 
      };
  }
  
  _getDecorationBounds(deco) {
    if (deco.type === 'rectangle') {
        return { x: deco.x, y: deco.y, width: deco.width, height: deco.height };
    }
    if (deco.type === 'text') {
        const lines = this._getWrappedLines(deco);
        const bounds = this._getTextBounds(deco, lines);
        return { 
            x: deco.x - bounds.width / 2, 
            y: deco.y - bounds.height / 2, 
            width: bounds.width, 
            height: bounds.height 
        };
    }
    return { x: deco.x, y: deco.y, width: 0, height: 0 };
  }

  getClickableEntityAt(x, y, { isDecorationsLocked } = {}) {
    for (let i = this.graphData.nodes.length - 1; i >= 0; i--) {
        const node = this.graphData.nodes[i];
        const rect = this._getNodeVisualRect(node);
        if (x > rect.x && x < rect.x + rect.width && y > rect.y && y < rect.y + rect.height) {
            return { type: 'node', entity: node };
        }
    }
    
    const edge = this.getEdgeAt(x, y);
    if (edge) return { type: 'edge', entity: edge };

    if (!isDecorationsLocked) {
        for (let i = this.graphData.decorations.length - 1; i >= 0; i--) {
            const deco = this.graphData.decorations[i];
            const bounds = this._getDecorationBounds(deco);
            if (x > bounds.x && x < bounds.x + bounds.width && y > bounds.y && y < bounds.y + bounds.height) {
                return { type: 'decoration', entity: deco };
            }
        }
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
  
  getDecorationsInRect(rect) {
      const normalizedRect = this.normalizeRect(rect);
      return this.graphData.decorations.filter(deco => {
          const decoBounds = this._getDecorationBounds(deco);
          return normalizedRect.x < decoBounds.x + decoBounds.width && normalizedRect.x + normalizedRect.w > decoBounds.x &&
                 normalizedRect.y < decoBounds.y + decoBounds.height && normalizedRect.y + normalizedRect.h > decoBounds.y;
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
        
        const controlPoints = edge.controlPoints || [];
        const srcRect = this._getNodeVisualRect(src);
        const trgRect = this._getNodeVisualRect(trg);

        const targetPointForAngle = controlPoints.length > 0 ? controlPoints[0] : { x: trgRect.x + trgRect.width / 2, y: trgRect.y + trgRect.height / 2 };
        const startPoint = this._getIntersectionWithNodeRect(src, targetPointForAngle);
        
        const sourcePointForAngle = controlPoints.length > 0 ? controlPoints.at(-1) : { x: srcRect.x + srcRect.width / 2, y: srcRect.y + srcRect.height / 2 };
        const endPoint = this._getIntersectionWithNodeRect(trg, sourcePointForAngle);

        const pathPoints = [startPoint, ...controlPoints, endPoint];

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
    const startY = this.edgeCreationSource.y + NODE_HEADER_HEIGHT / 2;
    ctx.save(); ctx.beginPath(); ctx.moveTo(startX, startY); ctx.lineTo(this.mousePos.x, this.mousePos.y);
    ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 3; ctx.setLineDash([5, 5]); ctx.stroke(); ctx.restore();
  }
  
  highlight(currentId, prevId = null, edge = null) {
      this.graphData.nodes.forEach(n => n.highlighted = false);
      this.graphData.edges.forEach(e => e.highlighted = false);
      if (currentId) { const node = this.graphData.nodes.find(n => n.id === currentId); if (node) node.highlighted = true; }
      if (edge) { const e = this.graphData.edges.find(i => i.id === edge.id); if (e) e.highlighted = true; }
  }
  
  getCanvasCoords({ clientX, clientY }) {
      const rect = this.canvas.getBoundingClientRect();
      const x = (clientX - rect.left - this.offset.x) / this.scale;
      const y = (clientY - rect.top - this.offset.y) / this.scale;
      return { x, y };
  }
  
  resizeCanvas() { this.canvas.width = window.innerWidth; this.canvas.height = window.innerHeight; }
  
  wasDragged() { return this.dragged; }
  
  _getSnappedPosition(pos, movingEntity) {
      let snappedPos = { ...pos };
      this.snapLines = [];
      if (!movingEntity) return pos;

      const isPoint = !movingEntity.sourceType && !movingEntity.type;
      
      const movingBounds = isPoint 
          ? { x: pos.x, y: pos.y, width: 0, height: 0 } 
          : (this._getDecorationBounds(movingEntity) || this._getNodeVisualRect(movingEntity));
      
      if (!isPoint) {
        movingBounds.x = pos.x;
        movingBounds.y = pos.y;
      }
      
      const threshold = this.snapThreshold / this.scale;
      let bestSnapX = { delta: Infinity };
      let bestSnapY = { delta: Infinity };

      const movingPointsX = [movingBounds.x, movingBounds.x + movingBounds.width / 2, movingBounds.x + movingBounds.width];
      const movingPointsY = [movingBounds.y, movingBounds.y + movingBounds.height / 2, movingBounds.y + movingBounds.height];

      const snapTargets = [];
      this.graphData.nodes.forEach(n => {
          if (n === movingEntity || (movingEntity.id && n.id === movingEntity.id) || n.selected) return;
          snapTargets.push({ type: 'node', bounds: this._getNodeVisualRect(n) });
      });
      // NEW: Add other control points as snap targets
      this.graphData.edges.forEach(e => {
        (e.controlPoints || []).forEach(p => {
            if (p !== movingEntity) {
                snapTargets.push({ type: 'point', bounds: { x: p.x, y: p.y, width: 0, height: 0 }});
            }
        });
      });

      for (const target of snapTargets) {
          const targetBounds = target.bounds;
          const targetPointsX = [targetBounds.x, targetBounds.x + targetBounds.width / 2, targetBounds.x + targetBounds.width];
          const targetPointsY = [targetBounds.y, targetBounds.y + targetBounds.height / 2, targetBounds.y + targetBounds.height];

          for (let i = 0; i < movingPointsX.length; i++) {
              if (movingPointsX[i] === undefined) continue;
              for (let j = 0; j < targetPointsX.length; j++) {
                  const delta = targetPointsX[j] - movingPointsX[i];
                  if (Math.abs(delta) < threshold && Math.abs(delta) < Math.abs(bestSnapX.delta)) {
                      bestSnapX = { delta, pos: targetPointsX[j] };
                  }
              }
          }
          for (let i = 0; i < movingPointsY.length; i++) {
              if (movingPointsY[i] === undefined) continue;
              for (let j = 0; j < targetPointsY.length; j++) {
                  const delta = targetPointsY[j] - movingPointsY[i];
                  if (Math.abs(delta) < threshold && Math.abs(delta) < Math.abs(bestSnapY.delta)) {
                      bestSnapY = { delta, pos: targetPointsY[j] };
                  }
              }
          }
      }
      
      if (Math.abs(bestSnapX.delta) < threshold) {
          snappedPos.x += bestSnapX.delta;
          this.snapLines.push({ type: 'v', pos: bestSnapX.pos });
      }
      if (Math.abs(bestSnapY.delta) < threshold) {
          snappedPos.y += bestSnapY.delta;
          this.snapLines.push({ type: 'h', pos: bestSnapY.pos });
      }
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
    const { getIsEditorMode, getIsDecorationsLocked, onClick, onDblClick, onEdgeCreated, onMarqueeSelect, getSelection } = callbacks;

    window.addEventListener('resize', () => this.resizeCanvas());
    this.canvas.addEventListener('contextmenu', e => e.preventDefault());
    
    this.canvas.addEventListener('mousedown', (e) => {
        const isEditor = getIsEditorMode();
        const mousePos = this.getCanvasCoords(e);
        this.dragged = false;

        const handlePanStart = () => {
            this.dragging = true;
            this.dragStart.x = e.clientX - this.offset.x;
            this.dragStart.y = e.clientY - this.offset.y;
            this.canvas.style.cursor = 'grabbing';
            document.body.classList.add('is-dragging');
        };

        if (!isEditor) {
            if (e.button === 0) handlePanStart();
            return;
        }
        
        if (e.button === 1) { // Middle mouse button pan
            handlePanStart();
            return;
        }

        if (e.button === 0) { // Left mouse button
            const cp = this.getControlPointAt(mousePos.x, mousePos.y);
            if (cp) { this.draggingControlPoint = cp; document.body.classList.add('is-dragging'); return; }
            
            const clicked = this.getClickableEntityAt(mousePos.x, mousePos.y, { isDecorationsLocked: getIsDecorationsLocked() });
            
            if (clicked && (clicked.type === 'node' || clicked.type === 'decoration')) {
                const entity = clicked.entity;
                if (entity.selected) this.isDraggingSelection = true;
                this.draggingEntity = entity;
                const bounds = this._getDecorationBounds(entity) || this._getNodeVisualRect(entity);
                this.dragOffset.x = mousePos.x - bounds.x;
                this.dragOffset.y = mousePos.y - bounds.y;
                document.body.classList.add('is-dragging');
                return;
            }
            
            if (!clicked) { // Start marquee selection
                this.isMarqueeSelecting = true;
                this.marqueeRect = { x: mousePos.x, y: mousePos.y, w: 0, h: 0 };
            }

        } else if (e.button === 2) { // Right mouse button
            e.preventDefault();
            const cp = this.getControlPointAt(mousePos.x, mousePos.y);
            if (cp) { cp.edge.controlPoints.splice(cp.pointIndex, 1); }
            else { 
              const clickedNode = this.getClickableEntityAt(mousePos.x, mousePos.y, { isDecorationsLocked: true }); // Ignore decorations for edge creation
              if (clickedNode && clickedNode.type === 'node') { 
                this.isCreatingEdge = true; 
                this.edgeCreationSource = clickedNode.entity; 
              } 
            }
        }
    });

    this.canvas.addEventListener('mousemove', (e) => {
        this.mousePos = this.getCanvasCoords(e);
        if (e.buttons === 0) {
             this.dragging = this.draggingEntity = this.draggingControlPoint = this.isCreatingEdge = this.isMarqueeSelecting = this.isDraggingSelection = false;
             this.canvas.style.cursor = 'grab'; this.snapLines = [];
             document.body.classList.remove('is-dragging');
             return;
        }
        this.dragged = true;

        if (this.dragging) {
            this.offset.x = e.clientX - this.dragStart.x;
            this.offset.y = e.clientY - this.dragStart.y;
        } else if (this.isDraggingSelection) {
            const isLocked = getIsDecorationsLocked();
            const originalBounds = this._getDecorationBounds(this.draggingEntity) || this._getNodeVisualRect(this.draggingEntity);
            const targetX = this.mousePos.x - this.dragOffset.x;
            const targetY = this.mousePos.y - this.dragOffset.y;
            
            const snappedPos = this._getSnappedPosition({ x: targetX, y: targetY }, this.draggingEntity);
            const dx = snappedPos.x - originalBounds.x;
            const dy = snappedPos.y - originalBounds.y;

            getSelection().forEach(entity => {
                if (isLocked && (entity.type === 'rectangle' || entity.type === 'text')) return;

                if ('x' in entity) { entity.x += dx; entity.y += dy; }
                else if (entity.controlPoints) { entity.controlPoints.forEach(p => { p.x += dx; p.y += dy; }); }
            });

        } else if (this.draggingEntity) {
            const originalBounds = this._getDecorationBounds(this.draggingEntity) || this._getNodeVisualRect(this.draggingEntity);
            const targetX = this.mousePos.x - this.dragOffset.x;
            const targetY = this.mousePos.y - this.dragOffset.y;
            const snappedPos = this._getSnappedPosition({x: targetX, y: targetY}, this.draggingEntity);
            
            const dx = snappedPos.x - originalBounds.x;
            const dy = snappedPos.y - originalBounds.y;

            this.draggingEntity.x += dx;
            this.draggingEntity.y += dy;

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
            const targetClick = this.getClickableEntityAt(this.mousePos.x, this.mousePos.y, { isDecorationsLocked: true });
            if (targetClick && targetClick.type === 'node' && this.edgeCreationSource && targetClick.entity.id !== this.edgeCreationSource.id) {
                onEdgeCreated(this.edgeCreationSource, targetClick.entity);
            }
        }
        this.dragging = this.draggingEntity = this.draggingControlPoint = this.isCreatingEdge = this.isMarqueeSelecting = this.isDraggingSelection = false;
        this.canvas.style.cursor = 'grab'; this.snapLines = [];
        document.body.classList.remove('is-dragging');
        setTimeout(() => { this.dragged = false; }, 0);
    });

    this.canvas.addEventListener('mouseleave', () => {
        if (this.dragging || this.draggingEntity || this.draggingControlPoint || this.isCreatingEdge || this.isMarqueeSelecting) {
            this.dragging = this.draggingEntity = this.draggingControlPoint = this.isCreatingEdge = this.isMarqueeSelecting = this.isDraggingSelection = false;
            this.canvas.style.cursor = 'grab';
            this.snapLines = [];
            document.body.classList.remove('is-dragging');
        }
    });
    
    this.canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const zoomIntensity = 0.1;
        const wheel = e.deltaY < 0 ? 1 : -1;
        const zoom = Math.exp(wheel * zoomIntensity);
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        this.offset.x = mouseX - (mouseX - this.offset.x) * zoom;
        this.offset.y = mouseY - (mouseY - this.offset.y) * zoom;
        this.scale *= zoom;
        this.scale = Math.max(0.1, Math.min(5, this.scale));
    });

    this.canvas.addEventListener('click', onClick);
    this.canvas.addEventListener('dblclick', onDblClick);
  }
}

