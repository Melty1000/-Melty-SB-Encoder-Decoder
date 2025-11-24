import sys
import os
import json
import base64
import gzip

# Embedded Api class logic from main.py, stripped of GUI dependencies
class Api:
    def __init__(self):
        pass

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
                    else:
                        print(f"Warning: File not found: {file_path}")
            for v in obj.values(): count = self._inject_recursive(v, folder, count)
        elif isinstance(obj, list):
            for v in obj: count = self._inject_recursive(v, folder, count)
        return count

def test_encoding():
    api = Api()
    
    # Paths
    base_path = r"C:\Users\HYPNO\.gemini\antigravity\scratch\Projects\Custom Points System Implementation"
    json_path = os.path.join(base_path, "export_base.json")
    
    print(f"Testing encoding with:")
    print(f"JSON: {json_path}")
    print(f"Folder: {base_path}")
    
    if not os.path.exists(json_path):
        print("Error: JSON file not found!")
        return
        
    if not os.path.exists(base_path):
        print("Error: Base folder not found!")
        return

    # Run encoding
    result = api.encode_export(json_path, base_path)
    
    if "error" in result:
        print(f"Encoding failed: {result['error']}")
    else:
        print(f"Encoding successful. Count: {result['count']}")
        encoded_str = result['data']
        print(f"Encoded string length: {len(encoded_str)}")
        
        # Try to decode it back to verify round-trip
        print("\nAttempting to decode back...")
        decode_result = api.decode_export(encoded_str)
        
        if "error" in decode_result:
            print(f"Decoding failed: {decode_result['error']}")
        else:
            print("Decoding successful!")
            decoded_json = decode_result['json']
            scripts = decode_result['scripts']
            print(f"Extracted {len(scripts)} scripts.")
            
            # Check for new structure
            data_obj = decoded_json.get('data', {})
            actions = data_obj.get('actions', [])
            
            if not actions:
                # Fallback to old structure check just in case
                actions = decoded_json.get('actions', [])

            if actions:
                first_action = actions[0]
                subactions = first_action.get('subactions', [])
                if subactions:
                    bytecode = subactions[0].get('byteCode', '')
                    print(f"First action byteCode start: {bytecode[:50]}...")
                    if len(bytecode) < 100 and "/" in bytecode:
                         print("WARNING: byteCode looks like a path, not base64 content!")
                    else:
                         print("byteCode looks like encoded content (good).")
            else:
                print("WARNING: No actions found in decoded JSON!")

if __name__ == "__main__":
    test_encoding()
