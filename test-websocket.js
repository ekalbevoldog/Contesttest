/**
 * WebSocket Test Client
 * 
 * Tests WebSocket connection with the server to ensure bidirectional
 * communication is working properly.
 */

import WebSocket from 'ws';
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Get server URL from command line or use default
const serverUrl = process.argv[2] || 'ws://localhost:5000/ws';

console.log(`${colors.cyan}WebSocket Test Client${colors.reset}`);
console.log(`${colors.blue}Connecting to: ${serverUrl}${colors.reset}`);

// Create WebSocket connection
const socket = new WebSocket(serverUrl);

// Connection opened
socket.on('open', () => {
  console.log(`${colors.green}✓ Connected to server${colors.reset}`);
  
  // Send test message
  const testMessage = JSON.stringify({
    type: 'test',
    message: 'Hello from WebSocket test client',
    timestamp: new Date().toISOString()
  });
  
  console.log(`${colors.blue}Sending test message...${colors.reset}`);
  socket.send(testMessage);
  
  // Set timeout to close connection if no response is received
  setTimeout(() => {
    if (socket.readyState === WebSocket.OPEN) {
      console.log(`${colors.yellow}⚠️ No response received in 5 seconds, closing connection${colors.reset}`);
      socket.close();
      process.exit(1);
    }
  }, 5000);
});

// Listen for messages
socket.on('message', (data) => {
  try {
    const message = JSON.parse(data);
    console.log(`${colors.green}✓ Received message:${colors.reset}`, message);
    
    // Close connection after receiving a message
    setTimeout(() => {
      console.log(`${colors.blue}Test completed successfully, closing connection${colors.reset}`);
      socket.close();
      process.exit(0);
    }, 1000);
  } catch (error) {
    console.log(`${colors.yellow}Received non-JSON message:${colors.reset}`, data.toString());
  }
});

// Handle errors
socket.on('error', (error) => {
  console.log(`${colors.red}Error:${colors.reset}`, error.message);
  process.exit(1);
});

// Connection closed
socket.on('close', (code, reason) => {
  console.log(`${colors.yellow}Connection closed:${colors.reset} Code: ${code}, Reason: ${reason || 'No reason provided'}`);
  process.exit(code === 1000 ? 0 : 1);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log(`${colors.blue}Closing WebSocket connection...${colors.reset}`);
  socket.close();
  process.exit(0);
});