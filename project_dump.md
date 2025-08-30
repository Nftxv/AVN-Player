
## ./public/index.html

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, maximum-scale=1.0">
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
    <button id="toggleEditorModeBtn" title="Toggle Player/Editor Mode">🛠️🖥️🖱️</button>
    <div class="divider"></div>

    <!-- Always Visible Buttons -->
    <button id="toggleAllNodesBtn" title="Collapse All Nodes">➖</button>
    <button id="followModeBtn" title="Lock current view and follow playback">🎯</button> 
    <button id="selectGraphBtn" title="Select Story" disabled>📂</button>
    <button id="tocBtn" title="Table of Contents">📖</button>
    <div class="divider"></div>

    <!-- Player Mode Controls (now empty) -->
    <div id="playerModeControls">
    </div>

    <!-- Editor Mode Controls (hidden by default) -->
    <div id="editorModeControls">
      <button id="addNodeBtn" title="Add New Node">🎫</button>
      <button id="addRectBtn" title="Add Rectangle Shape">🔳</button>
      <button id="addTextBtn" title="Add Markdown Block">📋</button>
      <div class="divider"></div>
      <button id="lockDecorationsBtn" title="Lock/Unlock Decorations">🔓</button>
      <div class="divider"></div>
      <button id="groupSelectionBtn" title="Group Selected Decorations" disabled>Group</button>
      <button id="attachToNodeBtn" title="Attach Group to Node" disabled>Attach</button>
      <div class="divider"></div>
      <button id="exportBtn" title="Export">💾</button>
      <button id="resetBtn">Reset</button>
      <div class="divider"></div>
      <button id="deleteSelectionBtn" title="Delete Selected">🗑️</button>
    </div>
  </div>

  <!-- NEW: Floating title for current chapter -->
  <div id="floating-chapter-title" class="hidden"></div>

  
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
      </div>
      <!-- NEW: Progress container on its own line -->
      <div id="progressContainer">
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

  <!-- Table of Contents Modal -->
  <div id="tocModal" class="hidden">
    <div class="modal-content">
      <h3>Table of Contents</h3>
      <div id="tocContent"></div>
      <button id="closeTocBtn">Close</button>
    </div>
  </div>
  
  <!-- Graph Selection Modal -->
  <div id="graphSelectionModal" class="hidden">
    <div class="modal-content">
      <h3>Select a Story</h3>
      <div id="graphSelectionOptions"></div>
      <button id="closeGraphModalBtn">Cancel</button>
    </div>
  </div>

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

.iframe-wrapper {
  position: absolute;
  box-sizing: border-box;
  background-color: #000;
  transition: padding 0.2s, background-color 0.2s;
  padding: 0;
}

.iframe-wrapper.selected { /* Outline for EDITOR */
    background-color: #7febfb;
    padding: 3px; 
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

/* By default, wrappers are not interactive */
.iframe-wrapper, .markdown-overlay {
    pointer-events: none;
}

/* This class, added by JS, makes an overlay interactive */
.interaction-enabled {
    pointer-events: auto !important; /* Use important to override other rules */
    box-shadow: 0 0 0 3px var(--primary-color), 0 0 25px rgba(66, 133, 244, 0.7);
    transition: box-shadow 0.3s ease-in-out;
    z-index: 3; /* Bring to front */
}

/* Content inside the wrapper can receive events if the wrapper allows it */
.iframe-wrapper iframe {
  width: 100%;
  height: 100%;
  border: none;
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
  justify-content: center; /* This centers the items inside the flex container */
  width: 100%; /* We need to give it a width to center within */
  max-width: 500px; /* And constrain it like the progress bar */
}

/* NEW: Style for the progress container */
#progressContainer {
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 500px; /* Same as old player controls */
  gap: 12px;
}

#progress {
  flex-grow: 1;
}

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

#toggleEditorModeBtn {
    background: #3c3c3c;
    color: var(--dark-subtle-text);
    padding: 6px 10px;
    font-size: 16px;
    line-height: 1;
    font-weight: normal; /* Override default button bold */
}

#toggleEditorModeBtn:hover {
    background: #4f4f4f;
    transform: none; /* Override default button transform */
}

#toggleEditorModeBtn.active {
    background: var(--primary-color);
    color: white;
    box-shadow: inset 0 0 5px rgba(0,0,0,0.3);
}

.divider { width: 1px; height: 24px; background-color: var(--dark-border); margin: 0 5px; }

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
body.editor-mode #tocBtn { display: none; } /* Hide TOC in editor mode */

#tocBtn {
    background: #3c3c3c;
    color: var(--dark-subtle-text);
    padding: 6px 10px;
    font-size: 16px;
    line-height: 1;
}

#tocBtn:hover {
    background: #4f4f4f;
    transform: none;
}

#followModeBtn {
    background: #3c3c3c;
    color: var(--dark-subtle-text);
    padding: 6px 10px;
    font-size: 16px; /* Adjusted for emoji */
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

/* NEW: Floating Chapter Title */
#floating-chapter-title {
  position: fixed;
  top: 70px; /* Below the top toolbar */
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(45, 45, 45, 0.9);
  color: var(--dark-text);
  padding: 8px 16px;
  border-radius: 16px;
  border: 1px solid var(--dark-border);
  font-size: 16px;
  font-weight: 500;
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
  z-index: 150;
  pointer-events: none; /* Crucial: let clicks pass through to the canvas */
  white-space: nowrap;
  transition: opacity 0.3s ease-in-out, top 0.3s ease-in-out;
}

#floating-chapter-title.hidden {
  opacity: 0;
  top: 50px; /* Move up slightly when hiding */
}
/* Graph Selection Modal */
#graphSelectionModal {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.6); z-index: 400; display: flex;
  justify-content: center; align-items: center; padding: 15px;
}


#graphSelectionModal, #tocModal {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.6); z-index: 400; display: flex;
  justify-content: center; align-items: center; padding: 15px;
}

#tocContent {
  margin: 20px 0;
  display: flex;
  flex-direction: column;
  gap: 15px;
  max-height: 60vh;
  overflow-y: auto;
}

.toc-group-title {
  font-size: 1.1em;
  font-weight: bold;
  color: var(--primary-color);
  margin: 10px 0 5px 0;
  padding-bottom: 5px;
  border-bottom: 1px solid var(--dark-border);
  cursor: pointer;
}
.toc-group-title:hover {
  color: var(--primary-hover);
}

.toc-node-item {
  padding-left: 20px;
  cursor: pointer;
  color: var(--dark-text);
  padding-bottom: 5px;
}
.toc-node-item:hover {
  color: #fff;
}

#graphSelectionOptions {
  margin: 20px 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 60vh;
  overflow-y: auto;
}

.graph-option {
  padding: 15px;
  border: 1px solid var(--dark-border);
  border-radius: 6px;
  background-color: #3c3c3c;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}

.graph-option:hover {
  border-color: var(--primary-color);
  transform: translateY(-2px);
  background-color: #4a4a4a;
}

.graph-option h5 {
  margin: 0 0 5px 0;
  font-size: 1.1em;
  color: var(--dark-text);
}

.graph-option p {
  margin: 0;
  font-size: 0.9em;
  color: var(--dark-subtle-text);
  line-height: 1.4;
}


## ./public/data/default.jsonld

{
  "@context": "https://schema.org/",
  "@graph": [
    {
      "@id": "node-2",
      "@type": "MusicRecording",
      "name": "Ballad of Everything (2 version)",
      "position": {
        "x": 378.0058298445465,
        "y": 390.3893227462136
      },
      "isCollapsed": false,
      "sourceType": "iframe",
      "audioUrl": null,
      "coverUrl": null,
      "iframeUrl": "YGJvDBRbYdM",
      "tocOrder": 1.1
    },
    {
      "@id": "node-3a",
      "@type": "MusicRecording",
      "name": "Ballad of Everything (1 version)",
      "position": {
        "x": 10.258250990296276,
        "y": 860.7204059819859
      },
      "isCollapsed": false,
      "sourceType": "iframe",
      "audioUrl": null,
      "coverUrl": null,
      "iframeUrl": "_IK2VLriSxs"
    },
    {
      "@id": "node-3b",
      "@type": "MusicRecording",
      "name": "Love Transcends",
      "position": {
        "x": 9.010717967064679,
        "y": 1070.6083907422394
      },
      "isCollapsed": false,
      "sourceType": "iframe",
      "audioUrl": null,
      "coverUrl": null,
      "iframeUrl": "4UUnPzG2bC4"
    },
    {
      "@id": "node-1754588700272",
      "@type": "MusicRecording",
      "name": "Garbage for Ears",
      "position": {
        "x": 380.9334111623574,
        "y": 860.2404756081706
      },
      "isCollapsed": false,
      "sourceType": "iframe",
      "audioUrl": null,
      "coverUrl": null,
      "iframeUrl": "DcRXJrtysG0",
      "tocOrder": 1.3
    },
    {
      "@id": "node-1754728254075",
      "@type": "MusicRecording",
      "name": "Ode",
      "position": {
        "x": 761.2822729960664,
        "y": 656.2291768559684
      },
      "isCollapsed": false,
      "sourceType": "iframe",
      "audioUrl": null,
      "coverUrl": null,
      "iframeUrl": "iw5n8TKEh18"
    },
    {
      "@id": "node-1754728644575",
      "@type": "MusicRecording",
      "name": "Broken Lights",
      "position": {
        "x": 758.7142065168892,
        "y": 1078.6183312538906
      },
      "isCollapsed": false,
      "sourceType": "iframe",
      "audioUrl": null,
      "coverUrl": null,
      "iframeUrl": "rQnmgRxzILs"
    },
    {
      "@id": "node-1754728755939",
      "@type": "MusicRecording",
      "name": "Hard to wait",
      "position": {
        "x": 379.94979949563066,
        "y": 653.354297294357
      },
      "isCollapsed": false,
      "sourceType": "iframe",
      "audioUrl": null,
      "coverUrl": null,
      "iframeUrl": "mM5Jtcd34z0",
      "tocOrder": 1.2
    },
    {
      "@id": "node-1754729280653",
      "@type": "MusicRecording",
      "name": "Ode to the Hero",
      "position": {
        "x": 760.9435243713363,
        "y": 869.4764528815044
      },
      "isCollapsed": false,
      "sourceType": "iframe",
      "audioUrl": null,
      "coverUrl": null,
      "iframeUrl": "h7fiwzMv7Os"
    },
    {
      "@id": "node-1754732165702",
      "@type": "MusicRecording",
      "name": "Chasing the Moon",
      "position": {
        "x": 11.875718414828924,
        "y": 659.9462234061001
      },
      "isCollapsed": false,
      "sourceType": "iframe",
      "audioUrl": null,
      "coverUrl": null,
      "iframeUrl": "4eJpTAxdxiU"
    },
    {
      "@id": "node-1755066807418",
      "@type": "MusicRecording",
      "name": "1",
      "position": {
        "x": 1951.1558058773876,
        "y": 651.8425036690867
      },
      "isCollapsed": false,
      "sourceType": "audio",
      "audioUrl": "https://archive.org/download/AcousticRockBallads/08.%20When%20I%20See%20You%20Smile.mp3",
      "coverUrl": "https://archive.org/download/AcousticRockBallads/six-part-invention.jpg",
      "iframeUrl": null
    },
    {
      "@id": "node-1755066925615",
      "@type": "MusicRecording",
      "name": "2",
      "position": {
        "x": 2390.1174293042727,
        "y": 724.2096084181657
      },
      "isCollapsed": false,
      "sourceType": "audio",
      "audioUrl": "https://archive.org/download/12-make-me-wanna-die-acoustic/12%20-%20Make%20Me%20Wanna%20Die%20%28Acoustic%29.mp3",
      "coverUrl": null,
      "iframeUrl": null
    },
    {
      "@id": "node-1755068125852",
      "@type": "MusicRecording",
      "name": "3",
      "position": {
        "x": 2181.259276279302,
        "y": 950.8632046591489
      },
      "isCollapsed": false,
      "sourceType": "audio",
      "audioUrl": "https://archive.org/download/07RunOfTheMill/02%20-%20Before%20The%20Dawn.mp3",
      "coverUrl": null,
      "iframeUrl": null
    },
    {
      "@type": "Path",
      "source": "node-1754728755939",
      "target": "node-1754588700272",
      "color": "#888888",
      "label": "",
      "lineWidth": 7,
      "controlPoints": []
    },
    {
      "@type": "Path",
      "source": "node-2",
      "target": "node-1754728755939",
      "color": "#888887",
      "label": "",
      "lineWidth": 7,
      "controlPoints": []
    },
    {
      "@type": "Path",
      "source": "node-2",
      "target": "node-1754728254075",
      "color": "#888888",
      "label": "",
      "lineWidth": 7,
      "controlPoints": []
    },
    {
      "@type": "Path",
      "source": "node-3a",
      "target": "node-3b",
      "color": "#888888",
      "label": "",
      "lineWidth": 7,
      "controlPoints": []
    },
    {
      "@type": "Path",
      "source": "node-1754728254075",
      "target": "node-1754729280653",
      "color": "#888888",
      "label": "",
      "lineWidth": 7,
      "controlPoints": []
    },
    {
      "@type": "Path",
      "source": "node-1754729280653",
      "target": "node-1754728644575",
      "color": "#888888",
      "label": "",
      "lineWidth": 7,
      "controlPoints": []
    },
    {
      "@type": "Path",
      "source": "node-1754728644575",
      "target": "node-1754728755939",
      "color": "#8880ff",
      "label": "<< -- Hard to wait",
      "lineWidth": 2,
      "controlPoints": [
        {
          "x": 736.1051733655702,
          "y": 1102.2533055612462
        },
        {
          "x": 732.4407580355871,
          "y": 673.1790824708759
        }
      ]
    },
    {
      "@type": "Path",
      "source": "node-3b",
      "target": "node-1754728755939",
      "color": "#179bd3",
      "label": "Hard to wait -->>",
      "lineWidth": 2,
      "controlPoints": [
        {
          "x": 356.982433876294,
          "y": 1093.2962450032737
        },
        {
          "x": 357.0737088206952,
          "y": 673.5706058157207
        }
      ]
    },
    {
      "@type": "Path",
      "source": "node-3b",
      "target": "node-1754728254075",
      "color": "#ae1e1e",
      "label": "Ode -->>",
      "lineWidth": 2,
      "controlPoints": [
        {
          "x": 108.5401867406903,
          "y": 1202.596512361893
        },
        {
          "x": 1115.6531728232844,
          "y": 1205.0729288471837
        },
        {
          "x": 1110.2560161799204,
          "y": 680.5674332329856
        }
      ]
    },
    {
      "@type": "Path",
      "source": "node-1754588700272",
      "target": "node-1754728254075",
      "color": "#827b30",
      "label": "",
      "lineWidth": 2,
      "controlPoints": []
    },
    {
      "@type": "Path",
      "source": "node-1754732165702",
      "target": "node-3a",
      "color": "#888888",
      "label": "",
      "lineWidth": 7,
      "controlPoints": []
    },
    {
      "@type": "Path",
      "source": "node-1754728644575",
      "target": "node-1754732165702",
      "color": "#396f3d",
      "label": "<<-- Chasing the Moon",
      "lineWidth": 2,
      "controlPoints": [
        {
          "x": 859.0136266863468,
          "y": 1229.665294973312
        },
        {
          "x": -38.84985276240153,
          "y": 1228.4584892213647
        },
        {
          "x": -40.056658514348776,
          "y": 684.1890950931585
        }
      ]
    },
    {
      "@type": "Path",
      "source": "node-1754588700272",
      "target": "node-1754732165702",
      "color": "#da540b",
      "label": "",
      "lineWidth": 2,
      "controlPoints": []
    },
    {
      "@type": "Path",
      "source": "node-2",
      "target": "node-1754732165702",
      "color": "#888888",
      "label": "",
      "lineWidth": 7,
      "controlPoints": []
    },
    {
      "@type": "Path",
      "source": "node-1754728254075",
      "target": "node-2",
      "color": "#000000",
      "label": "",
      "lineWidth": 2,
      "controlPoints": [
        {
          "x": 858.7246036846047,
          "y": 416.77239598625897
        }
      ]
    },
    {
      "@type": "Path",
      "source": "node-1754732165702",
      "target": "node-2",
      "color": "#000000",
      "label": "",
      "lineWidth": 2,
      "controlPoints": [
        {
          "x": 112.93568569248006,
          "y": 412.3565405507793
        }
      ]
    },
    {
      "@type": "Path",
      "source": "node-1755066807418",
      "target": "node-1755066925615",
      "color": "#888888",
      "label": "",
      "lineWidth": 2,
      "controlPoints": [
        {
          "x": 2279.024217054637,
          "y": 548.7754444343499
        }
      ]
    },
    {
      "@type": "Path",
      "source": "node-1755066807418",
      "target": "node-1755068125852",
      "color": "#888888",
      "label": "",
      "lineWidth": 2,
      "controlPoints": [
        {
          "x": 1993.8306599873777,
          "y": 904.5968730010246
        }
      ]
    },
    {
      "@type": "Path",
      "source": "node-1755068125852",
      "target": "node-1755066807418",
      "color": "#888888",
      "label": "",
      "lineWidth": 2,
      "controlPoints": []
    },
    {
      "@type": "Path",
      "source": "node-1755066925615",
      "target": "node-1755066807418",
      "color": "#888888",
      "label": "",
      "lineWidth": 2,
      "controlPoints": []
    },
    {
      "@id": "deco-text-1",
      "position": {
        "x": 304.96864331677847,
        "y": 170.99178445894216
      },
      "@type": "MarkdownAnnotation",
      "size": {
        "width": 150,
        "height": 40
      },
      "textContent": "**Sample starter playlist**",
      "fontSize": 16,
      "backgroundColor": "rgba(45, 45, 45, 0)"
    },
    {
      "@id": "deco-text-1754589455494",
      "position": {
        "x": 762.2097228315881,
        "y": 354.51078528849814
      },
      "@type": "MarkdownAnnotation",
      "size": {
        "width": 40,
        "height": 48
      },
      "textContent": "🛡️ License and Usage\n\nThis project is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License (CC BY-NC-SA 4.0).\n\n---\n\nImportant Clarification for Artists and Creators:\n\nThe CC BY-NC-SA license applies only to the player's source code (the HTML, CSS, and JavaScript files that make it run).\n\nIt does not apply to the content you create, such as your music, cover art, lyrics, or the `.jsonld` graph file that structures your narrative. You retain full ownership of your art and are free to license or sell it however you wish.\n\nYou can freely use this player as a non-commercial tool to display and distribute your commercial or non-commercial artwork.\n\nA Note on Attribution (How to give credit)\n\nTo comply with the license, you must provide a visible credit. We've made this as painless as possible.\n\n1. Required Attribution Text:\nYou must include the following text somewhere visible (e.g., in the footer of your page or on an \"About\" page):\n\n> AVN Player by Nftxv\n\n2. Required License Notice:\nYou must also include a reference to the license, so others know the terms under which the player is shared.\n\nThe Easiest Way to Do Both:\nYou can fulfill both requirements with a single, simple line. Here is a perfect example:\n\npowered by AVN Player by Nftxv, used under CC BY-NC-SA 4.0",
      "fontSize": 4,
      "backgroundColor": "rgba(45, 45, 45, 0.85)"
    },
    {
      "@id": "deco-rect-chapter1",
      "position": {
        "x": 270,
        "y": 350
      },
      "@type": "RectangleAnnotation",
      "size": {
        "width": 450,
        "height": 550
      },
      "backgroundColor": "rgba(40, 40, 70, 0.2)",
      "title": "Chapter 1: The Ballad",
      "titleFontSize": 24,
      "tocOrder": 1
    },
    {
      "@id": "deco-text-1754721399707",
      "position": {
        "x": 761.7167867768118,
        "y": 279.2046030897085
      },
      "@type": "MarkdownAnnotation",
      "size": {
        "width": 100,
        "height": 70
      },
      "textContent": "### Global settings 🛠 \n./public/js/modules/Renderer.js\n\n**setupCanvasInteraction**\n\nconst newScale = Math.max(0.05, Math.min(25, this.scale * zoom));\n\n**LOD**\n\nconst DECORATION_LOD_THRESHOLD = 0.1;\n\n./public/js/modules/EditorTools.js\n\n**openInspector**\n\ninput type=\"number\" id=\"fontSize\" value=\"${entity.fontSize || 14}\" min=\"1\">",
      "fontSize": 10,
      "backgroundColor": "rgba(45, 45, 45, 0)"
    },
    {
      "@id": "deco-text-1754724649323",
      "position": {
        "x": 821.9449795403725,
        "y": 355.6125309540575
      },
      "@type": "MarkdownAnnotation",
      "size": {
        "width": 40,
        "height": 48
      },
      "textContent": "### Fan art \n![FrozenPlanetLord](https://pbs.twimg.com/media/GYzEVFxWUAgFjG0?format=jpg&name=900x900)\n[link img](https://pbs.twimg.com/media/GYzEVFxWUAgFjG0?format=jpg&name=900x900)",
      "fontSize": 3,
      "backgroundColor": "rgba(45, 45, 45, 0.85)"
    },
    {
      "@id": "deco-text-1754729522336",
      "position": {
        "x": 972.0797306999273,
        "y": 756.9112839763021
      },
      "@type": "MarkdownAnnotation",
      "size": {
        "width": 100,
        "height": 93
      },
      "textContent": "### Ode to the Hero\n\nYet when they chase him, full of pride,\nHe grins and lets his laughter ride.\nNo fear, no doubt within his soul—\nHe fights until he meets his goal.\n\nBounty hunters shake with dread,\nTheir leaders gone, the bosses dead.\nThe clever beasts, they try and flee,\nBut none escape his destiny.\n\nHis legend’s written in the stars,\nA tale that reaches distant bars.\nThe bravest whisper of his fame,\nFor all the void now knows his name.",
      "fontSize": 8,
      "backgroundColor": "rgba(20,20,20, 1)"
    },
    {
      "@id": "deco-text-1754729652278",
      "position": {
        "x": 971.6956769207269,
        "y": 544.4808034706764
      },
      "@type": "MarkdownAnnotation",
      "size": {
        "width": 100,
        "height": 93
      },
      "textContent": "### Ode\n\n... Their echo, distorted, across worlds flows,\nLeaving inkblots on thought, where it never goes.\nSometimes this echo will brush the mind,\nAnd forms take shape in a desperate bind...",
      "fontSize": 8,
      "backgroundColor": "rgba(45, 45, 45, 0.0)"
    },
    {
      "@id": "deco-text-1754729757634",
      "position": {
        "x": 595.6792456865479,
        "y": 540.1011356531369
      },
      "@type": "MarkdownAnnotation",
      "size": {
        "width": 100,
        "height": 108
      },
      "textContent": "### Hard to wait\n\nYou know, sometimes it's hard to wait,  \nNot knowing if things will turn out great.  \nYou worry and fear that plans may fall,  \nThat dreams might never come true at all.  \n\nBut then you see those who waited through,  \nThe ones who held on, who stayed true.  \nAnd when they finally get what they sought,  \nTheir joy is real, it's what they fought.  \n\nYou see them smile, their hearts so light,  \nAnd you realize their struggle was right.  \nThe best rewards come to those who stay,  \nWho keep on going, who find their way.  \n\nEven when waiting seems too tough,  \nAnd the road ahead is long and rough.  \nTrue joy comes to those who believe,  \nWho hold on tight and never leave.\n\nWaiting is hard, with doubts that persist,  \nBut remember, together we'll overcome this.  \nEpic triumphs await us as we heed the call,  \nFor Troverse is near—come, conquer it all!",
      "fontSize": 8,
      "backgroundColor": "rgba(45, 45, 45, 0.0)"
    },
    {
      "@id": "deco-text-1754729871647",
      "position": {
        "x": 597.4780885985141,
        "y": 748.5139555307164
      },
      "@type": "MarkdownAnnotation",
      "size": {
        "width": 110,
        "height": 115
      },
      "textContent": "### Garbage for Ears\n\nSometimes you meet someone who seems just fine,\nYou lend a hand, you’re glad to give your time.\nYou help them find their way, no strings attached,\nYou hope they grow and find the dream they’ve hatched.\n\nBut then, without a reason, there they stand—\nA knife in hand, though never planned.\nNo real cause, no warning sign or fight,\nJust a little stab that doesn’t feel quite right.\n\nThey seek excuses, paint themselves as just,\nBut you’re already done—you’ve lost that trust.\nNo anger now, no burning flame, just there\nA piece of shit you simply choose to spare.\n\nIt stings a bit, but nothing’s truly lost,\nJust people showing who they are, at cost.\nAnd once you see it, once it’s clear as day,\nYou know what’s real, and calmly walk away.\n\nThen write your song, and let the words just flow,\nFor in the end, it’s just another show.\nPeople will disappoint, it’s how they are,\nBut don’t let little wounds become a scar.\n\nIt’s not another mess upon your road,\nJust one more song to lighten up the load.\nA song to store among the rest you’ve spun,\nA story told, a chapter that is done.\n\nAnd if the song’s created by machine,\nThat doesn’t change the truth it may have seen.\nFor songs need sparks, wherever they may start,\nEach little note a piece of someone's heart.",
      "fontSize": 8,
      "backgroundColor": "rgba(25,25,85,0.3)"
    },
    {
      "@id": "deco-text-1754729973346",
      "position": {
        "x": 596.3708095543834,
        "y": 277.3981027629988
      },
      "@type": "MarkdownAnnotation",
      "size": {
        "width": 100,
        "height": 105
      },
      "textContent": "### Ballad of Everything\n\nYou’ve traveled far, you’ve seen it all,\nThe mountains high, the cities tall.\nNow you’ve got a song to sing,\nTo capture every sight and thing.\n\nThe day you failed but stood up strong,\nProving that you still belong.\nNow your song can tell the tale,\nOf how you rose when you could fail.\n\nCan’t sing, no band, no way to play,\nBut deep inside, soul has its say.\nSunoForce reshaped the view,\nSing your tale, we’ll hear you.\n\nThere’s that story from your past,\nA lesson learned that’s meant to last.\nNow you’ve got the tune to share,\nAnd let the world know you were there.\n\nA simple day, a quiet breeze,\nMoments like these put you at ease.\nNow you’ve got a tune to hum,\nAnd let the peace of life become.\n\nCan’t sing, no band, no way to play,\nBut deep inside, soul has its say.\nSunoForce reshaped the view,\nSing your tale, we’ll hear you.\n\nYou’ve got a joke you want to tell,\nThe one that always makes them yell.\nNow you’ve got the chance to sing,\nTurn those laughs into everything.\n\nYou’ve been holding love inside your chest,\nWaiting for the time that’s best.\nNow you’ve got the perfect way,\nTo let your heart sing what you’d say.\n\nCan’t sing, no band, no way to play,\nBut deep inside, soul has its say.\nSunoForce reshaped the view,\nSing your tale, we’ll hear you.\n\nWhen words alone just fall apart,\nAnd you need to speak straight from the heart.\nTurn it into something true,\nA song that shows what you’ve been through.\n\nMaybe it’s the things you never say,\nThe quiet thoughts that slip away.\nNow’s your time, don’t let them fade,\nMake a song of every day.\n\nYou’ve danced with joy, you’ve cried with pain,\nLife’s a journey, not in vain.\nNow your voice can set it free,\nA song for every memory.\n\nCan’t sing, no band, no way to play,\nBut deep inside, soul has its say.\nSunoForce reshaped the view,\nSing your tale, we’ll hear you.",
      "fontSize": 8,
      "backgroundColor": "rgba(46,46,46, 0.5)"
    },
    {
      "@id": "deco-text-1754730049282",
      "position": {
        "x": 233.82614273646362,
        "y": 549.1802373197147
      },
      "@type": "MarkdownAnnotation",
      "size": {
        "width": 105,
        "height": 108
      },
      "textContent": "### Chasing the Moon\n\nI was lost in the city lights,\nChasing shadows in the night,\nSaw the stars up in the sky,\nBut they couldn’t tell me why.\n\nI’ve been running far and wide,\nFrom the ocean to the mountainside,\nLooking for a spark to hold,\nSomething warm, in a world so cold.\n\nI’m chasing the moon, where the wild winds play,\nRiding the night, till the break of day,\nWith a heart that’s free, and a restless tune,\nI’ll keep chasing, chasing the moon.\n\nIn the echoes of a desert breeze,\nFound a dream beneath the trees,\nIn the silence, I heard it call,\nA whisper that could break my fall.\n\nThrough the rivers deep and wide,\nI’ll follow where my heart decides,\nNo more waiting for a sign,\nThe stars are gonna align this time.\n\nI’m chasing the moon, where the wild winds play,\nRiding the night, till the break of day,\nWith a heart that’s free, and a restless tune,\nI’ll keep chasing, chasing the moon.\n\nAnd if the road gets long, and the nights too dark,\nI’ll find my way back to where dreams spark,\nFor every night there’s a light that guides,\nIt’s the moon, it’s the moon, shining by my side.\n\nI’m chasing the moon, where the wild winds play,\nRiding the night, till the break of day,\nWith a heart that’s free, and a restless tune,\nI’ll keep chasing, chasing the moon.",
      "fontSize": 8,
      "backgroundColor": "rgba(114,65,25, 0.3)"
    },
    {
      "@id": "deco-text-1754730094583",
      "position": {
        "x": 217.82985574398194,
        "y": 747.8197355302341
      },
      "@type": "MarkdownAnnotation",
      "size": {
        "width": 100,
        "height": 93
      },
      "textContent": "### Ballad of Everything\n\nYou’ve traveled far, you’ve seen it all,\nThe mountains high, the cities tall.\nNow you’ve got a song to sing,\nTo capture every sight and thing.\n\nThe day you failed but stood up strong,\nProving that you still belong.\nNow your song can tell the tale,\nOf how you rose when you could fail.\n\nCan’t sing, no band, no way to play,\nBut deep inside, soul has its say.\nSunoForce reshaped the view,\nSing your tale, we’ll hear you.\n\nThere’s that story from your past,\nA lesson learned that’s meant to last.\nNow you’ve got the tune to share,\nAnd let the world know you were there.\n\nA simple day, a quiet breeze,\nMoments like these put you at ease.\nNow you’ve got a tune to hum,\nAnd let the peace of life become.\n\nCan’t sing, no band, no way to play,\nBut deep inside, soul has its say.\nSunoForce reshaped the view,\nSing your tale, we’ll hear you.\n\nYou’ve got a joke you want to tell,\nThe one that always makes them yell.\nNow you’ve got the chance to sing,\nTurn those laughs into everything.\n\nYou’ve been holding love inside your chest,\nWaiting for the time that’s best.\nNow you’ve got the perfect way,\nTo let your heart sing what you’d say.\n\nCan’t sing, no band, no way to play,\nBut deep inside, soul has its say.\nSunoForce reshaped the view,\nSing your tale, we’ll hear you.\n\nWhen words alone just fall apart,\nAnd you need to speak straight from the heart.\nTurn it into something true,\nA song that shows what you’ve been through.\n\nMaybe it’s the things you never say,\nThe quiet thoughts that slip away.\nNow’s your time, don’t let them fade,\nMake a song of every day.\n\nYou’ve danced with joy, you’ve cried with pain,\nLife’s a journey, not in vain.\nNow your voice can set it free,\nA song for every memory.\n\nCan’t sing, no band, no way to play,\nBut deep inside, soul has its say.\nSunoForce reshaped the view,\nSing your tale, we’ll hear you.",
      "fontSize": 8,
      "backgroundColor": "rgba(45, 45, 45, 0)"
    },
    {
      "@id": "deco-text-1754730140421",
      "position": {
        "x": 218.27078279920758,
        "y": 956.8191597071989
      },
      "@type": "MarkdownAnnotation",
      "size": {
        "width": 100,
        "height": 93
      },
      "textContent": "### Love Transcends\n\nWe met like strangers passing in the rain,\nNo spark to light, no fire, no flame.\nJust two souls in the city's hum,\nNo signs or whispers of what we’d become.\n\nBut as the days turned into nights,\nWe found a rhythm in shared sights.\nLaughter came easy, moments felt right,\nWe held on close, if only for a while.\n\nAnd the world kept spinning, day by day,\nAnd no one cared — we were okay.\n\nWe parted like the setting of the sun,\nNo tears, no fight, just said it’s done.\nBut silence now is louder than before,\nAn empty space where there was more.\n\nI see you in the little things I do,\nIn every breeze, in every shade of blue.\nI never knew what lingered in the air,\nUntil the quiet made me care.\n\nAnd the world kept spinning, day by day,\nWhile we let our chances drift away.\n\nThe nights were warm when you were near,\nIn simple talks, we’d lose the fear.\nI thought it’d last, but time slips fast,\nAnd now I see what we let pass.\n\nThe mornings bloom, but not the same,\nYour smile was more than just a name.\nI thought I’d move on, find my way,\nBut here I stand, with words to say.\n\nAnd the world kept spinning, day by day,\nBut something in us chose to stay.\n\nI thought the distance would fade the ache,\nBut every step is a heart to break.\n\nI thought I’d heal, let memories fly,\nBut you are still the reason why.\n\nSo here we are, no more disguise,\nIt’s you I see through different eyes.\nThe simple truth we tried to hide—\nWe were meant to walk side by side.\n\nWe turned away, but in the end,\nI found in you my greatest friend.\nIn you, I found what words can't send,\nAnd starts again where love transcends.",
      "fontSize": 8,
      "backgroundColor": "rgba(8,80,80,0.2)"
    },
    {
      "@id": "deco-text-1754730196459",
      "position": {
        "x": 970.5534993072607,
        "y": 965.6010753221964
      },
      "@type": "MarkdownAnnotation",
      "size": {
        "width": 100,
        "height": 50
      },
      "textContent": "### Broken Lights\n\n...I’ve seen the lies, I’ve heard the pleas,\nFelt the sorrow in the breeze...",
      "fontSize": 8,
      "backgroundColor": "rgba(0,0,0, 0.85)"
    }
  ],
  "view": {
    "offset": {
      "x": -1306.0903663763138,
      "y": -874.0132486589607
    },
    "scale": 3.7136789107166948
  }
}


## ./public/data/manifest.json

[
  {
    "title": "Ballad of Everything",
    "file": "default.jsonld",
    "description": "The default starter project with a variety of nodes and connections."
  },
  {
    "title": "A New Story (Example)",
    "file": "new_story.jsonld",
    "description": "A placeholder for a completely different narrative experience."
  }
]


## ./public/data/new_story.jsonld

{
  "@context": "https://schema.org/",
  "@graph": [
    {
      "@id": "node-1755066807418",
      "@type": "MusicRecording",
      "name": "1",
      "position": {
        "x": -5.913801878004762,
        "y": 611.4435167045033
      },
      "isCollapsed": false,
      "sourceType": "audio",
      "audioUrl": "https://archive.org/download/AcousticRockBallads/08.%20When%20I%20See%20You%20Smile.mp3",
      "coverUrl": "https://archive.org/download/AcousticRockBallads/six-part-invention.jpg",
      "iframeUrl": null
    },
    {
      "@id": "node-1755066925615",
      "@type": "MusicRecording",
      "name": "2",
      "position": {
        "x": 690.9970994974659,
        "y": 663.1746792176955
      },
      "isCollapsed": false,
      "sourceType": "audio",
      "audioUrl": "https://archive.org/download/12-make-me-wanna-die-acoustic/12%20-%20Make%20Me%20Wanna%20Die%20%28Acoustic%29.mp3",
      "coverUrl": null,
      "iframeUrl": null
    },
    {
      "@id": "node-1755068125852",
      "@type": "MusicRecording",
      "name": "3",
      "position": {
        "x": 437.91907025273736,
        "y": 972.3720444022259
      },
      "isCollapsed": false,
      "sourceType": "audio",
      "audioUrl": "https://archive.org/download/07RunOfTheMill/02%20-%20Before%20The%20Dawn.mp3",
      "coverUrl": null,
      "iframeUrl": null
    },
    {
      "@type": "Path",
      "source": "node-1755066807418",
      "target": "node-1755066925615",
      "color": "#888888",
      "label": "",
      "lineWidth": 2,
      "controlPoints": [
        {
          "x": 569.0670392623003,
          "y": 337.58409876331865
        }
      ]
    },
    {
      "@type": "Path",
      "source": "node-1755066807418",
      "target": "node-1755068125852",
      "color": "#888888",
      "label": "",
      "lineWidth": 2,
      "controlPoints": [
        {
          "x": 96.37860767283688,
          "y": 968.6903448073391
        }
      ]
    },
    {
      "@type": "Path",
      "source": "node-1755068125852",
      "target": "node-1755066807418",
      "color": "#888888",
      "label": "",
      "lineWidth": 2,
      "controlPoints": []
    },
    {
      "@type": "Path",
      "source": "node-1755066925615",
      "target": "node-1755066807418",
      "color": "#888888",
      "label": "",
      "lineWidth": 2,
      "controlPoints": []
    }
  ],
  "view": {
    "offset": {
      "x": 93.8658438670966,
      "y": -760.632996665332
    },
    "scale": 2.25246011967789
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

// Constants exposed for other modules that need them
const NODE_WIDTH = 200;
const NODE_HEADER_HEIGHT = 45;
const NODE_CONTENT_HEIGHT_DEFAULT = NODE_WIDTH * (9 / 16); // For iframes
const NODE_CONTENT_HEIGHT_SQUARE = NODE_WIDTH;          // For audio with covers

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
    this.followScreenOffset = { x: 0, y: 0 };

this.updateUrlDebounceTimer = null; // For debouncing URL updates
  }

  _naturalSort(a, b) {
    const re = /(\d+|\D+)/g;
    const aParts = String(a).match(re);
    const bParts = String(b).match(re);

    for (let i = 0; i < Math.min(aParts.length, bParts.length); i++) {
        let aPart = aParts[i], bPart = bParts[i];
        if (!isNaN(aPart) && !isNaN(bPart)) {
            aPart = parseInt(aPart, 10);
            bPart = parseInt(bPart, 10);
        }
        if (aPart < bPart) return -1;
        if (aPart > bPart) return 1;
    }
    return aParts.length - bParts.length;
  }

  _generateAndShowTOC() {
      const tocContent = document.getElementById('tocContent');
      const chapters = this.graphData.decorations
          .filter(d => d.type === 'rectangle' && d.tocOrder != null)
          .sort((a, b) => this._naturalSort(a.tocOrder, b.tocOrder));

      if (chapters.length === 0) {
          tocContent.innerHTML = '<p>No chapters defined in this story.</p>';
          return;
      }

      let html = '';
      chapters.forEach(chapter => {
          html += `<div class="toc-group">`;
          html += `<h5 class="toc-group-title" data-group-id="${chapter.id}">${chapter.title || 'Untitled Chapter'}</h5>`;
          
          const nodesInChapter = this.graphData.nodes
              .filter(n =>
                  n.tocOrder != null &&
                  n.x >= chapter.x && n.x <= chapter.x + chapter.width &&
                  n.y >= chapter.y && n.y <= chapter.y + chapter.height
              )
              .sort((a, b) => this._naturalSort(a.tocOrder, b.tocOrder));

          if (nodesInChapter.length > 0) {
              nodesInChapter.forEach(node => {
                  html += `<div class="toc-node-item" data-node-id="${node.id}">${node.title}</div>`;
              });
          }
          html += `</div>`;
      });
      
      tocContent.innerHTML = html;
      document.getElementById('tocModal').classList.remove('hidden');
  }

  _findGroupAtPoint(point) {
    let smallestGroup = null;
    let smallestArea = Infinity;

    for (const deco of this.graphData.decorations) {
        if (deco.type === 'rectangle' && deco.title) {
            const isInside = (
                point.x >= deco.x && point.x <= deco.x + deco.width &&
                point.y >= deco.y && point.y <= deco.y + deco.height
            );
            if (isInside) {
                const area = deco.width * deco.height;
                if (area < smallestArea) {
                    smallestArea = area;
                    smallestGroup = deco;
                }
            }
        }
    }
    return smallestGroup;
  }

  // NEW: Update floating title based on current view center
  _updateFloatingChapterTitle() {
      const titleDiv = document.getElementById('floating-chapter-title');
      const center = this.renderer.getViewportCenter();
      const currentGroup = this._findGroupAtPoint(center);

      if (currentGroup && currentGroup.title) {
          titleDiv.textContent = currentGroup.title;
          titleDiv.classList.remove('hidden');
      } else {
          titleDiv.classList.add('hidden');
      }
  }

  // NEW: Utility to parse view state from URL hash
  parseViewFromHash() {
    try {
      const params = new URLSearchParams(window.location.hash.substring(1));
      const x = parseFloat(params.get('x'));
      const y = parseFloat(params.get('y'));
      const scale = parseFloat(params.get('s'));

      if (!isNaN(x) && !isNaN(y) && !isNaN(scale)) {
        // The hash stores the CENTER of the view. We need to convert it to renderer's OFFSET.
        const canvas = this.renderer.canvas;
        const targetOffset = {
            x: (canvas.width / 2) - (x * scale),
            y: (canvas.height / 2) - (y * scale)
        };
        return { offset: targetOffset, scale: scale };
      }
    } catch (e) { /* Ignore parsing errors */ }
    return null;
  }

  async init() {
    try {
      // Step 1: Fetch the manifest file first
      const manifestResponse = await fetch('data/manifest.json');
      if (!manifestResponse.ok) throw new Error('Could not load manifest.json');
      const manifest = await manifestResponse.json();

      // Step 2: Determine which graph file to load
      const urlParams = new URLSearchParams(window.location.search);
      const requestedFile = urlParams.get('graph');
      const isValidFile = manifest.some(item => item.file === requestedFile);
      const graphFileToLoad = (requestedFile && isValidFile) ? requestedFile : manifest[0].file;

      // Step 3: Load the determined graph data
      await this.graphData.load(`data/${graphFileToLoad}`);
      this.renderer.setData(this.graphData);

      // --- Smart Mobile Viewport Adjustment (logic is unchanged) ---
      const IS_MOBILE = window.innerWidth < 768;
      const MOBILE_ZOOM_THRESHOLD = 2.5;
      const MOBILE_TARGET_SCALE = 1.2;

      const viewFromUrl = this.parseViewFromHash();
      if (viewFromUrl) {
        this.renderer.setViewport(viewFromUrl);
      } else if (IS_MOBILE && this.graphData.view) {
        // Your existing mobile adjustment logic
        const savedView = this.graphData.view;
        const assumedDesktopWidth = 1920, assumedDesktopHeight = 1080;
        const savedCenterX = (assumedDesktopWidth / 2 - savedView.offset.x) / savedView.scale;
        const savedCenterY = (assumedDesktopHeight / 2 - savedView.offset.y) / savedView.scale;
        let closestNode = this.graphData.nodes.reduce((closest, node) => {
            const contentHeight = node.sourceType === 'audio' ? NODE_CONTENT_HEIGHT_SQUARE : NODE_CONTENT_HEIGHT_DEFAULT;
            const visualNodeCenterY = node.y + (NODE_HEADER_HEIGHT / 2) - (contentHeight / 2);
            const dist = Math.hypot(savedCenterX - (node.x + NODE_WIDTH / 2), savedCenterY - visualNodeCenterY);
            return (dist < closest.minDistance) ? { node, minDistance: dist } : closest;
        }, { node: null, minDistance: Infinity }).node;
        if (closestNode) {
            const nodeCenterX = closestNode.x + NODE_WIDTH / 2;
            const contentHeight = closestNode.sourceType === 'audio' ? NODE_CONTENT_HEIGHT_SQUARE : NODE_CONTENT_HEIGHT_DEFAULT;
            const nodeCenterY = closestNode.y + (NODE_HEADER_HEIGHT / 2) - (contentHeight / 2);
            const newOffsetX = (this.renderer.canvas.width / 2) - (nodeCenterX * MOBILE_TARGET_SCALE);
            const newOffsetY = (this.renderer.canvas.height / 2) - (nodeCenterY * MOBILE_TARGET_SCALE);
            this.renderer.setViewport({ offset: { x: newOffsetX, y: newOffsetY }, scale: MOBILE_TARGET_SCALE });
        } else { this.renderer.setViewport(this.graphData.view); }
      } else {
        if (this.graphData.view) this.renderer.setViewport(this.graphData.view);
      }

      this.renderer.render(); // Render initial state
      this.setupEventListeners(manifest); // Pass manifest to setup listeners
      this.toggleEditorMode(false);
      this.toggleFollowMode(true); // Enable follow mode by default
      console.log(`Application initialized with graph: ${graphFileToLoad}`);

    } catch (error) {
      console.error('Initialization failed:', error);
      alert('Could not load the application.');
    }
  }

  // NEW METHOD: To populate the selector modal
  populateGraphSelector(manifest) {
    const container = document.getElementById('graphSelectionOptions');
    container.innerHTML = ''; // Clear previous options

    manifest.forEach(item => {
      const optionEl = document.createElement('div');
      optionEl.className = 'graph-option';
      optionEl.dataset.file = item.file; // Store filename in dataset for easy access
      
      optionEl.innerHTML = `
        <h5>${item.title}</h5>
        <p>${item.description}</p>
      `;
      container.appendChild(optionEl);
    });
  }

// REVISED: Smart Follow Mode logic with immediate centering
  toggleFollowMode(forceState = null) {
      this.isFollowing = forceState !== null ? forceState : !this.isFollowing;
      document.getElementById('followModeBtn').classList.toggle('active', this.isFollowing);

      if (this.isFollowing) {
          const { offset, scale } = this.renderer.getViewport();
          this.followScale = scale; // Always capture the current scale

          // To capture the current view, always find the node closest to the center
          // of what the user is currently looking at. This makes the button's
          // behavior predictable and intuitive.
          const center = this.renderer.getViewportCenter();
          const referenceNode = this.graphData.nodes.reduce((closest, node) => {
              const nodeCenter = this.renderer.getNodeVisualCenter(node);
              const dist = Math.hypot(center.x - nodeCenter.x, center.y - nodeCenter.y);
              return (dist < closest.minDistance) ? { node, minDistance: dist } : closest;
          }, { node: null, minDistance: Infinity }).node;
          

          if (referenceNode) {
              // Calculate where the reference node currently is on screen.
              const { x: nodeWorldX, y: nodeWorldY } = this.renderer.getNodeVisualCenter(referenceNode);
              const nodeScreenX = nodeWorldX * scale + offset.x;
              const nodeScreenY = nodeWorldY * scale + offset.y;
              
              // This difference is the "golden standard" offset we want to maintain.
              this.followScreenOffset.x = this.renderer.canvas.width / 2 - nodeScreenX;
              this.followScreenOffset.y = this.renderer.canvas.height / 2 - nodeScreenY;
              
              console.log(`Follow mode (re)activated. Captured new view from '${referenceNode.title}'.`, this.followScreenOffset);
          }

      } else {
          console.log('Follow mode deactivated.');
      }
  }
  toggleEditorMode(isEditor) {
    this.isEditorMode = isEditor;
    document.body.classList.toggle('editor-mode', isEditor);
    document.getElementById('toggleEditorModeBtn').classList.toggle('active', isEditor);
    this.player.stop();
    this.navigation.reset();
    if (!isEditor) {
      this.editorTools.updateSelection([], 'set');
    }
    this.renderer.destroyAllMarkdownOverlays();
  }

  setupEventListeners(manifest = []) { // Now accepts manifest
    // NEW: Logic for the graph selector
    const selectGraphBtn = document.getElementById('selectGraphBtn');
    if (manifest.length > 1) {
      selectGraphBtn.disabled = false;
      this.populateGraphSelector(manifest);

      const graphModal = document.getElementById('graphSelectionModal');
      const closeGraphModalBtn = document.getElementById('closeGraphModalBtn');
      const graphOptionsContainer = document.getElementById('graphSelectionOptions');

      selectGraphBtn.addEventListener('click', () => graphModal.classList.remove('hidden'));
      closeGraphModalBtn.addEventListener('click', () => graphModal.classList.add('hidden'));
      
      graphOptionsContainer.addEventListener('click', (e) => {
        const option = e.target.closest('.graph-option');
        if (option && option.dataset.file) {
          const file = option.dataset.file;
          const currentHash = window.location.hash;
          // Reload the page, preserving the current view hash if it exists
          window.location.href = window.location.pathname + '?graph=' + file + currentHash;
        }
      });
    } 

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
        // NEW: Callback for when the view changes
onViewChanged: () => {
            clearTimeout(this.updateUrlDebounceTimer);
            this.updateUrlDebounceTimer = setTimeout(() => {
                const { offset, scale } = this.renderer.getViewport();
                const center = this.renderer.getViewportCenter();
                const hash = `#x=${center.x.toFixed(2)}&y=${center.y.toFixed(2)}&s=${scale.toFixed(2)}`;
                history.replaceState(null, '', window.location.pathname + window.location.search + hash);
                this._updateFloatingChapterTitle();
            }, 250); // Reduced delay for more responsive feel
        }
    });
    // NEW: Handle browser back/forward buttons for hash navigation
    window.addEventListener('popstate', (e) => {
        const view = this.parseViewFromHash();
        if (view) {
            // Animate to the view from history
            this.renderer.animateToView(view);
        }
    });

    document.getElementById('toggleEditorModeBtn').addEventListener('click', () => this.toggleEditorMode(!this.isEditorMode));
    
    document.getElementById('toggleAllNodesBtn').addEventListener('click', () => this.editorTools.toggleAllNodes());

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

    // TOC Modal Listeners
    const tocModal = document.getElementById('tocModal');
    document.getElementById('tocBtn').addEventListener('click', () => this._generateAndShowTOC());
    document.getElementById('closeTocBtn').addEventListener('click', () => tocModal.classList.add('hidden'));
    document.getElementById('tocContent').addEventListener('click', (e) => {
        const chapterTarget = e.target.closest('.toc-group-title');
        const nodeTarget = e.target.closest('.toc-node-item');

        if (chapterTarget) {
            const groupId = chapterTarget.dataset.groupId;
            const group = this.graphData.getDecorationById(groupId);
            if (group) {
                const padding = 50; // pixels
                const targetScale = Math.min(
                    this.renderer.canvas.width / (group.width + padding),
                    this.renderer.canvas.height / (group.height + padding)
                );
                const targetCenterX = group.x + group.width / 2;
                const targetCenterY = group.y + group.height / 2;
                const targetOffsetX = (this.renderer.canvas.width / 2) - (targetCenterX * targetScale);
                const targetOffsetY = (this.renderer.canvas.height / 2) - (targetCenterY * targetScale);
                
                this.renderer.animateToView({ offset: { x: targetOffsetX, y: targetOffsetY }, scale: targetScale });
            }
       } else if (nodeTarget) {
            const nodeId = nodeTarget.dataset.nodeId;
            if (!this.isFollowing) {
                // When not following, a TOC click should center the view on the node before playing.
                this.renderer.centerOnNode(nodeId);
            }
            // Always start navigation, which handles playback and follow-mode camera adjustments.
            this.navigation.startFromNode(nodeId);
        }
        
        if (chapterTarget || nodeTarget) {
            tocModal.classList.add('hidden');
        }
    });

    document.getElementById('topToolbar').addEventListener('mousedown', () => this.renderer.disableLocalInteraction());
    document.getElementById('player').addEventListener('mousedown', () => this.renderer.disableLocalInteraction());
    }

handleCanvasClick(event) {
    if (this.renderer.wasDragged()) return;
    const coords = this.renderer.getCanvasCoords(event);
    const clicked = this.renderer.getClickableEntityAt(coords.x, coords.y, { isDecorationsLocked: this.editorTools.decorationsLocked });

    if (this.isEditorMode) {
      const clickedEntity = clicked ? clicked.entity : null;
      let mode = 'set';
      if (event.ctrlKey) mode = 'toggle'; // Use 'toggle' for clarity
      else if (event.shiftKey) mode = 'remove';
      
      this.editorTools.updateSelection(clickedEntity ? [clickedEntity] : [], mode);

    } else { // Player mode
      // Only header clicks are active in player mode
      if (clicked && clicked.type === 'node' && clicked.part === 'header') {
        if (this.navigation.currentNode?.id === clicked.entity.id) {
          this.player.togglePlay();
        } else {
          this.navigation.startFromNode(clicked.entity.id);
        }
      }
      // Tapping anywhere else does nothing.
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
const NODE_CONTENT_HEIGHT_DEFAULT = NODE_WIDTH * (9 / 16);
const NODE_CONTENT_HEIGHT_SQUARE = NODE_WIDTH;


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
  
  _getEntityBounds(entity) {
    if (entity.sourceType) { // Is a Node
        if (entity.isCollapsed) {
            return { x: entity.x, y: entity.y, width: NODE_WIDTH, height: NODE_HEADER_HEIGHT };
        }
        const contentHeight = entity.sourceType === 'audio' ? NODE_CONTENT_HEIGHT_SQUARE : NODE_CONTENT_HEIGHT_DEFAULT;
        const totalHeight = NODE_HEADER_HEIGHT + contentHeight;
        return { x: entity.x, y: entity.y - contentHeight, width: NODE_WIDTH, height: totalHeight };
    } else { // Is a Decoration
        return { x: entity.x, y: entity.y, width: entity.width, height: entity.height };
    }
  }

  // REVISED: New intuitive grouping logic
  groupOrUngroupSelection() {
      const groupBtn = document.getElementById('groupSelectionBtn');
      const isUngroupAction = groupBtn.textContent === 'Ungroup';
      const selectedItems = this.selectedEntities.filter(e => e.type || e.sourceType);

      if (isUngroupAction) {
          const container = selectedItems[0];
          if (!container) return;

          const children = [
              ...this.graphData.nodes.filter(n => n.parentId === container.id),
              ...this.graphData.decorations.filter(d => d.parentId === container.id)
          ];
          children.forEach(child => child.parentId = null);

          const index = this.graphData.decorations.findIndex(d => d.id === container.id);
          if (index > -1) this.graphData.decorations.splice(index, 1);
          
          this.updateSelection(children, 'set');
          console.log(`Ungrouped items. Container ${container.id} removed.`);

      } else { // Group action
          if (selectedItems.length < 1) {
              alert('To group, select at least one node or decoration.');
              return;
          }
          let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
          selectedItems.forEach(item => {
              const bounds = this._getEntityBounds(item);
              minX = Math.min(minX, bounds.x);
              minY = Math.min(minY, bounds.y);
              maxX = Math.max(maxX, bounds.x + bounds.width);
              maxY = Math.max(maxY, bounds.y + bounds.height);
          });
          const padding = 20;
          const container = {
              id: `deco-rect-group-${Date.now()}`,
              type: 'rectangle',
              x: minX - padding, y: minY - padding,
              width: (maxX - minX) + padding * 2,
              height: (maxY - minY) + padding * 2,
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
              parentId: null, attachedToNodeId: null,
          };
          this.graphData.decorations.push(container);
          selectedItems.forEach(item => item.parentId = container.id);
          
          this.updateSelection([container], 'set');
          console.log(`Grouped ${selectedItems.length} items into new container ${container.id}`);
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
          if (mode === 'toggle') {
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
      
      const isSingleGroupSelected = this.selectedEntities.length === 1 &&
          this.selectedEntities[0].type === 'rectangle' &&
          (this.graphData.nodes.some(n => n.parentId === this.selectedEntities[0].id) ||
           this.graphData.decorations.some(d => d.parentId === this.selectedEntities[0].id));

      if (isSingleGroupSelected) {
          groupBtn.textContent = 'Ungroup';
          groupBtn.disabled = false;
          groupBtn.title = 'Ungroup all items from this container';
      } else {
          groupBtn.textContent = 'Group';
          groupBtn.disabled = this.selectedEntities.length === 0;
          groupBtn.title = 'Group selected items into a new container';
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
        html = `<label for="nodeTitle">Title:</label><input type="text" id="nodeTitle" value="${entity.title||''}"><label>Source Type:</label><div class="toggle-switch"><button id="type-audio" class="${entity.sourceType==='audio'?'active':''}">Audio File</button><button id="type-iframe" class="${entity.sourceType==='iframe'?'active':''}">YouTube</button></div><div id="audio-fields" class="${entity.sourceType==='audio'?'':'hidden'}"><label for="audioUrl">Audio URL:</label><input type="text" id="audioUrl" value="${entity.audioUrl||''}" placeholder="https://.../track.mp3"><label for="coverUrl">Cover URL (Data only):</label><input type="text" id="coverUrl" value="${entity.coverUrl||''}" placeholder="https://.../cover.jpg"></div><div id="iframe-fields" class="${entity.sourceType==='iframe'?'':'hidden'}"><label for="iframeUrl">YouTube URL or Video ID:</label><input type="text" id="iframeUrlInput" value="${entity.iframeUrl||''}" placeholder="dQw4w9WgXcQ"></div><hr><label for="tocOrder">TOC Order (Node):</label><input type="text" id="tocOrder" value="${entity.tocOrder ?? ''}" placeholder="1.1, 1.2, 2.1...">`;
    } else if (entity.source) { // Edge
        title.textContent = 'Edge Properties';
        html = `<label for="edgeLabel">Label:</label><input type="text" id="edgeLabel" value="${entity.label||''}"><label for="edgeColor">Color:</label><input type="color" id="edgeColor" value="${entity.color||'#888888'}"><label for="edgeWidth">Line Width:</label><input type="number" id="edgeWidth" value="${entity.lineWidth||2}" min="1" max="10">`;
    } else if (entity.type === 'rectangle') {
        const isTransparent = entity.backgroundColor === 'transparent';
        title.textContent = 'Rectangle / Group Properties';
        html = `<label for="rectColor">Background Color:</label><input type="color" id="rectColor" value="${isTransparent ? '#2d2d2d' : entity.backgroundColor}"><button id="rectTransparentBtn" class="button-like" style="width:100%; margin-top: 5px; background-color: #555;">Set Transparent</button><label for="rectWidth">Width:</label><input type="number" id="rectWidth" value="${entity.width}" min="10"><label for="rectHeight">Height:</label><input type="number" id="rectHeight" value="${entity.height}" min="10"><hr><label for="groupTitle">Chapter Title:</label><input type="text" id="groupTitle" value="${entity.title || ''}" placeholder="e.g., Chapter 1"><label for="titleFontSize">Title Font Size:</label><input type="number" id="titleFontSize" value="${entity.titleFontSize || 14}" min="1"><label>Title Alignment:</label><div class="toggle-switch" id="titleAlignmentGroup"><button data-align="left" class="${entity.titleAlignment === 'left' ? 'active' : ''}">Left</button><button data-align="center" class="${entity.titleAlignment === 'center' ? 'active' : ''}">Center</button><button data-align="right" class="${entity.titleAlignment === 'right' ? 'active' : ''}">Right</button></div><label for="tocOrder">TOC Order (Group):</label><input type="text" id="tocOrder" value="${entity.tocOrder ?? ''}" placeholder="1, 2, 3...">`;
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
          });
          document.getElementById('titleAlignmentGroup').addEventListener('click', (e) => {
              const target = e.target.closest('button');
              if (!target) return;
              const newAlign = target.dataset.align;
              entity.titleAlignment = newAlign;
              const buttons = document.querySelectorAll('#titleAlignmentGroup button');
              buttons.forEach(btn => btn.classList.toggle('active', btn.dataset.align === newAlign));
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
        const tocOrderVal = document.getElementById('tocOrder').value;
        entity.tocOrder = tocOrderVal === '' ? undefined : tocOrderVal;
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
        entity.title = document.getElementById('groupTitle').value;
        entity.titleFontSize = parseInt(document.getElementById('titleFontSize').value, 10);
        const tocOrderVal = document.getElementById('tocOrder').value;
        entity.tocOrder = tocOrderVal === '' ? undefined : tocOrderVal;
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
            parentId: item.parentId || null,
            x: item.position?.x || 0,
            y: item.position?.y || 0,
            isCollapsed: item.isCollapsed === true,
            sourceType: item.sourceType || 'audio',
            audioUrl: item.audioUrl || null,
            coverUrl: item.coverUrl || null,
            iframeUrl: item.sourceType === 'iframe' ? this.parseYoutubeUrl(item.iframeUrl) : null,
            tocOrder: item.tocOrder,
          });
          break;
        case 'Path':
          this.edges.push({
            // FIX: Assign a unique ID on load, which is crucial for selection and deletion.
            id: `edge-${item.source}-${item.target}-${Math.random().toString(36).substr(2, 9)}`,
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
            // REVISED: Grouping and attachment properties
            parentId: item.parentId || null,
            attachedToNodeId: item.attachedToNodeId || null,
            attachOffsetX: item.attachOffsetX,
            attachOffsetY: item.attachOffsetY,
            title: item.title || '',
            titleFontSize: item.titleFontSize || 14,
            titleAlignment: item.titleAlignment || 'center', // 'left', 'center', 'right'
            tocOrder: item.tocOrder, // Can be undefined // Can be undefined
          });
          break;
        case 'TextAnnotation': // Legacy support
        case 'MarkdownAnnotation':
          this.decorations.push({
            id: item['@id'],
            type: 'markdown',
            x: item.position?.x || 0,
            y: item.position?.y || 0,
            width: item.size?.width || 300,
            height: item.size?.height || 200,
            textContent: item.textContent || '',
            fontSize: item.fontSize || 14,
            backgroundColor: item.backgroundColor || 'rgba(45, 45, 45, 0.85)',
            // REVISED: Grouping properties
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
        ...(n.parentId && { parentId: n.parentId }),
        isCollapsed: n.isCollapsed,
        sourceType: n.sourceType,
        audioUrl: n.audioUrl,
        coverUrl: n.coverUrl,
        iframeUrl: n.iframeUrl,
        ...(typeof n.tocOrder === 'number' && { tocOrder: n.tocOrder }),
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
        };
        if (d.type === 'rectangle') {
          return {
            ...common,
            '@type': 'RectangleAnnotation',
            size: { width: d.width, height: d.height },
            backgroundColor: d.backgroundColor,
            // REVISED: Save attachment properties
            ...(d.attachedToNodeId && { attachedToNodeId: d.attachedToNodeId }),
            ...(d.attachOffsetX !== undefined && { attachOffsetX: d.attachOffsetX }),
            ...(d.attachOffsetY !== undefined && { attachOffsetY: d.attachOffsetY }),
            ...(d.title && { title: d.title }),
            ...(d.titleFontSize && d.titleFontSize !== 14 && { titleFontSize: d.titleFontSize }),
            ...(d.titleAlignment && d.titleAlignment !== 'center' && { titleAlignment: d.titleAlignment }),
            ...(typeof d.tocOrder === 'number' && { tocOrder: d.tocOrder }),
          };
        }
        if (d.type === 'markdown') {
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
      // REVISED: Added "shorts\/" to the regex to support YouTube Shorts URLs
      const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
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
    this.renderer.disableLocalInteraction?.(); // Reset mobile interaction mode

    const node = this.graphData.getNodeById(nodeId);
    if (!node) return;
    
    const prevNodeId = this.currentNode?.id;
    this.currentNode = node;
    this.history = [nodeId];
    
    this.renderer.highlight(nodeId, prevNodeId);

    // THE FIX IS HERE.
    if (this.app.isFollowing) {
        // The offset is now correctly set in app.js.
        // We just need to use it.
        this.renderer.centerOnNode(nodeId, this.app.followScale, this.app.followScreenOffset);
    }
    
    // Play the node after initiating the camera movement.
    this.player.play(node);
    this.app._updateFloatingChapterTitle(); // Update title on new node start
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

      // On mobile, if the screen is off (document hidden) and it's an audio node,
      // showing a choice modal will fail. We auto-select randomly to ensure playback continues.
      const isMobileInBackground = (window.innerWidth < 768 && document.hidden);
      if (isMobileInBackground && this.currentNode.sourceType === 'audio') {
        console.log("Mobile background: auto-selecting next audio node randomly.");
        nextEdge = options[Math.floor(Math.random() * options.length)];
      } else {
        nextEdge = await this.promptForChoice(options);
        if (!nextEdge) return;
      }
    }
    this.transitionToEdge(nextEdge);
  }
  
goBack() {
    if (!this.currentNode) return;
    this.renderer.disableLocalInteraction?.(); // Reset mobile interaction mode

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
        this.app._updateFloatingChapterTitle(); // Update title on back navigation
    }
  }

  transitionToEdge(edge) {
    this.renderer.disableLocalInteraction?.(); // Reset mobile interaction mode
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
    this.app._updateFloatingChapterTitle(); // Update title on advancing
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

// Media Session constants for lock screen metadata
const MEDIA_SESSION_ALBUM = 'Abyss Void: the Archive';
const MEDIA_SESSION_ARTIST = 'Nftxv';

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
    this.setupMediaSession();
  }

  setNavigation(navigation) { this.navigation = navigation; }

  async play(node) {
    if (!node) return;
    const progressContainer = document.getElementById('progressContainer');
    const wasPlayingNode = this.currentNode;
    
    // Stop previous playback if it's a different node
    if (wasPlayingNode && wasPlayingNode.id !== node.id) {
        this.audio.pause();
        if (this.currentYtPlayer) {
          this.currentYtPlayer.pauseVideo();
        }
    }
    
    this.currentNode = node;
    this.updateMediaSession(this.currentNode); // Update metadata for the new node
    this.updateMediaSessionActions(this.currentNode);

    document.getElementById('songTitle').textContent = node.title;
    const playBtn = document.getElementById('playBtn');
    const progress = document.getElementById('progress');

    if (node.sourceType === 'audio') {
        progressContainer.style.visibility = 'visible'; 
        if (!node.audioUrl) {
          console.warn(`Audio URL is missing for "${node.title}".`);
          this.stop();
          document.getElementById('songTitle').textContent = node.title;
          return;
        }
        playBtn.textContent = '⏸';
        playBtn.disabled = false;
        progress.disabled = false;
        // If the src is the same, just play. Otherwise, set new src.
        if (this.audio.src !== node.audioUrl) {
            this.audio.src = node.audioUrl;
        }
        this.audio.play().catch(e => console.error("Playback error:", e));

    } else if (node.sourceType === 'iframe') {
        progressContainer.style.visibility = 'hidden';
        playBtn.disabled = false;
        playBtn.textContent = '⏸';
        progress.value = 0;
        progress.disabled = true;
        
        // This logic handles creating/reusing the YT player
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
    document.getElementById('progressContainer').style.visibility = 'visible';
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

  setupMediaSession() {
    if ('mediaSession' in navigator) {
      console.log('Media Session API is available.');
      
      navigator.mediaSession.setActionHandler('play', () => this.togglePlay());
      navigator.mediaSession.setActionHandler('pause', () => this.togglePlay());
      
      // We can use the same navigation functions for lock screen controls
      navigator.mediaSession.setActionHandler('nexttrack', () => this.navigation.advance());
      navigator.mediaSession.setActionHandler('previoustrack', () => this.navigation.goBack());

      // Explicitly disable seeking to prioritize track navigation
      navigator.mediaSession.setActionHandler('seekbackward', null);
      navigator.mediaSession.setActionHandler('seekforward', null);

    } else {
      console.warn('Media Session API is not available.');
    }
  }

  updateMediaSession(node) {
    if ('mediaSession' in navigator) {
      const coverUrl = node.coverUrl || 'icons/default-cover.png'; // Fallback to a default icon
      
      let imageType = 'image/png'; // Default
      if (coverUrl.endsWith('.jpg') || coverUrl.endsWith('.jpeg')) {
        imageType = 'image/jpeg';
      }

      navigator.mediaSession.metadata = new MediaMetadata({
        title: node.title,
        artist: MEDIA_SESSION_ARTIST,
        album: MEDIA_SESSION_ALBUM,
        artwork: [
          // Provide different sizes for different devices/contexts
          { src: coverUrl, sizes: '96x96',   type: imageType },
          { src: coverUrl, sizes: '128x128', type: imageType },
          { src: coverUrl, sizes: '192x192', type: imageType },
          { src: coverUrl, sizes: '256x256', type: imageType },
          { src: coverUrl, sizes: '384x384', type: imageType },
          { src: coverUrl, sizes: '512x512', type: imageType },
        ]
      });
    }
  }

updateMediaSessionActions(node) {
    if (!('mediaSession' in navigator) || !this.navigation) return;

    // Check for next track availability
    const nextEdges = this.graphData.getEdgesFromNode(node.id);
    if (nextEdges.length > 0) {
      navigator.mediaSession.setActionHandler('nexttrack', () => this.navigation.advance());
    } else {
      navigator.mediaSession.setActionHandler('nexttrack', null); // Disable button
    }

    // Check for previous track availability
    // THE FIX IS HERE: Use this.navigation.history instead of this.history
    const canGoBack = this.navigation.history.length > 1 || this.graphData.edges.some(e => e.target === node.id);
    if (canGoBack) {
      navigator.mediaSession.setActionHandler('previoustrack', () => this.navigation.goBack());
    } else {
      navigator.mediaSession.setActionHandler('previoustrack', null); // Disable button
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
const NODE_CONTENT_HEIGHT_DEFAULT = NODE_WIDTH * (9/16); // For iframes and audio without covers
const NODE_CONTENT_HEIGHT_SQUARE = NODE_WIDTH;          // For audio with covers (1:1 aspect ratio)
const DECORATION_LOD_THRESHOLD = 2.0;

export default class Renderer {
  constructor(canvasId, iframeContainer, markdownContainer) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.iframeContainer = iframeContainer;
    this.markdownContainer = markdownContainer;
    
    this.graphData = null; 
    this.markdownOverlays = new Map();
    this.imageCache = new Map();

    this.offset = { x: 0, y: 0 };
    this.scale = 1.0;
    this.dragStart = { x: 0, y: 0 };
    this.dragged = false;
    this.dragging = false;
    this.draggingEntity = null;
    this.isDraggingSelection = false;

    // Mobile & Touch properties
    this.longPressTimer = null;
    this.activeInteractionOverlay = null;
    
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

    const MAP_VIEW_THRESHOLD = 0.4;
    const isMapView = this.scale < MAP_VIEW_THRESHOLD;

    // Always draw chapter containers
    this.graphData.decorations.forEach(deco => {
        if (deco.type === 'rectangle') this.drawRectangle(deco);
    });

    if (isMapView) {
        // MAP VIEW: Only show chapter titles
        this._drawGroupTitles();
    } else {
        // DETAIL VIEW: Render the full graph
        const isLodActive = this.scale < DECORATION_LOD_THRESHOLD;
        
        // Draw non-rectangle decorations (like text blocks)
        this.graphData.decorations.forEach(deco => {
            if (deco.type !== 'rectangle') this.drawDecoration(deco, isLodActive);
        });

        this.graphData.nodes.forEach(node => this._drawNodeContent(node));
        this.graphData.edges.forEach(edge => this.drawEdge(edge));
        this.graphData.nodes.forEach(node => this._drawNodeHeader(node));

        if (this.isCreatingEdge) this.drawTemporaryEdge();
        if (this.isMarqueeSelecting) this.drawMarquee();
        this._drawSnapGuides();
        
        // Draw titles last to ensure they are on top of everything.
        this._drawGroupTitles();
    }
    
    this.ctx.restore();
    
    // HTML Overlays
    const isLodActive = this.scale < DECORATION_LOD_THRESHOLD;
    this.updateMarkdownOverlays(isLodActive || isMapView); // Hide overlays in map view too
    
    if (isMapView) {
        this.graphData.nodes.forEach(node => { // Force-hide all iframes in map view
            const wrapper = document.getElementById(`iframe-wrapper-${node.id}`);
            if(wrapper) wrapper.style.display = 'none';
        });
    } else {
        this.updateIframes();
    }

  requestAnimationFrame(this.renderLoop);
    }

    _drawGroupTitles() {
        const ctx = this.ctx;
        const padding = 15 / this.scale; // Padding for left/right alignment

        this.graphData.decorations.forEach(deco => {
            if (deco.type === 'rectangle' && deco.title) {
                if (deco.parentId) return;

                ctx.font = `${(deco.titleFontSize || 14) / this.scale}px "Segoe UI"`;
                ctx.fillStyle = 'rgba(240, 240, 240, 0.9)';
                ctx.textBaseline = 'bottom';
                
                let x;
                const y = deco.y - (10 / this.scale);
                const align = deco.titleAlignment || 'center';

                if (align === 'left') {
                    ctx.textAlign = 'left';
                    x = deco.x + padding;
                } else if (align === 'right') {
                    ctx.textAlign = 'right';
                    x = deco.x + deco.width - padding;
                } else { // center
                    ctx.textAlign = 'center';
                    x = deco.x + deco.width / 2;
                }
                
                ctx.fillText(deco.title, x, y);
            }
        });
    } 
  drawDecoration(deco, isLodActive) {
    if (isLodActive && deco.backgroundColor !== 'transparent') {
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
    if (rect.backgroundColor !== 'transparent') {
        ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
    }
    
    if (rect.selected) {
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = 2 / this.scale;
        ctx.setLineDash([6 / this.scale, 4 / this.scale]);
        ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
    }
    
    // Always draw chapter titles if they exist, regardless of zoom
    ctx.restore();
  }
  
drawEdge(edge) {
      const src = this.graphData.getNodeById(edge.source);
      const trg = this.graphData.getNodeById(edge.target);
      if (!src || !trg) return;
      
      const controlPoints = edge.controlPoints || [];
      // Use header centers for stable angle calculation
      const srcHeaderCenter = { x: src.x + NODE_WIDTH / 2, y: src.y + NODE_HEADER_HEIGHT / 2 };
      const trgHeaderCenter = { x: trg.x + NODE_WIDTH / 2, y: trg.y + NODE_HEADER_HEIGHT / 2 };
      
      const targetPointForAngle = controlPoints.length > 0 ? controlPoints[0] : trgHeaderCenter;
      const sourcePointForAngle = controlPoints.length > 0 ? controlPoints.at(-1) : srcHeaderCenter;

      const startPoint = this._getIntersectionWithNodeRect(src, targetPointForAngle);
      const endPoint = this._getIntersectionWithNodeRect(trg, sourcePointForAngle);      
      
      const pathPoints = [startPoint, ...controlPoints, endPoint];
      const ctx = this.ctx;
      ctx.save();
      
      let color = edge.color || '#888888';
      if (edge.selected) color = '#28d1e7ff';
      if (edge.highlighted) color = '#FFD700';
      
      const baseWidth = edge.lineWidth || 2;
      const lineWidth = (edge.selected || edge.highlighted) ? baseWidth + 1 : baseWidth;

      // Make line width scale down slightly when zooming out to feel more proportional.
      // It ensures the line is at least 0.75px wide on screen.
      const screenLineWidth = Math.max(0.75, lineWidth * Math.min(1.0, Math.pow(this.scale, 0.6)));
      ctx.lineWidth = screenLineWidth / this.scale;

      // Make arrow size and pullback gap proportional to the calculated line width.
      // It's larger when zoomed in and doesn't shrink to nothing when zoomed out.
      const arrowSizeOnScreen = Math.max(15, Math.min(20, screenLineWidth * 3.0));
      // Adjust world size to counteract scale, keeping perceived size more constant.
      const arrowSizeInWorld = arrowSizeOnScreen / Math.sqrt(this.scale);

      const pForArrow = pathPoints.at(-1); // The point ON the border
      const pBeforeArrow = pathPoints.length > 1 ? pathPoints.at(-2) : startPoint;
      const angle = Math.atan2(pForArrow.y - pBeforeArrow.y, pForArrow.x - pBeforeArrow.x);
      
      const offset = arrowSizeInWorld;
      const adjustedEndPoint = {
          x: pForArrow.x - offset * Math.cos(angle),
          y: pForArrow.y - offset * Math.sin(angle)
      };

      ctx.beginPath();
      ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
      for (let i = 1; i < pathPoints.length - 1; i++) {
          ctx.lineTo(pathPoints[i].x, pathPoints[i].y);
      }
      if (Math.hypot(adjustedEndPoint.x - pBeforeArrow.x, adjustedEndPoint.y - pBeforeArrow.y) > 1) {
          ctx.lineTo(adjustedEndPoint.x, adjustedEndPoint.y);
      }
      
      ctx.strokeStyle = color; 
      ctx.stroke();
      
      this._drawArrow(pForArrow.x, pForArrow.y, angle, color, arrowSizeInWorld);

      // ... rest of the function ...
      if(this.scale > 0.5) {
          controlPoints.forEach(point => {
              ctx.beginPath();
              ctx.arc(point.x, point.y, 5 / this.scale, 0, 2 * Math.PI);
              ctx.fillStyle = edge.selected ? '#e74c3c' : color;
              ctx.fill();
          });
      }
      if (edge.label && this.scale > 0.3) {
        const midIndex = Math.floor((pathPoints.length - 2) / 2);
        const p1 = pathPoints[midIndex], p2 = pathPoints[midIndex + 1];
        ctx.font = `${12}px "Segoe UI"`;
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.save();
        ctx.translate((p1.x + p2.x)/2, (p1.y + p2.y)/2);
        const rotationAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        if (rotationAngle > Math.PI / 2 || rotationAngle < -Math.PI / 2) ctx.rotate(rotationAngle + Math.PI); else ctx.rotate(rotationAngle);
        ctx.fillText(edge.label, 0, -8 / this.scale);
        ctx.restore();
      }
      ctx.restore();
  }

  _drawNodeContent(node) {
    if (node.isCollapsed) return;

    const ctx = this.ctx;
    const containerX = node.x;
    const containerW = NODE_WIDTH;
    let containerH, containerY;

    // All audio nodes get a square content area for the cover
    if (node.sourceType === 'audio') {
      containerH = NODE_CONTENT_HEIGHT_SQUARE;
    } else {
      containerH = NODE_CONTENT_HEIGHT_DEFAULT;
    }
    containerY = node.y - containerH;

    // Draw content for iframe
    if (node.sourceType === 'iframe') {
      ctx.fillStyle = '#000000';
      ctx.fillRect(containerX, containerY, containerW, containerH);
      return;
    }

    // Draw content for audio, using default cover as a fallback
    if (node.sourceType === 'audio') {
      const isDefaultCover = !node.coverUrl;
      const imageUrl = node.coverUrl || 'icons/default-cover.png';
      const cachedImage = this.imageCache.get(imageUrl);

      if (cachedImage instanceof Image) {
        ctx.drawImage(cachedImage, containerX, containerY, containerW, containerH);
      } else {
        ctx.fillStyle = '#1e1e1e'; // Placeholder color
        ctx.fillRect(containerX, containerY, containerW, containerH);
        if (!cachedImage) {
          this.imageCache.set(imageUrl, 'loading');
          const img = new Image();
          // Only set crossOrigin for remote images, not for the local fallback.
          if (!isDefaultCover) {
            img.crossOrigin = "Anonymous";
          }
          img.onload = () => this.imageCache.set(imageUrl, img);
          img.onerror = () => {
            console.error(`Renderer: Failed to load cover image at ${imageUrl}`);
            this.imageCache.set(imageUrl, 'failed');
          };
          img.src = imageUrl;
        }
      }
    } else {
      // Fallback for other potential node types
      ctx.fillStyle = '#1e1e1e';
      ctx.fillRect(containerX, containerY, containerW, containerH);
    }
  }

_drawNodeHeader(node) {
    const ctx = this.ctx;
    ctx.save();
    
    // Draw header background
    ctx.fillStyle = '#2d2d2d';
    const cornerRadius = 8;
    ctx.beginPath();
    ctx.roundRect(node.x, node.y, NODE_WIDTH, NODE_HEADER_HEIGHT, [0, 0, cornerRadius, cornerRadius]);
    ctx.fill();
    
    // Border for selection or default state
    ctx.strokeStyle = node.selected ? '#16e049ff' : '#424242';
    ctx.lineWidth = node.selected ? 2 : 1;
    ctx.stroke();

    // Draw title text
    ctx.fillStyle = '#e0e0e0';
    ctx.font = '14px "Segoe UI"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const fittedTitle = this._fitText(node.title, NODE_WIDTH - 20); 
    const titleX = node.x + NODE_WIDTH / 2;
    const titleY = node.y + NODE_HEADER_HEIGHT / 2;
    ctx.fillText(fittedTitle, titleX, titleY);

    // Draw player mode highlight indicator with custom blink animation
    if (node.highlighted) {
        
        // --- Animation Configuration (Easy to tweak) ---
        const ON_DURATION = 2400;      // ms -- How long it stays fully bright
        const FADE_OUT_DURATION = 300; // ms -- How long it takes to fade out
        const OFF_DURATION = 600;      // ms -- How long it stays dim
        const FADE_IN_DURATION = 300;  // ms -- How long it takes to fade in

        const maxOpacity = 1.0;
        const minOpacity = 0.0;
        
        // --- Animation Logic ---
        const TOTAL_CYCLE_DURATION = ON_DURATION + FADE_OUT_DURATION + OFF_DURATION + FADE_IN_DURATION;
        const timeInCycle = Date.now() % TOTAL_CYCLE_DURATION;

        let opacity = maxOpacity;

        // Phase 1: ON
        if (timeInCycle < ON_DURATION) {
            opacity = maxOpacity;
        }
        // Phase 2: Fading Out
        else if (timeInCycle < ON_DURATION + FADE_OUT_DURATION) {
            const timeInFade = timeInCycle - ON_DURATION;
            const progress = timeInFade / FADE_OUT_DURATION;
            opacity = maxOpacity - progress * (maxOpacity - minOpacity);
        }
        // Phase 3: OFF
        else if (timeInCycle < ON_DURATION + FADE_OUT_DURATION + OFF_DURATION) {
            opacity = minOpacity;
        }
        // Phase 4: Fading In
        else {
            const timeInFade = timeInCycle - (ON_DURATION + FADE_OUT_DURATION + OFF_DURATION);
            const progress = timeInFade / FADE_IN_DURATION;
            opacity = minOpacity + progress * (maxOpacity - minOpacity);
        }
        
        // --- Drawing Logic ---
        const radius = 5;
        const padding = 8;
        const circleX = node.x + padding;
        const circleY = node.y + NODE_HEADER_HEIGHT - padding;

        ctx.save();
        ctx.globalAlpha = opacity;
        
        ctx.fillStyle = '#21da58ff'; 
        ctx.beginPath();
        ctx.arc(circleX, circleY, radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }

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

        wrapper.classList.toggle('selected', !!node.selected);      // For Editor Mode
        wrapper.classList.toggle('highlighted', !!node.highlighted); // For Player Mode

        const isInView = this._isNodeInView(node);
        const shouldBeVisible = !node.isCollapsed && isInView;
        if (wrapper.style.display !== (shouldBeVisible ? 'block' : 'none')) {
            wrapper.style.display = shouldBeVisible ? 'block' : 'none';
        }
        if (shouldBeVisible) {
            const screenX = (node.x) * this.scale + this.offset.x;
            const screenY = (node.y - NODE_CONTENT_HEIGHT_DEFAULT) * this.scale + this.offset.y;
            const screenWidth = NODE_WIDTH * this.scale;
            const screenHeight = NODE_CONTENT_HEIGHT_DEFAULT * this.scale;
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

              // REVISED: Font size is now static in CSS, not scaled, to scale with its container.
              overlay.style.fontSize = `${(deco.fontSize || 14) * Math.sqrt(this.scale)}px`;
              //overlay.style.fontSize = `${(deco.fontSize || 14) * this.scale}px`;
              
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
    if (node.isCollapsed) {
      return { x: node.x, y: node.y, width: NODE_WIDTH, height: NODE_HEADER_HEIGHT };
    }

    let contentHeight;
    // Use square height for all audio nodes (with or without covers)
    if (node.sourceType === 'audio') {
      contentHeight = NODE_CONTENT_HEIGHT_SQUARE;
    } else {
      contentHeight = NODE_CONTENT_HEIGHT_DEFAULT;
    }
    
    const totalHeight = NODE_HEADER_HEIGHT + contentHeight;
    return { x: node.x, y: node.y - contentHeight, width: NODE_WIDTH, height: totalHeight };
  }

    getNodeVisualCenter(node) {
    const contentHeight = node.sourceType === 'audio' ? NODE_CONTENT_HEIGHT_SQUARE : NODE_CONTENT_HEIGHT_DEFAULT;
    const centerX = node.x + NODE_WIDTH / 2;
    const centerY = node.y - (contentHeight / 2) + (NODE_HEADER_HEIGHT / 2);
    return { x: centerX, y: centerY };
  }

  _getDecorationBounds(deco) {
      return { x: deco.x, y: deco.y, width: deco.width, height: deco.height };
  }

  getClickableEntityAt(x, y, { isDecorationsLocked } = {}) {
    const MAP_VIEW_THRESHOLD = 0.4;
    if (this.scale < MAP_VIEW_THRESHOLD) return null; // Disable clicks in map view

    // Nodes are on top
    for (let i = this.graphData.nodes.length - 1; i >= 0; i--) {
        const node = this.graphData.nodes[i];
        const rect = this._getNodeVisualRect(node);
        if (x > rect.x && x < rect.x + rect.width && y > rect.y && y < rect.y + rect.height) {
            const headerRect = { x: node.x, y: node.y, width: NODE_WIDTH, height: NODE_HEADER_HEIGHT };
            const isHeaderClick = (x > headerRect.x && x < headerRect.x + headerRect.width && y > headerRect.y && y < headerRect.y + headerRect.height);
            return { type: 'node', entity: node, part: isHeaderClick ? 'header' : 'body' };
        }
    }
      
    const edge = this.getEdgeAt(x, y);
    if (edge) return { type: 'edge', entity: edge };

    if (!isDecorationsLocked) {
        if (this.scale < DECORATION_LOD_THRESHOLD) {
            const tolerance = 7 / this.scale;
            for (let i = this.graphData.decorations.length - 1; i >= 0; i--) {
                 const deco = this.graphData.decorations[i];
                 // if (deco.backgroundColor === 'transparent') continue; // REMOVED to allow moving transparent groups in LOD
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
                    if (deco.backgroundColor === 'transparent' && !deco.selected) continue;
                    return { type: 'decoration', entity: deco };
                }
            }
        }
    }
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
    const rect = this._getNodeVisualRect(node);
    const rayOrigin = { x: node.x + NODE_WIDTH / 2, y: node.y + NODE_HEADER_HEIGHT / 2 };
    const dir = { x: externalPoint.x - rayOrigin.x, y: externalPoint.y - rayOrigin.y };

    if (Math.abs(dir.x) < 1e-6 && Math.abs(dir.y) < 1e-6) {
      return rayOrigin; // Points are identical.
    }

    let t = Infinity;

    // --- Vertical Sides (Left and Right) ---
    if (dir.x !== 0) {
      const tLeft = (rect.x - rayOrigin.x) / dir.x;
      if (tLeft >= 0) {
        const y = rayOrigin.y + tLeft * dir.y;
        if (y >= rect.y && y <= rect.y + rect.height) {
          t = Math.min(t, tLeft);
        }
      }
      
      const tRight = (rect.x + rect.width - rayOrigin.x) / dir.x;
      if (tRight >= 0) {
        const y = rayOrigin.y + tRight * dir.y;
        if (y >= rect.y && y <= rect.y + rect.height) {
          t = Math.min(t, tRight);
        }
      }
    }

    // --- Horizontal Sides (Top and Bottom) ---
    if (dir.y !== 0) {
      const tTop = (rect.y - rayOrigin.y) / dir.y;
      if (tTop >= 0) {
        // CORRECTED: Was dir.y, should be dir.x
        const x = rayOrigin.x + tTop * dir.x;
        if (x >= rect.x && x <= rect.x + rect.width) {
          t = Math.min(t, tTop);
        }
      }
      
      const tBottom = (rect.y + rect.height - rayOrigin.y) / dir.y;
      if (tBottom >= 0) {
        // CORRECTED: Was dir.y, should be dir.x
        const x = rayOrigin.x + tBottom * dir.x;
        if (x >= rect.x && x <= rect.x + rect.width) {
          t = Math.min(t, tBottom);
        }
      }
    }

    // Clamp 't' to not go past the external point (e.g. control points)
    t = Math.min(t, 1.0);

    if (Number.isFinite(t)) {
      return { x: rayOrigin.x + t * dir.x, y: rayOrigin.y + t * dir.y };
    }

    // Fallback if target is inside the node
    return externalPoint;
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

    // The scale to animate to.
    const finalScale = targetScale !== null ? targetScale : this.scale;
    
    // The user's desired offset of the node from the screen center.
    const finalScreenOffset = screenOffset || { x: 0, y: 0 };
    
    // Get the node's true visual center based on its type.
    const { x: nodeCenterX, y: nodeCenterY } = this.getNodeVisualCenter(node);
    
    // THIS IS THE RESTORED LOGIC: Calculate the final canvas offset.
    // It's the screen center, minus the node's scaled position, adjusted by the user's desired screen offset.
    const targetOffsetX = (this.canvas.width / 2) - (nodeCenterX * finalScale) - finalScreenOffset.x;
    const targetOffsetY = (this.canvas.height / 2) - (nodeCenterY * finalScale) - finalScreenOffset.y;
    
    // Delegate the animation to our generic animator utility.
    this.animateToView({ offset: { x: targetOffsetX, y: targetOffsetY }, scale: finalScale });
  }

    // NEW: Generic method to animate the viewport to a target state
  animateToView(targetView) {
      if (!targetView || !targetView.offset || !targetView.scale) return;
      
      this.isAnimatingPan = true;
      const { offset: targetOffset, scale: finalScale } = targetView;

      const startOffsetX = this.offset.x, startOffsetY = this.offset.y;
      const startScale = this.scale;

      const diffX = targetOffset.x - startOffsetX, diffY = targetOffset.y - startOffsetY;
      const diffScale = finalScale - startScale;

      const duration = 600; // A bit slower for a smoother feel
      let startTime = null;

      const animate = (timestamp) => {
          if (!startTime) startTime = timestamp;
          const elapsed = timestamp - startTime;
          if (elapsed >= duration || !this.isAnimatingPan) {
              this.offset = targetOffset;
              this.scale = finalScale;
              this.isAnimatingPan = false;
              return;
          }
          let progress = elapsed / duration;
          progress = 0.5 - 0.5 * Math.cos(progress * Math.PI); // Ease in-out

          this.offset.x = startOffsetX + diffX * progress;
          this.offset.y = startOffsetY + diffY * progress;
          this.scale = startScale + diffScale * progress;

          if (this.onViewChanged) {
              this.onViewChanged();
          }

          requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
  }  
  
  disableLocalInteraction() {
    if (this.activeInteractionOverlay) {
        this.activeInteractionOverlay.classList.remove('interaction-enabled');
        this.activeInteractionOverlay = null;
    }
  }

  findOverlayAtScreenPoint(clientX, clientY) {
    const overlays = [
        ...Array.from(this.markdownOverlays.values()),
        ...Array.from(this.iframeContainer.children)
    ];

    for (const overlay of overlays.reverse()) { // Check top-most elements first
        if (overlay.style.display === 'none') continue;
        const rect = overlay.getBoundingClientRect();
        if (clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom) {
            return overlay;
        }
    }
    return null;
  }

  setupCanvasInteraction(callbacks) {
    const { getIsEditorMode, getIsDecorationsLocked, onClick, onDblClick, onEdgeCreated, onMarqueeSelect, getSelection, onViewChanged } = callbacks;
    this.onViewChanged = onViewChanged; // Store the callback
    window.addEventListener('resize', () => this.resizeCanvas());
    this.canvas.addEventListener('contextmenu', e => e.preventDefault());
    
    // --- Mouse Handlers (for Desktop) ---
    const handleMouseMove = (e) => {
        if (this.longPressTimer) { clearTimeout(this.longPressTimer); this.longPressTimer = null; }
        const oldMousePos = this.mousePos;
        this.mousePos = this.getCanvasCoords(e);
        if (e.buttons === 0) { handleMouseUp(e); return; }
        this.dragged = true;
        if (this.dragging) { this.offset.x = e.clientX - this.dragStart.x; this.offset.y = e.clientY - this.dragStart.y; onViewChanged(); }
        else if (this.draggingEntity) {
            const dx = this.mousePos.x - oldMousePos.x; const dy = this.mousePos.y - oldMousePos.y;
            if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) return;
            const selection = this.isDraggingSelection ? getSelection() : [this.draggingEntity];
            const movedItems = new Set();
            const move = (entity) => {
                if (!entity || movedItems.has(entity.id) || (getIsDecorationsLocked() && entity.type)) return;
                movedItems.add(entity.id); entity.x += dx; entity.y += dy;
                if (entity.type === 'rectangle' || entity.sourceType) {
                this.graphData.nodes.forEach(child => { if (child.parentId === entity.id) move(child); });
                this.graphData.decorations.forEach(child => { if (child.parentId === entity.id) move(child); });
                if (entity.sourceType) { this.graphData.decorations.forEach(c => { if(c.attachedToNodeId === entity.id && !c.parentId) move(c); }); }
            }
                if(entity.type === 'rectangle' && entity.attachedToNodeId) { const node = this.graphData.getNodeById(entity.attachedToNodeId); if(node) { entity.attachOffsetX = entity.x - node.x; entity.attachOffsetY = entity.y - node.y; } }
            };
            selection.forEach(move);

            // FIX: Explicitly move control points of selected edges
            const selectedEdges = selection.filter(e => e.source && e.target);
            selectedEdges.forEach(edge => {
                if (edge.controlPoints && edge.controlPoints.length > 0) {
                    edge.controlPoints.forEach(point => {
                        point.x += dx;
                        point.y += dy;
                    });
                }
            });

        } else if (this.draggingControlPoint) { this.draggingControlPoint.edge.controlPoints[this.draggingControlPoint.pointIndex].x = this.mousePos.x; this.draggingControlPoint.edge.controlPoints[this.draggingControlPoint.pointIndex].y = this.mousePos.y;
        } else if (this.isMarqueeSelecting) { this.marqueeRect.w = this.mousePos.x - this.marqueeRect.x; this.marqueeRect.h = this.mousePos.y - this.marqueeRect.y; }
    };
    const handleMouseUp = (e) => {
        if (this.longPressTimer) { clearTimeout(this.longPressTimer); this.longPressTimer = null; }
        if (this.isMarqueeSelecting) { const nRect = this.normalizeRect(this.marqueeRect); if (nRect.w > 5 || nRect.h > 5) onMarqueeSelect(this.marqueeRect, e.ctrlKey, e.shiftKey); }
        if (this.isCreatingEdge && e.button === 2) { const tClick = this.getClickableEntityAt(this.mousePos.x, this.mousePos.y, { isDecorationsLocked: true }); if (tClick?.type === 'node' && this.edgeCreationSource && tClick.entity.id !== this.edgeCreationSource.id) { onEdgeCreated(this.edgeCreationSource, tClick.entity); } }
        this.dragging = this.draggingEntity = this.draggingControlPoint = this.isCreatingEdge = this.isMarqueeSelecting = this.isDraggingSelection = false;
        this.canvas.style.cursor = 'grab';
        window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp);
        setTimeout(() => { this.dragged = false; }, 0);
    };
    this.canvas.addEventListener('mousedown', (e) => {
        this.disableLocalInteraction(); this.isAnimatingPan = false;
        const isEditor = getIsEditorMode(); this.mousePos = this.getCanvasCoords(e); this.dragged = false;
        const handlePanStart = () => { this.dragging = true; this.dragStart.x = e.clientX - this.offset.x; this.dragStart.y = e.clientY - this.offset.y; this.canvas.style.cursor = 'grabbing'; window.addEventListener('mousemove', handleMouseMove); window.addEventListener('mouseup', handleMouseUp); };
        if (e.button === 1 || (e.button === 0 && !isEditor)) { handlePanStart(); return; }
        if (!isEditor) {
            if (e.button === 2) { // Right-click in Player Mode for long-press simulation
                e.preventDefault();
                if (this.longPressTimer) clearTimeout(this.longPressTimer);
                this.longPressTimer = setTimeout(() => {
                    this.longPressTimer = null; if (this.dragged) return;
                    const targetOverlay = this.findOverlayAtScreenPoint(e.clientX, e.clientY);
                    if (targetOverlay) { this.activeInteractionOverlay = targetOverlay; targetOverlay.classList.add('interaction-enabled'); }
                }, 500);
            }
            return;
        }
        if (e.button === 0) { const cp = this.getControlPointAt(this.mousePos.x, this.mousePos.y); if (cp) { this.draggingControlPoint = cp; } else { const clicked = this.getClickableEntityAt(this.mousePos.x, this.mousePos.y, { isDecorationsLocked: getIsDecorationsLocked() }); if (clicked) { this.draggingEntity = clicked.entity; if (clicked.entity.selected) this.isDraggingSelection = true; } else { this.isMarqueeSelecting = true; this.marqueeRect = { x: this.mousePos.x, y: this.mousePos.y, w: 0, h: 0 }; } }
        } else if (e.button === 2) { e.preventDefault(); const cp = this.getControlPointAt(this.mousePos.x, this.mousePos.y); if (cp) { cp.edge.controlPoints.splice(cp.pointIndex, 1); } else { const cNode = this.getClickableEntityAt(this.mousePos.x, this.mousePos.y, { isDecorationsLocked: true }); if (cNode?.type === 'node') { this.isCreatingEdge = true; this.edgeCreationSource = cNode.entity; } } }
        if (this.draggingEntity || this.draggingControlPoint || this.isCreatingEdge || this.isMarqueeSelecting) { this.canvas.style.cursor = 'crosshair'; window.addEventListener('mousemove', handleMouseMove); window.addEventListener('mouseup', handleMouseUp); }
    });
    this.canvas.addEventListener('wheel', (e) => {
        // ** THE FIX IS HERE **
        if (e.target.closest('.interaction-enabled')) {
            return; // Allow default scroll behavior on active overlays
        }
        e.preventDefault(); 
        this.disableLocalInteraction(); this.isAnimatingPan = false; 
        const zoom = Math.exp((e.deltaY < 0 ? 1 : -1) * 0.1); 
        const rect = this.canvas.getBoundingClientRect(); 
        const mX = e.clientX - rect.left, mY = e.clientY - rect.top; 
        const nS = Math.max(0.05, Math.min(50, this.scale * zoom)); 
        const aZ = nS / this.scale; 
        this.offset.x = mX - (mX - this.offset.x) * aZ; 
        this.offset.y = mY - (mY - this.offset.y) * aZ; 
        this.scale = nS; 
        onViewChanged();
    }, { passive: false });
    this.canvas.addEventListener('click', onClick); this.canvas.addEventListener('dblclick', onDblClick);

    // --- Mobile Touch Handlers ---
    let touchStartPos = { x: 0, y: 0 }, isPinching = false, pinchStartDistance = 0, pinchStartScale = 1;
    this.canvas.addEventListener('touchstart', (e) => {
      if (getIsEditorMode()) return; e.preventDefault(); this.disableLocalInteraction(); this.isAnimatingPan = false; if (this.longPressTimer) { clearTimeout(this.longPressTimer); this.longPressTimer = null; }
      if (e.touches.length === 2) { isPinching = true; this.dragged = true; const t1 = e.touches[0], t2 = e.touches[1]; pinchStartDistance = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY); pinchStartScale = this.scale; }
      else if (e.touches.length === 1) { isPinching = false; const touch = e.touches[0]; touchStartPos = { x: touch.clientX, y: touch.clientY }; this.dragged = false; this.dragStart = { x: touch.clientX - this.offset.x, y: touch.clientY - this.offset.y }; this.longPressTimer = setTimeout(() => { this.longPressTimer = null; if (this.dragged) return; const targetOverlay = this.findOverlayAtScreenPoint(touch.clientX, touch.clientY); if (targetOverlay) { this.activeInteractionOverlay = targetOverlay; targetOverlay.classList.add('interaction-enabled'); } }, 500); }
    }, { passive: false });
    this.canvas.addEventListener('touchmove', (e) => {
      if (getIsEditorMode() || this.activeInteractionOverlay) return; e.preventDefault();
      if (isPinching && e.touches.length === 2) { const t1 = e.touches[0], t2 = e.touches[1]; const currentDistance = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY); if (pinchStartDistance === 0) return; const scaleRatio = currentDistance / pinchStartDistance; const newScale = Math.max(0.05, Math.min(50, pinchStartScale * scaleRatio)); const rect = this.canvas.getBoundingClientRect(); const pMidX = (t1.clientX + t2.clientX) / 2 - rect.left, pMidY = (t1.clientY + t2.clientY) / 2 - rect.top; const wX = (pMidX - this.offset.x) / this.scale, wY = (pMidY - this.offset.y) / this.scale; this.scale = newScale; this.offset.x = pMidX - wX * newScale; this.offset.y = pMidY - wY * newScale; }
      else if (!isPinching && e.touches.length === 1) { const touch = e.touches[0]; const dx = touch.clientX - touchStartPos.x, dy = touch.clientY - touchStartPos.y; if (!this.dragged && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) { this.dragged = true; if (this.longPressTimer) { clearTimeout(this.longPressTimer); this.longPressTimer = null; } } if (this.dragged) { this.offset.x = touch.clientX - this.dragStart.x; this.offset.y = touch.clientY - this.dragStart.y; } }
      onViewChanged();
    }, { passive: false });
    this.canvas.addEventListener('touchend', (e) => {
      if (getIsEditorMode()) return;
      if (this.longPressTimer) { clearTimeout(this.longPressTimer); this.longPressTimer = null; }
      if (!isPinching && !this.dragged && !this.activeInteractionOverlay) { onClick({ clientX: e.changedTouches[0].clientX, clientY: e.changedTouches[0].clientY, ctrlKey: false, shiftKey: false }); }
      if (e.touches.length < 2) isPinching = false;
      if (e.touches.length === 1) { const touch = e.touches[0]; this.dragged = false; this.dragStart = { x: touch.clientX - this.offset.x, y: touch.clientY - this.offset.y }; touchStartPos = { x: touch.clientX, y: touch.clientY }; }
      setTimeout(() => { this.dragged = false; }, 0);
    });

        this.markdownContainer.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (link && link.getAttribute('href').startsWith('#')) {
            e.preventDefault();
            try {
                const params = new URLSearchParams(link.hash.substring(1));
                const x = parseFloat(params.get('x'));
                const y = parseFloat(params.get('y'));
                const s = parseFloat(params.get('s'));
                if (!isNaN(x) && !isNaN(y) && !isNaN(s)) {
                    const targetOffset = {
                        x: (this.canvas.width / 2) - (x * s),
                        y: (this.canvas.height / 2) - (y * s)
                    };
                    const targetView = { offset: targetOffset, scale: s };
                    // Use pushState so the browser back button works
                    history.pushState({ view: targetView }, '', link.hash);
                    this.animateToView(targetView);
                }
            } catch (err) { console.error("Failed to parse internal link:", err); }
        }
    });

        // NEW: Intercept clicks on internal markdown links for smooth navigation
    this.markdownContainer.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        // Check if the click was on a link and if it's an internal hash-link
        if (link && link.getAttribute('href').startsWith('#')) {
            // Prevent the browser from jumping to the anchor
            e.preventDefault();
            try {
                // Parse the view parameters from the link's hash
                const params = new URLSearchParams(link.hash.substring(1));
                const x = parseFloat(params.get('x'));
                const y = parseFloat(params.get('y'));
                const s = parseFloat(params.get('s'));

                if (!isNaN(x) && !isNaN(y) && !isNaN(s)) {
                    // Convert the view-center coordinates to the renderer's offset format
                    const targetOffset = {
                        x: (this.canvas.width / 2) - (x * s),
                        y: (this.canvas.height / 2) - (y * s)
                    };
                    const targetView = { offset: targetOffset, scale: s };

                    // Update the URL and add to browser history so the "back" button works
                    history.pushState({ view: targetView }, '', link.href);
                    
                    // Trigger our smooth camera animation
                    this.animateToView(targetView);
                }
            } catch (err) { 
                console.error("Failed to parse internal link:", err); 
            }
        }
    });
           
  }
}
    

