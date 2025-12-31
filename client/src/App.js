import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SignIn from './SignIn';
import Profile from './Profile';
import Community from './Community';
import GettingStarted from './GettingStarted';
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
  const [selectedRoomId, setSelectedRoomId] = useState(null);

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
      setActivePage('profile');
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
    setActivePage('profile');
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
            setActivePage('community');
            setSelectedRoomId(roomName);
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
            <Community user={user} selectedRoomName={selectedRoomId} />
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

      {renderBottomNav()}
    </div>
  );
}

export default App;
