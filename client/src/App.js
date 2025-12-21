import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SignIn from './SignIn';
import Profile from './Profile';
import './App.css';

const API_URL = 'http://localhost:4000';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000
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
  const [activePage, setActivePage] = useState('profile');
  const [selectedBreed, setSelectedBreed] = useState('all');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [savedDogs, setSavedDogs] = useState([]);

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
      fetchDogs();
    }
  }, [user]);

  const fetchDogs = async () => {
    try {
      const response = await api.get('/dogs/all');
      console.log('✅ Dogs fetched:', response.data.length);
      setDogs(response.data);
    } catch (err) {
      console.error('❌ Error fetching dogs:', err.message);
      setMessage('❌ Failed to load dogs. Please refresh the page.');
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setMessage('❌ Image must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result);
      setImagePreview(reader.result);
      setMessage('');
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

  if (activePage === 'profile') {
    return (
      <div className="app">
        <Profile user={user} onNavigate={setActivePage} onSignOut={handleSignOut} />
        {renderBottomNav()}
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div>
            <h1>🐕 PawSocial</h1>
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
                  <div key={dog._id} className="dog-card">
                    <div className="dog-image-container">
                      {dog.images && dog.images[0] ? (
                        <img src={dog.images[0]} alt={dog.name} className="dog-image" />
                      ) : (
                        <div className="dog-image-placeholder">📷 No image</div>
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
      {renderBottomNav()}
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
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
