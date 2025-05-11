// src/services/socketService.js
import { io } from 'socket.io-client';

// Ensure this URL points to your Socket.IO server
const SOCKET_URL = import.meta.env.VITE_SOCKET_IO_URL || 'http://localhost:5001'; // Adjust if your backend is elsewhere

let socket;

const connect = (courseId, sessionId) => {
  // Prevent multiple connections
  if (socket && socket.connected) {
    console.log('Socket already connected.');
    // Optionally, you might want to rejoin a room if courseId/sessionId changes
    // socket.emit('joinRoom', { courseId, sessionId });
    return socket;
  }

  console.log(`Attempting to connect to Socket.IO server at ${SOCKET_URL}`);
  // You might want to pass query parameters or use namespaces
  // For example: io(SOCKET_URL, { query: { courseId, sessionId, token: 'your_auth_token_if_needed' } });
  // Or use namespaces: io(`${SOCKET_URL}/doubts-chat`)
  socket = io(SOCKET_URL, {
    reconnectionAttempts: 5,
    reconnectionDelay: 3000,
    // Add any necessary authentication (e.g., sending a token)
    // auth: { token: localStorage.getItem('authToken') } // Example
    query: {
        courseId: courseId, // Example: Pass courseId
        // sessionId: sessionId // Example: Pass sessionId if you have one for the chat room
    }
  });

  socket.on('connect', () => {
    console.log('Socket.IO connected:', socket.id);
    // Example: Join a room specific to the course or session after connecting
    // This depends on your backend setup.
    if (courseId) { // sessionId might also be relevant
        socket.emit('joinDoubtRoom', { courseId }); // Adjust event name as per your backend
    }
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket.IO disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('Socket.IO connection error:', error);
  });

  // You can add more general listeners here if needed,
  // but specific message listeners are often better managed in the slice/component.

  return socket;
};

const disconnect = () => {
  if (socket) {
    console.log('Disconnecting Socket.IO...');
    socket.disconnect();
    socket = null; // Clear the socket instance
  }
};

const on = (eventName, callback) => {
  if (socket) {
    socket.on(eventName, callback);
  }
};

const off = (eventName, callback) => {
  if (socket) {
    socket.off(eventName, callback);
  }
};

const emit = (eventName, data) => {
  if (socket) {
    socket.emit(eventName, data);
  } else {
    console.warn(`Socket not connected. Cannot emit event: ${eventName}`);
  }
};

const getSocket = () => socket;

export const socketService = {
  connect,
  disconnect,
  on,
  off,
  emit,
  getSocket,
};