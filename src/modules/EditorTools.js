/**
 * Provides tools for the user to interact with the graph data locally,
 * such as importing, exporting, and resetting the graph.
 */
export default class EditorTools {
  constructor(graphData, renderer, player, navigation, app) {
    this.graphData = graphData;
    this.renderer = renderer;
    this.player = player;
    this.navigation = navigation;
    this.app = app; // Reference to the main app for resetting
  }

  /**
   * Exports the current state of the graph to a JSON-LD file.
   */
  exportGraph() {
    try {
      const graphJSON = JSON.stringify(this.graphData.getGraph(), null, 2);
      const blob = new Blob([graphJSON], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'music-graph.jsonld';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Could not export the graph.');
    }
  }

  /**
   * Imports a graph from a user-selected file.
   * @param {Event} event - The file input change event.
   */
  importGraph(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result);
        this.graphData.parseData(data);
        this.player.graphData = this.graphData;
        
        // Reset player and navigation state
        this.navigation.reset();
        this.player.stop();

        // Reload renderer with new data
        this.renderer.setData(this.graphData.nodes, this.graphData.edges, this.graphData.meta);
        await this.renderer.loadAndRenderAll();

      } catch (error) {
        console.error('Import failed:', error);
        alert('Could not read the graph file. Please ensure it is a valid JSON.');
      }
    };
    reader.readAsText(file);
    event.target.value = null; // Allow re-importing the same file
  }

  /**
   * Resets the application to its initial state by reloading the default graph.
   */
  resetGraph() {
    if (confirm('Are you sure you want to reset the graph to its default state? All local changes will be lost.')) {
      this.app.init(); // Call the main app's init method to reload everything
    }
  }
}