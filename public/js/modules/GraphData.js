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
            // FIX: Assign a unique ID on load, which is crucial for selection and deletion.
            id: `edge-${item.source}-${item.target}-${Math.random().toString(36).substr(2, 9)}`,
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
            // REVISED: Grouping and attachment properties
            parentId: item.parentId || null,
            attachedToNodeId: item.attachedToNodeId || null,
            attachOffsetX: item.attachOffsetX,
            attachOffsetY: item.attachOffsetY,
          });
          break;
        case 'TextAnnotation': // Legacy support
        case 'MarkdownAnnotation':
          this.decorations.push({
            id: item['@id'],
            type: 'markdown',
            x: item.position?.x || 0,
            y: item.position?.y || 0,
            width: item.size?.width || 300,
            height: item.size?.height || 200,
            textContent: item.textContent || '',
            fontSize: item.fontSize || 14,
            backgroundColor: item.backgroundColor || 'rgba(45, 45, 45, 0.85)',
            // REVISED: Grouping properties
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
            ...(d.parentId && { parentId: d.parentId }),
        };
        if (d.type === 'rectangle') {
          return {
            ...common,
            '@type': 'RectangleAnnotation',
            size: { width: d.width, height: d.height },
            backgroundColor: d.backgroundColor,
            // REVISED: Save attachment properties
            ...(d.attachedToNodeId && { attachedToNodeId: d.attachedToNodeId }),
            ...(d.attachOffsetX !== undefined && { attachOffsetX: d.attachOffsetX }),
            ...(d.attachOffsetY !== undefined && { attachOffsetY: d.attachOffsetY }),
          };
        }
        if (d.type === 'markdown') {
          return {
            ...common,
            '@type': 'MarkdownAnnotation',
            size: { width: d.width, height: d.height },
            textContent: d.textContent,
            fontSize: d.fontSize,
            backgroundColor: d.backgroundColor,
          };
        }
        return null;
      }).filter(Boolean),
    ];
    
    const data = {
      '@context': 'https://schema.org/',
      ...(Object.keys(this.meta).length > 0 && { meta: this.meta }),
      '@graph': graph,
    };

    if (viewport) {
      data.view = viewport;
    }

    return data;
  }
  
  parseYoutubeUrl(input) {
      if (!input || typeof input !== 'string') return null;
      // REVISED: Added "shorts\/" to the regex to support YouTube Shorts URLs
      const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
      const match = input.match(regex);
      if (match && match[1]) return match[1];
      if (/^[a-zA-Z0-9_-]{11}$/.test(input.trim())) return input.trim();
      console.warn("Could not parse YouTube URL/ID:", input);
      return null;
  }

  getNodeById(id) {
    return this.nodes.find(node => node.id === id);
  }

  getDecorationById(id) {
    return this.decorations.find(deco => deco.id === id);
  }
  
  getEdgesFromNode(nodeId) {
    return this.edges.filter(edge => edge.source === nodeId);
  }
}