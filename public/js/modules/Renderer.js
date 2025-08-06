/**
 * AVN Player v2.6 - Renderer Module
 * by Nftxv
 */
export default class Renderer {
  // Constructor and setup methods (setData, loadAndRenderAll, etc.) are unchanged
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.nodes = []; this.edges = []; this.meta = {}; this.images = {};
    this.offset = { x: 0, y: 0 }; this.scale = 1.0;
    this.dragStart = { x: 0, y: 0 }; this.dragged = false; this.dragging = false;
    this.draggingNode = null; this.dragNodeOffset = { x: 0, y: 0 };
    this.draggingControlPoint = null; this.isCreatingEdge = false;
    this.edgeCreationSource = null; this.mousePos = { x: 0, y: 0 };
    this.snapThreshold = 10; this.snapLines = [];
    this.resizeCanvas();
    this.renderLoop = this.renderLoop.bind(this);
  }
  setData(nodes, edges, meta) { this.nodes = nodes; this.edges = edges; this.meta = meta; }
  async loadAndRenderAll() { await this.loadImages(); this.renderLoop(); }
  async loadImages() {
    const promises = this.nodes.flatMap(node =>
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
    if (source.type === 'ipfs') {
      const gateway = this.meta.gateways?.[0] || 'https://ipfs.io/ipfs/';
      return `${gateway}${source.value}`;
    }
    return source.value;
  }
  
  // --- Hit-testing Methods ---
  
  getNodeAt(x, y) {
    for (let i = this.nodes.length - 1; i >= 0; i--) {
        const node = this.nodes[i];
        if (x > node.x && x < node.x + 160 && y > node.y && y < node.y + 90) return node;
    }
    return null;
  }

  getControlPointAt(x, y) {
      const tolerance = 8 / this.scale;
      for (const edge of this.edges) {
          for (let i = 0; i < (edge.controlPoints || []).length; i++) {
              const point = edge.controlPoints[i];
              if (Math.hypot(x - point.x, y - point.y) < tolerance) {
                  return { edge, pointIndex: i };
              }
          }
      }
      return null;
  }

  // ** FIX: THIS METHOD NOW USES THE CORRECT PATH FOR HIT-TESTING **
  getEdgeAt(x, y) {
    const tolerance = 10 / this.scale;
    for (const edge of this.edges) {
        const src = this.nodes.find(n => n.id === edge.source);
        const trg = this.nodes.find(n => n.id === edge.target);
        if (!src || !trg) continue;

        const controlPoints = edge.controlPoints || [];
        const startPoint = { x: src.x + 80, y: src.y + 45 };
        const lastPathPoint = controlPoints.length > 0 ? controlPoints.at(-1) : startPoint;
        // Use the same intersection logic as in drawEdge for perfect consistency
        const intersection = this._getIntersectionWithNodeRect(trg, lastPathPoint);
        const pathPoints = [startPoint, ...controlPoints, intersection];

        for (let i = 0; i < pathPoints.length - 1; i++) {
            const p1 = pathPoints[i];
            const p2 = pathPoints[i + 1];
            const len = Math.hypot(p2.x - p1.x, p2.y - p1.y);
            if (len < 1) continue;
            const dot = (((x - p1.x) * (p2.x - p1.x)) + ((y - p1.y) * (p2.y - p1.y))) / (len * len);
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

  // --- Rendering Methods ---

  renderLoop() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.save();
    this.ctx.translate(this.offset.x, this.offset.y);
    this.ctx.scale(this.scale, this.scale);
    this.edges.forEach(edge => this.drawEdge(edge));
    this.nodes.forEach(node => this.drawNode(node));
    if (this.isCreatingEdge) this.drawTemporaryEdge();
    this._drawSnapGuides();
    this.ctx.restore();
    requestAnimationFrame(this.renderLoop);
  }

  drawNode(node) {
    const ctx = this.ctx; const width = 160, height = 90; ctx.save();
    if (node.selected) { ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 4; }
    else if (node.highlighted) { ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 4; }
    else { ctx.strokeStyle = '#4a86e8'; ctx.lineWidth = 2; }
    ctx.fillStyle = '#ffffff'; ctx.beginPath();
    ctx.roundRect(node.x, node.y, width, height, 8); ctx.fill(); ctx.stroke();
    const coverUrl = this.getSourceUrl(node.coverSources?.[0]);
    if (coverUrl && this.images[coverUrl]) { ctx.drawImage(this.images[coverUrl], node.x + 5, node.y + 5, height - 10, height - 10); }
    else { ctx.fillStyle = '#f0f0f0'; ctx.fillRect(node.x + 5, node.y + 5, height - 10, height - 10); }
    ctx.fillStyle = '#000000'; ctx.font = '14px Segoe UI';
    ctx.fillText(node.title, node.x + height, node.y + 25, width - height - 10); ctx.restore();
  }

  drawEdge(edge) {
      const src = this.nodes.find(n => n.id === edge.source);
      const trg = this.nodes.find(n => n.id === edge.target);
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

      // Draw line segments
      ctx.beginPath();
      ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
      for (let i = 1; i < pathPoints.length; i++) ctx.lineTo(pathPoints[i].x, pathPoints[i].y);
      ctx.strokeStyle = color; ctx.lineWidth = lineWidth; ctx.stroke();

      // Draw arrows at each point (except the start)
      for (let i = 1; i < pathPoints.length; i++) {
          const p1 = pathPoints[i-1], p2 = pathPoints[i];
          const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
          this._drawArrow(p2.x, p2.y, angle, color, arrowSize);
      }
      
      // ** FIX: DRAW CONTROL POINT CIRCLES SEPARATELY TO ENSURE THEY ARE VISIBLE **
      controlPoints.forEach(point => {
          ctx.beginPath();
          ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
          ctx.fillStyle = color;
          ctx.fill();
      });
      
      // Draw label
      if (edge.label) {
        const midIndex = Math.floor((pathPoints.length - 2) / 2);
        const p1 = pathPoints[midIndex], p2 = pathPoints[midIndex + 1];
        ctx.font = '12px Segoe UI'; ctx.fillStyle = '#FFFFFF'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        ctx.save();
        ctx.translate((p1.x + p2.x)/2, (p1.y + p2.y)/2);
        const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        if (angle > Math.PI / 2 || angle < -Math.PI / 2) ctx.rotate(angle + Math.PI);
        else ctx.rotate(angle);
        ctx.fillText(edge.label, 0, -8);
        ctx.restore();
      }
      ctx.restore();
  }
      
  _drawArrow(x, y, angle, color, size) {
      this.ctx.save(); this.ctx.translate(x, y); this.ctx.rotate(angle);
      this.ctx.beginPath(); this.ctx.moveTo(0, 0);
      this.ctx.lineTo(-size, -size * 0.4);
      this.ctx.lineTo(-size, size * 0.4);
      this.ctx.closePath(); this.ctx.fillStyle = color; this.ctx.fill();
      this.ctx.restore();
  }

  _getIntersectionWithNodeRect(node, externalPoint) {
      const w = 160, h = 90; const halfW = w / 2, halfH = h / 2;
      const cx = node.x + halfW, cy = node.y + halfH;
      const dx = externalPoint.x - cx, dy = externalPoint.y - cy;
      if (dx === 0 && dy === 0) return {x: cx, y: cy};
      const angle = Math.atan2(dy, dx);
      const tan = Math.tan(angle);
      let x, y;
      if (Math.abs(halfH * dx) > Math.abs(halfW * dy)) {
          x = cx + Math.sign(dx) * halfW; y = cy + Math.sign(dx) * halfW * tan;
      } else {
          y = cy + Math.sign(dy) * halfH; x = cx + Math.sign(dy) * halfH / tan;
      }
      return { x, y };
  }
  
  // All other methods (temp edge, highlight, coords, resize, snapping, interaction) are unchanged
  drawTemporaryEdge() {
    const ctx = this.ctx; const startX = this.edgeCreationSource.x + 80; const startY = this.edgeCreationSource.y + 45;
    ctx.save(); ctx.beginPath(); ctx.moveTo(startX, startY); ctx.lineTo(this.mousePos.x, this.mousePos.y);
    ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 3; ctx.setLineDash([5, 5]); ctx.stroke(); ctx.restore();
  }
  highlight(currentId, prevId = null, edge = null) {
      this.nodes.forEach(n => n.highlighted = false); this.edges.forEach(e => e.highlighted = false);
      if (currentId) { const node = this.nodes.find(n => n.id === currentId); if (node) node.highlighted = true; }
      if (edge) { const e = this.edges.find(i => i.source === edge.source && i.target === edge.target); if (e) e.highlighted = true; }
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
      let snappedPos = { ...pos }; this.snapLines = []; const threshold = this.snapThreshold / this.scale;
      const snapTargets = [];
      this.nodes.forEach(n => {
          if (n !== ignoredEntity) snapTargets.push({ x: n.x, y: n.y, w: 160, h: 90, type: 'node' });
      });
      (this.edges || []).forEach(e => {
          (e.controlPoints || []).forEach(p => { if (p !== ignoredEntity) snapTargets.push({ x: p.x, y: p.y, type: 'point' }); });
      });
      let snapX = false, snapY = false;
      for (const target of snapTargets) {
          if (target.type === 'node') {
              if (Math.abs(pos.x - (target.x + target.w / 2)) < threshold) { snappedPos.x = target.x + target.w / 2; snapX = true; }
              if (Math.abs(pos.y - (target.y + target.h / 2)) < threshold) { snappedPos.y = target.y + target.h / 2; snapY = true; }
          } else {
              if (Math.abs(pos.x - target.x) < threshold) { snappedPos.x = target.x; snapX = true; }
              if (Math.abs(pos.y - target.y) < threshold) { snappedPos.y = target.y; snapY = true; }
          }
      }
      if (snapX) this.snapLines.push({ type: 'v', pos: snappedPos.x });
      if (snapY) this.snapLines.push({ type: 'h', pos: snappedPos.y });
      return snappedPos;
  }
  _drawSnapGuides() {
      const ctx = this.ctx; ctx.save(); ctx.strokeStyle = 'rgba(255, 0, 255, 0.7)'; ctx.lineWidth = 1 / this.scale;
      ctx.setLineDash([5 / this.scale, 5 / this.scale]);
      this.snapLines.forEach(line => {
          ctx.beginPath();
          if (line.type === 'v') { ctx.moveTo(line.pos, -this.offset.y / this.scale); ctx.lineTo(line.pos, (this.canvas.height - this.offset.y) / this.scale); }
          else { ctx.moveTo(-this.offset.x / this.scale, line.pos); ctx.lineTo((this.canvas.width - this.offset.x) / this.scale, line.pos); }
          ctx.stroke();
      });
      ctx.restore();
  }
  setupCanvasInteraction(onClick, onDblClick, onEdgeCreated) {
    window.addEventListener('resize', () => this.resizeCanvas());
    this.canvas.addEventListener('contextmenu', e => e.preventDefault());
    this.canvas.addEventListener('mousedown', (e) => {
        const mousePos = this.getCanvasCoords(e); this.dragged = false;
        if (e.button === 0) {
            const cp = this.getControlPointAt(mousePos.x, mousePos.y); if (cp) { this.draggingControlPoint = cp; return; }
            const node = this.getNodeAt(mousePos.x, mousePos.y); if (node) { this.draggingNode = node; this.dragNodeOffset.x = mousePos.x - node.x; this.dragNodeOffset.y = mousePos.y - node.y; return; }
            this.dragging = true; this.dragStart.x = e.clientX - this.offset.x; this.dragStart.y = e.clientY - this.offset.y;
        } else if (e.button === 2) {
            const cp = this.getControlPointAt(mousePos.x, mousePos.y);
            if (cp) { if (!cp.edge.controlPoints) cp.edge.controlPoints = []; cp.edge.controlPoints.splice(cp.pointIndex, 1); }
            else { const node = this.getNodeAt(mousePos.x, mousePos.y); if (node) { this.isCreatingEdge = true; this.edgeCreationSource = node; } }
        }
    });
    this.canvas.addEventListener('mousemove', (e) => {
        this.mousePos = this.getCanvasCoords(e);
        if (e.buttons === 0) { this.dragging = this.draggingNode = this.draggingControlPoint = this.isCreatingEdge = false; this.snapLines = []; return; }
        this.dragged = true;
        if (this.draggingNode) {
            let centerPos = { x: this.mousePos.x - this.dragNodeOffset.x + 80, y: this.mousePos.y - this.dragNodeOffset.y + 45 };
            let snappedCenter = this._getSnappedPosition(centerPos, this.draggingNode);
            this.draggingNode.x = snappedCenter.x - 80; this.draggingNode.y = snappedCenter.y - 45;
        } else if (this.draggingControlPoint) {
            const point = this.draggingControlPoint.edge.controlPoints[this.draggingControlPoint.pointIndex];
            const snappedPos = this._getSnappedPosition(this.mousePos, point);
            point.x = snappedPos.x; point.y = snappedPos.y;
        } else if (this.dragging) {
            this.offset.x = e.clientX - this.dragStart.x; this.offset.y = e.clientY - this.dragStart.y; this.snapLines = [];
        }
    });
    this.canvas.addEventListener('mouseup', (e) => {
        if (this.isCreatingEdge && e.button === 2) {
            const targetNode = this.getNodeAt(this.mousePos.x, this.mousePos.y);
            if (targetNode && this.edgeCreationSource && targetNode.id !== this.edgeCreationSource.id) { onEdgeCreated(this.edgeCreationSource, targetNode); }
        }
        this.dragging = this.draggingNode = this.draggingControlPoint = this.isCreatingEdge = false; this.snapLines = [];
        setTimeout(() => { this.dragged = false; }, 0);
    });
    this.canvas.addEventListener('mouseleave', () => { if (this.dragging || this.draggingNode || this.draggingControlPoint || this.isCreatingEdge) { this.dragging = this.draggingNode = this.draggingControlPoint = this.isCreatingEdge = false; this.snapLines = []; } });
    this.canvas.addEventListener('wheel', (e) => {
        e.preventDefault(); const zoomIntensity = 0.1; const wheel = e.deltaY < 0 ? 1 : -1; const zoom = Math.exp(wheel * zoomIntensity);
        const rect = this.canvas.getBoundingClientRect(); this.offset.x -= (e.clientX - rect.left - this.offset.x) * (zoom - 1);
        this.offset.y -= (e.clientY - rect.top - this.offset.y) * (zoom - 1);
        this.scale *= zoom; this.scale = Math.max(0.1, Math.min(5, this.scale));
    });
    this.canvas.addEventListener('click', onClick); this.canvas.addEventListener('dblclick', onDblClick);
  }
}