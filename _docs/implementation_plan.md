# Streamer.bot Export Tool - Extreme Edition

## Goal Description
Push the boundaries of the Web App with high-end visual effects and power-user features.

## User Review Required
> [!TIP]
> **Visual Overhaul**:
> 1. **Particle Background**: Interactive constellation effect reacting to mouse movement.
> 2. **3D Tilt Cards**: Glass cards will tilt and shimmer on hover (Parallax).
> 3. **Confetti**: Explosion of colors on successful Decode/Encode.
>
> **Power Features**:
> 1. **Code Editor**: Edit extracted C# scripts directly in the browser and re-encode them.
> 2. **History**: Remember the last 5 decoded exports in LocalStorage.
> 3. **PWA, Stats, Themes, Drag & Drop**: (Previously approved).

## Proposed Changes
### 1. Visual Effects
#### [MODIFY] [index.html](file:///c:/Users/HYPNO/.gemini/antigravity/scratch/webapp/index.html)
- Add canvas for particles.
- Add `canvas-confetti` CDN.
- Add `vanilla-tilt` CDN.

#### [MODIFY] [app.js](file:///c:/Users/HYPNO/.gemini/antigravity/scratch/webapp/app.js)
- Initialize particle system.
- Initialize Tilt on `.card` elements.
- Trigger confetti on success.

### 2. Code Editor (Edit & Re-encode)
#### [MODIFY] [app.js](file:///c:/Users/HYPNO/.gemini/antigravity/scratch/webapp/app.js)
- Make the code preview editable (`contenteditable` or textarea).
- Update `state.extractedScripts` on edit.
- Add "Re-Encode" button to the Decoder tab to generate a new export from modified scripts.

### 3. History System
#### [MODIFY] [app.js](file:///c:/Users/HYPNO/.gemini/antigravity/scratch/webapp/app.js)
- Save decoded JSON to `localStorage`.
- Add "Recent" sidebar item or dropdown.

## Verification Plan
1. **Visuals**: Move mouse to see particles; hover cards to see tilt; decode to see confetti.
2. **Editor**: Decode -> Edit C# code -> Re-Encode -> Decode new string -> Verify change.
3. **History**: Reload page and check if previous export is available.
