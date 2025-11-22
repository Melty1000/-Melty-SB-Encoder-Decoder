import json
import base64
import os

def extract_csharp_code(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        output_dir = 'extracted_csharp'
        os.makedirs(output_dir, exist_ok=True)
        
        count = 0
        
        # Recursive search for "byteCode" field
        def search_and_extract(obj, path=""):
            nonlocal count
            if isinstance(obj, dict):
                if 'byteCode' in obj and isinstance(obj['byteCode'], str):
                    try:
                        # Decode Base64
                        code_bytes = base64.b64decode(obj['byteCode'])
                        code_str = code_bytes.decode('utf-8')
                        
                        # Determine filename
                        name = obj.get('name', f'script_{count}')
                        # Sanitize filename
                        safe_name = "".join([c for c in name if c.isalpha() or c.isdigit() or c==' ' or c=='_']).rstrip()
                        filename = f"{safe_name}.cs"
                        
                        output_path = os.path.join(output_dir, filename)
                        
                        with open(output_path, 'w', encoding='utf-8') as out_f:
                            out_f.write(code_str)
                            
                        print(f"Extracted: {filename}")
                        count += 1
                    except Exception as e:
                        print(f"Failed to decode script at {path}: {e}")

                for k, v in obj.items():
                    search_and_extract(v, f"{path}.{k}")
            elif isinstance(obj, list):
                for i, v in enumerate(obj):
                    search_and_extract(v, f"{path}[{i}]")

        search_and_extract(data)
        print(f"\nTotal extracted scripts: {count}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    extract_csharp_code('decoded_export.json')
