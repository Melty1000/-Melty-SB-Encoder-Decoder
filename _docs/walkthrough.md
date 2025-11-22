# Streamer.bot Export Tool (Web Edition) - Walkthrough

## Overview
The **Streamer.bot Export Tool** has been converted into a modern Web Application. It runs entirely in your browser using HTML, CSS, and JavaScript.

## How to Run
1. Navigate to the `webapp` folder:
   `c:\Users\HYPNO\.gemini\antigravity\scratch\webapp\`
2. Open **`index.html`** in your preferred web browser (Chrome, Edge, Firefox).

## Features
### 1. Decoder
Extract C# scripts from an export string.
- **Input**: Paste a string or open a text file.
- **Action**: Click **DECODE**.
- **Output**: View extracted scripts in the list. Click a script to preview code.

### 2. Encoder
Create an import string by injecting C# files into a JSON template.
- **Step 1**: Select your Base JSON template (must contain `"byteCode": "filename.cs"`).
- **Step 2**: Select the folder containing your `.cs` files.
- **Action**: Click **GENERATE**.
- **Output**: Copy the generated string to import into Streamer.bot.

### 3. Extreme Features
- **Code Editor**: Click any script in the Decoder list to edit it. Click **Re-Encode** to generate a new import string with your changes.
- **Stats Dashboard**: View counts of Actions, Triggers, and Scripts after decoding.
- **Theme Picker**: Switch between Orange, Blue, Purple, and Green themes in the sidebar.
- **History**: Quickly reload your last 5 exports from the sidebar.
- **PWA**: Install the app on your desktop (Chrome/Edge) for a native experience.

## Verification
A test file has been generated for you:
- **File**: `c:\Users\HYPNO\.gemini\antigravity\scratch\test_export.txt`
- **Instructions**:
    1. Open the Web App.
    2. Go to **Decoder**.
    3. Open `test_export.txt`.
    4. Click **DECODE**.
    5. You should see a script named `script_0.cs` (or similar) containing `public class CPH ...`.

### Automated Verification
I have verified the Decoder functionality using an automated browser test.
![Decoder Test Recording](file:///C:/Users/HYPNO/.gemini/antigravity/brain/c028587e-1452-4e46-9361-63db105fde16/webapp_decoder_test_1763781544211.webp)
*Recording of the automated test verifying the Decoder logic.*

### UI/UX Polish Verification
I have also verified the new **Premium Glass UI**, including animations and toast notifications.
![Glass UI Verification](file:///C:/Users/HYPNO/.gemini/antigravity/brain/c028587e-1452-4e46-9361-63db105fde16/verify_glass_ui_1763782462926.webp)
*Recording demonstrating the Glassmorphism design, hover effects, and toast notifications.*

### Extreme Features Verification
I have verified the **Particles, Stats, Code Editor, and Theme Picker**.
![Extreme Features Verification](file:///C:/Users/HYPNO/.gemini/antigravity/brain/c028587e-1452-4e46-9361-63db105fde16/verify_extreme_features_1763829802265.webp)
*Recording showing the Particle background, Stats Dashboard, Code Editing, Re-Encoding, and Theme Switching.*
