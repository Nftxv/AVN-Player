/**
 * Manages the user's journey through the graph, handling history and branching choices.
 */
export default class Navigation {
  constructor(graphData, player, renderer) {
    this.graphData = graphData;
    this.player = player;
    this.renderer = renderer;
    this.reset();
  }

  reset() {
    this.currentNode = null;
    this.history = [];
    this.graphData.nodes.forEach(n => n.highlighted = false);
    this.graphData.edges.forEach(e => e.highlighted = false);
  }

  startFromNode(nodeId) {
    if(this.currentNode?.id === nodeId) return;
    
    const node = this.graphData.getNodeById(nodeId);
    if (!node) return;
    
    const prevNodeId = this.currentNode?.id;
    this.currentNode = node;
    this.history = [nodeId];
    
    this.renderer.highlight(nodeId, prevNodeId);
    this.player.play(node);
  }

  async advance() {
    if (!this.currentNode) return;
    
    const options = this.graphData.getEdgesFromNode(this.currentNode.id);
    if (options.length === 0) {
      console.log("End of path.");
      this.player.stop();
      this.renderer.highlight(null, this.currentNode.id);
      this.currentNode = null;
      return;
    }
    
    let nextEdge;
    if (options.length === 1) {
      nextEdge = options[0];
    } else {
      nextEdge = await this.promptForChoice(options);
      if (!nextEdge) return;
    }
    this.transitionToEdge(nextEdge);
  }
  
  goBack() {
    if (this.history.length < 2) return;
    
    this.history.pop();
    const prevNodeId = this.history[this.history.length - 1];
    const prevNode = this.graphData.getNodeById(prevNodeId);

    if (prevNode) {
        const oldNodeId = this.currentNode.id;
        this.currentNode = prevNode;
        const edge = this.graphData.getEdgesFromNode(prevNodeId).find(e => e.target === oldNodeId);
        this.renderer.highlight(prevNodeId, oldNodeId, edge);
        this.player.play(prevNode);
    }
  }

  transitionToEdge(edge) {
    const prevNodeId = this.currentNode.id;
    const nextNode = this.graphData.getNodeById(edge.target);
    this.currentNode = nextNode;
    this.history.push(nextNode.id);
    
    this.renderer.highlight(nextNode.id, prevNodeId, edge);
    this.player.play(nextNode);
  }

  promptForChoice(options) {
    return new Promise((resolve) => {
      const modal = document.getElementById('choiceModal');
      const optionsContainer = document.getElementById('choiceOptions');
      const closeModalBtn = document.getElementById('closeModalBtn');
      optionsContainer.innerHTML = '';

      const onChoose = (edge) => {
        cleanup();
        resolve(edge);
      };
      
      const closeHandler = () => {
        cleanup();
        resolve(null);
      };

      const cleanup = () => {
          modal.classList.add('hidden');
          closeModalBtn.removeEventListener('click', closeHandler);
          while (optionsContainer.firstChild) {
              optionsContainer.removeChild(optionsContainer.firstChild);
          }
      }
      
      options.forEach(edge => {
        const button = document.createElement('button');
        const targetNode = this.graphData.getNodeById(edge.target);
        button.textContent = edge.label || targetNode?.title || 'Untitled Path';
        button.onclick = () => onChoose(edge);
        optionsContainer.appendChild(button);
      });
      
      closeModalBtn.addEventListener('click', closeHandler);
      modal.classList.remove('hidden');
    });
  }
}