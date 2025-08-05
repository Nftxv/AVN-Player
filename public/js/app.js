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

  setAllNodesCollapsed(isCollapsed) {
    this.graphData.nodes.forEach(node => node.isCollapsed = isCollapsed);
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

    document.getElementById('expandAllBtn').addEventListener('click', () => this.setAllNodesCollapsed(false));
    document.getElementById('collapseAllBtn').addEventListener('click', () => this.setAllNodesCollapsed(true));
    
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
      // Сначала проверяем, не кликнули ли мы по иконке сворачивания
      const toggledNode = this.renderer.getNodeToggleAt(coords.x, coords.y);
      if (toggledNode) {
        toggledNode.isCollapsed = !toggledNode.isCollapsed;
        return; // Действие выполнено, выходим
      }

      // Если нет, продолжаем логику выделения
      const clickedNode = this.renderer.getNodeAt(coords.x, coords.y);
      if (clickedNode) {
        this.editorTools.selectEntity(clickedNode);
        return;
      }

      const clickedEdge = this.renderer.getEdgeAt(coords.x, coords.y);
      if (clickedEdge) {
        this.editorTools.selectEntity(clickedEdge);
        return;
      }
      
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