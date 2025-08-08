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
          });
          break;
        case 'TextAnnotation':
          this.decorations.push({
            id: item['@id'],
            type: 'text',
            x: item.position?.x || 0,
            y: item.position?.y || 0,
            width: item.width || 300,
            height: item.height || 200,
            textContent: item.textContent || '',
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
          ...(d.parentId && { parentId: d.parentId })
        };
        if (d.type === 'rectangle') {
          return {
            ...common,
            '@type': 'RectangleAnnotation',
            size: { width: d.width, height: d.height },
            backgroundColor: d.backgroundColor,
             ...(d.attachedToNodeId && { attachedToNodeId: d.attachedToNodeId })
          };
        }
        if (d.type === 'text') {
          return {
            ...common,
            '@type': 'TextAnnotation',
            textContent: d.textContent,
            width: d.width,
            height: d.height,
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
      const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
      const match = input.match(regex);
      if (match && match[1]) return match[1];
      if (/^[a-zA-Z0-9_-]{11}$/.test(input.trim())) return input.trim();
      console.warn("Could not parse YouTube URL/ID:", input);
      return null;
  }

  getNodeById(id) {
    return this.nodes.find(node => node.id === id);
  }
  
  getEdgesFromNode(nodeId) {
    return this.edges.filter(edge => edge.source === nodeId);
  }
}