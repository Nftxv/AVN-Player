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
  <!-- NEW: Container for Markdown overlays -->
  <div id="markdown-container"></div>

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
    <button id="followModeBtn" title="Toggle Follow Mode">[⊙]</button> 
    <div class="divider"></div>

    <!-- Player Mode Controls (now empty) -->
    <div id="playerModeControls">
    </div>

    <!-- Editor Mode Controls (hidden by default) -->
    <div id="editorModeControls">
      <button id="addNodeBtn" title="Add New Node">Add Node</button>
      <div class="divider"></div>
      <button id="addRectBtn" title="Add Rectangle Shape">Add Rect</button>
      <button id="addTextBtn" title="Add Markdown Block">Add Text</button>
      <button id="lockDecorationsBtn" title="Lock/Unlock Decorations">🔓</button>
      <div class="divider"></div>
      <button id="groupSelectionBtn" title="Group Selected Decorations" disabled>Group</button>
      <button id="attachToNodeBtn" title="Attach Group to Node" disabled>Attach</button>
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
    <div id="playerContent">
      <div id="songTitle">Select a node to begin...</div>
      <div id="playerControls">
        <button id="backBtn" title="Go Back">⏮</button>
        <button id="playBtn" title="Play/Pause">▶</button>
        <button id="nextBtn" title="Next">⏭</button>
        <input type="range" id="progress" value="0">
        <span id="currentTime">0:00</span>
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
  
  <!-- External Libraries for Markdown -->
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/dompurify/dist/purify.min.js"></script>

  <script src="js/app.js" type="module"></script>

  <footer id="copyright">
    AVN Player © 2025 Nftxv — <a href="https://AbyssVoid.com/" target="_blank" rel="noopener nofollow">AbyssVoid.com</a>
  </footer>
</body>
</html>


## ./public/style.css

:root {
  --player-height: 60px;
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
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
  background-color: var(--dark-bg);
  color: var(--dark-text);
}

canvas {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
  display: block;
  cursor: grab;
}
canvas:active {
  cursor: grabbing;
}

#iframe-container, #markdown-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2; 
  pointer-events: none;
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
  pointer-events: auto;
}

.markdown-overlay {
  position: absolute;
  box-sizing: border-box;
  padding: 15px;
  overflow-y: auto;
  color: var(--dark-text);
  background-color: rgba(45, 45, 45, 0.85);
  backdrop-filter: blur(5px);
  border: 1px solid var(--dark-border);
  border-radius: 6px;
  line-height: 1.5;
  pointer-events: auto; /* Active for player mode */
}

/* REVISED: In editor mode, all overlays are transparent to clicks, fixing selection. */
body.editor-mode .markdown-overlay, body.editor-mode .iframe-wrapper {
    pointer-events: none;
}

.markdown-overlay.selected {
  border: 2px solid #e74c3c !important; /* Use important to override base style */
}

.markdown-overlay a {
  color: var(--primary-color);
  text-decoration: none;
}
.markdown-overlay a:hover {
  text-decoration: underline;
}
.markdown-overlay img {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
}
.markdown-overlay h1, .markdown-overlay h2, .markdown-overlay h3 {
  margin-top: 0.5em;
  margin-bottom: 0.5em;
  border-bottom: 1px solid var(--dark-border);
  padding-bottom: 0.3em;
}
.markdown-overlay pre {
  background-color: var(--dark-bg);
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
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

#playerContent {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  min-width: 0;
  align-items: center;
}

#songTitle {
  font-weight: 600;
  font-size: 1em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--dark-text);
  width: 100%;
  text-align: center;
}

#playerControls {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  max-width: 500px;
  justify-content: center;
}

#progress { flex-grow: 1; }

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
  #player { flex-direction: column; height: auto; padding-bottom: 15px;}
  #songTitle { text-align: center; }
  #playerControls { width: 100%; }
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
  flex-wrap: wrap;
}
#playerModeControls, #editorModeControls { display: flex; gap: 10px; align-items: center; }
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
    min-height: 120px;
    font-family: Consolas, "Courier New", monospace;
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

#followModeBtn {
    background: #3c3c3c;
    color: var(--dark-subtle-text);
    padding: 6px 10px;
    font-size: 18px;
    line-height: 1;
}

#followModeBtn:hover {
    background: #4f4f4f;
    transform: none;
}

#followModeBtn.active {
    background: var(--primary-color);
    color: white;
    box-shadow: inset 0 0 5px rgba(0,0,0,0.3);
}


## ./public/data/default.jsonld

{
  "@context": "https://schema.org/",
  "@graph": [
    {
      "@id": "node-1",
      "@type": "MusicRecording",
      "name": "Chasing the Moon",
      "position": {
        "x": 92,
        "y": 230
      },
      "isCollapsed": true,
      "sourceType": "iframe",
      "audioUrl": null,
      "coverUrl": null,
      "lyricsUrl": null,
      "iframeUrl": "4eJpTAxdxiU"
    },
    {
      "@id": "node-2",
      "@type": "MusicRecording",
      "name": "Ballad of Everything (2 version)",
      "position": {
        "x": -72,
        "y": 495.0138468887229
      },
      "isCollapsed": true,
      "sourceType": "iframe",
      "audioUrl": null,
      "coverUrl": null,
      "lyricsUrl": null,
      "iframeUrl": "YGJvDBRbYdM"
    },
    {
      "@id": "node-3a",
      "@type": "MusicRecording",
      "name": "Ballad of Everything (1 version)",
      "position": {
        "x": 273.18977016560103,
        "y": 498.26384688872304
      },
      "isCollapsed": true,
      "sourceType": "iframe",
      "audioUrl": null,
      "coverUrl": null,
      "lyricsUrl": null,
      "iframeUrl": "_IK2VLriSxs"
    },
    {
      "@id": "node-3b",
      "@type": "MusicRecording",
      "name": "Love Transcends",
      "position": {
        "x": 92,
        "y": 678.9786584887257
      },
      "isCollapsed": true,
      "sourceType": "iframe",
      "audioUrl": null,
      "coverUrl": null,
      "lyricsUrl": null,
      "iframeUrl": "4UUnPzG2bC4"
    },
    {
      "@id": "node-1754588700272",
      "@type": "MusicRecording",
      "name": "Garbage for Ears",
      "position": {
        "x": 92,
        "y": 866.9360592337733
      },
      "isCollapsed": true,
      "sourceType": "iframe",
      "audioUrl": null,
      "coverUrl": null,
      "lyricsUrl": null,
      "iframeUrl": "DcRXJrtysG0"
    },
    {
      "@type": "Path",
      "source": "node-1",
      "target": "node-2",
      "color": "#808080",
      "label": "second version",
      "lineWidth": 2,
      "controlPoints": []
    },
    {
      "@type": "Path",
      "source": "node-1",
      "target": "node-3a",
      "color": "#808080",
      "label": "first version",
      "lineWidth": 2,
      "controlPoints": []
    },
    {
      "@type": "Path",
      "source": "node-2",
      "target": "node-3b",
      "color": "#2ced66",
      "label": "",
      "lineWidth": 2,
      "controlPoints": []
    },
    {
      "@type": "Path",
      "source": "node-3a",
      "target": "node-3b",
      "color": "#e12d2d",
      "label": "",
      "lineWidth": 2,
      "controlPoints": []
    },
    {
      "@type": "Path",
      "source": "node-3b",
      "target": "node-1754588700272",
      "color": "#58299e",
      "label": "",
      "lineWidth": 6,
      "controlPoints": []
    },
    {
      "@type": "Path",
      "source": "node-1754588700272",
      "target": "node-1",
      "color": "#24b3c6",
      "label": "playlist replay",
      "lineWidth": 2,
      "controlPoints": [
        {
          "x": -188.45755966224445,
          "y": 889.4360592337733
        },
        {
          "x": -188.45755966224445,
          "y": 252.5
        }
      ]
    },
    {
      "@id": "deco-rect-1",
      "position": {
        "x": -283,
        "y": -6.569811882272688
      },
      "@type": "RectangleAnnotation",
      "size": {
        "width": 950,
        "height": 1300
      },
      "backgroundColor": "#2e2e2e"
    },
    {
      "@id": "deco-text-1",
      "position": {
        "x": 443.6062789306635,
        "y": 52.37341150684294
      },
      "@type": "TextAnnotation",
      "textContent": "Sample starter playlist",
      "fontSize": 24,
      "color": "#fdff9e",
      "textAlign": "right",
      "width": 400,
      "lineHeight": 1.2
    },
    {
      "@id": "deco-rect-1754589215738",
      "position": {
        "x": 692.7849770255077,
        "y": 607.3930629464985
      },
      "@type": "RectangleAnnotation",
      "size": {
        "width": 300,
        "height": 700
      },
      "backgroundColor": "#40263c"
    },
    {
      "@id": "deco-text-1754589455494",
      "position": {
        "x": 849.2385344657106,
        "y": 959.1301881177274
      },
      "@type": "TextAnnotation",
      "textContent": "🛡️ License and Usage\n\nThis project is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License (CC BY-NC-SA 4.0).\n\n---\n\nImportant Clarification for Artists and Creators:\n\nThe CC BY-NC-SA license applies only to the player's source code (the HTML, CSS, and JavaScript files that make it run).\n\nIt does not apply to the content you create, such as your music, cover art, lyrics, or the `.jsonld` graph file that structures your narrative. You retain full ownership of your art and are free to license or sell it however you wish.\n\nYou can freely use this player as a non-commercial tool to display and distribute your commercial or non-commercial artwork.\n\nA Note on Attribution (How to give credit)\n\nTo comply with the license, you must provide a visible credit. We've made this as painless as possible.\n\n1. Required Attribution Text:\nYou must include the following text somewhere visible (e.g., in the footer of your page or on an \"About\" page):\n\n> AVN Player by Nftxv\n\n2. Required License Notice:\nYou must also include a reference to the license, so others know the terms under which the player is shared.\n\nThe Easiest Way to Do Both:\nYou can fulfill both requirements with a single, simple line. Here is a perfect example:\n\npowered by AVN Player by Nftxv, used under CC BY-NC-SA 4.0",
      "fontSize": 11,
      "color": "#a18159",
      "textAlign": "left",
      "width": 250,
      "lineHeight": 1.2
    }
  ],
  "view": {
    "offset": {
      "x": 570.7378794999497,
      "y": -46.12923764210575
    },
    "scale": 1.22140275816017
  }
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

function loadYouTubeAPI() {
  return new Promise((resolve) => {
    if (window.YT && window.YT.Player) {
      return resolve();
    }
    window.onYouTubeIframeAPIReady = () => {
      resolve();
    };
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  });
}

class GraphApp {
  constructor() {
    this.iframeContainer = document.getElementById('iframe-container');
    this.markdownContainer = document.getElementById('markdown-container');
    this.graphData = new GraphData();
    this.renderer = new Renderer('graphCanvas', this.iframeContainer, this.markdownContainer);
    this.player = new Player(this.graphData, this.iframeContainer);
    this.navigation = new Navigation(this.graphData, this.player, this.renderer, this);
    this.editorTools = new EditorTools(this.graphData, this.renderer, this);
    
    this.player.setNavigation(this.navigation);
    this.isEditorMode = false;
    this.isFollowing = false;
    this.followScale = 1.0;
    this.followScreenOffset = { x: 0, y: 0 }; // NEW: For smart follow position
  }

  async init() {
    try {
      await this.graphData.load('data/default.jsonld');
      this.renderer.setData(this.graphData);
      
      if (this.graphData.view) {
        this.renderer.setViewport(this.graphData.view);
      }
      
      this.renderer.render();
      this.setupEventListeners();
      this.toggleEditorMode(false);
      console.log('Application initialized successfully.');
    } catch (error) {
      console.error('Initialization failed:', error);
      alert('Could not load the application.');
    }
  }

  // REVISED: Smart Follow Mode logic with position memory
  toggleFollowMode(forceState = null) {
      this.isFollowing = forceState !== null ? forceState : !this.isFollowing;
      document.getElementById('followModeBtn').classList.toggle('active', this.isFollowing);

      if (this.isFollowing) {
          const { scale, offset } = this.renderer.getViewport();
          this.followScale = scale;
          
          if (this.navigation.currentNode) {
              const node = this.navigation.currentNode;
              const nodeScreenX = (node.x + NODE_WIDTH / 2) * scale + offset.x;
              const nodeScreenY = (node.y + NODE_HEADER_HEIGHT / 2) * scale + offset.y;
              
              this.followScreenOffset.x = this.renderer.canvas.width / 2 - nodeScreenX;
              this.followScreenOffset.y = this.renderer.canvas.height / 2 - nodeScreenY;
              
              console.log(`Follow mode activated. Target scale: ${this.followScale}, Screen offset:`, this.followScreenOffset);
              
              // Do not recenter immediately. Settings will apply on the next navigation.
          } else {
              // If no node is active, default to a centered view for the next node.
              this.followScreenOffset = { x: 0, y: 0 };
              console.log(`Follow mode activated. Target scale: ${this.followScale}. No active node.`);
          }

      } else {
          console.log('Follow mode deactivated.');
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
    if (!isEditor) {
      this.renderer.destroyAllMarkdownOverlays();
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
        getSelection: () => this.editorTools.getSelection(),
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
    
    document.getElementById('groupSelectionBtn').addEventListener('click', () => this.editorTools.groupOrUngroupSelection());
    document.getElementById('attachToNodeBtn').addEventListener('click', () => this.editorTools.attachOrDetachSelection());

    document.getElementById('deleteSelectionBtn').addEventListener('click', () => {
        const selection = this.editorTools.getSelection();
        selection.forEach(entity => {
            if (entity.sourceType === 'iframe') this.player.destroyYtPlayer(entity.id);
            if (entity.type === 'markdown') this.renderer.destroyMarkdownOverlay(entity.id);
        });
        this.editorTools.deleteSelection();
    });
    
    document.getElementById('saveNodeBtn').addEventListener('click', () => this.editorTools.saveInspectorChanges());
    document.getElementById('closeInspectorBtn').addEventListener('click', () => this.editorTools.closeInspector());
    
    document.getElementById('playBtn').addEventListener('click', () => this.player.togglePlay());
    document.getElementById('backBtn').addEventListener('click', () => this.navigation.goBack());
    document.getElementById('nextBtn').addEventListener('click', () => this.navigation.advance());
    
    document.getElementById('followModeBtn').addEventListener('click', () => this.toggleFollowMode());
  }

  handleCanvasClick(event) {
    if (this.renderer.wasDragged()) return;
    const coords = this.renderer.getCanvasCoords(event);
    const clicked = this.renderer.getClickableEntityAt(coords.x, coords.y, { isDecorationsLocked: this.editorTools.decorationsLocked });

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

// Constants exposed for other modules that need them
const NODE_WIDTH = 200;
const NODE_HEADER_HEIGHT = 45;

(async () => {
  try {
    await loadYouTubeAPI();
    const app = new GraphApp();
    app.init();
  } catch (error) {
    console.error("Fatal error during application startup:", error);
    alert("Could not start the application. Please check the console for details.");
  }
})();


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
  constructor(graphData, renderer, app) {
    this.graphData = graphData;
    this.renderer = renderer;
    this.app = app;
    this.inspectedEntity = null;
    this.selectedEntities = [];
    this.decorationsLocked = true; // REVISED: Start with decorations locked by default
    this.initLockState(); // Apply initial state to UI
  }
    
  // NEW: Helper to set initial lock button state
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
    this.initLockState(); // Use the helper to update UI

    if (this.decorationsLocked) {
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
        x: center.x - 150, y: center.y - 100,
        width: 300, height: 200,
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
  
  groupOrUngroupSelection() {
      const groupBtn = document.getElementById('groupSelectionBtn');
      const isUngroupAction = groupBtn.textContent === 'Ungroup';

      if (isUngroupAction) {
          const container = this.selectedEntities.find(e => e.type === 'rectangle');
          if (!container) return;
          this.graphData.decorations.forEach(deco => {
              if (deco.parentId === container.id) {
                  deco.parentId = null;
              }
          });
          console.log(`Ungrouped items from parent ${container.id}`);
      } else {
          const decorations = this.selectedEntities.filter(e => e.type === 'rectangle' || e.type === 'markdown');
          const parent = decorations.find(d => d.type === 'rectangle');
          if (!parent || decorations.length < 2) {
            alert('To group, select one rectangle (as container) and at least one other decoration.');
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

    const selectedIds = new Set(this.selectedEntities.map(e => e.id));
    const nodesToDelete = new Set(this.selectedEntities.filter(e => e.sourceType).map(n => n.id));
    
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
      
      this.selectedEntities.forEach(e => { if(e.id) e.selected = false });
      this.graphData.edges.forEach(e => e.selected = false);

      this.selectedEntities = finalSelection;
      const selectedIds = new Set(this.selectedEntities.map(e => entityToId(e)));
      
      this.graphData.nodes.forEach(n => n.selected = selectedIds.has(n.id));
      this.graphData.edges.forEach(e => e.selected = selectedIds.has(entityToId(e)));
      this.graphData.decorations.forEach(d => d.selected = selectedIds.has(d.id));
      
      this.updateUIState();
  }
  
  updateUIState() {
      document.getElementById('deleteSelectionBtn').disabled = this.selectedEntities.length === 0;

      const groupBtn = document.getElementById('groupSelectionBtn');
      const attachBtn = document.getElementById('attachToNodeBtn');
      const decos = this.selectedEntities.filter(e => e.type);
      const nodes = this.selectedEntities.filter(e => e.sourceType);
      const container = this.selectedEntities.find(e => e.type === 'rectangle' && !e.parentId);
      
      if (container && this.selectedEntities.length === 1 && this.graphData.decorations.some(d => d.parentId === container.id)) {
          groupBtn.textContent = 'Ungroup';
          groupBtn.disabled = false;
          groupBtn.title = 'Ungroup all items from this container';
      } else {
          groupBtn.textContent = 'Group';
          groupBtn.disabled = !(decos.length > 1 && container);
          groupBtn.title = 'Group selected items under the selected rectangle';
      }

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
        html = `...`; 
    } else if (entity.source) { // Edge
        title.textContent = 'Edge Properties';
        html = `...`; 
    } else if (entity.type === 'rectangle') {
        title.textContent = 'Rectangle Properties';
        html = `...`; 
    } else if (entity.type === 'markdown') {
        title.textContent = 'Markdown Block Properties';
        html = `
            <label for="textContent">Markdown Content:</label>
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
    
    // Snipped parts for brevity, logic unchanged
    if (entity.sourceType) { // Node
        html = `<label for="nodeTitle">Title:</label><input type="text" id="nodeTitle" value="${entity.title||''}"><label>Source Type:</label><div class="toggle-switch"><button id="type-audio" class="${entity.sourceType==='audio'?'active':''}">Audio File</button><button id="type-iframe" class="${entity.sourceType==='iframe'?'active':''}">YouTube</button></div><div id="audio-fields" class="${entity.sourceType==='audio'?'':'hidden'}"><label for="audioUrl">Audio URL:</label><input type="text" id="audioUrl" value="${entity.audioUrl||''}" placeholder="https://.../track.mp3"><label for="coverUrl">Cover URL (Data only):</label><input type="text" id="coverUrl" value="${entity.coverUrl||''}" placeholder="https://.../cover.jpg"></div><div id="iframe-fields" class="${entity.sourceType==='iframe'?'':'hidden'}"><label for="iframeUrl">YouTube URL or Video ID:</label><input type="text" id="iframeUrlInput" value="${entity.iframeUrl||''}" placeholder="dQw4w9WgXcQ"></div>`;
    } else if (entity.source) { // Edge
        html = `<label for="edgeLabel">Label:</label><input type="text" id="edgeLabel" value="${entity.label||''}"><label for="edgeColor">Color:</label><input type="color" id="edgeColor" value="${entity.color||'#888888'}"><label for="edgeWidth">Line Width:</label><input type="number" id="edgeWidth" value="${entity.lineWidth||2}" min="1" max="10">`;
    } else if (entity.type === 'rectangle') {
        html = `<label for="rectColor">Background Color:</label><input type="color" id="rectColor" value="${entity.backgroundColor}"><label for="rectWidth">Width:</label><input type="number" id="rectWidth" value="${entity.width}" min="10"><label for="rectHeight">Height:</label><input type="number" id="rectHeight" value="${entity.height}" min="10">`;
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
    this.inspectedEntity = null;
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
    this.view = null;
  }

  async load(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to load graph: ${response.statusText}`);
    const data = await response.json();
    this.parseData(data);
  }

  parseData(data) {
    this.meta = data.meta || {};
    this.view = data.view || null;
    const graph = data['@graph'] || [];

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
            // NEW: Grouping properties
            parentId: item.parentId || null,
            attachedToNodeId: item.attachedToNodeId || null,
          });
          break;
        case 'TextAnnotation': // Legacy support
        case 'MarkdownAnnotation': // NEW
          this.decorations.push({
            id: item['@id'],
            type: 'markdown', // REVISED: Unifying to markdown
            x: item.position?.x || 0,
            y: item.position?.y || 0,
            width: item.size?.width || 300,
            height: item.size?.height || 200,
            textContent: item.textContent || '',
            fontSize: item.fontSize || 14,
            backgroundColor: item.backgroundColor || 'rgba(45, 45, 45, 0.85)',
            // NEW: Grouping properties
            parentId: item.parentId || null,
          });
          break;
      }
    });
  }

  getGraph(viewport = null) {
    const graph = [
      ...this.nodes.map(n => ({
        '@id': n.id,
        '@type': 'MusicRecording',
        name: n.title,
        position: { x: n.x, y: n.y },
        isCollapsed: n.isCollapsed,
        sourceType: n.sourceType,
        audioUrl: n.audioUrl,
        coverUrl: n.coverUrl, // Keep for data, not for UI
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
        const common = { 
            '@id': d.id, 
            position: { x: d.x, y: d.y },
            ...(d.parentId && { parentId: d.parentId }),
            ...(d.attachedToNodeId && { attachedToNodeId: d.attachedToNodeId })
        };
        if (d.type === 'rectangle') {
          return {
            ...common,
            '@type': 'RectangleAnnotation',
            size: { width: d.width, height: d.height },
            backgroundColor: d.backgroundColor,
          };
        }
        if (d.type === 'markdown') { // REVISED
          return {
            ...common,
            '@type': 'MarkdownAnnotation',
            size: { width: d.width, height: d.height },
            textContent: d.textContent,
            fontSize: d.fontSize,
            backgroundColor: d.backgroundColor,
          };
        }
        return null;
      }).filter(Boolean),
    ];
    
    const data = {
      '@context': 'https://schema.org/',
      ...(Object.keys(this.meta).length > 0 && { meta: this.meta }),
      '@graph': graph,
    };

    if (viewport) {
      data.view = viewport;
    }

    return data;
  }
  
  parseYoutubeUrl(input) {
      if (!input || typeof input !== 'string') return null;
      const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
      const match = input.match(regex);
      if (match && match[1]) return match[1];
      if (/^[a-zA-Z0-9_-]{11}$/.test(input.trim())) return input.trim();
      console.warn("Could not parse YouTube URL/ID:", input);
      return null;
  }

  getNodeById(id) {
    return this.nodes.find(node => node.id === id);
  }

  getDecorationById(id) {
    return this.decorations.find(deco => deco.id === id);
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
  constructor(graphData, player, renderer, app) {
    this.graphData = graphData;
    this.player = player;
    this.renderer = renderer;
    this.app = app;
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

    if (this.app.isFollowing) {
      this.renderer.centerOnNode(nodeId, this.app.followScale, this.app.followScreenOffset);
    }
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
    if (!this.currentNode) return;

    const oldNodeId = this.currentNode.id;
    let prevNodeId = null;
    let edgeToHighlight = null;

    if (this.history.length > 1) {
        this.history.pop();
        prevNodeId = this.history[this.history.length - 1];
        edgeToHighlight = this.graphData.edges.find(e => e.source === prevNodeId && e.target === oldNodeId);
    } 
    else {
        const incomingEdges = this.graphData.edges.filter(e => e.target === oldNodeId);
        if (incomingEdges.length === 1) {
            edgeToHighlight = incomingEdges[0];
            prevNodeId = edgeToHighlight.source;
            this.history.unshift(prevNodeId);
            this.history.pop();
        } else {
            console.log("Cannot go back: No history and ambiguous or no predecessor.");
            return;
        }
    }

    const prevNode = this.graphData.getNodeById(prevNodeId);
    if (prevNode) {
        this.currentNode = prevNode;
        this.renderer.highlight(prevNodeId, oldNodeId, edgeToHighlight);
        this.player.play(prevNode);

        if (this.app.isFollowing) {
            this.renderer.centerOnNode(prevNodeId, this.app.followScale, this.app.followScreenOffset);
        }
    }
  }

  transitionToEdge(edge) {
    const prevNodeId = this.currentNode.id;
    const nextNode = this.graphData.getNodeById(edge.target);
    if (!nextNode) return;
    
    this.currentNode = nextNode;
    this.history.push(nextNode.id);
    
    this.renderer.highlight(nextNode.id, prevNodeId, edge);
    this.player.play(nextNode);
    
    if (this.app.isFollowing) {
        this.renderer.centerOnNode(nextNode.id, this.app.followScale, this.app.followScreenOffset);
    }
  }

  promptForChoice(options) {
    //... No changes here
    return new Promise((resolve) => {
      const modal = document.getElementById('choiceModal');
      const optionsContainer = document.getElementById('choiceOptions');
      const closeModalBtn = document.getElementById('closeModalBtn');
      const choiceTimerEl = document.getElementById('choiceTimer');
      const countdownEl = document.getElementById('countdown');
      
      let countdown = 5;
      let timerId = null;
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
          clearInterval(timerId);
          modal.classList.add('hidden');
          choiceTimerEl.classList.add('hidden');
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
      
      countdownEl.textContent = countdown;
      choiceTimerEl.classList.remove('hidden');
      modal.classList.remove('hidden');

      timerId = setInterval(() => {
        countdown--;
        countdownEl.textContent = countdown;
        if (countdown <= 0) {
          const randomChoice = options[Math.floor(Math.random() * options.length)];
          onChoose(randomChoice);
        }
      }, 1000);
    });
  }
}


## ./public/js/modules/Player.js

/**
 * Manages audio playback and player UI updates.
 */
export default class Player {
  constructor(graphData, iframeContainer) {
    this.graphData = graphData;
    this.iframeContainer = iframeContainer;
    this.navigation = null;
    this.currentNode = null;
    
    this.audio = new Audio();
    
    this.ytPlayers = new Map(); 
    this.ytPlayersCreating = new Set(); 
    this.currentYtPlayer = null;

    this.setupEventListeners();
  }

  setNavigation(navigation) { this.navigation = navigation; }

  async play(node) {
    if (!node) return;
    
    const wasPlayingNode = this.currentNode;
    this.currentNode = node;
    
    if (wasPlayingNode?.id !== node.id) {
        this.audio.pause();
        if (this.currentYtPlayer) {
          this.currentYtPlayer.pauseVideo();
        }
        this.currentYtPlayer = null;
    }
    
    document.getElementById('songTitle').textContent = node.title;
    const playBtn = document.getElementById('playBtn');
    const progress = document.getElementById('progress');

    if (node.sourceType === 'audio') {
        if (!node.audioUrl) {
          console.warn(`Audio URL is missing for "${node.title}".`);
          this.stop();
          document.getElementById('songTitle').textContent = node.title;
          return;
        }
        playBtn.textContent = '⏸';
        playBtn.disabled = false;
        progress.disabled = false;
        this.audio.src = node.audioUrl;
        this.audio.play().catch(e => console.error("Playback error:", e));

    } else if (node.sourceType === 'iframe') {
        playBtn.disabled = false;
        playBtn.textContent = '⏸';
        progress.value = 0;
        progress.disabled = true;

        if (this.ytPlayers.has(node.id)) {
            this.currentYtPlayer = this.ytPlayers.get(node.id);
            if (this.currentYtPlayer.getPlayerState() === YT.PlayerState.ENDED) {
                this.currentYtPlayer.seekTo(0);
            }
            this.currentYtPlayer.playVideo();
        } else {
            this.currentYtPlayer = await this.createAndPlayYtPlayer(node);
        }
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
        } else {
            this.currentYtPlayer.playVideo();
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
    document.getElementById('playBtn').disabled = true;
    document.getElementById('progress').disabled = true;
    document.getElementById('songTitle').textContent = 'Select a node to begin...';
    document.getElementById('progress').value = 0;
    document.getElementById('currentTime').textContent = '0:00';
  }

  createAndPlayYtPlayer(node) {
    if (this.ytPlayersCreating.has(node.id)) {
        console.warn(`Player creation for ${node.id} already in progress.`);
        return;
    }

    return new Promise((resolve) => {
        this.ytPlayersCreating.add(node.id);
        const wrapper = document.createElement('div');
        wrapper.id = `iframe-wrapper-${node.id}`;
        wrapper.className = 'iframe-wrapper';
        wrapper.style.display = 'none';
        const playerDiv = document.createElement('div');
        playerDiv.id = `yt-player-${node.id}`;
        const dragOverlay = document.createElement('div');
        dragOverlay.className = 'drag-overlay';

        wrapper.appendChild(playerDiv);
        wrapper.appendChild(dragOverlay);
        this.iframeContainer.appendChild(wrapper);

        const player = new YT.Player(playerDiv.id, {
            height: '100%',
            width: '100%',
            videoId: node.iframeUrl,
            playerVars: { 'playsinline': 1, 'controls': 0, 'disablekb': 1 },
            events: {
                'onReady': (event) => {
                    console.log(`Lazy-loaded player for ${node.id} is ready.`);
                    this.ytPlayers.set(node.id, player);
                    this.ytPlayersCreating.delete(node.id);
                    event.target.playVideo();
                    resolve(player);
                },
                'onStateChange': (event) => this.onPlayerStateChange(event, node)
            }
        });
    });
  }

  destroyYtPlayer(nodeId) {
      if (this.ytPlayers.has(nodeId)) {
          this.ytPlayers.get(nodeId).destroy();
          this.ytPlayers.delete(nodeId);
      }
      this.ytPlayersCreating.delete(nodeId);
      const wrapper = document.getElementById(`iframe-wrapper-${nodeId}`);
      if (wrapper) wrapper.remove();
      console.log(`Destroyed player and wrapper for node ${nodeId}`);
  }

  onPlayerStateChange(event, node) {
    if (this.currentNode?.id !== node.id) return;
    const playBtn = document.getElementById('playBtn');
    switch(event.data) {
        case YT.PlayerState.ENDED:
            if (this.navigation) this.navigation.advance();
            break;
        case YT.PlayerState.PLAYING:
            playBtn.textContent = '⏸';
            break;
        case YT.PlayerState.PAUSED:
            playBtn.textContent = '▶';
            break;
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
  }
  
  updateProgress() {
    const progress = document.getElementById('progress');
    const currentTimeElem = document.getElementById('currentTime');
    if (this.audio.duration && isFinite(this.audio.duration)) {
      progress.value = (this.audio.currentTime / this.audio.duration) * 100;
      const mins = Math.floor(this.audio.currentTime / 60);
      const secs = Math.floor(this.audio.currentTime % 60);
      currentTimeElem.textContent = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    } else {
      progress.value = 0;
      currentTimeElem.textContent = '0:00';
    }
  }
}


## ./public/js/modules/Renderer.js

/**
 * AVN Player - Renderer Module
 * with HTML Overlays, LOD, and Grouping
 * by Nftxv
 */
const NODE_WIDTH = 200;
const NODE_HEADER_HEIGHT = 45;
const NODE_CONTENT_ASPECT_RATIO = 9 / 16;
const NODE_CONTENT_HEIGHT = NODE_WIDTH * NODE_CONTENT_ASPECT_RATIO;
const DECORATION_LOD_THRESHOLD = 0.4;

export default class Renderer {
  constructor(canvasId, iframeContainer, markdownContainer) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.iframeContainer = iframeContainer;
    this.markdownContainer = markdownContainer;
    
    this.graphData = null; 
    this.markdownOverlays = new Map();

    this.offset = { x: 0, y: 0 };
    this.scale = 1.0;
    this.dragStart = { x: 0, y: 0 };
    this.dragged = false;
    this.dragging = false;
    this.draggingEntity = null;
    this.isDraggingSelection = false;
    
    this.draggingControlPoint = null;
    this.isCreatingEdge = false;
    this.edgeCreationSource = null;
    this.mousePos = { x: 0, y: 0 };
    this.snapThreshold = 10;
    this.snapLines = [];
    this.isMarqueeSelecting = false;
    
    this.isAnimatingPan = false;

    this.resizeCanvas();
    this.renderLoop = this.renderLoop.bind(this);
    requestAnimationFrame(this.renderLoop);
  }

  setData(graphData) { this.graphData = graphData; }
  
  render() {
      // The render loop is now self-driving.
  }

  renderLoop() {
    if (!this.graphData) {
        requestAnimationFrame(this.renderLoop);
        return;
    }
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.save();
    this.ctx.translate(this.offset.x, this.offset.y);
    this.ctx.scale(this.scale, this.scale);

    const isLodActive = this.scale < DECORATION_LOD_THRESHOLD;

    this.graphData.decorations.forEach(deco => this.drawDecoration(deco, isLodActive));
    this.graphData.nodes.forEach(node => this._drawNodeContent(node));
    this.graphData.edges.forEach(edge => this.drawEdge(edge));
    this.graphData.nodes.forEach(node => this._drawNodeHeader(node));

    if (this.isCreatingEdge) this.drawTemporaryEdge();
    if (this.isMarqueeSelecting) this.drawMarquee();
    this._drawSnapGuides();
    
    this.ctx.restore();
    
    this.updateIframes();
    this.updateMarkdownOverlays(isLodActive);

    requestAnimationFrame(this.renderLoop);
  }

  drawDecoration(deco, isLodActive) {
    if (isLodActive) {
        // REVISED: Use a fixed color for LOD dots to ignore transparency
        this.ctx.fillStyle = deco.selected ? '#e74c3c' : '#5a5a5a';
        this.ctx.globalAlpha = 0.9;
        this.ctx.beginPath();
        const radius = deco.selected ? 7 / this.scale : 5 / this.scale;
        this.ctx.arc(deco.x + deco.width/2, deco.y + deco.height/2, radius, 0, 2*Math.PI);
        this.ctx.fill();
        this.ctx.globalAlpha = 1.0;
        return;
    }

    if (deco.type === 'rectangle') this.drawRectangle(deco);
  }

  drawRectangle(rect) {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = rect.selected ? 0.8 : 0.5;
    ctx.fillStyle = rect.backgroundColor;
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
    
    if (rect.selected) {
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = 4 / this.scale;
        ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
    }
    ctx.restore();
  }
  
  drawEdge(edge) {
      const src = this.graphData.getNodeById(edge.source);
      const trg = this.graphData.getNodeById(edge.target);
      if (!src || !trg) return;
      
      const controlPoints = edge.controlPoints || [];
      const srcHeaderCenter = { x: src.x + NODE_WIDTH / 2, y: src.y + NODE_HEADER_HEIGHT / 2 };
      const trgHeaderCenter = { x: trg.x + NODE_WIDTH / 2, y: trg.y + NODE_HEADER_HEIGHT / 2 };
      
      const targetPointForAngle = controlPoints.length > 0 ? controlPoints[0] : trgHeaderCenter;
      const startPoint = this._getIntersectionWithNodeRect(src, targetPointForAngle);
      
      const sourcePointForAngle = controlPoints.length > 0 ? controlPoints.at(-1) : srcHeaderCenter;
      const endPoint = this._getIntersectionWithNodeRect(trg, sourcePointForAngle);
      
      const pathPoints = [startPoint, ...controlPoints, endPoint];
      const ctx = this.ctx;
      ctx.save();
      
      let color = edge.color || '#888888';
      if (edge.selected) color = '#e74c3c';
      if (edge.highlighted) color = '#FFD700';
      
      const edgeLineWidth = edge.lineWidth || 2;
      const lineWidth = edge.selected || edge.highlighted ? edgeLineWidth + 1 : edgeLineWidth;
      const arrowSize = 6 + edgeLineWidth * 2.5;

      const pForArrow = pathPoints.at(-1); 
      const pBeforeArrow = pathPoints.length > 1 ? pathPoints.at(-2) : startPoint;
      const angle = Math.atan2(pForArrow.y - pBeforeArrow.y, pForArrow.x - pBeforeArrow.x);
      
      const offset = arrowSize; 
      const adjustedEndPoint = {
          x: pForArrow.x - offset * Math.cos(angle),
          y: pForArrow.y - offset * Math.sin(angle)
      };

      ctx.beginPath();
      ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
      for (let i = 1; i < pathPoints.length - 1; i++) {
          ctx.lineTo(pathPoints[i].x, pathPoints[i].y);
      }
      if (pathPoints.length > 1) {
          ctx.lineTo(adjustedEndPoint.x, adjustedEndPoint.y);
      }

      ctx.strokeStyle = color; 
      ctx.lineWidth = lineWidth; 
      ctx.stroke();
      
      this._drawArrow(pForArrow.x, pForArrow.y, angle, color, arrowSize);
      
      controlPoints.forEach(point => {
          ctx.beginPath();
          ctx.arc(point.x, point.y, 5 / this.scale, 0, 2 * Math.PI);
          ctx.fillStyle = edge.selected ? '#e74c3c' : color;
          ctx.fill();
      });
      
      if (edge.label) {
        const midIndex = Math.floor((pathPoints.length - 2) / 2);
        const p1 = pathPoints[midIndex], p2 = pathPoints[midIndex + 1];
        ctx.font = '12px "Segoe UI"'; // REVISED: Fixed font size
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
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
    const containerX = node.x;
    const containerY = node.y - NODE_CONTENT_HEIGHT;
    const containerW = NODE_WIDTH;
    const containerH = NODE_CONTENT_HEIGHT;
    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(containerX, containerY, containerW, containerH);
    if (node.sourceType === 'iframe') {
        ctx.fillStyle = '#000000';
        ctx.fillRect(containerX, containerY, containerW, containerH);
    }
  }

  _drawNodeHeader(node) {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = '#2d2d2d';
    ctx.beginPath();
    ctx.roundRect(node.x, node.y, NODE_WIDTH, NODE_HEADER_HEIGHT, [0, 0, 8, 8]);
    ctx.fill();
    if (node.selected || node.highlighted) {
        ctx.save();
        ctx.clip();
        ctx.strokeStyle = node.selected ? '#e74c3c' : '#FFD700';
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.restore();
    } else {
        ctx.strokeStyle = '#424242';
        ctx.lineWidth = 1;
        ctx.stroke();
    }
    ctx.fillStyle = '#e0e0e0';
    ctx.font = '14px "Segoe UI"';
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

  updateIframes() {
    if (!this.graphData) return;
    this.graphData.nodes.forEach(node => {
        if (node.sourceType !== 'iframe') return;
        const wrapper = document.getElementById(`iframe-wrapper-${node.id}`);
        if (!wrapper) return;
        const isInView = this._isNodeInView(node);
        const shouldBeVisible = !node.isCollapsed && isInView;
        if (wrapper.style.display !== (shouldBeVisible ? 'block' : 'none')) {
            wrapper.style.display = shouldBeVisible ? 'block' : 'none';
        }
        if (shouldBeVisible) {
            const screenX = (node.x) * this.scale + this.offset.x;
            const screenY = (node.y - NODE_CONTENT_HEIGHT) * this.scale + this.offset.y;
            const screenWidth = NODE_WIDTH * this.scale;
            const screenHeight = NODE_CONTENT_HEIGHT * this.scale;
            wrapper.style.transform = `translate(${screenX}px, ${screenY}px)`;
            wrapper.style.width = `${screenWidth}px`;
            wrapper.style.height = `${screenHeight}px`;
        }
    });
  }

  updateMarkdownOverlays(isLodActive) {
      if (!this.graphData) return;
      this.graphData.decorations.forEach(deco => {
          if (deco.type !== 'markdown') return;
          
          const isInView = this._isDecorationInView(deco);
          const shouldBeVisible = !isLodActive && isInView;
          
          let overlay = this.markdownOverlays.get(deco.id);

          if (shouldBeVisible) {
              if (!overlay) {
                  overlay = this._createMarkdownOverlay(deco);
              }
              const screenX = deco.x * this.scale + this.offset.x;
              const screenY = deco.y * this.scale + this.offset.y;
              const screenWidth = deco.width * this.scale;
              const screenHeight = deco.height * this.scale;
              
              overlay.style.transform = `translate(${screenX}px, ${screenY}px)`;
              overlay.style.width = `${screenWidth}px`;
              overlay.style.height = `${screenHeight}px`;
              // REVISED: Apply font scaling
              overlay.style.fontSize = `${(deco.fontSize || 14) / this.scale}px`;
              overlay.classList.toggle('selected', !!deco.selected);

          } else if (overlay) {
              this.destroyMarkdownOverlay(deco.id);
          }
      });
  }

  _createMarkdownOverlay(deco) {
      const overlay = document.createElement('div');
      overlay.id = `md-overlay-${deco.id}`;
      overlay.className = 'markdown-overlay';
      overlay.style.backgroundColor = deco.backgroundColor;
      
      this.updateMarkdownOverlayContent(overlay, deco);

      this.markdownContainer.appendChild(overlay);
      this.markdownOverlays.set(deco.id, overlay);
      return overlay;
  }
  
  updateMarkdownOverlay(decoId) {
      const deco = this.graphData.getDecorationById(decoId);
      const overlay = this.markdownOverlays.get(decoId);
      if (deco && overlay) {
          this.updateMarkdownOverlayContent(overlay, deco);
          overlay.style.backgroundColor = deco.backgroundColor;
      }
  }

  updateMarkdownOverlayContent(overlay, deco) {
      const content = DOMPurify.sanitize(marked.parse(deco.textContent, { breaks: true }), {
        ADD_ATTR: ['target'],
      });
      overlay.innerHTML = content;
      overlay.querySelectorAll('a').forEach(a => {
        a.target = '_blank';
        a.rel = 'noopener nofollow';
      });
  }

  destroyMarkdownOverlay(decoId) {
      if (this.markdownOverlays.has(decoId)) {
          this.markdownOverlays.get(decoId).remove();
          this.markdownOverlays.delete(decoId);
      }
  }
  
  destroyAllMarkdownOverlays() {
      this.markdownOverlays.forEach(overlay => overlay.remove());
      this.markdownOverlays.clear();
  }

  _fitText(text, maxWidth) {
      this.ctx.font = '14px "Segoe UI"';
      if(this.ctx.measureText(text).width <= maxWidth) return text;
      while (this.ctx.measureText(text + '...').width > maxWidth && text.length > 0) text = text.slice(0, -1);
      return text + '...';
  }
  
  _isNodeInView(node) {
      const rect = this._getNodeVisualRect(node);
      return this._isRectInView(rect);
  }
  
  _isDecorationInView(deco) {
      const rect = this._getDecorationBounds(deco);
      return this._isRectInView(rect);
  }
  
  _isRectInView(rect) {
      const screenRect = {
        x: rect.x * this.scale + this.offset.x, y: rect.y * this.scale + this.offset.y,
        width: rect.width * this.scale, height: rect.height * this.scale
      };
      const buffer = 100;
      return screenRect.x < this.canvas.width + buffer && screenRect.x + screenRect.width > -buffer &&
             screenRect.y < this.canvas.height + buffer && screenRect.y + screenRect.height > -buffer;
  }

  getViewportCenter() {
      const worldX = (this.canvas.width / 2 - this.offset.x) / this.scale;
      const worldY = (this.canvas.height / 2 - this.offset.y) / this.scale;
      return { x: worldX, y: worldY };
  }

  getViewport() { return { offset: this.offset, scale: this.scale }; }

  setViewport(view) {
    if (view.offset) this.offset = view.offset;
    if (view.scale) this.scale = view.scale;
  }

  _getNodeVisualRect(node) {
      const contentHeight = node.isCollapsed ? 0 : NODE_CONTENT_HEIGHT;
      const totalHeight = NODE_HEADER_HEIGHT + contentHeight;
      return { x: node.x, y: node.y - contentHeight, width: NODE_WIDTH, height: totalHeight };
  }
  
  _getDecorationBounds(deco) {
      return { x: deco.x, y: deco.y, width: deco.width, height: deco.height };
  }

  getClickableEntityAt(x, y, { isDecorationsLocked } = {}) {
    if (!isDecorationsLocked) {
        if (this.scale < DECORATION_LOD_THRESHOLD) {
            const tolerance = 7 / this.scale;
            for (let i = this.graphData.decorations.length - 1; i >= 0; i--) {
                 const deco = this.graphData.decorations[i];
                 const decoCenterX = deco.x + deco.width/2;
                 const decoCenterY = deco.y + deco.height/2;
                 if(Math.hypot(x - decoCenterX, y - decoCenterY) < tolerance) {
                     return { type: 'decoration', entity: deco };
                 }
            }
        } else {
            for (let i = this.graphData.decorations.length - 1; i >= 0; i--) {
                const deco = this.graphData.decorations[i];
                const bounds = this._getDecorationBounds(deco);
                if (x > bounds.x && x < bounds.x + bounds.width && y > bounds.y && y < bounds.y + bounds.height) {
                    return { type: 'decoration', entity: deco };
                }
            }
        }
    }
      
    for (let i = this.graphData.nodes.length - 1; i >= 0; i--) {
        const node = this.graphData.nodes[i];
        const rect = this._getNodeVisualRect(node);
        if (x > rect.x && x < rect.x + rect.width && y > rect.y && y < rect.y + rect.height) {
            return { type: 'node', entity: node };
        }
    }
      
    const edge = this.getEdgeAt(x, y);
    if (edge) return { type: 'edge', entity: edge };

    return null;
  }
  
  getNodesInRect(rect) {
    const normalizedRect = this.normalizeRect(rect);
    return this.graphData.nodes.filter(node => {
        const nodeRect = this._getNodeVisualRect(node);
        return ( nodeRect.x >= normalizedRect.x && nodeRect.y >= normalizedRect.y &&
                 nodeRect.x + nodeRect.width <= normalizedRect.x + normalizedRect.w &&
                 nodeRect.y + nodeRect.height <= normalizedRect.y + normalizedRect.h );
    });
  }

  getEdgesInRect(rect, nodesInRect) {
      const nodeIdsInRect = new Set(nodesInRect.map(n => n.id));
      return this.graphData.edges.filter(edge => nodeIdsInRect.has(edge.source) && nodeIdsInRect.has(edge.target));
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
          x: rect.w < 0 ? rect.x + rect.w : rect.x, y: rect.h < 0 ? rect.y + rect.h : rect.y,
          w: Math.abs(rect.w), h: Math.abs(rect.h)
      };
  }

  getControlPointAt(x, y) {
      const tolerance = 8 / this.scale;
      for (const edge of this.graphData.edges) {
          for (let i = 0; i < (edge.controlPoints || []).length; i++) {
              const point = edge.controlPoints[i];
              if (Math.hypot(x - point.x, y - point.y) < tolerance) return { edge, pointIndex: i };
          }
      }
      return null;
  }

  getEdgeAt(x, y) {
    const tolerance = 10 / this.scale;
    for (const edge of this.graphData.edges) {
        const src = this.graphData.getNodeById(edge.source);
        const trg = this.graphData.getNodeById(edge.target);
        if (!src || !trg) continue;
        const controlPoints = edge.controlPoints || [];
        const srcHeaderCenter = { x: src.x + NODE_WIDTH / 2, y: src.y + NODE_HEADER_HEIGHT / 2 };
        const trgHeaderCenter = { x: trg.x + NODE_WIDTH / 2, y: trg.y + NODE_HEADER_HEIGHT / 2 };
        const targetPointForAngle = controlPoints.length > 0 ? controlPoints[0] : trgHeaderCenter;
        const startPoint = this._getIntersectionWithNodeRect(src, targetPointForAngle);
        const sourcePointForAngle = controlPoints.length > 0 ? controlPoints.at(-1) : srcHeaderCenter;
        const endPoint = this._getIntersectionWithNodeRect(trg, sourcePointForAngle);
        const pathPoints = [startPoint, ...controlPoints, endPoint];
        for (let i = 0; i < pathPoints.length - 1; i++) {
            const p1 = pathPoints[i], p2 = pathPoints[i + 1];
            const len = Math.hypot(p2.x - p1.x, p2.y - p1.y);
            if (len < 1) continue;
            const dot = (((x - p1.x) * (p2.x - p1.x)) + ((y - p1.y) * (p2.y - p1.y))) / (len * len);
            if (dot >= 0 && dot <= 1) {
                const closestX = p1.x + (dot * (p2.x - p1.x)), closestY = p1.y + (dot * (p2.y - p1.y));
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
    const logicalCenterX = node.x + NODE_WIDTH / 2;
    const logicalCenterY = node.y + NODE_HEADER_HEIGHT / 2;
    const rect = this._getNodeVisualRect(node);
    const dx = externalPoint.x - logicalCenterX;
    const dy = externalPoint.y - logicalCenterY;

    if (dx === 0 && dy === 0) return { x: logicalCenterX, y: logicalCenterY };
    
    let t = Infinity;
    if (dy < 0) { const t_y = (rect.y - logicalCenterY) / dy; if(logicalCenterX + t_y * dx >= rect.x && logicalCenterX + t_y * dx <= rect.x + rect.width) t = Math.min(t, t_y); }
    if (dy > 0) { const t_y = (rect.y + rect.height - logicalCenterY) / dy; if(logicalCenterX + t_y * dx >= rect.x && logicalCenterX + t_y * dx <= rect.x + rect.width) t = Math.min(t, t_y); }
    if (dx < 0) { const t_x = (rect.x - logicalCenterX) / dx; if(logicalCenterY + t_x * dy >= rect.y && logicalCenterY + t_x * dy <= rect.y + rect.height) t = Math.min(t, t_x); }
    if (dx > 0) { const t_x = (rect.x + rect.width - logicalCenterX) / dx; if(logicalCenterY + t_x * dy >= rect.y && logicalCenterY + t_x * dy <= rect.y + rect.height) t = Math.min(t, t_x); }

    if (t !== Infinity && t > 0) {
        return { x: logicalCenterX + t * dx, y: logicalCenterY + t * dy };
    }
    
    const tan = Math.tan(Math.atan2(dy, dx));
    if (Math.abs(rect.height / 2 * dx) > Math.abs(rect.width / 2 * dy)) {
        const ix = rect.x + (dx > 0 ? rect.width : 0);
        return { x: ix, y: (rect.y + rect.height/2) + ((dx > 0 ? 1 : -1) * rect.width/2) * tan};
    } else {
        const iy = rect.y + (dy > 0 ? rect.height : 0);
        return { x: (rect.x + rect.width/2) + ((dy > 0 ? 1 : -1) * rect.height/2) / tan, y: iy};
    }
  }
  
  drawTemporaryEdge() {
    const ctx = this.ctx;
    const startX = this.edgeCreationSource.x + NODE_WIDTH / 2;
    const startY = this.edgeCreationSource.y + NODE_HEADER_HEIGHT / 2;
    ctx.save(); ctx.beginPath(); ctx.moveTo(startX, startY); ctx.lineTo(this.mousePos.x, this.mousePos.y);
    ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 3 / this.scale; ctx.setLineDash([5 / this.scale, 5 / this.scale]); ctx.stroke(); ctx.restore();
  }
  
  highlight(currentId, prevId = null, edge = null) {
      this.graphData.nodes.forEach(n => n.highlighted = false);
      this.graphData.edges.forEach(e => e.highlighted = false);
      if (currentId) {
          const node = this.graphData.getNodeById(currentId);
          if (node) node.highlighted = true;
      }
      if (edge && this.graphData.edges.includes(edge)) {
          edge.highlighted = true;
      }
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
      return pos;
  }
  _drawSnapGuides() { }

  centerOnNode(nodeId, targetScale = null, screenOffset = null) {
    if (!this.graphData) return;
    const node = this.graphData.getNodeById(nodeId);
    if (!node) return;

    this.isAnimatingPan = true;
    const finalScale = targetScale !== null ? targetScale : this.scale;
    const finalScreenOffset = screenOffset || { x: 0, y: 0 };
    
    const nodeCenterX = node.x + NODE_WIDTH / 2;
    const nodeCenterY = node.y + NODE_HEADER_HEIGHT / 2;
    
    const targetOffsetX = (this.canvas.width / 2) - (nodeCenterX * finalScale) + finalScreenOffset.x;
    const targetOffsetY = (this.canvas.height / 2) - (nodeCenterY * finalScale) + finalScreenOffset.y;

    const startOffsetX = this.offset.x, startOffsetY = this.offset.y;
    const startScale = this.scale;

    const diffX = targetOffsetX - startOffsetX, diffY = targetOffsetY - startOffsetY;
    const diffScale = finalScale - startScale;

    const duration = 500;
    let startTime = null;

    const animate = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        if (elapsed >= duration || !this.isAnimatingPan) {
            this.offset.x = targetOffsetX;
            this.offset.y = targetOffsetY;
            this.scale = finalScale;
            this.isAnimatingPan = false;
            return;
        }

        let progress = Math.min(elapsed / duration, 1);
        progress = progress * (2 - progress); // Ease-out

        this.offset.x = startOffsetX + diffX * progress;
        this.offset.y = startOffsetY + diffY * progress;
        this.scale = startScale + diffScale * progress;
        
        requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }
  
  setupCanvasInteraction(callbacks) {
    const { getIsEditorMode, getIsDecorationsLocked, onClick, onDblClick, onEdgeCreated, onMarqueeSelect, getSelection } = callbacks;
    window.addEventListener('resize', () => this.resizeCanvas());
    this.canvas.addEventListener('contextmenu', e => e.preventDefault());
    
    const handleMouseMove = (e) => {
        const oldMousePos = this.mousePos;
        this.mousePos = this.getCanvasCoords(e);
        if (e.buttons === 0) { handleMouseUp(e); return; }
        this.dragged = true;

        if (this.dragging) {
            this.offset.x = e.clientX - this.dragStart.x;
            this.offset.y = e.clientY - this.dragStart.y;
        } else if (this.draggingEntity) {
            const dx = this.mousePos.x - oldMousePos.x;
            const dy = this.mousePos.y - oldMousePos.y;
            if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) return;

            const selection = this.isDraggingSelection ? getSelection() : [this.draggingEntity];
            const movedItems = new Set();

            selection.forEach(entity => {
                if (movedItems.has(entity.id)) return;
                
                let rootToMove = entity;
                if (entity.parentId) {
                    rootToMove = this.graphData.getDecorationById(entity.parentId) || entity;
                }
                
                const itemsToMove = new Set([rootToMove]);
                
                if (rootToMove.type === 'rectangle') {
                    this.graphData.decorations.forEach(d => {
                        if (d.parentId === rootToMove.id) itemsToMove.add(d);
                    });
                }

                if (rootToMove.sourceType) { // it's a node
                    this.graphData.decorations.forEach(d => {
                        if (d.attachedToNodeId === rootToMove.id && d.type === 'rectangle' && !d.parentId) {
                            itemsToMove.add(d);
                            this.graphData.decorations.forEach(child => {
                                if (child.parentId === d.id) itemsToMove.add(child);
                            });
                        }
                    });
                }
                
                itemsToMove.forEach(item => {
                    if (getIsDecorationsLocked() && (item.type === 'rectangle' || item.type === 'markdown')) return;
                    if (item.x !== undefined) item.x += dx;
                    if (item.y !== undefined) item.y += dy;
                    
                    if (item.attachedToNodeId) {
                      const node = this.graphData.getNodeById(item.attachedToNodeId);
                      if (node) {
                        item.attachOffsetX = item.x - node.x;
                        item.attachOffsetY = item.y - node.y;
                      }
                    }
                    movedItems.add(item.id);
                });
            });

        } else if (this.draggingControlPoint) {
            this.draggingControlPoint.edge.controlPoints[this.draggingControlPoint.pointIndex].x = this.mousePos.x;
            this.draggingControlPoint.edge.controlPoints[this.draggingControlPoint.pointIndex].y = this.mousePos.y;
        } else if (this.isMarqueeSelecting) {
            this.marqueeRect.w = this.mousePos.x - this.marqueeRect.x;
            this.marqueeRect.h = this.mousePos.y - this.marqueeRect.y;
        }
    };

    const handleMouseUp = (e) => {
        if (this.isMarqueeSelecting) {
            const normalizedRect = this.normalizeRect(this.marqueeRect);
            if (normalizedRect.w > 5 || normalizedRect.h > 5) onMarqueeSelect(this.marqueeRect, e.ctrlKey, e.shiftKey);
        }
        if (this.isCreatingEdge && e.button === 2) {
            const targetClick = this.getClickableEntityAt(this.mousePos.x, this.mousePos.y, { isDecorationsLocked: true });
            if (targetClick && targetClick.type === 'node' && this.edgeCreationSource && targetClick.entity.id !== this.edgeCreationSource.id) {
                onEdgeCreated(this.edgeCreationSource, targetClick.entity);
            }
        }
        
        this.dragging = this.draggingEntity = this.draggingControlPoint = this.isCreatingEdge = this.isMarqueeSelecting = this.isDraggingSelection = false;
        this.canvas.style.cursor = 'grab';
        
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);

        setTimeout(() => { this.dragged = false; }, 0);
    };
    
    this.canvas.addEventListener('mousedown', (e) => {
        this.isAnimatingPan = false; 
        const isEditor = getIsEditorMode();
        this.mousePos = this.getCanvasCoords(e);
        this.dragged = false;
        
        const handlePanStart = () => {
            this.dragging = true;
            this.dragStart.x = e.clientX - this.offset.x;
            this.dragStart.y = e.clientY - this.offset.y;
        };

        if (e.button === 0) { // Left
            if (!isEditor) { handlePanStart(); }
            else {
                 const cp = this.getControlPointAt(this.mousePos.x, this.mousePos.y);
                 if (cp) { this.draggingControlPoint = cp; }
                 else {
                     const clicked = this.getClickableEntityAt(this.mousePos.x, this.mousePos.y, { isDecorationsLocked: getIsDecorationsLocked() });
                     if (clicked) {
                         const entity = clicked.entity;
                         if (entity.selected) this.isDraggingSelection = true;
                         this.draggingEntity = entity;
                     } else {
                         this.isMarqueeSelecting = true;
                         this.marqueeRect = { x: this.mousePos.x, y: this.mousePos.y, w: 0, h: 0 };
                     }
                 }
            }
        } else if (e.button === 1) { handlePanStart(); } // Middle
        else if (e.button === 2) { // Right
            e.preventDefault();
            if (isEditor) {
                const cp = this.getControlPointAt(this.mousePos.x, this.mousePos.y);
                if (cp) cp.edge.controlPoints.splice(cp.pointIndex, 1);
                else {
                    const clickedNode = this.getClickableEntityAt(this.mousePos.x, this.mousePos.y, { isDecorationsLocked: true });
                    if (clickedNode && clickedNode.type === 'node') {
                        this.isCreatingEdge = true;
                        this.edgeCreationSource = clickedNode.entity;
                    }
                }
            }
        }

        if (this.dragging || this.draggingEntity || this.draggingControlPoint || this.isCreatingEdge || this.isMarqueeSelecting) {
            this.canvas.style.cursor = this.dragging ? 'grabbing' : 'crosshair';
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
    });

    this.canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        this.isAnimatingPan = false;
        const zoomIntensity = 0.1;
        const wheel = e.deltaY < 0 ? 1 : -1;
        const zoom = Math.exp(wheel * zoomIntensity);
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left, mouseY = e.clientY - rect.top;
        this.offset.x = mouseX - (mouseX - this.offset.x) * zoom;
        this.offset.y = mouseY - (mouseY - this.offset.y) * zoom;
        this.scale *= zoom;
        this.scale = Math.max(0.1, Math.min(5, this.scale));
    });

    this.canvas.addEventListener('click', onClick);
    this.canvas.addEventListener('dblclick', onDblClick);
  }
}

