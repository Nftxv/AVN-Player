/**
 * AVN Player - Renderer Module
 * with HTML Overlays, LOD, and Grouping
 * by Nftxv
 */
const NODE_WIDTH = 200;
const NODE_HEADER_HEIGHT = 45;
const NODE_CONTENT_ASPECT_RATIO = 9 / 16;
const NODE_CONTENT_HEIGHT = NODE_WIDTH * NODE_CONTENT_ASPECT_RATIO;
const DECORATION_LOD_THRESHOLD = 0.4;

export default class Renderer {
  constructor(canvasId, iframeContainer, markdownContainer) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.iframeContainer = iframeContainer;
    this.markdownContainer = markdownContainer;
    
    this.graphData = null; 
    this.markdownOverlays = new Map();

    this.offset = { x: 0, y: 0 };
    this.scale = 1.0;
    this.dragStart = { x: 0, y: 0 };
    this.dragged = false;
    this.dragging = false;
    this.draggingEntity = null;
    this.isDraggingSelection = false;
    
    this.draggingControlPoint = null;
    this.isCreatingEdge = false;
    this.edgeCreationSource = null;
    this.mousePos = { x: 0, y: 0 };
    this.snapThreshold = 10;
    this.snapLines = [];
    this.isMarqueeSelecting = false;
    
    this.isAnimatingPan = false;

    this.resizeCanvas();
    this.renderLoop = this.renderLoop.bind(this);
    requestAnimationFrame(this.renderLoop);
  }

  setData(graphData) { this.graphData = graphData; }
  
  render() {
    // The render loop is now self-driving.
  }

  renderLoop() {
    if (!this.graphData) {
        requestAnimationFrame(this.renderLoop);
        return;
    }
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.save();
    this.ctx.translate(this.offset.x, this.offset.y);
    this.ctx.scale(this.scale, this.scale);

    const isLodActive = this.scale < DECORATION_LOD_THRESHOLD;

    this.graphData.decorations.forEach(deco => this.drawDecoration(deco, isLodActive));
    this.graphData.nodes.forEach(node => this._drawNodeContent(node));
    this.graphData.edges.forEach(edge => this.drawEdge(edge));
    this.graphData.nodes.forEach(node => this._drawNodeHeader(node));

    if (this.isCreatingEdge) this.drawTemporaryEdge();
    if (this.isMarqueeSelecting) this.drawMarquee();
    this._drawSnapGuides();
    
    this.ctx.restore();
    
    this.updateHtmlOverlays(isLodActive);

    requestAnimationFrame(this.renderLoop);
  }

  drawDecoration(deco, isLodActive) {
    if (isLodActive) {
        this.ctx.fillStyle = deco.selected ? '#e74c3c' : '#5a5a5a';
        this.ctx.globalAlpha = 0.9;
        this.ctx.beginPath();
        const radius = deco.selected ? 7 / this.scale : 5 / this.scale;
        this.ctx.arc(deco.x + deco.width/2, deco.y + deco.height/2, radius, 0, 2*Math.PI);
        this.ctx.fill();
        this.ctx.globalAlpha = 1.0;
        return;
    }

    if (deco.type === 'rectangle') this.drawRectangle(deco);
  }

  drawRectangle(rect) {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = rect.selected ? 0.8 : 0.5;
    ctx.fillStyle = rect.backgroundColor;
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
    
    if (rect.selected) {
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = 4 / this.scale;
        ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
    }
    ctx.restore();
  }
  
  drawEdge(edge) {
      const src = this.graphData.getNodeById(edge.source);
      const trg = this.graphData.getNodeById(edge.target);
      if (!src || !trg) return;
      
      const controlPoints = edge.controlPoints || [];
      const srcHeaderCenter = { x: src.x + NODE_WIDTH / 2, y: src.y + NODE_HEADER_HEIGHT / 2 };
      const trgHeaderCenter = { x: trg.x + NODE_WIDTH / 2, y: trg.y + NODE_HEADER_HEIGHT / 2 };
      
      const targetPointForAngle = controlPoints.length > 0 ? controlPoints[0] : trgHeaderCenter;
      const startPoint = this._getIntersectionWithNodeRect(src, targetPointForAngle);
      
      const sourcePointForAngle = controlPoints.length > 0 ? controlPoints.at(-1) : srcHeaderCenter;
      const endPoint = this._getIntersectionWithNodeRect(trg, sourcePointForAngle);
      
      const pathPoints = [startPoint, ...controlPoints, endPoint];
      const ctx = this.ctx;
      ctx.save();
      
      let color = edge.color || '#888888';
      if (edge.selected) color = '#e74c3c';
      if (edge.highlighted) color = '#FFD700';
      
      const edgeLineWidth = edge.lineWidth || 2;
      const lineWidth = edge.selected || edge.highlighted ? edgeLineWidth + 1 : edgeLineWidth;
      const arrowSize = 6 + edgeLineWidth * 2.5;

      const pForArrow = pathPoints.at(-1); 
      const pBeforeArrow = pathPoints.length > 1 ? pathPoints.at(-2) : startPoint;
      const angle = Math.atan2(pForArrow.y - pBeforeArrow.y, pForArrow.x - pBeforeArrow.x);
      
      const offset = arrowSize; 
      const adjustedEndPoint = {
          x: pForArrow.x - offset * Math.cos(angle),
          y: pForArrow.y - offset * Math.sin(angle)
      };

      ctx.beginPath();
      ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
      for (let i = 1; i < pathPoints.length - 1; i++) {
          ctx.lineTo(pathPoints[i].x, pathPoints[i].y);
      }
      if (pathPoints.length > 1) {
          ctx.lineTo(adjustedEndPoint.x, adjustedEndPoint.y);
      }

      ctx.strokeStyle = color; 
      ctx.lineWidth = lineWidth; 
      ctx.stroke();
      
      this._drawArrow(pForArrow.x, pForArrow.y, angle, color, arrowSize);
      
      controlPoints.forEach(point => {
          ctx.beginPath();
          ctx.arc(point.x, point.y, 5 / this.scale, 0, 2 * Math.PI);
          ctx.fillStyle = edge.selected ? '#e74c3c' : color;
          ctx.fill();
      });
      
      if (edge.label) {
        const midIndex = Math.floor((pathPoints.length - 2) / 2);
        const p1 = pathPoints[midIndex], p2 = pathPoints[midIndex + 1];
        ctx.font = '12px "Segoe UI"';
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.save();
        ctx.translate((p1.x + p2.x)/2, (p1.y + p2.y)/2);
        const rotationAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        if (rotationAngle > Math.PI / 2 || rotationAngle < -Math.PI / 2) ctx.rotate(rotationAngle + Math.PI); else ctx.rotate(rotationAngle);
        ctx.fillText(edge.label, 0, -8);
        ctx.restore();
      }
      
      ctx.restore();
  }
  
  _drawNodeContent(node) {
    if (node.isCollapsed) return;
    const ctx = this.ctx;
    const containerX = node.x;
    const containerY = node.y - NODE_CONTENT_HEIGHT;
    const containerW = NODE_WIDTH;
    const containerH = NODE_CONTENT_HEIGHT;
    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(containerX, containerY, containerW, containerH);
    if (node.sourceType === 'iframe') {
        ctx.fillStyle = '#000000';
        ctx.fillRect(containerX, containerY, containerW, containerH);
    }
  }

  _drawNodeHeader(node) {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = '#2d2d2d';
    ctx.beginPath();
    ctx.roundRect(node.x, node.y, NODE_WIDTH, NODE_HEADER_HEIGHT, [0, 0, 8, 8]);
    ctx.fill();
    if (node.selected || node.highlighted) {
        ctx.save();
        ctx.clip();
        ctx.strokeStyle = node.selected ? '#e74c3c' : '#FFD700';
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.restore();
    } else {
        ctx.strokeStyle = '#424242';
        ctx.lineWidth = 1;
        ctx.stroke();
    }
    ctx.fillStyle = '#e0e0e0';
    ctx.font = '14px "Segoe UI"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const fittedTitle = this._fitText(node.title, NODE_WIDTH - 20); 
    const titleX = node.x + NODE_WIDTH / 2;
    const titleY = node.y + NODE_HEADER_HEIGHT / 2;
    ctx.fillText(fittedTitle, titleX, titleY);
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

  updateHtmlOverlays(isLodActive) {
      if (!this.graphData) return;

      this.graphData.nodes.forEach(node => {
          if (node.sourceType === 'iframe') this.updateIframeOverlay(node);
      });

      this.graphData.decorations.forEach(deco => {
          if (deco.type === 'markdown') this.updateMarkdownOverlay(deco, isLodActive);
      });
  }

  updateIframeOverlay(node) {
      const wrapper = document.getElementById(`iframe-wrapper-${node.id}`);
      if (!wrapper) return;
      const isInView = this._isNodeInView(node);
      const shouldBeVisible = !node.isCollapsed && isInView;
      if (wrapper.style.display !== (shouldBeVisible ? 'block' : 'none')) {
          wrapper.style.display = shouldBeVisible ? 'block' : 'none';
      }
      if (shouldBeVisible) {
          const screenX = node.x * this.scale + this.offset.x;
          const screenY = (node.y - NODE_CONTENT_HEIGHT) * this.scale + this.offset.y;
          const screenWidth = NODE_WIDTH * this.scale;
          const screenHeight = NODE_CONTENT_HEIGHT * this.scale;
          wrapper.style.transform = `translate(${screenX}px, ${screenY}px)`;
          wrapper.style.width = `${screenWidth}px`;
          wrapper.style.height = `${screenHeight}px`;
      }
  }

  updateMarkdownOverlay(deco, isLodActive) {
      const isInView = this._isDecorationInView(deco);
      const shouldBeVisible = !isLodActive && isInView;
      let overlay = this.markdownOverlays.get(deco.id);

      if (shouldBeVisible) {
          if (!overlay) {
              overlay = this._createMarkdownOverlay(deco);
          }
          const screenX = deco.x * this.scale + this.offset.x;
          const screenY = deco.y * this.scale + this.offset.y;
          const screenWidth = deco.width * this.scale;
          const screenHeight = deco.height * this.scale;
          
          overlay.style.transform = `translate(${screenX}px, ${screenY}px)`;
          overlay.style.width = `${screenWidth}px`;
          overlay.style.height = `${screenHeight}px`;
          overlay.style.fontSize = `${(deco.fontSize || 14) / this.scale}px`;
          overlay.classList.toggle('selected', !!deco.selected);

      } else if (overlay) {
          this.destroyMarkdownOverlay(deco.id);
      }
  }

  _createMarkdownOverlay(deco) {
      const overlay = document.createElement('div');
      overlay.id = `md-overlay-${deco.id}`;
      overlay.className = 'markdown-overlay';
      overlay.style.backgroundColor = deco.backgroundColor;
      
      const handle = document.createElement('div');
      handle.className = 'markdown-drag-handle';
      handle.dataset.decoId = deco.id;
      overlay.appendChild(handle);
      
      this.updateMarkdownOverlayContent(overlay, deco);

      this.markdownContainer.appendChild(overlay);
      this.markdownOverlays.set(deco.id, overlay);
      return overlay;
  }
  
  refreshMarkdownOverlay(decoId) {
      const deco = this.graphData.getDecorationById(decoId);
      const overlay = this.markdownOverlays.get(decoId);
      if (deco && overlay) {
          this.updateMarkdownOverlayContent(overlay, deco);
          overlay.style.backgroundColor = deco.backgroundColor;
      }
  }

  updateMarkdownOverlayContent(overlay, deco) {
      const handle = overlay.querySelector('.markdown-drag-handle');
      const content = DOMPurify.sanitize(marked.parse(deco.textContent, { breaks: true }), { ADD_ATTR: ['target'] });
      overlay.innerHTML = content;
      if (handle) overlay.prepend(handle);
      overlay.querySelectorAll('a').forEach(a => {
        a.target = '_blank';
        a.rel = 'noopener nofollow';
      });
  }

  destroyMarkdownOverlay(decoId) {
      if (this.markdownOverlays.has(decoId)) {
          this.markdownOverlays.get(decoId).remove();
          this.markdownOverlays.delete(decoId);
      }
  }
  
  destroyAllMarkdownOverlays() {
      this.markdownOverlays.forEach(overlay => overlay.remove());
      this.markdownOverlays.clear();
  }

  _fitText(text, maxWidth) {
      this.ctx.font = '14px "Segoe UI"';
      if(this.ctx.measureText(text).width <= maxWidth) return text;
      while (this.ctx.measureText(text + '...').width > maxWidth && text.length > 0) text = text.slice(0, -1);
      return text + '...';
  }
  
  _isNodeInView(node) {
      const rect = this._getNodeVisualRect(node);
      return this._isRectInView(rect);
  }
  
  _isDecorationInView(deco) {
      const rect = this._getDecorationBounds(deco);
      return this._isRectInView(rect);
  }
  
  _isRectInView(rect) {
      const screenRect = {
        x: rect.x * this.scale + this.offset.x, y: rect.y * this.scale + this.offset.y,
        width: rect.width * this.scale, height: rect.height * this.scale
      };
      const buffer = 100;
      return screenRect.x < this.canvas.width + buffer && screenRect.x + screenRect.width > -buffer &&
             screenRect.y < this.canvas.height + buffer && screenRect.y + screenRect.height > -buffer;
  }

  getViewportCenter() {
      const worldX = (this.canvas.width / 2 - this.offset.x) / this.scale;
      const worldY = (this.canvas.height / 2 - this.offset.y) / this.scale;
      return { x: worldX, y: worldY };
  }

  getViewport() { return { offset: this.offset, scale: this.scale }; }

  setViewport(view) {
    if (view.offset) this.offset = view.offset;
    if (view.scale) this.scale = view.scale;
  }

  _getNodeVisualRect(node) {
      const contentHeight = node.isCollapsed ? 0 : NODE_CONTENT_HEIGHT;
      const totalHeight = NODE_HEADER_HEIGHT + contentHeight;
      return { x: node.x, y: node.y - contentHeight, width: NODE_WIDTH, height: totalHeight };
  }
  
  _getDecorationBounds(deco) {
      return { x: deco.x, y: deco.y, width: deco.width, height: deco.height };
  }

  getClickableEntityAt(x, y, { isDecorationsLocked } = {}) {
    if (!isDecorationsLocked) {
        if (this.scale < DECORATION_LOD_THRESHOLD) {
            const tolerance = 7 / this.scale;
            for (let i = this.graphData.decorations.length - 1; i >= 0; i--) {
                 const deco = this.graphData.decorations[i];
                 const decoCenterX = deco.x + deco.width/2;
                 const decoCenterY = deco.y + deco.height/2;
                 if(Math.hypot(x - decoCenterX, y - decoCenterY) < tolerance) {
                     return { type: 'decoration', entity: deco };
                 }
            }
        } else {
            for (let i = this.graphData.decorations.length - 1; i >= 0; i--) {
                const deco = this.graphData.decorations[i];
                const bounds = this._getDecorationBounds(deco);
                if (deco.type === 'rectangle' && x > bounds.x && x < bounds.x + bounds.width && y > bounds.y && y < bounds.y + bounds.height) {
                    return { type: 'decoration', entity: deco };
                }
            }
        }
    }
      
    for (let i = this.graphData.nodes.length - 1; i >= 0; i--) {
        const node = this.graphData.nodes[i];
        const rect = this._getNodeVisualRect(node);
        if (x > rect.x && x < rect.x + rect.width && y > rect.y && y < rect.y + rect.height) {
            return { type: 'node', entity: node };
        }
    }
      
    const edge = this.getEdgeAt(x, y);
    if (edge) return { type: 'edge', entity: edge };

    return null;
  }
  
  getNodesInRect(rect) {
    const normalizedRect = this.normalizeRect(rect);
    return this.graphData.nodes.filter(node => {
        const nodeRect = this._getNodeVisualRect(node);
        return ( nodeRect.x >= normalizedRect.x && nodeRect.y >= normalizedRect.y &&
                 nodeRect.x + nodeRect.width <= normalizedRect.x + normalizedRect.w &&
                 nodeRect.y + nodeRect.height <= normalizedRect.y + normalizedRect.h );
    });
  }

  getEdgesInRect(rect, nodesInRect) {
      const nodeIdsInRect = new Set(nodesInRect.map(n => n.id));
      return this.graphData.edges.filter(edge => nodeIdsInRect.has(edge.source) && nodeIdsInRect.has(edge.target));
  }
  
  getDecorationsInRect(rect) {
      const normalizedRect = this.normalizeRect(rect);
      return this.graphData.decorations.filter(deco => {
          const decoBounds = this._getDecorationBounds(deco);
          return normalizedRect.x < decoBounds.x + decoBounds.width && normalizedRect.x + normalizedRect.w > decoBounds.x &&
                 normalizedRect.y < decoBounds.y + decoBounds.height && normalizedRect.y + normalizedRect.h > decoBounds.y;
      });
  }
  
  normalizeRect(rect) {
      return {
          x: rect.w < 0 ? rect.x + rect.w : rect.x, y: rect.h < 0 ? rect.y + rect.h : rect.y,
          w: Math.abs(rect.w), h: Math.abs(rect.h)
      };
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
        const src = this.graphData.getNodeById(edge.source);
        const trg = this.graphData.getNodeById(edge.target);
        if (!src || !trg) continue;
        const controlPoints = edge.controlPoints || [];
        const srcHeaderCenter = { x: src.x + NODE_WIDTH / 2, y: src.y + NODE_HEADER_HEIGHT / 2 };
        const trgHeaderCenter = { x: trg.x + NODE_WIDTH / 2, y: trg.y + NODE_HEADER_HEIGHT / 2 };
        const targetPointForAngle = controlPoints.length > 0 ? controlPoints[0] : trgHeaderCenter;
        const startPoint = this._getIntersectionWithNodeRect(src, targetPointForAngle);
        const sourcePointForAngle = controlPoints.length > 0 ? controlPoints.at(-1) : srcHeaderCenter;
        const endPoint = this._getIntersectionWithNodeRect(trg, sourcePointForAngle);
        const pathPoints = [startPoint, ...controlPoints, endPoint];
        for (let i = 0; i < pathPoints.length - 1; i++) {
            const p1 = pathPoints[i], p2 = pathPoints[i + 1];
            const len = Math.hypot(p2.x - p1.x, p2.y - p1.y);
            if (len < 1) continue;
            const dot = (((x - p1.x) * (p2.x - p1.x)) + ((y - p1.y) * (p2.y - p1.y))) / (len * len);
            if (dot >= 0 && dot <= 1) {
                const closestX = p1.x + (dot * (p2.x - p1.x)), closestY = p1.y + (dot * (p2.y - p1.y));
                if (Math.hypot(x - closestX, y - closestY) < tolerance) return edge;
            }
        }
    }
    return null;
  }
  
  _drawArrow(x, y, angle, color, size) {
      this.ctx.save(); this.ctx.translate(x, y); this.ctx.rotate(angle);
      this.ctx.beginPath(); this.ctx.moveTo(0, 0); this.ctx.lineTo(-size, -size * 0.4);
      this.ctx.lineTo(-size, size * 0.4); this.ctx.closePath(); this.ctx.fillStyle = color; this.ctx.fill(); this.ctx.restore();
  }
  
  _getIntersectionWithNodeRect(node, externalPoint) {
    const logicalCenterX = node.x + NODE_WIDTH / 2;
    const logicalCenterY = node.y + NODE_HEADER_HEIGHT / 2;
    const rect = this._getNodeVisualRect(node);
    const dx = externalPoint.x - logicalCenterX;
    const dy = externalPoint.y - logicalCenterY;

    if (dx === 0 && dy === 0) return { x: logicalCenterX, y: logicalCenterY };
    
    let t = Infinity;
    if (dy < 0) { const t_y = (rect.y - logicalCenterY) / dy; if(logicalCenterX + t_y * dx >= rect.x && logicalCenterX + t_y * dx <= rect.x + rect.width) t = Math.min(t, t_y); }
    if (dy > 0) { const t_y = (rect.y + rect.height - logicalCenterY) / dy; if(logicalCenterX + t_y * dx >= rect.x && logicalCenterX + t_y * dx <= rect.x + rect.width) t = Math.min(t, t_y); }
    if (dx < 0) { const t_x = (rect.x - logicalCenterX) / dx; if(logicalCenterY + t_x * dy >= rect.y && logicalCenterY + t_x * dy <= rect.y + rect.height) t = Math.min(t, t_x); }
    if (dx > 0) { const t_x = (rect.x + rect.width - logicalCenterX) / dx; if(logicalCenterY + t_x * dy >= rect.y && logicalCenterY + t_x * dy <= rect.y + rect.height) t = Math.min(t, t_x); }

    if (t !== Infinity && t > 0) {
        return { x: logicalCenterX + t * dx, y: logicalCenterY + t * dy };
    }
    
    const tan = Math.tan(Math.atan2(dy, dx));
    if (Math.abs(rect.height / 2 * dx) > Math.abs(rect.width / 2 * dy)) {
        const ix = rect.x + (dx > 0 ? rect.width : 0);
        return { x: ix, y: (rect.y + rect.height/2) + ((dx > 0 ? 1 : -1) * rect.width/2) * tan};
    } else {
        const iy = rect.y + (dy > 0 ? rect.height : 0);
        return { x: (rect.x + rect.width/2) + ((dy > 0 ? 1 : -1) * rect.height/2) / tan, y: iy};
    }
  }
  
  drawTemporaryEdge() {
    const ctx = this.ctx;
    const startX = this.edgeCreationSource.x + NODE_WIDTH / 2;
    const startY = this.edgeCreationSource.y + NODE_HEADER_HEIGHT / 2;
    ctx.save(); ctx.beginPath(); ctx.moveTo(startX, startY); ctx.lineTo(this.mousePos.x, this.mousePos.y);
    ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 3 / this.scale; ctx.setLineDash([5 / this.scale, 5 / this.scale]); ctx.stroke(); ctx.restore();
  }
  
  highlight(currentId, prevId = null, edge = null) {
      this.graphData.nodes.forEach(n => n.highlighted = false);
      this.graphData.edges.forEach(e => e.highlighted = false);
      if (currentId) {
          const node = this.graphData.getNodeById(currentId);
          if (node) node.highlighted = true;
      }
      if (edge && this.graphData.edges.includes(edge)) {
          edge.highlighted = true;
      }
  }
  
  getCanvasCoords({ clientX, clientY }) {
      const rect = this.canvas.getBoundingClientRect();
      const x = (clientX - rect.left - this.offset.x) / this.scale;
      const y = (clientY - rect.top - this.offset.y) / this.scale;
      return { x, y };
  }
  
  resizeCanvas() { this.canvas.width = window.innerWidth; this.canvas.height = window.innerHeight; }
  wasDragged() { return this.dragged; }
  
  _getSnappedPosition(pos, movingEntity) { return pos; }
  _drawSnapGuides() { }

  setupCanvasInteraction(callbacks) {
    const { onClick, onDblClick } = callbacks;
    
    document.addEventListener('mousedown', (e) => this.handleMouseDown(e, callbacks));
    this.canvas.addEventListener('wheel', (e) => this.handleWheel(e));
    document.addEventListener('click', (e) => {
        if (e.target.closest('.markdown-drag-handle')) return;
        const clickedOnCanvas = e.target === this.canvas;
        if (clickedOnCanvas) {
            onClick(e, this.getClickableEntityAt(this.mousePos.x, this.mousePos.y, {isDecorationsLocked: callbacks.getIsDecorationsLocked()}));
        }
    });
    this.canvas.addEventListener('dblclick', (e) => {
        onDblClick(e, this.getClickableEntityAt(this.mousePos.x, this.mousePos.y, {isDecorationsLocked: callbacks.getIsDecorationsLocked()}));
    });
  }

  handleMouseDown(e, callbacks) {
      const { getIsEditorMode, getIsDecorationsLocked, getSelection, onEdgeCreated } = callbacks;
      const isHandle = e.target.classList.contains('markdown-drag-handle');
      const onCanvas = e.target === this.canvas;

      // Only proceed if the event is on the canvas or a drag handle
      if (!onCanvas && !isHandle) return;

      e.stopPropagation();
      this.isAnimatingPan = false;
      this.mousePos = this.getCanvasCoords(e);
      this.dragged = false;

      const startPan = () => {
          this.dragging = true;
          this.dragStart.x = e.clientX - this.offset.x;
          this.dragStart.y = e.clientY - this.offset.y;
      };

      if (e.button === 0) { // Left-click
          if (!getIsEditorMode()) { startPan(); }
          else {
              let clicked = null;
              if (isHandle) {
                  const deco = this.graphData.getDecorationById(e.target.dataset.decoId);
                  if (deco) clicked = { type: 'decoration', entity: deco };
              } else {
                  clicked = this.getClickableEntityAt(this.mousePos.x, this.mousePos.y, { isDecorationsLocked: getIsDecorationsLocked() });
              }
              
              if (clicked) {
                  this.draggingEntity = clicked.entity;
                  if (clicked.entity.selected) this.isDraggingSelection = true;
              } else {
                  this.isMarqueeSelecting = true;
                  this.marqueeRect = { x: this.mousePos.x, y: this.mousePos.y, w: 0, h: 0 };
              }
          }
      } else if (e.button === 1) { // Middle-click
          startPan();
      } else if (e.button === 2) { // Right-click
          e.preventDefault();
          if (getIsEditorMode()) {
              const clickedNode = this.getClickableEntityAt(this.mousePos.x, this.mousePos.y, { isDecorationsLocked: true });
              if (clickedNode && clickedNode.type === 'node') {
                  this.isCreatingEdge = true;
                  this.edgeCreationSource = clickedNode.entity;
              }
          }
      }

      if (this.dragging || this.draggingEntity || this.isCreatingEdge || this.isMarqueeSelecting) {
          const handleMouseMove = (moveEvent) => this.handleMouseMove(moveEvent, callbacks);
          const handleMouseUp = () => {
              window.removeEventListener('mousemove', handleMouseMove);
              this.handleMouseUp(callbacks);
          };
          window.addEventListener('mousemove', handleMouseMove);
          window.addEventListener('mouseup', handleMouseUp, { once: true });
      }
  }

  handleMouseMove(e, callbacks) {
      const { getIsDecorationsLocked, getSelection } = callbacks;
      const oldMousePos = this.mousePos;
      this.mousePos = this.getCanvasCoords(e);
      this.dragged = true;
      e.preventDefault();

      if (this.dragging) {
          this.offset.x = e.clientX - this.dragStart.x;
          this.offset.y = e.clientY - this.dragStart.y;
      } else if (this.draggingEntity) {
          const dx = this.mousePos.x - oldMousePos.x;
          const dy = this.mousePos.y - oldMousePos.y;
          if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) return;

          const selection = this.isDraggingSelection ? getSelection() : [this.draggingEntity];
          const movedItems = new Set();
          selection.forEach(entity => {
              if (movedItems.has(entity.id)) return;
              let root = entity.parentId ? this.graphData.getDecorationById(entity.parentId) || entity : entity;
              const itemsToMove = new Set([root]);
              if (root.type === 'rectangle') this.graphData.decorations.forEach(d => { if (d.parentId === root.id) itemsToMove.add(d); });
              if (root.sourceType) this.graphData.decorations.forEach(d => { if (d.attachedToNodeId === root.id && !d.parentId) { itemsToMove.add(d); this.graphData.decorations.forEach(c => { if(c.parentId === d.id) itemsToMove.add(c); }); } });
              itemsToMove.forEach(item => {
                  if (!getIsDecorationsLocked() || !item.type) {
                      if(item.x !== undefined) item.x += dx;
                      if(item.y !== undefined) item.y += dy;
                      if(item.attachedToNodeId) { const node = this.graphData.getNodeById(item.attachedToNodeId); if(node){item.attachOffsetX = item.x - node.x; item.attachOffsetY = item.y - node.y;}}
                      movedItems.add(item.id);
                  }
              });
          });
      } else if (this.isMarqueeSelecting) {
          this.marqueeRect.w = this.mousePos.x - this.marqueeRect.x;
          this.marqueeRect.h = this.mousePos.y - this.marqueeRect.y;
      }
  }

  handleMouseUp(callbacks) {
      const { onMarqueeSelect } = callbacks;
      if (this.isMarqueeSelecting) {
          const norm = this.normalizeRect(this.marqueeRect);
          if (norm.w > 5 || norm.h > 5) onMarqueeSelect(this.marqueeRect, false, false); // Simplified mode
      }
      this.dragging = this.draggingEntity = this.isCreatingEdge = this.isMarqueeSelecting = this.isDraggingSelection = false;
      setTimeout(() => { this.dragged = false; }, 0);
  }

  handleWheel(e) {
      e.preventDefault();
      this.isAnimatingPan = false;
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
  }
}