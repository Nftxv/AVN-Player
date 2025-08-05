/**
 * AVN Player v1.5.0 - Renderer Module
 * by Nftxv
 */
export default class Renderer {
  constructor(canvasId, graphData) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.graphData = graphData; // Needed for getSourceUrl
    
    this.nodes = [];
    this.edges = [];
    this.meta = {};
    this.images = {};

    this.offset = { x: 0, y: 0 };
    this.scale = 1.0;
    
    this.dragStart = { x: 0, y: 0 };
    this.dragging = false; // For canvas panning
    this.dragged = false;
    this.draggingNode = null;
    this.dragNodeOffset = { x: 0, y: 0 };
    this.isCreatingEdge = false;
    this.edgeCreationSource = null;
    this.mousePos = { x: 0, y: 0 };

    this.resizeCanvas(); // This method must exist
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
    return this.graphData.getSourceUrl(source);
  }

  getNodeAt(x, y) {
    for (let i = this.nodes.length - 1; i >= 0; i--) {
        const node = this.nodes[i];
        const height = node.isCollapsed ? 40 : 90;
        if (x > node.x && x < node.x + 160 && y > node.y && y < node.y + height) {
            return node;
        }
    }
    return null;
  }

  getEdgeAt(x, y) {
    const tolerance = 8;
    for (const edge of this.edges) {
      const src = this.nodes.find(n => n.id === edge.source);
      const trg = this.nodes.find(n => n.id === edge.target);
      if (!src || !trg) continue;

      const srcHeight = src.isCollapsed ? 40 : 90;
      const trgHeight = trg.isCollapsed ? 40 : 90;
      const x1 = src.x + 80, y1 = src.y + srcHeight / 2;
      const x2 = trg.x + 80, y2 = trg.y + trgHeight / 2;
      
      const dist = Math.abs((y2 - y1) * x - (x2 - x1) * y + x2 * y1 - y2 * x1) / Math.sqrt(Math.pow(y2 - y1, 2) + Math.pow(x2 - x1, 2));
      const onSegment = (x >= Math.min(x1, x2) - tolerance) && (x <= Math.max(x1, x2) + tolerance) && (y >= Math.min(y1, y2) - tolerance) && (y <= Math.max(y1, y2) + tolerance);
      
      if (dist < tolerance && onSegment) return edge;
    }
    return null;
  }

  getNodeToggleAt(x, y) {
    const toggleSize = 16;
    for (let i = this.nodes.length - 1; i >= 0; i--) {
        const node = this.nodes[i];
        const height = node.isCollapsed ? 40 : 90;
        const toggleX = node.x + 160 - toggleSize / 2 - 8;
        const toggleY = node.y + height - toggleSize / 2 - 8;
        if (Math.sqrt(Math.pow(x - toggleX, 2) + Math.pow(y - toggleY, 2)) < toggleSize / 2 + 2) {
            return node;
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
    this.ctx.restore();
    requestAnimationFrame(this.renderLoop);
  }

  wrapText(context, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      if (context.measureText(testLine).width > maxWidth && n > 0) {
        context.fillText(line.trim(), x, y);
        line = words[n] + ' ';
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    context.fillText(line.trim(), x, y);
  }

  drawNode(node) {
    const ctx = this.ctx;
    const width = 160, collapsedHeight = 40, expandedHeight = 90;
    const height = node.isCollapsed ? collapsedHeight : expandedHeight;
    ctx.save();
    
    if (node.selected) { ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 3; }
    else if (node.highlighted) { ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 3; }
    else { ctx.strokeStyle = '#424242'; ctx.lineWidth = 1; }

    ctx.fillStyle = '#2d2d2d';
    ctx.beginPath();
    (ctx.roundRect || ((x, y, w, h, r) => { ctx.rect(x, y, w, h); }))(node.x, node.y, width, height, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#e0e0e0';
    ctx.font = 'bold 14px Segoe UI';

    if (node.isCollapsed) {
      ctx.textAlign = 'center';
      this.wrapText(ctx, node.title, node.x + width / 2, node.y + 16, width - 20, 16);
    } else {
      const coverUrl = this.getSourceUrl(node.coverSources?.[0]);
      if (coverUrl && this.images[coverUrl]) {
        ctx.drawImage(this.images[coverUrl], node.x + 8, node.y + 8, 34, 34);
      } else {
        ctx.fillStyle = '#444';
        ctx.fillRect(node.x + 8, node.y + 8, 34, 34);
      }
      ctx.fillStyle = '#e0e0e0';
      this.wrapText(ctx, node.title, node.x + 50, node.y + 20, width - 55, 16);
      let currentIconX = node.x + 12;
      ctx.font = `18px Segoe UI Symbol`;
      ctx.fillStyle = '#a0a0a0';
      ctx.fillText('▶', currentIconX, node.y + 55 + 9);
      currentIconX += 22;
      (node.customLinks || []).forEach(link => {
        ctx.fillText(this.getIconForUrl(link), currentIconX, node.y + 55 + 9);
        currentIconX += 22;
      });
    }

    this.drawToggleIcon(ctx, node, width, height);
    ctx.restore();
  }

  drawToggleIcon(ctx, node, width, height) {
    const s = 16, x = node.x + width - s / 2 - 8, y = node.y + height - s / 2 - 8;
    ctx.save();
    ctx.fillStyle = '#4f4f4f'; ctx.strokeStyle = '#888'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(x, y, s / 2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e0e0e0'; ctx.font = 'bold 14px Segoe UI';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(node.isCollapsed ? '+' : '−', x, y + 1);
    ctx.restore();
  }

  getIconForUrl(url) {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return '▶️';
    if (url.includes('spotify.com')) return '🎵';
    if (url.includes('soundcloud.com')) return '☁️';
    if (url.includes('twitter.com') || url.includes('x.com')) return '𝕏';
    return '🔗';
  }

  drawEdge(edge) {
      const src = this.nodes.find(n => n.id === edge.source);
      const trg = this.nodes.find(n => n.id === edge.target);
      if (!src || !trg) return;
      
      const ctx = this.ctx;
      const cornerRadius = 8;
      const srcHeight = src.isCollapsed ? 40 : 90;
      const trgHeight = trg.isCollapsed ? 40 : 90;
      const startX = src.x + 80, startY = src.y + srcHeight / 2;
      const endX = trg.x + 80, endY = trg.y + trgHeight / 2;

      const dx = endX - startX, dy = endY - startY;
      if (dx === 0 && dy === 0) return;
      const angle = Math.atan2(dy, dx);
      
      const h_x = 80, h_y = trgHeight / 2;
      let finalX = endX, finalY = endY;
      
      if (Math.abs(dy) * h_x < Math.abs(dx) * h_y) {
          finalX = endX - Math.sign(dx) * h_x;
          finalY = endY - Math.sign(dx) * h_x * Math.tan(angle);
      } else {
          finalY = endY - Math.sign(dy) * h_y;
          finalX = endY - Math.sign(dy) * h_y / Math.tan(angle);
      }

      finalX -= Math.cos(angle) * cornerRadius;
      finalY -= Math.sin(angle) * cornerRadius;
      
      let color = edge.color || '#888888';
      if (edge.selected) color = '#e74c3c'; if (edge.highlighted) color = '#FFD700';
      const lineWidth = edge.selected || edge.highlighted ? 2 : 1;
      
      ctx.save();
      ctx.beginPath(); ctx.moveTo(startX, startY); ctx.lineTo(finalX, finalY);
      ctx.strokeStyle = color; ctx.lineWidth = lineWidth; ctx.stroke();
      const arrowSize = 8;
      ctx.translate(finalX, finalY); ctx.rotate(angle);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-arrowSize, -arrowSize / 2);
      ctx.lineTo(-arrowSize, arrowSize / 2); ctx.closePath();
      ctx.fillStyle = color; ctx.fill();
      ctx.restore();
  }
      
  drawTemporaryEdge() {
      const ctx = this.ctx;
      const startX = this.edgeCreationSource.x + 80;
      const startY = this.edgeCreationSource.y + (this.edgeCreationSource.isCollapsed ? 20 : 45);
      ctx.save();
      ctx.beginPath(); ctx.moveTo(startX, startY); ctx.lineTo(this.mousePos.x, this.mousePos.y);
      ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 2; ctx.setLineDash([5, 5]); ctx.stroke();
      ctx.restore();
  }
  
  highlight(currentId, prevId = null, edge = null) {
      this.nodes.forEach(n => n.highlighted = false);
      this.edges.forEach(e => e.highlighted = false);
      if(currentId) {
          const node = this.nodes.find(n => n.id === currentId);
          if (node) node.highlighted = true;
      }
      if(edge) {
          const e = this.edges.find(e => e.source === edge.source && e.target === edge.target);
          if (e) e.highlighted = true;
      }
  }
  
  getCanvasCoords({ clientX, clientY }) {
      const rect = this.canvas.getBoundingClientRect();
      return { x: (clientX - rect.left - this.offset.x) / this.scale, y: (clientY - rect.top - this.offset.y) / this.scale };
  }
  
  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }
  
  wasDragged() { return this.dragged; }

  setupCanvasInteraction(onClick, onDblClick, onEdgeCreated) {
      window.addEventListener('resize', () => this.resizeCanvas());

      this.canvas.addEventListener('mousedown', (e) => {
          this.dragged = false;
          const mousePos = this.getCanvasCoords(e);
          const clickedNode = this.getNodeAt(mousePos.x, mousePos.y);

          if (e.button === 0) { // Left Mouse
              if (clickedNode) {
                  this.draggingNode = clickedNode;
                  this.dragNodeOffset.x = mousePos.x - clickedNode.x;
                  this.dragNodeOffset.y = mousePos.y - clickedNode.y;
              }
          } else if (e.button === 1) { // Middle Mouse
              e.preventDefault();
              this.dragging = true;
              this.dragStart.x = e.clientX - this.offset.x;
              this.dragStart.y = e.clientY - this.offset.y;
          }
      });
      
      this.canvas.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          const mousePos = this.getCanvasCoords(e);
          const clickedNode = this.getNodeAt(mousePos.x, mousePos.y);
          if (clickedNode && this.isEditorMode) {
              this.isCreatingEdge = true;
              this.edgeCreationSource = clickedNode;
          }
      });
      
      this.canvas.addEventListener('mousemove', (e) => {
          this.mousePos = this.getCanvasCoords(e);
          if (this.dragging || this.draggingNode || this.isCreatingEdge) {
              this.dragged = true;
          }
          if (this.draggingNode) {
              this.draggingNode.x = this.mousePos.x - this.dragNodeOffset.x;
              this.draggingNode.y = this.mousePos.y - this.dragNodeOffset.y;
          } else if (this.dragging) {
              this.offset.x = e.clientX - this.dragStart.x;
              this.offset.y = e.clientY - this.dragStart.y;
          }
      });

      this.canvas.addEventListener('mouseup', (e) => {
          if (this.isCreatingEdge) {
              const targetNode = this.getNodeAt(this.mousePos.x, this.mousePos.y);
              if (targetNode && this.edgeCreationSource) {
                  onEdgeCreated(this.edgeCreationSource, targetNode);
              }
          }
          this.dragging = false;
          this.draggingNode = null;
          this.isCreatingEdge = false;
          setTimeout(() => { this.dragged = false; }, 0);
      });

      this.canvas.addEventListener('mouseleave', () => {
          this.dragging = false;
          this.draggingNode = null;
          this.isCreatingEdge = false;
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
          this.scale = Math.max(0.1, Math.min(5, this.scale));
      });

      this.canvas.addEventListener('click', onClick);
      this.canvas.addEventListener('dblclick', onDblClick);
  }
}