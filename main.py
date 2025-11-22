import webview
import os
import json
import base64
import gzip
import threading
import tkinter as tk
from tkinter import filedialog

class Api:
    def __init__(self):
        self.window = None

    def open_file_dialog(self):
        root = tk.Tk()
        root.withdraw()
        path = filedialog.askopenfilename(filetypes=[("Text Files", "*.txt"), ("All Files", "*.*")])
        root.destroy()
        if path:
            with open(path, 'r', encoding='utf-8') as f:
                return f.read().strip()
        return None

    def pick_file(self):
        root = tk.Tk()
        root.withdraw()
        path = filedialog.askopenfilename(filetypes=[("JSON Files", "*.json"), ("All Files", "*.*")])
        root.destroy()
        return path

    def pick_folder(self):
        root = tk.Tk()
        root.withdraw()
        path = filedialog.askdirectory()
        root.destroy()
        return path

    def decode_export(self, raw_string):
        try:
            if not raw_string: raise ValueError("Empty input")
            
            # Base64 Decode
            try: compressed = base64.b64decode(raw_string)
            except: raise ValueError("Invalid Base64 string")

            # Skip Header
            if compressed.startswith(b'SBAE'): compressed = compressed[4:]

            # Gzip Decompress
            try: json_bytes = gzip.decompress(compressed)
            except: raise ValueError("Invalid Gzip data")

            data = json.loads(json_bytes)
            
            # Extract Scripts
            scripts = {}
            self._extract_recursive(data, scripts)
            
            return {"json": data, "scripts": scripts}
        except Exception as e:
            return {"error": str(e)}

    def _extract_recursive(self, obj, scripts, count=0):
        if isinstance(obj, dict):
            if 'byteCode' in obj and isinstance(obj['byteCode'], str):
                try:
                    code = base64.b64decode(obj['byteCode']).decode('utf-8')
                    name = obj.get('name', f'script_{len(scripts)}')
                    safe_name = "".join([c for c in name if c.isalpha() or c.isdigit() or c in ' _-']).strip()
                    fname = f"{safe_name}.cs"
                    if fname in scripts: fname = f"{safe_name}_{len(scripts)}.cs"
                    scripts[fname] = code
                except: pass
            for v in obj.values(): self._extract_recursive(v, scripts)
        elif isinstance(obj, list):
            for v in obj: self._extract_recursive(v, scripts)

    def save_files(self, scripts):
        root = tk.Tk()
        root.withdraw()
        d = filedialog.askdirectory()
        root.destroy()
        if d:
            count = 0
            for fname, code in scripts.items():
                try:
                    with open(os.path.join(d, fname), 'w', encoding='utf-8') as f:
                        f.write(code)
                    count += 1
                except: pass
            return count
        return 0

    def encode_export(self, json_path, folder_path):
        try:
            if not os.path.exists(json_path): raise ValueError("JSON file not found")
            if not os.path.exists(folder_path): raise ValueError("Scripts folder not found")

            with open(json_path, 'r', encoding='utf-8') as f: data = json.load(f)
            
            count = self._inject_recursive(data, folder_path)
            
            json_str = json.dumps(data)
            compressed = gzip.compress(json_str.encode('utf-8'))
            final_bytes = b'SBAE' + compressed
            encoded_str = base64.b64encode(final_bytes).decode('utf-8')
            
            return {"data": encoded_str, "count": count}
        except Exception as e:
            return {"error": str(e)}

    def _inject_recursive(self, obj, folder, count=0):
        if isinstance(obj, dict):
            if 'byteCode' in obj and isinstance(obj['byteCode'], str):
                val = obj['byteCode']
                if val.endswith('.cs'):
                    file_path = os.path.join(folder, val)
                    if os.path.exists(file_path):
                        with open(file_path, 'r', encoding='utf-8') as f:
                            b64_code = base64.b64encode(f.read().encode('utf-8')).decode('utf-8')
                        obj['byteCode'] = b64_code
                        count += 1
            for v in obj.values(): count = self._inject_recursive(v, folder, count)
        elif isinstance(obj, list):
            for v in obj: count = self._inject_recursive(v, folder, count)
        return count

    def copy_text(self, text):
        root = tk.Tk()
        root.withdraw()
        root.clipboard_clear()
        root.clipboard_append(text)
        root.update() # Keep clipboard
        root.destroy()

    def open_url(self, url):
        import webbrowser
        webbrowser.open(url)

if __name__ == '__main__':
    api = Api()
    
    # Get absolute path to web folder
    base_dir = os.path.dirname(os.path.abspath(__file__))
    web_dir = os.path.join(base_dir, 'web')
    index_path = os.path.join(web_dir, 'index.html')

    window = webview.create_window(
        'Streamer.bot Export Tool', 
        url=index_path, 
        js_api=api, 
        width=1200, 
        height=850,
        background_color='#121212'
    )
    api.window = window
    webview.start(debug=True)
