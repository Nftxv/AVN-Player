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
    this.followScreenOffset = { x: 0, y: 0 }; // REVISED: This is the core of the new follow logic
  }

  async init() {
    try {
      await this.graphData.load('data/default.jsonld');
      this.renderer.setData(this.graphData);
      
      if (this.graphData.view) {
        this.renderer.setViewport(this.graphData.view);
      }
      
      this.setupEventListeners();
      this.toggleEditorMode(false);
      console.log('Application initialized successfully.');
    } catch (error) {
      console.error('Initialization failed:', error);
      alert('Could not load the application.');
    }
  }

  // REVISED: Follow mode logic is completely overhauled for precise positioning.
  toggleFollowMode(forceState = null) {
      this.isFollowing = forceState !== null ? forceState : !this.isFollowing;
      document.getElementById('followModeBtn').classList.toggle('active', this.isFollowing);

      if (this.isFollowing) {
          const { scale, offset } = this.renderer.getViewport();
          this.followScale = scale; // Capture the current scale

          if (this.navigation.currentNode) {
              const node = this.navigation.currentNode;
              const nodeRect = this.renderer._getNodeVisualRect(node);
              const nodeCenterX = nodeRect.x + nodeRect.width / 2;
              const nodeCenterY = nodeRect.y + nodeRect.height / 2;

              // Calculate node's current position on screen
              const nodeScreenX = nodeCenterX * scale + offset.x;
              const nodeScreenY = nodeCenterY * scale + offset.y;
              
              // Calculate and store the offset from the screen center
              this.followScreenOffset.x = nodeScreenX - this.renderer.canvas.width / 2;
              this.followScreenOffset.y = nodeScreenY - this.renderer.canvas.height / 2;
              
              console.log(`Follow mode ACTIVATED. Target scale: ${this.followScale}. Screen offset:`, this.followScreenOffset);
          } else {
              // If no node is active, default to centering
              this.followScreenOffset = { x: 0, y: 0 };
              console.log(`Follow mode ACTIVATED. Target scale: ${this.followScale}. No active node, will center.`);
          }
      } else {
          console.log('Follow mode DEACTIVATED.');
      }
  }

  toggleEditorMode(isEditor) {
    this.isEditorMode = isEditor;
    document.body.classList.toggle('editor-mode', isEditor);
    // When switching modes, clear any active player/editor state
    this.player.stop();
    this.navigation.reset();
    if (!isEditor) {
      // Exiting editor mode: clear selection and close inspector
      this.editorTools.updateSelection([], 'set');
    }
    // Renderer now handles overlay visibility/interactivity via CSS, no need to destroy.
  }

  setupEventListeners() {
    this.renderer.setupCanvasInteraction({
        getIsEditorMode: () => this.isEditorMode,
        getIsDecorationsLocked: () => this.editorTools.decorationsLocked,
        onClick: (e, entity) => this.handleCanvasClick(e, entity),
        onDblClick: (e, entity) => this.handleCanvasDblClick(e, entity),
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
            // Ensure we clean up any associated DOM elements
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

  handleCanvasClick(event, clicked) {
    if (this.renderer.wasDragged()) return;

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
  
  handleCanvasDblClick(event, clicked) {
    if (this.renderer.wasDragged()) return;
    const coords = this.renderer.getCanvasCoords(event);
    
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