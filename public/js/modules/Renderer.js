/**
 * AVN Player - Renderer Module with Editable & Lockable Decorative Layers
 * by Nftxv
 */
const NODE_WIDTH = 200;
const NODE_HEADER_HEIGHT = 45; // Was NODE_HEIGHT_COLLAPSED
const NODE_CONTENT_ASPECT_RATIO = 9 / 16; // Standard 16:9 aspect ratio
const NODE_CONTENT_HEIGHT = NODE_WIDTH * NODE_CONTENT_ASPECT_RATIO; // Approx 112.5px

export default class Renderer {
  constructor(canvasId, iframeContainer) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.iframeContainer = iframeContainer;
    
    this.graphData = null; 
    this.images = {};

    this.offset = { x: 0, y: 0 };
    this.scale = 1.0;
    this.dragStart = { x: 0, y: 0 };
    this.dragged = false;
    this.dragging = false;
    this.draggingEntity = null; // Generic dragging target
    this.dragOffset = { x: 0, y: 0 };
    this.isDraggingSelection = false;
    
    this.draggingControlPoint = null;
    this.isCreatingEdge = false;
    this.edgeCreationSource = null;
    this.mousePos = { x: 0, y: 0 };
    this.snapThreshold = 10;
    this.snapLines = [];
    this.isMarqueeSelecting = false;

    this.resizeCanvas();
    this.renderLoop = this.renderLoop.bind(this);
  }

  setData(graphData) { this.graphData = graphData; }
  
  async render() {
    await this.loadImages();
    this.renderLoop();
  }

  async loadImages() {
    if (!this.graphData) return;
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

    // Layer 1: Decorations
    this.graphData.decorations.forEach(deco => this.drawDecoration(deco));
    
    // Layer 2: Node content (drawn first, to be under header if overlap occurs)
    this.graphData.nodes.forEach(node => this._drawNodeContent(node));
    
    // Layer 3: Edges
    this.graphData.edges.forEach(edge => this.drawEdge(edge));
    
    // Layer 4: Node headers (shape + text)
    this.graphData.nodes.forEach(node => this._drawNodeHeader(node));

    // Overlays for editor tools
    if (this.isCreatingEdge) this.drawTemporaryEdge();
    if (this.isMarqueeSelecting) this.drawMarquee();
    this._drawSnapGuides();
    
    this.ctx.restore();
    
    this.updateIframes();
    requestAnimationFrame(this.renderLoop);
  }

  // --- START Drawing Methods ---

  drawDecoration(deco) {
    if (deco.type === 'rectangle') {
      this.drawRectangle(deco);
    } else if (deco.type === 'text') {
      this.drawText(deco);
    }
  }

  drawRectangle(rect) {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = rect.backgroundColor;
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
    
    if (rect.selected) {
        ctx.restore(); // Restore from globalAlpha change
        ctx.save(); // Save before clipping
        ctx.beginPath();
        ctx.rect(rect.x, rect.y, rect.width, rect.height);
        ctx.clip(); // Clip to the rect path
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = (2 / this.scale) * 2; // Double width for inside stroke
        ctx.stroke();
    }
    ctx.restore();
  }

  drawText(text) {
      const ctx = this.ctx;
      ctx.save();
      ctx.font = `${text.fontSize}px 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif`;
      ctx.fillStyle = text.color;
      ctx.textAlign = text.textAlign;
      ctx.textBaseline = 'top';

      const lines = this._getWrappedLines(text);
      const bounds = this._getTextBounds(text, lines);

      const topLeftX = text.x - bounds.width / 2;
      const topLeftY = text.y - bounds.height / 2;

      let drawX;
      if (text.textAlign === 'left') {
          drawX = topLeftX;
      } else if (text.textAlign === 'center') {
          drawX = text.x;
      } else { // right
          drawX = topLeftX + bounds.width;
      }

      let currentY = topLeftY;
      for (const line of lines) {
          ctx.fillText(line, drawX, currentY);
          currentY += text.fontSize * text.lineHeight;
      }

      if (text.selected) {
          const rectX = topLeftX - 2;
          const rectY = topLeftY - 2;
          const rectW = bounds.width + 4;
          const rectH = bounds.height + 4;
          
          ctx.save();
          ctx.beginPath();
          ctx.rect(rectX, rectY, rectW, rectH);
          ctx.clip();
          ctx.strokeStyle = '#e74c3c';
          ctx.lineWidth = (1 / this.scale) * 2; // Double width
          ctx.stroke();
          ctx.restore();
      }
      ctx.restore();
  }

  drawEdge(edge) {
      const src = this.graphData.getNodeById(edge.source);
      const trg = this.graphData.getNodeById(edge.target);
      if (!src || !trg) return;

      const controlPoints = edge.controlPoints || [];
      const srcRect = this._getNodeVisualRect(src);
      const trgRect = this._getNodeVisualRect(trg);
      
      const targetPointForAngle = controlPoints.length > 0 ? controlPoints[0] : { x: trgRect.x + trgRect.width / 2, y: trgRect.y + trgRect.height / 2 };
      const startPoint = this._getIntersectionWithNodeRect(src, targetPointForAngle);

      const sourcePointForAngle = controlPoints.length > 0 ? controlPoints.at(-1) : { x: srcRect.x + srcRect.width / 2, y: srcRect.y + srcRect.height / 2 };
      const endPoint = this._getIntersectionWithNodeRect(trg, sourcePointForAngle);

      const pathPoints = [startPoint, ...controlPoints, endPoint];
      
      const ctx = this.ctx; ctx.save();
      let color = edge.color || '#888888';
      if (edge.selected) color = '#e74c3c';
      if (edge.highlighted) color = '#FFD700';
      const edgeLineWidth = edge.lineWidth || 2;
      const lineWidth = edge.selected || edge.highlighted ? edgeLineWidth + 1 : edgeLineWidth;
      const arrowSize = 6 + edgeLineWidth * 2.5;

      ctx.beginPath();
      ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
      for (let i = 1; i < pathPoints.length; i++) ctx.lineTo(pathPoints[i].x, pathPoints[i].y);
      ctx.strokeStyle = color; ctx.lineWidth = lineWidth; ctx.stroke();
      
      const pForArrow = pathPoints.at(-1);
      const pBeforeArrow = pathPoints.length > 1 ? pathPoints.at(-2) : startPoint;
      const angle = Math.atan2(pForArrow.y - pBeforeArrow.y, pForArrow.x - pBeforeArrow.x);
      this._drawArrow(pForArrow.x, pForArrow.y, angle, color, arrowSize);

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
  
  _drawNodeContent(node) {
    if (node.isCollapsed) return;
    const ctx = this.ctx;
    
    const containerX = node.x;
    const containerY = node.y - NODE_CONTENT_HEIGHT;
    const containerW = NODE_WIDTH;
    const containerH = NODE_CONTENT_HEIGHT;

    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(containerX, containerY, containerW, containerH);

    if (node.sourceType === 'audio') {
        const img = this.images[node.coverUrl];
        if (img) {
            const containerRatio = containerW / containerH;
            const imgRatio = img.naturalWidth / img.naturalHeight;
            let drawW, drawH, drawX, drawY;
            if (imgRatio > containerRatio) {
                drawW = containerW;
                drawH = drawW / imgRatio;
                drawX = containerX;
                drawY = containerY + (containerH - drawH) / 2;
            } else {
                drawH = containerH;
                drawW = drawH * imgRatio;
                drawY = containerY;
                drawX = containerX + (containerW - drawW) / 2;
            }
            ctx.drawImage(img, drawX, drawY, drawW, drawH);
        }
    } else if (node.sourceType === 'iframe') {
        // The iframe is handled by updateIframes(). We just draw a placeholder bg.
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
        ctx.lineWidth = 3 * 2;
        ctx.stroke();
        ctx.restore();
    } else {
        ctx.strokeStyle = '#424242';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    ctx.fillStyle = '#e0e0e0';
    ctx.font = '14px Segoe UI';
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

  // --- END Drawing Methods ---

  // --- START Helper & Interaction Methods ---
  
  /**
   * Updates position, size, and visibility of all iframe wrappers.
   * Does NOT create or destroy them.
   */
  updateIframes() {
    if (!this.graphData) return;
    this.graphData.nodes.forEach(node => {
        if (node.sourceType !== 'iframe') return;

        const wrapper = document.getElementById(`iframe-wrapper-${node.id}`);
        if (!wrapper) return; // Player module might still be creating it.

        const isInView = this._isNodeInView(node);
        const shouldBeVisible = !node.isCollapsed && isInView;

        wrapper.style.display = shouldBeVisible ? 'block' : 'none';

        if (shouldBeVisible) {
            const screenX = (node.x) * this.scale + this.offset.x;
            const screenY = (node.y - NODE_CONTENT_HEIGHT) * this.scale + this.offset.y;
            const screenWidth = NODE_WIDTH * this.scale;
            const screenHeight = NODE_CONTENT_HEIGHT * this.scale;

            wrapper.style.transform = `translate(${screenX}px, ${screenY}px)`;
            wrapper.style.width = `${screenWidth}px`;
            wrapper.style.height = `${screenHeight}px`;
        }
    });
  }

  _getWrappedLines(textObj) {
      const { ctx } = this;
      const { textContent, fontSize, width } = textObj;
      ctx.font = `${fontSize}px 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif`;

      const paragraphs = (textContent || "").split('\n');
      const allLines = [];

      for (const paragraph of paragraphs) {
          if (!width || width <= 0) {
              allLines.push(paragraph);
          } else {
              const words = paragraph.split(' ');
              let currentLine = '';
              for (const word of words) {
                  const testLine = currentLine ? `${currentLine} ${word}` : word;
                  if (ctx.measureText(testLine).width > width && currentLine) {
                      allLines.push(currentLine);
                      currentLine = word;
                  } else {
                      currentLine = testLine;
                  }
              }
              allLines.push(currentLine);
          }
      }
      return allLines;
  }
  
  _getTextBounds(textObj, renderedLines) {
      const { fontSize, width, lineHeight } = textObj;
      let maxWidth = 0;
      if (width > 0) {
        maxWidth = width;
      } else {
        this.ctx.font = `${fontSize}px 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif`;
        renderedLines.forEach(line => {
            maxWidth = Math.max(maxWidth, this.ctx.measureText(line).width);
        });
      }
      
      const totalHeight = (renderedLines.length > 0) 
        ? (renderedLines.length * fontSize * lineHeight) - (fontSize * (lineHeight - 1))
        : 0;

      return { width: maxWidth, height: totalHeight };
  }

  _fitText(text, maxWidth) {
      if(this.ctx.measureText(text).width <= maxWidth) return text;
      while (this.ctx.measureText(text + '...').width > maxWidth && text.length > 0) text = text.slice(0, -1);
      return text + '...';
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

  getViewportCenter() {
      const worldX = (this.canvas.width / 2 - this.offset.x) / this.scale;
      const worldY = (this.canvas.height / 2 - this.offset.y) / this.scale;
      return { x: worldX, y: worldY };
  }

  _getNodeVisualRect(node) {
      const contentHeight = node.isCollapsed ? 0 : NODE_CONTENT_HEIGHT;
      const totalHeight = NODE_HEADER_HEIGHT + contentHeight;
      return { 
        x: node.x, 
        y: node.y - contentHeight, 
        width: NODE_WIDTH, 
        height: totalHeight 
      };
  }
  
  _getDecorationBounds(deco) {
    if (deco.type === 'rectangle') {
        return { x: deco.x, y: deco.y, width: deco.width, height: deco.height };
    }
    if (deco.type === 'text') {
        const lines = this._getWrappedLines(deco);
        const bounds = this._getTextBounds(deco, lines);
        return { 
            x: deco.x - bounds.width / 2, 
            y: deco.y - bounds.height / 2, 
            width: bounds.width, 
            height: bounds.height 
        };
    }
    return { x: deco.x, y: deco.y, width: 0, height: 0 };
  }

  getClickableEntityAt(x, y, { isDecorationsLocked } = {}) {
    for (let i = this.graphData.nodes.length - 1; i >= 0; i--) {
        const node = this.graphData.nodes[i];
        const rect = this._getNodeVisualRect(node);
        if (x > rect.x && x < rect.x + rect.width && y > rect.y && y < rect.y + rect.height) {
            return { type: 'node', entity: node };
        }
    }
    
    const edge = this.getEdgeAt(x, y);
    if (edge) return { type: 'edge', entity: edge };

    if (!isDecorationsLocked) {
        for (let i = this.graphData.decorations.length - 1; i >= 0; i--) {
            const deco = this.graphData.decorations[i];
            const bounds = this._getDecorationBounds(deco);
            if (x > bounds.x && x < bounds.x + bounds.width && y > bounds.y && y < bounds.y + bounds.height) {
                return { type: 'decoration', entity: deco };
            }
        }
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
        const srcRect = this._getNodeVisualRect(src);
        const trgRect = this._getNodeVisualRect(trg);

        const targetPointForAngle = controlPoints.length > 0 ? controlPoints[0] : { x: trgRect.x + trgRect.width / 2, y: trgRect.y + trgRect.height / 2 };
        const startPoint = this._getIntersectionWithNodeRect(src, targetPointForAngle);
        
        const sourcePointForAngle = controlPoints.length > 0 ? controlPoints.at(-1) : { x: srcRect.x + srcRect.width / 2, y: srcRect.y + srcRect.height / 2 };
        const endPoint = this._getIntersectionWithNodeRect(trg, sourcePointForAngle);

        const pathPoints = [startPoint, ...controlPoints, endPoint];

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
    const startX = this.edgeCreationSource.x + NODE_WIDTH / 2;
    const startY = this.edgeCreationSource.y + NODE_HEADER_HEIGHT / 2;
    ctx.save(); ctx.beginPath(); ctx.moveTo(startX, startY); ctx.lineTo(this.mousePos.x, this.mousePos.y);
    ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 3; ctx.setLineDash([5, 5]); ctx.stroke(); ctx.restore();
  }
  
  highlight(currentId, prevId = null, edge = null) {
      this.graphData.nodes.forEach(n => n.highlighted = false);
      this.graphData.edges.forEach(e => e.highlighted = false);
      if (currentId) { const node = this.graphData.nodes.find(n => n.id === currentId); if (node) node.highlighted = true; }
      if (edge) { const e = this.graphData.edges.find(i => i.source === edge.source && i.target === edge.target); if (e) e.highlighted = true; }
  }
  
  getCanvasCoords({ clientX, clientY }) {
      const rect = this.canvas.getBoundingClientRect();
      const x = (clientX - rect.left - this.offset.x) / this.scale;
      const y = (clientY - rect.top - this.offset.y) / this.scale;
      return { x, y };
  }
  
  resizeCanvas() { this.canvas.width = window.innerWidth; this.canvas.height = window.innerHeight; }
  
  wasDragged() { return this.dragged; }
  
  _getSnappedPosition(pos, movingEntity) {
      let snappedPos = { ...pos };
      this.snapLines = [];
      if (!movingEntity) return pos;

      const isPoint = !movingEntity.sourceType && !movingEntity.type;
      
      const movingBounds = isPoint 
          ? { x: pos.x, y: pos.y, width: 0, height: 0 } 
          : (this._getDecorationBounds(movingEntity) || this._getNodeVisualRect(movingEntity));
      
      if (!isPoint) {
        movingBounds.x = pos.x;
        movingBounds.y = pos.y;
      }
      
      const threshold = this.snapThreshold / this.scale;
      let bestSnapX = { delta: Infinity };
      let bestSnapY = { delta: Infinity };

      const movingPointsX = [movingBounds.x, movingBounds.x + movingBounds.width / 2, movingBounds.x + movingBounds.width];
      const movingPointsY = [movingBounds.y, movingBounds.y + movingBounds.height / 2, movingBounds.y + movingBounds.height];

      const snapTargets = [];
      this.graphData.nodes.forEach(n => {
          if (n === movingEntity || (movingEntity.id && n.id === movingEntity.id) || n.selected) return;
          snapTargets.push({ type: 'node', bounds: this._getNodeVisualRect(n) });
      });
      this.graphData.edges.forEach(e => {
        (e.controlPoints || []).forEach(p => {
            if (p !== movingEntity) {
                snapTargets.push({ type: 'point', bounds: { x: p.x, y: p.y, width: 0, height: 0 }});
            }
        });
      });

      for (const target of snapTargets) {
          const targetBounds = target.bounds;
          const targetPointsX = [targetBounds.x, targetBounds.x + targetBounds.width / 2, targetBounds.x + targetBounds.width];
          const targetPointsY = [targetBounds.y, targetBounds.y + targetBounds.height / 2, targetBounds.y + targetBounds.height];

          for (let i = 0; i < movingPointsX.length; i++) {
              if (movingPointsX[i] === undefined) continue;
              for (let j = 0; j < targetPointsX.length; j++) {
                  const delta = targetPointsX[j] - movingPointsX[i];
                  if (Math.abs(delta) < threshold && Math.abs(delta) < Math.abs(bestSnapX.delta)) {
                      bestSnapX = { delta, pos: targetPointsX[j] };
                  }
              }
          }
          for (let i = 0; i < movingPointsY.length; i++) {
              if (movingPointsY[i] === undefined) continue;
              for (let j = 0; j < targetPointsY.length; j++) {
                  const delta = targetPointsY[j] - movingPointsY[i];
                  if (Math.abs(delta) < threshold && Math.abs(delta) < Math.abs(bestSnapY.delta)) {
                      bestSnapY = { delta, pos: targetPointsY[j] };
                  }
              }
          }
      }
      
      if (Math.abs(bestSnapX.delta) < threshold) {
          snappedPos.x += bestSnapX.delta;
          this.snapLines.push({ type: 'v', pos: bestSnapX.pos });
      }
      if (Math.abs(bestSnapY.delta) < threshold) {
          snappedPos.y += bestSnapY.delta;
          this.snapLines.push({ type: 'h', pos: bestSnapY.pos });
      }
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
    const { getIsEditorMode, getIsDecorationsLocked, onClick, onDblClick, onEdgeCreated, onMarqueeSelect, getSelection } = callbacks;

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
        
        if (e.button === 1) { // Middle mouse button pan
            handlePanStart();
            return;
        }

        if (e.button === 0) { // Left mouse button
            const cp = this.getControlPointAt(mousePos.x, mousePos.y);
            if (cp) { this.draggingControlPoint = cp; document.body.classList.add('is-dragging'); return; }
            
            const clicked = this.getClickableEntityAt(mousePos.x, mousePos.y, { isDecorationsLocked: getIsDecorationsLocked() });
            
            if (clicked && (clicked.type === 'node' || clicked.type === 'decoration')) {
                const entity = clicked.entity;
                if (entity.selected) this.isDraggingSelection = true;
                this.draggingEntity = entity;
                const bounds = this._getDecorationBounds(entity) || this._getNodeVisualRect(entity);
                this.dragOffset.x = mousePos.x - bounds.x;
                this.dragOffset.y = mousePos.y - bounds.y;
                document.body.classList.add('is-dragging');
                return;
            }
            
            if (!clicked) { // Start marquee selection
                this.isMarqueeSelecting = true;
                this.marqueeRect = { x: mousePos.x, y: mousePos.y, w: 0, h: 0 };
            }

        } else if (e.button === 2) { // Right mouse button
            e.preventDefault();
            const cp = this.getControlPointAt(mousePos.x, mousePos.y);
            if (cp) { cp.edge.controlPoints.splice(cp.pointIndex, 1); }
            else { 
              const clickedNode = this.getClickableEntityAt(mousePos.x, mousePos.y, { isDecorationsLocked: true }); // Ignore decorations for edge creation
              if (clickedNode && clickedNode.type === 'node') { 
                this.isCreatingEdge = true; 
                this.edgeCreationSource = clickedNode.entity; 
              } 
            }
        }
    });

    this.canvas.addEventListener('mousemove', (e) => {
        this.mousePos = this.getCanvasCoords(e);
        if (e.buttons === 0) {
             this.dragging = this.draggingEntity = this.draggingControlPoint = this.isCreatingEdge = this.isMarqueeSelecting = this.isDraggingSelection = false;
             this.canvas.style.cursor = 'grab'; this.snapLines = [];
             document.body.classList.remove('is-dragging');
             return;
        }
        this.dragged = true;

        if (this.dragging) {
            this.offset.x = e.clientX - this.dragStart.x;
            this.offset.y = e.clientY - this.dragStart.y;
        } else if (this.isDraggingSelection) {
            const isLocked = getIsDecorationsLocked();
            const originalBounds = this._getDecorationBounds(this.draggingEntity) || this._getNodeVisualRect(this.draggingEntity);
            const targetX = this.mousePos.x - this.dragOffset.x;
            const targetY = this.mousePos.y - this.dragOffset.y;
            
            const snappedPos = this._getSnappedPosition({ x: targetX, y: targetY }, this.draggingEntity);
            const dx = snappedPos.x - originalBounds.x;
            const dy = snappedPos.y - originalBounds.y;

            getSelection().forEach(entity => {
                if (isLocked && (entity.type === 'rectangle' || entity.type === 'text')) return;

                if ('x' in entity) { entity.x += dx; entity.y += dy; }
                else if (entity.controlPoints) { entity.controlPoints.forEach(p => { p.x += dx; p.y += dy; }); }
            });

        } else if (this.draggingEntity) {
            const originalBounds = this._getDecorationBounds(this.draggingEntity) || this._getNodeVisualRect(this.draggingEntity);
            const targetX = this.mousePos.x - this.dragOffset.x;
            const targetY = this.mousePos.y - this.dragOffset.y;
            const snappedPos = this._getSnappedPosition({x: targetX, y: targetY}, this.draggingEntity);
            
            const dx = snappedPos.x - originalBounds.x;
            const dy = snappedPos.y - originalBounds.y;

            this.draggingEntity.x += dx;
            this.draggingEntity.y += dy;

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
            const targetClick = this.getClickableEntityAt(this.mousePos.x, this.mousePos.y, { isDecorationsLocked: true });
            if (targetClick && targetClick.type === 'node' && this.edgeCreationSource && targetClick.entity.id !== this.edgeCreationSource.id) {
                onEdgeCreated(this.edgeCreationSource, targetClick.entity);
            }
        }
        this.dragging = this.draggingEntity = this.draggingControlPoint = this.isCreatingEdge = this.isMarqueeSelecting = this.isDraggingSelection = false;
        this.canvas.style.cursor = 'grab'; this.snapLines = [];
        document.body.classList.remove('is-dragging');
        setTimeout(() => { this.dragged = false; }, 0);
    });

    this.canvas.addEventListener('mouseleave', () => {
        if (this.dragging || this.draggingEntity || this.draggingControlPoint || this.isCreatingEdge || this.isMarqueeSelecting) {
            this.dragging = this.draggingEntity = this.draggingControlPoint = this.isCreatingEdge = this.isMarqueeSelecting = this.isDraggingSelection = false;
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