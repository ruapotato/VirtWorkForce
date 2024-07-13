import { NodeManager } from './NodeManager.js';
import { ConnectionManager } from './ConnectionManager.js';
import { WorkflowIO } from './WorkflowIO.js';
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
        this.saveWorkflowButton = document.getElementById('save-workflow');
        this.loadWorkflowSelect = document.getElementById('load-workflow');
        this.playButton = document.getElementById('play-workflow');
        this.stopButton = document.getElementById('stop-workflow');
        this.workflowNameInput = document.getElementById('workflow-name');

        this.jsPlumbInstance = null;
        this.isJSPlumbInitialized = false;

        this.nodeManager = new NodeManager(this);
        this.connectionManager = new ConnectionManager(this);
        this.workflowIO = new WorkflowIO(this);
        this.executionManager = new ExecutionManager(this);

        this.initializeJSPlumb();

        this.addNodeButton.addEventListener('click', () => this.nodeManager.addNode('regular'));
        this.addPromptNodeButton.addEventListener('click', () => this.nodeManager.addNode('prompt'));
        this.addDisplayNodeButton.addEventListener('click', () => this.nodeManager.addNode('display'));
        this.addIfElseNodeButton.addEventListener('click', () => this.nodeManager.addNode('if_else'));
        this.saveWorkflowButton.addEventListener('click', () => this.workflowIO.saveWorkflow());
        this.loadWorkflowSelect.addEventListener('change', (e) => this.workflowIO.loadWorkflow(e.target.value));
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
        this.workflowIO.updateWorkflowList();
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
                    target: info.targetId,
                    sourceEndpoint: info.sourceEndpoint.getParameter('portType'),
                    targetEndpoint: info.targetEndpoint.getParameter('portType')
                });
            });

            this.isJSPlumbInitialized = true;
            console.log("JSPlumb is initialized");
        });
    }

    handleMouseDown(e) {
        if (e.button === 1) { // Middle mouse button
            this.isPanning = true;
            this.lastX = e.clientX;
            this.lastY = e.clientY;
            e.preventDefault();
        } else if (e.target.classList.contains('output-port')) {
            this.connectionManager.startConnectionDrag(e);
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
        const oldScale = this.scale;
        this.scale += delta > 0 ? -zoomFactor : zoomFactor;
        this.scale = Math.max(0.1, Math.min(this.scale, 2));  // Limit zoom between 0.1x and 2x
        
        const scaleChange = this.scale / oldScale;
        
        this.nodes.forEach(node => {
            const nodeElement = document.getElementById(node.id);
            if (nodeElement) {
                const left = parseFloat(nodeElement.style.left);
                const top = parseFloat(nodeElement.style.top);
                nodeElement.style.left = `${left * scaleChange}px`;
                nodeElement.style.top = `${top * scaleChange}px`;
            }
        });
        
        this.updateCanvasTransform();
    }

    updateCanvasTransform() {
        this.canvas.style.transform = `translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`;
        this.jsPlumbInstance.setZoom(this.scale);
    }

    async fetchAvailableModels() {
        try {
            const response = await fetch('/api/list_models');
            const data = await response.json();
            this.availableModels = data.models ? data.models.map(model => model.name) : [];
            this.nodeManager.updateAvailableModels(this.availableModels);
        } catch (error) {
            console.error('Error fetching models:', error);
            this.availableModels = [];
        }
    }
}
