import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
// Import motion and icons
import { motion, AnimatePresence } from 'framer-motion'; // <--- Added AnimatePresence back for message animation
import { FaPaperclip, FaTimes, FaExpand, FaCompress, FaPlus } from 'react-icons/fa';
import './DoubtChatPage.css'; // Use regular CSS file

// --- Placeholder Data & Logic ---
const courseName = "Advanced Quantum Physics";
const placeholderChatHistory = [
  { id: 'chat1', title: 'April 28th - Quantum Entanglement', lastMessage: 'Okay, that makes sense now...' },
  { id: 'chat2', title: 'April 25th - Wave Function Collapse', lastMessage: 'Can you explain superposition again?' },
  { id: 'chat3', title: 'April 22nd - Schrödinger Equation Basics', lastMessage: 'Got it, thanks!' },
];
// -------------------------------

function DoubtChatPage() {
  // State
  const [messages, setMessages] = useState([ { id: 1, sender: 'bot', text: `Welcome... (Current Session)` } ]);
  const [inputValue, setInputValue] = useState('');
  const [chatMode, setChatMode] = useState('bot');
  const [instructorStatus, setInstructorStatus] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [filesToSend, setFilesToSend] = useState([]);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState('current');
  const [chatHistory, setChatHistory] = useState(placeholderChatHistory);

  const messageListRef = useRef(null);

  // --- Effects ---
  // Scroll message list to bottom
  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [messages]);

  // Load chat messages based on selection (Placeholder)
  useEffect(() => {
    console.log("Selected Chat ID:", selectedChatId);
    if (selectedChatId !== 'current') {
      setMessages([
          { id: Date.now(), sender: 'system', text: `Loading history for: ${chatHistory.find(c=>c.id === selectedChatId)?.title || selectedChatId}...` },
          // Add dummy past messages
           { id: Date.now()+1, sender: 'user', text: 'This is a message from the past.' },
           { id: Date.now()+2, sender: 'instructor', text: 'This is an instructor response from the past.' },
      ]);
    } else {
       setMessages([{ id: 1, sender: 'bot', text: `Welcome back to the current session!` }]);
    }
    setInputValue('');
    setFilesToSend([]);
  }, [selectedChatId, chatHistory]);


  // --- Handlers ---
  const handleModeChange = (event) => { /* ... */ };
  const handleInputChange = (event) => setInputValue(event.target.value);
  const onDrop = useCallback((acceptedFiles, fileRejections) => { /* ... */ }, []);
  const removeFile = (fileName) => setFilesToSend(prevFiles => prevFiles.filter(file => file.name !== fileName));
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({ onDrop, noClick: true, noKeyboard: true, multiple: true });

    // Get message props including class and animation variants
  const getMessageProps = (sender) => {
    let className = 'message ';
    let initial = { opacity: 0, y: 10 };
    let animate = { opacity: 1, y: 0 };
    let transition = { duration: 0.3, ease: "easeOut" };

    switch (sender) {
      case 'user':
        className += 'user-message';
        initial = { opacity: 0, x: 20 }; // From right
        animate = { opacity: 1, x: 0 };
        break;
      case 'bot':
      case 'instructor':
        className += sender === 'bot' ? 'bot-message' : 'instructor-message';
        initial = { opacity: 0, x: -20 }; // From left
        animate = { opacity: 1, x: 0 };
        break;
      case 'system':
        className += 'system-message';
        initial = { opacity: 0, scale: 0.95 }; // Fade/scale
        animate = { opacity: 1, scale: 1 };
        break;
      default:
        className += 'bot-message';
        initial = { opacity: 0, x: -20 };
        animate = { opacity: 1, x: 0 };
        break;
    }
    // Ensure text prop exists for conditional rendering later if needed
     // Ensure text prop exists, handling cases where msg.text might be empty or undefined
    const textExists = typeof messages.find(msg => msg.id === (arguments[1]?.id))?.text === 'string'; // Check if text exists if msg object is passed

    return { className, initial, animate, transition };
  };


  const toggleFullScreen = () => setIsFullScreen(!isFullScreen);
  const handleSelectChat = (chatId) => { /* ... */ };
  const handleSendMessage = (event) => { /* ... */ };
  // --- End Handlers ---

  // Framer Motion transition
  const layoutTransition = { duration: 0.3, ease: "easeInOut" };

   // --- Render JSX ---
  console.log('Rendering DoubtChatPage - selectedChatId:', selectedChatId); // Keep debug log

  return (
    <motion.div
      layout
      transition={layoutTransition}
      {...getRootProps({ onClick: e => e.stopPropagation() })}
      className={`chat-page-container ${isFullScreen ? 'fullscreen-mode' : ''} ${isDragActive ? 'dropzone-active' : ''}`}
    >
      <input {...getInputProps()} />

      {/* Header */}
      <header className="chat-header">
        {/* Title */}
        <h2 className="header-title">Chat Support</h2>
        {/* Mode Selector (Conditional) */}
        {selectedChatId === 'current' && (
            <div className="mode-selector">
                <label htmlFor="chatModeSelect">Mode:</label>
                <select id="chatModeSelect" value={chatMode} onChange={handleModeChange} disabled={isConnecting} className="mode-dropdown">
                    <option value="bot">AI Assistant</option>
                    <option value="instructor">Instructor</option>
                </select>
            </div>
        )}
        {/* Spacer */}
        {selectedChatId !== 'current' && <div style={{ flexGrow: 1 }}></div>}
        {/* Fullscreen Button */}
        <button onClick={toggleFullScreen} className="fullscreen-toggle-button" title={isFullScreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}>
             {isFullScreen ? <FaCompress /> : <FaExpand />}
        </button>
      </header>

      {/* Status Messages */}
      {isConnecting && <p className="status-message">Checking availability...</p>}
      {instructorStatus === 'unavailable' && <p className="status-message-error">Instructor unavailable.</p>}
      {instructorStatus === 'connected' && selectedChatId === 'current' && <p className="status-message-success">Connected to instructor!</p>}


      {/* Main Area */}
      <div className="chat-main-area">
        {/* --- Chat History Sidebar --- */}
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
        {/* --- End Sidebar --- */}


        {/* --- Chat View --- */}
        <motion.div layout transition={layoutTransition} className="chat-view">
             {isDragActive && <div className="dropzone-overlay-text">Drop files here...</div>}

             {/* Message List */}
             <div className="message-list" ref={messageListRef}>
               <AnimatePresence initial={false}>
                 {messages.map((msg) => {
                   const motionProps = getMessageProps(msg.sender);
                    // Ensure msg.text exists before rendering the paragraph to avoid errors
                    const textContent = typeof msg.text === 'string' ? msg.text : '';
                   return (
                     <motion.div
                       key={msg.id}
                       layout
                       initial={motionProps.initial}
                       animate={motionProps.animate}
                       exit={{ opacity: 0, scale: 0.8 }}
                       transition={motionProps.transition}
                       className={motionProps.className}
                     >
                       <p>{textContent}</p> {/* Render textContent */}
                     </motion.div>
                   );
                 })}
               </AnimatePresence>
             </div>

             {/* File Preview Area */}
             {filesToSend.length > 0 && selectedChatId === 'current' && (
                 <div className="file-preview-area">
                     {filesToSend.map(file => (
                         <div key={file.name} className="file-preview-item">
                             <span className="file-name">{file.name}</span>
                             <span className="file-size">({(file.size / 1024).toFixed(1)} KB)</span>
                             <button onClick={() => removeFile(file.name)} className="remove-file-button" title="Remove file"> <FaTimes /> </button>
                         </div>
                     ))}
                 </div>
             )}

             {/* Input Area (Conditional) */}
             {selectedChatId === 'current' ? (
                 <form className="input-area" onSubmit={handleSendMessage}>
                     <button type="button" onClick={open} className="attach-button" title="Attach files" disabled={isConnecting || (chatMode === 'instructor' && instructorStatus !== 'connected')}> <FaPaperclip /> </button>
                     <input type="text" placeholder={ chatMode === 'instructor' && instructorStatus !== 'connected' ? "Connect to instructor..." : "Type your message or drop files..." } value={inputValue} onChange={handleInputChange} className="input-field" disabled={isConnecting || (chatMode === 'instructor' && instructorStatus !== 'connected')} />
                     <button type="submit" className="send-button" disabled={(!inputValue.trim() && filesToSend.length === 0) || isConnecting || (chatMode === 'instructor' && instructorStatus !== 'connected')}> Send </button>
                 </form>
             ) : (
                 <div className="input-area history-notice">
                     <p>Viewing past chat history (Read-only).</p>
                     <button onClick={() => handleSelectChat('current')} className='switch-to-current-btn'>Go to Current Chat</button>
                 </div>
             )}
         </motion.div>
         {/* --- End Chat View --- */}

      </div> {/* End Chat Main Area */}
    </motion.div> // End Main Container
  );
}

export default DoubtChatPage;