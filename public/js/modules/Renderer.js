/**
 * AVN Player - Renderer Module with Editable & Lockable Decorative Layers
 * by Nftxv
 */
const NODE_WIDTH = 200;
const NODE_HEADER_HEIGHT = 45;
const NODE_CONTENT_ASPECT_RATIO = 9 / 16;
const NODE_CONTENT_HEIGHT = NODE_WIDTH * NODE_CONTENT_ASPECT_RATIO;

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
    this.draggingEntity = null;
    this.dragOffset = { x: 0, y: 0 };
    this.isDraggingSelection = false;
    this.startPositions = new Map(); // For smooth multi-drag
    
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

    this.graphData.decorations.forEach(deco => this.drawDecoration(deco));
    this.graphData.edges.forEach(edge => this.drawEdge(edge));
    this.graphData.nodes.forEach(node => this.drawNode(node));

    if (this.isCreatingEdge) this.drawTemporaryEdge();
    if (this.isMarqueeSelecting) this.drawMarquee();
    this._drawSnapGuides();
    
    this.ctx.restore();
    
    this.updateIframes();
    if(!this.isAnimatingPan) requestAnimationFrame(this.renderLoop);
  }

  drawDecoration(deco) {
    if (deco.type === 'rectangle') this.drawRectangle(deco);
    else if (deco.type === 'text') this.drawText(deco);
  }

  drawRectangle(rect) {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = rect.backgroundColor;
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
    
    if (rect.selected) {
        ctx.restore();
        ctx.save();
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = (2 / this.scale) * 2;
        ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
    }
    ctx.restore();
  }

  drawText(text) {
      const ctx = this.ctx;
      ctx.save();
      ctx.font = `${text.fontSize}px Segoe UI, sans-serif`;
      ctx.fillStyle = text.color;
      ctx.textAlign = text.textAlign;
      ctx.textBaseline = 'top';
      const lines = this._getWrappedLines(text);
      const bounds = this._getTextBounds(text, lines);
      const topLeftX = text.x - (text.textAlign === 'center' ? bounds.width / 2 : (text.textAlign === 'right' ? bounds.width : 0));
      const topLeftY = text.y - bounds.height / 2;
      let currentY = topLeftY;
      for (const line of lines) {
          ctx.fillText(line, text.x, currentY);
          currentY += text.fontSize * text.lineHeight;
      }
      if (text.selected) {
          const rectX = topLeftX - 4, rectY = topLeftY - 4, rectW = bounds.width + 8, rectH = bounds.height + 8;
          ctx.strokeStyle = '#e74c3c';
          ctx.lineWidth = (1 / this.scale) * 2;
          ctx.strokeRect(rectX, rectY, rectW, rectH);
      }
      ctx.restore();
  }

  drawNode(node) {
    const ctx = this.ctx;
    // Content Part
    if (!node.isCollapsed) {
        const cX = node.x, cY = node.y - NODE_CONTENT_HEIGHT;
        const cW = NODE_WIDTH, cH = NODE_CONTENT_HEIGHT;
        ctx.fillStyle = '#1e1e1e';
        ctx.fillRect(cX, cY, cW, cH);
        if (node.sourceType === 'audio' && node.coverUrl && this.images[node.coverUrl]) {
            ctx.drawImage(this.images[node.coverUrl], cX, cY, cW, cH);
        } else if (node.sourceType === 'iframe') {
            ctx.fillStyle = '#000000';
            ctx.fillRect(cX, cY, cW, cH);
        }
    }
    // Header Part
    ctx.save();
    ctx.fillStyle = '#2d2d2d';
    ctx.beginPath();
    ctx.roundRect(node.x, node.y, NODE_WIDTH, NODE_HEADER_HEIGHT, [0, 0, 8, 8]);
    ctx.fill();
    if (node.selected || node.highlighted) {
        ctx.save(); ctx.clip();
        ctx.strokeStyle = node.selected ? '#e74c3c' : '#FFD700';
        ctx.lineWidth = 3 * 2;
        ctx.stroke();
        ctx.restore();
    } else {
        ctx.strokeStyle = '#424242'; ctx.lineWidth = 1; ctx.stroke();
    }
    ctx.fillStyle = '#e0e0e0';
    ctx.font = 'bold 14px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this._fitText(node.title, NODE_WIDTH - 20), node.x + NODE_WIDTH / 2, node.y + NODE_HEADER_HEIGHT / 2);
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
      } else {
          ctx.lineTo(pForArrow.x, pForArrow.y); // Draw full line if no arrow adjustment
      }

      ctx.strokeStyle = color; 
      ctx.lineWidth = lineWidth; 
      ctx.stroke();
      
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
  
  updateIframes() {
    if (!this.graphData) return;
    this.graphData.nodes.forEach(node => {
        if (node.sourceType !== 'iframe') return;
        const wrapper = document.getElementById(`iframe-wrapper-${node.id}`);
        if (!wrapper) return;
        const isInView = this._isNodeInView(node);
        const shouldBeVisible = !node.isCollapsed && isInView;
        wrapper.style.display = shouldBeVisible ? 'block' : 'none';
        if (shouldBeVisible) {
            // FIX: The iframe content starts ABOVE the header.
            const screenX = node.x * this.scale + this.offset.x;
            const screenY = (node.y - NODE_CONTENT_HEIGHT) * this.scale + this.offset.y;
            const screenWidth = NODE_WIDTH * this.scale;
            const screenHeight = NODE_CONTENT_HEIGHT * this.scale;
            wrapper.style.transform = `translate(${screenX}px, ${screenY}px)`;
            wrapper.style.width = `${screenWidth}px`;
            wrapper.style.height = `${screenHeight}px`;
        }
    });
  }

  setupCanvasInteraction(callbacks) {
    const { getIsEditorMode, getIsDecorationsLocked, onClick, onDblClick, onEdgeCreated, onMarqueeSelect, getSelection, onManualPan } = callbacks;
    window.addEventListener('resize', () => this.resizeCanvas());
    this.canvas.addEventListener('contextmenu', e => e.preventDefault());
    
    const handleMouseMove = (e) => {
        this.mousePos = this.getCanvasCoords(e);
        if (e.buttons === 0) { handleMouseUp(e); return; }
        this.dragged = true;

        if (this.dragging) {
            if (onManualPan) onManualPan();
            this.offset.x = e.clientX - this.dragStart.x;
            this.offset.y = e.clientY - this.dragStart.y;
        } else if (this.draggingEntity) {
            const currentMousePos = this.getCanvasCoords(e);
            const dx = currentMousePos.x - this.dragStart.x;
            const dy = currentMousePos.y - this.dragStart.y;
            
            const selection = this.isDraggingSelection ? getSelection() : [this.draggingEntity];
            const isLocked = getIsDecorationsLocked();

            selection.forEach(entity => {
                if (isLocked && (entity.type === 'rectangle' || entity.type === 'text')) return;
                const startPos = this.startPositions.get(entity);
                if (startPos) {
                    entity.x = startPos.x + dx;
                    entity.y = startPos.y + dy;
                }
            });

        } else if (this.draggingControlPoint) {
            const point = this.draggingControlPoint.edge.controlPoints[this.draggingControlPoint.pointIndex];
            point.x = this.mousePos.x;
            point.y = this.mousePos.y;
        } else if (this.isMarqueeSelecting) {
            this.marqueeRect.w = this.mousePos.x - this.marqueeRect.x;
            this.marqueeRect.h = this.mousePos.y - this.marqueeRect.y;
        }
    };

    const handleMouseUp = (e) => {
        if (this.isMarqueeSelecting) {
            const normalizedRect = this.normalizeRect(this.marqueeRect);
            if (normalizedRect.w > 5 || normalizedRect.h > 5) onMarqueeSelect(this.marqueeRect, e.ctrlKey, e.shiftKey);
        }
        if (this.isCreatingEdge && e.button === 2) {
            const targetClick = this.getClickableEntityAt(this.mousePos.x, this.mousePos.y, { isDecorationsLocked: true });
            if (targetClick && targetClick.type === 'node' && this.edgeCreationSource && targetClick.entity.id !== this.edgeCreationSource.id) {
                onEdgeCreated(this.edgeCreationSource, targetClick.entity);
            }
        }
        
        this.dragging = this.draggingEntity = this.draggingControlPoint = this.isCreatingEdge = this.isMarqueeSelecting = this.isDraggingSelection = false;
        this.canvas.style.cursor = 'grab';
        document.body.classList.remove('is-dragging');
        this.snapLines = [];
        this.startPositions.clear();
        
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);

        setTimeout(() => { this.dragged = false; }, 0);
    };
    
    this.canvas.addEventListener('mousedown', (e) => {
        this.isAnimatingPan = false; 
        const isEditor = getIsEditorMode();
        const mousePos = this.getCanvasCoords(e);
        this.dragged = false;
        this.dragStart = mousePos;
        
        const handlePanStart = () => {
            if (onManualPan) onManualPan();
            this.dragging = true;
            this.dragStart.x = e.clientX - this.offset.x;
            this.dragStart.y = e.clientY - this.offset.y;
        };

        if (e.button === 0) { // Left mouse button
            if (!isEditor) {
                handlePanStart();
            } else {
                 const cp = this.getControlPointAt(mousePos.x, mousePos.y);
                 if (cp) {
                     this.draggingControlPoint = cp;
                 } else {
                     const clicked = this.getClickableEntityAt(mousePos.x, mousePos.y, { isDecorationsLocked: getIsDecorationsLocked() });
                     if (clicked) {
                         const entity = clicked.entity;
                         this.draggingEntity = entity;
                         this.isDraggingSelection = entity.selected;
                         
                         // Store initial positions for all selected items for smooth dragging
                         const selection = this.isDraggingSelection ? getSelection() : [entity];
                         this.startPositions.clear();
                         selection.forEach(item => {
                             this.startPositions.set(item, { x: item.x, y: item.y });
                         });

                     } else {
                         this.isMarqueeSelecting = true;
                         this.marqueeRect = { x: mousePos.x, y: mousePos.y, w: 0, h: 0 };
                     }
                 }
            }
        } else if (e.button === 1) { // Middle mouse button
             handlePanStart();
        } else if (e.button === 2) { // Right mouse button
            e.preventDefault();
            if (isEditor) {
                const cp = this.getControlPointAt(mousePos.x, mousePos.y);
                if (cp) {
                    cp.edge.controlPoints.splice(cp.pointIndex, 1);
                } else {
                    const clickedNode = this.getClickableEntityAt(mousePos.x, mousePos.y, { isDecorationsLocked: true });
                    if (clickedNode && clickedNode.type === 'node') {
                        this.isCreatingEdge = true;
                        this.edgeCreationSource = clickedNode.entity;
                    }
                }
            }
        }

        if (this.dragging || this.draggingEntity || this.draggingControlPoint || this.isCreatingEdge || this.isMarqueeSelecting) {
            this.canvas.style.cursor = this.dragging ? 'grabbing' : 'crosshair';
            document.body.classList.add('is-dragging');
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
    });

    this.canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        this.isAnimatingPan = false;
        if (onManualPan) onManualPan();
        const zoomIntensity = 0.1;
        const wheel = e.deltaY < 0 ? 1 : -1;
        const zoom = Math.exp(wheel * zoomIntensity);
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left, mouseY = e.clientY - rect.top;
        this.offset.x = mouseX - (mouseX - this.offset.x) * zoom;
        this.offset.y = mouseY - (mouseY - this.offset.y) * zoom;
        this.scale = Math.max(0.1, Math.min(5, this.scale * zoom));
    });

    this.canvas.addEventListener('click', onClick);
    this.canvas.addEventListener('dblclick', onDblClick);
  }

  // --- Utility and Helper Methods ---
  
  centerOnNode(nodeId, targetScale = null) {
    if (!this.graphData) return;
    const node = this.graphData.getNodeById(nodeId);
    if (!node) return;

    this.isAnimatingPan = true;
    const nodeCenterX = node.x + NODE_WIDTH / 2;
    const nodeCenterY = node.y + NODE_HEADER_HEIGHT / 2;
    const finalScale = targetScale !== null ? targetScale : this.scale;
    const targetOffsetX = (this.canvas.width / 2) - (nodeCenterX * finalScale);
    const targetOffsetY = (this.canvas.height / 2) - (nodeCenterY * finalScale);
    
    const startOffsetX = this.offset.x, startOffsetY = this.offset.y, startScale = this.scale;
    const diffX = targetOffsetX - startOffsetX, diffY = targetOffsetY - startOffsetY;
    const diffScale = finalScale - startScale;
    const duration = 500;
    let startTime = null;

    const animate = (timestamp) => {
        if (!this.isAnimatingPan) return;
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        let progress = Math.min(elapsed / duration, 1);
        progress = progress * (2 - progress); // Ease-out
        
        this.offset.x = startOffsetX + diffX * progress;
        this.offset.y = startOffsetY + diffY * progress;
        if (diffScale !== 0) {
            this.scale = startScale + diffScale * progress;
        }
        
        this.renderLoop();

        if (elapsed < duration) {
            requestAnimationFrame(animate);
        } else {
            this.offset.x = targetOffsetX;
            this.offset.y = targetOffsetY;
            this.scale = finalScale;
            this.isAnimatingPan = false;
            this.renderLoop();
        }
    };
    requestAnimationFrame(animate);
  }

  // --- The rest of the helper methods are unchanged from the initial dump ---
  _getWrappedLines(textObj) { const { textContent, fontSize, width } = textObj; this.ctx.font = `${fontSize}px Segoe UI, sans-serif`; const paragraphs = (textContent || "").split('\n'); const allLines = []; for (const paragraph of paragraphs) { if (!width || width <= 0) { allLines.push(paragraph); } else { const words = paragraph.split(' '); let currentLine = ''; for (const word of words) { const testLine = currentLine ? `${currentLine} ${word}` : word; if (this.ctx.measureText(testLine).width > width && currentLine) { allLines.push(currentLine); currentLine = word; } else { currentLine = testLine; } } allLines.push(currentLine); } } return allLines; }
  _getTextBounds(textObj, renderedLines) { const { fontSize, width, lineHeight } = textObj; let maxWidth = 0; if (width > 0) { maxWidth = width; } else { this.ctx.font = `${fontSize}px Segoe UI, sans-serif`; renderedLines.forEach(line => { maxWidth = Math.max(maxWidth, this.ctx.measureText(line).width); }); } const totalHeight = (renderedLines.length > 0) ? (renderedLines.length * fontSize * lineHeight) - (fontSize * (lineHeight - 1)) : 0; return { width: maxWidth, height: totalHeight }; }
  _fitText(text, maxWidth) { if(this.ctx.measureText(text).width <= maxWidth) return text; while (this.ctx.measureText(text + '...').width > maxWidth && text.length > 0) text = text.slice(0, -1); return text + '...'; }
  _isNodeInView(node) { const rect = this._getNodeVisualRect(node); const screenRect = { x: rect.x * this.scale + this.offset.x, y: rect.y * this.scale + this.offset.y, width: rect.width * this.scale, height: rect.height * this.scale }; return screenRect.x < this.canvas.width && screenRect.x + screenRect.width > 0 && screenRect.y < this.canvas.height && screenRect.y + screenRect.height > 0; }
  getViewportCenter() { return { x: (this.canvas.width / 2 - this.offset.x) / this.scale, y: (this.canvas.height / 2 - this.offset.y) / this.scale }; }
  getViewport() { return { offset: this.offset, scale: this.scale }; }
  setViewport(view) { if (view.offset && typeof view.offset.x === 'number') { this.offset = view.offset; } if (typeof view.scale === 'number') { this.scale = view.scale; } }
  _getNodeVisualRect(node) { const contentHeight = node.isCollapsed ? 0 : NODE_CONTENT_HEIGHT; return { x: node.x, y: node.y - contentHeight, width: NODE_WIDTH, height: NODE_HEADER_HEIGHT + contentHeight }; }
  _getDecorationBounds(deco) { if (deco.type === 'rectangle') return { x: deco.x, y: deco.y, width: deco.width, height: deco.height }; if (deco.type === 'text') { const lines = this._getWrappedLines(deco); const bounds = this._getTextBounds(deco, lines); return { x: deco.x - (deco.textAlign === 'center' ? bounds.width / 2 : (deco.textAlign === 'right' ? bounds.width : 0)), y: deco.y - bounds.height / 2, width: bounds.width, height: bounds.height }; } return { x: deco.x, y: deco.y, width: 0, height: 0 }; }
  getClickableEntityAt(x, y, { isDecorationsLocked } = {}) { for (let i = this.graphData.nodes.length - 1; i >= 0; i--) { const node = this.graphData.nodes[i]; const rect = this._getNodeVisualRect(node); if (x > rect.x && x < rect.x + rect.width && y > rect.y && y < rect.y + rect.height) { return { type: 'node', entity: node }; } } const edge = this.getEdgeAt(x, y); if (edge) return { type: 'edge', entity: edge }; if (!isDecorationsLocked) { for (let i = this.graphData.decorations.length - 1; i >= 0; i--) { const deco = this.graphData.decorations[i]; const bounds = this._getDecorationBounds(deco); if (x > bounds.x && x < bounds.x + bounds.width && y > bounds.y && y < bounds.y + bounds.height) { return { type: 'decoration', entity: deco }; } } } return null; }
  getNodesInRect(rect) { const normalizedRect = this.normalizeRect(rect); return this.graphData.nodes.filter(node => { const nodeRect = this._getNodeVisualRect(node); return ( nodeRect.x < normalizedRect.x + normalizedRect.w && nodeRect.x + nodeRect.width > normalizedRect.x && nodeRect.y < normalizedRect.y + normalizedRect.h && nodeRect.y + nodeRect.height > normalizedRect.y ); }); }
  getEdgesInRect(rect, nodesInRect) { const nodeIdsInRect = new Set(nodesInRect.map(n => n.id)); return this.graphData.edges.filter(edge => nodeIdsInRect.has(edge.source) && nodeIdsInRect.has(edge.target)); }
  getDecorationsInRect(rect) { const normalizedRect = this.normalizeRect(rect); return this.graphData.decorations.filter(deco => { const decoBounds = this._getDecorationBounds(deco); return normalizedRect.x < decoBounds.x + decoBounds.width && normalizedRect.x + normalizedRect.w > decoBounds.x && normalizedRect.y < decoBounds.y + decoBounds.height && normalizedRect.y + normalizedRect.h > decoBounds.y; }); }
  normalizeRect(rect) { return { x: rect.w < 0 ? rect.x + rect.w : rect.x, y: rect.h < 0 ? rect.y + rect.h : rect.y, w: Math.abs(rect.w), h: Math.abs(rect.h) }; }
  getControlPointAt(x, y) { const tolerance = 8 / this.scale; for (const edge of this.graphData.edges) { for (let i = 0; i < (edge.controlPoints || []).length; i++) { const point = edge.controlPoints[i]; if (Math.hypot(x - point.x, y - point.y) < tolerance) return { edge, pointIndex: i }; } } return null; }
  getEdgeAt(x, y) { const tolerance = 10 / this.scale; for (const edge of this.graphData.edges) { const src = this.graphData.getNodeById(edge.source); const trg = this.graphData.getNodeById(edge.target); if (!src || !trg) continue; const controlPoints = edge.controlPoints || []; const srcHeaderCenter = { x: src.x + NODE_WIDTH / 2, y: src.y + NODE_HEADER_HEIGHT / 2 }; const trgHeaderCenter = { x: trg.x + NODE_WIDTH / 2, y: trg.y + NODE_HEADER_HEIGHT / 2 }; const targetPointForAngle = controlPoints.length > 0 ? controlPoints[0] : trgHeaderCenter; const startPoint = this._getIntersectionWithNodeRect(src, targetPointForAngle); const sourcePointForAngle = controlPoints.length > 0 ? controlPoints.at(-1) : srcHeaderCenter; const endPoint = this._getIntersectionWithNodeRect(trg, sourcePointForAngle); const pathPoints = [startPoint, ...controlPoints, endPoint]; for (let i = 0; i < pathPoints.length - 1; i++) { const p1 = pathPoints[i], p2 = pathPoints[i + 1]; const len = Math.hypot(p2.x - p1.x, p2.y - p1.y); if (len < 1) continue; const dot = (((x - p1.x) * (p2.x - p1.x)) + ((y - p1.y) * (p2.y - p1.y))) / (len * len); if (dot >= 0 && dot <= 1) { const closestX = p1.x + (dot * (p2.x - p1.x)), closestY = p1.y + (dot * (p2.y - p1.y)); if (Math.hypot(x - closestX, y - closestY) < tolerance) return edge; } } } return null; }
  _drawArrow(x, y, angle, color, size) { this.ctx.save(); this.ctx.translate(x, y); this.ctx.rotate(angle); this.ctx.beginPath(); this.ctx.moveTo(0, 0); this.ctx.lineTo(-size, -size * 0.4); this.ctx.lineTo(-size, size * 0.4); this.ctx.closePath(); this.ctx.fillStyle = color; this.ctx.fill(); this.ctx.restore(); }
  _getIntersectionWithNodeRect(node, externalPoint) { const logicalCenterX = node.x + NODE_WIDTH / 2; const logicalCenterY = node.y + NODE_HEADER_HEIGHT / 2; const rect = this._getNodeVisualRect(node); const dx = externalPoint.x - logicalCenterX; const dy = externalPoint.y - logicalCenterY; if (dx === 0 && dy === 0) return { x: logicalCenterX, y: logicalCenterY }; let t = Infinity; if (dy < 0) { const t_y = (rect.y - logicalCenterY) / dy; const x = logicalCenterX + t_y * dx; if (x >= rect.x && x <= rect.x + rect.width) { t = Math.min(t, t_y); } } if (dy > 0) { const t_y = (rect.y + rect.height - logicalCenterY) / dy; const x = logicalCenterX + t_y * dx; if (x >= rect.x && x <= rect.x + rect.width) { t = Math.min(t, t_y); } } if (dx < 0) { const t_x = (rect.x - logicalCenterX) / dx; const y = logicalCenterY + t_x * dy; if (y >= rect.y && y <= rect.y + rect.height) { t = Math.min(t, t_x); } } if (dx > 0) { const t_x = (rect.x + rect.width - logicalCenterX) / dx; const y = logicalCenterY + t_x * dy; if (y >= rect.y && y <= rect.y + rect.height) { t = Math.min(t, t_x); } } if (t !== Infinity && t > 0) { return { x: logicalCenterX + t * dx, y: logicalCenterY + t * dy }; } const angle = Math.atan2(dy, dx); const tan = Math.tan(angle); if (Math.abs((rect.height / 2) * dx) > Math.abs((rect.width / 2) * dy)) { const ix = rect.x + (dx > 0 ? rect.width : 0); return { x: ix, y: logicalCenterY + (ix - logicalCenterX) * tan }; } else { const iy = rect.y + (dy > 0 ? rect.height : 0); return { x: logicalCenterX + (iy - logicalCenterY) / tan, y: iy }; } }
  drawTemporaryEdge() { const ctx = this.ctx; const startX = this.edgeCreationSource.x + NODE_WIDTH / 2; const startY = this.edgeCreationSource.y + NODE_HEADER_HEIGHT / 2; ctx.save(); ctx.beginPath(); ctx.moveTo(startX, startY); ctx.lineTo(this.mousePos.x, this.mousePos.y); ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 3; ctx.setLineDash([5, 5]); ctx.stroke(); ctx.restore(); }
  drawMarquee() { const ctx = this.ctx; ctx.save(); ctx.fillStyle = 'rgba(70, 130, 180, 0.2)'; ctx.fillRect(this.marqueeRect.x, this.marqueeRect.y, this.marqueeRect.w, this.marqueeRect.h); ctx.strokeStyle = 'rgba(70, 130, 180, 0.8)'; ctx.lineWidth = 1 / this.scale; ctx.setLineDash([5 / this.scale, 3 / this.scale]); ctx.strokeRect(this.marqueeRect.x, this.marqueeRect.y, this.marqueeRect.w, this.marqueeRect.h); ctx.restore(); }
  _drawSnapGuides() { /* Placeholder */ }
}