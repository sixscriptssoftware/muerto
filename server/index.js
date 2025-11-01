const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { VM } = require('vm2');

const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files with correct MIME types
app.use(express.static('public', {
  setHeaders: (res, filepath) => {
    if (filepath.endsWith('.js')) {
      res.set('Content-Type', 'application/javascript');
    } else if (filepath.endsWith('.css')) {
      res.set('Content-Type', 'text/css');
    }
  }
}));

app.use('/api/', limiter);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const sessionId = req.body.sessionId || 'default';
    const uploadDir = path.join(__dirname, '..', 'uploads', sessionId);
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Routes

// Upload files
app.post('/api/upload', upload.array('files', 10), async (req, res) => {
  try {
    const sessionId = req.body.sessionId || 'default';
    const files = req.files.map(f => ({
      name: f.originalname,
      size: f.size,
      path: f.path
    }));
    res.json({ success: true, files, sessionId });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// List files in session
app.get('/api/files/:sessionId', async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    const uploadDir = path.join(__dirname, '..', 'uploads', sessionId);
    
    try {
      const files = await fs.readdir(uploadDir);
      const fileDetails = await Promise.all(
        files.map(async (file) => {
          const filePath = path.join(uploadDir, file);
          const stats = await fs.stat(filePath);
          return {
            name: file,
            size: stats.size,
            modified: stats.mtime
          };
        })
      );
      res.json({ success: true, files: fileDetails });
    } catch (err) {
      if (err.code === 'ENOENT') {
        res.json({ success: true, files: [] });
      } else {
        throw err;
      }
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Read file content
app.get('/api/file/:sessionId/:filename', async (req, res) => {
  try {
    const { sessionId, filename } = req.params;
    // Sanitize filename to prevent path traversal
    const sanitizedFilename = path.basename(filename);
    const filePath = path.join(__dirname, '..', 'uploads', sessionId, sanitizedFilename);
    const content = await fs.readFile(filePath, 'utf-8');
    res.json({ success: true, content });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update file content
app.put('/api/file/:sessionId/:filename', async (req, res) => {
  try {
    const { sessionId, filename } = req.params;
    const { content } = req.body;
    // Sanitize filename to prevent path traversal
    const sanitizedFilename = path.basename(filename);
    const filePath = path.join(__dirname, '..', 'uploads', sessionId, sanitizedFilename);
    await fs.writeFile(filePath, content, 'utf-8');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete file
app.delete('/api/file/:sessionId/:filename', async (req, res) => {
  try {
    const { sessionId, filename } = req.params;
    // Sanitize filename to prevent path traversal
    const sanitizedFilename = path.basename(filename);
    const filePath = path.join(__dirname, '..', 'uploads', sessionId, sanitizedFilename);
    await fs.unlink(filePath);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Execute code in sandbox
app.post('/api/execute', async (req, res) => {
  try {
    const { code, sessionId, timeout = 5000 } = req.body;
    
    if (!code) {
      return res.status(400).json({ success: false, error: 'No code provided' });
    }

    // Initialize output and error arrays before VM creation
    const output = [];
    const errors = [];

    // Create a sandboxed VM
    const vm = new VM({
      timeout,
      sandbox: {
        console: {
          log: (...args) => {
            output.push(args.map(arg => 
              typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' '));
          },
          error: (...args) => {
            errors.push(args.map(arg => 
              typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' '));
          },
          warn: (...args) => {
            output.push('WARN: ' + args.map(arg => 
              typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' '));
          }
        }
      }
    });

    try {
      const result = vm.run(code);
      
      res.json({ 
        success: true, 
        output: output.join('\n'),
        errors: errors.join('\n'),
        result: result !== undefined ? String(result) : undefined
      });
    } catch (vmError) {
      res.json({ 
        success: false, 
        output: output.join('\n'),
        error: vmError.message,
        errors: errors.join('\n')
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new session
app.post('/api/session', async (req, res) => {
  try {
    const sessionId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    const uploadDir = path.join(__dirname, '..', 'uploads', sessionId);
    await fs.mkdir(uploadDir, { recursive: true });
    res.json({ success: true, sessionId });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Clean up old sessions (older than 24 hours)
async function cleanupOldSessions() {
  try {
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    
    // Check if uploads directory exists
    try {
      await fs.access(uploadsDir);
    } catch {
      // Directory doesn't exist yet, nothing to clean up
      return;
    }
    
    const sessions = await fs.readdir(uploadsDir);
    const now = Date.now();
    
    for (const session of sessions) {
      const sessionPath = path.join(uploadsDir, session);
      const stats = await fs.stat(sessionPath);
      const age = now - stats.mtimeMs;
      
      // Delete sessions older than 24 hours
      if (age > 24 * 60 * 60 * 1000) {
        await fs.rm(sessionPath, { recursive: true, force: true });
        console.log(`Cleaned up old session: ${session}`);
      }
    }
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}

// Run cleanup every hour
setInterval(cleanupOldSessions, 60 * 60 * 1000);

app.listen(PORT, () => {
  console.log(`Sandbox IDE server running on http://localhost:${PORT}`);
});
