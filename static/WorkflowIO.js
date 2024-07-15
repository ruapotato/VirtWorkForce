export class WorkflowIO {
    constructor(editor) {
        this.editor = editor;
    }

    saveWorkflow() {
        const workflow = {
            name: this.editor.workflowNameInput.value,
            nodes: this.editor.nodes.map(node => {
                const nodeElement = document.getElementById(node.id);
                if (!nodeElement) {
                    console.warn(`Node element not found for id: ${node.id}`);
                    return null;
                }
                const nodeData = {
                    id: node.id,
                    type: node.type,
                    x: parseInt(nodeElement.style.left),
                    y: parseInt(nodeElement.style.top),
                    model: node.model,
                };

                switch (node.type) {
                    case 'regular':
                        nodeData.personality = nodeElement.querySelector('input[placeholder="Personality"]')?.value || '';
                        break;
                    case 'prompt':
                        nodeData.prompt = nodeElement.querySelector('textarea')?.value || '';
                        break;
                    case 'if_else':
                        nodeData.condition = nodeElement.querySelector('input[placeholder="Enter condition"]')?.value || '';
                        break;
                }

                return nodeData;
            }).filter(node => node !== null),
            connections: this.editor.jsPlumbInstance.getConnections().map(conn => ({
                source: conn.sourceId,
                target: conn.targetId,
                sourceEndpoint: conn.endpoints[0].getParameter('portType'),
                targetEndpoint: conn.endpoints[1].getParameter('portType')
            }))
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
                this.editor.nodes = [];
                this.editor.jsPlumbInstance.deleteEveryEndpoint();
                this.editor.canvas.innerHTML = '';
                
                workflow.nodes.forEach(node => {
                    this.editor.nodes.push(node);
                    this.editor.nodeManager.renderNode(node);
                });

                workflow.connections.forEach(conn => {
                    const sourceNode = this.editor.nodes.find(n => n.id === conn.source);
                    const targetNode = this.editor.nodes.find(n => n.id === conn.target);
                    
                    if (sourceNode && targetNode) {
                        let sourceEndpoint, targetEndpoint;
                        
                        if (sourceNode.type === 'if_else') {
                            sourceEndpoint = this.editor.jsPlumbInstance.getEndpoints(conn.source).find(ep => ep.getParameter('portType') === conn.sourceEndpoint);
                        } else {
                            sourceEndpoint = this.editor.jsPlumbInstance.getEndpoints(conn.source).find(ep => ep.getParameter('portType') === 'output');
                        }
                        
                        targetEndpoint = this.editor.jsPlumbInstance.getEndpoints(conn.target).find(ep => ep.getParameter('portType') === 'input');
                        
                        if (sourceEndpoint && targetEndpoint) {
                            this.editor.jsPlumbInstance.connect({
                                source: sourceEndpoint,
                                target: targetEndpoint
                            });
                        } else {
                            console.error(`Unable to find endpoints for connection: ${conn.source} -> ${conn.target}`);
                        }
                    } else {
                        console.error(`Unable to find nodes for connection: ${conn.source} -> ${conn.target}`);
                    }
                });

                this.editor.workflowNameInput.value = workflow.name;
                
                console.log("Loaded workflow:", workflow);
            })
            .catch(error => console.error('Error:', error));
    }

    updateWorkflowList() {
        fetch('/api/list_workflows')
            .then(response => response.json())
            .then(workflows => {
                this.editor.loadWorkflowSelect.innerHTML = '<option value="">Select a workflow</option>';
                workflows.forEach(workflow => {
                    const option = document.createElement('option');
                    option.value = workflow;
                    option.textContent = workflow;
                    this.editor.loadWorkflowSelect.appendChild(option);
                });
            })
            .catch(error => console.error('Error:', error));
    }
}
