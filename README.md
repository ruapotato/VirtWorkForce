# VirtWorkForce

## Author
David Hamner

## Description
VirtWorkForce is a web-based visual workflow editor for Language Learning Models (LLMs), inspired by the concept of ComfyUI but tailored for text-based AI models. It allows users to create, edit, and execute complex LLM workflows visually, providing a powerful and intuitive interface for AI-driven text processing and generation tasks.

![VirtWorkForce Example Workflow](./img/example.png)

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
- jsPlumb: For creating visual connections between nodes

## Setup and Installation
1. Clone the repository:
   ```
   git clone https://github.com/yourusername/VirtWorkForce.git
   cd VirtWorkForce
   ```
2. Create a virtual environment and activate it:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   ```
3. Install the required Python packages:
   ```
   pip install flask flask-socketio ollama pyyaml
   ```
4. Ensure Ollama is installed and running on your system. Visit [Ollama's official website](https://ollama.ai/) for installation instructions.
5. Download jsPlumb from [jsDelivr](https://www.jsdelivr.com/package/npm/jsplumb) and place it in the `static/package/dist/js/` directory
6. Run the Flask application:
   ```
   python app.py
   ```
7. Open a web browser and navigate to `http://localhost:5000`

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
│   ├── main.js
│   ├── WorkflowEditor.js
│   ├── NodeManager.js
│   ├── ConnectionManager.js
│   ├── WorkflowIO.js
│   ├── ExecutionManager.js
│   ├── styles.css
│   └── package/
│       └── dist/
│           └── js/
│               └── jsplumb.min.js
├── templates/
│   └── index.html
├── workflows/
└── img/
    └── example.png
```

## Contributing
Contributions to improve VirtWorkForce are welcome. Please follow these steps:
1. Fork the repository
2. Create a new branch (`git checkout -b feature/AmazingFeature`)
3. Make your changes and commit them (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a pull request

## License
[GNU General Public License v3.0](https://www.gnu.org/licenses/gpl-3.0.en.html)

## Acknowledgements
- This project was developed with the assistance of Claude.ai, an AI coding assistant.
- Thanks to the Ollama project for providing the AI model integration capabilities.
- Inspired by the concept of ComfyUI, adapted for LLM workflows.
- jsPlumb library source: [jsDelivr - jsPlumb](https://www.jsdelivr.com/package/npm/jsplumb)

## Contact
For any questions or feedback, please open an issue in the GitHub repository or contact David Hamner directly.

## Troubleshooting
If you encounter any issues while setting up or running VirtWorkForce, please check the following:

1. Ensure all dependencies are correctly installed
2. Verify that Ollama is running and accessible
3. Check the console for any JavaScript errors
4. Review the Flask server logs for backend errors

If problems persist, please open an issue on the GitHub repository with a detailed description of the problem and steps to reproduce it.
