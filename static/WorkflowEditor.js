export class WorkflowEditor {
    constructor() {
        this.nodes = [];
        this.connections = [];
        this.canvas = document.getElementById('canvas');
        this.addNodeButton = document.getElementById('add-node');
        this.addPromptNodeButton = document.getElementById('add-prompt-node');
        this.addDisplayNodeButton = document.getElementById('add-display-node');
        this.addIfElseNodeButton = document.getElementById('add-if-else-node');
        this.saveWorkflowButton = document.getElementById('save-workflow');
        this.loadWorkflowSelect = document.getElementById('load-workflow');
        this.playButton = document.getElementById('play-workflow');
        this.stopButton = document.getElementById('stop-workflow');
        this.workflowNameInput = document.getElementById('workflow-name');

        this.jsPlumbInstance = null;
        this.isJSPlumbInitialized = false;

        this.initializeJSPlumb();

        this.addNodeButton.addEventListener('click', () => this.addNode('regular'));
        this.addPromptNodeButton.addEventListener('click', () => this.addNode('prompt'));
        this.addDisplayNodeButton.addEventListener('click', () => this.addNode('display'));
        this.addIfElseNodeButton.addEventListener('click', () => this.addNode('if_else'));
        this.saveWorkflowButton.addEventListener('click', () => this.saveWorkflow());
        this.loadWorkflowSelect.addEventListener('change', (e) => this.loadWorkflow(e.target.value));
        this.playButton.addEventListener('click', () => this.playWorkflow());
        this.stopButton.addEventListener('click', () => this.stopWorkflow());

        this.fetchAvailableModels();
        this.updateWorkflowList();

        // Initialize WebSocket connection
        this.socket = io();
        this.socket.on('node_active', (data) => this.highlightActiveNode(data.node_id));
        this.socket.on('node_result', (data) => this.updateNodeWithResult(data.node_id, data.result));
        this.socket.on('execution_finished', () => this.onExecutionFinished());
    }

    initializeJSPlumb() {
        jsPlumb.ready(() => {
            this.jsPlumbInstance = jsPlumb.getInstance({
                Connector: ["Bezier", { curviness: 50 }],
                DragOptions: { cursor: 'pointer', zIndex: 2000 },
                PaintStyle: { stroke: "#8a2be2", strokeWidth: 2 },
                EndpointStyle: { radius: 9, fill: "#8a2be2" },
                HoverPaintStyle: { stroke: "#8a2be2", strokeWidth: 3 },
                EndpointHoverStyle: { fill: "#8a2be2" },
                Container: "canvas"
            });

            this.jsPlumbInstance.bind("connection", (info) => {
                this.connections.push({
                    source: info.sourceId,
                    target: info.targetId
                });
            });

            this.isJSPlumbInitialized = true;
            console.log("JSPlumb is initialized");
        });
    }

    addNode(type) {
        if (!this.isJSPlumbInitialized) {
            console.log("JSPlumb is not initialized yet. Waiting...");
            setTimeout(() => this.addNode(type), 100);
            return;
        }

        const nodeId = `node_${Date.now()}`;
        const node = document.createElement('div');
        node.id = nodeId;
        node.className = `node ${type}-node`;
        node.style.left = `${Math.random() * (this.canvas.clientWidth - 100)}px`;
        node.style.top = `${Math.random() * (this.canvas.clientHeight - 100)}px`;

        let innerHTML = `<div class="node-header">${type.charAt(0).toUpperCase() + type.slice(1)} Node</div>`;

        switch (type) {
            case 'prompt':
                innerHTML += '<textarea placeholder="Enter your prompt"></textarea>';
                break;
            case 'display':
                innerHTML += '<div class="display-content"></div>';
                break;
            case 'if_else':
                innerHTML += '<input type="text" placeholder="Enter condition">';
                break;
            case 'regular':
                innerHTML += `
                    <input type="text" placeholder="Personality">
                    <select class="model-select">
                        <option value="">Select a model</option>
                        ${this.availableModels ? this.availableModels.map(model => `<option value="${model}">${model}</option>`).join('') : ''}
                    </select>
                `;
                break;
        }

        node.innerHTML = innerHTML;
        this.canvas.appendChild(node);

        this.jsPlumbInstance.draggable(nodeId, {
            grid: [10, 10]
        });

        if (type !== 'display') {
            this.jsPlumbInstance.addEndpoint(nodeId, {
                anchor: "Right",
                isSource: true,
                connectionsDetachable: false
            });
        }

        if (type !== 'prompt') {
            this.jsPlumbInstance.addEndpoint(nodeId, {
                anchor: "Left",
                isTarget: true,
                connectionsDetachable: false
            });
        }

        this.nodes.push({ id: nodeId, type: type });
    }

    saveWorkflow() {
        const workflow = {
            name: this.workflowNameInput.value,
            nodes: this.nodes.map(node => {
                const nodeElement = document.getElementById(node.id);
                const nodeData = {
                    id: node.id,
                    type: node.type,
                    x: parseInt(nodeElement.style.left),
                    y: parseInt(nodeElement.style.top)
                };

                if (node.type === 'prompt') {
                    nodeData.prompt = nodeElement.querySelector('textarea').value;
                } else if (node.type === 'if_else') {
                    nodeData.condition = nodeElement.querySelector('input').value;
                } else if (node.type === 'regular') {
                    nodeData.personality = nodeElement.querySelector('input').value;
                    nodeData.model = nodeElement.querySelector('select').value;
                }

                return nodeData;
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
                    this.renderNode(node);
                });

                this.connections = workflow.connections;
                this.jsPlumbInstance.reset();
                this.connections.forEach(conn => {
                    this.jsPlumbInstance.connect({
                        source: conn.source,
                        target: conn.target
                    });
                });

                this.workflowNameInput.value = workflow.name;
                
                console.log("Loaded workflow:", workflow);
            })
            .catch(error => console.error('Error:', error));
    }

    renderNode(node) {
        const nodeElement = document.createElement('div');
        nodeElement.id = node.id;
        nodeElement.className = `node ${node.type}-node`;
        nodeElement.style.left = `${node.x}px`;
        nodeElement.style.top = `${node.y}px`;

        let innerHTML = `<div class="node-header">${node.type.charAt(0).toUpperCase() + node.type.slice(1)} Node</div>`;

        switch (node.type) {
            case 'prompt':
                innerHTML += `<textarea placeholder="Enter your prompt">${node.prompt || ''}</textarea>`;
                break;
            case 'display':
                innerHTML += '<div class="display-content"></div>';
                break;
            case 'if_else':
                innerHTML += `<input type="text" placeholder="Enter condition" value="${node.condition || ''}">`;
                break;
            case 'regular':
                innerHTML += `
                    <input type="text" placeholder="Personality" value="${node.personality || ''}">
                    <select class="model-select">
                        <option value="">Select a model</option>
                        ${this.availableModels ? this.availableModels.map(model => `<option value="${model}" ${node.model === model ? 'selected' : ''}>${model}</option>`).join('') : ''}
                    </select>
                `;
                break;
        }

        nodeElement.innerHTML = innerHTML;
        this.canvas.appendChild(nodeElement);

        this.jsPlumbInstance.draggable(node.id, {
            grid: [10, 10]
        });

        if (node.type !== 'display') {
            this.jsPlumbInstance.addEndpoint(node.id, {
                anchor: "Right",
                isSource: true,
                connectionsDetachable: false
            });
        }

        if (node.type !== 'prompt') {
            this.jsPlumbInstance.addEndpoint(node.id, {
                anchor: "Left",
                isTarget: true,
                connectionsDetachable: false
            });
        }
    }

    async fetchAvailableModels() {
        try {
            const response = await fetch('/api/list_models');
            const data = await response.json();
            this.availableModels = data.models ? data.models.map(model => model.name) : [];
        } catch (error) {
            console.error('Error fetching models:', error);
            this.availableModels = [];
        }
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

    playWorkflow() {
        console.log("Playing workflow");
        const workflow = this.prepareWorkflowForExecution();
        
        fetch('/api/execute_workflow', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(workflow),
        })
        .then(response => response.json())
        .then(data => {
            console.log("Workflow execution response:", data);
            this.updateNodesWithResults(data);
        })
        .catch(error => {
            console.error('Error executing workflow:', error);
        });
    }

    prepareWorkflowForExecution() {
        return {
            nodes: this.nodes.map(node => {
                const nodeElement = document.getElementById(node.id);
                const nodeData = {
                    id: node.id,
                    type: node.type,
                };

                if (node.type === 'prompt') {
                    nodeData.prompt = nodeElement.querySelector('textarea').value;
                } else if (node.type === 'if_else') {
                    nodeData.condition = nodeElement.querySelector('input').value;
                } else if (node.type === 'regular') {
                    nodeData.personality = nodeElement.querySelector('input').value;
                    nodeData.model = nodeElement.querySelector('select').value;
                }

                return nodeData;
            }),
            connections: this.connections,
        };
    }

    updateNodesWithResults(results) {
        for (const [nodeId, result] of Object.entries(results)) {
            this.updateNodeWithResult(nodeId, result);
        }
    }

    highlightActiveNode(nodeId) {
        const nodeElement = document.getElementById(nodeId);
        if (nodeElement) {
            nodeElement.classList.add('active');
        }
    }

    updateNodeWithResult(nodeId, result) {
        const nodeElement = document.getElementById(nodeId);
        if (nodeElement) {
            if (nodeElement.classList.contains('display-node')) {
                const displayContent = nodeElement.querySelector('.display-content');
                if (displayContent) {
                    displayContent.textContent = result.output || JSON.stringify(result);
                }
            }
            nodeElement.classList.remove('active');
            nodeElement.classList.add('processed');
            setTimeout(() => nodeElement.classList.remove('processed'), 2000);
        }
    }

    onExecutionFinished() {
        console.log("Workflow execution finished");
        // You can add any cleanup or UI updates here
    }

    stopWorkflow() {
        console.log("Stopping workflow");
        fetch('/api/stop_execution', {
            method: 'POST',
        })
        .then(response => response.json())
        .then(data => {
            console.log("Workflow stopped:", data);
        })
        .catch(error => {
            console.error('Error stopping workflow:', error);
        });
    }
}
