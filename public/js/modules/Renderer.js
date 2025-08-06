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
// 🎯 Расширенный Renderer.js с поддержкой:
// 1. Сворачивание нод ✅
// 2. Привязка по сетке ✅
// 3. Промежуточные точки на связях ✅

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

    this.snapGrid = 25;
    this.draggingWaypoint = null;

    this.resizeCanvas();
    this.renderLoop = this.renderLoop.bind(this);
  }

  setData(nodes, edges, meta) {
    this.nodes = nodes.map(n => ({ ...n, collapsed: false }));
    this.edges = edges.map(e => ({ ...e, waypoints: e.waypoints || [] }));
    this.meta = meta;
  }

  drawNode(node) {
    const ctx = this.ctx;
    const width = 160;
    const height = node.collapsed ? 30 : 90;

    ctx.save();
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = node.selected ? '#e74c3c' : node.highlighted ? '#FFD700' : '#4a86e8';
    ctx.lineWidth = node.selected || node.highlighted ? 4 : 2;

    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(node.x, node.y, width, height, 8) : ctx.rect(node.x, node.y, width, height);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#000';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(node.collapsed ? '+' : '-', node.x + width - 15, node.y + 20);

    ctx.fillStyle = '#000';
    ctx.font = '14px Segoe UI';
    ctx.fillText(node.title, node.x + 10, node.y + 20);

    if (!node.collapsed) {
      const cover = node.coverSources?.[0];
      const url = this.getSourceUrl(cover);
      if (url && this.images[url]) ctx.drawImage(this.images[url], node.x + 5, node.y + 30, 50, 50);
    }

    ctx.restore();
  }

  drawEdge(edge) {
    const ctx = this.ctx;
    const src = this.nodes.find(n => n.id === edge.source);
    const trg = this.nodes.find(n => n.id === edge.target);
    if (!src || !trg) return;

    const startX = src.x + 80;
    const startY = src.y + (src.collapsed ? 15 : 45);
    const endX = trg.x + 80;
    const endY = trg.y + (trg.collapsed ? 15 : 45);

    const points = [
      { x: startX, y: startY },
      ...(edge.waypoints || []),
      { x: endX, y: endY }
    ];

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.strokeStyle = edge.color || '#aaa';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Рисуем точки
    (edge.waypoints || []).forEach(wp => {
      ctx.beginPath();
      ctx.arc(wp.x, wp.y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = '#e67e22';
      ctx.fill();
    });

    ctx.restore();
  }

  getCanvasCoords({ clientX, clientY }) {
    const rect = this.canvas.getBoundingClientRect();
    const x = (clientX - rect.left - this.offset.x) / this.scale;
    const y = (clientY - rect.top - this.offset.y) / this.scale;
    return { x, y };
  }

  getNodeAt(x, y) {
    for (let i = this.nodes.length - 1; i >= 0; i--) {
      const node = this.nodes[i];
      const width = 160;
      const height = node.collapsed ? 30 : 90;
      if (x > node.x && x < node.x + width && y > node.y && y < node.y + height) return node;
    }
    return null;
  }

  getEdgeWaypointAt(x, y) {
    for (const edge of this.edges) {
      for (const point of edge.waypoints || []) {
        const dx = point.x - x;
        const dy = point.y - y;
        if (dx * dx + dy * dy < 64) return { edge, point };
      }
    }
    return null;
  }

  setupCanvasInteraction(onClick, onDblClick, onEdgeCreated) {
    this.canvas.addEventListener('mousedown', (e) => {
      const pos = this.getCanvasCoords(e);

      const wpHit = this.getEdgeWaypointAt(pos.x, pos.y);
      if (wpHit) {
        this.draggingWaypoint = wpHit;
        return;
      }

      const node = this.getNodeAt(pos.x, pos.y);
      if (node && e.button === 0) {
        if (pos.x > node.x + 140 && pos.y < node.y + 25) {
          node.collapsed = !node.collapsed;
          return;
        }
        this.draggingNode = node;
        this.dragNodeOffset.x = pos.x - node.x;
        this.dragNodeOffset.y = pos.y - node.y;
      } else {
        this.dragging = true;
        this.dragStart.x = e.clientX - this.offset.x;
        this.dragStart.y = e.clientY - this.offset.y;
      }
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const pos = this.getCanvasCoords(e);
      if (this.draggingWaypoint) {
        const { point } = this.draggingWaypoint;
        point.x = Math.round(pos.x / this.snapGrid) * this.snapGrid;
        point.y = Math.round(pos.y / this.snapGrid) * this.snapGrid;
      } else if (this.draggingNode) {
        const newX = pos.x - this.dragNodeOffset.x;
        const newY = pos.y - this.dragNodeOffset.y;
        this.draggingNode.x = Math.round(newX / this.snapGrid) * this.snapGrid;
        this.draggingNode.y = Math.round(newY / this.snapGrid) * this.snapGrid;
      } else if (this.dragging) {
        this.offset.x = e.clientX - this.dragStart.x;
        this.offset.y = e.clientY - this.dragStart.y;
      }
    });

    this.canvas.addEventListener('mouseup', () => {
      this.dragging = false;
      this.draggingNode = null;
      this.draggingWaypoint = null;
    });

    this.canvas.addEventListener('dblclick', (e) => {
      const pos = this.getCanvasCoords(e);
      const edge = this.edges.find(ed => {
        const points = [
          { x: this.nodes.find(n => n.id === ed.source).x + 80, y: this.nodes.find(n => n.id === ed.source).y + 45 },
          ...(ed.waypoints || []),
          { x: this.nodes.find(n => n.id === ed.target).x + 80, y: this.nodes.find(n => n.id === ed.target).y + 45 }
        ];
        for (let i = 0; i < points.length - 1; i++) {
          const a = points[i], b = points[i + 1];
          const dist = Math.abs((b.y - a.y) * pos.x - (b.x - a.x) * pos.y + b.x * a.y - b.y * a.x) /
                       Math.hypot(b.y - a.y, b.x - a.x);
          if (dist < 8) return true;
        }
        return false;
      });
      if (edge) {
        if (!edge.waypoints) edge.waypoints = [];
        edge.waypoints.push({ x: pos.x, y: pos.y });
      } else {
        onDblClick(e);
      }
    });

    this.canvas.addEventListener('click', onClick);
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

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  async loadImages() {
    const promises = this.nodes.flatMap(node => (node.coverSources || []).map(async source => {
      const url = this.getSourceUrl(source);
      if (url && !this.images[url]) {
        const img = new Image();
        img.src = url;
        await img.decode();
        this.images[url] = img;
      }
    }));
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

  getEdgeAt(x, y) {
    const tolerance = 5; // Click tolerance in pixels
    for (const edge of this.edges) {
      const src = this.nodes.find(n => n.id === edge.source);
      const trg = this.nodes.find(n => n.id === edge.target);
      if (!src || !trg) continue;

      const startX = src.x + 80, startY = src.y + 45;
      const endX = trg.x + 80, endY = trg.y + 45;
      const cpX = (startX + endX) / 2 + (startY - endY) * 0.2;
      const cpY = (startY + endY) / 2 + (endX - startX) * 0.2;

      // A simple distance check to the curve's midpoint
      const dist = Math.sqrt(Math.pow(x - cpX, 2) + Math.pow(y - cpY, 2));
      if (dist < tolerance * 5) { // A wider tolerance for the midpoint
        return edge;
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

// Файл: public/js/modules/Renderer.js

  // ЗАМЕНИТЕ ВЕСЬ СТАРЫЙ МЕТОД drawEdge НА ЭТОТ
  drawEdge(edge) {
      const src = this.nodes.find(n => n.id === edge.source);
      const trg = this.nodes.find(n => n.id === edge.target);
      if (!src || !trg) return;
      
      const ctx = this.ctx;
      
      const nodeWidth = 160;
      const nodeHeight = 90;
      // "Магическая" константа. Это радиус скругления, который вы используете в drawNode.
      // Мы заставим линию заходить внутрь на это расстояние.
      const cornerRadius = 8; 

      const startX = src.x + nodeWidth / 2;
      const startY = src.y + nodeHeight / 2;
      let endX = trg.x + nodeWidth / 2;
      let endY = trg.y + nodeHeight / 2;

      // --- МАТЕМАТИКА ДЛЯ ОПРЕДЕЛЕНИЯ ТОЧКИ НА ГРАНИЦЕ НОДЫ ---
      const dx = endX - startX;
      const dy = endY - startY;
      const angle = Math.atan2(dy, dx);

      // Рассчитываем точку пересечения с прямоугольником целевой ноды
      const h_x = nodeWidth / 2;
      const h_y = nodeHeight / 2;
      const tan_angle = Math.tan(angle);
      
      let finalX = endX;
      let finalY = endY;
      
      // Расчет точки на границе острого прямоугольника
      if (Math.abs(dy) < Math.abs(dx) * (h_y / h_x)) {
          finalX = endX - Math.sign(dx) * h_x;
          finalY = endY - Math.sign(dx) * h_x * tan_angle;
      } else {
          finalY = endY - Math.sign(dy) * h_y;
          finalX = endX - Math.sign(dy) * h_y / tan_angle;
      }

      // --- ИСПРАВЛЕНИЕ ЗДЕСЬ ---
      // Смещаем конечную точку немного "внутрь" по направлению к центру ноды.
      // Это компенсирует скругленные углы.
      finalX -= Math.cos(angle) * cornerRadius;
      finalY -= Math.sin(angle) * cornerRadius;
      
      // --- СТИЛИЗАЦИЯ ---
      let color = edge.color || '#888888';
      if (edge.selected) color = '#e74c3c';
      if (edge.highlighted) color = '#FFD700';

      const lineWidth = edge.selected || edge.highlighted ? 2 : 1;
      
      ctx.save();
      
      // --- РИСУЕМ ЛИНИЮ ---
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(finalX, finalY);
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.stroke();

      // --- РИСУЕМ СТРЕЛКУ ---
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