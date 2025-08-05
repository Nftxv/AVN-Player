/**
 * AVN Player v1.5.0 - Renderer Module
 * by Nftxv
 */
export default class Renderer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    
    this.nodes = [];
    this.edges = [];
    this.meta = {};
    this.images = {};

    this.offset = { x: 0, y: 0 };
    this.scale = 1.0;
    
    this.dragStart = { x: 0, y: 0 };
    this.dragging = false;
    this.dragged = false;

    this.draggingNode = null;
    this.dragNodeOffset = { x: 0, y: 0 };

    this.isCreatingEdge = false;
    this.edgeCreationSource = null;
    this.mousePos = { x: 0, y: 0 };

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
        const url = this.graphData.getSourceUrl(source);
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
    const tolerance = 5;
    for (const edge of this.edges) {
      const src = this.nodes.find(n => n.id === edge.source);
      const trg = this.nodes.find(n => n.id === edge.target);
      if (!src || !trg) continue;

      const startX = src.x + 80, startY = src.y + 45;
      const endX = trg.x + 80, endY = trg.y + 45;
      
      // A simple distance check to the line's midpoint
      const midX = (startX + endX) / 2;
      const midY = (startY + endY) / 2;
      const dist = Math.sqrt(Math.pow(x - midX, 2) + Math.pow(y - midY, 2));
      if (dist < tolerance * 5) {
        return edge;
      }
    }
    return null;
  }

  getNodeToggleAt(x, y) {
    const toggleSize = 16;
    for (let i = this.nodes.length - 1; i >= 0; i--) {
        const node = this.nodes[i];
        const height = node.isCollapsed ? 40 : 90;
        const toggleX = node.x + 160 - toggleSize / 2 - 5;
        const toggleY = node.y + height - toggleSize / 2 - 5;
        const distSq = Math.pow(x - toggleX, 2) + Math.pow(y - toggleY, 2);
        if (distSq < Math.pow(toggleSize / 2, 2)) {
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
      const metrics = context.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        context.fillText(line, x, y);
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
    const width = 160;
    const collapsedHeight = 40;
    const expandedHeight = 90;
    const iconBarY = 55;
    const iconSize = 18;
    const iconGap = 22;

    const height = node.isCollapsed ? collapsedHeight : expandedHeight;

    ctx.save();
    
    if (node.selected) {
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = 3;
    } else if (node.highlighted) {
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
    } else {
        ctx.strokeStyle = '#424242';
        ctx.lineWidth = 1;
    }

    ctx.fillStyle = '#2d2d2d';
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(node.x, node.y, width, height, 8) : ctx.rect(node.x, node.y, width, height);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#e0e0e0';
    ctx.font = 'bold 14px Segoe UI';

    if (node.isCollapsed) {
      ctx.textAlign = 'center';
      this.wrapText(ctx, node.title, node.x + width / 2, node.y + 16, width - 20, 16);
      ctx.textAlign = 'left';
    } else {
      const coverUrl = this.graphData.getSourceUrl(node.coverSources?.[0]);
      if (coverUrl && this.images[coverUrl]) {
        ctx.drawImage(this.images[coverUrl], node.x + 8, node.y + 8, 34, 34);
      } else {
        ctx.fillStyle = '#444';
        ctx.fillRect(node.x + 8, node.y + 8, 34, 34);
      }

      ctx.fillStyle = '#e0e0e0';
      this.wrapText(ctx, node.title, node.x + 50, node.y + 20, width - 55, 16);

      let currentIconX = node.x + 12;
      
      ctx.font = `${iconSize}px Segoe UI Symbol`;
      ctx.fillStyle = '#a0a0a0';
      ctx.fillText('▶', currentIconX, node.y + iconBarY + iconSize/2);
      currentIconX += iconGap;

      (node.customLinks || []).forEach(link => {
        const icon = this.getIconForUrl(link);
        ctx.fillText(icon, currentIconX, node.y + iconBarY + iconSize/2);
        currentIconX += iconGap;
      });
    }

    this.drawToggleIcon(ctx, node, width, height);
    ctx.restore();
  }

  drawToggleIcon(ctx, node, width, height) {
    const toggleSize = 16;
    const x = node.x + width - toggleSize / 2 - 8;
    const y = node.y + height - toggleSize / 2 - 8;
    
    ctx.save();
    ctx.fillStyle = '#4f4f4f';
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.arc(x, y, toggleSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#e0e0e0';
    ctx.font = 'bold 14px Segoe UI';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
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

      const startX = src.x + 160 / 2;
      const startY = src.y + (src.isCollapsed ? 40 : 90) / 2;
      let endX = trg.x + 160 / 2;
      let endY = trg.y + (trg.isCollapsed ? 40 : 90) / 2;

      const dx = endX - startX;
      const dy = endY - startY;
      const angle = Math.atan2(dy, dx);

      const h_x = 160 / 2;
      const h_y = (trg.isCollapsed ? 40 : 90) / 2;
      
      let finalX = endX;
      let finalY = endY;
      
      if (Math.abs(dy) < Math.abs(dx) * (h_y / h_x)) {
          finalX = endX - Math.sign(dx) * h_x;
          finalY = endY - Math.sign(dx) * h_x * Math.tan(angle);
      } else {
          finalY = endY - Math.sign(dy) * h_y;
          finalX = endX - Math.sign(dy) * h_y / Math.tan(angle);
      }

      finalX -= Math.cos(angle) * cornerRadius;
      finalY -= Math.sin(angle) * cornerRadius;
      
      let color = edge.color || '#888888';
      if (edge.selected) color = '#e74c3c';
      if (edge.highlighted) color = '#FFD700';
      const lineWidth = edge.selected || edge.highlighted ? 2 : 1;
      
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(finalX, finalY);
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.stroke();

      const arrowSize = 8;
      ctx.translate(finalX, finalY);
      ctx.rotate(angle);
      
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-arrowSize, -arrowSize / 2);
      ctx.lineTo(-arrowSize, arrowSize / 2);
      ctx.closePath();
      
      ctx.fillStyle = color;
      ctx.fill();
      ctx.restore();
  }
      
  drawTemporaryEdge() {
      const ctx = this.ctx;
      const startX = this.edgeCreationSource.x + 80;
      const startY = this.edgeCreationSource.y + (this.edgeCreationSource.isCollapsed ? 40 : 90) / 2;
      
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(this.mousePos.x, this.mousePos.y);
      ctx.strokeStyle = '#e74c3c';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.restore();
  }

  highlight(currentId, prevId = null, edge = null) {
      this.nodes.forEach(n => n.highlighted = false);
      this.edges.forEach(e => e.highlighted = false);
      if(currentId) {
          const currentNode = this.nodes.find(n => n.id === currentId);
          if (currentNode) currentNode.highlighted = true;
      }
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

  setupCanvasInteraction(onClick, onDblClick, onEdgeCreated) {
      // ... (этот метод остается без изменений)
  }
}