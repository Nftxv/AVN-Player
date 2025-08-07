/**
 * Manages the graph's data, including loading, parsing, and providing access to all entities.
 */
export default class GraphData {
  constructor() {
    this.nodes = [];
    this.edges = [];
    this.decorations = [];
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
   * Parses the raw JSON-LD data and populates nodes, edges, and decorations.
   * @param {object} data - The raw data object from the JSON file.
   */
  parseData(data) {
    this.meta = data.meta || {};
    const graph = data['@graph'] || [];

    // Clear existing data
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
            lyricsUrl: item.lyricsUrl || null,
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
          this.decorations.push({ // CORRECTED: was 'this.decoration'
            id: item['@id'],
            type: 'rectangle',
            x: item.position?.x || 0,
            y: item.position?.y || 0,
            width: item.size?.width || 200,
            height: item.size?.height || 100,
            backgroundColor: item.backgroundColor || '#333333',
          });
          break;
        case 'TextAnnotation':
          this.decorations.push({ // CORRECTED: was 'this.decoration'
            id: item['@id'],
            type: 'text',
            x: item.position?.x || 0,
            y: item.position?.y || 0,
            textContent: item.textContent || '',
            fontSize: item.fontSize || 16,
            color: item.color || '#FFFFFF',
            textAlign: item.textAlign || 'left',
            width: item.width,
            lineHeight: item.lineHeight || 1.2,
          });
          break;
      }
    });
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
      })),
      ...this.decorations.map(d => {
        const common = { '@id': d.id, position: { x: d.x, y: d.y } };
        if (d.type === 'rectangle') {
          return {
            ...common,
            '@type': 'RectangleAnnotation',
            size: { width: d.width, height: d.height },
            backgroundColor: d.backgroundColor,
          };
        }
        if (d.type === 'text') {
          return {
            ...common,
            '@type': 'TextAnnotation',
            textContent: d.textContent,
            fontSize: d.fontSize,
            color: d.color,
            textAlign: d.textAlign,
            width: d.width,
            lineHeight: d.lineHeight,
          };
        }
        return null;
      }).filter(Boolean),
    ];
    return {
      '@context': 'https://schema.org/',
      ...(Object.keys(this.meta).length > 0 && { meta: this.meta }),
      '@graph': graph,
    };
  }
  
  /**
   * Parses various YouTube URL formats and returns only the video ID.
   * @param {string} input - The URL or ID provided by the user.
   * @returns {string|null} - The 11-character video ID or null.
   */
  parseYoutubeUrl(input) {
      if (!input || typeof input !== 'string') return null;
      
      // Regular expression to find the YouTube video ID in various URL formats
      const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
      const match = input.match(regex);
      
      if (match && match[1]) {
          return match[1];
      }
      
      // If no match from URL, check if the input itself is a valid ID
      if (/^[a-zA-Z0-9_-]{11}$/.test(input.trim())) {
          return input.trim();
      }
      
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