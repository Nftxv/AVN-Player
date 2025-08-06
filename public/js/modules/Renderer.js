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
}
