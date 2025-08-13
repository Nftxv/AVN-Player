/**
 * AVN Player - Renderer Module
 * with HTML Overlays, LOD, and Grouping
 * by Nftxv
 */
const NODE_WIDTH = 200;
const NODE_HEADER_HEIGHT = 45;
const NODE_CONTENT_HEIGHT_DEFAULT = NODE_WIDTH * (9/16); // For iframes and audio without covers
const NODE_CONTENT_HEIGHT_SQUARE = NODE_WIDTH;          // For audio with covers (1:1 aspect ratio)
const DECORATION_LOD_THRESHOLD = 2.0;

export default class Renderer {
  constructor(canvasId, iframeContainer, markdownContainer) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.iframeContainer = iframeContainer;
    this.markdownContainer = markdownContainer;
    
    this.graphData = null; 
    this.markdownOverlays = new Map();
    this.imageCache = new Map();

    this.offset = { x: 0, y: 0 };
    this.scale = 1.0;
    this.dragStart = { x: 0, y: 0 };
    this.dragged = false;
    this.dragging = false;
    this.draggingEntity = null;
    this.isDraggingSelection = false;

    // Mobile & Touch properties
    this.longPressTimer = null;
    this.activeInteractionOverlay = null;
    
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
    
    this.updateIframes();
    this.updateMarkdownOverlays(isLodActive);

    requestAnimationFrame(this.renderLoop);
  }

  drawDecoration(deco, isLodActive) {
    if (isLodActive && deco.backgroundColor !== 'transparent') {
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
    if (rect.backgroundColor !== 'transparent') {
        ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
    }
    
    if (rect.selected) {
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = 2 / this.scale;
        ctx.setLineDash([6 / this.scale, 4 / this.scale]);
        ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
    }
    ctx.restore();
  }
  
drawEdge(edge) {
      const src = this.graphData.getNodeById(edge.source);
      const trg = this.graphData.getNodeById(edge.target);
      if (!src || !trg) return;
      
      const controlPoints = edge.controlPoints || [];
      // Use header centers for stable angle calculation
      const srcHeaderCenter = { x: src.x + NODE_WIDTH / 2, y: src.y + NODE_HEADER_HEIGHT / 2 };
      const trgHeaderCenter = { x: trg.x + NODE_WIDTH / 2, y: trg.y + NODE_HEADER_HEIGHT / 2 };
      
      const targetPointForAngle = controlPoints.length > 0 ? controlPoints[0] : trgHeaderCenter;
      const sourcePointForAngle = controlPoints.length > 0 ? controlPoints.at(-1) : srcHeaderCenter;

      const startPoint = this._getIntersectionWithNodeRect(src, targetPointForAngle);
      const endPoint = this._getIntersectionWithNodeRect(trg, sourcePointForAngle);      
      
      const pathPoints = [startPoint, ...controlPoints, endPoint];
      const ctx = this.ctx;
      ctx.save();
      
      let color = edge.color || '#888888';
      if (edge.selected) color = '#28d1e7ff';
      if (edge.highlighted) color = '#FFD700';
      
      const baseWidth = edge.lineWidth || 2;
      const lineWidth = (edge.selected || edge.highlighted) ? baseWidth + 1 : baseWidth;

      // Make line width scale down slightly when zooming out to feel more proportional.
      // It ensures the line is at least 0.75px wide on screen.
      const screenLineWidth = Math.max(0.75, lineWidth * Math.min(1.0, Math.pow(this.scale, 0.6)));
      ctx.lineWidth = screenLineWidth / this.scale;

      // Make arrow size and pullback gap proportional to the calculated line width.
      // It's larger when zoomed in and doesn't shrink to nothing when zoomed out.
      const arrowSizeOnScreen = Math.max(15, Math.min(20, screenLineWidth * 3.0));
      // Adjust world size to counteract scale, keeping perceived size more constant.
      const arrowSizeInWorld = arrowSizeOnScreen / Math.sqrt(this.scale);

      const pForArrow = pathPoints.at(-1); // The point ON the border
      const pBeforeArrow = pathPoints.length > 1 ? pathPoints.at(-2) : startPoint;
      const angle = Math.atan2(pForArrow.y - pBeforeArrow.y, pForArrow.x - pBeforeArrow.x);
      
      const offset = arrowSizeInWorld;
      const adjustedEndPoint = {
          x: pForArrow.x - offset * Math.cos(angle),
          y: pForArrow.y - offset * Math.sin(angle)
      };

      ctx.beginPath();
      ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
      for (let i = 1; i < pathPoints.length - 1; i++) {
          ctx.lineTo(pathPoints[i].x, pathPoints[i].y);
      }
      if (Math.hypot(adjustedEndPoint.x - pBeforeArrow.x, adjustedEndPoint.y - pBeforeArrow.y) > 1) {
          ctx.lineTo(adjustedEndPoint.x, adjustedEndPoint.y);
      }
      
      ctx.strokeStyle = color; 
      ctx.stroke();
      
      this._drawArrow(pForArrow.x, pForArrow.y, angle, color, arrowSizeInWorld);

      // ... rest of the function ...
      if(this.scale > 0.5) {
          controlPoints.forEach(point => {
              ctx.beginPath();
              ctx.arc(point.x, point.y, 5 / this.scale, 0, 2 * Math.PI);
              ctx.fillStyle = edge.selected ? '#e74c3c' : color;
              ctx.fill();
          });
      }
      if (edge.label && this.scale > 0.3) {
        const midIndex = Math.floor((pathPoints.length - 2) / 2);
        const p1 = pathPoints[midIndex], p2 = pathPoints[midIndex + 1];
        ctx.font = `${12}px "Segoe UI"`;
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.save();
        ctx.translate((p1.x + p2.x)/2, (p1.y + p2.y)/2);
        const rotationAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        if (rotationAngle > Math.PI / 2 || rotationAngle < -Math.PI / 2) ctx.rotate(rotationAngle + Math.PI); else ctx.rotate(rotationAngle);
        ctx.fillText(edge.label, 0, -8 / this.scale);
        ctx.restore();
      }
      ctx.restore();
  }

  _drawNodeContent(node) {
    if (node.isCollapsed) return;

    const ctx = this.ctx;
    const containerX = node.x;
    const containerW = NODE_WIDTH;
    let containerH, containerY;

    // All audio nodes get a square content area for the cover
    if (node.sourceType === 'audio') {
      containerH = NODE_CONTENT_HEIGHT_SQUARE;
    } else {
      containerH = NODE_CONTENT_HEIGHT_DEFAULT;
    }
    containerY = node.y - containerH;

    // Draw content for iframe
    if (node.sourceType === 'iframe') {
      ctx.fillStyle = '#000000';
      ctx.fillRect(containerX, containerY, containerW, containerH);
      return;
    }

    // Draw content for audio, using default cover as a fallback
    if (node.sourceType === 'audio') {
      const isDefaultCover = !node.coverUrl;
      const imageUrl = node.coverUrl || 'icons/default-cover.jpg';
      const cachedImage = this.imageCache.get(imageUrl);

      if (cachedImage instanceof Image) {
        ctx.drawImage(cachedImage, containerX, containerY, containerW, containerH);
      } else {
        ctx.fillStyle = '#1e1e1e'; // Placeholder color
        ctx.fillRect(containerX, containerY, containerW, containerH);
        if (!cachedImage) {
          this.imageCache.set(imageUrl, 'loading');
          const img = new Image();
          // Only set crossOrigin for remote images, not for the local fallback.
          if (!isDefaultCover) {
            img.crossOrigin = "Anonymous";
          }
          img.onload = () => this.imageCache.set(imageUrl, img);
          img.onerror = () => {
            console.error(`Renderer: Failed to load cover image at ${imageUrl}`);
            this.imageCache.set(imageUrl, 'failed');
          };
          img.src = imageUrl;
        }
      }
    } else {
      // Fallback for other potential node types
      ctx.fillStyle = '#1e1e1e';
      ctx.fillRect(containerX, containerY, containerW, containerH);
    }
  }

_drawNodeHeader(node) {
    const ctx = this.ctx;
    ctx.save();
    
    // Draw header background
    ctx.fillStyle = '#2d2d2d';
    const cornerRadius = 8;
    ctx.beginPath();
    ctx.roundRect(node.x, node.y, NODE_WIDTH, NODE_HEADER_HEIGHT, [0, 0, cornerRadius, cornerRadius]);
    ctx.fill();
    
    // Border for selection or default state
    ctx.strokeStyle = node.selected ? '#16e049ff' : '#424242';
    ctx.lineWidth = node.selected ? 2 : 1;
    ctx.stroke();

    // Draw title text
    ctx.fillStyle = '#e0e0e0';
    ctx.font = '14px "Segoe UI"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const fittedTitle = this._fitText(node.title, NODE_WIDTH - 20); 
    const titleX = node.x + NODE_WIDTH / 2;
    const titleY = node.y + NODE_HEADER_HEIGHT / 2;
    ctx.fillText(fittedTitle, titleX, titleY);

    // Draw player mode highlight indicator with custom blink animation
    if (node.highlighted) {
        
        // --- Animation Configuration (Easy to tweak) ---
        const ON_DURATION = 2400;      // ms -- How long it stays fully bright
        const FADE_OUT_DURATION = 300; // ms -- How long it takes to fade out
        const OFF_DURATION = 600;      // ms -- How long it stays dim
        const FADE_IN_DURATION = 300;  // ms -- How long it takes to fade in

        const maxOpacity = 1.0;
        const minOpacity = 0.0;
        
        // --- Animation Logic ---
        const TOTAL_CYCLE_DURATION = ON_DURATION + FADE_OUT_DURATION + OFF_DURATION + FADE_IN_DURATION;
        const timeInCycle = Date.now() % TOTAL_CYCLE_DURATION;

        let opacity = maxOpacity;

        // Phase 1: ON
        if (timeInCycle < ON_DURATION) {
            opacity = maxOpacity;
        }
        // Phase 2: Fading Out
        else if (timeInCycle < ON_DURATION + FADE_OUT_DURATION) {
            const timeInFade = timeInCycle - ON_DURATION;
            const progress = timeInFade / FADE_OUT_DURATION;
            opacity = maxOpacity - progress * (maxOpacity - minOpacity);
        }
        // Phase 3: OFF
        else if (timeInCycle < ON_DURATION + FADE_OUT_DURATION + OFF_DURATION) {
            opacity = minOpacity;
        }
        // Phase 4: Fading In
        else {
            const timeInFade = timeInCycle - (ON_DURATION + FADE_OUT_DURATION + OFF_DURATION);
            const progress = timeInFade / FADE_IN_DURATION;
            opacity = minOpacity + progress * (maxOpacity - minOpacity);
        }
        
        // --- Drawing Logic ---
        const radius = 5;
        const padding = 8;
        const circleX = node.x + padding;
        const circleY = node.y + NODE_HEADER_HEIGHT - padding;

        ctx.save();
        ctx.globalAlpha = opacity;
        
        ctx.fillStyle = '#21da58ff'; 
        ctx.beginPath();
        ctx.arc(circleX, circleY, radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }

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

  updateIframes() {
    if (!this.graphData) return;
    this.graphData.nodes.forEach(node => {
        if (node.sourceType !== 'iframe') return;
        const wrapper = document.getElementById(`iframe-wrapper-${node.id}`);
        if (!wrapper) return;

        wrapper.classList.toggle('selected', !!node.selected);      // For Editor Mode
        wrapper.classList.toggle('highlighted', !!node.highlighted); // For Player Mode

        const isInView = this._isNodeInView(node);
        const shouldBeVisible = !node.isCollapsed && isInView;
        if (wrapper.style.display !== (shouldBeVisible ? 'block' : 'none')) {
            wrapper.style.display = shouldBeVisible ? 'block' : 'none';
        }
        if (shouldBeVisible) {
            const screenX = (node.x) * this.scale + this.offset.x;
            const screenY = (node.y - NODE_CONTENT_HEIGHT_DEFAULT) * this.scale + this.offset.y;
            const screenWidth = NODE_WIDTH * this.scale;
            const screenHeight = NODE_CONTENT_HEIGHT_DEFAULT * this.scale;
            wrapper.style.transform = `translate(${screenX}px, ${screenY}px)`;
            wrapper.style.width = `${screenWidth}px`;
            wrapper.style.height = `${screenHeight}px`;
        }
    });
  }

  updateMarkdownOverlays(isLodActive) {
      if (!this.graphData) return;
      this.graphData.decorations.forEach(deco => {
          if (deco.type !== 'markdown') return;
          
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

              // REVISED: Font size is now static in CSS, not scaled, to scale with its container.
              overlay.style.fontSize = `${(deco.fontSize || 14) * Math.sqrt(this.scale)}px`;
              //overlay.style.fontSize = `${(deco.fontSize || 14) * this.scale}px`;
              
              overlay.classList.toggle('selected', !!deco.selected);

          } else if (overlay) {
              this.destroyMarkdownOverlay(deco.id);
          }
      });
  }

  _createMarkdownOverlay(deco) {
      const overlay = document.createElement('div');
      overlay.id = `md-overlay-${deco.id}`;
      overlay.className = 'markdown-overlay';
      overlay.style.backgroundColor = deco.backgroundColor;

      this.updateMarkdownOverlayContent(overlay, deco);

      this.markdownContainer.appendChild(overlay);
      this.markdownOverlays.set(deco.id, overlay);
      return overlay;
  }
  
  updateMarkdownOverlay(decoId) {
      const deco = this.graphData.getDecorationById(decoId);
      const overlay = this.markdownOverlays.get(decoId);
      if (deco && overlay) {
          this.updateMarkdownOverlayContent(overlay, deco);
          overlay.style.backgroundColor = deco.backgroundColor;
      }
  }

  updateMarkdownOverlayContent(overlay, deco) {
      const content = DOMPurify.sanitize(marked.parse(deco.textContent, { breaks: true }), {
        ADD_ATTR: ['target'],
      });
      overlay.innerHTML = content;
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
    if (node.isCollapsed) {
      return { x: node.x, y: node.y, width: NODE_WIDTH, height: NODE_HEADER_HEIGHT };
    }

    let contentHeight;
    // Use square height for all audio nodes (with or without covers)
    if (node.sourceType === 'audio') {
      contentHeight = NODE_CONTENT_HEIGHT_SQUARE;
    } else {
      contentHeight = NODE_CONTENT_HEIGHT_DEFAULT;
    }
    
    const totalHeight = NODE_HEADER_HEIGHT + contentHeight;
    return { x: node.x, y: node.y - contentHeight, width: NODE_WIDTH, height: totalHeight };
  }

  _getDecorationBounds(deco) {
      return { x: deco.x, y: deco.y, width: deco.width, height: deco.height };
  }

  getClickableEntityAt(x, y, { isDecorationsLocked } = {}) {
    // Nodes are on top
    for (let i = this.graphData.nodes.length - 1; i >= 0; i--) {
        const node = this.graphData.nodes[i];
        const rect = this._getNodeVisualRect(node);
        if (x > rect.x && x < rect.x + rect.width && y > rect.y && y < rect.y + rect.height) {
            const headerRect = { x: node.x, y: node.y, width: NODE_WIDTH, height: NODE_HEADER_HEIGHT };
            const isHeaderClick = (x > headerRect.x && x < headerRect.x + headerRect.width && y > headerRect.y && y < headerRect.y + headerRect.height);
            return { type: 'node', entity: node, part: isHeaderClick ? 'header' : 'body' };
        }
    }
      
    const edge = this.getEdgeAt(x, y);
    if (edge) return { type: 'edge', entity: edge };

    if (!isDecorationsLocked) {
        if (this.scale < DECORATION_LOD_THRESHOLD) {
            const tolerance = 7 / this.scale;
            for (let i = this.graphData.decorations.length - 1; i >= 0; i--) {
                 const deco = this.graphData.decorations[i];
                 if (deco.backgroundColor === 'transparent') continue;
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
                if (x > bounds.x && x < bounds.x + bounds.width && y > bounds.y && y < bounds.y + bounds.height) {
                    if (deco.backgroundColor === 'transparent' && !deco.selected) continue;
                    return { type: 'decoration', entity: deco };
                }
            }
        }
    }
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
    const rect = this._getNodeVisualRect(node);
    const rayOrigin = { x: node.x + NODE_WIDTH / 2, y: node.y + NODE_HEADER_HEIGHT / 2 };
    const dir = { x: externalPoint.x - rayOrigin.x, y: externalPoint.y - rayOrigin.y };

    if (Math.abs(dir.x) < 1e-6 && Math.abs(dir.y) < 1e-6) {
      return rayOrigin; // Points are identical.
    }

    let t = Infinity;

    // --- Vertical Sides (Left and Right) ---
    if (dir.x !== 0) {
      const tLeft = (rect.x - rayOrigin.x) / dir.x;
      if (tLeft >= 0) {
        const y = rayOrigin.y + tLeft * dir.y;
        if (y >= rect.y && y <= rect.y + rect.height) {
          t = Math.min(t, tLeft);
        }
      }
      
      const tRight = (rect.x + rect.width - rayOrigin.x) / dir.x;
      if (tRight >= 0) {
        const y = rayOrigin.y + tRight * dir.y;
        if (y >= rect.y && y <= rect.y + rect.height) {
          t = Math.min(t, tRight);
        }
      }
    }

    // --- Horizontal Sides (Top and Bottom) ---
    if (dir.y !== 0) {
      const tTop = (rect.y - rayOrigin.y) / dir.y;
      if (tTop >= 0) {
        // CORRECTED: Was dir.y, should be dir.x
        const x = rayOrigin.x + tTop * dir.x;
        if (x >= rect.x && x <= rect.x + rect.width) {
          t = Math.min(t, tTop);
        }
      }
      
      const tBottom = (rect.y + rect.height - rayOrigin.y) / dir.y;
      if (tBottom >= 0) {
        // CORRECTED: Was dir.y, should be dir.x
        const x = rayOrigin.x + tBottom * dir.x;
        if (x >= rect.x && x <= rect.x + rect.width) {
          t = Math.min(t, tBottom);
        }
      }
    }

    // Clamp 't' to not go past the external point (e.g. control points)
    t = Math.min(t, 1.0);

    if (Number.isFinite(t)) {
      return { x: rayOrigin.x + t * dir.x, y: rayOrigin.y + t * dir.y };
    }

    // Fallback if target is inside the node
    return externalPoint;
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
  
  _getSnappedPosition(pos, movingEntity) {
      return pos;
  }
  _drawSnapGuides() { }

  centerOnNode(nodeId, targetScale = null, screenOffset = null) {
    if (!this.graphData) return;
    const node = this.graphData.getNodeById(nodeId);
    if (!node) return;

    this.isAnimatingPan = true;
    const finalScale = targetScale !== null ? targetScale : this.scale;
    
    // REVISED: screenOffset is now the offset of the node from the screen center
    const finalScreenOffset = screenOffset || { x: 0, y: 0 };
    
    const nodeCenterX = node.x + NODE_WIDTH / 2;
    const nodeCenterY = node.y + NODE_HEADER_HEIGHT / 2;
    
    const targetOffsetX = (this.canvas.width / 2) - (nodeCenterX * finalScale) - finalScreenOffset.x;
    const targetOffsetY = (this.canvas.height / 2) - (nodeCenterY * finalScale) - finalScreenOffset.y;

    const startOffsetX = this.offset.x, startOffsetY = this.offset.y;
    const startScale = this.scale;

    const diffX = targetOffsetX - startOffsetX, diffY = targetOffsetY - startOffsetY;
    const diffScale = finalScale - startScale;

    const duration = 500;
    let startTime = null;

    const animate = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        if (elapsed >= duration || !this.isAnimatingPan) {
            this.offset.x = targetOffsetX;
            this.offset.y = targetOffsetY;
            this.scale = finalScale;
            this.isAnimatingPan = false;
            return;
        }

        let progress = Math.min(elapsed / duration, 1);
        progress = progress * (2 - progress); // Ease-out

        this.offset.x = startOffsetX + diffX * progress;
        this.offset.y = startOffsetY + diffY * progress;
        this.scale = startScale + diffScale * progress;
        
        requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }
disableLocalInteraction() {
    if (this.activeInteractionOverlay) {
        this.activeInteractionOverlay.classList.remove('interaction-enabled');
        this.activeInteractionOverlay = null;
    }
  }

  findOverlayAtScreenPoint(clientX, clientY) {
    const overlays = [
        ...Array.from(this.markdownOverlays.values()),
        ...Array.from(this.iframeContainer.children)
    ];

    for (const overlay of overlays.reverse()) { // Check top-most elements first
        if (overlay.style.display === 'none') continue;
        const rect = overlay.getBoundingClientRect();
        if (clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom) {
            return overlay;
        }
    }
    return null;
  }

  setupCanvasInteraction(callbacks) {
    const { getIsEditorMode, getIsDecorationsLocked, onClick, onDblClick, onEdgeCreated, onMarqueeSelect, getSelection } = callbacks;
    window.addEventListener('resize', () => this.resizeCanvas());
    this.canvas.addEventListener('contextmenu', e => e.preventDefault());
    
    // --- Mouse Handlers (for Desktop) ---
    const handleMouseMove = (e) => {
        if (this.longPressTimer) { clearTimeout(this.longPressTimer); this.longPressTimer = null; }
        const oldMousePos = this.mousePos;
        this.mousePos = this.getCanvasCoords(e);
        if (e.buttons === 0) { handleMouseUp(e); return; }
        this.dragged = true;
        if (this.dragging) { this.offset.x = e.clientX - this.dragStart.x; this.offset.y = e.clientY - this.dragStart.y; }
        else if (this.draggingEntity) {
            const dx = this.mousePos.x - oldMousePos.x; const dy = this.mousePos.y - oldMousePos.y;
            if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) return;
            const selection = this.isDraggingSelection ? getSelection() : [this.draggingEntity];
            const movedItems = new Set();
            const move = (entity) => {
                if (!entity || movedItems.has(entity.id) || (getIsDecorationsLocked() && entity.type)) return;
                movedItems.add(entity.id); entity.x += dx; entity.y += dy;
                if (entity.type === 'rectangle' || entity.sourceType) {
                    this.graphData.decorations.forEach(child => { if (child.parentId === entity.id) move(child); });
                    if (entity.sourceType) { this.graphData.decorations.forEach(c => { if(c.attachedToNodeId === entity.id && !c.parentId) move(c); }); }
                }
                if(entity.type === 'rectangle' && entity.attachedToNodeId) { const node = this.graphData.getNodeById(entity.attachedToNodeId); if(node) { entity.attachOffsetX = entity.x - node.x; entity.attachOffsetY = entity.y - node.y; } }
            };
            selection.forEach(move);
        } else if (this.draggingControlPoint) { this.draggingControlPoint.edge.controlPoints[this.draggingControlPoint.pointIndex].x = this.mousePos.x; this.draggingControlPoint.edge.controlPoints[this.draggingControlPoint.pointIndex].y = this.mousePos.y;
        } else if (this.isMarqueeSelecting) { this.marqueeRect.w = this.mousePos.x - this.marqueeRect.x; this.marqueeRect.h = this.mousePos.y - this.marqueeRect.y; }
    };
    const handleMouseUp = (e) => {
        if (this.longPressTimer) { clearTimeout(this.longPressTimer); this.longPressTimer = null; }
        if (this.isMarqueeSelecting) { const nRect = this.normalizeRect(this.marqueeRect); if (nRect.w > 5 || nRect.h > 5) onMarqueeSelect(this.marqueeRect, e.ctrlKey, e.shiftKey); }
        if (this.isCreatingEdge && e.button === 2) { const tClick = this.getClickableEntityAt(this.mousePos.x, this.mousePos.y, { isDecorationsLocked: true }); if (tClick?.type === 'node' && this.edgeCreationSource && tClick.entity.id !== this.edgeCreationSource.id) { onEdgeCreated(this.edgeCreationSource, tClick.entity); } }
        this.dragging = this.draggingEntity = this.draggingControlPoint = this.isCreatingEdge = this.isMarqueeSelecting = this.isDraggingSelection = false;
        this.canvas.style.cursor = 'grab';
        window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp);
        setTimeout(() => { this.dragged = false; }, 0);
    };
    this.canvas.addEventListener('mousedown', (e) => {
        this.disableLocalInteraction(); this.isAnimatingPan = false;
        const isEditor = getIsEditorMode(); this.mousePos = this.getCanvasCoords(e); this.dragged = false;
        const handlePanStart = () => { this.dragging = true; this.dragStart.x = e.clientX - this.offset.x; this.dragStart.y = e.clientY - this.offset.y; this.canvas.style.cursor = 'grabbing'; window.addEventListener('mousemove', handleMouseMove); window.addEventListener('mouseup', handleMouseUp); };
        if (e.button === 1 || (e.button === 0 && !isEditor)) { handlePanStart(); return; }
        if (!isEditor) {
            if (e.button === 2) { // Right-click in Player Mode for long-press simulation
                e.preventDefault();
                if (this.longPressTimer) clearTimeout(this.longPressTimer);
                this.longPressTimer = setTimeout(() => {
                    this.longPressTimer = null; if (this.dragged) return;
                    const targetOverlay = this.findOverlayAtScreenPoint(e.clientX, e.clientY);
                    if (targetOverlay) { this.activeInteractionOverlay = targetOverlay; targetOverlay.classList.add('interaction-enabled'); }
                }, 500);
            }
            return;
        }
        if (e.button === 0) { const cp = this.getControlPointAt(this.mousePos.x, this.mousePos.y); if (cp) { this.draggingControlPoint = cp; } else { const clicked = this.getClickableEntityAt(this.mousePos.x, this.mousePos.y, { isDecorationsLocked: getIsDecorationsLocked() }); if (clicked) { this.draggingEntity = clicked.entity; if (clicked.entity.selected) this.isDraggingSelection = true; } else { this.isMarqueeSelecting = true; this.marqueeRect = { x: this.mousePos.x, y: this.mousePos.y, w: 0, h: 0 }; } }
        } else if (e.button === 2) { e.preventDefault(); const cp = this.getControlPointAt(this.mousePos.x, this.mousePos.y); if (cp) { cp.edge.controlPoints.splice(cp.pointIndex, 1); } else { const cNode = this.getClickableEntityAt(this.mousePos.x, this.mousePos.y, { isDecorationsLocked: true }); if (cNode?.type === 'node') { this.isCreatingEdge = true; this.edgeCreationSource = cNode.entity; } } }
        if (this.draggingEntity || this.draggingControlPoint || this.isCreatingEdge || this.isMarqueeSelecting) { this.canvas.style.cursor = 'crosshair'; window.addEventListener('mousemove', handleMouseMove); window.addEventListener('mouseup', handleMouseUp); }
    });
    this.canvas.addEventListener('wheel', (e) => {
        // ** THE FIX IS HERE **
        if (e.target.closest('.interaction-enabled')) {
            return; // Allow default scroll behavior on active overlays
        }
        e.preventDefault(); 
        this.disableLocalInteraction(); this.isAnimatingPan = false; 
        const zoom = Math.exp((e.deltaY < 0 ? 1 : -1) * 0.1); 
        const rect = this.canvas.getBoundingClientRect(); 
        const mX = e.clientX - rect.left, mY = e.clientY - rect.top; 
        const nS = Math.max(0.05, Math.min(50, this.scale * zoom)); 
        const aZ = nS / this.scale; 
        this.offset.x = mX - (mX - this.offset.x) * aZ; 
        this.offset.y = mY - (mY - this.offset.y) * aZ; 
        this.scale = nS; 
    }, { passive: false });
    this.canvas.addEventListener('click', onClick); this.canvas.addEventListener('dblclick', onDblClick);

    // --- Mobile Touch Handlers ---
    let touchStartPos = { x: 0, y: 0 }, isPinching = false, pinchStartDistance = 0, pinchStartScale = 1;
    this.canvas.addEventListener('touchstart', (e) => {
      if (getIsEditorMode()) return; e.preventDefault(); this.disableLocalInteraction(); this.isAnimatingPan = false; if (this.longPressTimer) { clearTimeout(this.longPressTimer); this.longPressTimer = null; }
      if (e.touches.length === 2) { isPinching = true; this.dragged = true; const t1 = e.touches[0], t2 = e.touches[1]; pinchStartDistance = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY); pinchStartScale = this.scale; }
      else if (e.touches.length === 1) { isPinching = false; const touch = e.touches[0]; touchStartPos = { x: touch.clientX, y: touch.clientY }; this.dragged = false; this.dragStart = { x: touch.clientX - this.offset.x, y: touch.clientY - this.offset.y }; this.longPressTimer = setTimeout(() => { this.longPressTimer = null; if (this.dragged) return; const targetOverlay = this.findOverlayAtScreenPoint(touch.clientX, touch.clientY); if (targetOverlay) { this.activeInteractionOverlay = targetOverlay; targetOverlay.classList.add('interaction-enabled'); } }, 500); }
    }, { passive: false });
    this.canvas.addEventListener('touchmove', (e) => {
      if (getIsEditorMode() || this.activeInteractionOverlay) return; e.preventDefault();
      if (isPinching && e.touches.length === 2) { const t1 = e.touches[0], t2 = e.touches[1]; const currentDistance = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY); if (pinchStartDistance === 0) return; const scaleRatio = currentDistance / pinchStartDistance; const newScale = Math.max(0.05, Math.min(50, pinchStartScale * scaleRatio)); const rect = this.canvas.getBoundingClientRect(); const pMidX = (t1.clientX + t2.clientX) / 2 - rect.left, pMidY = (t1.clientY + t2.clientY) / 2 - rect.top; const wX = (pMidX - this.offset.x) / this.scale, wY = (pMidY - this.offset.y) / this.scale; this.scale = newScale; this.offset.x = pMidX - wX * newScale; this.offset.y = pMidY - wY * newScale; }
      else if (!isPinching && e.touches.length === 1) { const touch = e.touches[0]; const dx = touch.clientX - touchStartPos.x, dy = touch.clientY - touchStartPos.y; if (!this.dragged && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) { this.dragged = true; if (this.longPressTimer) { clearTimeout(this.longPressTimer); this.longPressTimer = null; } } if (this.dragged) { this.offset.x = touch.clientX - this.dragStart.x; this.offset.y = touch.clientY - this.dragStart.y; } }
    }, { passive: false });
    this.canvas.addEventListener('touchend', (e) => {
      if (getIsEditorMode()) return;
      if (this.longPressTimer) { clearTimeout(this.longPressTimer); this.longPressTimer = null; }
      if (!isPinching && !this.dragged && !this.activeInteractionOverlay) { onClick({ clientX: e.changedTouches[0].clientX, clientY: e.changedTouches[0].clientY, ctrlKey: false, shiftKey: false }); }
      if (e.touches.length < 2) isPinching = false;
      if (e.touches.length === 1) { const touch = e.touches[0]; this.dragged = false; this.dragStart = { x: touch.clientX - this.offset.x, y: touch.clientY - this.offset.y }; touchStartPos = { x: touch.clientX, y: touch.clientY }; }
      setTimeout(() => { this.dragged = false; }, 0);
    });
  }
}