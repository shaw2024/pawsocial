import React from 'react';
import './GettingStarted.css';

function GettingStarted({ onEnter, onCommunity }) {
  return (
    <div className="getting-started-container">
      <div className="welcome-content">
        <div className="welcome-header">
          <h1>🐕 Welcome to PawSocial</h1>
          <p className="tagline">Connect, Share & Care for Dogs Together</p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📸</div>
            <h3>Post Dog Pictures</h3>
            <p>Share photos of your beloved dogs with the community. Upload pictures and details about your dog's breed, age, personality, and health info.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">💬</div>
            <h3>Chat & Connect</h3>
            <p>Join various rooms to chat with other dog owners. Discuss training tips, health concerns, breed information, and playtime activities in our dedicated community forums.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🐾</div>
            <h3>Organize Meetups</h3>
            <p>Schedule local dog meetups to connect with other owners in your area. Plan playdates, socialize your dogs, and build friendships in the community.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">❤️</div>
            <h3>Breeding Room</h3>
            <p>Find compatible dogs for breeding. Connect with responsible dog owners who share your breed interests and breeding goals.</p>
          </div>
        </div>

        <div className="how-it-works">
          <h2>How to Get Started</h2>
          <ol className="steps-list">
            <li><strong>Create Your Profile:</strong> Set up your account and add your dog(s) with photos and details.</li>
            <li><strong>Explore Rooms:</strong> Visit different chat rooms to learn about dog training, health, breeds, activities, and meetups.</li>
            <li><strong>Connect:</strong> Chat with other dog lovers about their experiences, ask questions, and share your knowledge.</li>
            <li><strong>Organize Meetups:</strong> Use the Meetup room to plan local gatherings with fellow dog owners.</li>
            <li><strong>Find Breeding Partners:</strong> Use the Breeding Discussion room to connect with others interested in responsible breeding.</li>
          </ol>
        </div>

        <div className="chat-rooms-preview">
          <h2>Available Chat Rooms</h2>
          <ul className="rooms-list">
            <li>🎓 <strong>Dog Training & Behavior</strong> - Tips on obedience and behavior</li>
            <li>💪 <strong>Health & Wellness</strong> - Nutrition, exercise, and vet care</li>
            <li>📖 <strong>Breed Discussion</strong> - Breed-specific information</li>
            <li>🎮 <strong>Playtime & Activities</strong> - Games, sports, and entertainment</li>
            <li>👶 <strong>Puppies & New Owners</strong> - New owner advice and puppy care</li>
            <li>🐾 <strong>Meetup</strong> - Organize local meetups</li>
            <li>❤️ <strong>Breeding Discussion</strong> - Find breeding partners</li>
          </ul>
        </div>

        <div className="action-buttons">
          <button className="enter-btn" onClick={onEnter}>
            Set Up Profile →
          </button>
          <button className="community-btn" onClick={onCommunity}>
            Go to Community Rooms →
          </button>
        </div>
      </div>
    </div>
  );
}

export default GettingStarted;

