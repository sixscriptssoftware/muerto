# Security Considerations

## Overview

Muerto Sandbox IDE is designed to safely execute untrusted JavaScript code for testing AI agents. This document outlines the security measures implemented and recommendations for deployment.

## Implemented Security Measures

### 1. Code Execution Sandbox (VM2)
- All user code runs in an isolated VM2 sandbox
- No access to Node.js modules, file system, or network
- Configurable timeout limits prevent infinite loops
- Memory and CPU are constrained by the VM2 environment

**Note:** VM2 is deprecated and has known security limitations. While suitable for development and testing, production deployments should consider:
- Running the sandbox service in isolated Docker containers
- Using isolated-vm for better isolation (requires native compilation)
- Implementing additional layers of defense (WAF, network isolation)

### 2. Path Traversal Protection
- All filename parameters are sanitized using `path.basename()`
- Prevents `../` sequences from accessing files outside session directories
- Session directories are isolated from each other

### 3. Session Management
- Unique session IDs generated using timestamp + random string
- Session IDs validated to contain only alphanumeric characters
- Automatic cleanup of sessions older than 24 hours
- Each session has its own isolated file system directory

### 4. Rate Limiting
- 100 requests per 15 minutes per IP address
- Applied to all API endpoints via `/api/` prefix
- Prevents DoS attacks and resource exhaustion

### 5. File Upload Security
- Maximum file size: 5MB per file
- Maximum 10 files per upload request
- Files stored in session-specific directories
- No executable permissions on uploaded files

### 6. Input Validation
- Session IDs validated with regex
- Filenames sanitized to prevent path traversal
- Code execution timeout enforced
- All user inputs escaped in console output

### 7. CORS and MIME Types
- CORS protection configured
- Proper MIME types set for static files
- Prevents certain types of injection attacks

## Deployment Recommendations

### Development/Testing Environment
The current implementation is suitable for:
- Local development and testing
- Internal team use in trusted networks
- Educational purposes
- Proof-of-concept demonstrations

### Production Environment
For production deployment, consider these additional measures:

#### 1. Container Isolation
```bash
# Run in Docker with limited resources
docker run --rm \
  --memory="512m" \
  --cpus="0.5" \
  --network="none" \
  -p 3000:3000 \
  muerto-sandbox-ide
```

#### 2. Network Isolation
- Deploy behind a Web Application Firewall (WAF)
- Use network policies to restrict outbound connections
- Implement DDoS protection at the network layer

#### 3. Authentication & Authorization
- Add user authentication (OAuth, JWT, etc.)
- Implement role-based access control
- Track user activity and code execution

#### 4. Monitoring & Logging
- Log all code execution attempts
- Monitor resource usage (CPU, memory, disk)
- Set up alerts for suspicious activity
- Implement audit trails

#### 5. Enhanced Sandboxing
Consider replacing VM2 with:
- **isolated-vm**: Better isolation, requires native compilation
- **Docker containers**: Run each execution in a separate container
- **WebAssembly**: Compile code to WASM for better sandboxing
- **Cloud Functions**: Use serverless functions for execution

## Known Limitations

### VM2 Security Issues
- VM2 is deprecated and no longer maintained
- Known escape vulnerabilities exist
- Not suitable for executing truly untrusted code in production

### Resource Exhaustion
- While timeouts are enforced, CPU-intensive code can still impact server
- Memory limits are not strictly enforced
- Disk space can fill up with uploaded files

### No Network Isolation
- The server itself has network access
- If the sandbox is escaped, network calls are possible

## Reporting Security Issues

If you discover a security vulnerability, please report it responsibly:
1. Do NOT open a public GitHub issue
2. Email security concerns to the repository maintainer
3. Provide detailed reproduction steps
4. Allow time for a fix before public disclosure

## Best Practices for Users

1. **Don't Run Truly Malicious Code**: This sandbox is for testing AI agents, not for executing arbitrary untrusted code
2. **Monitor Resources**: Keep an eye on server resource usage
3. **Regular Updates**: Keep dependencies updated for security patches
4. **Backup Data**: Regularly backup any important uploaded files
5. **Use HTTPS**: Always deploy with TLS/SSL in production

## Compliance

This application has not been audited for:
- PCI DSS compliance
- HIPAA compliance
- SOC 2 compliance
- GDPR compliance

If you need to meet specific compliance requirements, additional security measures and audits will be necessary.

## License

This security document is part of the Muerto project and is licensed under the MIT License.
