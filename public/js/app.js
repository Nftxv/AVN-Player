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