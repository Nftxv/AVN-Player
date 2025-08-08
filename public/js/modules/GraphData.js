/**
 * Manages the graph's data, including loading, parsing, and providing access to all entities.
 */
export default class GraphData {
  constructor() {
    this.nodes = [];
    this.edges = [];
    this.decorations = [];
    this.meta = {};
    this.view = null;
  }

  async load(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to load graph: ${response.statusText}`);
    const data = await response.json();
    this.parseData(data);
  }

  parseData(data) {
    this.meta = data.meta || {};
    this.view = data.view || null;
    const graph = data['@graph'] || [];

    this.nodes = [];
    this.edges = [];
    this.decorations = [];

    graph.forEach(item => {
      switch (item['@type']) {
        case 'MusicRecording':
          this.nodes.push({
            id: item['@id'],
            title: item.name || 'Untitled',
            x: item.position?.x || 0,
            y: item.position?.y || 0,
            isCollapsed: item.isCollapsed === true,
            sourceType: item.sourceType || 'audio',
            audioUrl: item.audioUrl || null,
            coverUrl: item.coverUrl || null,
            iframeUrl: item.sourceType === 'iframe' ? this.parseYoutubeUrl(item.iframeUrl) : null,
          });
          break;
        case 'Path':
          this.edges.push({
            // Edges don't have a stable ID, they are defined by source and target
            source: item.source,
            target: item.target,
            color: item.color || '#888888',
            label: item.label || '',
            lineWidth: item.lineWidth || 2,
            controlPoints: item.controlPoints || [],
          });
          break;
        case 'RectangleAnnotation':
          this.decorations.push({
            id: item['@id'],
            type: 'rectangle',
            x: item.position?.x || 0,
            y: item.position?.y || 0,
            width: item.size?.width || 200,
            height: item.size?.height || 100,
            backgroundColor: item.backgroundColor || '#333333',
            parentId: item.parentId || null,
            attachedToNodeId: item.attachedToNodeId || null,
            attachOffsetX: item.attachOffsetX,
            attachOffsetY: item.attachOffsetY,
          });
          break;
        case 'TextAnnotation': // Legacy support
        case 'MarkdownAnnotation': // NEW
          this.decorations.push({
            id: item['@id'],
            type: 'markdown', // Unifying to markdown
            x: item.position?.x || 0,
            y: item.position?.y || 0,
            width: item.size?.width || 300,
            height: item.size?.height || 200,
            textContent: item.textContent || '',
            fontSize: item.fontSize || 14,
            backgroundColor: item.backgroundColor || 'rgba(45, 45, 45, 0.85)',
            parentId: item.parentId || null,
          });
          break;
      }
    });
  }

  getGraph(viewport = null) {
    const graph = [
      ...this.nodes.map(n => ({
        '@id': n.id,
        '@type': 'MusicRecording',
        name: n.title,
        position: { x: n.x, y: n.y },
        isCollapsed: n.isCollapsed,
        sourceType: n.sourceType,
        audioUrl: n.audioUrl,
        coverUrl: n.coverUrl,
        iframeUrl: n.iframeUrl,
      })),
      ...this.edges.map(e => ({
        '@type': 'Path',
        source: e.source,
        target: e.target,
        color: e.color,
        label: e.label,
        lineWidth: e.lineWidth,
        controlPoints: e.controlPoints,
      })),
      ...this.decorations.map(d => {
        const common = { 
            '@id': d.id, 
            position: { x: d.x, y: d.y },
            size: { width: d.width, height: d.height },
            ...(d.parentId && { parentId: d.parentId }),
            ...(d.attachedToNodeId && { 
                attachedToNodeId: d.attachedToNodeId,
                attachOffsetX: d.attachOffsetX,
                attachOffsetY: d.attachOffsetY,
             })
        };
        if (d.type === 'rectangle') {
          return { ...common, '@type': 'RectangleAnnotation', backgroundColor: d.backgroundColor };
        }
        if (d.type === 'markdown') {
          return { ...common, '@type': 'MarkdownAnnotation', textContent: d.textContent, fontSize: d.fontSize, backgroundColor: d.backgroundColor };
        }
        return null;
      }).filter(Boolean),
    ];
    
    const data = { '@context': 'https://schema.org/', '@graph': graph };
    if (viewport) data.view = viewport;
    return data;
  }
  
  // --- DATA MANIPULATION METHODS ---

  addNode(node) { this.nodes.push(node); }
  addEdge(edge) { this.edges.push(edge); }
  addDecoration(deco) { this.decorations.push(deco); }
  
  getEntityById(id) {
    return this.nodes.find(n => n.id === id) || this.decorations.find(d => d.id === id);
  }

  deleteEntities(selection) {
    const idsToDelete = new Set(selection.map(e => e.id).filter(Boolean));
    const nodesToDelete = new Set(selection.filter(e => e.sourceType).map(n => n.id));

    // Un-parent children of deleted containers
    this.decorations.forEach(deco => {
        if (idsToDelete.has(deco.parentId)) deco.parentId = null;
        if (nodesToDelete.has(deco.attachedToNodeId)) {
            deco.attachedToNodeId = null;
            deco.attachOffsetX = null;
            deco.attachOffsetY = null;
        }
    });

    this.nodes = this.nodes.filter(n => !idsToDelete.has(n.id));
    this.edges = this.edges.filter(e => !idsToDelete.has(e.id) && !nodesToDelete.has(e.source) && !nodesToDelete.has(e.target));
    this.decorations = this.decorations.filter(d => !idsToDelete.has(d.id));
  }

  moveSelection(selection, dx, dy, { isDecorationsLocked }) {
      const movedItemIds = new Set();
      selection.forEach(entity => {
          if (movedItemIds.has(entity.id)) return;

          let rootItem = entity.parentId ? this.getDecorationById(entity.parentId) : entity;
          if (!rootItem) rootItem = entity;

          const itemsToMove = new Set();
          if(rootItem.sourceType) { // It's a node
              itemsToMove.add(rootItem);
              this.decorations.forEach(d => {
                  if(d.attachedToNodeId === rootItem.id && !d.parentId) {
                      this.getGroupedDecorations(d).forEach(gi => itemsToMove.add(gi));
                  }
              });
          } else if(rootItem.type) { // It's a decoration
              if (isDecorationsLocked) return;
              this.getGroupedDecorations(rootItem).forEach(gi => itemsToMove.add(gi));
          }

          itemsToMove.forEach(item => {
              if(item.x !== undefined) item.x += dx;
              if(item.y !== undefined) item.y += dy;
              movedItemIds.add(item.id);

              // Update attach offset if the moved item is a root attached container
              if (item.id === rootItem.id && item.attachedToNodeId) {
                  const node = this.getNodeById(item.attachedToNodeId);
                  if(node) {
                      item.attachOffsetX = item.x - node.x;
                      item.attachOffsetY = item.y - node.y;
                  }
              }
          });
      });
  }
  
  // --- HELPERS ---

  parseYoutubeUrl(input) {
      if (!input || typeof input !== 'string') return null;
      const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
      const match = input.match(regex);
      if (match && match[1]) return match[1];
      if (/^[a-zA-Z0-9_-]{11}$/.test(input.trim())) return input.trim();
      return null;
  }

  getNodeById(id) { return this.nodes.find(node => node.id === id); }
  getDecorationById(id) { return this.decorations.find(deco => deco.id === id); }
  getEdgesFromNode(nodeId) { return this.edges.filter(edge => edge.source === nodeId); }
  getGroupedDecorations(container) {
      const group = [container];
      const children = this.decorations.filter(d => d.parentId === container.id);
      children.forEach(child => group.push(...this.getGroupedDecorations(child))); // Recursive for nested groups
      return group;
  }

  // THIS IS THE FIX for the crash
  updateAttachedDecorations() {
    this.decorations.forEach(deco => {
        // Only move top-level containers that are attached
        if (deco.attachedToNodeId && !deco.parentId) {
            const node = this.getNodeById(deco.attachedToNodeId);
            if (node) {
                const newX = node.x + (deco.attachOffsetX || 0);
                const newY = node.y + (deco.attachOffsetY || 0);
                const dx = newX - deco.x;
                const dy = newY - deco.y;

                // If the node moved, move the attached group
                if (Math.abs(dx) > 1e-6 || Math.abs(dy) > 1e-6) {
                   const group = this.getGroupedDecorations(deco);
                   group.forEach(item => {
                       item.x += dx;
                       item.y += dy;
                   });
                }
            }
        }
    });
  }
}