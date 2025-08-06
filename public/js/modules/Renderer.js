/**
 * AVN Player v1.5.03 - Renderer Module with UI/UX updates
 * by Nftxv
 */
const NODE_WIDTH = 200;
const NODE_HEIGHT_COLLAPSED = 45;
const NODE_HEIGHT_EXPANDED = 225;
const TOGGLE_ICON_SIZE = 16; // Slightly larger for easier clicking

export default class Renderer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    
    this.graphData = null; 
    this.images = {};

    this.offset = { x: 0, y: 0 };
    this.scale = 1.0;
    this.dragStart = { x: 0, y: 0 };
    this.dragged = false;
    this.dragging = false;
    this.draggingNode = null;
    this.dragNodeOffset = { x: 0, y: 0 };
    this.draggingControlPoint = null;
    this.isCreatingEdge = false;
    this.edgeCreationSource = null;
    this.mousePos = { x: 0, y: 0 };
    this.snapThreshold = 10;
    this.snapLines = [];
    this.isMarqueeSelecting = false;
    this.marqueeRect = { x: 0, y: 0, w: 0, h: 0 };
    this.isDraggingSelection = false;

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
    const gateway = this.graphData.meta.gateways?.[0] || 'https://ipfs.io/ipfs/';
    return source.type === 'ipfs' ? `${gateway}${source.value}` : source.value;
  }
  
  getViewportCenter() {
      const worldX = (this.canvas.width / 2 - this.offset.x) / this.scale;
      const worldY = (this.canvas.height / 2 - this.offset.y) / this.scale;
      return { x: worldX, y: worldY };
  }
  
  getClickableEntityAt(x, y) {
    for (let i = this.graphData.nodes.length - 1; i >= 0; i--) {
        const node = this.graphData.nodes[i];
        const height = node.isCollapsed ? NODE_HEIGHT_COLLAPSED : NODE_HEIGHT_EXPANDED;
        
        const iconX = node.x + NODE_WIDTH - TOGGLE_ICON_SIZE - 4;
        const iconY = node.y + height - TOGGLE_ICON_SIZE - 4;
        if (x > iconX && x < iconX + TOGGLE_ICON_SIZE && y > iconY && y < iconY + TOGGLE_ICON_SIZE) {
            return { type: 'collapse_toggle', entity: node };
        }

        if (x > node.x && x < node.x + NODE_WIDTH && y > node.y && y < node.y + height) {
            return { type: 'node', entity: node };
        }
    }

    const edge = this.getEdgeAt(x, y);
    if (edge) {
      return { type: 'edge', entity: edge };
    }

    return null;
  }
  
  getNodeAt(x, y) {
    for (let i = this.graphData.nodes.length - 1; i >= 0; i--) {
        const node = this.graphData.nodes[i];
        const height = node.isCollapsed ? NODE_HEIGHT_COLLAPSED : NODE_HEIGHT_EXPANDED;
        if (x > node.x && x < node.x + NODE_WIDTH && y > node.y && y < node.y + height) return node;
    }
    return null;
  }
  
  getNodesInRect(rect) {
    const normalizedRect = this.normalizeRect(rect);
    return this.graphData.nodes.filter(node => {
        const height = node.isCollapsed ? NODE_HEIGHT_COLLAPSED : NODE_HEIGHT_EXPANDED;
        return (
            node.x >= normalizedRect.x &&
            node.y >= normalizedRect.y &&
            node.x + NODE_WIDTH <= normalizedRect.x + normalizedRect.w &&
            node.y + height <= normalizedRect.y + normalizedRect.h
        );
    });
  }

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
        
        // Use fixed anchor point for source
        const startPoint = { x: src.x + NODE_WIDTH / 2, y: src.y + NODE_HEIGHT_COLLAPSED / 2 };

        const controlPoints = edge.controlPoints || [];
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
    if (this.isMarqueeSelecting) this.drawMarquee();
    
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
      
      // Use fixed anchor point based on collapsed state size
      const startPoint = { x: src.x + NODE_WIDTH / 2, y: src.y + NODE_HEIGHT_COLLAPSED / 2 };
      
      const lastPathPoint = controlPoints.length > 0 ? controlPoints.at(-1) : startPoint;
      const intersection = this._getIntersectionWithNodeRect(trg, lastPathPoint);
      const pathPoints = [startPoint, ...controlPoints, intersection];
      
      ctx.beginPath();
      ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
      for (let i = 1; i < pathPoints.length; i++) ctx.lineTo(pathPoints[i].x, pathPoints[i].y);
      ctx.strokeStyle = color; ctx.lineWidth = lineWidth; ctx.stroke();
      
      const midPointForArrow = pathPoints[pathPoints.length-1];
      const secondLastPoint = pathPoints.length > 1 ? pathPoints[pathPoints.length-2] : startPoint;
      const angle = Math.atan2(midPointForArrow.y - secondLastPoint.y, midPointForArrow.x - secondLastPoint.x);
      this._drawArrow(midPointForArrow.x, midPointForArrow.y, angle, color, arrowSize);

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
        const rotationAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        if (rotationAngle > Math.PI / 2 || rotationAngle < -Math.PI / 2) ctx.rotate(rotationAngle + Math.PI); else ctx.rotate(rotationAngle);
        ctx.fillText(edge.label, 0, -8);
        ctx.restore();
      }
      ctx.restore();
  }
  
  _fitText(text, maxWidth) {
      if (this.ctx.measureText(text).width <= maxWidth) {
          return text;
      }
      while (this.ctx.measureText(text + '...').width > maxWidth && text.length > 0) {
          text = text.slice(0, -1);
      }
      return text + '...';
  }

  drawNode(node) {
    const ctx = this.ctx;
    const height = node.isCollapsed ? NODE_HEIGHT_COLLAPSED : NODE_HEIGHT_EXPANDED;
    
    // The node's (x,y) is always the top-left of the expanded state.
    // When collapsed, we draw it centered vertically.
    const drawY = node.isCollapsed ? node.y + (NODE_HEIGHT_EXPANDED - NODE_HEIGHT_COLLAPSED) / 2 : node.y;
    
    ctx.save();
    
    // Node Body
    ctx.fillStyle = '#2d2d2d';
    ctx.beginPath();
    ctx.roundRect(node.x, drawY, NODE_WIDTH, NODE_HEIGHT_COLLAPSED, 8);
    // If expanded, draw the larger background part
    if (!node.isCollapsed) {
        ctx.roundRect(node.x, node.y, NODE_WIDTH, height, 8);
    }
    ctx.fill();
    
    // Border
    if (node.selected) { ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 3; }
    else if (node.highlighted) { ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 3; }
    else { ctx.strokeStyle = '#424242'; ctx.lineWidth = 1; }
    ctx.stroke();

    // Content Area
    if (!node.isCollapsed) {
        const coverUrl = this.getSourceUrl(node.coverSources?.[0]);
        const contentHeight = 150;
        if (coverUrl && this.images[coverUrl]) {
            ctx.drawImage(this.images[coverUrl], node.x + 10, node.y + 10, NODE_WIDTH - 20, contentHeight);
        } else {
            ctx.fillStyle = '#1e1e1e';
            ctx.fillRect(node.x + 10, node.y + 10, NODE_WIDTH - 20, contentHeight);
        }
    }
    
    // Title
    ctx.fillStyle = '#e0e0e0';
    ctx.font = '14px Segoe UI';
    ctx.textAlign = 'center';
    const titleMaxWidth = NODE_WIDTH - 30;
    const fittedTitle = this._fitText(node.title, titleMaxWidth);
    
    const titleY = node.isCollapsed 
        ? drawY + NODE_HEIGHT_COLLAPSED / 2
        : node.y + 175; // Position under the content area
    ctx.textBaseline = node.isCollapsed ? 'middle' : 'top';
    ctx.fillText(fittedTitle, node.x + NODE_WIDTH / 2, titleY);

    // Toggle Icon
    const iconX = node.x + NODE_WIDTH - TOGGLE_ICON_SIZE - 6;
    const iconY = drawY + NODE_HEIGHT_COLLAPSED - TOGGLE_ICON_SIZE - 6;
    ctx.strokeStyle = '#9e9e9e';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    // Horizontal line for '-'
    ctx.moveTo(iconX + 4, iconY + TOGGLE_ICON_SIZE / 2);
    ctx.lineTo(iconX + TOGGLE_ICON_SIZE - 4, iconY + TOGGLE_ICON_SIZE / 2);
    if (node.isCollapsed) { // Vertical line for '+'
      ctx.moveTo(iconX + TOGGLE_ICON_SIZE / 2, iconY + 4);
      ctx.lineTo(iconX + TOGGLE_ICON_SIZE / 2, iconY + TOGGLE_ICON_SIZE - 4);
    }
    ctx.stroke();

    ctx.restore();
  }
  
  drawMarquee() {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = 'rgba(70, 130, 180, 0.2)';
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
      // The visual representation of the node changes, so intersection must adapt.
      const height = node.isCollapsed ? NODE_HEIGHT_COLLAPSED : NODE_HEIGHT_EXPANDED;
      const nodeY = node.isCollapsed ? node.y + (NODE_HEIGHT_EXPANDED - NODE_HEIGHT_COLLAPSED) / 2 : node.y;
      
      const halfW = NODE_WIDTH / 2, halfH = height / 2;
      const cx = node.x + halfW, cy = nodeY + halfH;
      const dx = externalPoint.x - cx, dy = externalPoint.y - cy;
      if (dx === 0 && dy === 0) return {x: cx, y: cy};
      const angle = Math.atan2(dy, dx);
      const tan = Math.tan(angle); let x, y;
      if (Math.abs(halfH * dx) > Math.abs(halfW * dy)) { x = cx + Math.sign(dx) * halfW; y = cy + Math.sign(dx) * halfW * tan; }
      else { y = cy + Math.sign(dy) * halfH; x = cx + Math.sign(dy) * halfH / tan; }
      return { x, y };
  }
  
  drawTemporaryEdge() {
    const ctx = this.ctx;
    // Always connect from the fixed anchor point
    const startX = this.edgeCreationSource.x + NODE_WIDTH / 2;
    const startY = this.edgeCreationSource.y + NODE_HEIGHT_COLLAPSED / 2;
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
      let snappedPos = { ...pos }; this.snapLines = []; const threshold = this.snapThreshold / this.scale;
      const snapTargets = [];
      this.graphData.nodes.forEach(n => {
          if (n !== ignoredEntity && !n.selected) {
            const height = NODE_HEIGHT_COLLAPSED; // Always snap to the anchor's size
            snapTargets.push({ x: n.x, y: n.y, w: NODE_WIDTH, h: height, type: 'node' });
          }
      });
      this.graphData.edges.forEach(e => {
          (e.controlPoints || []).forEach(p => { if (p !== ignoredEntity) snapTargets.push({ x: p.x, y: p.y, type: 'point' }); });
      });
      let snapX = false, snapY = false;
      for (const target of snapTargets) {
          if (target.type === 'node') {
              const targetCenterX = target.x + target.w / 2;
              const targetCenterY = target.y + target.h / 2; // Snap to center of anchor rect
              if (Math.abs(pos.x - targetCenterX) < threshold) { snappedPos.x = targetCenterX; snapX = true; }
              if (Math.abs(pos.y - targetCenterY) < threshold) { snappedPos.y = targetCenterY; snapY = true; }
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
  
  setupCanvasInteraction(callbacks) {
    const { getIsEditorMode, onClick, onDblClick, onEdgeCreated, onMarqueeSelect, getSelection } = callbacks;

    window.addEventListener('resize', () => this.resizeCanvas());
    this.canvas.addEventListener('contextmenu', e => e.preventDefault());
    
    this.canvas.addEventListener('mousedown', (e) => {
        const isEditor = getIsEditorMode();
        const mousePos = this.getCanvasCoords(e);
        this.dragged = false;

        if (!isEditor) {
            if (e.button === 0) {
                this.dragging = true;
                this.dragStart.x = e.clientX - this.offset.x;
                this.dragStart.y = e.clientY - this.offset.y;
                this.canvas.style.cursor = 'grabbing';
            }
            return;
        }
        
        if (e.button === 1) {
            this.dragging = true;
            this.dragStart.x = e.clientX - this.offset.x;
            this.dragStart.y = e.clientY - this.offset.y;
            this.canvas.style.cursor = 'grabbing';
            return;
        }

        if (e.button === 0) {
            const cp = this.getControlPointAt(mousePos.x, mousePos.y);
            if (cp) { this.draggingControlPoint = cp; return; }
            
            const clicked = this.getClickableEntityAt(mousePos.x, mousePos.y);
            if (clicked && clicked.type === 'node') {
                const node = clicked.entity;
                if (node.selected) this.isDraggingSelection = true;
                this.draggingNode = node;
                this.dragNodeOffset.x = mousePos.x - node.x;
                this.dragNodeOffset.y = mousePos.y - node.y;
                return;
            }

            if (!clicked) {
                this.isMarqueeSelecting = true;
                this.marqueeRect = { x: mousePos.x, y: mousePos.y, w: 0, h: 0 };
            }

        } else if (e.button === 2) {
            const cp = this.getControlPointAt(mousePos.x, mousePos.y);
            if (cp) { cp.edge.controlPoints.splice(cp.pointIndex, 1); }
            else { const node = this.getNodeAt(mousePos.x, mousePos.y); if (node) { this.isCreatingEdge = true; this.edgeCreationSource = node; } }
        }
    });

    this.canvas.addEventListener('mousemove', (e) => {
        this.mousePos = this.getCanvasCoords(e);
        if (e.buttons === 0) {
             this.dragging = this.draggingNode = this.draggingControlPoint = this.isCreatingEdge = this.isMarqueeSelecting = this.isDraggingSelection = false;
             this.canvas.style.cursor = 'grab'; this.snapLines = [];
             return;
        }
        this.dragged = true;

        if (this.dragging) {
            this.offset.x = e.clientX - this.dragStart.x;
            this.offset.y = e.clientY - this.dragStart.y;
        } else if (this.isDraggingSelection) {
            const primaryNode = this.draggingNode;
            const primaryNodeCenter = { x: this.mousePos.x - this.dragNodeOffset.x + NODE_WIDTH / 2, y: this.mousePos.y - this.dragNodeOffset.y + NODE_HEIGHT_COLLAPSED / 2 };
            const snappedCenter = this._getSnappedPosition(primaryNodeCenter, primaryNode);
            const snappedX = snappedCenter.x - NODE_WIDTH / 2;
            const snappedY = snappedCenter.y - NODE_HEIGHT_COLLAPSED / 2;
            const dx = snappedX - primaryNode.x;
            const dy = snappedY - primaryNode.y;

            getSelection().forEach(entity => {
                if (entity.x !== undefined) {
                    entity.x += dx;
                    entity.y += dy;
                } else if (entity.controlPoints) {
                    entity.controlPoints.forEach(point => {
                        point.x += dx;
                        point.y += dy;
                    });
                }
            });
        } else if (this.draggingNode) {
            const centerPos = { x: this.mousePos.x - this.dragNodeOffset.x + NODE_WIDTH / 2, y: this.mousePos.y - this.dragNodeOffset.y + NODE_HEIGHT_COLLAPSED / 2 };
            const snappedCenter = this._getSnappedPosition(centerPos, this.draggingNode);
            this.draggingNode.x = snappedCenter.x - NODE_WIDTH / 2;
            this.draggingNode.y = snappedCenter.y - NODE_HEIGHT_COLLAPSED / 2;
        } else if (this.draggingControlPoint) {
            const point = this.draggingControlPoint.edge.controlPoints[this.draggingControlPoint.pointIndex];
            const snappedPos = this._getSnappedPosition(this.mousePos, point);
            point.x = snappedPos.x; point.y = snappedPos.y;
        } else if (this.isMarqueeSelecting) {
            this.marqueeRect.w = this.mousePos.x - this.marqueeRect.x;
            this.marqueeRect.h = this.mousePos.y - this.marqueeRect.y;
        }
    });

    this.canvas.addEventListener('mouseup', (e) => {
        if (this.isMarqueeSelecting) {
            const normalizedRect = this.normalizeRect(this.marqueeRect);
            if (normalizedRect.w > 5 || normalizedRect.h > 5) {
                onMarqueeSelect(this.marqueeRect, e.ctrlKey, e.shiftKey);
            }
        }
        if (this.isCreatingEdge && e.button === 2) {
            const targetNode = this.getNodeAt(this.mousePos.x, this.mousePos.y);
            if (targetNode && this.edgeCreationSource && targetNode.id !== this.edgeCreationSource.id) {
                onEdgeCreated(this.edgeCreationSource, targetNode);
            }
        }
        this.dragging = this.draggingNode = this.draggingControlPoint = this.isCreatingEdge = this.isMarqueeSelecting = this.isDraggingSelection = false;
        this.canvas.style.cursor = 'grab'; this.snapLines = [];
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