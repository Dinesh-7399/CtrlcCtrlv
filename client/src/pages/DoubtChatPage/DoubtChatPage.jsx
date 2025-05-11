// client/src/pages/DoubtChatPage/DoubtChatPage.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom'; // Assuming courseId might come from URL
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPaperclip, FaTimes, FaExpand, FaCompress, FaPlus, FaCommentSlash, FaWifi, FaUserTie } from 'react-icons/fa';
import './DoubtChatPage.css';

// --- Redux Imports ---
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../../context/AuthContext'; // To get current user ID and name
import {
  initializeChatSession,
  sendMessage,
  addMessage, // For optimistic updates if needed, or if server doesn't echo
  setSelectedChatId,
  setInstructorStatus, // May not be needed if backend pushes this via socket
  setIsConnectingToInstructor,
  clearChatMessages,
  selectChatMessages,
  selectChatHistoryList,
  selectSelectedChatId,
  selectChatConnectionStatus,
  selectInstructorStatus,
  selectIsConnectingToInstructor,
  selectChatError,
  selectSendMessageError,
  clearChatError,
} from '../../features/chat/chatSlice';
import { socketService }from '../../services/socketService'; // For direct emits if not using thunks for all

// --- Component Imports ---
import Spinner from '../../components/common/Spinner'; // Assuming you have a Spinner

// --- Placeholder Data & Logic (can be removed if chatHistoryList comes from Redux) ---
const courseName = "Advanced Quantum Physics"; // Example, should come from course context/props

function DoubtChatPage() {
  const { courseIdFromParams } = useParams(); // Get courseId if page is specific to a course
  const dispatch = useDispatch();
  const { user: currentUser, isAuthenticated } = useAuth(); // Get current logged-in user

  // --- Redux State ---
  const messages = useSelector(selectChatMessages);
  const chatHistory = useSelector(selectChatHistoryList); // From Redux now
  const selectedChatId = useSelector(selectSelectedChatId);
  const connectionStatus = useSelector(selectChatConnectionStatus);
  const instructorStatusRedux = useSelector(selectInstructorStatus);
  const isConnectingToInstructorRedux = useSelector(selectIsConnectingToInstructor);
  const chatError = useSelector(selectChatError);
  const sendMessageError = useSelector(selectSendMessageError);

  // --- Local UI State ---
  const [inputValue, setInputValue] = useState('');
  const [chatMode, setChatMode] = useState('bot'); // 'bot' or 'instructor'
  const [filesToSend, setFilesToSend] = useState([]);
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  const messageListRef = useRef(null);
  const courseId = courseIdFromParams || "defaultCourse"; // Use from params or a default/prop

  // --- Effects ---
  // Initialize and manage chat session
  useEffect(() => {
    if (isAuthenticated && currentUser?.id) {
        // Pass currentUserId for message sender identification
        dispatch(initializeChatSession({ courseId, sessionId: 'current', currentUserId: currentUser.id }));
    }
    return () => {
      socketService.disconnect(); // Ensure disconnection on component unmount
      dispatch(clearChatMessages()); // Clear messages for this session
      dispatch(clearChatError());
    };
  }, [dispatch, courseId, isAuthenticated, currentUser?.id]);

  // Scroll message list to bottom
  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [messages]);

  // Load messages or reset based on selectedChatId (from Redux)
  useEffect(() => {
    console.log("Selected Chat ID (from Redux):", selectedChatId);
    if (selectedChatId !== 'current') {
      // TODO: Dispatch an action to load historical messages for selectedChatId
      // For now, clearing and showing a system message as before.
      dispatch(clearChatMessages());
      dispatch(addMessage({ id: Date.now(), sender: 'system', text: `Loading history for chat: ${chatHistory.find(c => c.id === selectedChatId)?.title || selectedChatId}... (Placeholder)` }));
      // Simulate loading historical data
      setTimeout(() => {
         dispatch(addMessage({ id: Date.now()+1, sender: 'user', text: 'This is a message from the past.' }));
         dispatch(addMessage({ id: Date.now()+2, sender: 'instructor', text: 'This is an instructor response from the past.' }));
      }, 500);

    } else if (messages.length === 0 || messages[0]?.sender !== 'bot' || !messages[0]?.text.includes('Welcome')) {
      // If current chat is selected and messages are empty or not the welcome message
      dispatch(clearChatMessages());
      dispatch(addMessage({ id: `sys-${Date.now()}`, sender: 'bot', text: `Welcome to ${courseName} chat support! How can I help you today? (Current Session)` }));
    }
    setInputValue('');
    setFilesToSend([]);
  }, [selectedChatId, dispatch, chatHistory, courseName]); // Removed messages from deps to avoid loop with welcome message

  // --- Handlers ---
  const handleModeChange = (event) => {
    const newMode = event.target.value;
    setChatMode(newMode);
    dispatch(clearChatError()); // Clear errors on mode change

    if (newMode === 'instructor') {
      dispatch(setIsConnectingToInstructor(true));
      // Backend should emit 'instructorStatusUpdate' via socket
      // Example: socketService.emit('requestInstructorConnect', { courseId });
      // Simulating the process for now:
      console.log("Attempting to connect to instructor...");
      // Backend would determine availability and send 'instructorStatusUpdate'
      // This is now handled by the 'instructorStatusUpdate' socket event in chatSlice
    } else { // Switched to 'bot'
      dispatch(setIsConnectingToInstructor(false));
      dispatch(setInstructorStatus(null)); // Reset instructor status
      if (connectionStatus === 'connected') { // If connected to instructor, maybe send a "switchedToBot" event
         // socketService.emit('switchedToBot', { courseId });
      }
      dispatch(addMessage({ id: `sys-${Date.now()}`, sender: 'system', text: 'Switched to AI Assistant.' }));
    }
  };

  const handleInputChange = (event) => setInputValue(event.target.value);
  
  const onDrop = useCallback((acceptedFiles, fileRejections) => {
    setFilesToSend(prevFiles => [...prevFiles, ...acceptedFiles.map(file => Object.assign(file, { preview: URL.createObjectURL(file) }))]);
    if (fileRejections.length > 0) {
      console.error("File Rejections:", fileRejections);
      dispatch(addMessage({ id: `syserr-${Date.now()}`, sender: 'system', text: `File Error: ${fileRejections[0].errors[0].message}` }));
    }
  }, [dispatch]);

  const removeFile = (fileName) => {
    setFilesToSend(prevFiles => prevFiles.filter(file => {
      if (file.name === fileName) URL.revokeObjectURL(file.preview); // Clean up preview URL
      return file.name !== fileName;
    }));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, noClick: true, noKeyboard: true, multiple: true });

  const getMessageProps = (sender) => {
    // ... (getMessageProps remains largely the same as in user's code, adjust if needed for new sender types)
    let className = 'message ';
    let initial = { opacity: 0, y: 10 };
    let animate = { opacity: 1, y: 0 };
    let transition = { duration: 0.3, ease: "easeOut" };

    switch (sender) {
      case 'user': className += 'user-message'; initial = { opacity: 0, x: 20 }; animate = { opacity: 1, x: 0 }; break;
      case 'bot': className += 'bot-message'; initial = { opacity: 0, x: -20 }; animate = { opacity: 1, x: 0 }; break;
      case 'instructor': className += 'instructor-message'; initial = { opacity: 0, x: -20 }; animate = { opacity: 1, x: 0 }; break;
      case 'system': className += 'system-message'; initial = { opacity: 0, scale: 0.95 }; animate = { opacity: 1, scale: 1 }; break;
      default: className += 'bot-message'; initial = { opacity: 0, x: -20 }; animate = { opacity: 1, x: 0 }; break;
    }
    return { className, initial, animate, transition };
  };

  const toggleFullScreen = () => setIsFullScreen(!isFullScreen);

  const handleSelectChat = (chatId) => {
    dispatch(setSelectedChatId(chatId));
    // Reset chat mode/instructor status when switching to current or new chat
    if (chatId === 'current') {
      setChatMode('bot'); // Default to bot mode for current session
      dispatch(setIsConnectingToInstructor(false));
      dispatch(setInstructorStatus(null));
    }
  };

  const handleSendMessage = (event) => {
    event.preventDefault();
    const trimmedInput = inputValue.trim();
    if ((!trimmedInput && filesToSend.length === 0) || selectedChatId !== 'current') {
      if (selectedChatId !== 'current') console.warn("Cannot send message in historical chat view.");
      return;
    }
    if (chatMode === 'instructor' && instructorStatusRedux !== 'connected') {
      dispatch(addMessage({ id: `syserr-${Date.now()}`, sender: 'system', text: 'Please connect to an instructor first or switch to AI mode.' }));
      return;
    }

    // Dispatch sendMessage thunk
    dispatch(sendMessage({
      courseId, // Or relevant room/session ID
      text: trimmedInput,
      files: filesToSend, // Pass file objects; thunk/service will handle upload logic
      userId: currentUser?.id,
      userName: currentUser?.name
    }));

    // Optimistic UI updates for sent message:
    // The `sendMessage` thunk can handle this, or the 'newMessage' socket event can add it.
    // If purely optimistic (and server doesn't echo back user's own messages immediately):
    // dispatch(addMessage({ id: `temp-${Date.now()}`, sender: 'user', text: trimmedInput, attachments: filesToSend.map(f=>({fileName: f.name})) }));
    
    setInputValue('');
    setFilesToSend([]); // Clear files after attempting to send
  };
  // --- End Handlers ---

  const layoutTransition = { duration: 0.3, ease: "easeInOut" };

  return (
    <motion.div
      layout
      transition={layoutTransition}
      {...getRootProps({ onClick: e => e.stopPropagation() })}
      className={`chat-page-container ${isFullScreen ? 'fullscreen-mode' : ''} ${isDragActive ? 'dropzone-active' : ''}`}
    >
      <input {...getInputProps()} />

      <header className="chat-header">
        <h2 className="header-title">{courseName} - Chat Support</h2>
        {selectedChatId === 'current' && (
            <div className="mode-selector">
                <label htmlFor="chatModeSelect">Mode:</label>
                <select id="chatModeSelect" value={chatMode} onChange={handleModeChange} disabled={isConnectingToInstructorRedux || connectionStatus === 'connecting'} className="mode-dropdown">
                    <option value="bot">AI Assistant</option>
                    <option value="instructor">Instructor</option>
                </select>
            </div>
        )}
        {selectedChatId !== 'current' && <div style={{ flexGrow: 1 }}></div>}
        <button onClick={toggleFullScreen} className="fullscreen-toggle-button" title={isFullScreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}>
             {isFullScreen ? <FaCompress /> : <FaExpand />}
        </button>
      </header>

        {/* Status Messages from Redux */}
        {connectionStatus === 'connecting' && <p className="status-message"><Spinner size="inline" /> Connecting to chat...</p>}
        {connectionStatus === 'error' && chatError && <p className="status-message-error"><FaCommentSlash /> Chat Error: {typeof chatError === 'string' ? chatError : JSON.stringify(chatError)}</p>}
        
        {selectedChatId === 'current' && chatMode === 'instructor' && (
            <>
                {isConnectingToInstructorRedux && instructorStatusRedux === 'checking' && <p className="status-message"><Spinner size="inline" /> Connecting to instructor...</p>}
                {instructorStatusRedux === 'unavailable' && <p className="status-message-error"><FaUserTie style={{opacity: 0.7}}/> Instructor is currently unavailable.</p>}
                {instructorStatusRedux === 'connected' && <p className="status-message-success"><FaUserTie /> Connected to Instructor!</p>}
            </>
        )}
        {sendMessageError && <p className="status-message-error">Send Error: {typeof sendMessageError === 'string' ? sendMessageError : 'Could not send message.'}</p>}


      <div className="chat-main-area">
        <aside className="chat-history-sidebar">
            <div className="sidebar-header"> <h3>Chat History</h3> </div>
            <div className="sidebar-content">
                 <button className={`history-item ${selectedChatId === 'current' ? 'active' : ''}`} onClick={() => handleSelectChat('current')}> <FaPlus className="history-icon"/> Current Session </button>
                {chatHistory.map(chat => (
                    <button key={chat.id} className={`history-item ${selectedChatId === chat.id ? 'active' : ''}`} onClick={() => handleSelectChat(chat.id)} title={chat.title}>
                        <span className="history-item-title">{chat.title}</span>
                        <span className="history-item-preview">{chat.lastMessage}</span>
                    </button>
                ))}
                {chatHistory.length === 0 && <p className="no-history">No past chats found.</p>}
            </div>
        </aside>

        <motion.div layout transition={layoutTransition} className="chat-view">
             {isDragActive && <div className="dropzone-overlay-text">Drop files here...</div>}
             <div className="message-list" ref={messageListRef}>
               <AnimatePresence initial={false}>
                 {messages.map((msg) => {
                   const motionProps = getMessageProps(msg.sender);
                   const textContent = typeof msg.text === 'string' ? msg.text : '';
                   const attachments = msg.attachments || (msg.filesToSend && msg.filesToSend.length > 0 ? msg.filesToSend : []); // Handle both structures
                   return (
                     <motion.div
                       key={msg.id || `msg-${Math.random()}`} // Ensure key, fallback for temp messages
                       layout
                       initial={motionProps.initial}
                       animate={motionProps.animate}
                       exit={{ opacity: 0, scale: 0.8 }}
                       transition={motionProps.transition}
                       className={motionProps.className}
                     >
                       <p>{textContent}</p>
                       {/* Display attachments if any */}
                       {attachments && attachments.length > 0 && (
                           <div className="message-attachments">
                               {attachments.map((file, index) => (
                                   <div key={index} className="attachment-chip">
                                       <FaPaperclip size="0.8em" /> {file.fileName || file.name}
                                   </div>
                               ))}
                           </div>
                       )}
                     </motion.div>
                   );
                 })}
               </AnimatePresence>
             </div>

            {filesToSend.length > 0 && selectedChatId === 'current' && (
                 <div className="file-preview-area">
                     {filesToSend.map(file => (
                         <div key={file.name} className="file-preview-item">
                             {file.type.startsWith('image/') && file.preview && <img src={file.preview} alt={file.name} className="file-image-preview" />}
                             <span className="file-name">{file.name}</span>
                             <span className="file-size">({(file.size / 1024).toFixed(1)} KB)</span>
                             <button onClick={() => removeFile(file.name)} className="remove-file-button" title="Remove file"> <FaTimes /> </button>
                         </div>
                     ))}
                 </div>
             )}

            {selectedChatId === 'current' ? (
                 <form className="input-area" onSubmit={handleSendMessage}>
                     <button type="button" onClick={open} className="attach-button" title="Attach files" disabled={isConnectingToInstructorRedux || (chatMode === 'instructor' && instructorStatusRedux !== 'connected')}> <FaPaperclip /> </button>
                     <textarea
                        value={inputValue}
                        onChange={handleInputChange}
                        onKeyPress={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e);}}}
                        placeholder={chatMode === 'instructor' && instructorStatusRedux !== 'connected' ? "Waiting for instructor..." : "Type your message or drop files..."}
                        className="input-field"
                        rows={1} // Start with 1 row, CSS will handle expansion
                        disabled={connectionStatus !== 'connected' || isConnectingToInstructorRedux || (chatMode === 'instructor' && instructorStatusRedux !== 'connected')}
                     />
                     <button type="submit" className="send-button" disabled={(!inputValue.trim() && filesToSend.length === 0) || connectionStatus !== 'connected' || isConnectingToInstructorRedux || (chatMode === 'instructor' && instructorStatusRedux !== 'connected')}> Send </button>
                 </form>
             ) : (
                 <div className="input-area history-notice">
                     <p>Viewing past chat history (Read-only).</p>
                     <button onClick={() => handleSelectChat('current')} className='switch-to-current-btn'>Go to Current Chat</button>
                 </div>
             )}
         </motion.div>
      </div>
    </motion.div>
  );
}

export default DoubtChatPage;