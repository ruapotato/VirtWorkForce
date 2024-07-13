export class ConnectionManager {
    constructor(editor) {
        this.editor = editor;
        this.isDraggingConnection = false;
        this.isRemovingConnection = false;
        this.tempConnection = null;
        this.draggingNode = null;
        this.startPort = null;
        this.connectionToRemove = null;
        this.offsetX = 0;
        this.offsetY = 0;
    }

    startConnectionDrag(e) {
        e.stopPropagation();
        this.isDraggingConnection = true;
        this.tempConnection = document.createElement('div');
        this.tempConnection.className = 'connection temp-connection';
        this.editor.canvas.appendChild(this.tempConnection);
        this.startPort = e.target;
        this.updateTempConnection(e);
    }

    updateTempConnection(e) {
        if (this.isDraggingConnection && this.tempConnection) {
            const startRect = this.startPort.getBoundingClientRect();
            const canvasRect = this.editor.canvas.getBoundingClientRect();
            const startX = (startRect.left + startRect.width / 2 - canvasRect.left) / this.editor.scale - this.editor.offsetX;
            const startY = (startRect.top + startRect.height / 2 - canvasRect.top) / this.editor.scale - this.editor.offsetY;
            const endX = (e.clientX - canvasRect.left) / this.editor.scale - this.editor.offsetX;
            const endY = (e.clientY - canvasRect.top) / this.editor.scale - this.editor.offsetY;

            const dx = endX - startX;
            const dy = endY - startY;
            const length = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);

            this.tempConnection.style.width = `${length}px`;
            this.tempConnection.style.left = `${startX}px`;
            this.tempConnection.style.top = `${startY}px`;
            this.tempConnection.style.transform = `rotate(${angle}rad)`;
        }
    }

    completeConnection(endPort) {
        if (this.isDraggingConnection && this.startPort !== endPort) {
            const startNodeId = this.startPort.getAttribute('data-node-id');
            const endNodeId = endPort.getAttribute('data-node-id');
            const startPortType = this.startPort.getAttribute('data-port-type');
            const endPortType = endPort.getAttribute('data-port-type');

            if (startPortType === 'model' && endPortType !== 'model') {
                console.log('Model loader can only connect to model inputs');
                return;
            }

            // Remove any existing connection to the end port
            this.editor.connections = this.editor.connections.filter(conn => !(conn.to === endNodeId && conn.toPort === endPortType));

            this.editor.connections.push({
                from: startNodeId,
                to: endNodeId,
                fromPort: startPortType,
                toPort: endPortType
            });
            this.renderConnections();
        }
    }

    startConnectionRemoval(e) {
        e.stopPropagation();
        const nodeId = e.target.getAttribute('data-node-id');
        const portType = e.target.getAttribute('data-port-type');
        const connection = this.editor.connections.find(conn => conn.to === nodeId && conn.toPort === portType);
        if (connection) {
            this.isRemovingConnection = true;
            this.connectionToRemove = connection;
            this.tempConnection = document.createElement('div');
            this.tempConnection.className = 'connection temp-connection removing';
            this.editor.canvas.appendChild(this.tempConnection);
            this.startPort = document.querySelector(`.output-port[data-node-id="${connection.from}"][data-port-type="${connection.fromPort}"]`);
            this.updateTempConnection(e);
        }
    }

    removeConnection(connection) {
        if (connection) {
            this.editor.connections = this.editor.connections.filter(conn => 
                conn.from !== connection.from || conn.to !== connection.to || 
                conn.fromPort !== connection.fromPort || conn.toPort !== connection.toPort
            );
            this.renderConnections();
        }
    }

    renderConnections() {
        this.editor.canvas.querySelectorAll('.connection:not(.temp-connection)').forEach(el => el.remove());
        this.editor.connections.forEach(conn => {
            const fromNode = document.getElementById(`node-${conn.from}`);
            const toNode = document.getElementById(`node-${conn.to}`);
            const fromPort = fromNode.querySelector(`.output-port[data-port-type="${conn.fromPort}"]`);
            const toPort = toNode.querySelector(`.input-port[data-port-type="${conn.toPort}"]`);
            this.drawConnection(fromPort, toPort);
        });
    }

    drawConnection(fromPort, toPort) {
        const connection = document.createElement('div');
        connection.className = 'connection';
        const fromRect = fromPort.getBoundingClientRect();
        const toRect = toPort.getBoundingClientRect();
        const canvasRect = this.editor.canvas.getBoundingClientRect();
        const fromX = (fromRect.left + fromRect.width / 2 - canvasRect.left) / this.editor.scale;
        const fromY = (fromRect.top + fromRect.height / 2 - canvasRect.top) / this.editor.scale;
        const toX = (toRect.left + toRect.width / 2 - canvasRect.left) / this.editor.scale;
        const toY = (toRect.top + toRect.height / 2 - canvasRect.top) / this.editor.scale;
        const dx = toX - fromX;
        const dy = toY - fromY;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        connection.style.width = `${length}px`;
        connection.style.left = `${fromX}px`;
        connection.style.top = `${fromY}px`;
        connection.style.transform = `rotate(${angle}rad)`;
        this.editor.canvas.appendChild(connection);
    }

    drag(e) {
        if (this.draggingNode) {
            const x = (e.clientX - this.editor.canvas.getBoundingClientRect().left) / this.editor.scale - this.offsetX;
            const y = (e.clientY - this.editor.canvas.getBoundingClientRect().top) / this.editor.scale - this.offsetY;
            this.draggingNode.style.left = `${x}px`;
            this.draggingNode.style.top = `${y}px`;
            this.renderConnections();
        } else if (this.isDraggingConnection || this.isRemovingConnection) {
            this.updateTempConnection(e);
        }
    }

    stopDragging(e) {
        if (this.draggingNode) {
            this.draggingNode = null;
        }
        if (this.isDraggingConnection) {
            const endPort = e.target.closest('.input-port');
            if (endPort) {
                this.completeConnection(endPort);
            }
            this.isDraggingConnection = false;
        }
        if (this.isRemovingConnection) {
            this.isRemovingConnection = false;
            if (!e.target.closest('.port')) {
                this.removeConnection(this.connectionToRemove);
            }
            this.connectionToRemove = null;
        }
        if (this.tempConnection) {
            this.tempConnection.remove();
            this.tempConnection = null;
        }
    }
}
