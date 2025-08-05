

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
  <canvas id="graphCanvas"></canvas>

  <!-- UNIFIED TOP TOOLBAR -->
  <div id="topToolbar">
    <!-- Mode Switcher (Always Visible) -->
    <label class="switch" title="Toggle Editor Mode">
      <input type="checkbox" id="editorModeToggle">
      <span class="slider"></span>
    </label>
    <span class="editor-mode-label">Editor Mode</span>
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
 * AVN Player v2.3 - Main Application
 * by Nftxv
 */
import GraphData from './modules/GraphData.js';
import Renderer from './modules/Renderer.js';
import Player from './modules/Player.js';
import EditorTools from './modules/EditorTools.js';
import Navigation from './modules/Navigation.js';

class GraphApp {
  constructor() { /* ... без изменений ... */ }
  async init() { /* ... без изменений ... */ }
  toggleEditorMode(isEditor) { /* ... без изменений ... */ }

  setupEventListeners() {
    this.renderer.setupCanvasInteraction({
        onClick: (e) => this.handleCanvasClick(e),
        onDblClick: (e) => this.handleCanvasDblClick(e),
        onEdgeCreated: (source, target) => {
            if (this.isEditorMode) this.editorTools.createEdge(source, target);
        },
        onSelectionChange: (rect, shiftKey) => {
            if (this.isEditorMode) this.editorTools.selectEntitiesInRect(rect, shiftKey);
        }
    });

    document.getElementById('editorModeToggle').addEventListener('change', (e) => this.toggleEditorMode(e.target.checked));
    
    document.getElementById('exportBtn').addEventListener('click', () => this.editorTools.exportGraph());
    document.getElementById('resetBtn').addEventListener('click', () => this.editorTools.resetGraph());

    document.getElementById('addNodeBtn').addEventListener('click', () => { /* ... */ });
    
    // ИСПРАВЛЕНИЕ: Кнопка "Удалить" теперь вызывает deleteSelection
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
    
    if (this.isEditorMode) {
      const coords = this.renderer.getCanvasCoords(event);
      const clickedNode = this.renderer.getNodeAt(coords.x, coords.y);
      const clickedEdge = !clickedNode ? this.renderer.getEdgeAt(coords.x, coords.y) : null;
      
      this.editorTools.selectEntity(clickedNode || clickedEdge, event.shiftKey);
    } else {
      // ... player mode logic
    }
  }
  
  handleCanvasDblClick(event) { /* ... без изменений ... */ }
}

window.addEventListener('load', () => { /* ... без изменений ... */ });


## ./public/js/modules/EditorTools.js

/**
 * AVN Player v2.3 - Editor Tools Module
 * by Nftxv
 */
export default class EditorTools {
  constructor(graphData, renderer) {
    this.graphData = graphData;
    this.renderer = renderer;
    this.editingNode = null;
    this.selection = []; // Now an array to hold multiple items
  }

  createNode() { /* ... без изменений ... */ }
  createEdge(sourceNode, targetNode) { /* ... без изменений ... */ }

  deleteSelection() {
    if (this.selection.length === 0 || !confirm(`Delete ${this.selection.length} selected item(s)?`)) return;

    const idsToDelete = new Set(this.selection.filter(e => !e.source).map(n => n.id));
    const edgesToDelete = this.selection.filter(e => e.source);
    
    // Delete nodes and any connected edges
    if (idsToDelete.size > 0) {
        this.graphData.nodes = this.graphData.nodes.filter(n => !idsToDelete.has(n.id));
        this.graphData.edges = this.graphData.edges.filter(e => !idsToDelete.has(e.source) && !idsToDelete.has(e.target));
    }
    
    // Delete edges that were explicitly selected
    this.graphData.edges = this.graphData.edges.filter(e => !edgesToDelete.includes(e));

    this.clearSelection();
  }

  // --- Selection Management ---
  
  clearSelection() {
    this.selection.forEach(e => e.selected = false);
    this.selection = [];
    document.getElementById('deleteSelectionBtn').disabled = true;
  }

  selectEntity(entity, addToSelection = false) {
    if (!addToSelection) {
      this.clearSelection();
    }
    
    if (entity) {
      if (this.selection.includes(entity)) {
        // If shift-clicking an already selected item, deselect it
        if (addToSelection) {
          entity.selected = false;
          this.selection = this.selection.filter(e => e !== entity);
        }
      } else {
        entity.selected = true;
        this.selection.push(entity);
      }
    }
    document.getElementById('deleteSelectionBtn').disabled = this.selection.length === 0;
  }
  
  selectEntitiesInRect(rect, addToSelection = false) {
    if (!addToSelection) {
      this.clearSelection();
    }
    
    const nodeWidth = 160;
    const nodeHeight = 90;

    this.graphData.nodes.forEach(node => {
        // Check if node center is inside the rectangle
        const nodeCenterX = node.x + nodeWidth / 2;
        const nodeCenterY = node.y + nodeHeight / 2;
        if (nodeCenterX > rect.x && nodeCenterX < rect.x + rect.width &&
            nodeCenterY > rect.y && nodeCenterY < rect.y + rect.height) {
            
            if (!this.selection.includes(node)) {
                node.selected = true;
                this.selection.push(node);
            }
        }
    });
    
    // You could add edge selection logic here as well
    
    document.getElementById('deleteSelectionBtn').disabled = this.selection.length === 0;
  }

  openInspector(node) { /* ... без изменений ... */ }
  saveInspectorChanges() { /* ... без изменений ... */ }
  closeInspector() { /* ... без изменений ... */ }
  openSettings() { /* ... без изменений ... */ }
  saveSettings() { /* ... без изменений ... */ }
  closeSettings() { /* ... без изменений ... */ }
  exportGraph() { /* ... без изменений ... */ }
  resetGraph() { /* ... без изменений ... */ }
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
    // Store metadata, providing a default IPFS gateway if none is specified
    this.meta = data.meta || { gateways: ['https://cloudflare-ipfs.com/ipfs/'] };
    const graph = data['@graph'] || [];

    // Filter and map nodes of type 'MusicRecording'
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
      }));

    // Filter and map edges of type 'Path'
    this.edges = graph
      .filter(item => item['@type'] === 'Path')
      .map(edge => ({
        source: edge.source,
        target: edge.target,
        color: edge.color || '#4a86e8', // Default edge color
        label: edge.label || '',
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

  /**
   * Finds a node by its unique ID.
   * @param {string} id - The ID of the node to find.
   * @returns {object|undefined}
   */
  getNodeById(id) {
    return this.nodes.find(node => node.id === id);
  }
  
  /**
   * Finds all edges originating from a specific node.
   * @param {string} nodeId - The ID of the source node.
   * @returns {Array<object>}
   */
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
 * AVN Player v2.3 - Renderer Module with Marquee Selection
 * by Nftxv
 */
export default class Renderer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    
    // Data
    this.nodes = [];
    this.edges = [];
    this.meta = {};
    this.images = {};

    // View camera state
    this.offset = { x: 0, y: 0 };
    this.scale = 1.0;
    
    // Interaction states
    this.dragged = false;
    this.mousePos = { x: 0, y: 0 };

    // Action states
    this.isPanning = false; // Middle mouse drag
    this.isDraggingNodes = false; // Left mouse drag on a selection
    this.isCreatingEdge = false; // Right mouse drag
    this.isMarqueeSelecting = false; // Left mouse drag on empty space

    // Dragging details
    this.dragStart = { x: 0, y: 0 };
    this.draggingNodes = []; // The group of nodes being dragged
    this.edgeCreationSource = null;

    // Marquee selection details
    this.marqueeRect = { x: 0, y: 0, width: 0, height: 0 };

    this.resizeCanvas();
    this.renderLoop = this.renderLoop.bind(this);
  }

  setData(nodes, edges, meta) {
    this.nodes = nodes;
    this.edges = edges;
    this.meta = meta;
  }

  async loadAndRenderAll() { /* ... без изменений ... */ }
  async loadImages() { /* ... без изменений ... */ }
  getSourceUrl(source) { /* ... без изменений ... */ }
  
  getNodeAt(x, y) { /* ... без изменений ... */ }
  getEdgeAt(x, y) { /* ... без изменений ... */ }

  renderLoop() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.save();
    this.ctx.translate(this.offset.x, this.offset.y);
    this.ctx.scale(this.scale, this.scale);

    this.edges.forEach(edge => this.drawEdge(edge));
    this.nodes.forEach(node => this.drawNode(node));
    
    if (this.isCreatingEdge && this.edgeCreationSource) {
      this.drawTemporaryEdge();
    }
    
    if (this.isMarqueeSelecting) {
      this.drawMarquee();
    }

    this.ctx.restore();
    requestAnimationFrame(this.renderLoop);
  }

  drawNode(node) { /* ... без изменений ... */ }
  drawEdge(edge) { /* ... без изменений ... */ }
  drawTemporaryEdge() { /* ... без изменений ... */ }
  
  drawMarquee() {
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = '#00faff';
    ctx.lineWidth = 1;
    ctx.fillStyle = 'rgba(0, 250, 255, 0.1)';
    ctx.beginPath();
    ctx.rect(this.marqueeRect.x, this.marqueeRect.y, this.marqueeRect.width, this.marqueeRect.height);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  highlight(currentId, prevId = null, edge = null) { /* ... без изменений ... */ }
  getCanvasCoords({ clientX, clientY }) { /* ... без изменений ... */ }
  resizeCanvas() { /* ... без изменений ... */ }
  wasDragged() { return this.dragged; }

  setupCanvasInteraction(callbacks) {
      const { onClick, onDblClick, onEdgeCreated, onSelectionChange } = callbacks;

      window.addEventListener('resize', () => this.resizeCanvas());

      this.canvas.addEventListener('mousedown', (e) => {
          this.dragStart = this.getCanvasCoords(e);
          this.dragged = false;
          
          const clickedNode = this.getNodeAt(this.dragStart.x, this.dragStart.y);

          if (e.button === 0) { // Left Mouse Button
              if (clickedNode && clickedNode.selected) {
                  this.isDraggingNodes = true;
                  // Prepare all selected nodes for dragging
                  this.draggingNodes = this.nodes.filter(n => n.selected);
                  this.draggingNodes.forEach(n => {
                      n.dragOffsetX = this.dragStart.x - n.x;
                      n.dragOffsetY = this.dragStart.y - n.y;
                  });
              } else {
                  this.isMarqueeSelecting = true;
                  this.marqueeRect.x = this.dragStart.x;
                  this.marqueeRect.y = this.dragStart.y;
                  this.marqueeRect.width = 0;
                  this.marqueeRect.height = 0;
              }
          } else if (e.button === 1) { // Middle Mouse Button
              e.preventDefault();
              this.isPanning = true;
              this.dragStart.panX = e.clientX - this.offset.x;
              this.dragStart.panY = e.clientY - this.offset.y;
          } else if (e.button === 2) { // Right Mouse Button
              if (clickedNode) {
                  this.isCreatingEdge = true;
                  this.edgeCreationSource = clickedNode;
              }
          }
      });

      this.canvas.addEventListener('mousemove', (e) => {
          const currentMousePos = this.getCanvasCoords(e);
          this.mousePos = currentMousePos; // for temp edge
          
          if (this.isPanning || this.isDraggingNodes || this.isMarqueeSelecting || this.isCreatingEdge) {
              this.dragged = true;
          }

          if (this.isDraggingNodes) {
              this.draggingNodes.forEach(n => {
                  n.x = currentMousePos.x - n.dragOffsetX;
                  n.y = currentMousePos.y - n.dragOffsetY;
              });
          } else if (this.isMarqueeSelecting) {
              this.marqueeRect.width = currentMousePos.x - this.marqueeRect.x;
              this.marqueeRect.height = currentMousePos.y - this.marqueeRect.y;
          } else if (this.isPanning) {
              this.offset.x = e.clientX - this.dragStart.panX;
              this.offset.y = e.clientY - this.dragStart.panY;
          }
      });

      this.canvas.addEventListener('mouseup', (e) => {
          if (this.isMarqueeSelecting) {
              const rect = this.normalizeRect(this.marqueeRect);
              onSelectionChange(rect, e.shiftKey);
          }
          if (this.isCreatingEdge) {
              const targetNode = this.getNodeAt(this.mousePos.x, this.mousePos.y);
              if (targetNode && this.edgeCreationSource) {
                  onEdgeCreated(this.edgeCreationSource, targetNode);
              }
          }
          
          // Reset all states
          this.isPanning = false;
          this.isDraggingNodes = false;
          this.isMarqueeSelecting = false;
          this.isCreatingEdge = false;
          this.draggingNodes = [];

          setTimeout(() => { this.dragged = false; }, 0);
      });
      
      this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
      this.canvas.addEventListener('mouseleave', () => { /* ... сброс состояний ... */ });
      this.canvas.addEventListener('wheel', (e) => { /* ... без изменений ... */ });

      this.canvas.addEventListener('click', onClick);
      this.canvas.addEventListener('dblclick', onDblClick);
  }
  
  normalizeRect(rect) {
    return {
        x: rect.width < 0 ? rect.x + rect.width : rect.x,
        y: rect.height < 0 ? rect.y + rect.height : rect.y,
        width: Math.abs(rect.width),
        height: Math.abs(rect.height),
    };
  }
}

