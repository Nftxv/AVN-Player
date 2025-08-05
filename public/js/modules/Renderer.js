/**
 * AVN Player v1.4 - Renderer Module
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
 * Handles all rendering on the canvas, including nodes, edges, and user interactions
 * like panning, zooming, and visual editing.
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

    // View camera state
    this.offset = { x: 0, y: 0 };
    this.scale = 1.0;
    
    // General dragging state
    this.dragStart = { x: 0, y: 0 };
    this.dragging = false; // For canvas panning
    this.dragged = false;  // To distinguish a drag from a click

    // Node dragging state
    this.draggingNode = null;
    this.dragNodeOffset = { x: 0, y: 0 };

    // Edge creation state
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
    // Iterate backwards to select the top-most node
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
    
    // Draw the temporary line for edge creation
    if (this.isCreatingEdge && this.edgeCreationSource) {
      this.drawTemporaryEdge();
    }

    this.ctx.restore();
    requestAnimationFrame(this.renderLoop);
  }

  drawNode(node) {
    const ctx = this.ctx;
    const width = 160, height = 90;
    ctx.save();
    
    // Determine style based on state: selected (editor) > highlighted (player) > default
    if (node.selected) {
        ctx.strokeStyle = '#e74c3c'; // Red for selected
        ctx.lineWidth = 4;
    } else if (node.highlighted) {
        ctx.strokeStyle = '#FFD700'; // Gold for highlighted
        ctx.lineWidth = 4;
    } else {
        ctx.strokeStyle = '#4a86e8'; // Blue for default
        ctx.lineWidth = 2;
    }

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(node.x, node.y, width, height, 8) : ctx.rect(node.x, node.y, width, height);
    ctx.fill();
    ctx.stroke();

    // Draw cover image
    const coverSource = node.coverSources?.[0];
    const coverUrl = this.getSourceUrl(coverSource);
    if (coverUrl && this.images[coverUrl]) {
        ctx.drawImage(this.images[coverUrl], node.x + 5, node.y + 5, height - 10, height - 10);
    } else {
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(node.x + 5, node.y + 5, height - 10, height - 10);
    }

    // Draw title
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

      // Determine style based on state
      const color = edge.selected ? '#e74c3c' : (edge.highlighted ? '#FFD700' : (edge.color || '#4a86e8'));
      const lineWidth = edge.selected || edge.highlighted ? 5 : 3;

      ctx.save();
      // Draw curve
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      const cpX = (startX + endX) / 2 + (startY - endY) * 0.2;
      const cpY = (startY + endY) / 2 + (endX - startX) * 0.2;
      ctx.quadraticCurveTo(cpX, cpY, endX, endY);
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.stroke();

      // Draw arrowhead
      const angle = Math.atan2(endY - cpY, endX - cpX);
      ctx.translate(endX, endY);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-12, 7);
      ctx.lineTo(-12, -7);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      ctx.restore();
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

  setupCanvasInteraction(onClick, onDblClick, onEdgeCreated) {
      window.addEventListener('resize', () => this.resizeCanvas());

      // --- Left Click Down: Pan or start dragging a node ---
      this.canvas.addEventListener('mousedown', (e) => {
          if (e.button !== 0) return; // Only handle left clicks
          const mousePos = this.getCanvasCoords(e);
          const clickedNode = this.getNodeAt(mousePos.x, mousePos.y);

          if (clickedNode) {
              this.draggingNode = clickedNode;
              this.dragNodeOffset.x = mousePos.x - clickedNode.x;
              this.dragNodeOffset.y = mousePos.y - clickedNode.y;
          } else {
              this.dragging = true;
              this.dragStart.x = e.clientX - this.offset.x;
              this.dragStart.y = e.clientY - this.offset.y;
          }
          this.dragged = false;
      });

      // --- Right Click Down: Start creating an edge ---
      this.canvas.addEventListener('contextmenu', (e) => {
          e.preventDefault(); // Prevent browser context menu
          const mousePos = this.getCanvasCoords(e);
          const clickedNode = this.getNodeAt(mousePos.x, mousePos.y);
          if (clickedNode) {
              this.isCreatingEdge = true;
              this.edgeCreationSource = clickedNode;
          }
      });
      
      // --- Mouse Move: Handle all dragging types ---
      this.canvas.addEventListener('mousemove', (e) => {
          this.mousePos = this.getCanvasCoords(e);
          
          // Only set dragged flag if a button is held down
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

      // --- Mouse Up: Finalize actions ---
      this.canvas.addEventListener('mouseup', (e) => {
          if (this.isCreatingEdge) {
              const targetNode = this.getNodeAt(this.mousePos.x, this.mousePos.y);
              if (targetNode && this.edgeCreationSource) {
                  onEdgeCreated(this.edgeCreationSource, targetNode);
              }
          }
          
          // Reset all dragging states
          this.dragging = false;
          this.draggingNode = null;
          this.isCreatingEdge = false;
          this.edgeCreationSource = null;

          // Use a timeout to reset the 'dragged' flag after the 'click' event has fired
          setTimeout(() => { this.dragged = false; }, 0);
      });

      this.canvas.addEventListener('mouseleave', () => {
          this.dragging = false;
          this.draggingNode = null;
          this.isCreatingEdge = false;
      });
      
      // --- Wheel: Zoom ---
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

      // --- Pass control for clicks back to the main app ---
      this.canvas.addEventListener('click', onClick);
      this.canvas.addEventListener('dblclick', onDblClick);
  }
}