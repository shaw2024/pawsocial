import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import axios from 'axios';
import './Community.css';

// Use production API for GitHub Pages, localhost for development
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.port === '3000'
  ? 'http://localhost:4000'
  : 'https://pawsocial-api.onrender.com';

const api = axios.create({
  baseURL: API_URL,
  timeout: 60000
});

// Memoized Message Component to prevent unnecessary re-renders
const Message = React.memo(({ msg, idx }) => (
  <div key={idx} className={`message ${msg.isAI ? 'ai-message' : 'user-message'}`}>
    <div className="message-meta">
      <span className="message-sender">{msg.userName}</span>
      <span className="message-time">
        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
    <div className="message-content">{msg.text}</div>
  </div>
));

Message.displayName = 'Message';

function Community({ user }) {
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [initialLoadingComplete, setInitialLoadingComplete] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const hasUserSentMessage = useRef(false);
  const pollIntervalRef = useRef(null);
  const lastMessageCountRef = useRef(0);

  // Display only the last 30 messages to improve performance
  const displayedMessages = useMemo(() => {
    const limit = 30;
    return messages.length > limit ? messages.slice(-limit) : messages;
  }, [messages]);

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    if (selectedRoom) {
      setInitialLoadingComplete(false);
      fetchMessages();
      // Increased polling interval from 3s to 5s to reduce server load and re-renders
      pollIntervalRef.current = setInterval(fetchMessages, 5000);
      return () => {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      };
    }
  }, [selectedRoom]);

  useEffect(() => {
    // Only auto-scroll if user just sent a message
    if (hasUserSentMessage.current && messagesContainerRef.current) {
      requestAnimationFrame(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      });
      hasUserSentMessage.current = false;
    }
  }, [displayedMessages]);

  const fetchRooms = useCallback(async () => {
    try {
      const response = await api.get('/community-rooms');
      setRooms(response.data);
      if (response.data.length > 0 && !selectedRoom) {
        setSelectedRoom(response.data[0]._id);
      }
    } catch (err) {
      console.error('Error fetching rooms:', err);
    }
  }, [selectedRoom]);

  const fetchMessages = useCallback(async () => {
    if (!selectedRoom) return;
    try {
      const response = await api.get(`/community-rooms/${selectedRoom}/messages`);
      const newCount = response.data.length;
      // Only update state if message count changed to reduce unnecessary re-renders
      if (newCount !== lastMessageCountRef.current) {
        setMessages(response.data);
        lastMessageCountRef.current = newCount;
      }
      if (!initialLoadingComplete) {
        setInitialLoadingComplete(true);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  }, [selectedRoom, initialLoadingComplete]);

  const handleSendMessage = useCallback(async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedRoom) return;

    setLoading(true);
    hasUserSentMessage.current = true;
    try {
      const response = await api.post(`/community-rooms/${selectedRoom}/message`, {
        userId: user.id,
        userName: user.email.split('@')[0],
        userEmail: user.email,
        text: newMessage
      });

      // Only add aiMessage if it exists (not null for meetup rooms)
      if (response.data.aiMessage) {
        setMessages(prev => [...prev, response.data.userMessage, response.data.aiMessage]);
      } else {
        setMessages(prev => [...prev, response.data.userMessage]);
      }
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setLoading(false);
    }
  }, [newMessage, selectedRoom, user]);

  const currentRoom = rooms.find(r => r._id === selectedRoom);

  return (
    <div className="community-wrapper">
      <div className="community-container">
        {/* Room Selection - Horizontal Scrollable on Mobile - Hidden on Mobile */}
        <div className="room-selector">
          <div className="rooms-scroll">
            {rooms.map(room => (
              <button
                key={room._id}
                className={`room-btn ${selectedRoom === room._id ? 'active' : ''}`}
                onClick={() => setSelectedRoom(room._id)}
                title={room.description}
              >
                <div className="room-name">{room.name}</div>
                <div className="room-topic">{room.topic}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="chat-area">
          {currentRoom && (
            <>
              {/* Header */}
              <div className="chat-header">
                <div className="header-top">
                  <h2>{currentRoom.name}</h2>
                  <div className="topic-dropdown">
                    <button 
                      className="topic-dropdown-btn"
                      onClick={() => setShowDropdown(!showDropdown)}
                    >
                      {currentRoom.topic} ▼
                    </button>
                    {showDropdown && (
                      <div className="topic-dropdown-menu">
                        {rooms.map(room => (
                          <button
                            key={room._id}
                            className={`topic-option ${selectedRoom === room._id ? 'active' : ''}`}
                            onClick={() => {
                              setSelectedRoom(room._id);
                              setShowDropdown(false);
                            }}
                          >
                            {room.name} - {room.topic}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <p>{currentRoom.description}</p>
              </div>

              {/* Messages */}
              <div className="messages-container" ref={messagesContainerRef}>
                {!initialLoadingComplete ? (
                  <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Loading messages...</p>
                  </div>
                ) : displayedMessages.length === 0 ? (
                  <div className="no-messages">
                    <p>💬 No messages yet. Be the first to start a conversation!</p>
                  </div>
                ) : (
                  displayedMessages.map((msg, idx) => (
                    <Message key={`${msg._id || idx}`} msg={msg} idx={idx} />
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Form */}
              <form className="message-form" onSubmit={handleSendMessage}>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  disabled={loading}
                  autoComplete="off"
                />
                <button
                  type="submit"
                  disabled={loading || !newMessage.trim()}
                >
                  {loading ? '⏳' : '📤'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Community;
