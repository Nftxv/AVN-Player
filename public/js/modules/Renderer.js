/**
 * AVN Player v1.5.0 - Renderer Module
 * by Nftxv
 */
export default class Renderer {
  constructor(canvasId) {
    // ... (конструктор без изменений) ...
  }
  
  // ... (setData, loadAndRenderAll, loadImages, getSourceUrl без изменений) ...

  getNodeAt(x, y) { /* ... без изменений ... */ }
  getEdgeAt(x, y) { /* ... без изменений ... */ }

  // НОВЫЙ МЕТОД для определения клика по иконке +/-
  getNodeToggleAt(x, y) {
    const toggleSize = 16;
    for (let i = this.nodes.length - 1; i >= 0; i--) {
        const node = this.nodes[i];
        const toggleX = node.x + 160 - toggleSize / 2 - 5;
        const toggleY = node.y + (node.isCollapsed ? 40 : 90) - toggleSize / 2 - 5;
        const dist = Math.sqrt(Math.pow(x - toggleX, 2) + Math.pow(y - toggleY, 2));
        if (dist < toggleSize / 2) {
            return node;
        }
    }
    return null;
  }
  
  // ... (renderLoop, drawEdge, drawTemporaryEdge без изменений) ...
  
  // НОВЫЙ ВСПОМОГАТЕЛЬНЫЙ МЕТОД для переноса текста
  wrapText(context, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let testLine = '';
    let lineCount = 0;
    
    for (let n = 0; n < words.length; n++) {
      testLine = line + words[n] + ' ';
      const metrics = context.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        context.fillText(line, x, y);
        line = words[n] + ' ';
        y += lineHeight;
        lineCount++;
      } else {
        line = testLine;
      }
    }
    context.fillText(line, x, y);
    return lineCount + 1; // Возвращаем общее количество строк
  }

  // ПОЛНОСТЬЮ ПЕРЕПИСАННЫЙ МЕТОД отрисовки ноды
  drawNode(node) {
    const ctx = this.ctx;
    const width = 160;
    const collapsedHeight = 40;
    const expandedHeight = 90;
    const iconBarY = 45;
    const iconSize = 16;
    const iconGap = 20;

    const height = node.isCollapsed ? collapsedHeight : expandedHeight;

    ctx.save();
    
    // Стили обводки
    if (node.selected) { /* ... без изменений ... */ }
    // ...

    ctx.fillStyle = '#2d2d2d'; // Фон ноды
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(node.x, node.y, width, height, 8) : ctx.rect(node.x, node.y, width, height);
    ctx.fill();
    ctx.stroke();

    // --- ОТРИСОВКА КОНТЕНТА ВНУТРИ НОДЫ ---
    ctx.fillStyle = '#e0e0e0';
    ctx.font = 'bold 14px Segoe UI';

    if (node.isCollapsed) {
      // В свернутом состоянии - только заголовок по центру
      ctx.textAlign = 'center';
      this.wrapText(ctx, node.title, node.x + width / 2, node.y + 16, width - 10, 16);
      ctx.textAlign = 'left'; // Сброс
    } else {
      // В развернутом состоянии
      // Обложка
      const coverSource = node.coverSources?.[0];
      const coverUrl = this.graphData.getSourceUrl(coverSource);
      if (coverUrl && this.images[coverUrl]) {
        ctx.drawImage(this.images[coverUrl], node.x + 5, node.y + 5, 35, 35);
      } else {
        ctx.fillStyle = '#444';
        ctx.fillRect(node.x + 5, node.y + 5, 35, 35);
      }

      // Заголовок
      ctx.fillStyle = '#e0e0e0';
      this.wrapText(ctx, node.title, node.x + 45, node.y + 18, width - 50, 16);

      // Иконки
      let currentIconX = node.x + 10;
      
      // Иконка Play
      ctx.font = `${iconSize}px Segoe UI Symbol`;
      ctx.fillStyle = '#a0a0a0';
      ctx.fillText('▶', currentIconX, node.y + iconBarY + iconSize);
      currentIconX += iconGap;

      // Кастомные иконки
      (node.customLinks || []).forEach(link => {
        const icon = this.getIconForUrl(link);
        ctx.fillText(icon, currentIconX, node.y + iconBarY + iconSize);
        currentIconX += iconGap;
      });
    }

    // Отрисовка иконки +/-
    this.drawToggleIcon(ctx, node, width, height);

    ctx.restore();
  }

  // НОВЫЙ МЕТОД для отрисовки иконки +/-
  drawToggleIcon(ctx, node, width, height) {
    const toggleSize = 16;
    const x = node.x + width - toggleSize / 2 - 5;
    const y = node.y + height - toggleSize / 2 - 5;
    
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

  // НОВЫЙ МЕТОД для получения иконки по URL
  getIconForUrl(url) {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return '▶️'; // YouTube (эмодзи)
    if (url.includes('spotify.com')) return '🎵'; // Spotify (эмодзи)
    if (url.includes('soundcloud.com')) return '☁️'; // SoundCloud (эмодзи)
    if (url.includes('twitter.com') || url.includes('x.com')) return '𝕏'; // X/Twitter
    return '🔗'; // Generic link
  }

  // ... (остальные методы без изменений)
}