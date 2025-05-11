// src/features/chat/chatSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { socketService } from '../../services/socketService'; // Adjust path

// Thunk for initializing connection and listening to messages
// This is more of a setup action rather than a typical async data fetch.
export const initializeChatSession = createAsyncThunk(
  'chat/initializeSession',
  async ({ courseId, sessionId, currentUserId }, { dispatch, rejectWithValue }) => {
    try {
      const socket = socketService.connect(courseId, sessionId); // Assuming courseId is main room identifier

      if (!socket) {
        return rejectWithValue('Failed to establish socket connection.');
      }

      dispatch(chatConnecting());

      socketService.on('connect', () => {
        dispatch(chatConnected());
      });

      socketService.on('disconnect', (reason) => {
        dispatch(chatDisconnected(reason));
      });

      socketService.on('connect_error', (error) => {
        dispatch(chatError(error.message || 'Connection error'));
        // Optionally try to disconnect fully if connect_error leads to unusable state
        socketService.disconnect();
      });

      // Listen for new messages from the server
      socketService.on('newMessage', (message) => {
        // Add senderType if backend doesn't provide it, or normalize
        // This assumes backend sends { id, senderId, text, timestamp, senderName }
        // You might need to map senderId to 'user', 'instructor', 'bot' based on your logic
        const messageWithSenderType = {
            ...message,
            sender: message.senderId === currentUserId ? 'user' : (message.senderType || 'instructor') // Example logic
        };
        dispatch(addMessage(messageWithSenderType));
      });

      // Listen for instructor status updates (example)
      socketService.on('instructorStatusUpdate', (status) => {
        dispatch(setInstructorStatus(status)); // status: 'available', 'unavailable', 'connected'
      });
      
      // Listen for initial messages or history if backend sends it upon join
      socketService.on('chatHistory', (history) => {
          dispatch(loadInitialMessages(history.messages || [])); // Assuming history.messages is an array
          // Potentially set chatHistoryList as well if `history` contains metadata for other chats
      });


      // You might want to return some initial status or data
      return { status: 'initialized', socketId: socket.id };
    } catch (error) {
      return rejectWithValue(error.message || 'Chat initialization failed');
    }
  }
);

// Thunk for sending a message
export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({ courseId, text, files, userId, userName }, { dispatch, rejectWithValue }) => {
    try {
      // Basic message structure, adapt as needed for your backend
      const messageData = {
        courseId, // Or a specific chat room ID
        senderId: userId,
        senderName: userName,
        text: text,
        timestamp: new Date().toISOString(),
        // fileUrls: [] // If files are uploaded first, include their URLs
      };

      // TODO: Handle file uploads separately if needed.
      // For now, assuming text-only or files are handled by just passing names.
      // If uploading, you'd typically upload files first, get URLs, then send message with URLs.
      if (files && files.length > 0) {
          // Placeholder for file handling logic.
          // In a real app, you'd upload files and get URLs first.
          messageData.attachments = files.map(f => ({ fileName: f.name, type: f.type, size: f.size }));
          console.log("Sending message with attachments (placeholder):", messageData);
      }

      socketService.emit('sendMessage', messageData);

      // Optimistic update: add message to local state immediately
      // Backend should confirm or send the actual message back via 'newMessage' event
      // For simplicity, we'll let 'newMessage' event handle adding it to avoid duplicates if backend echoes.
      // If you want purely optimistic update:
      // dispatch(addMessage({ ...messageData, id: `temp-${Date.now()}`, sender: 'user' }));

      return { text }; // Return minimal data or what backend confirms
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to send message');
    }
  }
);


const initialState = {
  messages: [], // For the currently active chat session
  chatHistoryList: placeholderChatHistory, // Static for now
  selectedChatId: 'current', // 'current' or an ID from history

  connectionStatus: 'disconnected', // 'disconnected', 'connecting', 'connected', 'error'
  instructorStatus: null, // 'checking', 'connected', 'unavailable' (matches existing component state)
  isConnectingToInstructor: false, // Specific for the "Connect to Instructor" flow

  error: null, // For general chat errors
  sendMessageError: null,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    loadInitialMessages: (state, action) => {
        state.messages = action.payload; // Replace current messages with history
    },
    setChatHistoryList: (state, action) => {
        state.chatHistoryList = action.payload;
    },
    setSelectedChatId: (state, action) => {
        state.selectedChatId = action.payload;
        state.messages = []; // Clear messages when switching chats, to be loaded by an effect
        state.error = null; // Clear errors
    },
    chatConnecting: (state) => {
      state.connectionStatus = 'connecting';
      state.error = null;
    },
    chatConnected: (state) => {
      state.connectionStatus = 'connected';
      state.error = null;
      state.isConnectingToInstructor = false; // Reset this if it was part of connection flow
    },
    chatDisconnected: (state, action) => {
      state.connectionStatus = 'disconnected';
      state.instructorStatus = null; // Reset instructor status on disconnect
      state.isConnectingToInstructor = false;
      // state.error = action.payload || 'Disconnected'; // Optionally set error based on reason
    },
    chatError: (state, action) => {
      state.connectionStatus = 'error';
      state.error = action.payload;
      state.isConnectingToInstructor = false;
    },
    setInstructorStatus: (state, action) => {
      state.instructorStatus = action.payload;
      state.isConnectingToInstructor = action.payload === 'checking';
      if(action.payload === 'connected') state.connectionStatus = 'connected'; // Ensure main connection status is good
    },
    setIsConnectingToInstructor: (state, action) => {
        state.isConnectingToInstructor = action.payload;
        if(action.payload) state.instructorStatus = 'checking';
    },
    clearChatMessages: (state) => {
        state.messages = [];
    },
    clearChatError: (state) => {
        state.error = null;
        state.sendMessageError = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Initialize Chat Session
      .addCase(initializeChatSession.rejected, (state, action) => {
        state.connectionStatus = 'error';
        state.error = action.payload;
      })
      // Send Message
      .addCase(sendMessage.pending, (state) => {
        // Optimistic update might happen in component or here if needed
        state.sendMessageError = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        // Message sending initiated. Backend will send 'newMessage' event for actual addition.
        // If you did optimistic update, you might remove the temp message here if backend sends confirmation.
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.sendMessageError = action.payload;
        // Potentially add a system message indicating send failure
        // state.messages.push({ id: `err-${Date.now()}`, sender: 'system', text: `Failed to send: ${action.meta.arg.text.substring(0,20)}...` });
      });
  },
});

export const {
  addMessage,
  loadInitialMessages,
  setChatHistoryList,
  setSelectedChatId,
  chatConnecting,
  chatConnected,
  chatDisconnected,
  chatError,
  setInstructorStatus,
  setIsConnectingToInstructor,
  clearChatMessages,
  clearChatError,
} = chatSlice.actions;

// Selectors
export const selectChatMessages = (state) => state.chat.messages;
export const selectChatHistoryList = (state) => state.chat.chatHistoryList;
export const selectSelectedChatId = (state) => state.chat.selectedChatId;
export const selectChatConnectionStatus = (state) => state.chat.connectionStatus;
export const selectInstructorStatus = (state) => state.chat.instructorStatus;
export const selectIsConnectingToInstructor = (state) => state.chat.isConnectingToInstructor;
export const selectChatError = (state) => state.chat.error;
export const selectSendMessageError = (state) => state.chat.sendMessageError;

export default chatSlice.reducer;