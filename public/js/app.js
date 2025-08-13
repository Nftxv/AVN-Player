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
const NODE_CONTENT_HEIGHT_DEFAULT = NODE_WIDTH * (9/16); // For iframes
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

      if (IS_MOBILE && this.graphData.view && this.graphData.view.scale > MOBILE_ZOOM_THRESHOLD) {
        // ... (this entire block is the same as before, no need to copy it here)
        // For brevity, I'm omitting the identical viewport adjustment logic. 
        // Just imagine the original code block is here.
        const savedView = this.graphData.view;
        const assumedDesktopWidth = 1920, assumedDesktopHeight = 1080;
        const savedCenterX = (assumedDesktopWidth / 2 - savedView.offset.x) / savedView.scale;
        const savedCenterY = (assumedDesktopHeight / 2 - savedView.offset.y) / savedView.scale;
        let closestNode = this.graphData.nodes.reduce((closest, node) => {
            // FIX: Correctly calculate the node's true visual center
            const contentHeight = node.sourceType === 'audio' ? NODE_CONTENT_HEIGHT_SQUARE : NODE_CONTENT_HEIGHT_DEFAULT;
            const totalHeight = contentHeight + NODE_HEADER_HEIGHT;
            const visualTopY = node.y - contentHeight;
            const nodeCenterX = node.x + NODE_WIDTH / 2;
            const nodeCenterY = visualTopY + totalHeight / 2; // True visual center Y

            const dist = Math.hypot(savedCenterX - nodeCenterX, savedCenterY - nodeCenterY);
            return (dist < closest.minDistance) ? { node, minDistance: dist } : closest;
        }, { node: null, minDistance: Infinity }).node;

        if (closestNode) {
            // FIX: Use the same correct calculation to center the found node
            const contentHeight = closestNode.sourceType === 'audio' ? NODE_CONTENT_HEIGHT_SQUARE : NODE_CONTENT_HEIGHT_DEFAULT;
            const totalHeight = contentHeight + NODE_HEADER_HEIGHT;
            const visualTopY = closestNode.y - contentHeight;
            const nodeCenterX = closestNode.x + NODE_WIDTH / 2;
            const nodeCenterY = visualTopY + totalHeight / 2;

            const newOffsetX = (this.renderer.canvas.width / 2) - (nodeCenterX * MOBILE_TARGET_SCALE);
            const newOffsetY = (this.renderer.canvas.height / 2) - (nodeCenterY * MOBILE_TARGET_SCALE);
            this.renderer.setViewport({ offset: { x: newOffsetX, y: newOffsetY }, scale: MOBILE_TARGET_SCALE });
        } else {
            this.renderer.setViewport(this.graphData.view);
        }
        
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
          const { scale } = this.renderer.getViewport();
          this.followScale = scale; // Capture current scale as the desired follow scale
          
          if (this.navigation.currentNode) {
              const node = this.navigation.currentNode;
              const { offset } = this.renderer.getViewport();
              
              // Calculate where the node currently is on screen
              const nodeScreenX = (node.x + NODE_WIDTH / 2) * scale + offset.x;
              const nodeScreenY = (node.y + NODE_HEADER_HEIGHT / 2) * scale + offset.y;
              
              // Calculate the difference between the screen center and the node's current position
              // This captures the user's desired placement of the node on the screen
              this.followScreenOffset.x = this.renderer.canvas.width / 2 - nodeScreenX;
              this.followScreenOffset.y = this.renderer.canvas.height / 2 - nodeScreenY;

              console.log(`Follow mode activated. Target scale: ${this.followScale}, Screen offset:`, this.followScreenOffset);

              console.log(`Follow mode activated. Target scale: ${this.followScale}, Screen offset captured:`, this.followScreenOffset);
          }
          // If no node is active, we intentionally do nothing to the offset.
          // This preserves the user's manual panning, respecting their desired view
          // for the next node they select.

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
          // Reload the page with the new graph file as a URL parameter
          window.location.href = window.location.pathname + '?graph=' + file;
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
      if (event.ctrlKey) mode = 'add';
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