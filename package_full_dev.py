import shutil
import os
import glob

def make_full_dev_zip():
    base_dir = r"c:\Users\HYPNO\.gemini\antigravity\scratch"
    brain_dir = r"C:\Users\HYPNO\.gemini\antigravity\brain\c028587e-1452-4e46-9361-63db105fde16"
    
    # Staging area
    staging_dir = os.path.join(base_dir, "staging")
    project_root = os.path.join(staging_dir, "StreamerBotTool_Dev")
    
    # Clean staging
    if os.path.exists(staging_dir):
        shutil.rmtree(staging_dir)
    
    # 1. Copy Scratch Directory (Source Code)
    # Ignore build artifacts and temporary files
    shutil.copytree(base_dir, project_root, ignore=shutil.ignore_patterns(
        'build', 'dist', '__pycache__', '*.zip', 'staging', '.git', '.vs'
    ))
    
    # 2. Copy Artifacts (Docs)
    docs_dir = os.path.join(project_root, "_docs")
    os.makedirs(docs_dir, exist_ok=True)
    
    artifacts = ['task.md', 'implementation_plan.md', 'walkthrough.md']
    for art in artifacts:
        src = os.path.join(brain_dir, art)
        if os.path.exists(src):
            shutil.copy2(src, docs_dir)
            print(f"Included artifact: {art}")
            
    # 3. Create Zip
    output_filename = os.path.join(base_dir, "StreamerBotTool_FullDev")
    shutil.make_archive(output_filename, 'zip', staging_dir)
    
    # Cleanup
    shutil.rmtree(staging_dir)
    
    print(f"Created: {output_filename}.zip")

if __name__ == "__main__":
    make_full_dev_zip()
