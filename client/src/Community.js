import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import './Community.css';

const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.port === '3000'
  ? 'http://localhost:4000'
  : 'https://pawsocial-api.onrender.com';

const api = axios.create({
  baseURL: API_URL,
  timeout: 60000
});

function Community({ user }) {
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Fetch rooms on mount
  useEffect(() => {
    fetchRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch messages when room changes
  useEffect(() => {
    if (selectedRoom) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRoom]);

  const fetchRooms = async () => {
    try {
      const response = await api.get('/community-rooms');
      setRooms(response.data);
      if (response.data.length > 0 && !selectedRoom) {
        setSelectedRoom(response.data[0]._id);
      }
    } catch (err) {
      console.error('Error fetching rooms:', err);
    }
  };

  const fetchMessages = async () => {
    if (!selectedRoom) return;
    try {
      const response = await api.get(`/community-rooms/${selectedRoom}/messages`);
      setMessages(response.data);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedRoom) return;

    setLoading(true);
    try {
      const response = await api.post(`/community-rooms/${selectedRoom}/message`, {
        userId: user.id,
        userName: user.email.split('@')[0],
        userEmail: user.email,
        text: newMessage
      });

      // Add user message and AI message (if exists)
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
  };

  const currentRoom = rooms.find(r => r._id === selectedRoom);

  return (
    <div className="community-container">
      {/* Room Selector */}
      <div className="room-list">
        {rooms.map(room => (
          <button
            key={room._id}
            className={`room-item ${selectedRoom === room._id ? 'active' : ''}`}
            onClick={() => setSelectedRoom(room._id)}
            title={room.description}
          >
            {room.name}
          </button>
        ))}
      </div>

      {/* Chat Window */}
      <div className="chat-window">
        {currentRoom ? (
          <>
            {/* Header */}
            <div className="chat-header">
              <h2>{currentRoom.name}</h2>
              <p>{currentRoom.description}</p>
            </div>

            {/* Messages Area */}
            <div className="messages-area" ref={messagesContainerRef}>
              {messages.length === 0 ? (
                <div className="empty-state">
                  <p>💬 No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div key={`${msg._id || idx}`} className={`message ${msg.isAI ? 'ai-message' : 'user-message'}`}>
                    <div className="message-header">
                      <span className="sender-name">{msg.userName}</span>
                      <span className="message-time">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="message-text">{msg.text}</div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="input-area">
              <form className="message-form" onSubmit={handleSendMessage}>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  disabled={loading}
                />
                <button type="submit" disabled={loading || !newMessage.trim()}>
                  {loading ? '⏳' : 'Send'}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="no-room">
            <p>Select a room to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Community;
