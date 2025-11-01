# Muerto - Sandbox IDE

🧪 A web-based sandbox IDE for uploading files, editing code, and testing AI agents in a secure, isolated environment.

## Features

- **File Upload**: Upload multiple files to your sandbox session
- **Code Editor**: Monaco editor (VS Code's editor) with syntax highlighting for multiple languages
- **Secure Sandbox**: Execute JavaScript code in an isolated VM environment
- **AI Agent Testing**: Perfect for testing AI agents and their behavior in a controlled environment
- **Session Management**: Each session is isolated with its own file system
- **Console Output**: Real-time console output with error handling
- **Multi-Tab Support**: Open and edit multiple files simultaneously

## Quick Start

### Installation

1. Clone the repository:
```bash
git clone https://github.com/sixscriptssoftware/muerto.git
cd muerto
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

4. Open your browser and navigate to:
```
http://localhost:3000
```

## Usage

### Uploading Files

1. Click the **Upload** button in the sidebar
2. Select one or more files from your computer
3. Files will appear in the file list

### Editing Code

1. Click on any file in the sidebar to open it in the editor
2. Edit the code using the Monaco editor
3. Click **Save** to save your changes

### Running Code

1. Open or write JavaScript code in the editor
2. Click the **Run Code** button
3. View the output in the Console panel

### Testing AI Agents

The sandbox is designed specifically for testing AI agents. Here's an example:

```javascript
class SimpleAgent {
    constructor(name) {
        this.name = name;
        this.memory = [];
    }
    
    think(input) {
        this.memory.push({ input, timestamp: Date.now() });
        console.log(`[${this.name}] Thinking about: ${input}`);
        return `Processed: ${input}`;
    }
    
    recall() {
        console.log(`[${this.name}] Memory contains ${this.memory.length} items`);
        return this.memory;
    }
}

// Test the agent
const agent = new SimpleAgent("TestBot");
agent.think("Hello, world!");
agent.think("What is 2 + 2?");
console.log("Agent memory:", agent.recall());
```

## API Endpoints

### Session Management
- `POST /api/session` - Create a new session
- `GET /api/files/:sessionId` - List files in a session

### File Operations
- `POST /api/upload` - Upload files
- `GET /api/file/:sessionId/:filename` - Get file content
- `PUT /api/file/:sessionId/:filename` - Update file content
- `DELETE /api/file/:sessionId/:filename` - Delete file

### Code Execution
- `POST /api/execute` - Execute JavaScript code in sandbox

## Security Features

- **Rate Limiting**: Prevents abuse with request rate limits
- **Sandboxed Execution**: Code runs in an isolated VM with no access to the file system or network
- **File Size Limits**: Maximum 5MB per file
- **Session Cleanup**: Old sessions are automatically cleaned up after 24 hours
- **CORS Protection**: Configurable CORS settings

## Architecture

```
muerto/
├── server/
│   └── index.js          # Express server with API endpoints
├── public/
│   ├── index.html        # Main HTML file
│   ├── css/
│   │   └── style.css     # Styles
│   └── js/
│       └── app.js        # Frontend application logic
├── uploads/              # User uploaded files (organized by session)
└── package.json          # Dependencies and scripts
```

## Technology Stack

- **Backend**: Node.js, Express
- **Frontend**: HTML, CSS, JavaScript
- **Editor**: Monaco Editor (VS Code's editor)
- **Sandbox**: VM2 for secure code execution
- **File Upload**: Multer
- **Security**: express-rate-limit, CORS

## Configuration

### Port
The default port is 3000. You can change it by setting the `PORT` environment variable:
```bash
PORT=8080 npm start
```

### Session Cleanup
Sessions older than 24 hours are automatically deleted. You can modify this in `server/index.js`.

### File Size Limits
The default file size limit is 5MB. Modify the `limits` option in the multer configuration to change this.

## Development

### Running in Development Mode
```bash
npm run dev
```

### Adding New Features

The codebase is organized for easy extension:
- Add new API endpoints in `server/index.js`
- Modify the UI in `public/index.html` and `public/css/style.css`
- Extend functionality in `public/js/app.js`

## License

MIT License - see LICENSE file for details

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues, questions, or suggestions, please open an issue on GitHub.

## Roadmap

Future enhancements:
- [ ] Support for more programming languages (Python, Go, etc.)
- [ ] Real-time collaboration features
- [ ] Plugin system for custom tools
- [ ] Export/import session data
- [ ] Docker container support
- [ ] WebSocket-based real-time console
- [ ] Debugger integration
- [ ] Git integration
