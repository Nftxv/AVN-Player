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

// Import all necessary modules
import GraphData from './modules/GraphData.js';
import Renderer from './modules/Renderer.js';
import Player from './modules/Player.js';
import EditorTools from './modules/EditorTools.js';
import Navigation from './modules/Navigation.js';

/**
 * Main application class.
 * Orchestrates all modules and initializes the application.
 */
class GraphApp {
  constructor() {
    // Initialize core components
    this.graphData = new GraphData();
    this.renderer = new Renderer('graphCanvas');
    this.player = new Player(this.graphData);
    this.navigation = new Navigation(this.graphData, this.player, this.renderer);
    // Pass navigation to editor tools for resetting state
    this.editorTools = new EditorTools(this.graphData, this.renderer, this.player, this.navigation, this);
    
    // Establish communication between player and navigation
    this.player.setNavigation(this.navigation);
  }

  /**
   * Initializes or re-initializes the application.
   */
  async init() {
    try {
      // Load the default graph data
      await this.graphData.load('data/default.jsonld');
      
      this.navigation.reset();
      this.player.stop();

      // Pass the loaded data to the renderer
      this.renderer.setData(this.graphData.nodes, this.graphData.edges, this.graphData.meta);
      await this.renderer.loadAndRenderAll();
      
      console.log('Application initialized successfully.');
    } catch (error) {
      console.error('Initialization failed:', error);
      alert('Could not load the application. Check the console for details.');
    }
  }

  /**
   * Sets up all global event listeners for the application.
   */
  setupEventListeners() {
    // Activate pan and zoom listeners for the renderer
    this.renderer.setupEventListeners();

    // Handle clicks on the canvas to select nodes
    this.renderer.canvas.addEventListener('click', (event) => {
      // Do not trigger node selection if user is dragging the canvas
      if (this.renderer.wasDragged()) return;

      const clickCoords = this.renderer.getCanvasCoords(event);
      const clickedNode = this.renderer.getNodeAt(clickCoords.x, clickCoords.y);
      if (clickedNode) {
        this.navigation.startFromNode(clickedNode.id);
      }
    });

    // Player controls
    document.getElementById('playBtn').addEventListener('click', () => this.player.togglePlay());
    document.getElementById('backBtn').addEventListener('click', () => this.navigation.goBack());
    document.getElementById('nextBtn').addEventListener('click', () => this.navigation.advance());

    // Editor tools

    // 🚫 SECURITY NOTE: User graph import is disabled in the public version.
    // This feature is a potential vector for loading malicious content (e.g., phishing links
    // or IP loggers) through audio, cover, or lyrics sources in a user-provided file.
    // For local development and testing, you can uncomment the line below at your own risk.
    // document.getElementById('importFile').addEventListener('change', (e) => this.editorTools.importGraph(e));

    document.getElementById('exportBtn').addEventListener('click', () => this.editorTools.exportGraph());
    document.getElementById('resetBtn').addEventListener('click', () => this.editorTools.resetGraph());
  }
}

// Start the application once the window is loaded
window.addEventListener('load', () => {
  const app = new GraphApp();
  app.init();
  app.setupEventListeners(); // Setup listeners after first init
});