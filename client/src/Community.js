import React, { useState, useEffect, useRef } from 'react';
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

function Community({ user }) {
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    if (selectedRoom) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedRoom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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

      setMessages([...messages, response.data.userMessage, response.data.aiMessage]);
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setLoading(false);
    }
  };

  const currentRoom = rooms.find(r => r._id === selectedRoom);

  return (
    <div className="community-wrapper">
      <div className="community-container">
        {/* Room Selection - Horizontal Scrollable on Mobile */}
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
                <h2>{currentRoom.name}</h2>
                <p>{currentRoom.description}</p>
              </div>

              {/* Messages */}
              <div className="messages-container">
                {messages.length === 0 ? (
                  <div className="no-messages">
                    <p>💬 No messages yet. Be the first to start a conversation!</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <div key={idx} className={`message ${msg.isAI ? 'ai-message' : 'user-message'}`}>
                      <div className="message-meta">
                        <span className="message-sender">{msg.userName}</span>
                        <span className="message-time">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="message-content">{msg.text}</div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Form */}
              <form className="message-input-form" onSubmit={handleSendMessage}>
                <input
                  type="text"
                  className="message-input"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  disabled={loading}
                  autoComplete="off"
                />
                <button
                  type="submit"
                  className="send-btn"
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
