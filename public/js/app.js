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
      const { scale } = this.renderer.getViewport();
      const FLOATING_TITLE_THRESHOLD = 0.4; // Synced with MAP_VIEW_THRESHOLD
      const titleDiv = document.getElementById('floating-chapter-title');
      if (scale < FLOATING_TITLE_THRESHOLD) {
          titleDiv.classList.add('hidden');
      } else {
          const center = this.renderer.getViewportCenter();
          const currentGroup = this._findGroupAtPoint(center);
          if (currentGroup && currentGroup.title) {
              titleDiv.textContent = currentGroup.title;
              titleDiv.classList.remove('hidden');
          } else {
              titleDiv.classList.add('hidden');
          }
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