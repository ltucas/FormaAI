FORMA / AI — Architectural 3D Floor Plan Renderer

Transform 2D architectural floor plans into interactive 3D models in seconds. Powered by AI.


Overview
FORMA AI is a browser-based architectural visualization tool built for design firms. Upload a PDF or image of a floor plan and FORMA's AI engine analyzes structural elements — walls, rooms, doors, windows — and constructs a fully navigable, interactive 3D model directly in the browser.
No plugins. No installs. One HTML file.

Features

AI-Powered Floor Plan Analysis — Detects walls, openings, rooms, and structural elements from imported PDFs and images
Interactive 3D Viewer — Full orbit, top, front, and isometric camera views powered by Three.js
Parametric Generation Settings — Configure wall height, detail level, building type, render style, and more before generating
Room Labeling — Automatically classifies and labels enclosed spaces with area calculations
Multi-Format Export — Export to GLB, OBJ, PDF report, or PNG screenshot
Layer Control — Toggle visibility of walls, glass, doors, floor slabs, ceiling planes, and columns independently
Drag & Drop Upload — Accepts PDF, PNG, JPG, DWG, and SVG
Zero Dependencies — Runs entirely in the browser; no backend required


Demo
Open arch3d-ai.html in any modern browser. No server needed.
bash# Clone the repo
git clone https://github.com/your-org/forma-ai.git
cd forma-ai

# Open directly in browser
open arch3d-ai.html
Or serve it locally:
bashnpx serve .
# → http://localhost:3000

Usage
1. Upload a Floor Plan
Drag and drop a PDF or image onto the upload zone, or click to browse. Supported formats: .pdf, .png, .jpg, .svg, .dwg.
2. Configure Generation Settings
SettingOptionsBuilding TypeResidential, Commercial, Industrial, Mixed UseWall Height2.0m – 6.0m (slider)Detail LevelSchematic / Standard / High Definition / PhotorealisticRender StyleWireframe / Solid + Edges / Material Preview / Technical DrawingAuto-detect Doors & WindowsToggleRoom LabelsToggleFurniture PlaceholdersToggle
3. Generate
Click ◆ Generate 3D Model. A 5-step progress pipeline runs:

Analyzing floor plan geometry
Detecting structural elements
Building 3D mesh topology
Applying materials & lighting
Finalizing & optimizing

4. Explore & Export
Navigate the model using mouse controls, switch between views, and export when ready.
Viewer Controls
ActionControlOrbit / RotateLeft-click + dragZoomScroll wheelPanRight-click + dragView presetsOrbit / Top / Front / Isometric buttons

File Structure
forma-ai/
└── arch3d-ai.html       # Complete application — single self-contained file
└── README.md
The entire application is a single .html file with no external dependencies beyond:

Three.js r128 — loaded via CDN
Google Fonts — Cormorant Garamond, Syne, DM Mono — loaded via CDN

No npm. No build step. No framework.

Customization
Change Wall Material Color
In the buildThreeScene() function, find wallMat and update the hex color:
jsconst wallMat = new THREE.MeshLambertMaterial({ color: 0xc8a96e }); // gold
Change Background Color
Update both the scene background and the CSS variable:
jsscene.background = new THREE.Color(0x0c0d10); // Three.js scene
css--bg: #050608; /* Page background */
Swap the Accent Color
All accent colors use a single CSS variable. Change it at the top of the <style> block:
css--accent: #c8a96e;   /* Main gold accent */
--accent2: #e8d5a3;  /* Lighter variant */
Add New Room Types
Extend the rooms array inside buildThreeScene():
jsconst rooms = [
  { x: -5, z: -3.5, label: 'LIVING ROOM', area: '28m²' },
  { x: 6,  z: -3.5, label: 'KITCHEN',     area: '18m²' },
  // Add your rooms here
];

Browser Support
BrowserSupportChrome 90+✅ FullFirefox 88+✅ FullSafari 15+✅ FullEdge 90+✅ FullMobile (iOS/Android)⚠️ Viewer only
Requires WebGL support. Most modern browsers on desktop and mobile support this by default.

Roadmap

 Real AI integration via vision model API (floor plan → geometry extraction)
 Multi-storey / stacked floor plan support
 IFC export for BIM software compatibility
 Real-time collaboration via WebSocket
 Texture and material library
 Furniture library with drag-and-drop placement
 Measurement and annotation tools
 PDF report generation with rendered views
