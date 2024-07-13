# VirtWorkForce

## Author
David Hamner

## Description
VirtWorkForce is a web-based visual workflow editor for Language Learning Models (LLMs), inspired by the concept of ComfyUI but tailored for text-based AI models. It allows users to create, edit, and execute complex LLM workflows visually, providing a powerful and intuitive interface for AI-driven text processing and generation tasks.

## ComfyUI for LLMs
While ComfyUI focuses on creating workflows for image generation and manipulation, VirtWorkForce applies a similar node-based approach to LLM operations. This allows users to:

- Chain multiple LLM operations in a visual, intuitive manner
- Mix and match different LLM models within a single workflow
- Incorporate conditional logic and branching in text processing pipelines
- Visualize the flow of text data through various processing steps
- Easily experiment with and fine-tune complex LLM workflows

By providing this visual interface, VirtWorkForce aims to make advanced LLM operations more accessible to both developers and non-technical users, similar to how ComfyUI has done for image generation workflows.

## Features
- Visual node-based workflow creation for LLM operations
- Support for different node types (prompt, display, if-else, regular)
- Integration with Ollama for diverse AI model execution
- Real-time workflow execution with node highlighting
- Save and load workflow functionality
- Responsive and intuitive user interface

## Technologies Used
- Frontend: HTML, CSS, JavaScript
- Backend: Python with Flask
- AI Integration: Ollama
- WebSocket: Flask-SocketIO for real-time updates

## Setup and Installation
1. Clone the repository
2. Install the required Python packages:
   ```
   pip install flask flask-socketio ollama pyyaml
   ```
3. Ensure Ollama is installed and running on your system
4. Run the Flask application:
   ```
   python app.py
   ```
5. Open a web browser and navigate to `http://localhost:5000`

## Usage
1. Use the toolbar buttons to add different types of nodes to the canvas
2. Drag nodes to position them on the canvas
3. Connect nodes by clicking and dragging from output ports to input ports
4. Configure nodes by entering prompts, selecting models, or setting conditions
5. Save your workflow using the save button
6. Load existing workflows using the load dropdown
7. Execute the workflow by clicking the play button
8. View results in real-time as the workflow executes

## File Structure
```
VirtWorkForce/
│
├── app.py
├── static/
│   ├── index.html
│   ├── styles.css
│   ├── main.js
│   ├── WorkflowEditor.js
│   ├── NodeManager.js
│   ├── ConnectionManager.js
│   └── ExecutionManager.js
└── workflows/
```

## Contributing
Contributions to improve VirtWorkForce are welcome. Please follow these steps:
1. Fork the repository
2. Create a new branch
3. Make your changes and commit them
4. Push to your fork and submit a pull request

## License
[GNU General Public License v3.0](https://www.gnu.org/licenses/gpl-3.0.en.html)

## Acknowledgements
- This project was developed with the assistance of Claude.ai, an AI coding assistant.
- Thanks to the Ollama project for providing the AI model integration capabilities.
- Inspired by the concept of ComfyUI, adapted for LLM workflows.

## Contact
For any questions or feedback, please contact David Hamner.
