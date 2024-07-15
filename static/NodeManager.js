export class NodeManager {
    constructor(editor) {
        this.editor = editor;
    }

    addNode(type) {
        const nodeId = `node-${Date.now()}`;
        const node = {
            id: nodeId,
            type: type,
            x: 50,
            y: 50,
            model: '',
            personality: '',
            prompt: type === 'prompt' ? 'Enter your prompt here' : '',
            condition: type === 'if_else' ? 'Enter condition here' : '',
        };

        this.editor.nodes.push(node);
        this.renderNode(node);
    }

    renderNode(node) {
        const nodeElement = document.createElement('div');
        nodeElement.id = node.id;
        nodeElement.className = `node ${node.type}-node`;
        nodeElement.style.left = `${node.x}px`;
        nodeElement.style.top = `${node.y}px`;

        let innerHTML = `
            <div class="node-header">
                <span class="node-title">${node.type.charAt(0).toUpperCase() + node.type.slice(1)} Node</span>
                <button class="remove-node" data-node-id="${node.id}">X</button>
            </div>
        `;

        innerHTML += this.getNodeContent(node);

        nodeElement.innerHTML = innerHTML;
        this.editor.canvas.appendChild(nodeElement);

        this.editor.jsPlumbInstance.draggable(nodeElement, {
            grid: [10, 10]
        });

        this.addEndpoints(node);

        const removeButton = nodeElement.querySelector('.remove-node');
        removeButton.addEventListener('click', () => this.removeNode(node.id));

        if (node.type === 'regular') {
            const modelSelect = nodeElement.querySelector('.model-select');
            modelSelect.addEventListener('change', (e) => this.updateModelSelection(node.id, e.target.value));
        }
    }

    getNodeContent(node) {
        switch (node.type) {
            case 'prompt':
                return `<textarea placeholder="Enter your prompt">${node.prompt}</textarea>`;
            case 'display':
                return `<div class="display-content"></div>`;
            case 'if_else':
                return `<input type="text" placeholder="Enter condition" value="${node.condition}">`;
            case 'regular':
                return `
                    <input type="text" placeholder="Personality" value="${node.personality || ''}">
                    <select class="model-select">
                        <option value="">Select a model</option>
                        ${this.editor.availableModels ? this.editor.availableModels.map(model => `<option value="${model}" ${node.model === model ? 'selected' : ''}>${model}</option>`).join('') : ''}
                    </select>
                `;
            default:
                return '';
        }
    }

    addEndpoints(node) {
        if (node.type !== 'prompt') {
            this.editor.jsPlumbInstance.addEndpoint(node.id, {
                anchor: "Left",
                isTarget: true,
                connectionsDetachable: false,
                maxConnections: -1
            });
        }
        
        if (node.type !== 'display') {
            if (node.type === 'if_else') {
                this.editor.jsPlumbInstance.addEndpoint(node.id, {
                    anchor: [1, 0.25, 1, 0],
                    isSource: true,
                    connectionsDetachable: false,
                    maxConnections: -1,
                    parameters: { portType: 'condition_true' }
                });
                this.editor.jsPlumbInstance.addEndpoint(node.id, {
                    anchor: [1, 0.75, 1, 0],
                    isSource: true,
                    connectionsDetachable: false,
                    maxConnections: -1,
                    parameters: { portType: 'condition_false' }
                });
            } else {
                this.editor.jsPlumbInstance.addEndpoint(node.id, {
                    anchor: "Right",
                    isSource: true,
                    connectionsDetachable: false,
                    maxConnections: -1
                });
            }
        }
    }

    removeNode(nodeId) {
        this.editor.jsPlumbInstance.remove(nodeId);
        this.editor.nodes = this.editor.nodes.filter(node => node.id !== nodeId);
        this.editor.connections = this.editor.connections.filter(conn => conn.source !== nodeId && conn.target !== nodeId);
    }

    updateDisplayNode(nodeId, result) {
        const nodeElement = document.getElementById(nodeId);
        if (nodeElement && nodeElement.classList.contains('display-node')) {
            const displayContent = nodeElement.querySelector('.display-content');
            if (displayContent) {
                displayContent.textContent = result.output || JSON.stringify(result);
                console.log(`Updated display node ${nodeId} with result:`, result);
            }
        }
    }

    updateModelSelection(nodeId, modelName) {
        const node = this.editor.nodes.find(n => n.id === nodeId);
        if (node) {
            node.model = modelName;
            console.log(`Model ${modelName} set for node ${nodeId}`);
        }
    }

    updateAvailableModels(models) {
        this.editor.availableModels = models;
        this.editor.nodes.forEach(node => {
            if (node.type === 'regular') {
                const selectElement = document.querySelector(`#${node.id} select.model-select`);
                if (selectElement) {
                    selectElement.innerHTML = `
                        <option value="">Select a model</option>
                        ${models.map(model => `<option value="${model}" ${node.model === model ? 'selected' : ''}>${model}</option>`).join('')}
                    `;
                }
            }
        });
    }
}
