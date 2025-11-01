// Initialize Monaco Editor
let editor;
let currentSessionId = localStorage.getItem('sessionId');
let currentFile = 'welcome';
let openFiles = new Map();
let isDirty = false;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    // Create or load session
    if (!currentSessionId) {
        await createNewSession();
    } else {
        document.getElementById('session-id').textContent = currentSessionId;
        await loadFiles();
    }

    // Initialize Monaco Editor
    require.config({ paths: { vs: 'vs' } });
    require(['vs/editor/editor.main'], () => {
        editor = monaco.editor.create(document.getElementById('editor-container'), {
            value: getWelcomeContent(),
            language: 'javascript',
            theme: 'vs-dark',
            automaticLayout: true,
            minimap: { enabled: true },
            fontSize: 14,
            wordWrap: 'on'
        });

        // Track changes
        editor.onDidChangeModelContent(() => {
            if (currentFile !== 'welcome') {
                isDirty = true;
                updateSaveButton();
            }
        });

        openFiles.set('welcome', {
            content: getWelcomeContent(),
            language: 'javascript'
        });
    });

    // Event listeners
    document.getElementById('upload-btn').addEventListener('click', () => {
        document.getElementById('file-input').click();
    });

    document.getElementById('file-input').addEventListener('change', handleFileUpload);
    document.getElementById('new-session-btn').addEventListener('click', createNewSession);
    document.getElementById('save-btn').addEventListener('click', saveCurrentFile);
    document.getElementById('run-btn').addEventListener('click', runCode);
    document.getElementById('clear-console-btn').addEventListener('click', clearConsole);
});

function getWelcomeContent() {
    return `// Welcome to Muerto Sandbox IDE! 🎉
// 
// This is a secure sandbox environment for testing AI agents and JavaScript code.
//
// Getting Started:
// 1. Upload files using the "Upload" button in the sidebar
// 2. Click on files to edit them
// 3. Use the "Run Code" button to execute JavaScript
// 4. View output in the Console panel
//
// Example AI Agent Test:

class SimpleAgent {
    constructor(name) {
        this.name = name;
        this.memory = [];
    }
    
    think(input) {
        this.memory.push({ input, timestamp: Date.now() });
        console.log(\`[\${this.name}] Thinking about: \${input}\`);
        return \`Processed: \${input}\`;
    }
    
    recall() {
        console.log(\`[\${this.name}] Memory contains \${this.memory.length} items\`);
        return this.memory;
    }
}

// Test the agent
const agent = new SimpleAgent("TestBot");
agent.think("Hello, world!");
agent.think("What is 2 + 2?");
console.log("Agent memory:", agent.recall());

// Try running this code! Click "Run Code" button above.
`;
}

async function createNewSession() {
    try {
        const response = await fetch('/api/session', { method: 'POST' });
        const data = await response.json();
        
        if (data.success) {
            currentSessionId = data.sessionId;
            localStorage.setItem('sessionId', currentSessionId);
            document.getElementById('session-id').textContent = currentSessionId;
            await loadFiles();
            logConsole('New session created', 'success');
        }
    } catch (error) {
        logConsole(`Error creating session: ${error.message}`, 'error');
    }
}

async function handleFileUpload(event) {
    const files = event.target.files;
    if (files.length === 0) return;

    const formData = new FormData();
    formData.append('sessionId', currentSessionId);
    
    for (let file of files) {
        formData.append('files', file);
    }

    try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            logConsole(`Uploaded ${data.files.length} file(s)`, 'success');
            await loadFiles();
        }
    } catch (error) {
        logConsole(`Upload error: ${error.message}`, 'error');
    }

    // Reset input
    event.target.value = '';
}

async function loadFiles() {
    try {
        const response = await fetch(`/api/files/${currentSessionId}`);
        const data = await response.json();
        
        if (data.success) {
            renderFileList(data.files);
        }
    } catch (error) {
        logConsole(`Error loading files: ${error.message}`, 'error');
    }
}

function renderFileList(files) {
    const fileList = document.getElementById('file-list');
    
    if (files.length === 0) {
        fileList.innerHTML = '<p class="empty-state">No files uploaded yet</p>';
        return;
    }

    fileList.innerHTML = files.map(file => `
        <div class="file-item" onclick="openFile('${file.name}')">
            <span class="file-name" title="${file.name}">📄 ${file.name}</span>
            <span class="file-size">${formatBytes(file.size)}</span>
            <button class="delete-file-btn" onclick="event.stopPropagation(); deleteFile('${file.name}')">✕</button>
        </div>
    `).join('');
}

async function openFile(filename) {
    try {
        // Save current file if dirty
        if (isDirty && currentFile !== 'welcome') {
            await saveCurrentFile();
        }

        // Check if file is already open
        if (openFiles.has(filename)) {
            switchToFile(filename);
            return;
        }

        const response = await fetch(`/api/file/${currentSessionId}/${filename}`);
        const data = await response.json();
        
        if (data.success) {
            const language = getLanguageFromFilename(filename);
            openFiles.set(filename, {
                content: data.content,
                language
            });
            
            createTab(filename);
            switchToFile(filename);
        }
    } catch (error) {
        logConsole(`Error opening file: ${error.message}`, 'error');
    }
}

function createTab(filename) {
    const tabsContainer = document.getElementById('editor-tabs');
    
    // Check if tab already exists
    if (document.querySelector(`[data-file="${filename}"]`)) {
        return;
    }

    const tab = document.createElement('div');
    tab.className = 'tab';
    tab.setAttribute('data-file', filename);
    tab.innerHTML = `
        <span>${filename}</span>
        <span class="tab-close" onclick="event.stopPropagation(); closeTab('${filename}')">✕</span>
    `;
    tab.onclick = () => switchToFile(filename);
    
    tabsContainer.appendChild(tab);
}

function switchToFile(filename) {
    const fileData = openFiles.get(filename);
    if (!fileData) return;

    currentFile = filename;
    isDirty = false;
    
    // Update editor
    const model = monaco.editor.createModel(fileData.content, fileData.language);
    editor.setModel(model);
    
    // Update tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.toggle('active', tab.getAttribute('data-file') === filename);
    });
    
    // Update file list
    document.querySelectorAll('.file-item').forEach(item => {
        const name = item.querySelector('.file-name').textContent.replace('📄 ', '');
        item.classList.toggle('active', name === filename);
    });
    
    updateSaveButton();
}

function closeTab(filename) {
    if (filename === 'welcome') return;
    
    openFiles.delete(filename);
    const tab = document.querySelector(`[data-file="${filename}"]`);
    if (tab) tab.remove();
    
    // Switch to welcome tab if closing current file
    if (currentFile === filename) {
        switchToFile('welcome');
    }
}

async function saveCurrentFile() {
    if (currentFile === 'welcome') return;

    try {
        const content = editor.getValue();
        const response = await fetch(`/api/file/${currentSessionId}/${currentFile}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content })
        });
        
        const data = await response.json();
        
        if (data.success) {
            isDirty = false;
            openFiles.get(currentFile).content = content;
            updateSaveButton();
            logConsole(`Saved ${currentFile}`, 'success');
        }
    } catch (error) {
        logConsole(`Save error: ${error.message}`, 'error');
    }
}

async function deleteFile(filename) {
    if (!confirm(`Delete ${filename}?`)) return;

    try {
        const response = await fetch(`/api/file/${currentSessionId}/${filename}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            closeTab(filename);
            await loadFiles();
            logConsole(`Deleted ${filename}`, 'info');
        }
    } catch (error) {
        logConsole(`Delete error: ${error.message}`, 'error');
    }
}

async function runCode() {
    const code = editor.getValue();
    
    if (!code.trim()) {
        logConsole('No code to run', 'error');
        return;
    }

    logConsole('Running code...', 'info');
    
    try {
        const response = await fetch('/api/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                code, 
                sessionId: currentSessionId,
                timeout: 10000
            })
        });
        
        const data = await response.json();
        
        if (data.output) {
            logConsole(data.output, 'output');
        }
        
        if (data.result !== undefined) {
            logConsole(`Result: ${data.result}`, 'success');
        }
        
        if (data.errors) {
            logConsole(data.errors, 'error');
        }
        
        if (!data.success && data.error) {
            logConsole(`Error: ${data.error}`, 'error');
        }
        
        if (data.success && !data.output && !data.result) {
            logConsole('Code executed successfully (no output)', 'success');
        }
    } catch (error) {
        logConsole(`Execution error: ${error.message}`, 'error');
    }
}

function logConsole(message, type = 'output') {
    const consoleOutput = document.getElementById('console-output');
    const timestamp = new Date().toLocaleTimeString();
    
    const entry = document.createElement('div');
    entry.className = `console-entry ${type}`;
    entry.innerHTML = `<span class="console-timestamp">[${timestamp}]</span>${escapeHtml(message)}`;
    
    consoleOutput.appendChild(entry);
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
}

function clearConsole() {
    const consoleOutput = document.getElementById('console-output');
    consoleOutput.innerHTML = '<div class="console-welcome">Console cleared</div>';
}

function updateSaveButton() {
    const saveBtn = document.getElementById('save-btn');
    saveBtn.disabled = !isDirty || currentFile === 'welcome';
}

function getLanguageFromFilename(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const languageMap = {
        'js': 'javascript',
        'ts': 'typescript',
        'json': 'json',
        'html': 'html',
        'css': 'css',
        'py': 'python',
        'java': 'java',
        'cpp': 'cpp',
        'c': 'c',
        'md': 'markdown',
        'txt': 'plaintext'
    };
    return languageMap[ext] || 'plaintext';
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
