import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SignIn from './SignIn';
import Profile from './Profile';
import Community from './Community';
import GettingStarted from './GettingStarted';
import HelpChatBox from './HelpChatBox';
import './App.css';

// Use production API for GitHub Pages, localhost for development
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.port === '3000'
  ? 'http://localhost:4000'
  : 'https://pawsocial-api.onrender.com';

const api = axios.create({
  baseURL: API_URL,
  timeout: 60000
});

function App() {
  const [user, setUser] = useState(null);
  const [dogs, setDogs] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    breed: '',
    age: '',
    gender: '',
    energy: '',
    temperament: '',
    vaccinated: false,
    city: '',
    zip: ''
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [commentText, setCommentText] = useState({});
  const [activePage, setActivePage] = useState('getting-started');
  const [selectedBreed, setSelectedBreed] = useState('all');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [savedDogs, setSavedDogs] = useState([]);
  const [dogImages, setDogImages] = useState({});
  const [hasMore, setHasMore] = useState(true);
  const [dogsPage, setDogsPage] = useState(0);
  const [expandedImage, setExpandedImage] = useState(null);
  const [imageLoadErrors, setImageLoadErrors] = useState({});
  const [imageRetries, setImageRetries] = useState({});
  const [selectedRoomName, setSelectedRoomName] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('pawsocial_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setActivePage('profile');
    }
  }, []);

  useEffect(() => {
    // Load saved dogs from localStorage
    const storedSavedDogs = localStorage.getItem('pawsocial_saved_dogs');
    if (storedSavedDogs) {
      setSavedDogs(JSON.parse(storedSavedDogs));
    }
  }, []);

  useEffect(() => {
    if (user) {
      console.log('👤 User logged in:', user.email);
      setActivePage('getting-started');
      setDogsPage(0);
    }
  }, [user]);

  useEffect(() => {
    if (user && activePage === 'community') {
      fetchDogs();
    }
  }, [user, dogsPage, activePage]);

  useEffect(() => {
    // Preload images for first few dogs on mobile/desktop
    if (dogs.length > 0) {
      dogs.slice(0, 3).forEach(dog => {
        if (dogImages[dog._id] === undefined) {
          fetchDogImage(dog._id);
        }
      });
    }
  }, [dogs]);

  const fetchDogs = async () => {
    try {
      const skip = dogsPage * 20;
      const response = await api.get(`/dogs/all?skip=${skip}&limit=20`);
      console.log('✅ Dogs fetched:', response.data.length);
      setDogs(dogsPage === 0 ? response.data : [...dogs, ...response.data]);
      setHasMore(response.data.length === 20);
    } catch (err) {
      console.error('❌ Error fetching dogs:', err.message);
      setMessage('❌ Failed to load dogs. Please refresh the page.');
    }
  };

  const loadMoreDogs = async () => {
    setDogsPage(prev => prev + 1);
  };

  const fetchDogImage = async (dogId) => {
    // Skip if image is already loaded
    if (dogImages[dogId]) return;
    // Skip if error was encountered and max retries reached
    if (dogImages[dogId] === null && imageRetries[dogId] >= 2) return;
    
    try {
      const response = await api.get(`/dogs/${dogId}/image`, { timeout: 10000 });
      if (response.data && response.data.length > 0) {
        const imageData = response.data[0];
        // Verify image data is valid
        if (typeof imageData === 'string' && imageData.length > 0) {
          setDogImages(prev => ({ ...prev, [dogId]: imageData }));
          setImageLoadErrors(prev => ({ ...prev, [dogId]: false }));
        } else {
          throw new Error('Invalid image data');
        }
      } else {
        setDogImages(prev => ({ ...prev, [dogId]: null }));
      }
    } catch (err) {
      console.error(`❌ Error fetching image for dog ${dogId}:`, err.message);
      setImageLoadErrors(prev => ({ ...prev, [dogId]: true }));
      
      // Retry up to 2 times
      const retryCount = imageRetries[dogId] || 0;
      if (retryCount < 2) {
        setImageRetries(prev => ({ ...prev, [dogId]: retryCount + 1 }));
        // Retry after delay
        setTimeout(() => fetchDogImage(dogId), 2000 + retryCount * 1000);
      } else {
        setDogImages(prev => ({ ...prev, [dogId]: null }));
      }
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage('❌ Please select a valid image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setMessage('❌ Image must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target.result;
      // Validate that the data URL is properly formed
      if (result && result.startsWith('data:image/')) {
        setImage(result);
        setImagePreview(result);
        setMessage('');
      } else {
        setMessage('❌ Invalid image file');
      }
    };
    reader.onerror = () => {
      setMessage('❌ Failed to read image');
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setMessage('❌ Dog name is required');
      return;
    }

    if (!image) {
      setMessage('❌ Please select an image');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const payload = {
        ...formData,
        age: formData.age ? Number(formData.age) : undefined,
        temperament: formData.temperament ? formData.temperament.split(',').map(t => t.trim()) : [],
        images: [image],
        userId: user.id
      };

      console.log('📤 Uploading dog:', formData.name);
      const response = await api.post('/dogs/create', payload);
      console.log('✅ Dog saved successfully:', response.data);
      setMessage(`✅ ${response.data.name} added successfully! Image saved.`);
      
      setFormData({
        name: '',
        breed: '',
        age: '',
        gender: '',
        energy: '',
        temperament: '',
        vaccinated: false,
        city: '',
        zip: ''
      });
      setImage(null);
      setImagePreview(null);
      
      fetchDogs();
    } catch (err) {
      console.error('❌ Error uploading dog:', err);
      setMessage(`❌ ${err.response?.data?.error || err.message || 'Failed to add dog. Check browser console for details.'}`);
    } finally {
      setLoading(false);
    }
  };
  const handleSignOut = () => {
    localStorage.removeItem('pawsocial_user');
    setUser(null);
    setDogs([]);
    setFormData({
      name: '',
      breed: '',
      age: '',
      gender: '',
      energy: '',
      temperament: '',
      vaccinated: false,
      city: '',
      zip: ''
    });
    setImage(null);
    setImagePreview(null);
    setMessage('');
    setActivePage('getting-started');
  };

  const handleNavigate = (page, breed = null) => {
    if (breed) {
      setSelectedBreed(breed);
    }
    setActivePage(page);
  };

  const handleLike = async (dogId) => {
    try {
      const response = await api.post(`/dogs/${dogId}/like`, { userId: user.id });
      setDogs(dogs.map(d => d._id === dogId ? response.data : d));
    } catch (err) {
      console.error('❌ Error liking dog:', err);
    }
  };

  const handleSave = (dogId) => {
    let newSavedDogs;
    if (savedDogs.includes(dogId)) {
      // Remove from saved
      newSavedDogs = savedDogs.filter(id => id !== dogId);
    } else {
      // Add to saved
      newSavedDogs = [...savedDogs, dogId];
    }
    setSavedDogs(newSavedDogs);
    localStorage.setItem('pawsocial_saved_dogs', JSON.stringify(newSavedDogs));
  };

  const handleAddComment = async (dogId) => {
    const text = commentText[dogId]?.trim();
    if (!text) return;

    try {
      const response = await api.post(`/dogs/${dogId}/comment`, {
        userId: user.id,
        userName: user.email.split('@')[0],
        text
      });
      setDogs(dogs.map(d => d._id === dogId ? response.data : d));
      setCommentText({ ...commentText, [dogId]: '' });
    } catch (err) {
      console.error('❌ Error adding comment:', err);
    }
  };

  const handleDeleteDog = async (dogId) => {
    if (!window.confirm('Delete this dog profile?')) return;

    try {
      await api.delete(`/dogs/${dogId}`, { data: { userId: user.id } });
      setDogs(dogs.filter(d => d._id !== dogId));
      setMessage('✅ Dog deleted successfully');
    } catch (err) {
      console.error('❌ Error deleting dog:', err);
      setMessage(`❌ ${err.response?.data?.error || 'Failed to delete dog'}`);
    }
  };

  if (!user) {
    return <SignIn onSignIn={setUser} />;
  }

  if (activePage === 'signin') {
    return <SignIn onSignIn={setUser} />;
  }

  const renderBottomNav = () => (
    <div className="bottom-nav">
      <button 
        onClick={() => setActivePage('getting-started')} 
        className={activePage === 'getting-started' ? 'active' : ''}
      >
        🏠 Home
      </button>
      <button 
        onClick={() => setActivePage('profile')} 
        className={activePage === 'profile' ? 'active' : ''}
      >
        👤 Profile
      </button>
      <button 
        onClick={() => setActivePage('community')} 
        className={activePage === 'community' ? 'active' : ''}
      >
        👥 Community
      </button>
      <button 
        onClick={() => setActivePage('add')} 
        className={activePage === 'add' ? 'active' : ''}
      >
        🐶 Add Dog
      </button>
      <button onClick={handleSignOut}>
        🚪 Sign Out
      </button>
    </div>
  );

  if (activePage === 'getting-started') {
    return (
      <div className="app">
        <GettingStarted 
          onEnter={() => setActivePage('profile')}
          onCommunity={(roomName) => {
            setActivePage('chat-rooms');
            setSelectedRoomName(roomName);
          }}
        />
        {renderBottomNav()}
      </div>
    );
  }

  if (activePage === 'profile') {
    return (
      <div className="app">
        <Profile user={user} onNavigate={handleNavigate} onSignOut={handleSignOut} />
        {renderBottomNav()}
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div>
            <h1>🐕 PawPawSocial</h1>
            <p>Dog Matching & Community App</p>
          </div>
          <div className="header-right">
            <button 
              onClick={() => setActivePage('profile')} 
              className="btn-profile-main"
            >
              👤 My Profile
            </button>
            <div className="profile-menu-container">
              <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)} 
                className="btn-profile"
              >
                Menu
              </button>
              {showProfileMenu && (
                <div className="profile-dropdown">
                  <button onClick={() => { setActivePage('profile'); setShowProfileMenu(false); }}>
                    View Profile
                  </button>
                  <button onClick={handleSignOut}>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="tabs">
        <button 
          className={`tab ${activePage === 'getting-started' ? 'active' : ''}`}
          onClick={() => setActivePage('getting-started')}
        >
          📖 Getting Started
        </button>
        <button 
          className={`tab ${activePage === 'add' ? 'active' : ''}`}
          onClick={() => setActivePage('add')}
        >
          Add Dog
        </button>
        <button 
          className={`tab ${activePage === 'community' ? 'active' : ''}`}
          onClick={() => setActivePage('community')}
        >
          Community ({dogs.length})
        </button>
        <button 
          className={`tab ${activePage === 'chat-rooms' ? 'active' : ''}`}
          onClick={() => setActivePage('chat-rooms')}
        >
          💬 Chat Rooms
        </button>
      </div>

      <div className="container">
        {activePage === 'getting-started' && (
          <div className="panel getting-started-guide">
            <h2>📖 How to Use PawSocial</h2>
            
            <div className="guide-section">
              <h3>🐾 Getting Started</h3>
              <p>Welcome to PawSocial! Here's how to make the most of our dog-loving community:</p>
              
              <div className="guide-steps">
                <div className="step-item">
                  <div className="step-header">
                    <span className="step-icon">1️⃣</span>
                    <h4>Create Your Profile & Add Your Dogs</h4>
                  </div>
                  <p>Go to the "Add Dog" tab and share photos and details about your dogs. Include breed, age, personality traits, energy level, and any special information that helps others get to know your pup!</p>
                </div>

                <div className="step-item">
                  <div className="step-header">
                    <span className="step-icon">2️⃣</span>
                    <h4>Explore the Community</h4>
                  </div>
                  <p>Visit the "Community" tab to see all posted dogs. You can like dogs, save your favorites, and leave comments. Filter by breed to find dogs that match your interests.</p>
                </div>

                <div className="step-item">
                  <div className="step-header">
                    <span className="step-icon">3️⃣</span>
                    <h4>Join Chat Rooms</h4>
                  </div>
                  <p>Use the "Chat Rooms" tab to join discussions about dog training, health, breeds, activities, meetups, and more. Connect with experienced dog owners and share your knowledge!</p>
                </div>

                <div className="step-item">
                  <div className="step-header">
                    <span className="step-icon">4️⃣</span>
                    <h4>Organize Meetups & Find Breeding Partners</h4>
                  </div>
                  <p>Use the Meetup room to connect with local dog owners and plan activities. If you're interested in breeding, visit the Breeding Discussion room to find compatible partners.</p>
                </div>
              </div>
            </div>

            <div className="guide-section">
              <h3>💬 Our Chat Rooms</h3>
              <div className="rooms-overview">
                <div className="room-overview-item">
                  <strong>🎓 Dog Training & Behavior</strong>
                  <p>Learn training techniques, discuss behavioral challenges, and share tips with other dog owners.</p>
                </div>
                <div className="room-overview-item">
                  <strong>💪 Health & Wellness</strong>
                  <p>Share health concerns, nutrition advice, exercise tips, and veterinary recommendations.</p>
                </div>
                <div className="room-overview-item">
                  <strong>📖 Breed Discussion</strong>
                  <p>Deep dive into specific breeds. Discuss characteristics, care requirements, and breed standards.</p>
                </div>
                <div className="room-overview-item">
                  <strong>🎮 Playtime & Activities</strong>
                  <p>Share fun games, tricks, sports, and creative activities to enrich your dog's life.</p>
                </div>
                <div className="room-overview-item">
                  <strong>👶 Puppies & New Owners</strong>
                  <p>Get guidance on puppy care, training, socialization, and preparation for first-time dog owners.</p>
                </div>
                <div className="room-overview-item">
                  <strong>🐾 Meetup</strong>
                  <p>Connect with local dog owners and organize dog parks visits, playdates, and community events.</p>
                </div>
                <div className="room-overview-item">
                  <strong>❤️ Breeding Discussion</strong>
                  <p>For responsible breeders and those interested in breeding. Find compatible partners and share best practices.</p>
                </div>
              </div>
            </div>

            <div className="guide-section">
              <h3>✨ Community Features</h3>
              <ul className="features-list">
                <li><strong>Like & Save:</strong> Like dogs you love and save them to your favorites for later.</li>
                <li><strong>Comments:</strong> Leave comments on dog posts to ask questions or share thoughts.</li>
                <li><strong>Breed Filtering:</strong> Filter dogs by breed to find dogs of your favorite breeds.</li>
                <li><strong>Real-time Chat:</strong> Join live discussions with other dog enthusiasts.</li>
                <li><strong>Profile Customization:</strong> Share as much or as little as you're comfortable with.</li>
              </ul>
            </div>

            <div className="guide-section">
              <h3>🚀 Tips for Success</h3>
              <ul className="tips-list">
                <li>Use clear, quality photos of your dog to help others connect with you.</li>
                <li>Provide accurate details about your dog's breed, age, and personality.</li>
                <li>Be respectful and kind to all community members.</li>
                <li>Join the chat rooms that interest you most - don't try to do everything at once!</li>
                <li>Share your experiences and learn from others who share your dog-loving passion.</li>
              </ul>
            </div>

            <div className="cta-section">
              <p><strong>Ready to get started?</strong></p>
              <button className="btn-primary" onClick={() => setActivePage('add')}>
                📸 Add Your Dog
              </button>
              <button className="btn-secondary" onClick={() => setActivePage('community')}>
                👥 Explore Community
              </button>
            </div>
          </div>
        )}
        {activePage === 'add' && (
          <div className="panel">
            <h2>Add Your Dog</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Dog Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter dog name"
                  required
                />
              </div>

              <div className="form-group">
                <label>Breed</label>
                <input
                  type="text"
                  name="breed"
                  value={formData.breed}
                  onChange={handleInputChange}
                  placeholder="Enter breed"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Age</label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleInputChange}
                    placeholder="Age"
                  />
                </div>

                <div className="form-group">
                  <label>Gender</label>
                  <select name="gender" value={formData.gender} onChange={handleInputChange}>
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Energy Level</label>
                  <select name="energy" value={formData.energy} onChange={handleInputChange}>
                    <option value="">Select</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="City"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Temperament</label>
                <input
                  type="text"
                  name="temperament"
                  value={formData.temperament}
                  onChange={handleInputChange}
                  placeholder="e.g. friendly, playful, calm"
                />
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    name="vaccinated"
                    checked={formData.vaccinated}
                    onChange={handleInputChange}
                  />
                  Vaccinated
                </label>
              </div>

              <div className="form-group">
                <label>Photo * (under 2MB)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  required
                />
              </div>

              {imagePreview && (
                <div className="image-preview">
                  <img src={imagePreview} alt="Preview" />
                </div>
              )}

              {message && <div className="message">{message}</div>}

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Adding...' : 'Add Dog'}
              </button>
            </form>
          </div>
        )}

        {activePage === 'community' && (
          <div className="community">
            <h2>Community Dogs</h2>
            <div className="filter-section">
              <label htmlFor="breed-filter">Filter by Popular Breeds:</label>
              <select 
                id="breed-filter"
                value={selectedBreed} 
                onChange={(e) => setSelectedBreed(e.target.value)}
              >
                <option value="all">All Breeds</option>
                <option value="Labrador Retriever">Labrador Retriever</option>
                <option value="German Shepherd">German Shepherd</option>
                <option value="Golden Retriever">Golden Retriever</option>
                <option value="Bulldog">Bulldog</option>
                <option value="Beagle">Beagle</option>
                <option value="Poodle">Poodle</option>
                <option value="Rottweiler">Rottweiler</option>
                <option value="Yorkshire Terrier">Yorkshire Terrier</option>
                <option value="Boxer">Boxer</option>
                <option value="Dachshund">Dachshund</option>
              </select>
            </div>
            {dogs.length === 0 ? (
              <p className="no-dogs">No dogs yet. Add one to get started!</p>
            ) : (
              <div className="dogs-grid">
                {dogs
                  .filter(dog => selectedBreed === 'all' || dog.breed === selectedBreed)
                  .map(dog => (
                  <div key={dog._id} className="dog-card" onMouseEnter={() => fetchDogImage(dog._id)}>
                    <div className="dog-image-container" onClick={() => dogImages[dog._id] && setExpandedImage(dogImages[dog._id])}>
                      {dogImages[dog._id] ? (
                        <img 
                          src={dogImages[dog._id]} 
                          alt={dog.name} 
                          className="dog-image"
                          onError={(e) => {
                            console.error(`Image failed to load for dog: ${dog.name}`);
                            setDogImages(prev => ({ ...prev, [dog._id]: null }));
                            setImageLoadErrors(prev => ({ ...prev, [dog._id]: true }));
                          }}
                        />
                      ) : dogImages[dog._id] === null ? (
                        <div className="dog-image-placeholder">
                          {imageLoadErrors[dog._id] ? (
                            <div className="image-error">
                              <div>❌ Image Error</div>
                              <button 
                                className="retry-button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setImageRetries(prev => ({ ...prev, [dog._id]: 0 }));
                                  setDogImages(prev => ({ ...prev, [dog._id]: undefined }));
                                  fetchDogImage(dog._id);
                                }}
                              >
                                Retry
                              </button>
                            </div>
                          ) : (
                            <div>📷 No Image</div>
                          )}
                        </div>
                      ) : (
                        <div className="dog-image-placeholder">📷 Loading...</div>
                      )}
                    </div>
                    <div className="dog-card-header">
                      <h3>{dog.name}</h3>
                      {dog.userId === user.id && (
                        <button 
                          onClick={() => handleDeleteDog(dog._id)}
                          className="btn-delete"
                          title="Delete this dog"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                    {dog.breed && <p><strong>Breed:</strong> {dog.breed}</p>}
                    {dog.age && <p><strong>Age:</strong> {dog.age}</p>}
                    {dog.gender && <p><strong>Gender:</strong> {dog.gender}</p>}
                    {dog.energy && <p><strong>Energy:</strong> {dog.energy}</p>}
                    {dog.city && <p><strong>City:</strong> {dog.city}</p>}
                    {dog.temperament && dog.temperament.length > 0 && (
                      <p><strong>Temperament:</strong> {dog.temperament.join(', ')}</p>
                    )}

                    <div className="dog-interactions">
                      <button 
                        onClick={() => handleLike(dog._id)}
                        className={`btn-like ${dog.likes?.includes(user.id) ? 'liked' : ''}`}
                      >
                        ❤️ {dog.likes?.length || 0} Likes
                      </button>
                      <button 
                        onClick={() => handleSave(dog._id)}
                        className={`btn-save ${savedDogs.includes(dog._id) ? 'saved' : ''}`}
                      >
                        {savedDogs.includes(dog._id) ? '⭐ Saved' : '☆ Save'}
                      </button>
                    </div>

                    {dog.comments && dog.comments.length > 0 && (
                      <div className="dog-comments">
                        <strong>Comments ({dog.comments.length})</strong>
                        {dog.comments.map((comment, idx) => (
                          <div key={idx} className="comment">
                            <strong>{comment.userName}:</strong> {comment.text}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="comment-form">
                      <input
                        type="text"
                        placeholder="Add a comment..."
                        value={commentText[dog._id] || ''}
                        onChange={(e) => setCommentText({ ...commentText, [dog._id]: e.target.value })}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddComment(dog._id)}
                      />
                      <button onClick={() => handleAddComment(dog._id)} className="btn-comment">
                        💬
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {hasMore && dogs.length > 0 && (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <button onClick={loadMoreDogs} className="btn-primary">
                  Load More Dogs
                </button>
              </div>
            )}
          </div>
        )}

        {activePage === 'chat-rooms' && (
          <div className="chat-rooms-section">
            <Community user={user} selectedRoomName={selectedRoomName} />
          </div>
        )}
      </div>

      {expandedImage && (
        <div className="image-modal" onClick={() => setExpandedImage(null)}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <img src={expandedImage} alt="Expanded" className="expanded-image" />
            <button className="close-modal" onClick={() => setExpandedImage(null)}>✕</button>
          </div>
        </div>
      )}

      <HelpChatBox />

      {renderBottomNav()}
    </div>
  );
}

export default App;
