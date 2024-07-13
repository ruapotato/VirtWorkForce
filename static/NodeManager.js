export class NodeManager {
    constructor(editor) {
        this.editor = editor;
    }

    addNode(type) {
        const node = {
            id: Date.now(),
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
        nodeElement.className = `node ${node.type}-node`;
        nodeElement.id = `node-${node.id}`;
        nodeElement.style.left = `${node.x}px`;
        nodeElement.style.top = `${node.y}px`;

        let innerHTML = `
            <div class="node-header">
                <span class="node-title">${node.type.charAt(0).toUpperCase() + node.type.slice(1)} Node</span>
                <button class="remove-node" data-node-id="${node.id}">X</button>
            </div>
        `;

        if (node.type === 'prompt') {
            innerHTML += `
                <textarea placeholder="Enter your prompt">${node.prompt}</textarea>
                <div class="port output-port" data-node-id="${node.id}" data-port-type="output"></div>
                <span class="port-label output-port-label">Output</span>
            `;
        } else if (node.type === 'display') {
            innerHTML += `
                <div class="port input-port" data-node-id="${node.id}" data-port-type="input"></div>
                <span class="port-label input-port-label">Input</span>
                <div class="display-content" style="max-height: 200px; overflow-y: auto;"></div>
            `;
        } else if (node.type === 'if_else') {
            innerHTML += `
                <div class="port input-port" data-node-id="${node.id}" data-port-type="input"></div>
                <span class="port-label input-port-label">Input</span>
                <input type="text" placeholder="Enter condition" value="${node.condition}">
                <div class="port output-port present-port" data-node-id="${node.id}" data-port-type="present"></div>
                <span class="port-label output-port-label" style="top: 25%;">Present</span>
                <div class="port output-port absent-port" data-node-id="${node.id}" data-port-type="absent"></div>
                <span class="port-label output-port-label" style="top: 75%;">Absent</span>
            `;
        } else if (node.type === 'regular') {
            innerHTML += `
                <div class="port input-port" data-node-id="${node.id}" data-port-type="input"></div>
                <span class="port-label input-port-label">Input</span>
                <input type="text" placeholder="Personality" value="${node.personality || ''}">
                <select class="model-select" data-node-id="${node.id}">
                    <option value="">Select a model</option>
                    ${Array.isArray(this.editor.availableModels) ? this.editor.availableModels.map(model => `<option value="${model}" ${node.model === model ? 'selected' : ''}>${model}</option>`).join('') : ''}
                </select>
                <div class="port output-port" data-node-id="${node.id}" data-port-type="output"></div>
                <span class="port-label output-port-label">Output</span>
            `;
        }

        nodeElement.innerHTML = innerHTML;
        this.editor.canvas.appendChild(nodeElement);

        nodeElement.addEventListener('mousedown', (e) => this.startDragging(e));
        const outputPorts = nodeElement.querySelectorAll('.output-port');
        outputPorts.forEach(port => {
            port.addEventListener('mousedown', (e) => this.editor.connectionManager.startConnectionDrag(e));
        });
        const inputPorts = nodeElement.querySelectorAll('.input-port');
        inputPorts.forEach(port => {
            port.addEventListener('mousedown', (e) => this.editor.connectionManager.startConnectionRemoval(e));
        });

        const removeButton = nodeElement.querySelector('.remove-node');
        removeButton.addEventListener('click', (e) => this.removeNode(e.target.dataset.nodeId));

        if (node.type === 'regular') {
            const modelSelect = nodeElement.querySelector('.model-select');
            modelSelect.addEventListener('change', (e) => this.updateModelSelection(node.id, e.target.value));
        }
    }

    startDragging(e) {
        if (e.target.classList.contains('node')) {
            this.editor.connectionManager.draggingNode = e.target;
            this.editor.connectionManager.offsetX = e.clientX - e.target.offsetLeft;
            this.editor.connectionManager.offsetY = e.clientY - e.target.offsetTop;
        }
    }

    removeNode(nodeId) {
        this.editor.nodes = this.editor.nodes.filter(node => node.id != nodeId);
        this.editor.connections = this.editor.connections.filter(conn => conn.from != nodeId && conn.to != nodeId);
        document.getElementById(`node-${nodeId}`).remove();
        this.editor.connectionManager.renderConnections();
    }

    updateDisplayNode(nodeId, result) {
        const nodeElement = document.getElementById(`node-${nodeId}`);
        if (nodeElement && nodeElement.classList.contains('display-node')) {
            const displayContent = nodeElement.querySelector('.display-content');
            if (displayContent) {
                displayContent.textContent = result.output || JSON.stringify(result);
                console.log(`Updated display node ${nodeId} with result:`, result);
            }
        }
    }

    updateModelSelection(nodeId, modelName) {
        const node = this.editor.nodes.find(n => n.id == nodeId);
        if (node) {
            node.model = modelName;
            console.log(`Model ${modelName} set for node ${nodeId}`);
            // Update the select element
            const selectElement = document.querySelector(`#node-${nodeId} select.model-select`);
            if (selectElement) {
                selectElement.value = modelName;
            }
        }
    }

    updateAvailableModels(models) {
        this.editor.availableModels = models;
        // Update existing nodes with new model options
        this.editor.nodes.forEach(node => {
            if (node.type === 'regular') {
                const selectElement = document.querySelector(`#node-${node.id} select.model-select`);
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
