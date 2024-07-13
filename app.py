import os
import logging
from flask import Flask, request, jsonify, send_from_directory
import ollama
import yaml
from typing import List, Dict, Any
from flask_socketio import SocketIO, emit

app = Flask(__name__, static_folder='static')
socketio = SocketIO(app, cors_allowed_origins="*")
logging.basicConfig(level=logging.DEBUG)

stop_execution = False
loaded_models = set()

class WorkerBlock:
    def __init__(self, id: str, type: str, personality: str = "", prompt: str = "", condition: str = "", model: str = ""):
        self.id = id
        self.type = type
        self.model = model
        self.personality = personality
        self.prompt = prompt
        self.condition = condition
        self.model = model
        self.context = []

    def execute(self, input_data: str = "") -> Dict[str, str]:
        app.logger.debug(f"Executing block: {self.id}, Type: {self.type}, Model: {self.model}")
        if self.type == 'prompt':
            return {"output": self.prompt}
        elif self.type == 'display':
            return {"output": input_data}
        elif self.type == 'if_else':
            if self.condition.lower() in input_data.lower():
                return {"present": input_data}
            else:
                return {"absent": input_data}
        elif self.type == 'regular':
            if not self.model:
                app.logger.error(f"No model selected for node {self.id}")
                return {"output": f"Error: No model selected for node {self.id}"}
            
            if self.model not in loaded_models:
                try:
                    ollama.pull(self.model)
                    loaded_models.add(self.model)
                except Exception as e:
                    app.logger.error(f"Error loading model {self.model}: {str(e)}")
                    return {"output": f"Error: Failed to load model {self.model}"}

            full_prompt = f"{self.personality}\n\nInput: {input_data}\n\nTask: Process the input according to your personality."
            try:
                response = ollama.chat(
                    model=self.model,
                    messages=self.context + [{"role": "user", "content": full_prompt}],
                    stream=False
                )
                result = response['message']['content']
                self.context.append({"role": "user", "content": full_prompt})
                self.context.append({"role": "assistant", "content": result})
                return {"output": result}
            except Exception as e:
                app.logger.error(f"Error in Ollama generate: {str(e)}")
                return {"output": f"Error: {str(e)}"}
        else:
            return {"output": f"Error: Unknown node type {self.type}"}

def load_workflow(filename: str) -> Dict[str, Any]:
    with open(filename, 'r') as file:
        return yaml.safe_load(file)

def save_workflow(workflow: Dict[str, Any], filename: str):
    with open(filename, 'w') as file:
        yaml.dump(workflow, file)

@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory('static', filename)

@app.route('/api/list_models', methods=['GET'])
def list_models():
    try:
        models = ollama.list()
        return jsonify(models)
    except Exception as e:
        app.logger.error(f"Error listing models: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/execute_workflow', methods=['POST'])
def execute_workflow():
    global stop_execution
    stop_execution = False
    app.logger.info("Received request to execute workflow")
    workflow = request.json
    app.logger.debug(f"Received workflow: {workflow}")
    results = {}
    workers = {}
    
    def execute_node(node_id):
        global stop_execution
        if stop_execution:
            app.logger.info("Execution stopped by user")
            return {"output": "Execution stopped by user"}

        app.logger.debug(f"Executing node: {node_id}")
        socketio.emit('node_active', {'node_id': node_id})
        
        if node_id in results:
            app.logger.debug(f"Node {node_id} already executed, returning cached result")
            return results[node_id]
        
        node = next((n for n in workflow['nodes'] if str(n['id']) == str(node_id)), None)
        if not node:
            app.logger.error(f"Node {node_id} not found in workflow")
            return {"output": f"Error: Node {node_id} not found"}

        if node_id not in workers:
            workers[node_id] = WorkerBlock(
                str(node['id']), 
                node['type'], 
                node.get('personality', ''), 
                node.get('prompt', ''), 
                node.get('condition', ''),
                node.get('model', '')
            )
            app.logger.debug(f"Created worker for node {node_id} with model {node.get('model', '')}")

        input_data = []
        for connection in workflow['connections']:
            if str(connection['to']) == str(node_id):
                input_data.append(execute_node(connection['from']).get('output', ''))
        
        input_str = '\n'.join(input_data)
        results[str(node_id)] = workers[node_id].execute(input_str.strip())
        app.logger.debug(f"Node {node_id} execution result: {results[str(node_id)]}")
        
        socketio.emit('node_result', {'node_id': node_id, 'result': results[str(node_id)]})
        
        return results[str(node_id)]

    for node in workflow['nodes']:
        if stop_execution:
            break
        execute_node(str(node['id']))

    socketio.emit('execution_finished')
    app.logger.info("Workflow execution completed")
    return jsonify(results)

@app.route('/api/stop_execution', methods=['POST'])
def stop_execution():
    global stop_execution
    stop_execution = True
    app.logger.info("Received request to stop execution")
    return jsonify({'message': 'Execution stop requested'})

@app.route('/api/save_workflow', methods=['POST'])
def save_workflow_route():
    app.logger.info("Received request to save workflow")
    workflow = request.json
    filename = f"workflow_{workflow['name'].replace(' ', '_')}.yaml"
    save_workflow(workflow, os.path.join('workflows', filename))
    app.logger.info(f"Workflow saved as {filename}")
    return jsonify({'message': f'Workflow saved as {filename}'})

@app.route('/api/load_workflow/<filename>', methods=['GET'])
def load_workflow_route(filename):
    app.logger.info(f"Received request to load workflow: {filename}")
    try:
        workflow = load_workflow(os.path.join('workflows', filename))
        app.logger.debug(f"Loaded workflow: {workflow}")
        return jsonify(workflow)
    except FileNotFoundError:
        app.logger.error(f"Workflow file not found: {filename}")
        return jsonify({'error': 'Workflow not found'}), 404

@app.route('/api/list_workflows', methods=['GET'])
def list_workflows():
    app.logger.info("Received request to list workflows")
    workflows = [f for f in os.listdir('workflows') if f.endswith('.yaml')]
    app.logger.debug(f"Found workflows: {workflows}")
    return jsonify(workflows)

if __name__ == '__main__':
    if not os.path.exists('workflows'):
        os.makedirs('workflows')
    if not os.path.exists('static'):
        os.makedirs('static')
    socketio.run(app, debug=True)
