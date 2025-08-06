/**
 * AVN Player v2.9 - Main Application
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
      this.toggleEditorMode(false); // Start in player mode
      console.log('Application initialized successfully.');
    } catch (error) {
      console.error('Initialization failed:', error);
      alert('Could not load the application.');
    }
  }

  toggleEditorMode(isEditor) {
    this.isEditorMode = isEditor;
    document.body.classList.toggle('editor-mode', isEditor);
    this.renderer.setEditorMode(isEditor);
    this.player.stop();
    this.navigation.reset();
    this.editorTools.clearSelection();
  }

  setupEventListeners() {
    this.renderer.setupCanvasInteraction(
        (event) => this.handleCanvasClick(event),
        (event) => this.handleCanvasDblClick(event),
        (source, target) => { if (this.isEditorMode) this.editorTools.createEdge(source, target); },
        (items, event) => { if (this.isEditorMode) this.editorTools.updateSelection(items, event.ctrlKey, event.shiftKey); },
        () => { if (this.isEditorMode) this.editorTools.startDragging(); }, // onDragStart
        (dx, dy) => { if (this.isEditorMode) this.editorTools.dragSelection(dx, dy); } // onDrag
    );

    document.getElementById('editorModeToggle').addEventListener('change', (e) => this.toggleEditorMode(e.target.checked));
    document.getElementById('exportBtn').addEventListener('click', () => this.editorTools.exportGraph());
    document.getElementById('resetBtn').addEventListener('click', () => this.editorTools.resetGraph());
    document.getElementById('addNodeBtn').addEventListener('click', () => {
        const newNode = this.editorTools.createNode();
        this.editorTools.setSelection([newNode]);
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
    
    if (this.isEditorMode) {
      const clickedNode = this.renderer.getNodeAt(coords.x, coords.y);
      const clickedEdge = !clickedNode ? this.renderer.getEdgeAt(coords.x, coords.y) : null;
      const clickedEntity = clickedNode || clickedEdge;
      this.editorTools.updateSelection(clickedEntity ? [clickedEntity] : [], event.ctrlKey, event.shiftKey);
    } else { // Player mode
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
        this.editorTools.openInspectorFor(clickedNode);
    } else {
        const clickedEdge = this.renderer.getEdgeAt(coords.x, coords.y);
        if (clickedEdge) {
            this.editorTools.addControlPointAt(clickedEdge, coords);
        }
    }
  }
}

window.addEventListener('load', () => {
  const app = new GraphApp();
  app.init();
});