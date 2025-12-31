import React, { useState, useEffect, useRef } from 'react';
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

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await api.get('/community-rooms');
        setRooms(response.data);
        if (response.data.length > 0) {
          setSelectedRoom(response.data[0]._id);
        }
      } catch (err) {
        console.error('Error fetching rooms:', err);
      }
    };
    fetchRooms();
  }, []);

  useEffect(() => {
    if (!selectedRoom) return;

    const fetchMessages = async () => {
      try {
        const response = await api.get(`/community-rooms/${selectedRoom}/messages`);
        setMessages(response.data);
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView();
        }
      } catch (err) {
        console.error('Error fetching messages:', err);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [selectedRoom]);

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
    <div className="community-main">
      <div className="room-list">
        {rooms.map(room => (
          <button
            key={room._id}
            className={selectedRoom === room._id ? 'room-btn active' : 'room-btn'}
            onClick={() => setSelectedRoom(room._id)}
          >
            {room.name}
          </button>
        ))}
      </div>

      <div className="chat-box">
        {currentRoom && (
          <>
            <div className="chat-header">
              <h2>{currentRoom.name}</h2>
              <p>{currentRoom.description}</p>
            </div>

            <div className="messages-box">
              {messages.map((msg, idx) => (
                <div key={idx} className={msg.isAI ? 'msg ai-msg' : 'msg user-msg'}>
                  <strong>{msg.userName}</strong>
                  <p>{msg.text}</p>
                  <small>{new Date(msg.createdAt).toLocaleTimeString()}</small>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form className="msg-input" onSubmit={handleSendMessage}>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                disabled={loading}
              />
              <button type="submit" disabled={loading || !newMessage.trim()}>Send</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default Community;
