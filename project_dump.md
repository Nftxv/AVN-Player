
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
 * AVN Player v2.2 - Main Application
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
      this.renderer.setData(this.graphData.nodes, this.graphData.edges, this.graphData.meta);
      await this.renderer.loadAndRenderAll();
      this.setupEventListeners();
      this.toggleEditorMode(false); // Убедимся, что начинаем в режиме плеера
      console.log('Application initialized successfully.');
    } catch (error) {
      console.error('Initialization failed:', error);
      alert('Could not load the application.');
    }
  }

  toggleEditorMode(isEditor) {
    this.isEditorMode = isEditor;
    document.body.classList.toggle('editor-mode', isEditor);
    
    // Сбрасываем состояния при переключении
    this.player.stop();
    this.navigation.reset();
    
    if (!isEditor) {
      this.editorTools.selectEntity(null);
      this.editorTools.closeInspector();
    }
  }

  setupEventListeners() {
    this.renderer.setupCanvasInteraction(
        (e) => this.handleCanvasClick(e),
        (e) => this.handleCanvasDblClick(e),
        (source, target) => {
            if (this.isEditorMode) {
                this.editorTools.createEdge(source, target);
            }
        }
    );

    // --- СЛУШАТЕЛИ ДЛЯ ЕДИНОЙ ПАНЕЛИ ---
    document.getElementById('editorModeToggle').addEventListener('change', (e) => this.toggleEditorMode(e.target.checked));
    
    // Кнопки режима плеера
    document.getElementById('exportBtn').addEventListener('click', () => this.editorTools.exportGraph());
    document.getElementById('resetBtn').addEventListener('click', () => this.editorTools.resetGraph());

    // Кнопки режима редактора
    document.getElementById('addNodeBtn').addEventListener('click', () => {
        const newNode = this.editorTools.createNode();
        this.editorTools.selectEntity(newNode);
        this.editorTools.openInspector(newNode);
    });
    document.getElementById('deleteSelectionBtn').addEventListener('click', () => {
        this.editorTools.deleteEntity(this.editorTools.selectedEntity);
    });
    document.getElementById('settingsBtn').addEventListener('click', () => this.editorTools.openSettings());
    
    // --- СЛУШАТЕЛИ ИНСПЕКТОРА И МОДАЛЬНЫХ ОКОН ---
    document.getElementById('saveNodeBtn').addEventListener('click', () => this.editorTools.saveInspectorChanges());
    document.getElementById('closeInspectorBtn').addEventListener('click', () => this.editorTools.closeInspector());
    document.getElementById('saveSettingsBtn').addEventListener('click', () => this.editorTools.saveSettings());
    document.getElementById('closeSettingsBtn').addEventListener('click', () => this.editorTools.closeSettings());
    
    // --- СЛУШАТЕЛИ ПЛЕЕРА ---
    document.getElementById('playBtn').addEventListener('click', () => this.player.togglePlay());
    document.getElementById('backBtn').addEventListener('click', () => this.navigation.goBack());
    document.getElementById('nextBtn').addEventListener('click', () => this.navigation.advance());
  }

  handleCanvasClick(event) {
    if (this.renderer.wasDragged()) return;
    const coords = this.renderer.getCanvasCoords(event);
    
    if (this.isEditorMode) {
      const clickedNode = this.renderer.getNodeAt(coords.x, coords.y);
      if (clickedNode) {
        this.editorTools.selectEntity(clickedNode);
        return; // Нашли ноду, выходим
      }

      const clickedEdge = this.renderer.getEdgeAt(coords.x, coords.y);
      if (clickedEdge) {
        this.editorTools.selectEntity(clickedEdge);
        return; // Нашли связь, выходим
      }
      
      // Если кликнули в пустоту, снимаем выделение
      this.editorTools.selectEntity(null);

    } else { // Режим плеера
      const clickedNode = this.renderer.getNodeAt(coords.x, coords.y);
      if (clickedNode) {
        this.navigation.startFromNode(clickedNode.id);
      }
    }
  }
  
  handleCanvasDblClick(event) {
    if (!this.isEditorMode) return;
    const coords = this.renderer.getCanvasCoords(event);
    const clickedNode = this.renderer.getNodeAt(coords.x, coords.y);
    if (clickedNode) {
        this.editorTools.openInspector(clickedNode);
    }
  }
}

window.addEventListener('load', () => {
  const app = new GraphApp();
  app.init();
});


## ./public/js/modules/EditorTools.js

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
    // ...
    const newEdge = {
      source: sourceNode.id,
      target: targetNode.id,
      // color: '#4a86e8', // УДАЛЯЕМ ЭТУ СТРОКУ
      label: ''
    };
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
 * AVN Player v1.4 - Renderer Module
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
 * Handles all rendering on the canvas, including nodes, edges, and user interactions
 * like panning, zooming, and visual editing.
 */
export default class Renderer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    
    // Data
    this.nodes = [];
    this.edges = [];
    this.meta = {};
    this.images = {}; // Cache for loaded cover images

    // View camera state
    this.offset = { x: 0, y: 0 };
    this.scale = 1.0;
    
    // General dragging state
    this.dragStart = { x: 0, y: 0 };
    this.dragging = false; // For canvas panning
    this.dragged = false;  // To distinguish a drag from a click

    // Node dragging state
    this.draggingNode = null;
    this.dragNodeOffset = { x: 0, y: 0 };

    // Edge creation state
    this.isCreatingEdge = false;
    this.edgeCreationSource = null;
    this.mousePos = { x: 0, y: 0 };

    this.resizeCanvas();
    this.renderLoop = this.renderLoop.bind(this);
  }

  setData(nodes, edges, meta) {
    this.nodes = nodes;
    this.edges = edges;
    this.meta = meta;
  }

  async loadAndRenderAll() {
    await this.loadImages();
    this.renderLoop();
  }

  async loadImages() {
    const promises = this.nodes.flatMap(node =>
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
    if (source.type === 'ipfs') {
      const gateway = this.meta.gateways?.[0] || 'https://ipfs.io/ipfs/';
      return `${gateway}${source.value}`;
    }
    return source.value;
  }
  
  getNodeAt(x, y) {
    // Iterate backwards to select the top-most node
    for (let i = this.nodes.length - 1; i >= 0; i--) {
        const node = this.nodes[i];
        const width = 160, height = 90;
        if (x > node.x && x < node.x + width && y > node.y && y < node.y + height) {
            return node;
        }
    }
    return null;
  }

  getEdgeAt(x, y) {
    const tolerance = 5; // Click tolerance in pixels
    for (const edge of this.edges) {
      const src = this.nodes.find(n => n.id === edge.source);
      const trg = this.nodes.find(n => n.id === edge.target);
      if (!src || !trg) continue;

      const startX = src.x + 80, startY = src.y + 45;
      const endX = trg.x + 80, endY = trg.y + 45;
      const cpX = (startX + endX) / 2 + (startY - endY) * 0.2;
      const cpY = (startY + endY) / 2 + (endX - startX) * 0.2;

      // A simple distance check to the curve's midpoint
      const dist = Math.sqrt(Math.pow(x - cpX, 2) + Math.pow(y - cpY, 2));
      if (dist < tolerance * 5) { // A wider tolerance for the midpoint
        return edge;
      }
    }
    return null;
  }

  renderLoop() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.save();
    this.ctx.translate(this.offset.x, this.offset.y);
    this.ctx.scale(this.scale, this.scale);

    this.edges.forEach(edge => this.drawEdge(edge));
    this.nodes.forEach(node => this.drawNode(node));
    
    // Draw the temporary line for edge creation
    if (this.isCreatingEdge && this.edgeCreationSource) {
      this.drawTemporaryEdge();
    }

    this.ctx.restore();
    requestAnimationFrame(this.renderLoop);
  }

  drawNode(node) {
    const ctx = this.ctx;
    const width = 160, height = 90;
    ctx.save();
    
    // Determine style based on state: selected (editor) > highlighted (player) > default
    if (node.selected) {
        ctx.strokeStyle = '#e74c3c'; // Red for selected
        ctx.lineWidth = 4;
    } else if (node.highlighted) {
        ctx.strokeStyle = '#FFD700'; // Gold for highlighted
        ctx.lineWidth = 4;
    } else {
        ctx.strokeStyle = '#4a86e8'; // Blue for default
        ctx.lineWidth = 2;
    }

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(node.x, node.y, width, height, 8) : ctx.rect(node.x, node.y, width, height);
    ctx.fill();
    ctx.stroke();

    // Draw cover image
    const coverSource = node.coverSources?.[0];
    const coverUrl = this.getSourceUrl(coverSource);
    if (coverUrl && this.images[coverUrl]) {
        ctx.drawImage(this.images[coverUrl], node.x + 5, node.y + 5, height - 10, height - 10);
    } else {
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(node.x + 5, node.y + 5, height - 10, height - 10);
    }

    // Draw title
    ctx.fillStyle = '#000000';
    ctx.font = '14px Segoe UI';
    ctx.fillText(node.title, node.x + height, node.y + 25, width - height - 10);
    ctx.restore();
  }

// Файл: public/js/modules/Renderer.js

  // ЗАМЕНИТЕ ВЕСЬ СТАРЫЙ МЕТОД drawEdge НА ЭТОТ
  drawEdge(edge) {
      const src = this.nodes.find(n => n.id === edge.source);
      const trg = this.nodes.find(n => n.id === edge.target);
      if (!src || !trg) return;
      
      const ctx = this.ctx;
      
      const nodeWidth = 160;
      const nodeHeight = 90;
      // "Магическая" константа. Это радиус скругления, который вы используете в drawNode.
      // Мы заставим линию заходить внутрь на это расстояние.
      const cornerRadius = 8; 

      const startX = src.x + nodeWidth / 2;
      const startY = src.y + nodeHeight / 2;
      let endX = trg.x + nodeWidth / 2;
      let endY = trg.y + nodeHeight / 2;

      // --- МАТЕМАТИКА ДЛЯ ОПРЕДЕЛЕНИЯ ТОЧКИ НА ГРАНИЦЕ НОДЫ ---
      const dx = endX - startX;
      const dy = endY - startY;
      const angle = Math.atan2(dy, dx);

      // Рассчитываем точку пересечения с прямоугольником целевой ноды
      const h_x = nodeWidth / 2;
      const h_y = nodeHeight / 2;
      const tan_angle = Math.tan(angle);
      
      let finalX = endX;
      let finalY = endY;
      
      // Расчет точки на границе острого прямоугольника
      if (Math.abs(dy) < Math.abs(dx) * (h_y / h_x)) {
          finalX = endX - Math.sign(dx) * h_x;
          finalY = endY - Math.sign(dx) * h_x * tan_angle;
      } else {
          finalY = endY - Math.sign(dy) * h_y;
          finalX = endX - Math.sign(dy) * h_y / tan_angle;
      }

      // --- ИСПРАВЛЕНИЕ ЗДЕСЬ ---
      // Смещаем конечную точку немного "внутрь" по направлению к центру ноды.
      // Это компенсирует скругленные углы.
      finalX -= Math.cos(angle) * cornerRadius;
      finalY -= Math.sin(angle) * cornerRadius;
      
      // --- СТИЛИЗАЦИЯ ---
      let color = edge.color || '#888888';
      if (edge.selected) color = '#e74c3c';
      if (edge.highlighted) color = '#FFD700';

      const lineWidth = edge.selected || edge.highlighted ? 2 : 1;
      
      ctx.save();
      
      // --- РИСУЕМ ЛИНИЮ ---
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(finalX, finalY);
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.stroke();

      // --- РИСУЕМ СТРЕЛКУ ---
      const arrowSize = 8;
      ctx.translate(finalX, finalY);
      ctx.rotate(angle);
      
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-arrowSize, -arrowSize / 2);
      ctx.lineTo(-arrowSize, arrowSize / 2);
      ctx.closePath();
      
      ctx.fillStyle = color;
      ctx.fill();

      ctx.restore();
  }
      
  drawTemporaryEdge() {
      const ctx = this.ctx;
      const startX = this.edgeCreationSource.x + 80;
      const startY = this.edgeCreationSource.y + 45;
      
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(this.mousePos.x, this.mousePos.y);
      ctx.strokeStyle = '#e74c3c';
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.restore();
  }

  highlight(currentId, prevId = null, edge = null) {
      if(prevId) {
          const prevNode = this.nodes.find(n => n.id === prevId);
          if (prevNode) prevNode.highlighted = false;
      }
      if(currentId) {
          const currentNode = this.nodes.find(n => n.id === currentId);
          if (currentNode) currentNode.highlighted = true;
      }
      this.edges.forEach(e => e.highlighted = false);
      if(edge) {
          const edgeToHighlight = this.edges.find(e => e.source === edge.source && e.target === edge.target);
          if (edgeToHighlight) edgeToHighlight.highlighted = true;
      }
  }
  
  getCanvasCoords({ clientX, clientY }) {
      const rect = this.canvas.getBoundingClientRect();
      const x = (clientX - rect.left - this.offset.x) / this.scale;
      const y = (clientY - rect.top - this.offset.y) / this.scale;
      return { x, y };
  }
  
  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }
  
  wasDragged() { return this.dragged; }

  setupCanvasInteraction(onClick, onDblClick, onEdgeCreated) {
      window.addEventListener('resize', () => this.resizeCanvas());

      // --- Left Click Down: Pan or start dragging a node ---
      this.canvas.addEventListener('mousedown', (e) => {
          if (e.button !== 0) return; // Only handle left clicks
          const mousePos = this.getCanvasCoords(e);
          const clickedNode = this.getNodeAt(mousePos.x, mousePos.y);

          if (clickedNode) {
              this.draggingNode = clickedNode;
              this.dragNodeOffset.x = mousePos.x - clickedNode.x;
              this.dragNodeOffset.y = mousePos.y - clickedNode.y;
          } else {
              this.dragging = true;
              this.dragStart.x = e.clientX - this.offset.x;
              this.dragStart.y = e.clientY - this.offset.y;
          }
          this.dragged = false;
      });

      // --- Right Click Down: Start creating an edge ---
      this.canvas.addEventListener('contextmenu', (e) => {
          e.preventDefault(); // Prevent browser context menu
          const mousePos = this.getCanvasCoords(e);
          const clickedNode = this.getNodeAt(mousePos.x, mousePos.y);
          if (clickedNode) {
              this.isCreatingEdge = true;
              this.edgeCreationSource = clickedNode;
          }
      });
      
      // --- Mouse Move: Handle all dragging types ---
      this.canvas.addEventListener('mousemove', (e) => {
          this.mousePos = this.getCanvasCoords(e);
          
          // Only set dragged flag if a button is held down
          if (this.dragging || this.draggingNode || this.isCreatingEdge) {
              this.dragged = true;
          }

          if (this.draggingNode) {
              this.draggingNode.x = this.mousePos.x - this.dragNodeOffset.x;
              this.draggingNode.y = this.mousePos.y - this.dragNodeOffset.y;
          } else if (this.dragging) {
              this.offset.x = e.clientX - this.dragStart.x;
              this.offset.y = e.clientY - this.dragStart.y;
          }
      });

      // --- Mouse Up: Finalize actions ---
      this.canvas.addEventListener('mouseup', (e) => {
          if (this.isCreatingEdge) {
              const targetNode = this.getNodeAt(this.mousePos.x, this.mousePos.y);
              if (targetNode && this.edgeCreationSource) {
                  onEdgeCreated(this.edgeCreationSource, targetNode);
              }
          }
          
          // Reset all dragging states
          this.dragging = false;
          this.draggingNode = null;
          this.isCreatingEdge = false;
          this.edgeCreationSource = null;

          // Use a timeout to reset the 'dragged' flag after the 'click' event has fired
          setTimeout(() => { this.dragged = false; }, 0);
      });

      this.canvas.addEventListener('mouseleave', () => {
          this.dragging = false;
          this.draggingNode = null;
          this.isCreatingEdge = false;
      });
      
      // --- Wheel: Zoom ---
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

      // --- Pass control for clicks back to the main app ---
      this.canvas.addEventListener('click', onClick);
      this.canvas.addEventListener('dblclick', onDblClick);
  }
}

