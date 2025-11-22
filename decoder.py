import base64
import gzip
import json
import sys
import os

def decode_streamerbot_export(file_path):
    try:
        if not os.path.exists(file_path):
            print(f"Error: File '{file_path}' not found.")
            return

        with open(file_path, 'r', encoding='utf-8') as f:
            encoded_string = f.read().strip()

        if not encoded_string:
            print("Error: File is empty.")
            return

        try:
            compressed_data = base64.b64decode(encoded_string)
            print(f"Debug: First 50 bytes of decoded data: {compressed_data[:50]}")
        except base64.binascii.Error as e:
            print(f"Error: Invalid Base64 string. {e}")
            return

        # 2. Gzip Decompress
        try:
            # Check for custom header "SBAE" and skip it
            if compressed_data.startswith(b'SBAE'):
                print("Debug: Found 'SBAE' header, skipping first 4 bytes.")
                compressed_data = compressed_data[4:]
            
            json_data = gzip.decompress(compressed_data)
        except gzip.BadGzipFile as e:
            print(f"Error: Invalid Gzip data. {e}")
            return

        # 3. Parse JSON
        try:
            data = json.loads(json_data)
            print(json.dumps(data, indent=4))
            
            # Optionally save to a file
            output_file = 'decoded_export.json'
            with open(output_file, 'w', encoding='utf-8') as out_f:
                json.dump(data, out_f, indent=4)
            print(f"\nSuccessfully decoded to '{output_file}'")
            
        except json.JSONDecodeError as e:
            print(f"Error: Invalid JSON data. {e}")
            return

    except Exception as e:
        print(f"An unexpected error occurred: {e}")

if __name__ == "__main__":
    target_file = 'export.txt'
    if len(sys.argv) > 1:
        target_file = sys.argv[1]
    
    print(f"Attempting to decode '{target_file}'...")
    decode_streamerbot_export(target_file)
