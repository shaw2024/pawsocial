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
  const [meetups, setMeetups] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showMeetupForm, setShowMeetupForm] = useState(false);
  const [meetupForm, setMeetupForm] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    city: ''
  });
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

    const fetchMeetups = async () => {
      try {
        const response = await api.get('/meetups');
        setMeetups(response.data);
      } catch (err) {
        console.error('Error fetching meetups:', err);
      }
    };

    fetchMessages();
    fetchMeetups();
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

  const handleCreateMeetup = async (e) => {
    e.preventDefault();
    if (!meetupForm.title || !meetupForm.date || !meetupForm.location) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await api.post('/meetups/create', {
        ...meetupForm,
        userId: user.id,
        userName: user.email.split('@')[0],
        userEmail: user.email
      });

      setMeetupForm({ title: '', description: '', date: '', location: '', city: '' });
      setShowMeetupForm(false);

      const response = await api.get('/meetups');
      setMeetups(response.data);
    } catch (err) {
      console.error('Error creating meetup:', err);
      alert('Failed to create meetup');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinMeetup = async (meetupId) => {
    try {
      await api.post(`/meetups/${meetupId}/join`, {
        userId: user.id
      });

      const response = await api.get('/meetups');
      setMeetups(response.data);
    } catch (err) {
      console.error('Error joining meetup:', err);
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
              <div className="header-top">
                <h2>{currentRoom.name}</h2>
                {currentRoom.topic === 'Meetup' && (
                  <button 
                    className="create-meetup-btn"
                    onClick={() => setShowMeetupForm(!showMeetupForm)}
                  >
                    {showMeetupForm ? '✕ Close' : '+ New Meetup'}
                  </button>
                )}
              </div>
              <p>{currentRoom.description}</p>
            </div>

            {showMeetupForm && currentRoom.topic === 'Meetup' && (
              <form className="meetup-form" onSubmit={handleCreateMeetup}>
                <input
                  type="text"
                  placeholder="Meetup Title"
                  value={meetupForm.title}
                  onChange={(e) => setMeetupForm({...meetupForm, title: e.target.value})}
                  required
                />
                <input
                  type="datetime-local"
                  value={meetupForm.date}
                  onChange={(e) => setMeetupForm({...meetupForm, date: e.target.value})}
                  required
                />
                <input
                  type="text"
                  placeholder="Location"
                  value={meetupForm.location}
                  onChange={(e) => setMeetupForm({...meetupForm, location: e.target.value})}
                  required
                />
                <input
                  type="text"
                  placeholder="City"
                  value={meetupForm.city}
                  onChange={(e) => setMeetupForm({...meetupForm, city: e.target.value})}
                />
                <textarea
                  placeholder="Description"
                  value={meetupForm.description}
                  onChange={(e) => setMeetupForm({...meetupForm, description: e.target.value})}
                  rows="3"
                />
                <button type="submit" disabled={loading}>Create Meetup</button>
              </form>
            )}

            {currentRoom.topic === 'Meetup' && meetups.length > 0 && (
              <div className="meetups-list">
                <h3>📍 Upcoming Meetups</h3>
                {meetups.map((meetup) => (
                  <div key={meetup._id} className="meetup-card">
                    <h4>{meetup.title}</h4>
                    <p><strong>Date:</strong> {new Date(meetup.date).toLocaleString()}</p>
                    <p><strong>Location:</strong> {meetup.location}{meetup.city && `, ${meetup.city}`}</p>
                    {meetup.description && <p><strong>Details:</strong> {meetup.description}</p>}
                    <p><strong>Attendees:</strong> {meetup.attendees}/{meetup.maxAttendees}</p>
                    <p><strong>Organizer:</strong> {meetup.userName}</p>
                    <button 
                      className="join-btn"
                      onClick={() => handleJoinMeetup(meetup._id)}
                      disabled={meetup.attendees >= meetup.maxAttendees}
                    >
                      {meetup.interestedUsers.includes(user.id) ? '✓ Joined' : 'Join Meetup'}
                    </button>
                  </div>
                ))}
              </div>
            )}

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
