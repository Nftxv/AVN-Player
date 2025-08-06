/**
 * Manages the graph's data with new source types.
 */
export default class GraphData {
  constructor() {
    this.nodes = [];
    this.edges = [];
    this.meta = {};
  }

  async load(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to load graph: ${response.statusText}`);
    const data = await response.json();
    this.parseData(data);
  }

  parseData(data) {
    this.meta = data.meta || { gateways: ['https://cloudflare-ipfs.com/ipfs/'] };
    const graph = data['@graph'] || [];

    this.nodes = graph
      .filter(item => item['@type'] === 'MusicRecording')
      .map(node => ({
        id: node['@id'],
        title: node.name || 'Untitled',
        position: { x: node.position?.x || Math.random() * 800, y: node.position?.y || Math.random() * 600 },
        isCollapsed: node.isCollapsed === true,
        
        // New data model
        sourceType: node.sourceType || 'audio',
        audioUrl: node.audioUrl || null,
        coverUrl: node.coverUrl || null,
        lyricsUrl: node.lyricsUrl || null,
        iframeUrl: node.iframeUrl || null
      }));

    this.edges = graph
      .filter(item => item['@type'] === 'Path')
      .map(edge => ({
        source: edge.source,
        target: edge.target,
        color: edge.color || '#888888',
        label: edge.label || '',
        lineWidth: edge.lineWidth || 2,
        controlPoints: edge.controlPoints || [],
      }));
  }

  getGraph() {
    const graph = [
      ...this.nodes.map(n => ({
        '@id': n.id,
        '@type': 'MusicRecording',
        name: n.title,
        position: n.position,
        isCollapsed: n.isCollapsed,
        sourceType: n.sourceType,
        audioUrl: n.audioUrl,
        coverUrl: n.coverUrl,
        lyricsUrl: n.lyricsUrl,
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
      }))
    ];
    return {
      '@context': 'https://schema.org/',
      meta: this.meta,
      '@graph': graph,
    };
  }

  getSourceUrl(url) {
    if (!url) return null;
    // Simple check if it's a potential IPFS hash
    if (url.startsWith('Qm') || url.startsWith('bafy')) {
      const gateway = this.meta.gateways?.[0] || 'https://ipfs.io/ipfs/';
      return `${gateway}${url}`;
    }
    return url;
  }

  getNodeById(id) {
    return this.nodes.find(node => node.id === id);
  }
  
  getEdgesFromNode(nodeId) {
    return this.edges.filter(edge => edge.source === nodeId);
  }
}