/**
 * AVN Player v2.3 - Renderer Module
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

    // View & camera state
    this.offset = { x: 0, y: 0 };
    this.scale = 1.0;
    
    // Dragging state
    this.dragStart = { x: 0, y: 0 };
    this.dragging = false;
    this.dragged = false;
    this.draggingNode = null;
    this.draggingControlPoint = null; // { edge, pointIndex }

    // Edge creation state
    this.isCreatingEdge = false;
    this.edgeCreationSource = null;
    this.mousePos = { x: 0, y: 0 };

    this.resizeCanvas();
    this.renderLoop = this.renderLoop.bind(this);
  }

  setData(nodes, edges, meta) {
    this.nodes = nodes;
    this.edges = edges;
    this.meta = meta;
  }

  async loadAndRenderAll() {
    await this.loadImages();
    this.renderLoop();
  }

  async loadImages() {
    // ... (no changes in this method)
    const promises = this.nodes.flatMap(node =>
      (node.coverSources || []).map(async source => {
        const url = this.getSourceUrl(source);
        if (url && !this.images[url]) {
          try {
            const img = new Image();
            img.src = url;
            await img.decode();
            this.images[url] = img;
          } catch (e) {
            console.warn(`Failed to load cover image: ${url}`, e);
          }
        }
      })
    );
    await Promise.all(promises);
  }

  getSourceUrl(source) {
    // ... (no changes in this method)
    if (!source) return null;
    if (source.type === 'ipfs') {
      const gateway = this.meta.gateways?.[0] || 'https://ipfs.io/ipfs/';
      return `${gateway}${source.value}`;
    }
    return source.value;
  }
  
  getNodeAt(x, y) {
    // ... (no changes in this method)
    for (let i = this.nodes.length - 1; i >= 0; i--) {
        const node = this.nodes[i];
        const width = 160, height = 90;
        if (x > node.x && x < node.x + width && y > node.y && y < node.y + height) {
            return node;
        }
    }
    return null;
  }

  getControlPointAt(x, y) {
      const tolerance = 8; // click radius
      for (const edge of this.edges) {
          for (let i = 0; i < edge.controlPoints.length; i++) {
              const point = edge.controlPoints[i];
              if (Math.hypot(x - point.x, y - point.y) < tolerance) {
                  return { edge, pointIndex: i };
              }
          }
      }
      return null;
  }

  getEdgeAt(x, y) {
    const tolerance = 10;
    for (const edge of this.edges) {
        const src = this.nodes.find(n => n.id === edge.source);
        const trg = this.nodes.find(n => n.id === edge.target);
        if (!src || !trg) continue;

        const pathPoints = [
            { x: src.x + 80, y: src.y + 45 },
            ...edge.controlPoints,
            { x: trg.x + 80, y: trg.y + 45 }
        ];

        for (let i = 0; i < pathPoints.length - 1; i++) {
            const p1 = pathPoints[i];
            const p2 = pathPoints[i + 1];
            // Simple distance to line segment check
            const len = Math.hypot(p2.x - p1.x, p2.y - p1.y);
            const dot = (((x - p1.x) * (p2.x - p1.x)) + ((y - p1.y) * (p2.y - p1.y))) / Math.pow(len, 2);
            const closestX = p1.x + (dot * (p2.x - p1.x));
            const closestY = p1.y + (dot * (p2.y - p1.y));
            
            const onSegment = dot >= 0 && dot <= 1;
            if (onSegment && Math.hypot(x - closestX, y - closestY) < tolerance) {
                return edge;
            }
        }
    }
    return null;
  }


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

    this.ctx.restore();
    requestAnimationFrame(this.renderLoop);
  }

  drawNode(node) {
    // ... (no changes in this method)
    const ctx = this.ctx;
    const width = 160, height = 90;
    ctx.save();
    
    if (node.selected) {
        ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 4;
    } else if (node.highlighted) {
        ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 4;
    } else {
        ctx.strokeStyle = '#4a86e8'; ctx.lineWidth = 2;
    }

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(node.x, node.y, width, height, 8) : ctx.rect(node.x, node.y, width, height);
    ctx.fill();
    ctx.stroke();

    const coverSource = node.coverSources?.[0];
    const coverUrl = this.getSourceUrl(coverSource);
    if (coverUrl && this.images[coverUrl]) {
        ctx.drawImage(this.images[coverUrl], node.x + 5, node.y + 5, height - 10, height - 10);
    } else {
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(node.x + 5, node.y + 5, height - 10, height - 10);
    }

    ctx.fillStyle = '#000000';
    ctx.font = '14px Segoe UI';
    ctx.fillText(node.title, node.x + height, node.y + 25, width - height - 10);
    ctx.restore();
  }

  drawEdge(edge) {
    const src = this.nodes.find(n => n.id === edge.source);
    const trg = this.nodes.find(n => n.id === edge.target);
    if (!src || !trg) return;
    
    const ctx = this.ctx;
    ctx.save();

    let color = edge.color || '#888888';
    if (edge.selected) color = '#e74c3c';
    if (edge.highlighted) color = '#FFD700';

    const lineWidth = edge.selected || edge.highlighted ? (edge.lineWidth || 2) + 1 : (edge.lineWidth || 2);

    const pathPoints = [
      { x: src.x + 80, y: src.y + 45 },
      ...edge.controlPoints,
      { x: trg.x + 80, y: trg.y + 45 }
    ];

    // Draw line segments
    ctx.beginPath();
    ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
    for (let i = 1; i < pathPoints.length; i++) {
        ctx.lineTo(pathPoints[i].x, pathPoints[i].y);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.stroke();

    // Draw arrows and control points
    for (let i = 1; i < pathPoints.length; i++) {
        const p1 = pathPoints[i-1];
        const p2 = pathPoints[i];
        const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        this._drawArrow(p2.x, p2.y, angle, color);
        
        // Draw control point circle if it's not a start/end node
        if (i < pathPoints.length - 1) {
            ctx.beginPath();
            ctx.arc(p2.x, p2.y, 5, 0, 2 * Math.PI);
            ctx.fillStyle = color;
            ctx.fill();
        }
    }
    
    // Draw label
    if (edge.label) {
        const midPoint = pathPoints[Math.floor((pathPoints.length-1)/2)];
        const nextPoint = pathPoints[Math.floor((pathPoints.length-1)/2)+1];
        ctx.font = '12px Segoe UI';
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(edge.label, (midPoint.x + nextPoint.x)/2, (midPoint.y+nextPoint.y)/2 - 8);
    }

    ctx.restore();
  }

  _drawArrow(x, y, angle, color) {
      const size = 10;
      this.ctx.save();
      this.ctx.translate(x, y);
      this.ctx.rotate(angle);
      
      this.ctx.beginPath();
      this.ctx.moveTo(0, 0); // Tip of arrow should be exactly on point
      this.ctx.lineTo(-size, -size / 2);
      this.ctx.lineTo(-size, size / 2);
      this.ctx.closePath();
      
      this.ctx.fillStyle = color;
      this.ctx.fill();
      this.ctx.restore();
  }

  drawTemporaryEdge() {
    // ... (no changes in this method)
    const ctx = this.ctx;
    const startX = this.edgeCreationSource.x + 80;
    const startY = this.edgeCreationSource.y + 45;
    
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(this.mousePos.x, this.mousePos.y);
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 3;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.restore();
  }

  highlight(currentId, prevId = null, edge = null) {
    // ... (no changes in this method)
    if(prevId) {
        const prevNode = this.nodes.find(n => n.id === prevId);
        if (prevNode) prevNode.highlighted = false;
    }
    if(currentId) {
        const currentNode = this.nodes.find(n => n.id === currentId);
        if (currentNode) currentNode.highlighted = true;
    }
    this.edges.forEach(e => e.highlighted = false);
    if(edge) {
        const edgeToHighlight = this.edges.find(e => e.source === edge.source && e.target === edge.target);
        if (edgeToHighlight) edgeToHighlight.highlighted = true;
    }
  }
  
  getCanvasCoords({ clientX, clientY }) {
    // ... (no changes in this method)
    const rect = this.canvas.getBoundingClientRect();
    const x = (clientX - rect.left - this.offset.x) / this.scale;
    const y = (clientY - rect.top - this.offset.y) / this.scale;
    return { x, y };
  }
  
  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }
  
  wasDragged() { return this.dragged; }

  setupCanvasInteraction(onClick, onDblClick, onEdgeCreated) {
      window.addEventListener('resize', () => this.resizeCanvas());

      this.canvas.addEventListener('mousedown', (e) => {
          const mousePos = this.getCanvasCoords(e);
          
          if (e.button === 0) { // Left click
              const clickedControlPoint = this.getControlPointAt(mousePos.x, mousePos.y);
              const clickedNode = this.getNodeAt(mousePos.x, mousePos.y);

              if (clickedControlPoint) {
                  this.draggingControlPoint = clickedControlPoint;
              } else if (clickedNode) {
                  this.draggingNode = clickedNode;
              } else {
                  this.dragging = true;
                  this.dragStart.x = e.clientX - this.offset.x;
                  this.dragStart.y = e.clientY - this.offset.y;
              }
          }
          this.dragged = false;
      });

      this.canvas.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          const mousePos = this.getCanvasCoords(e);
          const clickedControlPoint = this.getControlPointAt(mousePos.x, mousePos.y);

          if (clickedControlPoint) {
              // Right-click to delete a control point
              clickedControlPoint.edge.controlPoints.splice(clickedControlPoint.pointIndex, 1);
          } else {
              const clickedNode = this.getNodeAt(mousePos.x, mousePos.y);
              if (clickedNode) {
                  this.isCreatingEdge = true;
                  this.edgeCreationSource = clickedNode;
              }
          }
      });
      
      this.canvas.addEventListener('mousemove', (e) => {
          this.mousePos = this.getCanvasCoords(e);
          if (this.dragging || this.draggingNode || this.isCreatingEdge || this.draggingControlPoint) {
              this.dragged = true;
          }

          if (this.draggingControlPoint) {
              const point = this.draggingControlPoint.edge.controlPoints[this.draggingControlPoint.pointIndex];
              point.x = this.mousePos.x;
              point.y = this.mousePos.y;
          } else if (this.draggingNode) {
              this.draggingNode.x = this.mousePos.x - (this.draggingNode.x - this.mousePos.x); // simple correction for offset
              this.draggingNode.y = this.mousePos.y - (this.draggingNode.y - this.mousePos.y);
              // A better way would be to store dragNodeOffset on mousedown
              this.draggingNode.x = this.mousePos.x - (160 / 2);
              this.draggingNode.y = this.mousePos.y - (90 / 2);

          } else if (this.dragging) {
              this.offset.x = e.clientX - this.dragStart.x;
              this.offset.y = e.clientY - this.dragStart.y;
          }
      });

      this.canvas.addEventListener('mouseup', (e) => {
          if (this.isCreatingEdge) {
              const targetNode = this.getNodeAt(this.mousePos.x, this.mousePos.y);
              if (targetNode && this.edgeCreationSource) {
                  onEdgeCreated(this.edgeCreationSource, targetNode);
              }
          }
          
          this.dragging = false;
          this.draggingNode = null;
          this.isCreatingEdge = false;
          this.edgeCreationSource = null;
          this.draggingControlPoint = null;

          setTimeout(() => { this.dragged = false; }, 0);
      });

      this.canvas.addEventListener('mouseleave', () => {
          this.dragging = false;
          this.draggingNode = null;
          this.isCreatingEdge = false;
          this.draggingControlPoint = null;
      });
      
      this.canvas.addEventListener('wheel', (e) => {
          e.preventDefault();
          const zoomIntensity = 0.1;
          const wheel = e.deltaY < 0 ? 1 : -1;
          const zoom = Math.exp(wheel * zoomIntensity);
          const rect = this.canvas.getBoundingClientRect();
          const mouseX = e.clientX - rect.left;
          const mouseY = e.clientY - rect.top;
          this.offset.x = mouseX - (mouseX - this.offset.x) * zoom;
          this.offset.y = mouseY - (mouseY - this.offset.y) * zoom;
          this.scale *= zoom;
          this.scale = Math.max(0.1, Math.min(5, this.scale));
      });

      this.canvas.addEventListener('click', onClick);
      this.canvas.addEventListener('dblclick', onDblClick);
  }
}