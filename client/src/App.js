import { useState, useEffect } from "react";
import api from "./api";
import "./App.css";

function Login({ onLogin, switchToRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    
    // Always allow access - no authentication required
    onLogin("demo-token", { name: "Demo User", email: "demo@pawsocial.com" });
  }

  function handleQuickAccess() {
    // Bypass authentication and go directly to dashboard
    onLogin("demo-token", { name: "Demo User", email: "demo@pawsocial.com" });
  }

  return (
    <div className="auth-card">
      <h2 className="auth-title">Welcome back 🐾</h2>
      <p className="auth-subtitle">Sign in to find new friends for your pup.</p>
      {error && <p className="auth-error">{error}</p>}

      <button 
        type="button" 
        className="btn btn-primary full-width quick-access-btn"
        onClick={handleQuickAccess}
      >
        🚀 Quick Access (No Login Required)
      </button>

      <div className="divider">
        <span>or sign in with credentials</span>
      </div>

      <form onSubmit={handleLogin} className="auth-form">
        <label className="auth-label">
          Email (optional)
          <input
            className="auth-input"
            type="text"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com (optional)"
          />
        </label>

        <label className="auth-label">
          Password (optional)
          <input
            className="auth-input"
            type="text"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="No password needed"
          />
        </label>

        <button type="submit" className="btn btn-outline full-width">
          Enter App →
        </button>
      </form>

      <div className="auth-footer">
        <span>New here?</span>
        <button type="button" className="link-button" onClick={switchToRegister}>
          Create an account
        </button>
      </div>
    </div>
  );
}

function Register({ switchToLogin }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    city: "",
    zip: ""
  });
  const [msg, setMsg] = useState("");
  const [isError, setIsError] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleRegister(e) {
    e.preventDefault();
    setMsg("");
    setIsError(false);
    
    // Validate required fields
    if (!form.name || !form.email || !form.password) {
      setMsg("⚠️ Please fill in all required fields (Name, Email, Password)");
      setIsError(true);
      return;
    }
    
    try {
      const response = await api.post("/auth/register", form);
      console.log("Registration successful:", response.data);
      setMsg("🎉 Account created! You can log in now.");
      setIsError(false);
      // Clear form after successful registration
      setForm({
        name: "",
        email: "",
        password: "",
        city: "",
        zip: ""
      });
    } catch (err) {
      console.error("Registration error:", err);
      const errorMsg = err.response?.data?.msg || err.response?.data?.message || "Registration failed. Please try again.";
      setMsg(errorMsg);
      setIsError(true);
    }
  }

  return (
    <div className="auth-card">
      <h2 className="auth-title">Join DogMatch 🐶</h2>
      <p className="auth-subtitle">Create your account and add your pup.</p>
      {msg && <p className={isError ? "auth-error" : "auth-info"}>{msg}</p>}

      <form onSubmit={handleRegister} className="auth-form">
        <label className="auth-label">
          Name *
          <input
            className="auth-input"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Your name"
            required
          />
        </label>

        <label className="auth-label">
          Email *
          <input
            className="auth-input"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            required
          />
        </label>

        <label className="auth-label">
          Password *
          <input
            className="auth-input"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Create a password"
            required
            minLength="6"
          />
        </label>

        <div className="auth-grid">
          <label className="auth-label">
            City
            <input
              className="auth-input"
              name="city"
              value={form.city}
              onChange={handleChange}
              placeholder="San Diego"
            />
          </label>
          <label className="auth-label">
            ZIP
            <input
              className="auth-input"
              name="zip"
              value={form.zip}
              onChange={handleChange}
              placeholder="92101"
            />
          </label>
        </div>

        <button type="submit" className="btn btn-primary full-width">
          Create account
        </button>
      </form>

      <div className="auth-footer">
        <span>Already have an account?</span>
        <button type="button" className="link-button" onClick={switchToLogin}>
          Log in
        </button>
      </div>
    </div>
  );
}

function AddDog({ token, onDogCreated }) {
  const [dog, setDog] = useState({
    name: "",
    age: "",
    breed: "",
    gender: "",
    energy: "",
    temperament: "",
    vaccinated: false,
    city: "",
    zip: "",
    imageUrl: ""
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [imageBase64, setImageBase64] = useState("");

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    if (name === 'imageUrl' && value) {
      // If user types a URL, update preview
      setImagePreview(value);
    }
    setDog(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  }

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) {
      setImageBase64("");
      setImagePreview("");
      setError("");
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageBase64(reader.result);
      setImagePreview(reader.result);
      setError("");
    };
    reader.readAsDataURL(file);
  }

  async function handleSave(e) {
    e.preventDefault();
    setError("");
    if (!dog.name || !dog.name.trim()) {
      setError("Dog name is required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: dog.name,
        age: Number(dog.age) || undefined,
        breed: dog.breed,
        gender: dog.gender,
        energy: dog.energy,
        temperament: dog.temperament
          ? dog.temperament.split(",").map(t => t.trim())
          : [],
        vaccinated: dog.vaccinated,
        images: imageBase64 ? [imageBase64] : [],
        city: dog.city,
        zip: dog.zip
      };
      
      console.log("Saving dog with payload:", { ...payload, images: payload.images.length > 0 ? [`base64 string (${payload.images[0].length} chars)`] : [] });
      const res = await api.post("/dogs/create", payload);
      console.log("Dog created successfully:", res.data);
      
      onDogCreated(res.data);
      
      // Reset form
      setDog({
        name: "",
        age: "",
        breed: "",
        gender: "",
        energy: "",
        temperament: "",
        vaccinated: false,
        city: "",
        zip: "",
        imageUrl: ""
      });
      setImagePreview("");
      setImageBase64("");
      setError("");
      setSuccess(`✅ ${res.data.name} added successfully!`);
      
      // Clear file input
      const fileInput = document.getElementById('dog-photo');
      if (fileInput) fileInput.value = '';
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error creating dog:", err);
      setError(err.response?.data?.message || "Failed to create dog profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Add a dog</h2>
        <p>Tell us about your pup so we can find the perfect playmates.</p>
      </div>
      {success && (
        <div style={{ 
          background: '#d4edda', 
          border: '2px solid #28a745', 
          padding: '12px', 
          borderRadius: '8px', 
          marginBottom: '12px',
          color: '#155724',
          fontWeight: '600'
        }}>
          {success}
        </div>
      )}
      {error && (
        <div style={{ 
          background: '#f8d7da', 
          border: '2px solid #dc3545', 
          padding: '12px', 
          borderRadius: '8px', 
          marginBottom: '12px',
          color: '#721c24',
          fontWeight: '600'
        }}>
          {error}
        </div>
      )}
      <form onSubmit={handleSave} className="panel-form">
        <div className="form-row">
          <label className="auth-label">
            Name
            <input
              type="text"
              className="auth-input"
              name="name"
              value={dog.name}
              onChange={handleChange}
              placeholder="Bella"
              required
            />
          </label>
          <label className="auth-label">
            Age
            <input
              type="number"
              className="auth-input"
              name="age"
              value={dog.age}
              onChange={handleChange}
              placeholder="2"
              min="0"
              max="30"
            />
          </label>
        </div>

        <div className="form-row">
          <label className="auth-label">
            Breed
            <input
              type="text"
              className="auth-input"
              name="breed"
              value={dog.breed}
              onChange={handleChange}
              placeholder="Golden Retriever"
            />
          </label>
        </div>

        <div className="form-row">
          <label className="auth-label">
            Gender
            <select
              className="auth-input"
              name="gender"
              value={dog.gender}
              onChange={handleChange}
            >
              <option value="">Select gender</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
            </select>
          </label>
          <label className="auth-label">
            Energy
            <select
              className="auth-input"
              name="energy"
              value={dog.energy}
              onChange={handleChange}
            >
              <option value="">Energy level</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
        </div>

        <label className="auth-label">
          Temperament (comma separated)
          <input
            type="text"
            className="auth-input"
            name="temperament"
            value={dog.temperament}
            onChange={handleChange}
            placeholder="playful, friendly, good with kids"
          />
        </label>

        <div className="form-row">
          <label className="auth-label checkbox-label">
            <input
              type="checkbox"
              name="vaccinated"
              checked={dog.vaccinated}
              onChange={handleChange}
            />
            <span>Vaccinated</span>
          </label>
        </div>

        <div className="form-row">
          <label className="auth-label">
            City
            <input
              type="text"
              className="auth-input"
              name="city"
              value={dog.city}
              onChange={handleChange}
              placeholder="San Diego"
            />
          </label>
          <label className="auth-label">
            ZIP
            <input
              type="text"
              className="auth-input"
              name="zip"
              value={dog.zip}
              onChange={handleChange}
              placeholder="92101"
              maxLength="10"
            />
          </label>
        </div>

        <div className="image-upload-section">
          <label className="auth-label">
            Upload Photo
            <div className="file-upload-wrapper">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="file-input"
                id="dog-photo"
              />
              <label htmlFor="dog-photo" className="file-upload-btn">
                📷 Choose from Device
              </label>
            </div>
          </label>

          <div className="upload-divider">
            <span>or</span>
          </div>

          <label className="auth-label">
            Image URL
            <input
              type="url"
              className="auth-input"
              name="imageUrl"
              value={dog.imageUrl}
              onChange={handleChange}
              placeholder="https://example.com/dog.jpg"
            />
          </label>

          {imagePreview && (
            <div className="image-preview">
              <img src={imagePreview} alt="Preview" />
              <button
                type="button"
                className="remove-preview"
                onClick={() => {
                  setImagePreview("");
                  setDog(prev => ({ ...prev, imageUrl: "" }));
                }}
              >
                ✕
              </button>
            </div>
          )}
        </div>

        <button type="submit" className="btn btn-secondary full-width" disabled={saving}>
          {saving ? "Saving..." : "Save dog"}
        </button>
      </form>
    </div>
  );
}

function Discover({ token, activeDogId }) {
  const [dogs, setDogs] = useState([]);
  const [index, setIndex] = useState(0);
  const [toast, setToast] = useState("");

  useEffect(() => {
    async function fetchDogs() {
      const res = await api.get(`/dogs/discover/${activeDogId}`);
      setDogs(res.data);
      setIndex(0);
    }
    if (activeDogId) fetchDogs();
  }, [activeDogId]);

  async function act(action) {
    const current = dogs[index];
    if (!current) return;
    await api.post("/match/action", {
      fromDog: activeDogId,
      toDog: current._id,
      action
    });
    setToast(action === "like" ? "You liked this dog! 🐾" : "Skipped for now.");
    setIndex(i => i + 1);
    setTimeout(() => setToast(""), 1500);
  }

  const current = dogs[index];

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Discover pups nearby</h2>
        <p>Swipe through dogs that could be your pup's next best friend.</p>
      </div>

      {current ? (
        <div className="dog-card">
          {current.images && current.images[0] && (
            <div className="dog-card-image-wrap">
              <img
                src={current.images[0]}
                alt={current.name}
                className="dog-card-image"
              />
            </div>
          )}
          <div className="dog-card-body">
            <div className="dog-card-title-row">
              <h3>{current.name}</h3>
              <span className="dog-chip">{current.breed || "Unknown breed"}</span>
            </div>
            <p className="dog-meta">
              Energy: <strong>{current.energy || "n/a"}</strong>{" "}
              {current.location?.city && `• ${current.location.city}`}
            </p>
            {current.temperament?.length > 0 && (
              <div className="dog-tags">
                {current.temperament.map(tag => (
                  <span className="dog-tag" key={tag}>
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <div className="dog-actions">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => act("pass")}
              >
                Pass
              </button>
              <button
                type="button"
                className="btn btn-like"
                onClick={() => act("like")}
              >
                Like ❤️
              </button>
            </div>
          </div>
        </div>
      ) : (
        <p className="empty-state">No more dogs to show right now. Check back soon!</p>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function Matches({ activeDogId }) {
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    async function fetchMatches() {
      if (!activeDogId) return;
      const res = await api.get(`/match/list/${activeDogId}`);
      setMatches(res.data);
    }
    fetchMatches();
  }, [activeDogId]);

  return (
    <div className="panel small-panel">
      <div className="panel-header">
        <h2>Matches</h2>
        <p>Your dog's new friends.</p>
      </div>

      {matches.length === 0 && (
        <p className="empty-state">No matches yet. Start liking some pups!</p>
      )}

      <div className="matches-list">
        {matches.map(m => {
          const d1 = m.dog1;
          const d2 = m.dog2;
          if (!d1 || !d2) return null;
          return (
            <div className="match-item" key={m._id}>
              <div className="match-avatars">
                <div className="match-avatar">
                  {d1.images?.[0] ? (
                    <img src={d1.images[0]} alt={d1.name} />
                  ) : (
                    <span>{d1.name?.[0] || "?"}</span>
                  )}
                </div>
                <span className="match-heart">❤️</span>
                <div className="match-avatar">
                  {d2.images?.[0] ? (
                    <img src={d2.images[0]} alt={d2.name} />
                  ) : (
                    <span>{d2.name?.[0] || "?"}</span>
                  )}
                </div>
              </div>
              <div className="match-info">
                <strong>{d1.name}</strong> &amp; <strong>{d2.name}</strong>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CreatePost({ onPostCreated }) {
  const [post, setPost] = useState({
    caption: "",
    imageUrl: ""
  });
  const [imagePreview, setImagePreview] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result;
        setImagePreview(dataUrl);
        setPost(prev => ({ ...prev, imageUrl: dataUrl }));
        setError("");
      };
      reader.readAsDataURL(file);
    }
  }
  
  function handleUrlChange(e) {
    const url = e.target.value;
    setPost(prev => ({ ...prev, imageUrl: url }));
    if (url) {
      setImagePreview(url);
    }
  }

  async function handlePost(e) {
    e.preventDefault();
    
    if (!post.imageUrl || !post.imageUrl.trim()) {
      setError("Please upload a photo or enter an image URL");
      return;
    }
    
    setPosting(true);
    setError("");
    setSuccess("");
    
    try {
      // Create a post as a dog entry
      const payload = {
        name: post.caption?.trim() || "Community Post",
        breed: "Community Share",
        images: [post.imageUrl],
        temperament: ["community-post"]
      };
      
      console.log("Creating post with payload:", payload);
      const res = await api.post("/dogs/create", payload);
      console.log("Post created successfully:", res.data);
      
      onPostCreated(res.data);
      
      // Reset form
      setPost({ caption: "", imageUrl: "" });
      setImagePreview("");
      
      // Clear file input
      const fileInput = document.getElementById('post-photo');
      if (fileInput) fileInput.value = '';
      
      setSuccess("✅ Posted to community successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error creating post:", err);
      setError(err.response?.data?.message || "Failed to post. Please try again.");
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="panel create-post-panel">
      <div className="panel-header">
        <h2>📸 Create Post</h2>
        <p>Share a photo with the community</p>
      </div>
      {error && (
        <div className="error-message">{error}</div>
      )}
      <form onSubmit={handlePost} className="panel-form">
        <label className="auth-label">
          Caption (optional)
          <input
            type="text"
            className="auth-input"
            value={post.caption}
            onChange={(e) => setPost(prev => ({ ...prev, caption: e.target.value }))}
            placeholder="What's on your mind?"
            maxLength="200"
          />
        </label>

        <div className="image-upload-section">
          <label className="auth-label">
            Upload Photo
            <div className="file-upload-wrapper">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="file-input"
                id="post-photo"
              />
              <label htmlFor="post-photo" className="file-upload-btn">
                📷 Choose Photo
              </label>
            </div>
          </label>

          <div className="upload-divider">
            <span>or</span>
          </div>

          <label className="auth-label">
            Image URL
            <input
              type="url"
              className="auth-input"
              value={post.imageUrl}
              onChange={handleUrlChange}
              placeholder="https://example.com/photo.jpg"
            />
          </label>

          {imagePreview && (
            <div className="image-preview">
              <img src={imagePreview} alt="Preview" />
              <button
                type="button"
                className="remove-preview"
                onClick={() => {
                  setImagePreview("");
                  setPost(prev => ({ ...prev, imageUrl: "" }));
                }}
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {success && (
          <div className="success-message">
            ✓ {success}
          </div>
        )}

        <button type="submit" className="btn btn-primary full-width" disabled={posting}>
          {posting ? "Posting..." : "📤 Post to Community"}
        </button>
      </form>
    </div>
  );
}

function Community({ activeDogId }) {
  const [allDogs, setAllDogs] = useState([]);
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchAllDogs() {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get("/dogs/all");
        setAllDogs(res.data || []);
      } catch (err) {
        console.error("Error fetching community dogs:", err);
        setError("Unable to load community dogs. Please refresh the page.");
        setAllDogs([]);
      } finally {
        setLoading(false);
      }
    }
    fetchAllDogs();
  }, []);

  function handlePostCreated(newPost) {
    setAllDogs(prev => [newPost, ...prev]);
    setToast("✅ Posted to community!");
    setTimeout(() => setToast(""), 2000);
  }

  async function handleLike(dogId) {
    if (!activeDogId) {
      setToast("⚠️ Select your dog first!");
      setTimeout(() => setToast(""), 2000);
      return;
    }
    try {
      await api.post("/match/action", {
        fromDog: activeDogId,
        toDog: dogId,
        action: "like"
      });
      setToast("❤️ Liked!");
      setTimeout(() => setToast(""), 1500);
    } catch (err) {
      console.error("Error liking dog:", err);
    }
  }

  function handleShare(dog) {
    const shareText = `Check out ${dog.name}, a ${dog.breed || "adorable"} looking for playmates!`;
    if (navigator.share) {
      navigator.share({
        title: `Meet ${dog.name}`,
        text: shareText,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${shareText} ${window.location.href}`);
      setToast("📋 Link copied to clipboard!");
      setTimeout(() => setToast(""), 2000);
    }
  }

  return (
    <>
      <CreatePost onPostCreated={handlePostCreated} />

      {/* Posts display will go here */}
      <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Loading posts...</div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#d9534f' }}>{error}</div>
        ) : allDogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>No posts yet. Be the first to share!</div>
        ) : (
          allDogs.map(dog => (
            <div key={dog._id} style={{ background: '#fff', borderRadius: '10px', padding: '16px', marginBottom: '16px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)', border: '1px solid #e0e0e0' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#007bff', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', marginRight: '12px' }}>
                  🐕
                </div>
                <div>
                  <div style={{ fontWeight: '600', color: '#333' }}>{dog.name}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>{dog.createdAt ? new Date(dog.createdAt).toLocaleDateString() : 'Just now'}</div>
                </div>
              </div>
              {dog.images && dog.images[0] && (
                <img src={dog.images[0]} alt={dog.name} style={{ width: '100%', borderRadius: '8px', marginBottom: '12px' }} />
              )}
              <div style={{ fontSize: '14px', color: '#333' }}>
                {dog.breed && <span>{dog.breed}</span>}
                {dog.age && <span> • {dog.age} years old</span>}
                {dog.city && <span> • {dog.city}</span>}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}

// ===== MAIN APP COMPONENT =====
function App() {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [view, setView] = useState("dashboard");
  const [currentTab, setCurrentTab] = useState("addDog");
  const [myDogs, setMyDogs] = useState([]);
  const [activeDogId, setActiveDogId] = useState(null);

  // Fetch user's dogs on component mount
  useEffect(() => {
    async function fetchDogs() {
      try {
        const res = await api.get("/dogs/mine");
        setMyDogs(res.data || []);
        if (res.data && res.data[0]) {
          setActiveDogId(res.data[0]._id);
        }
      } catch (err) {
        console.error("Error fetching my dogs:", err);
        setMyDogs([]);
      }
    }
    fetchDogs();
  }, []);

  function handleLogin(tokenValue, userValue) {
    setToken(tokenValue);
    setUser(userValue);
    setView("dashboard");
  }

  function handleDogCreated(dog) {
    // After creating a dog, fetch the latest list from backend
    async function refreshDogs() {
      try {
        const res = await api.get("/dogs/mine");
        setMyDogs(res.data || []);
        if (res.data && res.data[0]) {
          setActiveDogId(res.data[0]._id);
        }
      } catch (err) {
        console.error("Error refreshing my dogs:", err);
      }
    }
    refreshDogs();
  }

  // Auth layout (login/register)
  if (view === "login" || view === "register") {
    return (
      <div className="app-shell auth-shell">
        <div className="auth-mobile-header">
          <h1 className="auth-mobile-logo">🐾 PawPawSocial</h1>
          <p className="auth-mobile-tagline">Find pawfect friends for your pup</p>
        </div>
        
        <div className="auth-hero">
          <div className="auth-hero-inner">
            <h1>DogMatch</h1>
            <p>
              A social space where dogs find playmates, buddies, and maybe even a soulmate.
              Connect with local dog owners and set up safe, fun meetups.
            </p>
            <ul className="hero-list">
              <li>🐕 Create profiles for your dogs</li>
              <li>📍 Discover pups nearby</li>
              <li>💬 Match & start chatting with owners</li>
            </ul>
          </div>
        </div>

        <div className="auth-main">
          {view === "login" ? (
            <Login
              onLogin={handleLogin}
              switchToRegister={() => setView("register")}
            />
          ) : (
            <Register switchToLogin={() => setView("login")} />
          )}
        </div>
      </div>
    );
  }

  // Dashboard layout
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-left">
          <span className="logo">DogMatch</span>
          <nav className="topbar-nav">
            <button
              type="button"
              className={`topbar-link ${currentTab === 'personal' ? 'topbar-link-active' : ''}`}
              onClick={() => setCurrentTab('personal')}
            >
              My Page
            </button>
            <button
              type="button"
              className={`topbar-link ${currentTab === 'community' ? 'topbar-link-active' : ''}`}
              onClick={() => setCurrentTab('community')}
            >
              Community
            </button>
          </nav>
        </div>
        <div className="topbar-right">
          {user && <span className="topbar-user">Hi, {user.name}</span>}
          <button
            type="button"
            className="btn btn-outline small"
            onClick={() => {
              setToken("");
              setUser(null);
              setView("login");
            }}
          >
            Log out
          </button>
        </div>
      </header>

      <div className="construction-banner">
        <div className="construction-content">
          <span className="construction-icon">🚧</span>
          <h2 className="construction-title">Under Construction</h2>
          <p className="construction-message">
            We're working hard to bring you the best dog matching experience! 
            This demo showcases the frontend design. Full functionality coming soon.
          </p>
        </div>
      </div>

      <main className="dashboard">
        {currentTab === 'personal' ? (
          <>
            <section className="personal-page-full">
              <div className="personal-header">
                <div className="personal-header-left">
                  <div className="user-avatar">
                    {user?.name?.charAt(0).toUpperCase() || '👤'}
                  </div>
                  <div className="user-info">
                    <h1 className="user-name">{user?.name || 'My Page'}</h1>
                    <p className="user-subtitle">{myDogs.length} {myDogs.length === 1 ? 'dog' : 'dogs'} • {user?.city || 'Dog lover'}</p>
                  </div>
                </div>
                <div className="personal-header-right">
                  <button 
                    className="btn btn-primary"
                    onClick={() => setCurrentTab('community')}
                  >
                    📤 Post to Community
                  </button>
                </div>
              </div>

              <div className="personal-content">
                <div className="personal-sidebar">
                  <AddDog token={token} onDogCreated={handleDogCreated} />

                  <div className="panel small-panel">
                    <div className="panel-header">
                      <h2>Active Dog</h2>
                      <p>Select for matching</p>
                    </div>
                    {myDogs.length === 0 && (
                      <p className="empty-state">
                        Add your first dog above
                      </p>
                    )}
                    <div className="dog-list">
                      {myDogs.map(d => (
                        <label key={d._id} className="dog-radio">
                          <input
                            type="radio"
                            value={d._id}
                            checked={activeDogId === d._id}
                            onChange={() => setActiveDogId(d._id)}
                          />
                          <div className="dog-radio-body">
                            <span className="dog-radio-name">{d.name}</span>
                            <span className="dog-radio-sub">
                              {d.breed || "Unknown breed"}
                            </span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="personal-main">
                  <div className="panel">
                    <div className="panel-header">
                      <h2>🐾 My Dogs</h2>
                      <p>Your dog profiles and gallery</p>
                    </div>
                    {myDogs.length === 0 ? (
                      <div className="empty-state-large">
                        <div className="empty-icon">🐕</div>
                        <h3>No Dogs Yet</h3>
                        <p>Add your first pup using the form on the left!</p>
                      </div>
                    ) : (
                      <div className="dog-gallery">
                        {myDogs.map(dog => (
                          <div key={dog._id} className="dog-card">
                            {dog.images && dog.images[0] && (
                              <img
                                src={dog.images[0]}
                                alt={dog.name}
                                className="dog-card-img"
                                onError={(e) => {
                                  e.target.src = 'https://via.placeholder.com/300x200/8b7355/ffffff?text=🐕';
                                }}
                              />
                            )}
                            {(!dog.images || !dog.images[0]) && (
                              <div className="dog-card-placeholder">🐕</div>
                            )}
                            <div className="dog-card-body">
                              <h3 className="dog-card-name">{dog.name}</h3>
                              <p className="dog-card-breed">{dog.breed || 'Mixed breed'}</p>
                              <div className="dog-card-tags">
                                {dog.age && <span className="dog-tag">{dog.age} years</span>}
                                {dog.gender && <span className="dog-tag">{dog.gender}</span>}
                                {dog.energy && <span className="dog-tag">{dog.energy} energy</span>}
                              </div>
                              {dog.temperament && dog.temperament.length > 0 && (
                                <div className="dog-card-traits">
                                  {dog.temperament.slice(0, 3).map((trait, i) => (
                                    <span key={i} className="trait-badge">{trait}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {activeDogId && (
                    <>
                      <Discover token={token} activeDogId={activeDogId} />
                      <Matches activeDogId={activeDogId} />
                    </>
                  )}
                </div>
              </div>
            </section>
          </>
        ) : (
          <section className="community-full">
            <Community activeDogId={activeDogId} />
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
