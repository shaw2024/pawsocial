import React from 'react';
import './Profile.css';

function Profile({ user, onNavigate, onSignOut }) {
  return (
    <div className="profile">
      <header className="profile-header">
        <h1>🐕 PawSocial Profile</h1>
        <p>Welcome back, {user.isGuest ? 'Guest' : user.email}!</p>
      </header>

      <div className="profile-content">
        <div className="profile-info">
          <h2>Your Profile</h2>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Account Type:</strong> {user.isGuest ? 'Guest' : 'Registered'}</p>
        </div>

        <div className="profile-menu">
          <h2>Menu</h2>
          <button onClick={() => onNavigate('add')} className="menu-btn">
            🐶 Add Your Dog
          </button>
          <button onClick={() => onNavigate('community')} className="menu-btn">
            👥 Community
          </button>
          <button onClick={onSignOut} className="menu-btn signout">
            🚪 Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

export default Profile;