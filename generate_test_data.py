import base64
import gzip
import json
import os

# Dummy Data
data = {
    "name": "Test Action",
    "id": "12345",
    "actions": [
        {
            "name": "Execute C#",
            "type": "ExecuteCPH",
            "byteCode": base64.b64encode(b"using System;\npublic class CPH {\n    public bool Execute() {\n        return true;\n    }\n}").decode('utf-8')
        }
    ]
}

# Encode
json_str = json.dumps(data)
compressed = gzip.compress(json_str.encode('utf-8'))
final_bytes = b'SBAE' + compressed
encoded_str = base64.b64encode(final_bytes).decode('utf-8')

# Save
with open("test_export.txt", "w") as f:
    f.write(encoded_str)

print(f"Generated test_export.txt with content length: {len(encoded_str)}")
