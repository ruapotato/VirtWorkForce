import json
import re
import subprocess

def get_clipboard_content():
    try:
        return subprocess.check_output(['xclip', '-o', '-selection', 'clipboard']).decode('utf-8')
    except subprocess.CalledProcessError:
        print("Error: Unable to read from clipboard. Make sure xclip is installed and the clipboard contains valid JSON.")
        return None

def extract_method(content, method_name):
    pattern = rf'(^|\n)(\s*)({re.escape(method_name)}\s*\(.*?\)\s*\{{\s*\n)(.*?)(\n\2\}})'
    match = re.search(pattern, content, re.DOTALL | re.MULTILINE)
    return match

def apply_updates():
    json_content = get_clipboard_content()
    if not json_content:
        return

    try:
        updates = json.loads(json_content)
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON: {e}")
        return

    for file_update in updates['files']:
        file_path = file_update['path']

        try:
            with open(file_path, 'r') as f:
                content = f.read()
        except FileNotFoundError:
            print(f"Error: File not found: {file_path}")
            continue

        print(f"Updating file: {file_path}")
        for function in file_update['functions']:
            method_name = function["name"]
            new_method = function['code']
            
            print(f"Searching for method: {method_name}")
            method_match = extract_method(content, method_name)
            if method_match:
                start, end = method_match.span()
                indent = method_match.group(2)
                method_signature = method_match.group(3)
                new_method_indented = '\n'.join(indent + '    ' + line for line in new_method.split('\n'))
                updated_method = f"{indent}{method_signature}{new_method_indented}\n{indent}}}"
                content = content[:start] + updated_method + content[end:]
                print(f"Replaced method: {method_name}")
            else:
                print(f"Method not found, update failed: {method_name}")

        with open(file_path, 'w') as f:
            f.write(content)

        print("Updates applied successfully!")

if __name__ == "__main__":
    apply_updates()
