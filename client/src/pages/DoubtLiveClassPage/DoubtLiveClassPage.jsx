// client/src/pages/DoubtLiveClassPage/DoubtLiveClassPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom'; // For getting sessionId from URL
import ReactPlayer from 'react-player/lazy';
import { motion } from 'framer-motion';
import { FaExpand, FaCompress, FaVideoSlash, FaCommentSlash, FaSpinner } from 'react-icons/fa';
import './DoubtLiveClassPage.css';

// --- Redux Imports ---
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../../context/AuthContext';
import {
  fetchCurrentLiveSession,
  initializeLiveSessionSockets,
  sendLiveChatMessage,
  clearLiveSessionState,
  selectCurrentLiveSession,
  selectLiveSessionMessages,
  selectLiveSessionChatStatus,
  selectLiveSessionLoadingStatus,
  selectLiveSessionError,
  selectLiveSessionSendMessageError,
} from '../../features/liveSession/liveSessionSlice';
import Spinner from '../../components/common/Spinner';

// const courseName = "Advanced Quantum Physics"; // This should come from sessionDetails.courseName or similar

function DoubtLiveClassPage() {
  // Assuming sessionId is part of the URL, e.g., /live/:sessionId
  const { sessionIdFromParams } = useParams();
  const sessionId = sessionIdFromParams || 'defaultLiveSession123'; // Fallback or get from props/context

  const dispatch = useDispatch();
  const { user: currentUser, isAuthenticated } = useAuth();

  // --- Redux State ---
  const currentSession = useSelector(selectCurrentLiveSession);
  const liveMessages = useSelector(selectLiveSessionMessages);
  const chatStatus = useSelector(selectLiveSessionChatStatus); // 'disconnected', 'connecting', 'connected', 'error'
  const sessionLoadingStatus = useSelector(selectLiveSessionLoadingStatus); // 'idle', 'loading', 'succeeded', 'failed'
  const sessionError = useSelector(selectLiveSessionError);
  const sendMessageError = useSelector(selectLiveSessionSendMessageError);

  // --- Local UI State ---
  const [liveInputValue, setLiveInputValue] = useState('');
  const [isFullScreen, setIsFullScreen] = useState(false);

  const liveMessageListRef = useRef(null);

  // --- Effects ---
  // Fetch session details and initialize sockets
  useEffect(() => {
    if (sessionId && isAuthenticated && currentUser?.id) {
      dispatch(fetchCurrentLiveSession(sessionId));
    }
    // Cleanup on unmount
    return () => {
      dispatch(clearLiveSessionState());
      socketService.disconnect(); // Ensure general socket is closed if this page initiated it
    };
  }, [dispatch, sessionId, isAuthenticated, currentUser?.id]);

  // Initialize socket listeners once session is fetched and has a courseId
  useEffect(() => {
    if (currentSession && currentSession.status && currentSession.courseId && currentUser?.id && chatStatus !== 'connected' && chatStatus !== 'connecting') {
      // Pass courseId for room joining, sessionId for context, currentUserId for message sender identification
      dispatch(initializeLiveSessionSockets({ sessionId: currentSession.id, courseId: currentSession.courseId, currentUserId: currentUser.id }));
    }
  }, [dispatch, currentSession, currentUser?.id, chatStatus]);


  // Scroll live chat to bottom
  useEffect(() => {
    if (liveMessageListRef.current) {
      liveMessageListRef.current.scrollTop = liveMessageListRef.current.scrollHeight;
    }
  }, [liveMessages]);

  // --- Handlers ---
  const handleSendLiveMessage = (event) => {
    event.preventDefault();
    const trimmedInput = liveInputValue.trim();
    if (!trimmedInput || !currentSession || currentSession.status !== 'live' || chatStatus !== 'connected') return;

    dispatch(sendLiveChatMessage({
      sessionId: currentSession.id,
      courseId: currentSession.courseId, // Include courseId for context on backend
      text: trimmedInput,
      userId: currentUser?.id,
      userName: currentUser?.name
    }));
    setLiveInputValue('');
  };

  const handleLiveInputChange = (event) => setLiveInputValue(event.target.value);

  const getMessageClass = (sender) => {
    switch (sender) {
      case 'user': return 'user-message';
      case 'system': return 'system-message';
      case 'participant': // Fallback for other participants if senderType is used
      default: return 'participant-message';
    }
  };

  const getStatusClass = () => {
    if (!currentSession || !currentSession.status) return 'status-loading';
    switch (currentSession.status) {
      case 'live': return 'status-live';
      case 'upcoming': return 'status-upcoming';
      case 'ended': return 'status-ended';
      default: return 'status-loading';
    }
  };

  const toggleFullScreen = () => setIsFullScreen(!isFullScreen);
  const fullscreenTransition = { duration: 0.4, ease: "easeInOut" };

  // --- Render JSX ---
  if (sessionLoadingStatus === 'loading' && !currentSession) {
    return <div className="live-class-container page-container status-loading-fullscreen"><Spinner label="Loading session..." size="large" /></div>;
  }

  if (sessionLoadingStatus === 'failed' && sessionError) {
    return (
      <div className="live-class-container page-container status-error-fullscreen">
        <FaVideoSlash size={50} />
        <h2>Error Loading Session</h2>
        <p>{typeof sessionError === 'string' ? sessionError : 'Could not load session details.'}</p>
        <button onClick={() => dispatch(fetchCurrentLiveSession(sessionId))}>Try Again</button>
      </div>
    );
  }

  if (!currentSession && sessionLoadingStatus !== 'loading') {
    return <div className="live-class-container page-container status-loading-fullscreen"><p>No session data available. It might have ended or not started.</p></div>;
  }


  const sessionTitleDisplay = currentSession?.title || 'Live Doubt Class';
  const currentStatus = currentSession?.status || 'loading';
  const streamUrl = currentSession?.streamUrl;
  const startTime = currentSession?.startTime ? new Date(currentSession.startTime).toLocaleString('en-IN') : null;


  return (
    <motion.div
      layout
      transition={fullscreenTransition}
      className={`live-class-container ${isFullScreen ? 'fullscreen-mode' : ''}`}
    >
      <header className="live-header">
        <div className="header-text">
          <h1 className="page-title">{sessionTitleDisplay}</h1>
          <span className={`status-indicator ${getStatusClass()}`}>
            {currentStatus === 'live' && <span className="live-pulse"></span>}
            {currentStatus === 'loading' ? 'Loading Status...' : currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
            {currentStatus === 'upcoming' && startTime && ` - Starts at ${startTime.split(', ')[1]}`} {/* Show only time */}
          </span>
        </div>
        <button onClick={toggleFullScreen} className="fullscreen-toggle-button" title={isFullScreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}>
          {isFullScreen ? <FaCompress /> : <FaExpand />}
        </button>
      </header>

      <motion.div className="main-content">
        <div className="video-player-area">
          {currentStatus === 'live' && streamUrl ? (
            <ReactPlayer url={streamUrl} className="react-player" playing={true} controls={true} width='100%' height='100%' />
          ) : (
            <div className="video-placeholder">
              {currentStatus === 'upcoming' && <p>Session is upcoming. Video will appear here once live.</p>}
              {currentStatus === 'ended' && <p>This live session has ended.</p>}
              {currentStatus === 'loading' && <Spinner label="Waiting for video stream..." />}
              {currentStatus === 'live' && !streamUrl && <Spinner label="Connecting to video stream..." />}
              {(!currentStatus || (currentStatus !== 'live' && currentStatus !== 'upcoming' && currentStatus !== 'ended')) && <p>Video stream status is unknown.</p>}
            </div>
          )}
        </div>

        <div className="live-chat-area">
          <h3 className="chat-title">Live Chat</h3>
          {chatStatus === 'connecting' && <div className="chat-status-overlay"><FaSpinner className="fa-spin"/> Connecting to chat...</div>}
          {chatStatus === 'error' && <div className="chat-status-overlay error"><FaCommentSlash/> Chat connection error. Please refresh.</div>}

          <div className="live-message-list" ref={liveMessageListRef}>
            {liveMessages.map((msg) => (
              <div key={msg.id} className={`message ${getMessageClass(msg.sender)}`}>
                {msg.sender !== 'user' && msg.sender !== 'system' && <span className="sender-name">{msg.senderName || msg.sender}</span>}
                <p>{msg.text}</p>
              </div>
            ))}
            {liveMessages.length === 0 && currentStatus !== 'loading' && chatStatus === 'connected' && <p className="no-messages">Chat is empty. Be the first to type!</p>}
          </div>
          <form className="live-input-area" onSubmit={handleSendLiveMessage}>
            <input
              type="text"
              placeholder={(currentStatus === 'live' && chatStatus === 'connected') ? "Ask a question..." : "Chat disabled"}
              value={liveInputValue}
              onChange={handleLiveInputChange}
              className="input-field"
              disabled={currentStatus !== 'live' || chatStatus !== 'connected'}
            />
            <button
              type="submit"
              className="send-button"
              disabled={!liveInputValue.trim() || currentStatus !== 'live' || chatStatus !== 'connected'}
            >
              Send
            </button>
          </form>
           {sendMessageError && <p className="send-error-message">Failed to send: {sendMessageError}</p>}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default DoubtLiveClassPage;