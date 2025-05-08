/**
 * WebSocket Test Tool
 * 
 * This script tests WebSocket connections with the server.
 * It connects, authenticates, subscribes to channels, and sends messages.
 * 
 * Run with: node server/test-websocket.js
 */

const WebSocket = require('ws');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Configuration
const config = {
  url: 'ws://localhost:3000/ws',
  token: '', // Will be set by user
  autoReconnect: true,
  pingInterval: 30000,
  logToFile: true,
  logFile: './websocket-test.log'
};

// State
let ws = null;
let connected = false;
let authenticated = false;
let subscriptions = new Set();
let reconnectTimer = null;
let pingTimer = null;
let messageCount = 0;
let logStream = null;

// Terminal colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

// Initialize log file if enabled
if (config.logToFile) {
  logStream = fs.createWriteStream(config.logFile, { flags: 'a' });
  logStream.write(`\n--- WebSocket Test Session Started at ${new Date().toISOString()} ---\n`);
}

// Log message to console and file
function log(message, color = colors.reset) {
  const timestamp = new Date().toISOString();
  const formattedMessage = `[${timestamp}] ${message}`;
  
  console.log(color + formattedMessage + colors.reset);
  
  if (config.logToFile && logStream) {
    logStream.write(formattedMessage + '\n');
  }
}

// Connect to WebSocket server
function connect() {
  log(`Connecting to ${config.url}...`, colors.cyan);
  
  try {
    ws = new WebSocket(config.url);
    
    ws.on('open', () => {
      connected = true;
      log('Connected to server', colors.green);
      
      // Start ping interval
      startPingInterval();
      
      // Auto-authenticate if token is set
      if (config.token) {
        authenticate(config.token);
      }
      
      // Resubscribe to previous channels
      if (subscriptions.size > 0) {
        log(`Resubscribing to ${subscriptions.size} channels...`, colors.blue);
        subscriptions.forEach(channel => {
          subscribe(channel);
        });
      }
      
      // Display help menu
      showHelp();
    });
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        messageCount++;
        
        // Format message nicely
        log(`Received message (#${messageCount}):`, colors.bright);
        console.log(formatJson(message));
        
        // Handle special message types
        if (message.type === 'auth_success') {
          authenticated = true;
          log('Authentication successful', colors.green);
        } else if (message.type === 'auth_error') {
          authenticated = false;
          log('Authentication failed: ' + message.error, colors.red);
        } else if (message.type === 'subscribed') {
          log(`Subscribed to channel: ${message.channel}`, colors.green);
        } else if (message.type === 'unsubscribed') {
          log(`Unsubscribed from channel: ${message.channel}`, colors.yellow);
        }
      } catch (error) {
        log(`Error parsing message: ${error.message}`, colors.red);
        log(`Raw message: ${data}`, colors.gray);
      }
    });
    
    ws.on('close', (code, reason) => {
      connected = false;
      authenticated = false;
      log(`Connection closed: Code ${code} ${reason ? '- ' + reason : ''}`, colors.yellow);
      
      clearInterval(pingTimer);
      
      // Reconnect if enabled
      if (config.autoReconnect) {
        const delay = 3000;
        log(`Reconnecting in ${delay/1000} seconds...`, colors.blue);
        clearTimeout(reconnectTimer);
        reconnectTimer = setTimeout(connect, delay);
      }
    });
    
    ws.on('error', (error) => {
      log(`WebSocket error: ${error.message}`, colors.red);
    });
  } catch (error) {
    log(`Connection error: ${error.message}`, colors.red);
  }
}

// Disconnect from server
function disconnect() {
  if (ws) {
    log('Disconnecting...', colors.yellow);
    clearInterval(pingTimer);
    clearTimeout(reconnectTimer);
    ws.close();
    connected = false;
    authenticated = false;
  } else {
    log('Not connected', colors.gray);
  }
}

// Authenticate with the server
function authenticate(token) {
  if (!connected) {
    log('Cannot authenticate: Not connected', colors.red);
    return;
  }
  
  sendMessage({
    type: 'authenticate',
    token: token
  });
  log('Sending authentication request...', colors.blue);
}

// Subscribe to a channel
function subscribe(channel) {
  if (!connected) {
    log('Cannot subscribe: Not connected', colors.red);
    return;
  }
  
  subscriptions.add(channel);
  sendMessage({
    type: 'subscribe',
    channel: channel
  });
  log(`Subscribing to channel: ${channel}`, colors.blue);
}

// Unsubscribe from a channel
function unsubscribe(channel) {
  if (!connected) {
    log('Cannot unsubscribe: Not connected', colors.red);
    return;
  }
  
  subscriptions.delete(channel);
  sendMessage({
    type: 'unsubscribe',
    channel: channel
  });
  log(`Unsubscribing from channel: ${channel}`, colors.blue);
}

// Send a message to the server
function sendMessage(message) {
  if (!connected) {
    log('Cannot send message: Not connected', colors.red);
    return;
  }
  
  try {
    const json = JSON.stringify(message);
    ws.send(json);
    log(`Sent message: ${json}`, colors.cyan);
  } catch (error) {
    log(`Error sending message: ${error.message}`, colors.red);
  }
}

// Send a ping message periodically to keep the connection alive
function startPingInterval() {
  clearInterval(pingTimer);
  pingTimer = setInterval(() => {
    if (connected) {
      sendMessage({ type: 'ping' });
    }
  }, config.pingInterval);
}

// Format JSON nicely
function formatJson(obj) {
  return JSON.stringify(obj, null, 2);
}

// Show help menu
function showHelp() {
  console.log('\n' + colors.bright + 'Available commands:' + colors.reset);
  console.log(colors.green + '  help' + colors.reset + ' - Show this help menu');
  console.log(colors.green + '  connect' + colors.reset + ' - Connect to the WebSocket server');
  console.log(colors.green + '  disconnect' + colors.reset + ' - Disconnect from the server');
  console.log(colors.green + '  auth <token>' + colors.reset + ' - Authenticate with a token');
  console.log(colors.green + '  subscribe <channel>' + colors.reset + ' - Subscribe to a channel');
  console.log(colors.green + '  unsubscribe <channel>' + colors.reset + ' - Unsubscribe from a channel');
  console.log(colors.green + '  send <messageType> <payload>' + colors.reset + ' - Send a message');
  console.log(colors.green + '  status' + colors.reset + ' - Show connection status');
  console.log(colors.green + '  exit' + colors.reset + ' - Exit the program');
  console.log('');
}

// Show status
function showStatus() {
  console.log('\n' + colors.bright + 'WebSocket Status:' + colors.reset);
  console.log(`  Connected: ${connected ? colors.green + 'Yes' + colors.reset : colors.red + 'No' + colors.reset}`);
  console.log(`  Authenticated: ${authenticated ? colors.green + 'Yes' + colors.reset : colors.red + 'No' + colors.reset}`);
  console.log(`  Subscribed Channels: ${subscriptions.size}`);
  if (subscriptions.size > 0) {
    console.log('  Channels:');
    subscriptions.forEach(channel => {
      console.log(`    - ${channel}`);
    });
  }
  console.log(`  Messages Received: ${messageCount}`);
  console.log(`  Server URL: ${config.url}`);
  console.log('');
}

// Process user input
function processCommand(input) {
  const args = input.trim().split(' ');
  const command = args[0].toLowerCase();
  
  switch (command) {
    case 'help':
      showHelp();
      break;
      
    case 'connect':
      connect();
      break;
      
    case 'disconnect':
      disconnect();
      break;
      
    case 'auth':
      if (args.length < 2) {
        log('Usage: auth <token>', colors.red);
      } else {
        config.token = args[1];
        authenticate(config.token);
      }
      break;
      
    case 'subscribe':
      if (args.length < 2) {
        log('Usage: subscribe <channel>', colors.red);
      } else {
        subscribe(args[1]);
      }
      break;
      
    case 'unsubscribe':
      if (args.length < 2) {
        log('Usage: unsubscribe <channel>', colors.red);
      } else {
        unsubscribe(args[1]);
      }
      break;
      
    case 'send':
      if (args.length < 3) {
        log('Usage: send <messageType> <jsonPayload>', colors.red);
      } else {
        try {
          const messageType = args[1];
          const payloadStr = args.slice(2).join(' ');
          let payload;
          
          try {
            // Try to parse as JSON
            payload = JSON.parse(payloadStr);
          } catch (e) {
            // Use as string if not valid JSON
            payload = payloadStr;
          }
          
          sendMessage({
            type: messageType,
            ...((typeof payload === 'object') ? payload : { data: payload })
          });
        } catch (error) {
          log(`Error sending message: ${error.message}`, colors.red);
        }
      }
      break;
      
    case 'status':
      showStatus();
      break;
      
    case 'exit':
      log('Exiting...', colors.yellow);
      disconnect();
      if (logStream) {
        logStream.end();
      }
      rl.close();
      process.exit(0);
      break;
      
    case '':
      // Ignore empty commands
      break;
      
    default:
      log(`Unknown command: ${command}. Type 'help' for available commands.`, colors.red);
  }
}

// Main program
console.log(colors.bright + `
╭─────────────────────────────────────╮
│       WebSocket Test Client         │
│                                     │
│  Type 'help' to see available       │
│  commands or 'exit' to quit         │
╰─────────────────────────────────────╯` + colors.reset);

// Process user input
rl.on('line', processCommand);

// Handle program termination
process.on('SIGINT', () => {
  log('\nProgram interrupted', colors.yellow);
  disconnect();
  if (logStream) {
    logStream.end();
  }
  rl.close();
  process.exit(0);
});

// Start connection
connect();