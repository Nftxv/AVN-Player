/**
 * AVN Player v2.4 - Renderer Module
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
    this.dragged = false;
    this.dragging = false; // For canvas panning
    this.draggingNode = null;
    this.dragNodeOffset = { x: 0, y: 0 };
    this.draggingControlPoint = null; // { edge, pointIndex }

    // Edge creation state
    this.isCreatingEdge = false;
    this.edgeCreationSource = null;
    this.mousePos = { x: 0, y: 0 };

    // Snapping state
    this.snapThreshold = 10;
    this.snapLines = [];

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
    if (!source) return null;
    if (source.type === 'ipfs') {
      const gateway = this.meta.gateways?.[0] || 'https://ipfs.io/ipfs/';
      return `${gateway}${source.value}`;
    }
    return source.value;
  }
  
  getNodeAt(x, y) {
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

  getEdgeAt(x, y) {
    const tolerance = 10 / this.scale;
    for (const edge of this.edges) {
        const src = this.nodes.find(n => n.id === edge.source);
        const trg = this.nodes.find(n => n.id === edge.target);
        if (!src || !trg) continue;

        const pathPoints = [
            { x: src.x + 80, y: src.y + 45 },
            ...(edge.controlPoints || []),
            { x: trg.x + 80, y: trg.y + 45 }
        ];

        for (let i = 0; i < pathPoints.length - 1; i++) {
            const p1 = pathPoints[i];
            const p2 = pathPoints[i + 1];
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
    
    this._drawSnapGuides();

    this.ctx.restore();
    requestAnimationFrame(this.renderLoop);
  }

  drawNode(node) {
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
    ctx.roundRect(node.x, node.y, width, height, 8);
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
          { x: src.x + 160 / 2, y: src.y + 90 / 2 },
          ...(edge.controlPoints || []),
      ];

      // Draw segments between control points
      ctx.beginPath();
      ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
      for (let i = 1; i < pathPoints.length; i++) {
          ctx.lineTo(pathPoints[i].x, pathPoints[i].y);
      }

      // Draw the final segment to the node border
      const lastPoint = pathPoints[pathPoints.length - 1];
      const targetCenter = { x: trg.x + 160 / 2, y: trg.y + 90 / 2 };
      const intersection = this._getIntersectionWithNodeRect(lastPoint, targetCenter, trg);
      ctx.lineTo(intersection.x, intersection.y);

      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.stroke();

      // Draw arrows and control points
      for (let i = 1; i < pathPoints.length; i++) {
          const p1 = pathPoints[i-1];
          const p2 = pathPoints[i];
          const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
          this._drawArrow(p2.x, p2.y, angle, color); // Arrow at control point
          
          ctx.beginPath();
          ctx.arc(p2.x, p2.y, 5, 0, 2 * Math.PI);
          ctx.fillStyle = color;
          ctx.fill();
      }
      
      // Draw the final arrow on the node border
      const finalAngle = Math.atan2(intersection.y - lastPoint.y, intersection.x - lastPoint.x);
      this._drawArrow(intersection.x, intersection.y, finalAngle, color);
      
      // Draw label
      if (edge.label) {
        const midIndex = Math.floor((pathPoints.length - 1) / 2);
        const midPoint1 = pathPoints[midIndex];
        const midPoint2 = (pathPoints.length > 1) ? pathPoints[midIndex + 1] : targetCenter;
        
        ctx.font = '12px Segoe UI';
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(edge.label, (midPoint1.x + midPoint2.x) / 2, (midPoint1.y + midPoint2.y) / 2 - 8);
      }
      
      ctx.restore();
  }
      
  _drawArrow(x, y, angle, color) {
      const size = 10;
      this.ctx.save();
      this.ctx.translate(x, y);
      this.ctx.rotate(angle);
      this.ctx.beginPath();
      this.ctx.moveTo(0, 0);
      this.ctx.lineTo(-size, -size / 2);
      this.ctx.lineTo(-size, size / 2);
      this.ctx.closePath();
      this.ctx.fillStyle = color;
      this.ctx.fill();
      this.ctx.restore();
  }

  _getIntersectionWithNodeRect(p1, p2, node) {
      const w = 160, h = 90;
      const cx = node.x + w / 2;
      const cy = node.y + h / 2;
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      
      if (dx === 0 && dy === 0) return { x: cx, y: cy };

      const angle = Math.atan2(dy, dx);
      const tan = Math.tan(angle);

      const h_x = w / 2 - 8; // Subtract radius for better accuracy
      const h_y = h / 2 - 8;

      let finalX = cx, finalY = cy;

      if (Math.abs(dy) < Math.abs(dx) * (h_y / h_x)) {
          finalX = cx + Math.sign(dx) * h_x;
          finalY = cy + Math.sign(dx) * h_x * tan;
      } else {
          finalY = cy + Math.sign(dy) * h_y;
          finalX = cx + Math.sign(dy) * h_y / tan;
      }
      return { x: finalX, y: finalY };
  }

  drawTemporaryEdge() {
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

  // --- SNAPPING LOGIC ---

  _getSnappedPosition(pos, ignoredEntity = null) {
      let snappedPos = { ...pos };
      this.snapLines = [];

      const checkAndSnap = (val, targetVal, axis) => {
          if (Math.abs(val - targetVal) < this.snapThreshold / this.scale) {
              if (axis === 'x') {
                  snappedPos.x = targetVal;
                  this.snapLines.push({ type: 'v', pos: targetVal });
              } else {
                  snappedPos.y = targetVal;
                  this.snapLines.push({ type: 'h', pos: targetVal });
              }
              return true;
          }
          return false;
      };

      const snapTargets = [];
      this.nodes.forEach(n => {
          if (n !== ignoredEntity) snapTargets.push({ x: n.x + 160 / 2, y: n.y + 90 / 2 });
      });
      this.edges.forEach(e => {
          (e.controlPoints || []).forEach(p => {
              if (p !== ignoredEntity) snapTargets.push(p);
          });
      });

      for (const target of snapTargets) {
          checkAndSnap(pos.x, target.x, 'x');
          checkAndSnap(pos.y, target.y, 'y');
      }
      return snappedPos;
  }

  _drawSnapGuides() {
      const ctx = this.ctx;
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 0, 255, 0.7)';
      ctx.lineWidth = 1 / this.scale;
      ctx.setLineDash([5 / this.scale, 5 / this.scale]);
      
      this.snapLines.forEach(line => {
          ctx.beginPath();
          if (line.type === 'v') {
              ctx.moveTo(line.pos, -this.offset.y / this.scale);
              ctx.lineTo(line.pos, (this.canvas.height - this.offset.y) / this.scale);
          } else {
              ctx.moveTo(-this.offset.x / this.scale, line.pos);
              ctx.lineTo((this.canvas.width - this.offset.x) / this.scale, line.pos);
          }
          ctx.stroke();
      });
      ctx.restore();
  }


  setupCanvasInteraction(onClick, onDblClick, onEdgeCreated) {
      window.addEventListener('resize', () => this.resizeCanvas());

      this.canvas.addEventListener('mousedown', (e) => {
          if (e.button !== 0 && e.button !== 2) return;
          const mousePos = this.getCanvasCoords(e);
          
          if (e.button === 0) { // Left click
              const clickedControlPoint = this.getControlPointAt(mousePos.x, mousePos.y);
              const clickedNode = this.getNodeAt(mousePos.x, mousePos.y);

              if (clickedControlPoint) {
                  this.draggingControlPoint = clickedControlPoint;
              } else if (clickedNode) {
                  this.draggingNode = clickedNode;
                  this.dragNodeOffset.x = mousePos.x - clickedNode.x;
                  this.dragNodeOffset.y = mousePos.y - clickedNode.y;
              } else {
                  this.dragging = true;
                  this.dragStart.x = e.clientX - this.offset.x;
                  this.dragStart.y = e.clientY - this.offset.y;
              }
          }
          
          if (e.button === 2) { // Right click for context menu
              e.preventDefault();
              const clickedControlPoint = this.getControlPointAt(mousePos.x, mousePos.y);
              if (clickedControlPoint) {
                  clickedControlPoint.edge.controlPoints.splice(clickedControlPoint.pointIndex, 1);
              } else {
                  const clickedNode = this.getNodeAt(mousePos.x, mousePos.y);
                  if (clickedNode) {
                      this.isCreatingEdge = true;
                      this.edgeCreationSource = clickedNode;
                  }
              }
          }
          this.dragged = false;
      });
      
      this.canvas.addEventListener('mousemove', (e) => {
          this.mousePos = this.getCanvasCoords(e);
          if (e.buttons === 0) { // If no button is pressed, reset dragging states
              this.dragging = this.draggingNode = this.draggingControlPoint = null;
              this.snapLines = [];
              return;
          }

          if (this.dragging || this.draggingNode || this.isCreatingEdge || this.draggingControlPoint) {
              this.dragged = true;
          }

          if (this.draggingNode) {
              let newPos = { 
                  x: this.mousePos.x - this.dragNodeOffset.x, 
                  y: this.mousePos.y - this.dragNodeOffset.y
              };
              // Snap center of the node, not top-left corner
              let centerPos = { x: newPos.x + 160 / 2, y: newPos.y + 90 / 2 };
              let snappedCenter = this._getSnappedPosition(centerPos, this.draggingNode);
              
              this.draggingNode.x = snappedCenter.x - 160 / 2;
              this.draggingNode.y = snappedCenter.y - 90 / 2;

          } else if (this.draggingControlPoint) {
              const point = this.draggingControlPoint.edge.controlPoints[this.draggingControlPoint.pointIndex];
              const snappedPos = this._getSnappedPosition(this.mousePos, point);
              point.x = snappedPos.x;
              point.y = snappedPos.y;
          
          } else if (this.dragging) {
              this.offset.x = e.clientX - this.dragStart.x;
              this.offset.y = e.clientY - this.dragStart.y;
              this.snapLines = [];
          }
      });

      this.canvas.addEventListener('mouseup', (e) => {
          if (this.isCreatingEdge && e.button === 2) { // Edge creation ends on right mouse up
              const targetNode = this.getNodeAt(this.mousePos.x, this.mousePos.y);
              if (targetNode && this.edgeCreationSource && targetNode.id !== this.edgeCreationSource.id) {
                  onEdgeCreated(this.edgeCreationSource, targetNode);
              }
          }
          
          this.dragging = false;
          this.draggingNode = null;
          this.draggingControlPoint = null;
          this.isCreatingEdge = false;
          this.edgeCreationSource = null;
          this.snapLines = [];

          setTimeout(() => { this.dragged = false; }, 0);
      });

      this.canvas.addEventListener('contextmenu', e => e.preventDefault());
      this.canvas.addEventListener('mouseleave', () => {
          this.dragging = this.draggingNode = this.draggingControlPoint = this.isCreatingEdge = null;
          this.snapLines = [];
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