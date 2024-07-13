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
        const activeNode = document.getElementById(`node-${nodeId}`);
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

    async playWorkflow() {
        console.log('Starting workflow execution');
        this.editor.playButton.disabled = true;
        this.editor.stopButton.disabled = false;

        const workflow = {
            nodes: this.editor.nodes.map(node => {
    const nodeElement = document.getElementById(`node-${node.id}`);
    return {
        id: node.id,
        type: node.type,
        x: parseInt(nodeElement.style.left),
        y: parseInt(nodeElement.style.top),
        personality: node.type === 'regular' ? nodeElement.querySelector('input').value : '',
        prompt: node.type === 'prompt' ? nodeElement.querySelector('textarea').value : '',
        model: node.type === 'regular' ? node.model : '' // Add this line
    };
}),
            connections: this.editor.connections
        };

        console.log('Workflow to be executed:', JSON.stringify(workflow, null, 2));

        try {
            console.log('Sending request to /api/execute_workflow');
            const response = await fetch('/api/execute_workflow', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(workflow)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const results = await response.json();
            console.log('Received results:', results);

            // We don't need to update display nodes here anymore as it's done in real-time
        } catch (error) {
            console.error('Error executing workflow:', error);
            alert('Error executing workflow. Check the console for details.');
        }

        this.executionFinished();
    }

    async stopWorkflow() {
        console.log('Stopping workflow execution');
        try {
            const response = await fetch('/api/stop_execution', {
                method: 'POST'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            console.log('Workflow execution stopped');
        } catch (error) {
            console.error('Error stopping workflow:', error);
            alert('Error stopping workflow. Check the console for details.');
        }
    }
}
