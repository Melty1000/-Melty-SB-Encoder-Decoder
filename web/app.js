// Global State
let extractedScripts = {};

// Navigation
function navigate(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + pageId).classList.add('active');

    document.querySelectorAll('.nav-links li').forEach(l => l.classList.remove('active'));
    // Highlight active nav item logic (simple version)
    const navMap = { 'decoder': 0, 'encoder': 1, 'help': 2 };
    if (navMap[pageId] !== undefined) {
        document.querySelectorAll('.nav-links li')[navMap[pageId]].classList.add('active');
    }
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById('tab-' + tabId).classList.add('active');

    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
}

// --- Decoder Logic ---

async function openFile() {
    const content = await window.pywebview.api.open_file_dialog();
    if (content) {
        document.getElementById('decoder-input').value = content;
        setStatus("File loaded.");
    }
}

async function decodeExport() {
    const input = document.getElementById('decoder-input').value.trim();
    if (!input) return alert("Please enter an export string.");

    setLoading(true, "Decoding...");
    try {
        const result = await window.pywebview.api.decode_export(input);
        if (result.error) {
            alert("Error: " + result.error);
            setStatus("Decode failed.");
        } else {
            // Success
            extractedScripts = result.scripts;
            document.getElementById('json-preview').textContent = JSON.stringify(result.json, null, 4);
            renderScriptList();
            setStatus(`Success! Found ${Object.keys(extractedScripts).length} scripts.`);
            document.getElementById('btn-save-all').disabled = false;
        }
    } catch (e) {
        alert("Error: " + e);
    }
    setLoading(false);
}

function renderScriptList() {
    const list = document.getElementById('script-list');
    list.innerHTML = '';
    const filter = document.getElementById('script-search').value.toLowerCase();

    Object.keys(extractedScripts).forEach(fname => {
        if (fname.toLowerCase().includes(filter)) {
            const li = document.createElement('li');
            li.textContent = fname;
            li.onclick = () => selectScript(fname, li);
            list.appendChild(li);
        }
    });
}

function filterScripts() {
    renderScriptList();
}

function selectScript(fname, liElement) {
    document.querySelectorAll('#script-list li').forEach(l => l.classList.remove('selected'));
    liElement.classList.add('selected');
    document.getElementById('code-preview').textContent = extractedScripts[fname];
}

async function saveAllScripts() {
    if (Object.keys(extractedScripts).length === 0) return;
    const count = await window.pywebview.api.save_files(extractedScripts);
    if (count > 0) setStatus(`Saved ${count} files.`);
}

function copyCode() {
    const code = document.getElementById('code-preview').textContent;
    copyToClipboard(code);
}

function copyJson() {
    const json = document.getElementById('json-preview').textContent;
    copyToClipboard(json);
}

// --- Encoder Logic ---

async function browseJson() {
    const path = await window.pywebview.api.pick_file();
    if (path) document.getElementById('enc-json-path').value = path;
}

async function browseFolder() {
    const path = await window.pywebview.api.pick_folder();
    if (path) document.getElementById('enc-folder-path').value = path;
}

async function encodeExport() {
    const jsonPath = document.getElementById('enc-json-path').value;
    const folderPath = document.getElementById('enc-folder-path').value;

    if (!jsonPath || !folderPath) return alert("Please select both a JSON file and a Scripts folder.");

    setLoading(true, "Encoding...");
    const result = await window.pywebview.api.encode_export(jsonPath, folderPath);

    if (result.error) {
        alert("Error: " + result.error);
        setStatus("Encoding failed.");
    } else {
        document.getElementById('encoder-output').value = result.data;
        setStatus(`Encoded successfully! Injected ${result.count} scripts.`);
    }
    setLoading(false);
}

function copyEncoderOutput() {
    const text = document.getElementById('encoder-output').value;
    copyToClipboard(text);
}

// --- Utils ---

function setStatus(msg) {
    document.getElementById('status-text').textContent = msg;
}

function setLoading(isLoading, msg) {
    const loader = document.getElementById('loader');
    if (isLoading) {
        loader.classList.remove('hidden');
        if (msg) setStatus(msg);
    } else {
        loader.classList.add('hidden');
    }
}

function copyToClipboard(text) {
    // pywebview might not support navigator.clipboard fully in all contexts, 
    // but we can use the Python backend to copy if needed. 
    // For now, try standard JS, fallback to Python.
    navigator.clipboard.writeText(text).then(() => {
        setStatus("Copied to clipboard!");
    }).catch(() => {
        window.pywebview.api.copy_text(text);
        setStatus("Copied to clipboard!");
    });
}

function openLink(url) {
    window.pywebview.api.open_url(url);
}
