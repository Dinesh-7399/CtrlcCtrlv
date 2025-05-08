import React, { useState, useEffect, useRef } from 'react';
import ReactPlayer from 'react-player/lazy';
// Import motion
import { motion } from 'framer-motion';
import { FaExpand, FaCompress } from 'react-icons/fa';
import './DoubtLiveClassPage.css'; // Import the regular CSS file

const courseName = "Advanced Quantum Physics"; // Placeholder

function DoubtLiveClassPage() {
  const [sessionTitle, setSessionTitle] = useState('');
  const [liveStatus, setLiveStatus] = useState('loading');
  const [streamUrl, setStreamUrl] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [liveMessages, setLiveMessages] = useState([]);
  const [liveInputValue, setLiveInputValue] = useState('');
  const [isFullScreen, setIsFullScreen] = useState(false); // State for fullscreen toggle

  const liveMessageListRef = useRef(null);

  // --- Fetch Session Data (Placeholder - No Changes) ---
  useEffect(() => {
    // ... same fetch logic ...
    console.log("Fetching live session details (simulated)...");
    setTimeout(() => { /* ... same simulation ... */
       const scenario = Math.random();
       if (scenario < 0.3) { setSessionTitle("Live Q&A Session - Week 5"); setStreamUrl('https://www.youtube.com/watch?v=ysz5S6PUM-U'); setLiveStatus('live'); setLiveMessages([{ id: Date.now(), sender: 'system', text: 'Welcome to the live session!' }]); }
       else if (scenario < 0.7) { setSessionTitle("Upcoming Doubt Clearing Session"); const upcomingTime = new Date(Date.now() + 2 * 60 * 60 * 1000); setStartTime(upcomingTime.toLocaleString('en-IN')); setStreamUrl(null); setLiveStatus('upcoming'); setLiveMessages([{ id: Date.now(), sender: 'system', text: `Session starting soon at ${upcomingTime.toLocaleTimeString('en-IN')}...` }]); }
       else { setSessionTitle("Previous Doubt Session"); setStreamUrl(null); setLiveStatus('ended'); setLiveMessages([{ id: Date.now(), sender: 'system', text: 'This live session has ended.' }]); }
    }, 1500);
  }, []);

  // --- WebSocket for Live Chat (Placeholder - No Changes) ---
  useEffect(() => {
    // ... same websocket logic ...
     if (liveStatus === 'live') { console.log("Connecting..."); const intervalId = setInterval(() => { const randomMsg = { id: Date.now(), sender: 'other_user', text: `Random question ${Math.random().toFixed(2)}` }; setLiveMessages(prev => [...prev, randomMsg]); }, 5000); return () => { console.log("Disconnecting..."); clearInterval(intervalId); }; }
  }, [liveStatus]);

  // --- Scroll live chat to bottom (No Changes) ---
  useEffect(() => {
    // ... same scroll logic ...
     if (liveMessageListRef.current) { liveMessageListRef.current.scrollTop = liveMessageListRef.current.scrollHeight; }
  }, [liveMessages]);

  // --- Handlers (No Changes to Send/Input Logic) ---
  const handleSendLiveMessage = (event) => { /* ... same logic ... */ event.preventDefault(); const trimmedInput = liveInputValue.trim(); if (!trimmedInput || liveStatus !== 'live') return; const userMessage = { id: Date.now(), sender: 'user', text: trimmedInput }; setLiveMessages(prev => [...prev, userMessage]); setLiveInputValue(''); console.log("Sending msg:", trimmedInput); };
  const handleLiveInputChange = (event) => setLiveInputValue(event.target.value);
  const getMessageClass = (sender) => { /* ... same logic ... */ switch (sender) { case 'user': return 'user-message'; case 'system': return 'system-message'; default: return 'participant-message';} };
  const getStatusClass = () => { /* ... same logic ... */ switch (liveStatus) { case 'live': return 'status-live'; case 'upcoming': return 'status-upcoming'; case 'ended': return 'status-ended'; default: return 'status-loading';} };
  // --- End Handlers ---

  // --- Fullscreen Toggle Handler (No Changes) ---
  const toggleFullScreen = () => setIsFullScreen(!isFullScreen);
  // --- End Fullscreen Handler ---

  // Define the transition for the layout animation
  const fullscreenTransition = {
      duration: 0.4, // Adjust duration as needed
      ease: "easeInOut" // Adjust easing as needed
  };

  // --- Render JSX ---
  return (
    // Convert outer div to motion.div and add layout + transition props
    <motion.div
        layout // Enable layout animation
        transition={fullscreenTransition} // Apply the defined transition
        className={`live-class-container ${isFullScreen ? 'fullscreen-mode' : ''}`}
    >
      {/* Header */}
      <header className="live-header">
        <div className="header-text">
          <h1 className="page-title">{sessionTitle || 'Live Doubt Class'}</h1>
          <span className={`status-indicator ${getStatusClass()}`}>
            {liveStatus === 'live' && <span className="live-pulse"></span>}
            {liveStatus === 'loading' ? 'Loading...' : liveStatus.charAt(0).toUpperCase() + liveStatus.slice(1)}
            {liveStatus === 'upcoming' && startTime && ` - Starts at ${startTime}`}
          </span>
        </div>
        {/* Fullscreen Toggle Button */}
        <button
            onClick={toggleFullScreen}
            className="fullscreen-toggle-button"
            title={isFullScreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        >
            {isFullScreen ? <FaCompress /> : <FaExpand />}
        </button>
      </header>

      {/* Main Content Area (Video + Chat) */}
      {/* Add initial/animate props if you want content to fade/slide, otherwise layout handles container */}
      <motion.div className="main-content">
        {/* Video Player Area */}
        <div className="video-player-area">
         {/* ... Video Player Logic ... */}
         {liveStatus === 'live' && streamUrl ? (<ReactPlayer url={streamUrl} className="react-player" playing={true} controls={true} width='100%' height='100%' />) : (<div className="video-placeholder">{/* ... placeholder text ... */}</div>)}
        </div>

        {/* Live Chat Area */}
        <div className="live-chat-area">
          <h3 className="chat-title">Live Chat</h3>
          <div className="live-message-list" ref={liveMessageListRef}>
            {/* ... message mapping ... */}
            {liveMessages.map((msg) => (<div key={msg.id} className={`message ${getMessageClass(msg.sender)}`}>{msg.sender !== 'user' && msg.sender !== 'system' && <span className="sender-name">{msg.sender}</span>}<p>{msg.text}</p></div>))}
            {liveMessages.length === 0 && liveStatus !== 'loading' && <p className="no-messages">Chat is empty.</p>}
          </div>
          <form className="live-input-area" onSubmit={handleSendLiveMessage}>
             {/* ... input and button ... */}
             <input type="text" placeholder={liveStatus === 'live' ? "Ask a question..." : "Chat disabled"} value={liveInputValue} onChange={handleLiveInputChange} className="input-field" disabled={liveStatus !== 'live'} />
             <button type="submit" className="send-button" disabled={!liveInputValue.trim() || liveStatus !== 'live'}> Send </button>
          </form>
        </div>
      </motion.div>
    </motion.div> // Close motion.div
  );
}

export default DoubtLiveClassPage;