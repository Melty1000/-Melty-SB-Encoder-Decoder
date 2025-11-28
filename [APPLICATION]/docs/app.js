// State
const state = {
    extractedScripts: {}, // { "filename.cs": "content" }
    currentJsonData: null, // The full JSON object of the decoded export
    encoderJson: null,
    encoderScripts: {},
    currentScript: null,   // Currently selected script filename
    history: [],           // Array of { name, date, data }
    themeColor: '255, 170, 0' // Default orange RGB
};

// UTF-8 Safe Base64 Encoding/Decoding for emoji support
function utf8ToBase64(str) {
    const utf8Bytes = new TextEncoder().encode(str);
    const chunks = [];
    const chunkSize = 0x8000;
    for (let i = 0; i < utf8Bytes.length; i += chunkSize) {
        chunks.push(String.fromCharCode.apply(null, utf8Bytes.subarray(i, i + chunkSize)));
    }
    return btoa(chunks.join(''));
}

function base64ToUtf8(base64Str) {
    try {
        const binaryString = atob(base64Str);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return new TextDecoder().decode(bytes);
    } catch (e) {
        // Fallback to regular atob for backwards compatibility
        return atob(base64Str);
    }
}

// DOM Elements
const els = {
    navBtns: document.querySelectorAll('.nav-btn[data-target]'),
    pages: document.querySelectorAll('.page'),

    // Decoder
    decoderInput: document.getElementById('decoder-input'),
    btnDecode: document.getElementById('btn-decode'),
    btnOpenFile: document.getElementById('btn-open-file'),
    fileUploadDecoder: document.getElementById('file-upload-decoder'),
    decoderOutputArea: document.getElementById('decoder-output-area'),
    scriptList: document.getElementById('script-list'),

    // Editor
    btnReEncode: document.getElementById('btn-re-encode'),
    scriptSearch: document.getElementById('script-search'),
    tabContents: document.querySelectorAll('.tab-content'),

    // Metadata fields
    exportName: document.getElementById('export-name'),
    exportAuthor: document.getElementById('export-author'),
    exportVersion: document.getElementById('export-version'),
    exportDescription: document.getElementById('export-description'),

    // Stats
    statsDashboard: document.getElementById('stats-dashboard'),
    statActions: document.getElementById('stat-actions'),
    statScripts: document.getElementById('stat-scripts'),
    statTriggers: document.getElementById('stat-triggers'),

    // Encoder
    btnBrowseJson: document.getElementById('btn-browse-json'),
    fileUploadJson: document.getElementById('file-upload-json'),
    encoderJsonPath: document.getElementById('encoder-json-path'),
    btnBrowseScripts: document.getElementById('btn-browse-scripts'),
    fileUploadScripts: document.getElementById('file-upload-scripts'),
    encoderScriptsCount: document.getElementById('encoder-scripts-count'),
    btnEncode: document.getElementById('btn-encode'),
    encoderOutputArea: document.getElementById('encoder-output-area'),
    encoderOutput: document.getElementById('encoder-output'),

    // Extras
    toastContainer: document.getElementById('toast-container'),
    themeBtns: document.querySelectorAll('.theme-btn'),
    dropOverlay: document.getElementById('drop-overlay'),
    btnDownloadZip: document.getElementById('btn-download-zip'),
    historyList: document.getElementById('history-list'),
    historyIconBtn: document.getElementById('history-icon-btn')
};

// --- JSON Schema for Streamer.bot Export Validation ---
// Based on Help Guide rules - update this schema when Help Guide changes
const streamerBotSchema = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "Streamer.bot Export Format",
    "type": "object",
    "required": ["meta", "data", "version", "exportedFrom"],
    "properties": {
        "meta": {
            "type": "object",
            "required": ["name", "author", "version"],
            "properties": {
                "name": { "type": "string", "minLength": 1 },
                "author": { "type": "string" },
                "version": { "type": "string" }
            }
        },
        "data": {
            "type": "object",
            "properties": {
                "actions": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "required": ["id", "name"],
                        "properties": {
                            "id": {
                                "type": "string",
                                "pattern": "^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$",
                                "description": "UUID must be lowercase with hyphens"
                            },
                            "name": { "type": "string" },
                            "group": { "type": "string" },
                            "enabled": { "type": "boolean" },
                            "subActions": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "id": {
                                            "type": "string",
                                            "pattern": "^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$"
                                        },
                                        "type": {
                                            "type": "number",
                                            "description": "99999 = Execute C# Code"
                                        },
                                        "byteCode": {
                                            "type": "string",
                                            "description": "For encoder: filename.cs; For import: base64-encoded source"
                                        },
                                        "name": { "type": "string" },
                                        "parentId": {
                                            "type": ["string", "null"],
                                            "pattern": "^([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}|null)$"
                                        },
                                        "references": {
                                            "type": "array",
                                            "items": { "type": "string" }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                "commands": { "type": "array" },
                "timers": { "type": "array" }
            }
        },
        "version": {
            "type": "number",
            "minimum": 0
        },
        "exportedFrom": {
            "type": "string"
        }
    }
};

// Monaco editors - will be initialized after Monaco loads
const monacoEditors = {
    jsonEditor: null,
    csharpEditor: null
};

// --- Initialization ---
initParticles();
loadHistory();
// initTilt(); // Removed 3D effect

// Initialize Monaco Editors when Monaco is loaded
window.addEventListener('load', async () => {
    try {
        // Get containers
        const jsonContainer = document.getElementById('json-editor-container');
        const csharpContainer = document.getElementById('csharp-editor-container');

        console.log('Containers found:', jsonContainer, csharpContainer);

        // Load Monaco and define themes FIRST
        await new Promise((resolve, reject) => {
            require(['vs/editor/editor.main'], function () {
                console.log('Monaco loaded, defining themes...');
                try {
                    EditorManager.defineCustomThemes();
                    console.log('Themes defined successfully');

                    // Register CPH autocomplete for C# editor
                    EditorManager.registerCPHAutocomplete();
                    console.log('CPH autocomplete registered');

                    resolve();
                } catch (err) {
                    console.error('Error defining themes:', err);
                    reject(err);
                }
            });
        });

        // NOW initialize editors with custom themes
        console.log('Creating JSON editor...');
        monacoEditors.jsonEditor = await EditorManager.initializeEditor(
            jsonContainer,
            'json',
            'streamerbot-orange',
            { readOnly: false }
        );
        console.log('JSON editor created:', monacoEditors.jsonEditor);

        // Configure JSON validation with our schema
        EditorManager.configureJsonValidation(monacoEditors.jsonEditor, streamerBotSchema);

        // Initialize C# editor with orange theme (default)
        console.log('Creating C# editor...');
        monacoEditors.csharpEditor = await EditorManager.initializeEditor(
            csharpContainer,
            'csharp',
            'streamerbot-orange',
            { readOnly: false }
        );
        console.log('C# editor created:', monacoEditors.csharpEditor);

        // Add listener to sync Monaco C# editor changes back to state
        monacoEditors.csharpEditor.onDidChangeModelContent(() => {
            if (state.currentScript && monacoEditors.csharpEditor) {
                const code = EditorManager.getEditorValue(monacoEditors.csharpEditor);
                state.extractedScripts[state.currentScript] = code;
            }
        });

        console.log('Monaco editors initialized successfully');
    } catch (error) {
        console.error('Failed to initialize Monaco editors:', error);
        showToast('Monaco Editor failed to load. Please refresh the page.', 'error');
    }
});

// --- Navigation ---
els.navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        els.navBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const target = btn.dataset.target;
        els.pages.forEach(p => {
            p.classList.remove('active');
            if (p.id === target) p.classList.add('active');
        });
    });
});

// --- Theme Picker ---
const themeColors = {
    orange: '255, 170, 0',
    blue: '0, 170, 255',
    purple: '170, 0, 255',
    green: '0, 255, 170'
};

els.themeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        els.themeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const theme = btn.dataset.theme;
        document.body.className = ''; // Reset
        if (theme !== 'orange') document.body.classList.add(`theme-${theme}`);

        // Update particles
        if (themeColors[theme]) state.themeColor = themeColors[theme];

        // Sync Monaco editor themes
        if (monacoEditors.jsonEditor) {
            EditorManager.syncTheme(monacoEditors.jsonEditor, theme);
        }
        if (monacoEditors.csharpEditor) {
            EditorManager.syncTheme(monacoEditors.csharpEditor, theme);
        }
    });
});

// --- Drag & Drop ---
document.body.addEventListener('dragover', (e) => {
    e.preventDefault();
    els.dropOverlay.classList.add('active');
});

document.body.addEventListener('dragleave', (e) => {
    if (e.relatedTarget === null) els.dropOverlay.classList.remove('active');
});

document.body.addEventListener('drop', (e) => {
    e.preventDefault();
    els.dropOverlay.classList.remove('active');

    const file = e.dataTransfer.files[0];
    if (!file) return;

    if (file.name.endsWith('.txt')) {
        // Assume export string
        const reader = new FileReader();
        reader.onload = (ev) => {
            els.decoderInput.value = ev.target.result;
            els.btnDecode.click();
        };
        reader.readAsText(file);
    } else if (file.name.endsWith('.json')) {
        // Assume encoder template
        // Switch to Encoder tab
        document.querySelector('[data-target="encoder"]').click();
        // Load it
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                state.encoderJson = JSON.parse(ev.target.result);
                els.encoderJsonPath.value = file.name;
                showToast(`Loaded Template: ${file.name}`, 'success');
            } catch (e) { showToast('Invalid JSON', 'error'); }
        };
        reader.readAsText(file);
    } else if (file.name.endsWith('.cs')) {
        showToast('To load scripts, please use the Encoder "Browse" button or drop a .txt export.', 'info');
    }
});

// --- Decoder Logic ---
if (els.btnOpenFile) {
    els.btnOpenFile.addEventListener('click', () => els.fileUploadDecoder.click());
}

if (els.fileUploadDecoder) {
    els.fileUploadDecoder.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            els.decoderInput.value = ev.target.result;
            showToast(`Loaded: ${file.name}`, 'success');
        };
        reader.readAsText(file);
    });
}

// Helper function to extract proper metadata name from export data
function getExportName(data) {
    const root = data.data || data;

    // Try to get name from various possible locations
    let name = data.meta?.name || data.name || root.name || 'Untitled Export';

    // If it's a single action export, use the action name
    if (root.actions && root.actions.length === 1) {
        name = root.actions[0].name || name;
    }

    return name;
}

if (els.btnDecode) {
    els.btnDecode.addEventListener('click', () => {
    const raw = els.decoderInput.value.trim();
    if (!raw) return showToast('Error: Empty input', 'error');

    try {
        const compressed = atob(raw);
        let gzipData = compressed;
        if (compressed.startsWith('SBAE')) gzipData = compressed.substring(4);

        const charData = gzipData.split('').map(x => x.charCodeAt(0));
        const binData = new Uint8Array(charData);
        const jsonStr = pako.ungzip(binData, { to: 'string' });
        const data = JSON.parse(jsonStr);

        onDecodeSuccess(data);
        triggerConfetti();
        addToHistory(getExportName(data), raw);

    } catch (e) {
        console.error(e);
        showToast(`Decode Error: ${e.message}`, 'error');
    }
    });
}

function onDecodeSuccess(data) {
    state.currentJsonData = data;
    els.decoderOutputArea.classList.remove('hidden');
    els.statsDashboard.classList.remove('hidden');

    // Populate Monaco JSON editor
    if (monacoEditors.jsonEditor) {
        const formattedJson = JSON.stringify(data, null, 2);
        EditorManager.setEditorValue(monacoEditors.jsonEditor, formattedJson);
    }

    // Extract Scripts
    state.extractedScripts = {};
    extractScriptsRecursive(data);

    // Populate Monaco C# editor with first script
    if (monacoEditors.csharpEditor && Object.keys(state.extractedScripts).length > 0) {
        const firstScript = Object.values(state.extractedScripts)[0];
        EditorManager.setEditorValue(monacoEditors.csharpEditor, firstScript);
        state.currentScript = Object.keys(state.extractedScripts)[0];
    }

    // Force Monaco to recalculate dimensions now that containers are visible
    setTimeout(() => {
        if (monacoEditors.jsonEditor) monacoEditors.jsonEditor.layout();
        if (monacoEditors.csharpEditor) monacoEditors.csharpEditor.layout();
    }, 100);

    updateScriptList();
    updateStats(data);
    updateMetadata(data);

    triggerConfetti();
    showToast(`Success! Found ${Object.keys(state.extractedScripts).length} scripts.`, 'success');
}

function extractScriptsRecursive(obj, count = 0) {
    if (typeof obj === 'object' && obj !== null) {
        if (obj.byteCode && typeof obj.byteCode === 'string') {
            try {
                const code = base64ToUtf8(obj.byteCode);
                let name = obj.name || `script_${count}`;
                const safeName = name.replace(/[^a-zA-Z0-9 _-]/g, '').trim() + '.cs';
                let finalName = safeName;
                let i = 1;
                while (state.extractedScripts[finalName]) {
                    finalName = safeName.replace('.cs', `_${i}.cs`);
                    i++;
                }
                state.extractedScripts[finalName] = code;
                count++;
            } catch (e) { }
        }
        for (const key in obj) extractScriptsRecursive(obj[key], count);
    }
}

function updateStats(data) {
    let actions = 0;
    let triggers = 0;

    // Simple traversal to count
    function countRecursive(obj) {
        if (typeof obj === 'object' && obj !== null) {
            if (obj.actions) actions += obj.actions.length; // Root level
            if (obj.triggers) triggers += obj.triggers.length;
            for (const key in obj) countRecursive(obj[key]);
        }
    }

    // Handle both root-level and nested 'data' structures
    const root = data.data || data;

    // If root is action
    if (root.actions) actions = root.actions.length;
    else if (root.id && root.name) actions = 1; // Single action export

    // Triggers are usually inside actions
    if (root.actions) {
        root.actions.forEach(a => {
            if (a.triggers) triggers += a.triggers.length;
        });
    }

    els.statActions.textContent = actions;
    els.statScripts.textContent = Object.keys(state.extractedScripts).length;
    els.statTriggers.textContent = triggers;

    // New Stats
    let commands = 0;
    let timedActions = 0;
    let queues = 0;
    let subActionsCount = 0;

    if (root.commands) commands = root.commands.length;
    if (root.timedActions) timedActions = root.timedActions.length;
    if (root.actionQueues) queues = root.actionQueues.length;

    // Count Sub-Actions (Recursive)
    if (root.actions) {
        root.actions.forEach(a => {
            if (a.subActions) subActionsCount += a.subActions.length;
            const countNested = (subs) => {
                if (!subs) return;
                subs.forEach(s => {
                    if (s.subActions) {
                        subActionsCount += s.subActions.length;
                        countNested(s.subActions);
                    }
                });
            };
            if (a.subActions) countNested(a.subActions);
        });
    }

    // Count Groups, WebSocket Servers/Clients
    let groups = 0;
    let wsServers = 0;
    let wsClients = 0;

    if (root.groups) groups = root.groups.length;
    if (root.webSocketServers) wsServers = root.webSocketServers.length;
    if (root.webSocketClients) wsClients = root.webSocketClients.length;

    // Check actions for group field
    if (root.actions) {
        const groupSet = new Set();
        root.actions.forEach(a => {
            if (a.group) groupSet.add(a.group);
        });
        groups = Math.max(groups, groupSet.size);
    }

    // Update DOM
    const elCommands = document.getElementById('stat-commands');
    const elTimed = document.getElementById('stat-timed-actions');
    const elSubActions = document.getElementById('stat-subactions');
    const elQueues = document.getElementById('stat-queues');
    const elGroups = document.getElementById('stat-groups');
    const elWsServers = document.getElementById('stat-ws-servers');
    const elWsClients = document.getElementById('stat-ws-clients');

    if (elCommands) elCommands.textContent = commands;
    if (elTimed) elTimed.textContent = timedActions;
    if (elSubActions) elSubActions.textContent = subActionsCount;
    if (elQueues) elQueues.textContent = queues;
    if (elGroups) elGroups.textContent = groups;
    if (elWsServers) elWsServers.textContent = wsServers;
    if (elWsClients) elWsClients.textContent = wsClients;
}

function updateMetadata(data) {
    // Extract metadata from various possible locations in the export structure
    const root = data.data || data;

    // Try to get name from various possible locations
    let name = data.name || root.name || 'Untitled Export';
    if (root.actions && root.actions.length === 1) {
        name = root.actions[0].name || name;
    }

    // Author and version might be in meta or root level
    // IMPORTANT: Check meta.version FIRST because data.version is the export format version (23), not the user version (1.0.0)
    const author = data.meta?.author || data.author || root.author || 'Unknown';
    const version = data.meta?.version || root.version || '1.0';
    const description = data.meta?.description || data.description || root.description || 'No description provided';

    // Populate the fields
    els.exportName.value = name;
    els.exportAuthor.value = author;
    els.exportVersion.value = version;
    els.exportDescription.value = description;
}

function updateScriptList() {
    const term = els.scriptSearch.value.toLowerCase();
    const scripts = Object.keys(state.extractedScripts);

    els.scriptList.innerHTML = '';

    if (scripts.length === 0) {
        if (monacoEditors.csharpEditor) {
            EditorManager.setEditorValue(monacoEditors.csharpEditor, "// No scripts found");
        }
        return;
    }

    // Add JSON Data entry at the top with export name
    const exportName = state.currentJsonData ? getExportName(state.currentJsonData) : 'export';
    const jsonFileName = `${exportName}.json`;
    const searchTerm = term.toLowerCase();

    if (jsonFileName.toLowerCase().includes(searchTerm) || 'json data'.includes(searchTerm)) {
        const jsonLi = document.createElement('li');
        jsonLi.textContent = jsonFileName;
        jsonLi.dataset.type = 'json';
        jsonLi.style.animationDelay = '0s';
        jsonLi.onclick = () => selectFile('json', jsonLi);
        els.scriptList.appendChild(jsonLi);
    }

    // Add C# scripts
    scripts.forEach((fname, index) => {
        if (fname.toLowerCase().includes(term)) {
            const li = document.createElement('li');
            li.textContent = fname;
            li.dataset.type = 'csharp';
            li.dataset.filename = fname;
            li.style.animationDelay = `${(index + 1) * 0.05}s`;
            li.onclick = () => selectFile(fname, li);
            els.scriptList.appendChild(li);
            if (index === 0) {
                li.click();
            }
        }
    });
}

function selectFile(fileIdentifier, liElement) {
    // Remove selection from all items
    document.querySelectorAll('#script-list li').forEach(l => l.classList.remove('selected'));
    if (liElement) liElement.classList.add('selected');

    if (fileIdentifier === 'json') {
        // Switch to JSON Data tab
        els.tabContents.forEach(c => c.classList.remove('active'));
        document.getElementById('tab-json').classList.add('active');

        // Layout JSON editor
        setTimeout(() => {
            if (monacoEditors.jsonEditor) monacoEditors.jsonEditor.layout();
        }, 50);

        state.currentScript = null;
    } else {
        // It's a C# script - switch to C# Scripts tab
        els.tabContents.forEach(c => c.classList.remove('active'));
        document.getElementById('tab-scripts').classList.add('active');

        // Update C# editor with selected script
        state.currentScript = fileIdentifier;
        const code = state.extractedScripts[fileIdentifier];
        if (monacoEditors.csharpEditor) {
            EditorManager.setEditorValue(monacoEditors.csharpEditor, code);
        }

        // Layout C# editor
        setTimeout(() => {
            if (monacoEditors.csharpEditor) monacoEditors.csharpEditor.layout();
        }, 50);
    }
}

// Backward compatibility - keep old selectScript name
function selectScript(fname, liElement) {
    selectFile(fname, liElement);
}

// Shared helper function to inject C# scripts back into byteCode
function injectExtractedScripts(data) {
    let scriptIndex = 0;

    function injectRecursive(obj) {
        if (typeof obj === 'object' && obj !== null) {
            if (obj.byteCode && typeof obj.byteCode === 'string') {
                let name = obj.name || `script_${scriptIndex}`;
                const safeName = name.replace(/[^a-zA-Z0-9 _-]/g, '').trim() + '.cs';

                // Find matching script in extracted scripts
                for (const [fname, content] of Object.entries(state.extractedScripts)) {
                    const baseName = safeName.replace('.cs', '');
                    const fnameBase = fname.replace('.cs', '');

                    if (fname === safeName || fnameBase === baseName) {
                        obj.byteCode = utf8ToBase64(content);
                    }
                }
                scriptIndex++;
            }
            for (const key in obj) injectRecursive(obj[key]);
        }
    }

    injectRecursive(data);
}

// Re-Encode Logic (Merged workflow: validate + update stats + encode)
if (els.btnReEncode) {
    els.btnReEncode.addEventListener('click', () => {
    if (!monacoEditors.jsonEditor) {
        return showToast('Editor not initialized', 'error');
    }

    try {
        // Step 1: Get JSON from Monaco editor
        const jsonContent = EditorManager.getEditorValue(monacoEditors.jsonEditor);

        // Step 2: Parse and validate
        let editedData;
        try {
            editedData = JSON.parse(jsonContent);
        } catch (parseError) {
            return showToast(`Invalid JSON: ${parseError.message}`, 'error');
        }

        // Step 3: Update state with edited JSON
        state.currentJsonData = editedData;

        // Step 4: Re-run stats and metadata with edited data
        updateStats(editedData);
        updateMetadata(editedData);

        // Step 5: Inject C# scripts back into byteCode for encoding
        const data = JSON.parse(JSON.stringify(editedData)); // Deep copy
        injectExtractedScripts(data);

        // Step 6: Encode to import string
        const jsonStr = JSON.stringify(data);
        const compressed = pako.gzip(jsonStr);
        const header = new TextEncoder().encode('SBAE');
        const finalData = new Uint8Array(header.length + compressed.length);
        finalData.set(header);
        finalData.set(compressed, header.length);

        // Use chunked binary string creation for better performance
        const chunks = [];
        for (let i = 0; i < finalData.byteLength; i++) {
            chunks.push(String.fromCharCode(finalData[i]));
        }
        const binary = chunks.join('');
        const result = btoa(binary);

        // Step 7: Show result in input
        els.decoderInput.value = result;

        // Step 8: Update Monaco editor with final encoded data (with scripts injected)
        if (monacoEditors.jsonEditor) {
            const formattedJson = JSON.stringify(editedData, null, 2);
            EditorManager.setEditorValue(monacoEditors.jsonEditor, formattedJson);
        }

        showToast('Re-Encoded! Stats updated, import string generated.', 'success');
        triggerConfetti();

    } catch (e) {
        showToast('Re-Encode Failed: ' + e.message, 'error');
    }
    });
}

// JSZip Download
// Download ZIP functionality (shared for both tabs)
const downloadZipHandler = () => {
    if (Object.keys(state.extractedScripts).length === 0) return;

    const zip = new JSZip();

    // Get export name for folder and file naming
    const exportName = state.currentJsonData ? getExportName(state.currentJsonData) : 'export';

    // Sanitize folder name (remove invalid characters)
    const sanitizedName = exportName.replace(/[<>:"/\\|?*]/g, '_').trim();

    // Create folder in ZIP
    const folder = zip.folder(sanitizedName);

    // Add all C# scripts to the folder
    for (const [fname, content] of Object.entries(state.extractedScripts)) {
        folder.file(fname, content);
    }

    // Add JSON file to the folder with export name
    if (state.currentJsonData) {
        const jsonContent = JSON.stringify(state.currentJsonData, null, 2);
        folder.file(`${sanitizedName}.json`, jsonContent);

        // Add Streamer.bot import file (.sb)
        folder.file(`${sanitizedName}.sb`, jsonContent);
    }

    zip.generateAsync({ type: "blob" }).then(function (content) {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(content);
        a.download = `${sanitizedName}.zip`;
        a.click();
        showToast(`ZIP Downloaded with Streamer.bot import file: ${sanitizedName}.zip`, 'success');
    });
};

if (els.btnDownloadZip) {
    els.btnDownloadZip.addEventListener('click', downloadZipHandler);
}

// Search box updates the single shared list
if (els.scriptSearch) {
    els.scriptSearch.addEventListener('input', updateScriptList);
}

// --- History ---
function addToHistory(name, data) {
    state.history.unshift({ name, date: new Date().toLocaleTimeString(), data });
    if (state.history.length > 5) state.history.pop();
    localStorage.setItem('sb_tool_history', JSON.stringify(state.history));
    loadHistory();
}

function loadHistory() {
    const stored = localStorage.getItem('sb_tool_history');
    if (stored) state.history = JSON.parse(stored);

    els.historyList.innerHTML = '';
    state.history.forEach(item => {
        const li = document.createElement('li');
        li.textContent = `${item.name} (${item.date})`;
        li.onclick = () => {
            els.decoderInput.value = item.data;
            els.btnDecode.click();
        };
        els.historyList.appendChild(li);
    });
}

// --- Visuals ---
function triggerConfetti() {
    confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ffaa00', '#ffffff', '#444444']
    });
}

function initTilt() {
    // VanillaTilt removed
}

function initParticles() {
    const canvas = document.getElementById('particles-canvas');
    const ctx = canvas.getContext('2d');
    let width, height;
    let particles = [];

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.vx = (Math.random() - 0.5) * 0.5;
            this.vy = (Math.random() - 0.5) * 0.5;
            this.size = Math.random() * 2;
        }
        update() {
            this.x += this.vx;
            this.y += this.vy;
            if (this.x < 0) this.x = width;
            if (this.x > width) this.x = 0;
            if (this.y < 0) this.y = height;
            if (this.y > height) this.y = 0;
        }
        draw() {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    for (let i = 0; i < 50; i++) particles.push(new Particle());

    // Mouse interaction
    let mouse = { x: null, y: null };
    window.addEventListener('mousemove', e => {
        mouse.x = e.x;
        mouse.y = e.y;
    });

    function animate() {
        ctx.clearRect(0, 0, width, height);

        particles.forEach(p => {
            p.update();
            p.draw();

            // Connect
            particles.forEach(p2 => {
                const dx = p.x - p2.x;
                const dy = p.y - p2.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 100) {
                    ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 - dist / 1000})`;
                    ctx.lineWidth = 0.5;
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                }
            });

            // Mouse connect
            if (mouse.x) {
                const dx = p.x - mouse.x;
                const dy = p.y - mouse.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 150) {
                    ctx.strokeStyle = `rgba(${state.themeColor}, ${0.2 - dist / 750})`;
                    ctx.lineWidth = 0.5;
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(mouse.x, mouse.y);
                    ctx.stroke();
                }
            }
        });
        requestAnimationFrame(animate);
    }
    animate();
}

// --- Utilities ---
// --- Utilities ---
function showToast(msg, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icon = document.createElement('i');
    icon.className = `fa-solid ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-circle-exclamation' : 'fa-info-circle'}`;

    const text = document.createElement('span');
    text.textContent = msg;

    toast.appendChild(icon);
    toast.appendChild(text);

    els.toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Copy Buttons
document.getElementById('btn-copy-code').onclick = () => {
    if (!monacoEditors.csharpEditor) return;
    const code = EditorManager.getEditorValue(monacoEditors.csharpEditor);
    navigator.clipboard.writeText(code);
    showToast('Code copied', 'success');
};
// Copy JSON button - get from Monaco editor
document.getElementById('btn-copy-json').onclick = () => {
    if (!monacoEditors.jsonEditor) return;

    const jsonContent = EditorManager.getEditorValue(monacoEditors.jsonEditor);
    if (jsonContent) {
        navigator.clipboard.writeText(jsonContent);
        showToast('JSON copied', 'success');
    }
};

// Re-Encode button in JSON tab - uses same logic as C# tab Re-Encode
document.getElementById('btn-re-encode-json').onclick = () => {
    if (!monacoEditors.jsonEditor) return showToast('Editor not initialized', 'error');

    try {
        // Step 1: Get JSON from Monaco
        const jsonContent = EditorManager.getEditorValue(monacoEditors.jsonEditor);

        // Step 2: Validate
        let editedData;
        try {
            editedData = JSON.parse(jsonContent);
        } catch (parseError) {
            return showToast(`Invalid JSON: ${parseError.message}`, 'error');
        }

        // Step 3: Update state
        state.currentJsonData = editedData;

        // Step 4: Re-run stats and metadata
        updateStats(editedData);
        updateMetadata(editedData);

        // Step 5: Inject C# scripts and encode
        const data = JSON.parse(JSON.stringify(editedData));
        injectExtractedScripts(data); // Injects base64 scripts with UTF-8 support

        const jsonStr = JSON.stringify(data);
        const compressed = pako.gzip(jsonStr);
        const header = new TextEncoder().encode('SBAE');
        const finalData = new Uint8Array(header.length + compressed.length);
        finalData.set(header);
        finalData.set(compressed, header.length);

        // Chunked binary string (performance optimization)
        const chunks = [];
        for (let i = 0; i < finalData.byteLength; i++) {
            chunks.push(String.fromCharCode(finalData[i]));
        }
        const binary = chunks.join('');
        const result = btoa(binary);

        // Step 7: Display result
        els.decoderInput.value = result;

        showToast('Re-Encoded! Stats updated, import string generated.', 'success');
    } catch (e) {
        showToast('Re-Encode Failed: ' + e.message, 'error');
    }
};
document.getElementById('btn-copy-encoded').onclick = () => {
    navigator.clipboard.writeText(els.encoderOutput.value)
        .then(() => showToast('Import string copied', 'success'))
        .catch(() => showToast('Failed to copy', 'error'));
};

// Encoder Logic (Simplified for brevity, same as before but with Toast)
els.btnBrowseJson.addEventListener('click', () => els.fileUploadJson.click());
els.fileUploadJson.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        try {
            state.encoderJson = JSON.parse(ev.target.result);
            els.encoderJsonPath.value = file.name;
            showToast(`Loaded Template: ${file.name}`, 'success');
        } catch (e) { showToast('Invalid JSON', 'error'); }
    };
    reader.readAsText(file);
});
els.btnBrowseScripts.addEventListener('click', () => els.fileUploadScripts.click());
els.fileUploadScripts.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    state.encoderScripts = {};
    let loaded = 0;
    files.forEach(f => {
        const reader = new FileReader();
        reader.onload = (ev) => {
            state.encoderScripts[f.name] = ev.target.result;
            loaded++;
            if (loaded === files.length) {
                els.encoderScriptsCount.value = `${loaded} files loaded`;
                showToast(`Loaded ${loaded} scripts`, 'success');
            }
        };
        reader.readAsText(f);
    });
});

els.btnEncode.addEventListener('click', () => {
    if (!state.encoderJson) return showToast('Select Base JSON first', 'error');
    try {
        const jsonStr = JSON.stringify(state.encoderJson); // Use the loaded JSON object, not string
        // But wait, state.encoderJson is an object.
        // The previous code used state.encoderTemplate? No, state.encoderJson.
        // Let's check how state.encoderJson is populated.
        // Line 609: state.encoderJson = JSON.parse(ev.target.result);

        // We need to clone it to avoid modifying the original state if we want to be safe, 
        // but modifying it in place is fine for this tool.
        const obj = state.encoderJson;

        // Validation: Check for missing scripts
        const missingScripts = [];
        function checkScriptsRecursive(obj) {
            if (typeof obj === 'object' && obj !== null) {
                if (obj.byteCode && typeof obj.byteCode === 'string') {
                    const val = obj.byteCode;
                    if (val.endsWith('.cs') && !state.encoderScripts[val]) {
                        missingScripts.push(val);
                    }
                }
                for (const key in obj) checkScriptsRecursive(obj[key]);
            }
        }
        checkScriptsRecursive(obj);

        if (missingScripts.length > 0) {
            showToast(`Missing scripts: ${missingScripts.join(', ')}`, 'error');
            return;
        }

        const count = injectScriptsRecursive(obj);
        const compressed = pako.gzip(JSON.stringify(obj));
        const header = new TextEncoder().encode('SBAE');
        const finalData = new Uint8Array(header.length + compressed.length);
        finalData.set(header);
        finalData.set(compressed, header.length);

        const chunks = [];
        const chunkSize = 0x8000;
        for (let i = 0; i < finalData.length; i += chunkSize) {
            chunks.push(String.fromCharCode.apply(null, finalData.subarray(i, i + chunkSize)));
        }
        const result = btoa(chunks.join(''));
        els.encoderOutputArea.classList.remove('hidden');
        els.encoderOutput.value = result;
        showToast(`Encoded ${count} scripts!`, 'success');
        triggerConfetti();
    } catch (e) { showToast('Encode Error: ' + e.message, 'error'); }
});
function injectScriptsRecursive(obj, count = 0) {
    if (typeof obj === 'object' && obj !== null) {
        if (obj.byteCode && typeof obj.byteCode === 'string') {
            const val = obj.byteCode;
            if (val.endsWith('.cs')) {
                if (state.encoderScripts[val]) {
                    // UTF-8 safe base64 encoding
                    const utf8Bytes = new TextEncoder().encode(state.encoderScripts[val]);
                    const chunks = [];
                    const chunkSize = 0x8000;
                    for (let i = 0; i < utf8Bytes.length; i += chunkSize) {
                        chunks.push(String.fromCharCode.apply(null, utf8Bytes.subarray(i, i + chunkSize)));
                    }
                    obj.byteCode = btoa(chunks.join(''));
                    count++;
                }
            }
        }
        for (const key in obj) count = injectScriptsRecursive(obj[key], count);
    }
    return count;
}

// Confetti
function triggerConfetti() {
    const rgb = state.themeColor.split(',').map(x => parseInt(x.trim()));
    const hex = '#' + ((1 << 24) + (rgb[0] << 16) + (rgb[1] << 8) + rgb[2]).toString(16).slice(1);

    confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: [hex, '#ffffff'],
        disableForReducedMotion: true
    });
}

// Hamburger Menu Toggle
const hamburgerBtn = document.getElementById('hamburger-btn');
const sidebar = document.querySelector('.sidebar');

if (hamburgerBtn && sidebar) {
    hamburgerBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');

        // Save state to localStorage
        const isCollapsed = sidebar.classList.contains('collapsed');
        localStorage.setItem('sidebarCollapsed', isCollapsed);
    });

    // Restore saved state on load
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState === 'true') {
        sidebar.classList.add('collapsed');
    }
}

// Brand Logo Toggle (replaces hamburger button)
const brandLogo = document.querySelector('.brand');
if (brandLogo && sidebar) {
    brandLogo.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');

        // Save state to localStorage
        const isCollapsed = sidebar.classList.contains('collapsed');
        localStorage.setItem('sidebarCollapsed', isCollapsed);
    });
}

// History Icon Button - Load Most Recent Export
const historyIconBtn = document.getElementById('history-icon-btn');

if (historyIconBtn) {
    historyIconBtn.addEventListener('click', () => {
        // Check if there's any history
        if (state.history && state.history.length > 0) {
            const mostRecent = state.history[0];

            // Load the most recent export into decoder
            els.decoderInput.value = mostRecent.data;

            // Switch to decoder tab if not already there
            const decoderTab = document.querySelector('[data-target="decoder"]');
            if (decoderTab && !decoderTab.classList.contains('active')) {
                decoderTab.click();
            }

            // Trigger decode
            els.btnDecode.click();

            showToast(`Loaded: ${mostRecent.name}`, 'success');
        } else {
            showToast('No recent exports available', 'error');
        }
    });
}

// --- Metadata Change Listeners ---
// Capture and persist metadata field changes back to the JSON data structure
function setupMetadataListeners() {
    if (!els.exportName || !els.exportAuthor || !els.exportVersion || !els.exportDescription) return;

    // Helper function to update metadata in the JSON structure
    function updateMetadataInJson(field, value) {
        if (!state.currentJsonData) return;

        // Ensure meta object exists
        if (!state.currentJsonData.meta) {
            state.currentJsonData.meta = {};
        }

        // Update both meta and root level for compatibility
        switch (field) {
            case 'name':
                state.currentJsonData.meta.name = value;
                state.currentJsonData.name = value;
                break;
            case 'author':
                state.currentJsonData.meta.author = value;
                state.currentJsonData.author = value;
                break;
            case 'version':
                state.currentJsonData.meta.version = value;
                state.currentJsonData.version = value;
                break;
            case 'description':
                state.currentJsonData.meta.description = value;
                state.currentJsonData.description = value;
                break;
        }

        // Update Monaco JSON editor with the modified data
        if (monacoEditors.jsonEditor) {
            const formattedJson = JSON.stringify(state.currentJsonData, null, 2);
            EditorManager.setEditorValue(monacoEditors.jsonEditor, formattedJson);
        }
    }

    // Add input event listeners to all metadata fields
    els.exportName.addEventListener('input', (e) => {
        updateMetadataInJson('name', e.target.value);
    });

    els.exportAuthor.addEventListener('input', (e) => {
        updateMetadataInJson('author', e.target.value);
    });

    els.exportVersion.addEventListener('input', (e) => {
        updateMetadataInJson('version', e.target.value);
    });

    els.exportDescription.addEventListener('input', (e) => {
        updateMetadataInJson('description', e.target.value);
    });
}

// Initialize metadata listeners
setupMetadataListeners();
