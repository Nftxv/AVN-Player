/**
 * Manages the graph's data, including loading, parsing, and providing access to nodes and edges.
 */
export default class GraphData {
  constructor() {
    this.nodes = [];
    this.edges = [];
    this.meta = {};
  }

  /**
   * Loads graph data from a given URL.
   * @param {string} url - The URL of the JSON/JSON-LD file.
   */
  async load(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to load graph: ${response.statusText}`);
    const data = await response.json();
    this.parseData(data);
  }

  /**
   * Parses the raw JSON-LD data and populates nodes, edges, and metadata.
   * @param {object} data - The raw data object from the JSON file.
   */
  parseData(data) {
    this.meta = data.meta || { gateways: ['https://cloudflare-ipfs.com/ipfs/'] };
    const graph = data['@graph'] || [];

    this.nodes = graph
      .filter(item => item['@type'] === 'MusicRecording')
      .map(node => ({
        id: node['@id'],
        title: node.name || 'Untitled',
        audioSources: node.audioSources || [],
        coverSources: node.coverSources || [],
        lyricsSource: node.lyricsSource,
        x: node.position?.x || Math.random() * 800,
        y: node.position?.y || Math.random() * 600,
        isCollapsed: node.isCollapsed === true, // Explicitly check for true
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

  /**
   * Serializes the current graph data back into a JSON-LD format for export.
   * @returns {object} - The complete graph object.
   */
  getGraph() {
    const graph = [
      ...this.nodes.map(n => ({
        '@id': n.id,
        '@type': 'MusicRecording',
        name: n.title,
        position: { x: n.x, y: n.y },
        isCollapsed: n.isCollapsed, // Save collapsed state
        audioSources: n.audioSources,
        coverSources: n.coverSources,
        lyricsSource: n.lyricsSource,
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

  getSourceUrl(source) {
    if (!source) return null;
    if (source.type === 'ipfs') {
      const gateway = this.meta.gateways?.[0] || 'https://ipfs.io/ipfs/';
      return `${gateway}${source.value}`;
    }
    return source.value;
  }

  getNodeById(id) {
    return this.nodes.find(node => node.id === id);
  }
  
  getEdgesFromNode(nodeId) {
    return this.edges.filter(edge => edge.source === nodeId);
  }
}