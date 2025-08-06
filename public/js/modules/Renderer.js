/**
 * AVN Player v2.9 - Renderer Module (Multi-Select & Drag)
 * by Nftxv
 */
export default class Renderer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.graphData = null; this.images = {};
    this.offset = { x: 0, y: 0 }; this.scale = 1.0;
    
    // Interaction states
    this.dragStart = { x: 0, y: 0 }; this.absoluteDragStart = {x: 0, y: 0};
    this.dragged = false;
    this.panning = false;
    this.isDraggingGroup = false;
    this.draggingControlPoint = null;
    this.isCreatingEdge = false;
    this.edgeCreationSource = null;
    this.mousePos = { x: 0, y: 0 };
    this.isEditorMode = false;
    this.isSelecting = false;
    this.selectionBox = {};

    this.resizeCanvas();
    this.renderLoop = this.renderLoop.bind(this);
  }

  // --- Setup & Data ---
  setData(graphData) { this.graphData = graphData; }
  setEditorMode(isEditor) { this.isEditorMode = isEditor; }
  async loadAndRenderAll() { if (!this.graphData) return; await this.loadImages(); this.renderLoop(); }
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

  // --- Helpers ---
  getSourceUrl(source) {
    if (!source) return null;
    if (source.type === 'ipfs') {
      const gateway = this.graphData.meta.gateways?.[0] || 'https://ipfs.io/ipfs/';
      return `${gateway}${source.value}`;
    }
    return source.value;
  }
  getViewportCenter() {
      const worldX = (this.canvas.width / 2 - this.offset.x) / this.scale;
      const worldY = (this.canvas.height / 2 - this.offset.y) / this.scale;
      return { x: worldX, y: worldY };
  }
  getCanvasCoords({ clientX, clientY }) {
      const rect = this.canvas.getBoundingClientRect();
      const x = (clientX - rect.left - this.offset.x) / this.scale;
      const y = (clientY - rect.top - this.offset.y) / this.scale;
      return { x, y };
  }
  resizeCanvas() { this.canvas.width = window.innerWidth; this.canvas.height = window.innerHeight; }
  wasDragged() { return this.dragged; }

  // --- Hit-testing ---
  getNodeAt(x, y) {
    for (let i = this.graphData.nodes.length - 1; i >= 0; i--) {
        const node = this.graphData.nodes[i];
        if (x > node.x && x < node.x + 160 && y > node.y && y < node.y + 90) return node;
    }
    return null;
  }
  getControlPointAt(x, y) {
      const tolerance = 8 / this.scale;
      for (const edge of this.graphData.edges) {
          for (let i = 0; i < (edge.controlPoints || []).length; i++) {
              const point = edge.controlPoints[i];
              if (Math.hypot(x - point.x, y - point.y) < tolerance) return { edge, pointIndex: i };
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
  
  // --- Rendering ---
  renderLoop() {
    if (!this.graphData) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.save();
    this.ctx.translate(this.offset.x, this.offset.y);
    this.ctx.scale(this.scale, this.scale);
    this.graphData.edges.forEach(edge => this.drawEdge(edge));
    this.graphData.nodes.forEach(node => this.drawNode(node));
    if (this.isCreatingEdge) this.drawTemporaryEdge();
    if (this.isSelecting) this._drawSelectionBox();
    this.ctx.restore();
    requestAnimationFrame(this.renderLoop);
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
          ctx.beginPath(); ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
          ctx.fillStyle = color; ctx.fill();
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
  _drawArrow(x, y, angle, color, size) {
      this.ctx.save(); this.ctx.translate(x, y); this.ctx.rotate(angle);
      this.ctx.beginPath(); this.ctx.moveTo(0, 0); this.ctx.lineTo(-size, -size * 0.4);
      this.ctx.lineTo(-size, size * 0.4); this.ctx.closePath(); this.ctx.fillStyle = color; this.ctx.fill();
      this.ctx.restore();
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
  _drawSelectionBox() {
    this.ctx.save();
    this.ctx.fillStyle = "rgba(66, 133, 244, 0.2)";
    this.ctx.strokeStyle = "rgba(66, 133, 244, 0.8)";
    this.ctx.lineWidth = 1 / this.scale;
    const { x1, y1, x2, y2 } = this.selectionBox;
    this.ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
    this.ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
    this.ctx.restore();
  }

  // --- Interaction Handling ---
  setupCanvasInteraction(onClick, onDblClick, onEdgeCreated, onBoxSelect, onDragStart, onDrag) {
    window.addEventListener('resize', () => this.resizeCanvas());
    this.canvas.addEventListener('contextmenu', e => e.preventDefault());

    this.canvas.addEventListener('mousedown', (e) => {
        const mousePos = this.getCanvasCoords(e);
        this.dragged = false;
        this.dragStart = mousePos;
        this.absoluteDragStart = mousePos;

        const button = e.button;
        if (this.isEditorMode) {
            if (button === 1) { this.panning = true; return; }
            if (button === 0) {
                const clickedNode = this.getNodeAt(mousePos.x, mousePos.y);
                if (clickedNode && clickedNode.selected) {
                    this.isDraggingGroup = true;
                    onDragStart();
                    return;
                }
                const cp = this.getControlPointAt(mousePos.x, mousePos.y);
                if (cp) { this.draggingControlPoint = cp; return; }
                const clickedItem = clickedNode || this.getEdgeAt(mousePos.x, mousePos.y);
                if (clickedItem) return; // Let click handler manage selection
                this.isSelecting = true;
                this.selectionBox = { x1: mousePos.x, y1: mousePos.y, x2: mousePos.x, y2: mousePos.y };
            }
        } else { // Player Mode
            if (button === 0) { this.panning = true; }
        }
    });
    
    this.canvas.addEventListener('mousemove', (e) => {
        if (e.buttons === 0) { this.panning = this.isDraggingGroup = this.draggingControlPoint = this.isSelecting = false; return; }
        const currentPos = this.getCanvasCoords(e);
        if(!this.dragged && Math.hypot(currentPos.x - this.dragStart.x, currentPos.y - this.dragStart.y) > 3) {
            this.dragged = true;
        }

        if (this.panning) {
            const dx = currentPos.x - this.dragStart.x;
            const dy = currentPos.y - this.dragStart.y;
            this.offset.x += dx * this.scale;
            this.offset.y += dy * this.scale;
        } else if (this.isDraggingGroup) {
            const dx = currentPos.x - this.absoluteDragStart.x;
            const dy = currentPos.y - this.absoluteDragStart.y;
            onDrag(dx, dy);
        } else if (this.draggingControlPoint) {
            const point = this.draggingControlPoint.edge.controlPoints[this.draggingControlPoint.pointIndex];
            point.x = currentPos.x; point.y = currentPos.y;
        } else if (this.isSelecting) {
            this.selectionBox.x2 = currentPos.x;
            this.selectionBox.y2 = currentPos.y;
        }
    });

    this.canvas.addEventListener('mouseup', (e) => {
        const mousePos = this.getCanvasCoords(e);
        if (this.isSelecting) {
            this.isSelecting = false;
            const box = {
                x: Math.min(this.selectionBox.x1, this.selectionBox.x2),
                y: Math.min(this.selectionBox.y1, this.selectionBox.y2),
                w: Math.abs(this.selectionBox.x1 - this.selectionBox.x2),
                h: Math.abs(this.selectionBox.y1 - this.selectionBox.y2),
            };
            if (box.w > 5 || box.h > 5) {
                const nodesInBox = this.graphData.nodes.filter(n => n.x >= box.x && (n.x + 160) <= (box.x + box.w) && n.y >= box.y && (n.y + 90) <= (box.y + box.h));
                onBoxSelect(nodesInBox, e);
            }
        }
        if (this.isEditorMode && e.button === 2 && !this.dragged) {
            const cp = this.getControlPointAt(mousePos.x, mousePos.y);
            if(cp) { cp.edge.controlPoints.splice(cp.pointIndex, 1); }
            else {
                const node = this.getNodeAt(mousePos.x, mousePos.y);
                if (node) onEdgeCreated(node, null);
            }
        }

        this.panning = this.isDraggingGroup = this.draggingControlPoint = false;
        setTimeout(() => { this.dragged = false; }, 0);
    });
    
    this.canvas.addEventListener('click', onClick);
    this.canvas.addEventListener('dblclick', onDblClick);
    
    this.canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const zoomIntensity = 0.1;
        const wheel = e.deltaY < 0 ? 1 : -1;
        const zoom = Math.exp(wheel * zoomIntensity);
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        this.offset.x -= (mouseX - this.offset.x) * (zoom - 1);
        this.offset.y -= (mouseY - this.offset.y) * (zoom - 1);
        this.scale *= zoom;
        this.scale = Math.max(0.1, Math.min(5, this.scale));
    });
    
    this.canvas.addEventListener('mouseleave', () => {
        this.panning = this.isDraggingGroup = this.draggingControlPoint = this.isSelecting = false;
    });
  }
}