import { io } from "https://cdn.socket.io/4.4.1/socket.io.esm.min.js";

export class ExecutionManager {
    constructor(editor) {
        this.editor = editor;
        this.socket = io();
        this.socket.on('node_active', (data) => this.highlightActiveNode(data.node_id));
        this.socket.on('node_result', (data) => this.editor.nodeManager.updateDisplayNode(data.node_id, data.result));
        this.socket.on('execution_finished', () => this.executionFinished());
    }

    highlightActiveNode(nodeId) {
        document.querySelectorAll('.node').forEach(node => {
            node.classList.remove('active');
        });
        const activeNode = document.getElementById(nodeId);
        if (activeNode) {
            activeNode.classList.add('active');
        }
    }

    executionFinished() {
        document.querySelectorAll('.node').forEach(node => {
            node.classList.remove('active');
        });
        this.editor.playButton.disabled = false;
        this.editor.stopButton.disabled = true;
    }

    playWorkflow() {
        console.log('Starting workflow execution');
        this.editor.playButton.disabled = true;
        this.editor.stopButton.disabled = false;

        const workflow = this.prepareWorkflowForExecution();

        console.log('Workflow to be executed:', JSON.stringify(workflow, null, 2));

        fetch('/api/execute_workflow', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(workflow)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(results => {
            console.log('Received results:', results);
        })
        .catch(error => {
            console.error('Error executing workflow:', error);
            alert('Error executing workflow. Check the console for details.');
        })
        .finally(() => {
            this.executionFinished();
        });
    }

    prepareWorkflowForExecution() {
        return {
            nodes: this.editor.nodes.map(node => {
                const nodeElement = document.getElementById(node.id);
                const preparedNode = {
                    id: node.id,
                    type: node.type,
                    x: parseInt(nodeElement.style.left),
                    y: parseInt(nodeElement.style.top),
                };

                switch (node.type) {
                    case 'prompt':
                        preparedNode.prompt = nodeElement.querySelector('textarea').value;
                        break;
                    case 'if_else':
                        preparedNode.condition = nodeElement.querySelector('input').value;
                        break;
                    case 'regular':
                        preparedNode.personality = nodeElement.querySelector('input').value;
                        preparedNode.model = nodeElement.querySelector('select').value;
                        break;
                }

                return preparedNode;
            }),
            connections: this.editor.jsPlumbInstance.getConnections().map(conn => ({
                source: conn.sourceId,
                target: conn.targetId,
                sourceEndpoint: conn.endpoints[0].getParameter('portType'),
                targetEndpoint: conn.endpoints[1].getParameter('portType')
            }))
        };
    }

    stopWorkflow() {
        console.log('Stopping workflow execution');
        fetch('/api/stop_execution', {
            method: 'POST'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Workflow execution stopped');
        })
        .catch(error => {
            console.error('Error stopping workflow:', error);
            alert('Error stopping workflow. Check the console for details.');
        });
    }
}
