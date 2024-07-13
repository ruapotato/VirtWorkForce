export class ConnectionManager {
    constructor(editor) {
        this.editor = editor;
        this.isDraggingConnection = false;
        this.tempConnection = null;
        this.startPort = null;
    }

    renderConnections() {
        this.editor.jsPlumbInstance.deleteEveryConnection();
        this.editor.connections.forEach(conn => {
            const sourceElement = document.getElementById(conn.source);
            const targetElement = document.getElementById(conn.target);
            if (sourceElement && targetElement) {
                this.editor.jsPlumbInstance.connect({
                    source: sourceElement,
                    target: targetElement,
                    anchors: ["Right", "Left"],
                    endpoint: "Dot",
                    connector: ["Bezier", { curviness: 50 }],
                    paintStyle: { stroke: "#8a2be2", strokeWidth: 2 },
                    overlays: [
                        ["Arrow", { location: 1, width: 10, length: 10 }]
                    ]
                });
            } else {
                console.warn(`Unable to render connection: source or target element not found`, conn);
            }
        });
    }

    clearConnections() {
        this.editor.jsPlumbInstance.deleteEveryConnection();
        this.editor.connections = [];
    }

    startConnectionDrag(e) {
        this.isDraggingConnection = true;
        this.startPort = e.target;
        this.tempConnection = this.editor.jsPlumbInstance.connect({
            source: this.startPort,
            target: this.editor.jsPlumbInstance.addEndpoint(document.body),
            anchors: ["Right", "Left"],
            endpoint: "Dot",
            connector: ["Bezier", { curviness: 50 }],
            paintStyle: { stroke: "#8a2be2", strokeWidth: 2 },
            overlays: [
                ["Arrow", { location: 1, width: 10, length: 10 }]
            ]
        });
    }

    drag(e) {
        if (this.isDraggingConnection && this.tempConnection) {
            const canvasRect = this.editor.canvas.getBoundingClientRect();
            const x = (e.clientX - canvasRect.left) / this.editor.scale;
            const y = (e.clientY - canvasRect.top) / this.editor.scale;
            this.editor.jsPlumbInstance.repaint(this.tempConnection.endpoints[1].element, { left: x, top: y });
        }
    }

    stopDragging(e) {
        if (this.isDraggingConnection) {
            const endPort = e.target.closest('.input-port');
            if (endPort) {
                const sourceId = this.startPort.getAttribute('data-node-id');
                const targetId = endPort.getAttribute('data-node-id');
                const sourceType = this.startPort.getAttribute('data-port-type');
                const targetType = endPort.getAttribute('data-port-type');

                this.editor.jsPlumbInstance.deleteConnection(this.tempConnection);
                this.editor.jsPlumbInstance.connect({
                    source: this.startPort,
                    target: endPort,
                    anchors: ["Right", "Left"],
                    endpoint: "Dot",
                    connector: ["Bezier", { curviness: 50 }],
                    paintStyle: { stroke: "#8a2be2", strokeWidth: 2 },
                    overlays: [
                        ["Arrow", { location: 1, width: 10, length: 10 }]
                    ]
                });

                this.editor.connections.push({
                    source: sourceId,
                    target: targetId,
                    sourceEndpoint: sourceType,
                    targetEndpoint: targetType
                });
            } else {
                this.editor.jsPlumbInstance.deleteConnection(this.tempConnection);
            }
        }
        this.isDraggingConnection = false;
        this.tempConnection = null;
        this.startPort = null;
    }
}
