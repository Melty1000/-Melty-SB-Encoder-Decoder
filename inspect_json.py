import json

def find_csharp_code(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        print(f"Keys in root: {list(data.keys())}")
        
        if 'data' in data:
            print(f"Keys in data: {list(data['data'].keys())}")
            root_data = data['data']
        else:
            root_data = data

        # Deep recursive search for C# keywords
        def deep_search(obj, path=""):
            if isinstance(obj, dict):
                for k, v in obj.items():
                    deep_search(v, f"{path}.{k}")
            elif isinstance(obj, list):
                for i, v in enumerate(obj):
                    deep_search(v, f"{path}[{i}]")
            elif isinstance(obj, str):
                # Check for common C# indicators
                if "using System;" in obj or "public class" in obj or "CPH" in obj:
                    # Avoid false positives (short strings)
                    if len(obj) > 50:
                        print(f"Found potential C# code at {path} (Length: {len(obj)})")
                        print(f"Snippet: {obj[:100]}...")
                        return # Stop after finding one to avoid spamming, or remove return to find all

        deep_search(data)

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    find_csharp_code('decoded_export.json')
