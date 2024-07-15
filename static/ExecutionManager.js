import { io } from "https://cdn.socket.io/4.4.1/socket.io.esm.min.js";

export class ExecutionManager {
    constructor(editor) {
        this.editor = editor;
        this.socket = io();
        this.socket.on('node_active', (data) => this.highlightActiveNode(data.node_id));
        this.socket.on('node_result', (data) => this.handleNodeResult(data));
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

    handleNodeResult(data) {
        const node = this.editor.nodes.find(n => n.id === data.node_id);
        if (node.type === 'if_else') {
            this.highlightIfElseOutput(data.node_id, data.result.condition_met);
        } else if (node.type === 'display') {
            this.editor.nodeManager.updateDisplayNode(data.node_id, data.result);
        }
        // Log results for all node types
        console.log(`Node ${data.node_id} (${node.type}) result:`, data.result);
    }

    highlightIfElseOutput(nodeId, conditionMet) {
        const node = document.getElementById(nodeId);
        if (node) {
            const trueOutput = node.querySelector('.output-port[data-port-type="condition_true"]');
            const falseOutput = node.querySelector('.output-port[data-port-type="condition_false"]');
            
            if (trueOutput) trueOutput.classList.toggle('active', conditionMet);
            if (falseOutput) falseOutput.classList.toggle('active', !conditionMet);
        }
    }

    executionFinished() {
        document.querySelectorAll('.node').forEach(node => {
            node.classList.remove('active');
        });
        document.querySelectorAll('.output-port').forEach(port => {
            port.classList.remove('active');
        });
        this.editor.playButton.disabled = false;
        this.editor.stopButton.disabled = true;
    }

    playWorkflow() {
        console.log('Starting workflow execution');
        this.editor.playButton.disabled = true;
        this.editor.stopButton.disabled = false;

        // Clear all display nodes before starting execution
        this.editor.nodes.forEach(node => {
            if (node.type === 'display') {
                this.editor.nodeManager.updateDisplayNode(node.id, { output: '' });
            }
        });

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
                        preparedNode.condition = nodeElement.querySelector('input[placeholder="Enter condition"]').value;
                        break;
                    case 'regular':
                        preparedNode.personality = nodeElement.querySelector('input[placeholder="Personality"]').value;
                        preparedNode.model = nodeElement.querySelector('select.model-select').value;
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
