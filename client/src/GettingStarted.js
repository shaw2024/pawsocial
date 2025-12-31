import React from 'react';
import './GettingStarted.css';

function GettingStarted({ onEnter, onCommunity }) {
  const rooms = [
    { 
      id: 1, 
      icon: '🎓', 
      name: 'Dog Training & Behavior',
      description: 'Learn obedience tips, behavior training, and solutions to common challenges',
      summary: 'Master dog training techniques, address behavioral issues, and learn effective communication with your furry friend from experienced trainers and fellow dog owners.'
    },
    { 
      id: 2, 
      icon: '💪', 
      name: 'Health & Wellness',
      description: 'Discuss nutrition, exercise routines, vaccinations, and veterinary care',
      summary: 'Share health concerns, nutrition tips, exercise plans, and veterinary advice. Get recommendations for keeping your dogs healthy and fit at every life stage.'
    },
    { 
      id: 3, 
      icon: '📖', 
      name: 'Breeding Room',
      description: 'Explore breed-specific traits, standards, and characteristics',
      summary: 'Deep dive into specific dog breeds. Discuss breed characteristics, temperament, care requirements, and connect with other owners of the same breed.'
    },
    { 
      id: 4, 
      icon: '🎮', 
      name: 'Playtime & Activities',
      description: 'Share games, sports, tricks, and fun activities for your dogs',
      summary: 'Discover fun activities and games to keep your dogs entertained. Share tricks, sports, outdoor adventures, and creative ways to enrich your dog\'s life.'
    },
    { 
      id: 5, 
      icon: '👶', 
      name: 'Puppies & New Owners',
      description: 'Get advice on puppy training, care, and preparation for new pet owners',
      summary: 'Perfect for new dog owners! Get guidance on puppy care, house training, socialization, veterinary schedules, and everything you need to know as a first-time owner.'
    },
    { 
      id: 6, 
      icon: '🐾', 
      name: 'Meetup',
      description: 'Organize local dog meetups, playdates, and community gatherings',
      summary: 'Connect with local dog owners in your area. Plan dog parks visits, playdates, training sessions, and community events to socialize your dogs.'
    },
    { 
      id: 7, 
      icon: '❤️', 
      name: 'Breeding Discussion',
      description: 'Connect with responsible breeders and find compatible partners',
      summary: 'For responsible breeders and those interested in breeding. Find compatible breeding partners, discuss best practices, and share experiences.'
    }
  ];

  return (
    <div className="getting-started-container">
      <div className="welcome-content">
        <div className="welcome-header">
          <h1>🐕 Welcome to PawSocial</h1>
          <p className="tagline">Connect, Share & Care for Dogs Together</p>
          <p className="subtitle">Your complete dog community platform</p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📸</div>
            <h3>Post Dog Pictures</h3>
            <p>Share photos of your beloved dogs with the community. Upload pictures and details about your dog's breed, age, personality, and health info.</p>
            <button className="feature-link-btn" onClick={onEnter}>Create Profile →</button>
          </div>

          <div className="feature-card">
            <div className="feature-icon">💬</div>
            <h3>Chat & Connect</h3>
            <p>Join various rooms to chat with other dog owners. Discuss training tips, health concerns, breed information, and playtime activities in our dedicated community forums.</p>
            <button className="feature-link-btn" onClick={() => onCommunity()}>Browse Rooms →</button>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🐾</div>
            <h3>Organize Meetups</h3>
            <p>Schedule local dog meetups to connect with other owners in your area. Plan playdates, socialize your dogs, and build friendships in the community.</p>
            <button className="feature-link-btn" onClick={() => onCommunity('Meetup')}>Find Meetups →</button>
          </div>

          <div className="feature-card">
            <div className="feature-icon">❤️</div>
            <h3>Breeding Room</h3>
            <p>Find compatible dogs for breeding. Connect with responsible dog owners who share your breed interests and breeding goals.</p>
            <button className="feature-link-btn" onClick={() => onCommunity('Breeding Discussion')}>Visit Breeding Room →</button>
          </div>
        </div>

        <div className="how-it-works">
          <h2>📋 How to Get Started</h2>
          <div className="steps-container">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4>Create Your Profile</h4>
                <p>Set up your account and add your dog(s) with photos, breed, age, personality traits, and health information. This helps other members learn about your furry friend!</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>Explore Chat Rooms</h4>
                <p>Browse our seven dedicated community rooms, each focused on different aspects of dog ownership from training to breeding to meetups.</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4>Connect & Share</h4>
                <p>Chat with other dog lovers, ask questions, share experiences, and learn from the community. Every member brings valuable insights!</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">4</div>
              <div className="step-content">
                <h4>Engage & Enjoy</h4>
                <p>Like dog photos, save favorites, leave comments, organize meetups, or find breeding partners. Connect in meaningful ways with our community!</p>
              </div>
            </div>
          </div>
        </div>

        <div className="chat-rooms-section">
          <h2>🌟 Available Chat Rooms</h2>
          <p className="rooms-intro">Click on any room to join the conversation or connect with members</p>
          <div className="rooms-grid">
            {rooms.map((room) => (
              <div key={room.id} className="room-card">
                <div className="room-header">
                  <span className="room-icon">{room.icon}</span>
                  <h3>{room.name}</h3>
                </div>
                <p className="room-short-desc">{room.description}</p>
                <p className="room-full-summary">{room.summary}</p>
                <button 
                  className="room-link-btn"
                  onClick={() => onCommunity(room.name)}
                  title={`Join ${room.name}`}
                >
                  Join Room →
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="action-buttons">
          <button className="enter-btn" onClick={onEnter}>
            👤 Set Up Profile & Post Dogs
          </button>
          <button className="community-btn" onClick={() => onCommunity()}>
            💬 Go to Community Rooms
          </button>
        </div>

        <div className="info-banner">
          <h3>✨ About PawSocial</h3>
          <p>PawSocial is designed by dog lovers for dog lovers. Whether you're a new dog owner seeking advice, an experienced breeder looking for connections, or simply want to share your pup with a supportive community, you've found your place. Our platform brings together a diverse community of dog enthusiasts dedicated to promoting responsible pet ownership and meaningful connections.</p>
        </div>
      </div>
    </div>
  );
}

export default GettingStarted;

