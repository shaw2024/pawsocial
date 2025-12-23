import React, { useState } from 'react';
import './Profile.css';

function Profile({ user, onNavigate, onSignOut }) {
  const [showBreedDropdown, setShowBreedDropdown] = useState(false);

  const dogBreeds = [
    'Labrador Retriever',
    'German Shepherd',
    'Golden Retriever',
    'Bulldog',
    'Beagle',
    'Poodle',
    'Rottweiler',
    'Yorkshire Terrier',
    'Boxer',
    'Dachshund'
  ];

  const handleBreedSelect = (breed) => {
    onNavigate('community', breed);
    setShowBreedDropdown(false);
  };

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
          <div className="menu-item-with-dropdown">
            <button 
              onClick={() => {
                onNavigate('community');
                setShowBreedDropdown(false);
              }} 
              className="menu-btn"
            >
              👥 Community
            </button>
            <button 
              onClick={() => setShowBreedDropdown(!showBreedDropdown)}
              className="dropdown-toggle"
              title="Filter by breed"
            >
              ▼
            </button>
            {showBreedDropdown && (
              <div className="breed-dropdown">
                <button 
                  onClick={() => handleBreedSelect('all')}
                  className="breed-option"
                >
                  All Breeds
                </button>
                {dogBreeds.map((breed) => (
                  <button 
                    key={breed}
                    onClick={() => handleBreedSelect(breed)}
                    className="breed-option"
                  >
                    {breed}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={onSignOut} className="menu-btn signout">
            🚪 Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

export default Profile;
