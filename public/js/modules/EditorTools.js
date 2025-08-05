/**
 * AVN Player v2.3 - Editor Tools Module
 * by Nftxv
 */
export default class EditorTools {
  constructor(graphData, renderer) {
    this.graphData = graphData;
    this.renderer = renderer;
    this.editingNode = null;
    this.selection = []; // Now an array to hold multiple items
  }

  createNode() { /* ... без изменений ... */ }
  createEdge(sourceNode, targetNode) { /* ... без изменений ... */ }

  deleteSelection() {
    if (this.selection.length === 0 || !confirm(`Delete ${this.selection.length} selected item(s)?`)) return;

    const idsToDelete = new Set(this.selection.filter(e => !e.source).map(n => n.id));
    const edgesToDelete = this.selection.filter(e => e.source);
    
    // Delete nodes and any connected edges
    if (idsToDelete.size > 0) {
        this.graphData.nodes = this.graphData.nodes.filter(n => !idsToDelete.has(n.id));
        this.graphData.edges = this.graphData.edges.filter(e => !idsToDelete.has(e.source) && !idsToDelete.has(e.target));
    }
    
    // Delete edges that were explicitly selected
    this.graphData.edges = this.graphData.edges.filter(e => !edgesToDelete.includes(e));

    this.clearSelection();
  }

  // --- Selection Management ---
  
  clearSelection() {
    this.selection.forEach(e => e.selected = false);
    this.selection = [];
    document.getElementById('deleteSelectionBtn').disabled = true;
  }

  selectEntity(entity, addToSelection = false) {
    if (!addToSelection) {
      this.clearSelection();
    }
    
    if (entity) {
      if (this.selection.includes(entity)) {
        // If shift-clicking an already selected item, deselect it
        if (addToSelection) {
          entity.selected = false;
          this.selection = this.selection.filter(e => e !== entity);
        }
      } else {
        entity.selected = true;
        this.selection.push(entity);
      }
    }
    document.getElementById('deleteSelectionBtn').disabled = this.selection.length === 0;
  }
  
  selectEntitiesInRect(rect, addToSelection = false) {
    if (!addToSelection) {
      this.clearSelection();
    }
    
    const nodeWidth = 160;
    const nodeHeight = 90;

    this.graphData.nodes.forEach(node => {
        // Check if node center is inside the rectangle
        const nodeCenterX = node.x + nodeWidth / 2;
        const nodeCenterY = node.y + nodeHeight / 2;
        if (nodeCenterX > rect.x && nodeCenterX < rect.x + rect.width &&
            nodeCenterY > rect.y && nodeCenterY < rect.y + rect.height) {
            
            if (!this.selection.includes(node)) {
                node.selected = true;
                this.selection.push(node);
            }
        }
    });
    
    // You could add edge selection logic here as well
    
    document.getElementById('deleteSelectionBtn').disabled = this.selection.length === 0;
  }

  openInspector(node) { /* ... без изменений ... */ }
  saveInspectorChanges() { /* ... без изменений ... */ }
  closeInspector() { /* ... без изменений ... */ }
  openSettings() { /* ... без изменений ... */ }
  saveSettings() { /* ... без изменений ... */ }
  closeSettings() { /* ... без изменений ... */ }
  exportGraph() { /* ... без изменений ... */ }
  resetGraph() { /* ... без изменений ... */ }
}