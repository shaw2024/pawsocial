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
  const [showRoomDropdown, setShowRoomDropdown] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    if (selectedRoom) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000); // Poll for new messages every 3s
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
    <div className="community-container">
      <div className="community-chat">
        {currentRoom ? (
          <>
            <div className="chat-header">
              <div className="header-top">
                <h2>{currentRoom.name}</h2>
                <div className="room-dropdown-container">
                  <button 
                    className="room-dropdown-btn"
                    onClick={() => setShowRoomDropdown(!showRoomDropdown)}
                    title="Select a different room"
                  >
                    💬 {rooms.length} Rooms ▼
                  </button>
                  {showRoomDropdown && (
                    <div className="room-dropdown-menu">
                      {rooms.map(room => (
                        <button
                          key={room._id}
                          className={`dropdown-room-item ${selectedRoom === room._id ? 'active' : ''}`}
                          onClick={() => {
                            setSelectedRoom(room._id);
                            setShowRoomDropdown(false);
                          }}
                          title={room.description}
                        >
                          <div className="dropdown-room-name">{room.name}</div>
                          <div className="dropdown-room-topic">{room.topic}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <p>{currentRoom.description}</p>
            </div>

            <div className="messages-container">
              {messages.length === 0 ? (
                <div className="no-messages">
                  <p>No messages yet. Be the first to start a conversation! 💬</p>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div key={idx} className={`message ${msg.isAI ? 'ai-message' : 'user-message'}`}>
                    <div className="message-header">
                      <strong>{msg.userName}</strong>
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

            <form className="message-form" onSubmit={handleSendMessage}>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Ask a question or share your thoughts..."
                disabled={loading}
              />
              <button type="submit" disabled={loading || !newMessage.trim()}>
                {loading ? '⏳' : '📤'} Send
              </button>
            </form>
          </>
        ) : (
          <div className="loading-container">
            <p>Loading chat rooms...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Community;
