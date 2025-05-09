/**
 * Test script for WebSocket connection
 * 
 * This script connects to the WebSocket server and verifies that
 * messages can be sent and received properly.
 */

import { WebSocket } from 'ws';

// Create WebSocket connection
console.log('Creating WebSocket connection...');
const socket = new WebSocket('ws://localhost:3002/ws');

// Connection opened
socket.addEventListener('open', (event) => {
  console.log('✅ Connection established');
  
  // Send a ping message
  const pingMessage = JSON.stringify({ type: 'ping' });
  socket.send(pingMessage);
  console.log('Sent message:', pingMessage);
  
  // Send a test message to global channel
  const testMessage = JSON.stringify({
    type: 'message',
    channel: 'global',
    content: 'Test message from client',
    persist: false
  });
  
  setTimeout(() => {
    socket.send(testMessage);
    console.log('Sent message:', testMessage);
  }, 1000);
  
  // Close connection after 5 seconds
  setTimeout(() => {
    console.log('Test complete, closing connection');
    socket.close();
    process.exit(0);
  }, 5000);
});

// Listen for messages
socket.addEventListener('message', (event) => {
  console.log('📩 Message received:', event.data);
});

// Connection closed
socket.addEventListener('close', (event) => {
  console.log('Connection closed:', event.code, event.reason);
});

// Connection error
socket.addEventListener('error', (error) => {
  console.error('❌ WebSocket error:', error);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('Interrupted, closing connection');
  socket.close();
  process.exit(0);
});