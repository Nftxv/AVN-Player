/**
 * Manages the user's journey through the graph, handling history and branching choices.
 */
export default class Navigation {
  constructor(graphData, player, renderer, app) {
    this.graphData = graphData;
    this.player = player;
    this.renderer = renderer;
    this.app = app;
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
    this.renderer.disableLocalInteraction?.(); // Reset mobile interaction mode

    const node = this.graphData.getNodeById(nodeId);
    if (!node) return;
    
    const prevNodeId = this.currentNode?.id;
    this.currentNode = node;
    this.history = [nodeId];
    
    this.renderer.highlight(nodeId, prevNodeId);

    // THE FIX IS HERE.
    if (this.app.isFollowing) {
        // If we are starting a new navigation chain (no previous node was active),
        // we must calculate the follow offset NOW, based on where the user clicked the node.
        // This "captures" the user's intended viewport for the entire follow session.
        if (!prevNodeId) {
            const { offset, scale } = this.renderer.getViewport();
            
            // Get the TRUE visual center from the Renderer, which is the single source of truth.
            const { x: nodeWorldX, y: nodeWorldY } = this.renderer.getNodeVisualCenter(node);

            // Calculate where that true center currently is on the screen.
            const nodeScreenX = nodeWorldX * scale + offset.x;
            const nodeScreenY = nodeWorldY * scale + offset.y;
            
            // Calculate the difference between the screen center and the node's current position.
            // This becomes the offset we maintain for all subsequent "follow" movements.
            this.app.followScreenOffset.x = this.renderer.canvas.width / 2 - nodeScreenX;
            this.app.followScreenOffset.y = this.renderer.canvas.height / 2 - nodeScreenY;
            
            console.log('Follow mode: New chain started, capturing initial screen offset.', this.app.followScreenOffset);
        }
        
        // Now, center on the node using the (potentially just-updated) offset.
        this.renderer.centerOnNode(nodeId, this.app.followScale, this.app.followScreenOffset);
    }
    
    // Play the node after initiating the camera movement.
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

      // On mobile, if the screen is off (document hidden) and it's an audio node,
      // showing a choice modal will fail. We auto-select randomly to ensure playback continues.
      const isMobileInBackground = (window.innerWidth < 768 && document.hidden);
      if (isMobileInBackground && this.currentNode.sourceType === 'audio') {
        console.log("Mobile background: auto-selecting next audio node randomly.");
        nextEdge = options[Math.floor(Math.random() * options.length)];
      } else {
        nextEdge = await this.promptForChoice(options);
        if (!nextEdge) return;
      }
    }
    this.transitionToEdge(nextEdge);
  }
  
goBack() {
    if (!this.currentNode) return;
    this.renderer.disableLocalInteraction?.(); // Reset mobile interaction mode

    const oldNodeId = this.currentNode.id;
    let prevNodeId = null;
    let edgeToHighlight = null;

    if (this.history.length > 1) {
        this.history.pop();
        prevNodeId = this.history[this.history.length - 1];
        edgeToHighlight = this.graphData.edges.find(e => e.source === prevNodeId && e.target === oldNodeId);
    } 
    else {
        const incomingEdges = this.graphData.edges.filter(e => e.target === oldNodeId);
        if (incomingEdges.length === 1) {
            edgeToHighlight = incomingEdges[0];
            prevNodeId = edgeToHighlight.source;
            this.history.unshift(prevNodeId);
            this.history.pop();
        } else {
            console.log("Cannot go back: No history and ambiguous or no predecessor.");
            return;
        }
    }

    const prevNode = this.graphData.getNodeById(prevNodeId);
    if (prevNode) {
        this.currentNode = prevNode;
        this.renderer.highlight(prevNodeId, oldNodeId, edgeToHighlight);
        this.player.play(prevNode);

        if (this.app.isFollowing) {
            this.renderer.centerOnNode(prevNodeId, this.app.followScale, this.app.followScreenOffset);
        }
    }
  }

  transitionToEdge(edge) {
    this.renderer.disableLocalInteraction?.(); // Reset mobile interaction mode
    const prevNodeId = this.currentNode.id;
    const nextNode = this.graphData.getNodeById(edge.target);
    if (!nextNode) return;
    
    this.currentNode = nextNode;
    this.history.push(nextNode.id);
    
    this.renderer.highlight(nextNode.id, prevNodeId, edge);
    this.player.play(nextNode);
    
    if (this.app.isFollowing) {
        this.renderer.centerOnNode(nextNode.id, this.app.followScale, this.app.followScreenOffset);
    }
  }
  
  promptForChoice(options) {
    //... No changes here
    return new Promise((resolve) => {
      const modal = document.getElementById('choiceModal');
      const optionsContainer = document.getElementById('choiceOptions');
      const closeModalBtn = document.getElementById('closeModalBtn');
      const choiceTimerEl = document.getElementById('choiceTimer');
      const countdownEl = document.getElementById('countdown');
      
      let countdown = 5;
      let timerId = null;
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
          clearInterval(timerId);
          modal.classList.add('hidden');
          choiceTimerEl.classList.add('hidden');
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
      
      countdownEl.textContent = countdown;
      choiceTimerEl.classList.remove('hidden');
      modal.classList.remove('hidden');

      timerId = setInterval(() => {
        countdown--;
        countdownEl.textContent = countdown;
        if (countdown <= 0) {
          const randomChoice = options[Math.floor(Math.random() * options.length)];
          onChoose(randomChoice);
        }
      }, 1000);
    });
  }
}