import shutil
import os

def make_structured_zip():
    base_dir = r"c:\Users\HYPNO\.gemini\antigravity\scratch"
    webapp_dir = os.path.join(base_dir, "webapp")
    
    # Staging area
    staging_dir = os.path.join(base_dir, "staging")
    project_root = os.path.join(staging_dir, "StreamerBotTool")
    
    # Clean staging
    if os.path.exists(staging_dir):
        shutil.rmtree(staging_dir)
    
    # Copy webapp to staging/StreamerBotTool
    shutil.copytree(webapp_dir, project_root)
    
    # Create zip from staging directory (so the zip contains 'StreamerBotTool' folder)
    output_filename = os.path.join(base_dir, "StreamerBotTool_Clean")
    shutil.make_archive(output_filename, 'zip', staging_dir)
    
    # Cleanup
    shutil.rmtree(staging_dir)
    
    print(f"Created: {output_filename}.zip")

if __name__ == "__main__":
    make_structured_zip()
