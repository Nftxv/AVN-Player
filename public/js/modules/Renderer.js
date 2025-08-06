/**
 * AVN Player v2.8 - Renderer Module with Multi-Select
 * by Nftxv
 */
export default class Renderer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    
    this.graphData = null; 
    this.images = {};

    // View & camera state
    this.offset = { x: 0, y: 0 }; this.scale = 1.0;
    
    // Interaction state
    this.dragStart = { x: 0, y: 0 }; this.dragged = false; this.dragging = false;
    this.draggingNode = null; this.dragNodeOffset = { x: 0, y: 0 };
    this.draggingControlPoint = null; this.isCreatingEdge = false;
    this.edgeCreationSource = null; this.mousePos = { x: 0, y: 0 };
    this.snapThreshold = 10; this.snapLines = [];

    // NEW: Marquee selection state
    this.isMarqueeSelecting = false;
    this.marqueeRect = { x: 0, y: 0, w: 0, h: 0 };
    this.isDraggingSelection = false; // To drag multiple nodes

    this.resizeCanvas();
    this.renderLoop = this.renderLoop.bind(this);
  }

  setData(graphData) {
    this.graphData = graphData;
  }

  async loadAndRenderAll() {
    if (!this.graphData) return;
    await this.loadImages();
    this.renderLoop();
  }

  async loadImages() {
    const promises = this.graphData.nodes.flatMap(node =>
      (node.coverSources || []).map(async source => {
        const url = this.getSourceUrl(source);
        if (url && !this.images[url]) {
          try {
            const img = new Image(); img.src = url;
            await img.decode(); this.images[url] = img;
          } catch (e) { console.warn(`Failed to load cover image: ${url}`, e); }
        }
      })
    );
    await Promise.all(promises);
  }

  getSourceUrl(source) {
    if (!source) return null;
    const gateway = this.graphData.meta.gateways?.[0] || 'https://ipfs.io/ipfs/';
    return source.type === 'ipfs' ? `${gateway}${source.value}` : source.value;
  }
  
  getViewportCenter() {
      const worldX = (this.canvas.width / 2 - this.offset.x) / this.scale;
      const worldY = (this.canvas.height / 2 - this.offset.y) / this.scale;
      return { x: worldX, y: worldY };
  }
  
  getNodeAt(x, y) {
    for (let i = this.graphData.nodes.length - 1; i >= 0; i--) {
        const node = this.graphData.nodes[i];
        if (x > node.x && x < node.x + 160 && y > node.y && y < node.y + 90) return node;
    }
    return null;
  }
  
  // NEW: Get all nodes inside a given rectangle
  getNodesInRect(rect) {
    const normalizedRect = this.normalizeRect(rect);
    return this.graphData.nodes.filter(node => {
        return (
            node.x >= normalizedRect.x &&
            node.y >= normalizedRect.y &&
            node.x + 160 <= normalizedRect.x + normalizedRect.w &&
            node.y + 90 <= normalizedRect.y + normalizedRect.h
        );
    });
  }

  // NEW: Get all edges fully inside a given rectangle (both nodes must be inside)
  getEdgesInRect(rect, nodesInRect) {
      const nodeIdsInRect = new Set(nodesInRect.map(n => n.id));
      return this.graphData.edges.filter(edge => {
          return nodeIdsInRect.has(edge.source) && nodeIdsInRect.has(edge.target);
      });
  }
  
  normalizeRect(rect) {
      return {
          x: rect.w < 0 ? rect.x + rect.w : rect.x,
          y: rect.h < 0 ? rect.y + rect.h : rect.y,
          w: Math.abs(rect.w),
          h: Math.abs(rect.h)
      };
  }

  getControlPointAt(x, y) {
      const tolerance = 8 / this.scale;
      for (const edge of this.graphData.edges) {
          for (let i = 0; i < (edge.controlPoints || []).length; i++) {
              const point = edge.controlPoints[i];
              if (Math.hypot(x - point.x, y - point.y) < tolerance) {
                  return { edge, pointIndex: i };
              }
          }
      }
      return null;
  }

  getEdgeAt(x, y) {
    const tolerance = 10 / this.scale;
    for (const edge of this.graphData.edges) {
        const src = this.graphData.nodes.find(n => n.id === edge.source);
        const trg = this.graphData.nodes.find(n => n.id === edge.target);
        if (!src || !trg) continue;
        const controlPoints = edge.controlPoints || [];
        const startPoint = { x: src.x + 80, y: src.y + 45 };
        const lastPathPoint = controlPoints.length > 0 ? controlPoints.at(-1) : startPoint;
        const intersection = this._getIntersectionWithNodeRect(trg, lastPathPoint);
        const pathPoints = [startPoint, ...controlPoints, intersection];
        for (let i = 0; i < pathPoints.length - 1; i++) {
            const p1 = pathPoints[i], p2 = pathPoints[i + 1];
            const len = Math.hypot(p2.x - p1.x, p2.y - p1.y);
            if (len < 1) continue;
            const dot = (((x - p1.x) * (p2.x - p1.x)) + ((y - p1.y) * (p2.y - p1.y))) / (len * len);
            if (dot >= 0 && dot <= 1) {
                const closestX = p1.x + (dot * (p2.x - p1.x));
                const closestY = p1.y + (dot * (p2.y - p1.y));
                if (Math.hypot(x - closestX, y - closestY) < tolerance) return edge;
            }
        }
    }
    return null;
  }

  renderLoop() {
    if (!this.graphData) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.save();
    this.ctx.translate(this.offset.x, this.offset.y);
    this.ctx.scale(this.scale, this.scale);
    
    this.graphData.edges.forEach(edge => this.drawEdge(edge));
    this.graphData.nodes.forEach(node => this.drawNode(node));
    if (this.isCreatingEdge) this.drawTemporaryEdge();
    if (this.isMarqueeSelecting) this.drawMarquee(); // NEW
    
    this._drawSnapGuides();
    this.ctx.restore();
    requestAnimationFrame(this.renderLoop);
  }

  drawEdge(edge) {
      const src = this.graphData.nodes.find(n => n.id === edge.source);
      const trg = this.graphData.nodes.find(n => n.id === edge.target);
      if (!src || !trg) return;
      const ctx = this.ctx; ctx.save();
      let color = edge.color || '#888888';
      if (edge.selected) color = '#e74c3c';
      if (edge.highlighted) color = '#FFD700';
      const edgeLineWidth = edge.lineWidth || 2;
      const lineWidth = edge.selected || edge.highlighted ? edgeLineWidth + 1 : edgeLineWidth;
      const arrowSize = 6 + edgeLineWidth * 2.5;
      const controlPoints = edge.controlPoints || [];
      const startPoint = { x: src.x + 80, y: src.y + 45 };
      const lastPathPoint = controlPoints.length > 0 ? controlPoints.at(-1) : startPoint;
      const intersection = this._getIntersectionWithNodeRect(trg, lastPathPoint);
      const pathPoints = [startPoint, ...controlPoints, intersection];
      ctx.beginPath();
      ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
      for (let i = 1; i < pathPoints.length; i++) ctx.lineTo(pathPoints[i].x, pathPoints[i].y);
      ctx.strokeStyle = color; ctx.lineWidth = lineWidth; ctx.stroke();
      for (let i = 1; i < pathPoints.length; i++) {
          const p1 = pathPoints[i-1], p2 = pathPoints[i];
          const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
          this._drawArrow(p2.x, p2.y, angle, color, arrowSize);
      }
      controlPoints.forEach(point => {
          ctx.beginPath();
          ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
          ctx.fillStyle = color;
          ctx.fill();
      });
      if (edge.label) {
        const midIndex = Math.floor((pathPoints.length - 2) / 2);
        const p1 = pathPoints[midIndex], p2 = pathPoints[midIndex + 1];
        ctx.font = '12px Segoe UI'; ctx.fillStyle = '#FFFFFF'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        ctx.save();
        ctx.translate((p1.x + p2.x)/2, (p1.y + p2.y)/2);
        const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        if (angle > Math.PI / 2 || angle < -Math.PI / 2) ctx.rotate(angle + Math.PI); else ctx.rotate(angle);
        ctx.fillText(edge.label, 0, -8);
        ctx.restore();
      }
      ctx.restore();
  }
  
  drawNode(node) {
    const ctx = this.ctx; const width = 160, height = 90; ctx.save();
    if (node.selected) { ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 4; }
    else if (node.highlighted) { ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 4; }
    else { ctx.strokeStyle = '#4a86e8'; ctx.lineWidth = 2; }
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.roundRect(node.x, node.y, width, height, 8); ctx.fill(); ctx.stroke();
    const coverUrl = this.getSourceUrl(node.coverSources?.[0]);
    if (coverUrl && this.images[coverUrl]) { ctx.drawImage(this.images[coverUrl], node.x + 5, node.y + 5, height - 10, height - 10); }
    else { ctx.fillStyle = '#f0f0f0'; ctx.fillRect(node.x + 5, node.y + 5, height - 10, height - 10); }
    ctx.fillStyle = '#000000'; ctx.font = '14px Segoe UI';
    ctx.fillText(node.title, node.x + height, node.y + 25, width - height - 10); ctx.restore();
  }
  
  // NEW: Renders the selection rectangle
  drawMarquee() {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = 'rgba(70, 130, 180, 0.2)'; // SteelBlue with transparency
    ctx.fillRect(this.marqueeRect.x, this.marqueeRect.y, this.marqueeRect.w, this.marqueeRect.h);
    ctx.strokeStyle = 'rgba(70, 130, 180, 0.8)';
    ctx.lineWidth = 1 / this.scale;
    ctx.setLineDash([5 / this.scale, 3 / this.scale]);
    ctx.strokeRect(this.marqueeRect.x, this.marqueeRect.y, this.marqueeRect.w, this.marqueeRect.h);
    ctx.restore();
  }

  _drawArrow(x, y, angle, color, size) {
      this.ctx.save(); this.ctx.translate(x, y); this.ctx.rotate(angle);
      this.ctx.beginPath(); this.ctx.moveTo(0, 0); this.ctx.lineTo(-size, -size * 0.4);
      this.ctx.lineTo(-size, size * 0.4); this.ctx.closePath(); this.ctx.fillStyle = color; this.ctx.fill(); this.ctx.restore();
  }
  _getIntersectionWithNodeRect(node, externalPoint) {
      const w = 160, h = 90; const halfW = w / 2, halfH = h / 2;
      const cx = node.x + halfW, cy = node.y + halfH;
      const dx = externalPoint.x - cx, dy = externalPoint.y - cy;
      if (dx === 0 && dy === 0) return {x: cx, y: cy};
      const angle = Math.atan2(dy, dx);
      const tan = Math.tan(angle); let x, y;
      if (Math.abs(halfH * dx) > Math.abs(halfW * dy)) { x = cx + Math.sign(dx) * halfW; y = cy + Math.sign(dx) * halfW * tan; }
      else { y = cy + Math.sign(dy) * halfH; x = cx + Math.sign(dy) * halfH / tan; }
      return { x, y };
  }
  drawTemporaryEdge() {
    const ctx = this.ctx; const startX = this.edgeCreationSource.x + 80; const startY = this.edgeCreationSource.y + 45;
    ctx.save(); ctx.beginPath(); ctx.moveTo(startX, startY); ctx.lineTo(this.mousePos.x, this.mousePos.y);
    ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 3; ctx.setLineDash([5, 5]); ctx.stroke(); ctx.restore();
  }
  highlight(currentId, prevId = null, edge = null) {
      this.graphData.nodes.forEach(n => n.highlighted = false); this.graphData.edges.forEach(e => e.highlighted = false);
      if (currentId) { const node = this.graphData.nodes.find(n => n.id === currentId); if (node) node.highlighted = true; }
      if (edge) { const e = this.graphData.edges.find(i => i === edge); if (e) e.highlighted = true; }
  }
  getCanvasCoords({ clientX, clientY }) {
      const rect = this.canvas.getBoundingClientRect();
      const x = (clientX - rect.left - this.offset.x) / this.scale;
      const y = (clientY - rect.top - this.offset.y) / this.scale;
      return { x, y };
  }
  resizeCanvas() { this.canvas.width = window.innerWidth; this.canvas.height = window.innerHeight; }
  wasDragged() { return this.dragged; }
  _getSnappedPosition(pos, ignoredEntity = null) {
      // Snapping logic remains the same
      // ...
  }
  _drawSnapGuides() {
      // Snap guide drawing logic remains the same
      // ...
  }
  
  // HEAVILY MODIFIED: New interaction logic
  setupCanvasInteraction(callbacks) {
    const { onClick, onDblClick, onEdgeCreated, onMarqueeSelect, getSelection } = callbacks;

    window.addEventListener('resize', () => this.resizeCanvas());
    this.canvas.addEventListener('contextmenu', e => e.preventDefault());
    
    this.canvas.addEventListener('mousedown', (e) => {
        const mousePos = this.getCanvasCoords(e);
        this.dragged = false;
        
        // Middle mouse button (wheel click) for panning
        if (e.button === 1) {
            this.dragging = true;
            this.dragStart.x = e.clientX - this.offset.x;
            this.dragStart.y = e.clientY - this.offset.y;
            this.canvas.style.cursor = 'grabbing';
            return;
        }

        if (e.button === 0) { // Left-click
            const cp = this.getControlPointAt(mousePos.x, mousePos.y);
            if (cp) { this.draggingControlPoint = cp; return; }
            
            const node = this.getNodeAt(mousePos.x, mousePos.y);
            if (node) {
                // If clicked node is part of a selection, prepare to drag the whole selection
                if (node.selected) {
                    this.isDraggingSelection = true;
                }
                this.draggingNode = node; // Still track the primary node for reference
                this.dragNodeOffset.x = mousePos.x - node.x;
                this.dragNodeOffset.y = mousePos.y - node.y;
                return;
            }
            
            // If nothing was clicked, start marquee selection
            this.isMarqueeSelecting = true;
            this.marqueeRect = { x: mousePos.x, y: mousePos.y, w: 0, h: 0 };
        } else if (e.button === 2) { // Right-click for edge creation / point deletion
            const cp = this.getControlPointAt(mousePos.x, mousePos.y);
            if (cp) {
                if (!cp.edge.controlPoints) cp.edge.controlPoints = [];
                cp.edge.controlPoints.splice(cp.pointIndex, 1);
            } else {
                const node = this.getNodeAt(mousePos.x, mousePos.y);
                if (node) {
                    this.isCreatingEdge = true;
                    this.edgeCreationSource = node;
                }
            }
        }
    });

    this.canvas.addEventListener('mousemove', (e) => {
        this.mousePos = this.getCanvasCoords(e);
        if (e.buttons === 0) { // No buttons pressed, reset all states
             this.dragging = this.draggingNode = this.draggingControlPoint = this.isCreatingEdge = this.isMarqueeSelecting = this.isDraggingSelection = false;
             this.canvas.style.cursor = 'grab';
             this.snapLines = [];
             return;
        }
        
        this.dragged = true;

        if (this.dragging) { // Panning with middle mouse
            this.offset.x = e.clientX - this.dragStart.x;
            this.offset.y = e.clientY - this.dragStart.y;
        } else if (this.isDraggingSelection) { // Dragging a group of selected nodes
             const dx = (this.mousePos.x - this.dragNodeOffset.x) - this.draggingNode.x;
             const dy = (this.mousePos.y - this.dragNodeOffset.y) - this.draggingNode.y;
             getSelection().forEach(entity => {
                if (entity.x !== undefined && entity.y !== undefined) { // Is a node
                    entity.x += dx;
                    entity.y += dy;
                }
             });
        } else if (this.draggingNode) { // Dragging a single, unselected node
            this.draggingNode.x = this.mousePos.x - this.dragNodeOffset.x;
            this.draggingNode.y = this.mousePos.y - this.dragNodeOffset.y;
        } else if (this.draggingControlPoint) {
            const point = this.draggingControlPoint.edge.controlPoints[this.draggingControlPoint.pointIndex];
            point.x = this.mousePos.x;
            point.y = this.mousePos.y;
        } else if (this.isMarqueeSelecting) {
            this.marqueeRect.w = this.mousePos.x - this.marqueeRect.x;
            this.marqueeRect.h = this.mousePos.y - this.marqueeRect.y;
        }
    });

    this.canvas.addEventListener('mouseup', (e) => {
        // Handle marquee selection completion
        if (this.isMarqueeSelecting) {
            const normalizedRect = this.normalizeRect(this.marqueeRect);
            // Only trigger if the box has a meaningful size
            if (normalizedRect.w > 5 || normalizedRect.h > 5) {
                onMarqueeSelect(this.marqueeRect, e.ctrlKey, e.shiftKey);
            }
        }
        
        // Handle edge creation
        if (this.isCreatingEdge && e.button === 2) {
            const targetNode = this.getNodeAt(this.mousePos.x, this.mousePos.y);
            if (targetNode && this.edgeCreationSource && targetNode.id !== this.edgeCreationSource.id) {
                onEdgeCreated(this.edgeCreationSource, targetNode);
            }
        }
        
        // Reset all dragging/action states
        this.dragging = this.draggingNode = this.draggingControlPoint = this.isCreatingEdge = this.isMarqueeSelecting = this.isDraggingSelection = false;
        this.canvas.style.cursor = 'grab';
        this.snapLines = [];
        
        // Delay resetting dragged flag to distinguish from click
        setTimeout(() => { this.dragged = false; }, 0);
    });

    this.canvas.addEventListener('mouseleave', () => {
        if (this.dragging || this.draggingNode || this.draggingControlPoint || this.isCreatingEdge || this.isMarqueeSelecting) {
            this.dragging = this.draggingNode = this.draggingControlPoint = this.isCreatingEdge = this.isMarqueeSelecting = this.isDraggingSelection = false;
            this.canvas.style.cursor = 'grab';
            this.snapLines = [];
        }
    });
    
    this.canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const zoomIntensity = 0.1;
        const wheel = e.deltaY < 0 ? 1 : -1;
        const zoom = Math.exp(wheel * zoomIntensity);
        const rect = this.canvas.getBoundingClientRect();
        this.offset.x -= (e.clientX - rect.left - this.offset.x) * (zoom - 1);
        this.offset.y -= (e.clientY - rect.top - this.offset.y) * (zoom - 1);
        this.scale *= zoom;
        this.scale = Math.max(0.1, Math.min(5, this.scale));
    });

    this.canvas.addEventListener('click', onClick);
    this.canvas.addEventListener('dblclick', onDblClick);
  }
}