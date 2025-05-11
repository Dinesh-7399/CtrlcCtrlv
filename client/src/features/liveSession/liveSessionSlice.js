// src/features/liveSession/liveSessionSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { socketService } from '../../services/socketService'; // Re-use the generic socket service
import { fetchLiveSessionDetailsAPI } from '../../services/liveSessionService'; // Import the new service

// Thunk to fetch initial live session details
export const fetchCurrentLiveSession = createAsyncThunk(
  'liveSession/fetchCurrent',
  async (sessionId, { rejectWithValue }) => {
    try {
      const response = await fetchLiveSessionDetailsAPI(sessionId);
      if (response.success) {
        return response.data; // Expected: { id, title, status ('upcoming', 'live', 'ended'), streamUrl, startTime, courseId }
      }
      return rejectWithValue(response.message || 'Could not fetch session details.');
    } catch (error) {
      return rejectWithValue(error.message || 'Error fetching session details.');
    }
  }
);

// Thunk to initialize socket listeners for the live session
export const initializeLiveSessionSockets = createAsyncThunk(
  'liveSession/initSockets',
  async ({ sessionId, courseId, currentUserId }, { dispatch, rejectWithValue }) => {
    try {
      // Assuming socketService.connect handles general connection.
      // We might join a specific room for this live session.
      // The socket connection might already be established by DoubtChatPage or another component.
      // If not, socketService.connect should be called first or ensured.
      let socket = socketService.getSocket();
      if (!socket || !socket.connected) {
        // Attempt to connect if not already connected.
        // Pass relevant identifiers for room joining or namespacing.
        socket = socketService.connect(courseId, sessionId); // `courseId` for room, `sessionId` for context
        if (!socket) return rejectWithValue('Failed to establish socket connection for live session.');
        // Wait for actual connection event before proceeding with listeners
        await new Promise((resolve, reject) => {
            socketService.on('connect', resolve);
            socketService.on('connect_error', (err) => reject(new Error(err.message || 'Socket connection error')));
            setTimeout(() => reject(new Error('Socket connection timeout')), 5000); // 5s timeout
        });
        dispatch(liveChatConnected()); // Update chat connection status
      } else {
         // If already connected, ensure we are in the correct room
         socketService.emit('joinLiveSessionRoom', { sessionId, courseId }); // Custom event for backend
      }


      socketService.on('liveSessionUpdate', (update) => { // For status, streamUrl changes
        dispatch(updateSessionDetails(update)); // update = { status, streamUrl, title }
      });

      socketService.on('newLiveChatMessage', (message) => {
        const messageWithSenderType = {
            ...message, // Expected: { id, senderId, senderName, text, timestamp }
            sender: message.senderId === currentUserId ? 'user' : (message.senderType || 'participant')
        };
        dispatch(addLiveMessage(messageWithSenderType));
      });
      
      socketService.on(`liveSessionError_${sessionId}`, (errorMsg) => { // Room-specific error
        dispatch(setLiveSessionError(errorMsg));
      });

      // Inform that listeners are set up
      return { status: 'listeners_initialized' };

    } catch (error) {
      dispatch(liveChatError(error.message));
      return rejectWithValue(error.message || 'Failed to initialize live session listeners.');
    }
  }
);

// Thunk to send a live chat message
export const sendLiveChatMessage = createAsyncThunk(
  'liveSession/sendLiveMessage',
  async ({ sessionId, courseId, text, userId, userName }, { dispatch, rejectWithValue }) => {
    try {
      const messageData = { sessionId, courseId, senderId: userId, senderName: userName, text, timestamp: new Date().toISOString() };
      socketService.emit('sendLiveChatMessage', messageData);
      // Optimistic update handled by server echoing via 'newLiveChatMessage'
      return { textSent: text };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to send live chat message.');
    }
  }
);


const initialState = {
  currentSession: null, // { id, title, status, streamUrl, startTime, courseId }
  messages: [],
  chatConnectionStatus: 'disconnected', // 'disconnected', 'connecting', 'connected', 'error'
  loadingStatus: 'idle', // For fetchCurrentLiveSession
  error: null, // For fetchCurrentLiveSession or general session errors
  sendMessageError: null,
};

const liveSessionSlice = createSlice({
  name: 'liveSession',
  initialState,
  reducers: {
    updateSessionDetails: (state, action) => {
      if (state.currentSession) {
        state.currentSession = { ...state.currentSession, ...action.payload };
      } else {
        state.currentSession = action.payload;
      }
      // If status changes to 'live' and there's a new streamUrl, update it.
      if(action.payload.status) state.currentSession.status = action.payload.status;
      if(action.payload.streamUrl) state.currentSession.streamUrl = action.payload.streamUrl;
    },
    addLiveMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    setLiveSessionError: (state, action) => {
        state.error = action.payload;
    },
    clearLiveSessionState: (state) => {
      state.currentSession = null;
      state.messages = [];
      state.chatConnectionStatus = 'disconnected';
      state.loadingStatus = 'idle';
      state.error = null;
      state.sendMessageError = null;
    },
    // Chat connection specific reducers
    liveChatConnecting: (state) => {
      state.chatConnectionStatus = 'connecting';
      state.error = null; // Clear general session error
    },
    liveChatConnected: (state) => {
      state.chatConnectionStatus = 'connected';
    },
    liveChatDisconnected: (state) => {
      state.chatConnectionStatus = 'disconnected';
    },
    liveChatError: (state, action) => {
      state.chatConnectionStatus = 'error';
      state.error = action.payload; // Can use this for chat specific errors too
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Current Live Session
      .addCase(fetchCurrentLiveSession.pending, (state) => {
        state.loadingStatus = 'loading';
        state.error = null;
      })
      .addCase(fetchCurrentLiveSession.fulfilled, (state, action) => {
        state.loadingStatus = 'succeeded';
        state.currentSession = action.payload;
        // If session is upcoming or ended, initialize messages array if needed for system message
        if (action.payload.status !== 'live' && state.messages.length === 0) {
            const text = action.payload.status === 'upcoming'
                ? `Session starting soon at ${new Date(action.payload.startTime).toLocaleTimeString('en-IN')}...`
                : 'This live session has ended.';
            state.messages.push({ id: `sys-${Date.now()}`, sender: 'system', text });
        } else if (action.payload.status === 'live' && state.messages.length === 0) {
            state.messages.push({ id: `sys-${Date.now()}`, sender: 'system', text: 'Welcome to the live session!' });
        }
      })
      .addCase(fetchCurrentLiveSession.rejected, (state, action) => {
        state.loadingStatus = 'failed';
        state.error = action.payload;
      })
      // Initialize Live Session Sockets
      .addCase(initializeLiveSessionSockets.pending, (state) => {
        // dispatch(liveChatConnecting()) is called within the thunk
      })
      .addCase(initializeLiveSessionSockets.fulfilled, (state) => {
        // dispatch(liveChatConnected()) is called within the thunk
      })
      .addCase(initializeLiveSessionSockets.rejected, (state, action) => {
        state.chatConnectionStatus = 'error';
        state.error = action.payload; // Store specific socket initialization error
      })
      // Send Live Chat Message
      .addCase(sendLiveChatMessage.rejected, (state, action) => {
        state.sendMessageError = action.payload;
        // state.messages.push({ id: `syserr-${Date.now()}`, sender: 'system', text: `Failed to send message: ${action.meta.arg.text.substring(0,20)}...` });
      });
  },
});

export const {
  updateSessionDetails,
  addLiveMessage,
  setLiveSessionError,
  clearLiveSessionState,
  liveChatConnecting,
  liveChatConnected,
  liveChatDisconnected,
  liveChatError,
} = liveSessionSlice.actions;

// Selectors
export const selectCurrentLiveSession = (state) => state.liveSession.currentSession;
export const selectLiveSessionMessages = (state) => state.liveSession.messages;
export const selectLiveSessionChatStatus = (state) => state.liveSession.chatConnectionStatus;
export const selectLiveSessionLoadingStatus = (state) => state.liveSession.loadingStatus;
export const selectLiveSessionError = (state) => state.liveSession.error;
export const selectLiveSessionSendMessageError = (state) => state.liveSession.sendMessageError;

export default liveSessionSlice.reducer;