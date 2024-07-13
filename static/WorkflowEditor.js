import { NodeManager } from './NodeManager.js';
import { ConnectionManager } from './ConnectionManager.js';
import { ExecutionManager } from './ExecutionManager.js';

export class WorkflowEditor {
    constructor() {
        this.nodes = [];
        this.connections = [];
        this.canvas = document.getElementById('canvas');
        this.addNodeButton = document.getElementById('add-node');
        this.addPromptNodeButton = document.getElementById('add-prompt-node');
        this.addDisplayNodeButton = document.getElementById('add-display-node');
        this.addIfElseNodeButton = document.getElementById('add-if-else-node');
        this.addModelLoaderNodeButton = document.getElementById('add-model-loader-node');
        this.saveWorkflowButton = document.getElementById('save-workflow');
        this.loadWorkflowSelect = document.getElementById('load-workflow');
        this.playButton = document.getElementById('play-workflow');
        this.stopButton = document.getElementById('stop-workflow');
        this.workflowNameInput = document.getElementById('workflow-name');

        this.nodeManager = new NodeManager(this);
        this.connectionManager = new ConnectionManager(this);
        this.executionManager = new ExecutionManager(this);

        this.addNodeButton.addEventListener('click', () => this.nodeManager.addNode('regular'));
        this.addPromptNodeButton.addEventListener('click', () => this.nodeManager.addNode('prompt'));
        this.addDisplayNodeButton.addEventListener('click', () => this.nodeManager.addNode('display'));
        this.addIfElseNodeButton.addEventListener('click', () => this.nodeManager.addNode('if_else'));
        this.addModelLoaderNodeButton.addEventListener('click', () => this.nodeManager.addNode('model_loader'));
        this.saveWorkflowButton.addEventListener('click', () => this.saveWorkflow());
        this.loadWorkflowSelect.addEventListener('change', (e) => this.loadWorkflow(e.target.value));
        this.playButton.addEventListener('click', () => this.executionManager.playWorkflow());
        this.stopButton.addEventListener('click', () => this.executionManager.stopWorkflow());
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('wheel', (e) => this.handleZoom(e));

        this.isPanning = false;
        this.lastX = 0;
        this.lastY = 0;
        this.offsetX = 0;
        this.offsetY = 0;
        this.scale = 1;
        this.availableModels = [];
        this.fetchAvailableModels();
        this.updateWorkflowList();
    }

    async fetchAvailableModels() {
        try {
            const response = await fetch('/api/list_models');
            const data = await response.json();
            this.availableModels = data.models.map(model => model.name);
        } catch (error) {
            console.error('Error fetching models:', error);
        }
    }

    handleMouseDown(e) {
        if (e.button === 1) { // Middle mouse button
            this.isPanning = true;
            this.lastX = e.clientX;
            this.lastY = e.clientY;
            e.preventDefault();
        }
    }

    handleMouseMove(e) {
        if (this.isPanning) {
            const dx = e.clientX - this.lastX;
            const dy = e.clientY - this.lastY;
            this.offsetX += dx;
            this.offsetY += dy;
            this.lastX = e.clientX;
            this.lastY = e.clientY;
            this.updateCanvasTransform();
        }
        this.connectionManager.drag(e);
    }

    handleMouseUp(e) {
        if (e.button === 1) {
            this.isPanning = false;
        }
        this.connectionManager.stopDragging(e);
    }

    handleZoom(e) {
        e.preventDefault();
        const delta = e.deltaY;
        const zoomFactor = 0.1;
        this.scale += delta > 0 ? -zoomFactor : zoomFactor;
        this.scale = Math.max(0.1, Math.min(this.scale, 2));  // Limit zoom between 0.1x and 2x
        this.updateCanvasTransform();
    }

    updateCanvasTransform() {
        this.canvas.style.transform = `translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`;
        this.connectionManager.renderConnections();
    }

    saveWorkflow() {
    const workflow = {
        name: this.workflowNameInput.value,
        nodes: this.nodes.map(node => {
            const nodeElement = document.getElementById(`node-${node.id}`);
            const baseNode = {
                id: node.id,
                type: node.type,
                x: (parseInt(nodeElement.style.left) - this.offsetX) / this.scale,
                y: (parseInt(nodeElement.style.top) - this.offsetY) / this.scale,
                model: node.model, // Include the model for all nodes
            };

            switch (node.type) {
                case 'regular':
                    return {
                        ...baseNode,
                        personality: nodeElement.querySelector('input[placeholder="Personality"]').value,
                    };
                case 'prompt':
                    return {
                        ...baseNode,
                        prompt: nodeElement.querySelector('textarea').value,
                    };
                case 'if_else':
                    return {
                        ...baseNode,
                        condition: nodeElement.querySelector('input[placeholder="Enter condition"]').value,
                    };
                default:
                    return baseNode;
            }
        }),
        connections: this.connections
    };
    
    console.log("Saving workflow:", workflow);
    
    fetch('/api/save_workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workflow)
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        this.updateWorkflowList();
    })
    .catch(error => console.error('Error:', error));
}

    loadWorkflow(filename) {
        if (!filename) return;

        fetch(`/api/load_workflow/${filename}`)
            .then(response => response.json())
            .then(workflow => {
                this.nodes = [];
                this.connections = [];
                this.canvas.innerHTML = '';
                
                workflow.nodes.forEach(node => {
                    this.nodes.push(node);
                    this.nodeManager.renderNode(node);
                    if (node.type === 'model_loader') {
                        const selectElement = document.querySelector(`#node-${node.id} select`);
                        if (selectElement) {
                            selectElement.value = node.model;
                            this.nodeManager.updateModelSelection(node.id, node.model);
                        }
                    }
                });

                this.connections = workflow.connections;
                this.connectionManager.renderConnections();

                this.workflowNameInput.value = workflow.name;
                
                console.log("Loaded workflow:", workflow);
            })
            .catch(error => console.error('Error:', error));
    }

    updateWorkflowList() {
        fetch('/api/list_workflows')
            .then(response => response.json())
            .then(workflows => {
                this.loadWorkflowSelect.innerHTML = '<option value="">Select a workflow</option>';
                workflows.forEach(workflow => {
                    const option = document.createElement('option');
                    option.value = workflow;
                    option.textContent = workflow;
                    this.loadWorkflowSelect.appendChild(option);
                });
            })
            .catch(error => console.error('Error:', error));
    }
}
