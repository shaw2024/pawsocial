import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = 'https://pawsocial-api.onrender.com';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000
});

function App() {
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
  const [activeTab, setActiveTab] = useState('add');

  useEffect(() => {
    fetchDogs();
  }, []);

  const fetchDogs = async () => {
    try {
      const response = await api.get('/dogs/all');
      setDogs(response.data);
    } catch (err) {
      console.error('Error fetching dogs:', err);
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
        images: [image]
      };

      const response = await api.post('/dogs/create', payload);
      setMessage(`✅ ${response.data.name} added successfully!`);
      
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
      console.error('Error:', err);
      setMessage(`❌ ${err.response?.data?.error || err.message || 'Failed to add dog'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>🐕 PawSocial</h1>
        <p>Dog Matching & Community App</p>
      </header>

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'add' ? 'active' : ''}`}
          onClick={() => setActiveTab('add')}
        >
          Add Dog
        </button>
        <button 
          className={`tab ${activeTab === 'community' ? 'active' : ''}`}
          onClick={() => setActiveTab('community')}
        >
          Community ({dogs.length})
        </button>
      </div>

      <div className="container">
        {activeTab === 'add' && (
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

        {activeTab === 'community' && (
          <div className="community">
            <h2>Community Dogs</h2>
            {dogs.length === 0 ? (
              <p className="no-dogs">No dogs yet. Add one to get started!</p>
            ) : (
              <div className="dogs-grid">
                {dogs.map(dog => (
                  <div key={dog._id} className="dog-card">
                    {dog.images && dog.images[0] && (
                      <img src={dog.images[0]} alt={dog.name} className="dog-image" />
                    )}
                    <h3>{dog.name}</h3>
                    {dog.breed && <p><strong>Breed:</strong> {dog.breed}</p>}
                    {dog.age && <p><strong>Age:</strong> {dog.age}</p>}
                    {dog.gender && <p><strong>Gender:</strong> {dog.gender}</p>}
                    {dog.energy && <p><strong>Energy:</strong> {dog.energy}</p>}
                    {dog.city && <p><strong>City:</strong> {dog.city}</p>}
                    {dog.temperament && dog.temperament.length > 0 && (
                      <p><strong>Temperament:</strong> {dog.temperament.join(', ')}</p>
                    )}
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
