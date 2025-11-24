import json
import gzip
import base64

# Create a mock export with two scripts that have overlapping names
data = {
    "info": {"name": "BugRepro", "version": "1.0"},
    "actions": [
        {
            "id": "action1",
            "name": "Action1",
            "triggers": [],
            "sub-actions": [
                {
                    "id": "sub1",
                    "name": "Test", # Script name "Test"
                    "byteCode": base64.b64encode(b"// Original Test Content").decode('utf-8')
                },
                {
                    "id": "sub2",
                    "name": "Test2", # Script name "Test2"
                    "byteCode": base64.b64encode(b"// Original Test2 Content").decode('utf-8')
                }
            ]
        }
    ]
}

json_str = json.dumps(data)
compressed = gzip.compress(json_str.encode('utf-8'))
header = b'SBAE'
final_data = header + compressed
encoded = base64.b64encode(final_data).decode('utf-8')

print(encoded)
