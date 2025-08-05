/**
 * AVN Player v1.4
 * by Nftxv
 *
 * Copyright (c) 2025 Nftxv - https://AbyssVoid.com/
 *
 * This source code is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0
 * International License (CC BY-NC-SA 4.0).
 *
 * You can find the full license text at:
 * https://creativecommons.org/licenses/by-nc-sa/4.0/
 */

/**
 * Handles all rendering on the canvas, including nodes, edges, and user interactions like panning and zooming.
 */
export default class Renderer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    
    // Data
    this.nodes = [];
    this.edges = [];
    this.meta = {};
    this.images = {}; // Cache for loaded cover images

    // Camera/View state
    this.offset = { x: 0, y: 0 };
    this.scale = 1.0;
    
    // Dragging state
    this.dragStart = { x: 0, y: 0 };
    this.dragging = false;
    this.dragged = false; // To distinguish a drag from a click

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
            console.warn(`Failed to load cover: ${url}`, e);
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

  renderLoop() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.save();
    this.ctx.translate(this.offset.x, this.offset.y);
    this.ctx.scale(this.scale, this.scale);
    this.edges.forEach(edge => this.drawEdge(edge));
    this.nodes.forEach(node => this.drawNode(node));
    this.ctx.restore();
    requestAnimationFrame(this.renderLoop);
  }

  drawNode(node) {
    const ctx = this.ctx;
    const width = 160, height = 90;
    ctx.save();
    ctx.lineWidth = node.highlighted ? 4 : 2;
    ctx.strokeStyle = node.highlighted ? '#FFD700' : '#4a86e8';
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    if (ctx.roundRect) { // Check for browser support
        ctx.roundRect(node.x, node.y, width, height, 8);
    } else { // Fallback for older browsers
        ctx.rect(node.x, node.y, width, height);
    }
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
      const startX = src.x + 80, startY = src.y + 45;
      const endX = trg.x + 80, endY = trg.y + 45;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      const cpX = (startX + endX) / 2 + (startY - endY) * 0.2;
      const cpY = (startY + endY) / 2 + (endX - startX) * 0.2;
      ctx.quadraticCurveTo(cpX, cpY, endX, endY);
      ctx.strokeStyle = edge.highlighted ? '#FFD700' : (edge.color || '#4a86e8');
      ctx.lineWidth = edge.highlighted ? 5 : 3;
      ctx.stroke();
      const angle = Math.atan2(endY - cpY, endX - cpX);
      ctx.translate(endX, endY);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-12, 7);
      ctx.lineTo(-12, -7);
      ctx.closePath();
      ctx.fillStyle = edge.highlighted ? '#FFD700' : (edge.color || '#4a86e8');
      ctx.fill();
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

  setupEventListeners() {
      window.addEventListener('resize', () => this.resizeCanvas());

      this.canvas.addEventListener('mousedown', (e) => {
          this.dragging = true;
          this.dragged = false;
          this.dragStart.x = e.clientX - this.offset.x;
          this.dragStart.y = e.clientY - this.offset.y;
      });

      this.canvas.addEventListener('mouseup', () => { this.dragging = false; });
      this.canvas.addEventListener('mouseleave', () => { this.dragging = false; });

      this.canvas.addEventListener('mousemove', (e) => {
          if (this.dragging) {
              this.dragged = true;
              this.offset.x = e.clientX - this.dragStart.x;
              this.offset.y = e.clientY - this.dragStart.y;
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
  }
}