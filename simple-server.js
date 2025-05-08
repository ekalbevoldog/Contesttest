const http = require('http');

// Create a basic server that responds to health checks
const server = http.createServer((req, res) => {
  console.log(`Received request: ${req.method} ${req.url}`);
  
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
  } else {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Simple test server is running');
  }
});

// Listen on port 5000
server.listen(5000, '0.0.0.0', () => {
  console.log('Simple test server listening on http://localhost:5000');
  console.log('Try accessing http://localhost:5000/health for a health check');
});

// Handle errors
server.on('error', (err) => {
  console.error('Server error:', err);
});