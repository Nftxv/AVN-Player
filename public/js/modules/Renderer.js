/**
 * AVN Player - Renderer Module with Decorative Layers
 * by Nftxv
 */
const NODE_WIDTH = 200;
const NODE_HEIGHT_COLLAPSED = 45;
const NODE_HEIGHT_EXPANDED = 225;
const NODE_CONTENT_HEIGHT = 150;
const NODE_PADDING = 10;
const TOGGLE_ICON_SIZE = 16;

export default class Renderer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.iframeContainer = document.getElementById('iframe-container');
    
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
    const promises = this.graphData.nodes
      .filter(node => node.sourceType === 'audio' && node.coverUrl)
      .map(async node => {
        const url = node.coverUrl;
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
      });
    await Promise.all(promises);
  }

  renderLoop() {
    if (!this.graphData) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.save();
    this.ctx.translate(this.offset.x, this.offset.y);
    this.ctx.scale(this.scale, this.scale);
    
    // NEW: Render decorations first, so they are in the background
    this.graphData.decorations.forEach(deco => this.drawDecoration(deco));
    
    this.graphData.edges.forEach(edge => this.drawEdge(edge));
    this.graphData.nodes.forEach(node => this.drawNode(node));
    
    if (this.isCreatingEdge) this.drawTemporaryEdge();
    if (this.isMarqueeSelecting) this.drawMarquee();
    
    this._drawSnapGuides();
    this.ctx.restore();
    
    this.updateIframes();
    
    requestAnimationFrame(this.renderLoop);
  }

  // NEW: Main dispatcher for drawing decorations
  drawDecoration(deco) {
    if (deco.type === 'rectangle') {
      this.drawRectangle(deco);
    } else if (deco.type === 'text') {
      this.drawText(deco);
    }
  }

  // NEW: Draws a rectangle decoration
  drawRectangle(rect) {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = rect.backgroundColor;
    ctx.globalAlpha = 0.5; // Make them slightly transparent
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
    ctx.restore();
  }

  // NEW: Draws a text decoration
  drawText(text) {
    const ctx = this.ctx;
    ctx.save();
    ctx.font = `${text.fontSize}px 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif`;
    ctx.fillStyle = text.color;
    ctx.textAlign = text.textAlign;
    ctx.textBaseline = 'middle';
    ctx.fillText(text.textContent, text.x, text.y);
    ctx.restore();
  }

  updateIframes() {
    const visibleNodeIds = new Set();
    
    this.graphData.nodes.forEach(node => {
        if (node.sourceType !== 'iframe' || node.isCollapsed || !this._isNodeInView(node)) {
            return;
        }

        visibleNodeIds.add(node.id);
        const iframeId = `iframe-${node.id}`;
        let wrapper = document.getElementById(iframeId);

        if (!wrapper) {
            wrapper = this._createIframeWrapper(node);
            this.iframeContainer.appendChild(wrapper);
        }

        const nodeRect = this._getNodeVisualRect(node);
        const screenX = (nodeRect.x + NODE_PADDING) * this.scale + this.offset.x;
        const screenY = (nodeRect.y + NODE_PADDING) * this.scale + this.offset.y;
        const screenWidth = (NODE_WIDTH - NODE_PADDING * 2) * this.scale;
        const screenHeight = NODE_CONTENT_HEIGHT * this.scale;

        wrapper.style.transform = `translate(${screenX}px, ${screenY}px)`;
        wrapper.style.width = `${screenWidth}px`;
        wrapper.style.height = `${screenHeight}px`;
    });

    const existingIframes = this.iframeContainer.querySelectorAll('.iframe-wrapper');
    existingIframes.forEach(wrapper => {
        const nodeId = wrapper.id.replace('iframe-', '');
        const node = this.graphData.getNodeById(nodeId);
        if (!node || !visibleNodeIds.has(nodeId)) {
            wrapper.remove();
        }
    });
  }

  _createIframeWrapper(node) {
      const wrapper = document.createElement('div');
      wrapper.id = `iframe-${node.id}`;
      wrapper.className = 'iframe-wrapper';

      const iframe = document.createElement('iframe');
      iframe.src = node.iframeUrl;
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      iframe.allowFullscreen = true;
      
      const dragOverlay = document.createElement('div');
      dragOverlay.className = 'drag-overlay';

      wrapper.appendChild(iframe);
      wrapper.appendChild(dragOverlay);
      return wrapper;
  }
  
  _isNodeInView(node) {
      const rect = this._getNodeVisualRect(node);
      const screenRect = {
        x: rect.x * this.scale + this.offset.x,
        y: rect.y * this.scale + this.offset.y,
        width: rect.width * this.scale,
        height: rect.height * this.scale
      };
      return screenRect.x < this.canvas.width && screenRect.x + screenRect.width > 0 &&
             screenRect.y < this.canvas.height && screenRect.y + screenRect.height > 0;
  }

  // --- UNCHANGED METHODS BELOW ---

  getViewportCenter() {
      const worldX = (this.canvas.width / 2 - this.offset.x) / this.scale;
      const worldY = (this.canvas.height / 2 - this.offset.y) / this.scale;
      return { x: worldX, y: worldY };
  }

  _getNodeVisualRect(node) {
      const height = node.isCollapsed ? NODE_HEIGHT_COLLAPSED : NODE_HEIGHT_EXPANDED;
      return { x: node.x, y: node.y, width: NODE_WIDTH, height: height };
  }
  
  getClickableEntityAt(x, y) {
    // For now, decorations are not clickable. This will change in Step 2.
    for (let i = this.graphData.nodes.length - 1; i >= 0; i--) {
        const node = this.graphData.nodes[i];
        const rect = this._getNodeVisualRect(node);
        
        const iconX = rect.x + NODE_WIDTH - TOGGLE_ICON_SIZE - 4;
        const iconY = rect.y + rect.height - TOGGLE_ICON_SIZE - 4;
        if (x > iconX && x < iconX + TOGGLE_ICON_SIZE && y > iconY && y < iconY + TOGGLE_ICON_SIZE) {
            return { type: 'collapse_toggle', entity: node };
        }

        if (x > rect.x && x < rect.x + rect.width && y > rect.y && y < rect.y + rect.height) {
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
        const rect = this._getNodeVisualRect(node);
        if (x > rect.x && x < rect.x + rect.width && y > rect.y && y < rect.y + rect.height) return node;
    }
    return null;
  }
  
  getNodesInRect(rect) {
    const normalizedRect = this.normalizeRect(rect);
    return this.graphData.nodes.filter(node => {
        const nodeRect = this._getNodeVisualRect(node);
        return (
            nodeRect.x >= normalizedRect.x &&
            nodeRect.y >= normalizedRect.y &&
            nodeRect.x + nodeRect.width <= normalizedRect.x + normalizedRect.w &&
            nodeRect.y + nodeRect.height <= normalizedRect.y + normalizedRect.h
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
        
        const startPoint = { x: src.x + NODE_WIDTH / 2, y: src.y + this._getNodeVisualRect(src).height / 2 };

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
      
      const startPoint = { x: src.x + NODE_WIDTH / 2, y: src.y + this._getNodeVisualRect(src).height / 2 };
      
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
      if(this.ctx.measureText(text).width <= maxWidth) return text;
      while (this.ctx.measureText(text + '...').width > maxWidth && text.length > 0) text = text.slice(0, -1);
      return text + '...';
  }

  drawNode(node) {
    const ctx = this.ctx;
    const rect = this._getNodeVisualRect(node);
    
    ctx.save();
    
    ctx.fillStyle = '#2d2d2d';
    ctx.beginPath();
    ctx.roundRect(rect.x, rect.y, rect.width, rect.height, 8);
    ctx.fill();
    
    if (node.selected) { ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 3; }
    else if (node.highlighted) { ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 3; }
    else { ctx.strokeStyle = '#424242'; ctx.lineWidth = 1; }
    ctx.stroke();

    if (!node.isCollapsed) {
        const contentAreaX = rect.x + NODE_PADDING;
        const contentAreaY = rect.y + NODE_PADDING;
        const contentAreaWidth = NODE_WIDTH - NODE_PADDING * 2;

        if (node.sourceType === 'audio') {
            const coverUrl = node.coverUrl;
            if (coverUrl && this.images[coverUrl]) {
                ctx.drawImage(this.images[coverUrl], contentAreaX, contentAreaY, contentAreaWidth, NODE_CONTENT_HEIGHT);
            } else {
                ctx.fillStyle = '#1e1e1e';
                ctx.fillRect(contentAreaX, contentAreaY, contentAreaWidth, NODE_CONTENT_HEIGHT);
            }
        } else if (node.sourceType === 'iframe') {
            ctx.fillStyle = '#000000';
            ctx.fillRect(contentAreaX, contentAreaY, contentAreaWidth, NODE_CONTENT_HEIGHT);
            ctx.font = '12px Segoe UI';
            ctx.fillStyle = '#666';
            ctx.textAlign = 'center';
            ctx.fillText('Loading Video...', rect.x + NODE_WIDTH / 2, rect.y + NODE_PADDING + NODE_CONTENT_HEIGHT / 2);
        }
    }
    
    ctx.fillStyle = '#e0e0e0';
    ctx.font = '14px Segoe UI';
    ctx.textAlign = 'center';
    const fittedTitle = this._fitText(node.title, NODE_WIDTH - 30);
    
    const titleY = node.isCollapsed 
        ? rect.y + rect.height / 2
        : rect.y + NODE_HEIGHT_EXPANDED - 40;
    ctx.textBaseline = 'middle';
    ctx.fillText(fittedTitle, rect.x + NODE_WIDTH / 2, titleY);

    const iconX = rect.x + NODE_WIDTH - TOGGLE_ICON_SIZE - 6;
    const iconY = rect.y + rect.height - TOGGLE_ICON_SIZE - 6;
    ctx.strokeStyle = '#9e9e9e'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(iconX + 4, iconY + TOGGLE_ICON_SIZE / 2);
    ctx.lineTo(iconX + TOGGLE_ICON_SIZE - 4, iconY + TOGGLE_ICON_SIZE / 2);
    if (node.isCollapsed) {
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
      const rect = this._getNodeVisualRect(node);
      const halfW = rect.width / 2, halfH = rect.height / 2;
      const cx = rect.x + halfW, cy = rect.y + halfH;
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
    const startNodeRect = this._getNodeVisualRect(this.edgeCreationSource);
    const startX = this.edgeCreationSource.x + startNodeRect.width / 2;
    const startY = this.edgeCreationSource.y + startNodeRect.height / 2;
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
            const rect = this._getNodeVisualRect(n);
            snapTargets.push({ x: rect.x, y: rect.y, w: rect.width, h: rect.height, type: 'node' });
          }
      });
      this.graphData.edges.forEach(e => {
          (e.controlPoints || []).forEach(p => { if (p !== ignoredEntity) snapTargets.push({ x: p.x, y: p.y, type: 'point' }); });
      });
      let snapX = false, snapY = false;
      for (const target of snapTargets) {
          if (target.type === 'node') {
              const targetCenterX = target.x + target.w / 2;
              const targetCenterY = target.y + target.h / 2;
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

        const handlePanStart = () => {
            this.dragging = true;
            this.dragStart.x = e.clientX - this.offset.x;
            this.dragStart.y = e.clientY - this.offset.y;
            this.canvas.style.cursor = 'grabbing';
            document.body.classList.add('is-dragging');
        };

        if (!isEditor) {
            if (e.button === 0) handlePanStart();
            return;
        }
        
        if (e.button === 1) { // Middle mouse pan
            handlePanStart();
            return;
        }

        if (e.button === 0) { // Left mouse
            const cp = this.getControlPointAt(mousePos.x, mousePos.y);
            if (cp) { this.draggingControlPoint = cp; document.body.classList.add('is-dragging'); return; }
            
            const clickedNode = this.getNodeAt(mousePos.x, mousePos.y);
            if (clickedNode) {
                if (clickedNode.selected) this.isDraggingSelection = true;
                this.draggingNode = clickedNode;
                this.dragNodeOffset.x = mousePos.x - clickedNode.x;
                this.dragNodeOffset.y = mousePos.y - clickedNode.y;
                document.body.classList.add('is-dragging');
                return;
            }
            
            this.isMarqueeSelecting = true;
            this.marqueeRect = { x: mousePos.x, y: mousePos.y, w: 0, h: 0 };
        } else if (e.button === 2) { // Right mouse
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
             document.body.classList.remove('is-dragging');
             return;
        }
        this.dragged = true;

        if (this.dragging) {
            this.offset.x = e.clientX - this.dragStart.x;
            this.offset.y = e.clientY - this.dragStart.y;
        } else if (this.isDraggingSelection) {
            const primaryNode = this.draggingNode;
            const primaryNodeCenter = { x: this.mousePos.x - this.dragNodeOffset.x + NODE_WIDTH / 2, y: this.mousePos.y - this.dragNodeOffset.y + this._getNodeVisualRect(primaryNode).height / 2 };
            const snappedCenter = this._getSnappedPosition(primaryNodeCenter, primaryNode);
            const dx = (snappedCenter.x - NODE_WIDTH / 2) - primaryNode.x;
            const dy = (snappedCenter.y - this._getNodeVisualRect(primaryNode).height / 2) - primaryNode.y;

            getSelection().forEach(entity => {
                if ('x' in entity) { entity.x += dx; entity.y += dy; }
                else if (entity.controlPoints) { entity.controlPoints.forEach(p => { p.x += dx; p.y += dy; }); }
            });
        } else if (this.draggingNode) {
            const nodeRect = this._getNodeVisualRect(this.draggingNode);
            const centerPos = { x: this.mousePos.x - this.dragNodeOffset.x + nodeRect.width / 2, y: this.mousePos.y - this.dragNodeOffset.y + nodeRect.height / 2 };
            const snappedCenter = this._getSnappedPosition(centerPos, this.draggingNode);
            this.draggingNode.x = snappedCenter.x - nodeRect.width / 2;
            this.draggingNode.y = snappedCenter.y - nodeRect.height / 2;
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
                // For now, marquee select only targets nodes and edges
                // onMarqueeSelect(this.marqueeRect, e.ctrlKey, e.shiftKey);
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
        document.body.classList.remove('is-dragging');
        setTimeout(() => { this.dragged = false; }, 0);
    });

    this.canvas.addEventListener('mouseleave', () => {
        if (this.dragging || this.draggingNode || this.draggingControlPoint || this.isCreatingEdge || this.isMarqueeSelecting) {
            this.dragging = this.draggingNode = this.draggingControlPoint = this.isCreatingEdge = this.isMarqueeSelecting = this.isDraggingSelection = false;
            this.canvas.style.cursor = 'grab';
            this.snapLines = [];
            document.body.classList.remove('is-dragging');
        }
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