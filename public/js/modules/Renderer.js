/**
 * AVN Player v2.3 - Renderer Module with Marquee Selection
 * by Nftxv
 */
export default class Renderer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    
    // Data
    this.nodes = [];
    this.edges = [];
    this.meta = {};
    this.images = {};

    // View camera state
    this.offset = { x: 0, y: 0 };
    this.scale = 1.0;
    
    // Interaction states
    this.dragged = false;
    this.mousePos = { x: 0, y: 0 };

    // Action states
    this.isPanning = false; // Middle mouse drag
    this.isDraggingNodes = false; // Left mouse drag on a selection
    this.isCreatingEdge = false; // Right mouse drag
    this.isMarqueeSelecting = false; // Left mouse drag on empty space

    // Dragging details
    this.dragStart = { x: 0, y: 0 };
    this.draggingNodes = []; // The group of nodes being dragged
    this.edgeCreationSource = null;

    // Marquee selection details
    this.marqueeRect = { x: 0, y: 0, width: 0, height: 0 };

    this.resizeCanvas();
    this.renderLoop = this.renderLoop.bind(this);
  }

  setData(nodes, edges, meta) {
    this.nodes = nodes;
    this.edges = edges;
    this.meta = meta;
  }

  async loadAndRenderAll() { /* ... без изменений ... */ }
  async loadImages() { /* ... без изменений ... */ }
  getSourceUrl(source) { /* ... без изменений ... */ }
  
  getNodeAt(x, y) { /* ... без изменений ... */ }
  getEdgeAt(x, y) { /* ... без изменений ... */ }

  renderLoop() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.save();
    this.ctx.translate(this.offset.x, this.offset.y);
    this.ctx.scale(this.scale, this.scale);

    this.edges.forEach(edge => this.drawEdge(edge));
    this.nodes.forEach(node => this.drawNode(node));
    
    if (this.isCreatingEdge && this.edgeCreationSource) {
      this.drawTemporaryEdge();
    }
    
    if (this.isMarqueeSelecting) {
      this.drawMarquee();
    }

    this.ctx.restore();
    requestAnimationFrame(this.renderLoop);
  }

  drawNode(node) { /* ... без изменений ... */ }
  drawEdge(edge) { /* ... без изменений ... */ }
  drawTemporaryEdge() { /* ... без изменений ... */ }
  
  drawMarquee() {
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = '#00faff';
    ctx.lineWidth = 1;
    ctx.fillStyle = 'rgba(0, 250, 255, 0.1)';
    ctx.beginPath();
    ctx.rect(this.marqueeRect.x, this.marqueeRect.y, this.marqueeRect.width, this.marqueeRect.height);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  highlight(currentId, prevId = null, edge = null) { /* ... без изменений ... */ }
  getCanvasCoords({ clientX, clientY }) { /* ... без изменений ... */ }
  resizeCanvas() { /* ... без изменений ... */ }
  wasDragged() { return this.dragged; }

  setupCanvasInteraction(callbacks) {
      const { onClick, onDblClick, onEdgeCreated, onSelectionChange } = callbacks;

      window.addEventListener('resize', () => this.resizeCanvas());

      this.canvas.addEventListener('mousedown', (e) => {
          this.dragStart = this.getCanvasCoords(e);
          this.dragged = false;
          
          const clickedNode = this.getNodeAt(this.dragStart.x, this.dragStart.y);

          if (e.button === 0) { // Left Mouse Button
              if (clickedNode && clickedNode.selected) {
                  this.isDraggingNodes = true;
                  // Prepare all selected nodes for dragging
                  this.draggingNodes = this.nodes.filter(n => n.selected);
                  this.draggingNodes.forEach(n => {
                      n.dragOffsetX = this.dragStart.x - n.x;
                      n.dragOffsetY = this.dragStart.y - n.y;
                  });
              } else {
                  this.isMarqueeSelecting = true;
                  this.marqueeRect.x = this.dragStart.x;
                  this.marqueeRect.y = this.dragStart.y;
                  this.marqueeRect.width = 0;
                  this.marqueeRect.height = 0;
              }
          } else if (e.button === 1) { // Middle Mouse Button
              e.preventDefault();
              this.isPanning = true;
              this.dragStart.panX = e.clientX - this.offset.x;
              this.dragStart.panY = e.clientY - this.offset.y;
          } else if (e.button === 2) { // Right Mouse Button
              if (clickedNode) {
                  this.isCreatingEdge = true;
                  this.edgeCreationSource = clickedNode;
              }
          }
      });

      this.canvas.addEventListener('mousemove', (e) => {
          const currentMousePos = this.getCanvasCoords(e);
          this.mousePos = currentMousePos; // for temp edge
          
          if (this.isPanning || this.isDraggingNodes || this.isMarqueeSelecting || this.isCreatingEdge) {
              this.dragged = true;
          }

          if (this.isDraggingNodes) {
              this.draggingNodes.forEach(n => {
                  n.x = currentMousePos.x - n.dragOffsetX;
                  n.y = currentMousePos.y - n.dragOffsetY;
              });
          } else if (this.isMarqueeSelecting) {
              this.marqueeRect.width = currentMousePos.x - this.marqueeRect.x;
              this.marqueeRect.height = currentMousePos.y - this.marqueeRect.y;
          } else if (this.isPanning) {
              this.offset.x = e.clientX - this.dragStart.panX;
              this.offset.y = e.clientY - this.dragStart.panY;
          }
      });

      this.canvas.addEventListener('mouseup', (e) => {
          if (this.isMarqueeSelecting) {
              const rect = this.normalizeRect(this.marqueeRect);
              onSelectionChange(rect, e.shiftKey);
          }
          if (this.isCreatingEdge) {
              const targetNode = this.getNodeAt(this.mousePos.x, this.mousePos.y);
              if (targetNode && this.edgeCreationSource) {
                  onEdgeCreated(this.edgeCreationSource, targetNode);
              }
          }
          
          // Reset all states
          this.isPanning = false;
          this.isDraggingNodes = false;
          this.isMarqueeSelecting = false;
          this.isCreatingEdge = false;
          this.draggingNodes = [];

          setTimeout(() => { this.dragged = false; }, 0);
      });
      
      this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
      this.canvas.addEventListener('mouseleave', () => { /* ... сброс состояний ... */ });
      this.canvas.addEventListener('wheel', (e) => { /* ... без изменений ... */ });

      this.canvas.addEventListener('click', onClick);
      this.canvas.addEventListener('dblclick', onDblClick);
  }
  
  normalizeRect(rect) {
    return {
        x: rect.width < 0 ? rect.x + rect.width : rect.x,
        y: rect.height < 0 ? rect.y + rect.height : rect.y,
        width: Math.abs(rect.width),
        height: Math.abs(rect.height),
    };
  }
}