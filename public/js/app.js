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
    this.renderer = new Renderer('graphCanvas', this.iframeContainer, this.markdownContainer, this);
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
      await this.graphData.load('data/default.jsonld');
      this.renderer.setData(this.graphData);

      // --- Smart Mobile Viewport Adjustment ---
      const IS_MOBILE = window.innerWidth < 768;
      const MOBILE_ZOOM_THRESHOLD = 2.5; // If saved scale is higher, it's a close-up
      const MOBILE_TARGET_SCALE = 1.2;   // A comfortable scale to fit one node

      if (IS_MOBILE && this.graphData.view && this.graphData.view.scale > MOBILE_ZOOM_THRESHOLD) {
        console.log('Mobile device with high initial zoom detected. Adjusting viewport.');

        // Calculate the center of the saved desktop viewport
        const savedView = this.graphData.view;
        const assumedDesktopWidth = 1920; // Assume a common desktop width for center calculation
        const assumedDesktopHeight = 1080;
        const savedCenterX = (assumedDesktopWidth / 2 - savedView.offset.x) / savedView.scale;
        const savedCenterY = (assumedDesktopHeight / 2 - savedView.offset.y) / savedView.scale;

        // Find the node closest to that saved center
        let closestNode = null;
        let minDistance = Infinity;
        
        if (this.graphData.nodes.length > 0) {
            this.graphData.nodes.forEach(node => {
                const nodeCenterX = node.x + NODE_WIDTH / 2;
                const nodeCenterY = node.y + NODE_HEADER_HEIGHT / 2;
                const dist = Math.hypot(savedCenterX - nodeCenterX, savedCenterY - nodeCenterY);
                if (dist < minDistance) {
                    minDistance = dist;
                    closestNode = node;
                }
            });
        }

        if (closestNode) {
            // Calculate the new viewport to center this node without animation
            const nodeCenterX = closestNode.x + NODE_WIDTH / 2;
            const nodeCenterY = closestNode.y + NODE_HEADER_HEIGHT / 2;
            const newOffsetX = (this.renderer.canvas.width / 2) - (nodeCenterX * MOBILE_TARGET_SCALE);
            const newOffsetY = (this.renderer.canvas.height / 2) - (nodeCenterY * MOBILE_TARGET_SCALE);

            this.renderer.setViewport({
                offset: { x: newOffsetX, y: newOffsetY },
                scale: MOBILE_TARGET_SCALE
            });
        } else {
            // Fallback: if no nodes, just use the saved view anyway
            this.renderer.setViewport(this.graphData.view);
        }
      } else {
        // Standard behavior for desktop or non-zoomed views
        if (this.graphData.view) {
          this.renderer.setViewport(this.graphData.view);
        }
      }
      
      this.renderer.render(); // Render initial state
      this.setupEventListeners();
      this.toggleEditorMode(false);
      console.log('Application initialized successfully.');

    } catch (error) {
      console.error('Initialization failed:', error);
      alert('Could not load the application.');
    }
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

              // Immediately and smoothly pan to center the current node with the new settings
              // This eliminates the "jump" on the next navigation event.
              this.renderer.centerOnNode(node.id, this.followScale, this.followScreenOffset);
          } else {
              // If no node is active, default to a centered view for the next node.
              this.followScreenOffset = { x: 0, y: 0 };
              console.log(`Follow mode activated. Target scale: ${this.followScale}. No active node, will center next.`);
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
    this.renderer.destroyAllMarkdownOverlays();
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